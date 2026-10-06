"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const btr = require("../src/bilibili-btr.js");
const KiB = 1024, MiB = KiB * KiB;
const url = "https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/10/20/30/30-1-30080.m4s?deadline=2000000000&upsig=private-test-signature";
const config = (extra = "") => btr.parseArgument("enabled=true" + (extra ? "&" + extra : ""));
const request = (size = MiB, start = 1024) => ({ url, method: "GET", headers: {
  Range: `bytes=${start}-${start + size - 1}`, "User-Agent": "bili-overseas/91300300", Referer: "https://www.bilibili.com/"
} });
const data = (start, size) => Uint8Array.from({ length: size }, (_, i) => (start + i) % 251);
function response(options) {
  const range = btr.byteRange(options.headers.Range);
  return { status: 206, url: options.url, headers: {
    "Content-Type": "video/mp4", "Content-Length": String(range.length),
    "Content-Range": `bytes ${range.start}-${range.end}/${64 * MiB}`, ETag: '"same-representation"'
  }, body: data(range.start, range.length) };
}
function environment({ delay = 2, mutate, fault, store = new Map(), network = "test-network", nativeCancelable = true } = {}) {
  const calls = [], cancelCalls = [], live = new Set();
  let peak = 0;
  const services = {
    now: Date.now, network, read: key => store.get(key), write: (value, key) => { store.set(key, value); return true; },
    pause: async () => {}, cancellable: nativeCancelable,
    request(options, callback) {
      calls.push(options); live.add(options); peak = Math.max(peak, live.size);
      const timer = setTimeout(() => {
        live.delete(options);
        if (fault?.(options, calls)) { callback(new Error("synthetic connection failure")); return; }
        const reply = response(options); mutate?.(reply, options, calls);
        callback(null, reply);
      }, typeof delay === "function" ? delay(options) : delay);
      return nativeCancelable ? { cancel() { clearTimeout(timer); live.delete(options); cancelCalls.push(options); } } : null;
    }
  };
  return { services, calls, store, cancelCalls, live, peak: () => peak };
}

test("BTR is off by default and rejects ambiguous/unknown settings", () => {
  assert.equal(btr.parseArgument("").enabled, false);
  for (const argument of ["enabled=true&threads=32", "enabled=true&mode=arbitrary", "enabled=true&enabled=true", "enabled=yes", "enabled=true&evil=x"]) {
    assert.equal(btr.parseArgument(argument).enabled, false, argument);
  }
  assert.equal(config("maxThreads=99&maxMiB=99&budgetMs=99000").maxThreads, 8);
  assert.equal(config("maxThreads=99&maxMiB=99&budgetMs=99000").maxBytes, 8 * MiB);
});

test("request eligibility preserves conditional/authenticated/non-VOD and unsupported requests", () => {
  const cfg = config();
  for (const patch of [
    { method: "HEAD" }, { body: "data" },
    { url: url.replace("https:", "http:") }, { url: url.replace("cosov.bilivideo.com", "evil.example") },
    { url: url.replace("/upgcxcode/", "/live/") }, { url: url + "#fragment" },
    { url: url.replace("https://", "https://user@") }, { url: url.replace(".com/", ".com:4483/") },
  ]) assert.equal(btr.planRequest({ ...request(), ...patch }, cfg), null);
  for (const header of ["If-Range", "If-None-Match", "Authorization", "Cookie", "X-Token", "X-BiliBTR-Internal"]) {
    const req = request(); req.headers[header] = "test";
    assert.equal(btr.planRequest(req, cfg), null, header);
  }
  for (const range of ["bytes=0-", "bytes=-100", "bytes=0-1,4-8", "bytes=9-1", "bytes=0-9007199254740992", "bytes=0-100", `bytes=0-${9 * MiB}`]) {
    const req = request(); req.headers.Range = range;
    assert.equal(btr.planRequest(req, cfg), null, range);
  }
  const duplicate = request(); duplicate.headers.range = duplicate.headers.Range;
  assert.equal(btr.planRequest(duplicate, cfg), null);
  const host = request(); host.headers.Host = "another.bilivideo.com";
  assert.equal(btr.planRequest(host, cfg), null);
});

test("disabled/ineligible/missing-store paths issue no requests", async () => {
  let count = 0;
  const svc = { request() { count++; }, now: Date.now };
  assert.equal((await btr.accelerate(request(), btr.parseArgument(""), svc)).reason, "ineligible");
  assert.equal((await btr.accelerate(request(), config(), svc)).reason, "busy");
  assert.equal(count, 0);
});

test("concurrent chunks reassemble exact bytes, metadata, original query and retry headers", async () => {
  const env = environment({ delay: options => btr.byteRange(options.headers.Range).start % 3 + 3 });
  const req = request(2 * MiB, 900000), before = JSON.stringify(req);
  const result = await btr.accelerate(req, config("threads=4"), env.services);
  assert.equal(result.action, "respond");
  assert.ok(env.peak() >= 2 && env.peak() <= 4);
  assert.deepEqual(result.response.body, data(900000, 2 * MiB));
  assert.equal(result.response.status, 206);
  assert.equal(result.response.headers["Content-Range"], `bytes 900000-${900000 + 2 * MiB - 1}/${64 * MiB}`);
  assert.equal(result.response.headers["Content-Length"], String(2 * MiB));
  assert.equal(result.stats.downloadedBytes, 2 * MiB);
  assert.ok(env.calls.every(c => c.url === url && c.headers["Accept-Encoding"] === "identity"));
  assert.ok(env.calls.slice(1).every(c => c.headers["If-Range"] === '"same-representation"'));
  assert.equal(JSON.stringify(req), before);
  assert.equal(env.live.size, 0);
  assert.equal(env.store.get(btr.LEASE_KEY), "{}");
  assert.ok(![...env.store.values()].join("").includes("private-test-signature"));
});

test("dynamic concurrency tries a higher level, keeps improvement and rolls back no-gain trials", () => {
  const c = btr.controller(config(), {}, 1000);
  const wave = bytes => ({ bytes, elapsedMs: 200, saturated: true });
  c.observe(wave(256 * KiB), 1200);
  assert.equal(c.threads(), 2);
  c.observe(wave(256 * KiB), 1400);
  assert.equal(c.threads(), 3);
  assert.equal(c.snapshot().threads, 2, "unproven trial is not persisted");
  c.observe(wave(384 * KiB), 1600);
  assert.equal(c.threads(), 3);
  c.observe(wave(384 * KiB), 1800);
  assert.equal(c.threads(), 4);
  c.observe(wave(384 * KiB), 2000);
  assert.equal(c.threads(), 3);
  assert.ok(c.snapshot().cooldownUntil > 2000);
  c.observe({ failed: true, status: 429 }, 2200);
  assert.equal(c.threads(), 1);
});

test("unquoted CDN tags use strong Last-Modified dates in If-Range without fabricating an ETag", async () => {
  const modified = "Sat, 16 Nov 2024 11:36:23 GMT";
  const env = environment({ mutate(r) {
    r.headers.ETag = "a".repeat(32);
    r.headers["Last-Modified"] = modified;
    r.headers.Date = "Tue, 06 Oct 2026 03:39:11 GMT";
  } });
  const result = await btr.accelerate(request(), config(), env.services);
  assert.equal(result.action, "respond");
  assert.ok(env.calls.slice(1).every(c => c.headers["If-Range"] === modified));
  assert.equal(result.response.headers.ETag, undefined);
  assert.equal(result.response.headers["Last-Modified"], modified);
  assert.deepEqual(result.response.body, data(1024, MiB));
});

test("recent Last-Modified, invalid dates and changed opaque tags cannot validate stitched data", async () => {
  for (const recent of [true, false]) {
    const env = environment({ mutate(r) {
      r.headers.ETag = "a".repeat(32);
      r.headers["Last-Modified"] = recent ? "Tue, 06 Oct 2026 03:39:00 GMT" : "bad-date";
      r.headers.Date = "Tue, 06 Oct 2026 03:39:11 GMT";
    } });
    assert.equal((await btr.accelerate(request(), config(), env.services)).action, "pass");
  }
  const env = environment({ mutate(r, o, calls) {
    r.headers.ETag = (calls.length > 1 ? "b" : "a").repeat(32);
    r.headers["Last-Modified"] = "Sat, 16 Nov 2024 11:36:23 GMT";
    r.headers.Date = "Tue, 06 Oct 2026 03:39:11 GMT";
  } });
  assert.equal((await btr.accelerate(request(), config(), env.services)).reason, "object-changed");
});

test("short/idle samples do not increase concurrency and manual mode remains fixed", () => {
  const c = btr.controller(config(), {}, 1000);
  for (let i = 0; i < 8; i++) c.observe({ bytes: MiB, elapsedMs: 20, saturated: true }, 1000 + i);
  assert.equal(c.threads(), 2);
  const fixed = btr.controller(config("threads=4&maxThreads=3"), {}, 1000);
  fixed.observe({ failed: true, status: 429 }, 2000);
  assert.equal(fixed.threads(), 3);
  assert.equal(btr.controller(config("maxThreads=1"), {}, 1000).threads(), 1);
});

test("scheduler applies dynamic concurrency to actual asynchronous downloads", async () => {
  const env = environment({ delay: 90 });
  const result = await btr.accelerate(request(4 * MiB), config(), env.services);
  assert.equal(result.action, "respond");
  assert.ok(result.stats.threads.includes(3), JSON.stringify(result.stats));
  assert.ok(env.peak() >= 3 && env.peak() <= 8);
  assert.deepEqual(result.response.body, data(1024, 4 * MiB));
});

test("validated mirrors can carry chunks, never unverified candidate URLs", async () => {
  const env = environment({ mutate(reply, options) {
    if (options.url.includes("mirrorcos.bilivideo")) reply.body[0] ^= 1;
  } });
  const result = await btr.accelerate(request(2 * MiB), config("mode=mainland&threads=4"), env.services);
  assert.equal(result.action, "respond");
  assert.equal(result.stats.routes, 2);
  assert.deepEqual(result.response.body, data(1024, 2 * MiB));
  const incorrect = env.calls.filter(c => c.url.includes("mirrorcos.bilivideo"));
  assert.equal(incorrect.length, 2, "mismatched candidate receives probes only");
  assert.ok(env.calls.some(c => c.url.includes("mirrorali.bilivideo") && btr.byteRange(c.headers.Range).length > 64 * KiB));
});

test("each validated CDN uses its own strong validator; equal tags across origins are not required", async () => {
  const env = environment({ mutate(r, o) { if (o.url.includes("mirrorali.bilivideo")) r.headers.ETag = '"ali-version"'; } });
  const result = await btr.accelerate(request(2 * MiB), config("mode=mainland&threads=4"), env.services);
  assert.equal(result.action, "respond");
  assert.equal(result.stats.routes, 3);
  const aliData = env.calls.filter(c => c.url.includes("mirrorali.bilivideo") && btr.byteRange(c.headers.Range).length > 64 * KiB);
  assert.ok(aliData.length > 0);
  assert.ok(aliData.every(c => c.headers["If-Range"] === '"ali-version"'));
  assert.deepEqual(result.response.body, data(1024, 2 * MiB));
});

test("failed mirror verification is cooled down per signed object, avoiding repeated probes", async () => {
  const store = new Map();
  const env = environment({ store, mutate(r, o) { if (o.url !== url) r.status = 403; } });
  assert.equal((await btr.accelerate(request(), config("mode=mainland"), env.services)).action, "respond");
  const retry = environment({ store });
  const result = await btr.accelerate(request(MiB, MiB), config("mode=mainland"), retry.services);
  assert.equal(result.action, "respond");
  assert.ok(retry.calls.every(c => c.url === url));
});

for (const [name, change] of [
  ["HTTP 200", r => { r.status = 200; }],
  ["missing strong validator", r => { delete r.headers.ETag; }],
  ["weak validator", r => { r.headers.ETag = 'W/"version"'; }],
  ["wrong range", r => { r.headers["Content-Range"] = `bytes 0-65535/${64 * MiB}`; }],
  ["short body", r => { r.body = r.body.slice(1); }],
  ["wrong length header", r => { r.headers["Content-Length"] = "1"; }],
  ["compressed media", r => { r.headers["Content-Encoding"] = "gzip"; }],
  ["HTML response", r => { r.headers["Content-Type"] = "text/html"; }],
  ["redirect", r => { r.url += "&different-signature=1"; }],
  ["text transport", r => { r.body = "a".repeat(r.body.length); }],
  ["unknown file length", r => { r.headers["Content-Range"] = "bytes 1024-66559/*"; }],
]) test(`${name} fails open without injecting any partial body`, async () => {
  const env = environment({ mutate: change });
  const result = await btr.accelerate(request(), config(), env.services);
  assert.equal(result.action, "pass");
  assert.equal(result.response, undefined);
  assert.equal(env.calls.length, 1);
});

test("representation changing after the first block never mixes bytes", async () => {
  const env = environment({ mutate(r, o, calls) { if (calls.length > 1) r.headers.ETag = '"changed"'; } });
  const result = await btr.accelerate(request(), config(), env.services);
  assert.equal(result.action, "pass");
  assert.equal(result.reason, "object-changed");
  assert.equal(result.response, undefined);
  assert.equal(env.live.size, 0);
});

test("limited retry keeps successful blocks and reconstructs exact requested data", async () => {
  const failed = new Set();
  const env = environment({ fault(options) {
    const range = btr.byteRange(options.headers.Range);
    if (range.start > 1024 && !failed.size) { failed.add(range.start); return true; }
    return false;
  } });
  const result = await btr.accelerate(request(), config("threads=4"), env.services);
  assert.equal(result.action, "respond");
  assert.equal(result.stats.retries, 1);
  assert.deepEqual(result.response.body, data(1024, MiB));
});

test("429 respects Retry-After while other networks remain independent", async () => {
  const store = new Map();
  const env = environment({ store, mutate(r) { r.status = 429; r.headers["Retry-After"] = "600"; } });
  assert.equal((await btr.accelerate(request(), config(), env.services)).action, "pass");
  const state = JSON.parse(store.get(btr.STATE_KEY));
  assert.ok(Object.values(state)[0].blockedUntil > Date.now() + 590000);
  const same = environment({ store });
  assert.equal((await btr.accelerate(request(), config(), same.services)).reason, "backoff");
  assert.equal(same.calls.length, 0);
  const other = environment({ store, network: "different" });
  assert.equal((await btr.accelerate(request(), config(), other.services)).action, "respond");
});

test("expired adaptive evidence is ignored and stale lease can recover", async () => {
  const env = environment();
  env.store.set(btr.LEASE_KEY, JSON.stringify({ owner: "old", until: Date.now() - 1 }));
  assert.equal((await btr.accelerate(request(), config(), env.services)).action, "respond");
});

test("a refused signed address does not poison a fresh address on the same CDN", async () => {
  const store = new Map();
  const failed = environment({ store, mutate(r) { r.status = 403; } });
  assert.equal((await btr.accelerate(request(), config(), failed.services)).action, "pass");
  const fresh = environment({ store });
  assert.equal((await btr.accelerate(request(), config(), fresh.services)).reason, "backoff");
  const updated = { ...request(), url: url.replace("private-test-signature", "fresh-signature") };
  assert.equal((await btr.accelerate(updated, config(), fresh.services)).action, "respond");
  assert.ok(![...store.values()].join("").includes("signature"));
});

test("BTR media activity makes the existing background benchmark yield", async () => {
  const cdn = require("../src/bilibili-cdn.js");
  const env = environment();
  await btr.accelerate(request(), config(), env.services);
  assert.ok(Number(env.store.get("BiliCDN.uiActivity.v1")) > Date.now() - 1000);
  assert.equal(cdn.playbackRecentlyActive(env.services, "auto", Date.now()), true);
});

test("cooperative admission passes a second request through and ownership loss stops old work", async () => {
  const env = environment({ delay: 25 });
  const first = btr.accelerate(request(), config(), env.services);
  const second = await btr.accelerate(request(), config(), env.services);
  assert.equal(second.reason, "busy");
  env.store.set(btr.LEASE_KEY, JSON.stringify({ owner: "new-owner", until: Date.now() + 9000 }));
  assert.equal((await first).action, "pass");
  assert.equal(JSON.parse(env.store.get(btr.LEASE_KEY)).owner, "new-owner");
});

test("client cancellation closes pending jobs when the transport exposes cancellation", async () => {
  const env = environment({ delay: 40 }), cancel = new AbortController();
  const pending = btr.accelerate({ ...request(), signal: cancel.signal }, config(), env.services);
  setTimeout(() => cancel.abort(), 10);
  const result = await pending;
  assert.equal(result.action, "pass");
  assert.ok(env.cancelCalls.length > 0);
  assert.equal(env.live.size, 0);
  assert.equal(env.store.has(btr.STATE_KEY), false, "cancel is not node failure");
});

test("hard deadline bounds hanging callbacks and preserves a lease for uncancelable work", async () => {
  const env = environment({ delay: 100, nativeCancelable: false });
  const cfg = { ...config(), budgetMs: 40 };
  const result = await btr.accelerate(request(), cfg, env.services);
  assert.equal(result.action, "pass");
  assert.ok(JSON.parse(env.store.get(btr.LEASE_KEY)).until > Date.now());
  assert.equal(env.calls.length, 1, "no retry amplifies a still-active native request");
  await new Promise(resolve => setTimeout(resolve, 110));
  assert.equal(env.live.size, 0);
});

test("fresh Shadowrocket VM uses binary body, avoids recursion and completes exactly once", async () => {
  const env = environment(), completions = [];
  const source = fs.readFileSync(path.join(__dirname, "../src/bilibili-btr.js"), "utf8");
  const context = { Uint8Array, ArrayBuffer, setTimeout, clearTimeout, console,
    $request: request(), $argument: "enabled=true&threads=4", $persistentStore: {
      read: env.services.read, write: env.services.write }, $network: { wifi: { ssid: "private-ssid" } },
    $httpClient: { get(options, callback) {
      assert.equal(options["binary-mode"], true);
      assert.equal(options["auto-cookie"], false);
      assert.equal(options["auto-redirect"], false);
      assert.equal(btr.planRequest({ ...request(), headers: options.headers }, config()), null);
      const handle = env.services.request(options, (error, result) => callback(error, { ...result, statusCode: result.status }, result.body));
      return { abort: handle.cancel };
    } }, $done(result) { completions.push(result); } };
  vm.runInNewContext(source, context);
  for (let i = 0; i < 100 && !completions.length; i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(completions.length, 1);
  assert.equal(completions[0].response.status, 206);
  assert.deepEqual(completions[0].response.body, data(1024, MiB));
  assert.ok(![...env.store.values()].join("").includes("private-ssid"));
});

test("generated companion is opt-in, matches VOD only and keeps ordinary modules free of media MITM", () => {
  const dist = path.join(__dirname, "../dist");
  const module = fs.readFileSync(path.join(dist, "Bilibili.BTR.Experimental.sgmodule"), "utf8");
  assert.match(module, /启用加速:false/);
  assert.match(module, /enable=\{\{\{启用加速\}\}\}/);
  assert.match(module, /binary-body-mode=1/);
  assert.match(module, /type=http-request/);
  assert.doesNotMatch(module, /type=http-response/);
  const pattern = new RegExp(module.match(/pattern=(.*?),binary-body-mode=/)[1]);
  assert.equal(pattern.test(url), true);
  for (const bad of ["https://app.bilibili.com/x/v2/feed/index", url.replace("bilivideo.com", "bilivideo.com.evil.test"), url.replace("/upgcxcode/", "/live/")]) {
    assert.equal(pattern.test(bad), false);
  }
  for (const filename of ["Bilibili.CDN.Switcher.sgmodule", "Bilibili.CDN.Enhanced.sgmodule"]) {
    const text = fs.readFileSync(path.join(dist, filename), "utf8");
    assert.doesNotMatch(text, /bilibili-btr\.js|\*\.bilivideo\.com/);
  }
  const runtime = fs.readFileSync(path.join(dist, "bilibili-btr.js"), "utf8");
  assert.match(runtime, /Copyright \(c\) 2026 Bilibili-thread-ripper contributors/);
});
