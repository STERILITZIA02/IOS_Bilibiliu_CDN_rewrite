"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { gzipSync } = require("node:zlib");
const cdn = require("../src/bilibili-cdn.js");
const route = require("../src/bilibili-cdn-route.js");
const benchmark = require("../src/bilibili-cdn-benchmark.js");
const enhance = require("../src/bilibili-enhance.js");
const endpoints = require("../src/bilibili-endpoints.js");
const refresh = require("../src/bilibili-refresh.js");

// Synthetic protocol fixtures; these are not captures from either iOS app.
const now = Date.UTC(2026, 8, 11);
const primary = "upos-sz-mirrorcosov.bilivideo.com";
const akamai = "upos-hz-mirrorakam.akamaized.net";
const alternate = "upos-sz-mirrorali.bilivideo.com";
const url = (host) => `https://${host}/upgcxcode/11/22/333/video.m4s?deadline=1900000000&mid=42&oi=123&platform=iphone&upsig=${host}`;
const playback = (backups = [akamai]) => JSON.stringify({ code: 0, data: { dash: {
  video: [{ base_url: url(primary), backup_url: backups.map(url), bandwidth: 1800000, id: 80, codecid: 7 }],
} } });

function environment(state) {
  const storage = state ? { [cdn.HOST_AUTO_STATE_KEY]: JSON.stringify(state) } : {};
  return { storage, services: {
    now: () => now, persistent: true,
    read: (key) => storage[key] || null,
    write(value, key) { storage[key] = value; return true; },
    probe() { assert.fail("playback must not probe"); },
  } };
}

function record(state, host, { startup = 900, sustained = 24000, ttfb = 350, at = now - 1000 } = {}) {
  for (const object of ["a", "b"]) {
    for (const phase of ["startup", "sustained"]) {
      cdn.recordHostSample(state, "auto", host, {
        at, bucket: "normal-video", objectId: cdn.stableHash("o", object),
        ok: true, phase, status: 206, elapsedMs: 400, ttfbMs: ttfb,
        throughputKbps: phase === "startup" ? startup : sustained,
      }, at);
    }
  }
}

function process(body, env) {
  return new Promise((resolve) => cdn.processSafeAutoResponse(body, false, cdn.parseArgument(""), env.services, resolve));
}

test("high RTT startup samples do not disqualify a CDN with enough sustained throughput", () => {
  const state = cdn.createEmptyHostAutoState();
  record(state, alternate);
  const descriptor = { kind: "video", requiredKbps: 2500 };
  assert.equal(cdn.selectStableHost(state, { networkProfile: "auto" }, descriptor, now), alternate);
  record(state, alternate, { sustained: 1000 });
  assert.equal(cdn.selectStableHost(state, { networkProfile: "auto" }, descriptor, now), "");
});

test("cold Akamai fallback respects a known open circuit and insufficient throughput", async () => {
  for (const failure of ["circuit", "slow"]) {
    const state = cdn.createEmptyHostAutoState();
    record(state, akamai, { startup: 24000, sustained: failure === "slow" ? 1000 : 24000 });
    if (failure === "circuit") state.profiles.auto.hosts[akamai].openUntil = now + 60000;
    const result = await process(playback(), environment(state));
    assert.equal(JSON.parse(result.body).data.dash.video[0].base_url, url(primary), failure);
    assert.equal(result.probeCount, 0);
    assert.equal(result.routesStored, 0);
  }
});

test("CDN ranking skips an unavailable Akamai URL and selects the next usable candidate", async () => {
  const state = cdn.createEmptyHostAutoState();
  record(state, akamai, { startup: 24000, ttfb: 10 });
  record(state, alternate, { startup: 24000, ttfb: 100 });
  const result = await process(playback([alternate]), environment(state));
  assert.equal(JSON.parse(result.body).data.dash.video[0].base_url, url(alternate));
  assert.equal(result.reason, "host-auto-selected");
});

test("old sustained samples cannot be refreshed by a new startup sample alone", () => {
  const state = cdn.createEmptyHostAutoState();
  record(state, alternate, { startup: 24000, at: now - 7 * 3600000 });
  cdn.recordHostSample(state, "auto", alternate, {
    at: now, bucket: "normal-video", objectId: cdn.stableHash("o", "c"),
    ok: true, phase: "startup", status: 206, elapsedMs: 40, ttfbMs: 20, throughputKbps: 24000,
  }, now);
  assert.equal(cdn.selectStableHost(state, {}, { kind: "video", requiredKbps: 2500 }, now), "");
});

test("cached media routing honors a circuit opened after the playback response", async () => {
  const env = environment();
  await process(playback(), env);
  assert.equal(route.selectMediaRequest(url(primary), "GET", {}, "", env.services).changed, true);
  const state = cdn.createEmptyHostAutoState();
  record(state, akamai, { startup: 24000 });
  state.profiles.auto.hosts[akamai].openUntil = now + 60000;
  env.storage[cdn.HOST_AUTO_STATE_KEY] = JSON.stringify(state);
  const result = route.selectMediaRequest(url(primary), "GET", {}, "", env.services);
  assert.equal(result.changed, false);
  assert.equal(result.reason, "target-circuit-open");
});

test("a new server-primary decision revokes the old cached redirect for the same object", async () => {
  const env = environment();
  await process(playback(), env);
  const state = cdn.createEmptyHostAutoState();
  record(state, akamai, { startup: 24000, sustained: 1000 });
  env.storage[cdn.HOST_AUTO_STATE_KEY] = JSON.stringify(state);
  await process(playback(), env);
  assert.equal(route.selectMediaRequest(url(primary), "GET", {}, "", env.services).changed, false);
  assert.deepEqual(JSON.parse(env.storage[cdn.MEDIA_ROUTE_STATE_KEY]).entries, {});
});

test("background benchmark falls back to the server primary when the reference CDN fails", async () => {
  const env = environment();
  const probes = [];
  env.services.fetchPlayInfo = (_sample, done) => done(null, playback());
  env.services.probe = (candidate, _timeout, done) => {
    probes.push(candidate);
    if (candidate.hostname === akamai) return done({ status: 403, elapsedMs: 40 });
    const { start, end } = candidate.probeRange;
    const length = end - start + 1;
    done({ status: 206, url: candidate.url, body: Buffer.alloc(length, 3), elapsedMs: 60, ttfbMs: 30,
      headers: { "Content-Range": `bytes ${start}-${end}/9999999`, "Content-Length": String(length), "Content-Type": "video/mp4" },
    });
  };
  const result = await new Promise((resolve) => benchmark.runBenchmark({ ...benchmark.parseArgument(""), candidates: [alternate] }, env.services, resolve));
  assert.equal(result.reason, "completed");
  assert.equal(probes[0].hostname, akamai);
  assert.equal(probes[1].hostname, primary);
  assert.equal(probes.filter((item) => item.hostname === akamai).length, 1);
  assert.ok(probes.some((item) => item.hostname === alternate && item.phase === "sustained"));
  assert.ok(result.elapsedBudgetMs <= 45000);
});

test("reference fallback remains bounded when both reference hosts fail", async () => {
  const env = environment();
  let probes = 0;
  env.services.fetchPlayInfo = (_sample, done) => done(null, playback());
  env.services.probe = (_candidate, _timeout, done) => {
    probes += 1;
    done({ status: 403, elapsedMs: 100 });
  };
  const result = await new Promise((resolve) => benchmark.runBenchmark(benchmark.parseArgument(""), env.services, resolve));
  assert.equal(result.reason, "reference-prefix-failed");
  assert.equal(probes, 2);
});

test("an internal-range failure restarts reference validation against the server primary", async () => {
  const env = environment();
  const calls = [];
  env.services.fetchPlayInfo = (_sample, done) => done(null, playback());
  env.services.probe = (candidate, _timeout, done) => {
    calls.push(`${candidate.hostname}:${candidate.phase}`);
    if (candidate.hostname === akamai && candidate.phase === "sustained") {
      return done({ status: 503, elapsedMs: 100 });
    }
    const { start, end } = candidate.probeRange;
    done({ url: candidate.url, status: 206, body: Buffer.alloc(end - start + 1, 3), elapsedMs: 100,
      headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/9999999` },
    });
  };
  const result = await new Promise((resolve) => benchmark.runBenchmark({ ...benchmark.parseArgument(""), candidates: [alternate] }, env.services, resolve));
  assert.equal(result.reason, "completed");
  assert.ok(calls.indexOf(`${primary}:startup`) > calls.indexOf(`${akamai}:sustained`));
  assert.ok(calls.includes(`${primary}:sustained`));
});

function feedRuntime(argument = {}, method = "GET") {
  let calls = 0;
  let completion;
  let doneCalls = 0;
  const body = JSON.stringify({ code: 0, data: { items: [
    { goto: "av", aid: 42, title: "ordinary video" }, { card_type: "cm_v2", ad_info: { creative_id: 7 } },
  ] } });
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../dist/bilibili-enhance.js"), "utf8"), {
    $argument: JSON.stringify(argument),
    $request: { method, url: "https://app.bilibili.com/x/v2/feed/index?build=91100100", headers: {} },
    $response: { status: 200, body, headers: { "Content-Type": "application/json" } },
    $httpClient: { get(_request, done) { calls += 1; done(null, { status: 200 }, body); } },
    $done(value) { completion = value; doneCalls += 1; }, console: { log() {} }, Uint8Array, ArrayBuffer,
  });
  return { body, calls, completion, doneCalls };
}

test("home feed returns existing filtered videos immediately by default, with refill opt-in", () => {
  const fast = feedRuntime();
  assert.equal(fast.calls, 0);
  assert.equal(fast.doneCalls, 1);
  assert.equal(JSON.parse(fast.completion.body).data.items.length, 1);
  const refill = feedRuntime({ homeFeedRefill: true });
  assert.equal(refill.calls, 1);
  assert.equal(refill.doneCalls, 1);
});

test("refill never runs with ads disabled or for non-GET requests", () => {
  assert.equal(feedRuntime({ ads: false, homeFeedRefill: true }).calls, 0);
  assert.equal(feedRuntime({ homeFeedRefill: true }, "POST").calls, 0);
});

test("6.5 semantic-version UA keeps engine 1 success while legacy white app stays compatible", () => {
  const frame = new Uint8Array([0, 0, 0, 0, 0]);
  for (const ua of ["bili-inter/6.5.0", "bili-inter/6.3.0", "bili-inter/7.0.0"]) {
    const headers = enhance.normalizeGrpcResponseHeaders({ "grpc-status": "0" }, frame, {
      "User-Agent": ua, "x-bili-moss-engine-type": "1",
    });
    assert.equal(headers["grpc-status"], "0", ua);
  }
  const legacy = enhance.normalizeGrpcResponseHeaders({ "grpc-status": "0" }, frame, {
    "User-Agent": "bili-inter/3.20.1", "x-bili-moss-engine-type": "1",
  });
  assert.equal(legacy["grpc-status"], undefined);
});

test("9.11 and overseas 6.5 gzip runtimes keep translation fields, signatures, and success headers", async () => {
  const join = (...values) => cdn.concatBytes(values);
  const field = (id, payload) => join(cdn.encodeVarint(id * 8 + 2), cdn.encodeVarint(payload.length), payload);
  const text = (id, value) => field(id, new Uint8Array(Buffer.from(value)));
  const opaque = text(100, "translation/subtitles/opaque-signature");
  for (const [file, method, payload] of [
    ["bilibili-cdn.js", "bilibili.app.playerunite.v1.Player/PlayViewUnite", join(field(9, text(2, "promotion")), opaque)],
    ["bilibili-enhance.js", "bilibili.app.viewunite.v1.View/View", join(text(7, "commercial"), opaque)],
  ]) {
    for (const ua of ["bilibili/9.11.0", "bili-inter/6.5.0"]) {
      const compressed = new Uint8Array(gzipSync(payload));
      const input = join(new Uint8Array([1, compressed.length >>> 24, compressed.length >>> 16 & 255,
        compressed.length >>> 8 & 255, compressed.length & 255]), compressed);
      let finish;
      let calls = 0;
      const completion = new Promise((resolve) => { finish = resolve; });
      vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../dist", file), "utf8"), {
        $argument: '{"cdn":"off","ads":true}',
        $request: { url: `https://grpc.biliapi.net/${method}`, headers: { "User-Agent": ua, "x-bili-moss-engine-type": "1" } },
        $response: { status: 200, bodyBytes: input, headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip", "grpc-status": "0" } },
        $done(value) { calls += 1; finish(value); },
        $httpClient: { get() { assert.fail("no network expected"); } },
        Uint8Array, Uint16Array, Uint32Array, Int32Array, ArrayBuffer, Promise, console: { log() {} },
      });
      const result = await completion;
      assert.equal(calls, 1);
      assert.equal(result.headers["grpc-status"], "0", `${file}: ${ua}`);
      assert.equal(result.headers["grpc-encoding"], undefined);
      assert.ok(Buffer.from(result.body).includes(Buffer.from(opaque)));
      assert.doesNotMatch(Buffer.from(result.body).toString(), /promotion|commercial/);
    }
  }
});

test("PGC channel removes commercial banner items but preserves episodes, tips, and cursors", () => {
  const endpoint = "https://api.bilibili.com/pgc/page/channel";
  const ordinary = { title: "广告相关动画", url: "https://www.bilibili.com/bangumi/play/ss42" };
  const promotion = { title: "活动", url: "https://www.bilibili.com/blackboard/era/promotion.html" };
  const input = { code: 0, data: { next: "cursor", modules: [
    { type: "BANNER", module_data: { items: [ordinary, promotion] } },
    { type: "BANNER", module_data: { items: [promotion] } },
    { type: "TIP", text: "字幕设置说明" },
    { type: "EPISODES", module_data: { items: [ordinary] } },
  ] } };
  assert.equal(endpoints.classify(endpoint)?.handler, "pgc-channel");
  assert.equal(refresh.guardRequest(endpoint, {}).transport, "json");
  const result = enhance.transformJsonText(JSON.stringify(input), endpoint, enhance.parseArgument(""));
  const output = JSON.parse(result.body);
  assert.equal(output.data.next, "cursor");
  assert.equal(output.data.modules.length, 3);
  assert.deepEqual(output.data.modules[0].module_data.items, [ordinary]);
  assert.deepEqual(output.data.modules[1], input.data.modules[2]);
  assert.deepEqual(output.data.modules[2], input.data.modules[3]);
  assert.equal(enhance.transformJsonText(JSON.stringify(input), endpoint, enhance.parseArgument("ads=false")).changed, 0);
  input.data.modules = [input.data.modules[0]];
  const mixedOnly = enhance.transformJsonText(JSON.stringify(input), endpoint, enhance.parseArgument(""));
  assert.ok(mixedOnly.changed > 0);
  assert.deepEqual(JSON.parse(mixedOnly.body).data.modules[0].module_data.items, [ordinary]);
});

test("JSON API error payloads are preserved even when they contain recognizable ad containers", () => {
  const input = JSON.stringify({ code: -101, message: "login required", data: { cm: { id: 42 } } });
  const result = enhance.transformJsonText(input, "https://app.bilibili.com/x/v2/view", enhance.parseArgument(""));
  assert.equal(result.body, input);
  assert.equal(result.reason, "api-error-response");
});
