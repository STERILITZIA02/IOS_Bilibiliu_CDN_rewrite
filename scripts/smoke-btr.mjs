// Optional anonymous real-network check. Not part of offline CI or proof of iOS acceptance.
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const btr = require("../src/bilibili-btr.js");
const mode = process.argv.includes("--mode=mainland") ? "mainland" : process.argv.includes("--mode=overseas") ? "overseas" : "original";
const baseHeaders = { Referer: "https://www.bilibili.com/", "User-Agent": "Mozilla/5.0" };
const play = await fetch("https://api.bilibili.com/x/player/playurl?bvid=BV1xx411c7mD&cid=62131&fnval=16&qn=80", {
  headers: baseHeaders, signal: AbortSignal.timeout(8000)
});
if (!play.ok) throw new Error(`Anonymous play API HTTP ${play.status}`);
const payload = await play.json();
const media = payload.data?.dash?.video?.[0];
const url = media?.baseUrl || media?.base_url;
if (!btr.mediaUrl(url)) throw new Error("No supported anonymous media URL");
const range = "bytes=1048576-3145727";
async function getBytes(url, headers, signal, maxBytes) {
  const result = await fetch(url, { headers, signal, redirect: "manual" });
  const metadata = { status: result.status, url: result.url, headers: Object.fromEntries(result.headers) };
  if (result.status !== 206) { await result.body?.cancel(); return { ...metadata, body: new Uint8Array() }; }
  const buffer = new Uint8Array(maxBytes), reader = result.body.getReader();
  let offset = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (offset + value.length > maxBytes) throw new Error("Response exceeded requested byte budget");
      buffer.set(value, offset); offset += value.length;
    }
  } finally { await reader.cancel(); reader.releaseLock(); }
  return { ...metadata, body: buffer.subarray(0, offset) };
}
const begin = performance.now();
const baseline = await getBytes(url, { ...baseHeaders, Range: range, "Accept-Encoding": "identity" }, AbortSignal.timeout(10000), 2 * 1024 * 1024);
const baselineMs = Math.round(performance.now() - begin);
if (baseline.status !== 206 || baseline.body.length !== 2 * 1024 * 1024) throw new Error(`Baseline failed: HTTP ${baseline.status}`);
const store = new Map();
const services = { now: Date.now, network: "anonymous-smoke", cancellable: true,
  read: key => store.get(key), write: (value, key) => { store.set(key, value); return true; },
  request(options, callback) {
    const controller = new AbortController();
    getBytes(options.url, options.headers, controller.signal, options.maxBytes)
      .then(response => callback(null, response), () => callback(new Error("request failed")));
    return { cancel: () => controller.abort() };
  }
};
const result = await btr.accelerate({ url, method: "GET", headers: { ...baseHeaders, Range: range } },
  btr.parseArgument(`enabled=true&threads=auto&budgetMs=15000&mode=${mode}`), services);
const digest = body => createHash("sha256").update(body).digest("hex");
const same = result.action === "respond" && digest(result.response.body) === digest(baseline.body);
console.log(JSON.stringify({ host: new URL(url).hostname, mode, action: result.action, reason: result.reason,
  baselineMs, byteIdentical: same, stats: result.stats,
  strongEtagPresent: /^"[^\"]+"$/.test(baseline.headers.etag || ""),
  validatorShape: { etagQuoted: /^"[^\"]+"$/.test(baseline.headers.etag || ""), etagLength: (baseline.headers.etag || "").length,
    date: baseline.headers.date, lastModified: baseline.headers["last-modified"] },
  note: "Anonymous desktop network check; no claim of iOS compatibility or general speedup." }, null, 2));
if (!same) process.exitCode = 1;
