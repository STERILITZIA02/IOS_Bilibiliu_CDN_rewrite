import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cdn = require("../src/bilibili-cdn.js");

const playUrl =
  "https://api.bilibili.com/x/player/playurl" +
  "?bvid=BV1xx411c7mD&cid=62131&fnval=16&qn=80";
const headers = {
  Referer: "https://www.bilibili.com/",
  "User-Agent": "Mozilla/5.0",
};

const response = await fetch(playUrl, { headers });
if (!response.ok) {
  throw new Error(`Bilibili play API returned HTTP ${response.status}`);
}
const payload = await response.json();
const sampleUrl = cdn.findFirstJsonVodUrl(JSON.stringify(payload));
if (!sampleUrl) {
  throw new Error("Bilibili play API returned no recognized VOD URL");
}

const storage = new Map();
const services = {
  benchmark(host, url, timeoutMs, callback) {
    const started = performance.now();
    fetch(url, {
      headers,
      method: "HEAD",
      signal: AbortSignal.timeout(timeoutMs),
    })
      .then((result) => {
        callback({
          elapsedMs: performance.now() - started,
          ok: result.ok,
          status: result.status,
        });
      })
      .catch(() => {
        callback({
          elapsedMs: timeoutMs,
          ok: false,
          status: 0,
        });
      });
  },
  now: Date.now,
  persistent: true,
  read(key) {
    return storage.get(key) || null;
  },
  write(value, key) {
    storage.set(key, value);
    return true;
  },
};
const config = cdn.parseArgument(
  JSON.stringify({
    cdn: "auto",
    intervalHours: 12,
    switchThreshold: 20,
  }),
);

const selection = await new Promise((resolve) => {
  cdn.selectAutoCdn(sampleUrl, config, services, resolve);
});

console.table(
  selection.results.map(({ host, status, elapsedMs, ok }) => ({
    host,
    status,
    milliseconds: elapsedMs,
    reachable: ok,
  })),
);
console.log(`Selected: ${selection.host} (${selection.reason})`);

if (!selection.host || selection.results.every((result) => !result.ok)) {
  throw new Error("Automatic CDN smoke test found no reachable candidate");
}
