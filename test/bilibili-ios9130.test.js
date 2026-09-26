"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { gzipSync } = require("node:zlib");
const cdn = require("../src/bilibili-cdn.js");
const enhance = require("../src/bilibili-enhance.js");
const registry = require("../src/bilibili-endpoints.js");
const refresh = require("../src/bilibili-refresh.js");
const benchmark = require("../src/bilibili-cdn-benchmark.js");
const app = "https://app.bilibili.com";
const fallback = "https://app.biliapi.com";
const join = (...values) => cdn.concatBytes(values);
const scalar = (n, value) => join(cdn.encodeVarint(n * 8), cdn.encodeVarint(value));
const message = (n, value) => join(cdn.encodeVarint(n * 8 + 2), cdn.encodeVarint(value.length), value);
const string = (n, value) => message(n, new Uint8Array(Buffer.from(value)));
const frame = (payload, flag = 0) => join(new Uint8Array([flag, payload.length >>> 24,
  payload.length >>> 16 & 255, payload.length >>> 8 & 255, payload.length & 255]), payload);
const header = (headers, key) => Object.entries(headers || {}).find(([name]) => name.toLowerCase() === key)?.[1];

async function runtime(file, url, response, argument = {}, requestHeaders = {}) {
  let finish;
  const completed = new Promise(resolve => { finish = resolve; });
  const state = { calls: 0, requests: 0, writes: [], logs: [] };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../dist", file), "utf8"), {
    $argument: JSON.stringify({ cdn: "off", ads: true, ui: true, ...argument }),
    $request: { url, method: url.includes("/bilibili.") ? "POST" : "GET", headers: requestHeaders }, $response: response,
    $done(value) { state.calls += 1; finish(value); },
    $httpClient: { get() { state.requests += 1; assert.fail("unexpected foreground request"); } },
    $persistentStore: { read() { return null; }, write(value, key) { state.writes.push({ value, key }); return true; } },
    Uint8Array, Uint16Array, Uint32Array, Int32Array, ArrayBuffer, Promise,
    console: { log(value) { state.logs.push(value); } },
  });
  state.completion = await completed;
  assert.equal(state.calls, 1);
  assert.equal(state.requests, 0);
  return state;
}

const feed = { code: 0, data: { items: [
  { goto: "av", aid: 42, title: "正常视频" }, { ad_info: { id: 3 }, card_type: "cm_v2", card_goto: "ad_av" },
] } };
const primary = "https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/1/2/video.m4s?token=original";
const backup = "https://upos-hz-mirrorakam.akamaized.net/upgcxcode/1/2/video.m4s?token=backup";
const play = { code: 0, data: { dash: { video: [{ base_url: primary, backup_url: [backup], bandwidth: 1800000 }] } } };
const story = { code: 0, data: { items: [{ card_goto: "vertical_av", aid: 42,
  player_args: play.data }, { card_goto: "vertical_ad_av", ad_info: { id: 3 } }] } };

test("all JSON response owners clear stale compression and body validators after a rewrite", async () => {
  for (const [file, url, body, argument] of [
    ["bilibili-enhance.js", app + "/x/v2/feed/index", feed, {}],
    ["bilibili-story.js", app + "/x/v2/feed/index/story", story, { enhanceStory: true }],
    ["bilibili-cdn.js", app + "/x/v2/playurl", play, { cdn: "upos-hz-mirrorakam.akamaized.net" }],
    ["bilibili-story-cdn.js", app + "/x/v2/feed/index/story", story, { cdn: "upos-hz-mirrorakam.akamaized.net" }],
  ]) {
    const result = await runtime(file, url, { status: 200, body: JSON.stringify(body), headers: {
      "Content-Type": "application/json", "CONTENT-ENCODING": "gzip", "Content-Length": "99",
      ETag: '"original"', "Content-MD5": "original-digest", "X-Request-ID": "kept",
    } }, argument);
    assert.ok(result.completion.body, file);
    for (const name of ["content-encoding", "content-length", "etag", "content-md5"]) {
      assert.equal(header(result.completion.headers, name), undefined, `${file}: ${name}`);
    }
    assert.equal(header(result.completion.headers, "x-request-id"), "kept");
  }
});

test("unchanged compressed JSON retains its encoding and its original body", async () => {
  const result = await runtime("bilibili-enhance.js", app + "/x/v2/feed/index", {
    status: 200, body: JSON.stringify({ code: 0, data: { items: [] } }),
    headers: { "Content-Encoding": "gzip", "Content-Type": "application/json" },
  });
  assert.equal(result.completion.body, undefined);
  assert.equal(header(result.completion.headers, "content-encoding"), "gzip");
});

test("HTTP errors and partial responses never turn into filtered or synthetic successes", async () => {
  for (const status of ["HTTP/1.1 503 Service Unavailable", 304, 206]) {
    for (const [file, url, body, argument] of [
      ["bilibili-enhance.js", app + "/x/v2/splash/list", { code: 0, data: { show: [{ id: 2 }] } }, {}],
      ["bilibili-story.js", app + "/x/v2/feed/index/story", story, { enhanceStory: true }],
      ["bilibili-cdn.js", app + "/x/v2/playurl", play, { cdn: "upos-hz-mirrorakam.akamaized.net" }],
      ["bilibili-story-cdn.js", app + "/x/v2/feed/index/story", story, { cdn: "upos-hz-mirrorakam.akamaized.net" }],
    ]) {
      const { completion } = await runtime(file, url, { status, body: JSON.stringify(body), headers: { "Content-Type": "application/json", "Retry-After": "60" } }, argument);
      assert.deepEqual(JSON.parse(JSON.stringify(completion)), {}, `${file}: ${status}`);
    }
  }
});

test("diagnostic-only APIs and unknown RPCs are absent from interception and pass without reading the body", async () => {
  const urls = [app + "/x/v2/account/myinfo", app + "/bilibili.app.mine.v1.Mine/DeviceFeature",
    app + "/bilibili.app.resource.v1.Module/List", app + "/bilibili.app.home.v99.Home/Subscribe"];
  for (const url of urls) {
    assert.equal(registry.classify(url, { responseFilter: true }), null, url);
    assert.equal(refresh.guardRequest(url, { "If-None-Match": '"keep"' }).changed, false, url);
    const response = { headers: {} };
    Object.defineProperty(response, "body", { get() { assert.fail("diagnostic body must not be read"); } });
    const { completion } = await runtime("bilibili-enhance.js", url, response);
    assert.deepEqual(JSON.parse(JSON.stringify(completion)), {});
  }
});

test("disabled features preserve headers, bodies and compression negotiation", async () => {
  const config = { ads: false, ui: false, searchPromotions: false, liveShopping: false, vipPromotions: false };
  for (const url of [app + "/x/v2/feed/index", app + "/x/resource/show/tab/v2", app + "/bilibili.app.viewunite.v1.View/View"]) {
    const headers = { "If-None-Match": '"keep"', "grpc-accept-encoding": "identity" };
    assert.equal(refresh.guardRequest(url, headers, config).changed, false);
    const { completion } = await runtime("bilibili-enhance.js", url, { headers: {}, body: JSON.stringify(feed) }, config);
    assert.deepEqual(JSON.parse(JSON.stringify(completion)), {});
  }
});

test("fallback app.biliapi.com filters splash, home ads and navigation for both supplied versions", async () => {
  const navigation = { code: 0, data: { top: [{ name: "游戏中心", uri: "bilibili://game_center/" }, { name: "消息", uri: "bilibili://link/im_home" }],
    bottom: [{ name: "首页", pos: 1 }, { name: "发布", uri: "bilibili://uper/user_center/add_archive", pos: 2 }, { name: "我的", pos: 3 }] } };
  // Prefixes/builds observed in the supplied transport log; bodies are synthetic.
  for (const ua of ["bili-universal/91300100", "bili-overseas/91300300"]) {
    for (const [endpoint, input, verify] of [
      ["/x/v2/splash/list", { code: 0, data: { show: [{ id: 2 }], list: [{ id: 3 }] } }, output => assert.equal(output.data.show.length, 0)],
      ["/x/v2/feed/index", feed, output => assert.equal(output.data.items.length, 1)],
      ["/x/resource/show/tab/v2", navigation, output => { assert.deepEqual(output.data.top.map(x => x.name), ["消息"]); assert.deepEqual(output.data.bottom.map(x => x.name), ["首页", "我的"]); }],
    ]) {
      assert.ok(registry.classify(fallback + endpoint, { responseFilter: true }));
      assert.equal(refresh.guardRequest(fallback + endpoint, {}).changed, true);
      const { completion } = await runtime("bilibili-enhance.js", fallback + endpoint, { status: 200, body: JSON.stringify(input), headers: { "Content-Type": "application/json" } }, {}, { "User-Agent": ua });
      verify(JSON.parse(completion.body));
    }
  }
});

test("actual 9.13/6.6 UA prefixes preserve gzip gRPC success and normal payloads across fresh VMs", async () => {
  const ordinary = join(scalar(1, 42), string(7, "av"), string(3, "普通视频"));
  const commercial = join(scalar(1, 7), string(7, "av"), message(28, string(1, "ad")));
  const payload = join(message(1, ordinary), message(1, commercial), string(100, "unknown"));
  const input = frame(new Uint8Array(gzipSync(payload)), 1);
  for (const ua of ["bili-universal/91300100", "bili-overseas/91300300"]) {
    for (const stage of ["cold", "refresh", "resume"]) {
      const { completion } = await runtime("bilibili-enhance.js", app + "/bilibili.app.view.v1.View/PlayerRelates", {
        bodyBytes: input, headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip", "grpc-status": "0" },
      }, {}, { "User-Agent": ua, "x-bili-moss-engine-type": "1" });
      assert.deepEqual(completion.body, frame(join(message(1, ordinary), string(100, "unknown"))), stage);
      assert.equal(header(completion.headers, "grpc-status"), "0");
      assert.equal(header(completion.headers, "grpc-encoding"), undefined);
    }
  }
});

test("business-error playurl payloads remain byte-identical in fixed and automatic modes", () => {
  const input = JSON.stringify({ ...play, code: -10403, message: "server error" });
  assert.equal(cdn.transformJsonText(input, cdn.parseArgument("cdn=upos-hz-mirrorakam.akamaized.net")).body, input);
  const prepared = cdn.prepareSafeJson(input, { ...cdn.parseArgument(""), hostAutoState: cdn.createEmptyHostAutoState() }, cdn.createEmptyAutoState(), Date.now());
  assert.equal(prepared.body, input);
  assert.equal(prepared.descriptors.length, 0);
});

test("BOM-prefixed UTF-8 responses still remove known ads", () => {
  const result = enhance.transformJsonText("\ufeff" + JSON.stringify(feed), app + "/x/v2/feed/index", enhance.parseArgument(""));
  assert.equal(result.valid, true);
  assert.equal(JSON.parse(result.body).data.items.length, 1);
});

test("PlayerRelates uses its reviewed list field and preserves normal cards and paging", () => {
  const normal = join(scalar(1, 42), string(7, "av"), string(3, "商品测评是普通标题"));
  const ad = join(scalar(1, 7), string(7, "av"), message(28, string(1, "ad")));
  const paging = string(99, "opaque-pagination");
  const body = frame(join(message(1, normal), message(1, ad), paging));
  const url = fallback + "/bilibili.app.view.v1.View/PlayerRelates";
  const result = enhance.transformGrpcBody(body, url, enhance.parseArgument(""));
  assert.ok(result.changed > 0);
  assert.deepEqual(result.body, frame(join(message(1, normal), paging)));
});

test("PlayerUnite removes only explicitly typed ad fragments and retains OGV/media bytes", async () => {
  const ad = message(1, join(message(1, scalar(3, 1)), string(7, "advertisement")));
  const ogv = message(1, join(message(1, scalar(3, 2)), string(7, "ogv-media-signed-url")));
  const unknown = message(1, join(message(1, scalar(3, 99)), string(7, "future-fragment")));
  const payload = join(message(10, join(ad, ogv, unknown, string(55, "timeline"))), string(100, "opaque-vod"));
  const gzip = new Uint8Array(gzipSync(payload));
  const { completion } = await runtime("bilibili-cdn.js", fallback + "/bilibili.app.playerunite.v1.Player/PlayViewUnite", {
    bodyBytes: frame(gzip, 1), headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip", "grpc-status": "0" },
  }, { ads: true }, { "User-Agent": "bili-universal/9.13.0", "x-bili-moss-engine-type": "1" });
  assert.deepEqual(completion.body, frame(join(message(10, join(ogv, unknown, string(55, "timeline"))), string(100, "opaque-vod"))));
  assert.equal(header(completion.headers, "grpc-status"), "0");
});

test("comment editor removes known commercial buttons without touching emoji, input or unknown fields", () => {
  const emoji = message(1, join(scalar(1, 1), string(2, "表情")));
  const goods = message(1, join(scalar(1, 5), string(2, "商品")));
  const unknown = message(1, join(scalar(1, 99), string(2, "未来按钮")));
  const body = frame(message(2, join(message(7, join(emoji, goods, unknown)), string(100, "input-placeholder"))));
  const result = enhance.transformGrpcBody(body, fallback + "/bilibili.main.community.reply.v2.Reply/SubjectDescription", enhance.parseArgument(""));
  assert.deepEqual(result.body, frame(message(2, join(message(7, join(emoji, unknown)), string(100, "input-placeholder")))));
});

test("an empty splash response clears the reviewed display timer but preserves identity and unknown fields", () => {
  const input = { code: 0, data: { show: [{ id: 1 }], list: [{ id: 2 }], max_time: 5,
    min_interval: 60, splash_request_id: "synthetic-request", future: { keep: true } } };
  const result = enhance.transformJsonText(JSON.stringify(input), app + "/x/v2/splash/list", enhance.parseArgument(""));
  const output = JSON.parse(result.body).data;
  assert.equal(output.max_time, 0);
  assert.equal(output.min_interval, 60);
  assert.equal(output.splash_request_id, "synthetic-request");
  assert.deepEqual(output.future, { keep: true });
  assert.deepEqual(output.show, []);
});

test("startup activity is private, throttled, and stops an in-flight benchmark before its next probe", async () => {
  const now = Date.UTC(2026, 8, 26);
  const storage = {};
  const store = { read: key => storage[key] || null, write(value, key) { storage[key] = value; return true; } };
  assert.equal(refresh.recordUiActivity(app + "/x/v2/feed/index?private=not-stored", {}, store, now), true);
  assert.deepEqual(storage, { [cdn.UI_ACTIVITY_KEY]: String(now) });
  assert.equal(refresh.recordUiActivity(app + "/x/resource/show/tab/v2", {}, store, now + 100), false);
  assert.equal(refresh.recordUiActivity(app + "/x/vip/ads/material/report", {}, store, now + 30001), false);
  assert.equal(cdn.playbackRecentlyActive(store, "other_network", now + 100), true);
  assert.equal(cdn.playbackRecentlyActive(store, "auto", now + 180000), false);
  delete storage[cdn.UI_ACTIVITY_KEY];
  let probes = 0;
  const result = await new Promise(resolve => benchmark.runBenchmark(benchmark.parseArgument(""), {
    ...store, now: () => now,
    fetchPlayInfo(_sample, done) { done(null, play); },
    probe(candidate, _timeout, done) {
      probes += 1;
      storage[cdn.UI_ACTIVITY_KEY] = String(now);
      const { start, end } = candidate.probeRange;
      done({ status: 206, url: candidate.url, body: Buffer.alloc(end - start + 1, 2), elapsedMs: 100,
        headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/9999999` } });
    },
  }, resolve));
  assert.equal(result.reason, "playback-active");
  assert.equal(probes, 1);
});

test("generated fallback-host matchers have one response owner and exclude unknown RPC paths", () => {
  const source = fs.readFileSync(path.join(__dirname, "../dist/Bilibili.CDN.Enhanced.sgmodule"), "utf8");
  const patterns = source.split("\n").filter(line => line.includes("type=http-response"))
    .map(line => new RegExp(line.match(/,pattern=(.*?),requires-body=/)[1]));
  assert.match(source, /hostname = .*app\.biliapi\.com/);
  for (const endpoint of ["/x/resource/show/tab/v2", "/x/v2/splash/list", "/x/v2/feed/index",
    "/bilibili.app.view.v1.View/PlayerRelates", "/bilibili.app.playerunite.v1.Player/PlayViewUnite",
    "/bilibili.main.community.reply.v2.Reply/SubjectDescription"]) {
    assert.equal(patterns.filter(pattern => pattern.test(fallback + endpoint)).length, 1, endpoint);
    assert.equal(patterns.filter(pattern => pattern.test(fallback + endpoint + "Unexpected")).length, 0, endpoint);
  }
  assert.equal(patterns.filter(pattern => pattern.test(fallback + "/bilibili.app.home.v99.Home/Subscribe")).length, 0);
});
