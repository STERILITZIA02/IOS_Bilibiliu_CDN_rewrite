import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cdn = require("../src/bilibili-cdn.js");

const playUrl =
  "https://api.bilibili.com/x/player/playurl" +
  "?bvid=BV1xx411c7mD&cid=62131&fnval=16&qn=80";
const requestHeaders = {
  Referer: "https://www.bilibili.com/",
  "User-Agent": "Mozilla/5.0",
};

const response = await fetch(playUrl, { headers: requestHeaders });
if (!response.ok) {
  throw new Error(`Bilibili play API returned HTTP ${response.status}`);
}
const payload = await response.json();
const input = JSON.stringify(payload);
const config = cdn.parseArgument(
  JSON.stringify({
    cdn: "auto",
    intervalHours: 12,
    networkProfile: "smoke",
    probeMode: "blocking",
    switchThreshold: 20,
  }),
);
const discovered = cdn.prepareSafeJson(
  input,
  config,
  cdn.createEmptyAutoState(),
  Date.now(),
);
if (!discovered.valid || discovered.descriptors.length === 0) {
  throw new Error("Bilibili play API returned no safe-auto media descriptors");
}

const storage = new Map();
const probeResults = [];
const services = {
  now: Date.now,
  persistent: true,
  probe(candidate, timeoutMs, callback) {
    const started = performance.now();
    fetch(candidate.url, {
      headers: {
        ...requestHeaders,
        "Accept-Encoding": "identity",
        Range: `bytes=0-${cdn.AUTO_RANGE_END}`,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    })
      .then(async (result) => {
        const raw = {
          body: new Uint8Array(await result.arrayBuffer()),
          elapsedMs: performance.now() - started,
          error: false,
          headers: Object.fromEntries(result.headers.entries()),
          status: result.status,
          url: result.url,
        };
        const validation = cdn.validateProbeResponse(raw, candidate.url);
        probeResults.push({
          bodyLength: validation.bodyLength || 0,
          elapsedMs: Math.round(raw.elapsedMs),
          host: new URL(candidate.url).hostname,
          ok: validation.ok,
          reason: validation.reason,
          status: raw.status,
          totalLength: validation.totalLength || 0,
        });
        callback(raw);
      })
      .catch(() => {
        const raw = {
          body: new Uint8Array(),
          elapsedMs: timeoutMs,
          error: true,
          headers: {},
          status: 0,
          url: "",
        };
        probeResults.push({
          elapsedMs: timeoutMs,
          host: new URL(candidate.url).hostname,
          ok: false,
          reason: "request-error",
          status: 0,
        });
        callback(raw);
      });
  },
  read(key) {
    return storage.get(key) || null;
  },
  write(value, key) {
    storage.set(key, value);
    return true;
  },
};

const outcome = await new Promise((resolve) => {
  cdn.processSafeAutoResponse(input, false, config, services, resolve);
});

console.table(probeResults);
console.log(
  `Safe-auto outcome: ${outcome.reason}; descriptors=${outcome.descriptors}`,
);

if (probeResults.length !== 2 || probeResults.some((result) => !result.ok)) {
  throw new Error("Strict Range validation did not pass for both candidates");
}
if (outcome.reason === "object-mismatch") {
  throw new Error("Primary and backup samples did not prove the same object");
}
if (outcome.changed !== 0) {
  throw new Error("A newly learned result changed the current response");
}
if (!storage.has(cdn.AUTO_STATE_KEY)) {
  throw new Error("Safe-auto state was not persisted");
}
