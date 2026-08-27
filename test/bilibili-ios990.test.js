"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { gzipSync } = require("node:zlib");
const enhance = require("../src/bilibili-enhance.js");
const endpoints = require("../src/bilibili-endpoints.js");
const refresh = require("../src/bilibili-refresh.js");
const gzip = require("../src/bilibili-gzip.js");

const root = path.resolve(__dirname, "..");
const grpcRoot = "https://grpc.biliapi.net";
const join = (...parts) => enhance.concatBytes(parts);
const scalar = (field, value) => join(enhance.encodeVarint(field * 8), enhance.encodeVarint(value));
const message = (field, value) => join(enhance.encodeVarint(field * 8 + 2), enhance.encodeVarint(value.length), value);
const string = (field, value) => message(field, new Uint8Array(Buffer.from(value)));
const frame = (payload, flag = 0) => join(new Uint8Array([
  flag, payload.length >>> 24, payload.length >>> 16 & 255,
  payload.length >>> 8 & 255, payload.length & 255,
]), payload);
const children = (bytes, number) => enhance.parseProtoFields(bytes)
  .filter((field) => field.fieldNumber === number && field.wireType === 2)
  .map((field) => bytes.slice(field.payloadStart, field.payloadEnd));
const text = (bytes) => Buffer.from(bytes).toString("utf8");

async function runRuntime(filename, request, response, argument = { ads: true, debug: true, cdn: "off" }) {
  let finish;
  const done = new Promise((resolve) => { finish = resolve; });
  const state = { calls: 0, probes: 0, logs: [] };
  vm.runInNewContext(fs.readFileSync(path.join(root, "dist", filename), "utf8"), {
    $argument: JSON.stringify(argument), $request: request, $response: response,
    $done(value) { state.calls += 1; finish(value); },
    $httpClient: { get() { state.probes += 1; throw new Error("unexpected hot path network"); } },
    Uint8Array, Uint16Array, Uint32Array, Int32Array, ArrayBuffer, Promise,
    console: { log(value) { state.logs.push(value); } },
  });
  state.completion = await done;
  return state;
}

// Wire-equivalent fixtures, not device captures. Field provenance is documented
// in docs/V3_11_AUDIT.md; deliberately opaque fields must survive byte-for-byte.
function dynamicFixture() {
  const ordinary = join(scalar(1, 2),
    message(3, message(4, string(3, "广告 闲鱼 推广 商品 魔力赏是普通标题"))),
    message(3, message(5, message(2, string(1, "ordinary-video")))),
    message(3, message(18, string(4, "普通推荐：广告和商品相关讨论"))),
    string(6, "opaque-report"));
  const goods = message(3, join(scalar(1, 8), message(8,
    join(scalar(1, 2), message(3, string(1, "creator-goods"))))));
  const nativeAd = join(scalar(1, 2), message(3,
    message(14, message(1, string(2, "native-commercial")))));
  const unknown = message(3, message(100, new Uint8Array([255, 0, 255])));
  const commercialRecommendation = message(3, message(18, join(
    string(4, "commercial-recommendation-CTA"), message(6, string(2, "commercial-payload")),
  )));
  return {
    ordinary,
    goods,
    nativeAd,
    unknown,
    body: frame(message(1, join(
      message(1, join(ordinary, goods, commercialRecommendation, unknown)),
      message(1, nativeAd),
      message(1, join(scalar(1, 15), string(6, "old-ad"))),
      scalar(2, 3), string(3, "cursor-kept"), string(4, "baseline-kept"), scalar(5, 1),
    ))),
  };
}

test("9.9 generated PlayerUnite has one response owner, never the request-only guard", () => {
  const moduleText = fs.readFileSync(path.join(root, "dist/Bilibili.CDN.Enhanced.sgmodule"), "utf8");
  for (const host of ["grpc.biliapi.net", "grpc.bilibili.com", "app.bilibili.com", "app.biliapi.net"]) {
    const url = `https://${host}/bilibili.app.playerunite.v1.Player/PlayViewUnite`;
    const matches = moduleText.split("\n").filter((line) => {
      const pattern = line.match(/type=http-response,pattern=(.*?),requires-body=/);
      return pattern && new RegExp(pattern[1]).test(url);
    });
    assert.equal(matches.length, 1, `${host}: ${matches.map((line) => line.split(" =")[0])}`);
    assert.match(matches[0], /^Bilibili CDN gRPC/);
  }
});

test("9.9 reviewed Dynamic and DmView methods have precise response and request coverage", () => {
  const methods = [
    ["bilibili.app.dynamic.v2.Dynamic/DynVideo", "grpc-dynamic-video"],
    ["bilibili.app.dynamic.v2.Dynamic/DynAllPersonal", "grpc-dynamic-personal"],
    ["bilibili.app.dynamic.v2.Dynamic/DynVideoPersonal", "grpc-dynamic-personal"],
    ["bilibili.community.service.dm.v1.DM/DmView", "grpc-dm-view"],
  ];
  for (const [method, handler] of methods) {
    for (const host of ["grpc.biliapi.net", "grpc.bilibili.com", "app.bilibili.com", "app.biliapi.net"]) {
      const url = `https://${host}/${method}`;
      assert.equal(endpoints.classify(url, { responseFilter: true })?.handler, handler);
      assert.equal(refresh.guardRequest(url, {}).transport, "grpc");
      assert.equal(endpoints.classify(url, { runtime: "cdn" }), null);
      assert.equal(endpoints.classify(url + "Extra", { responseFilter: true })?.handler === handler, false);
    }
  }
  assert.equal(refresh.isVolatileMetadataUrl(`${grpcRoot}/bilibili.community.service.dm.v1.DM/DmSegMobile`), false);
});

test("9.9 DynAll and DynVideo remove native ad modules and creator goods, retaining pagination and videos", () => {
  const fixture = dynamicFixture();
  for (const method of ["DynAll", "DynVideo"]) {
    const result = enhance.transformGrpcBody(fixture.body, `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/${method}`);
    assert.equal(result.valid, true);
    const list = children(result.body.slice(5), 1)[0];
    const cards = children(list, 1);
    assert.equal(cards.length, 1);
    assert.deepEqual(cards[0], join(fixture.ordinary, fixture.unknown));
    assert.equal(text(children(list, 3)[0]), "cursor-kept");
    assert.equal(text(children(list, 4)[0]), "baseline-kept");
    assert.doesNotMatch(text(result.body), /creator-goods|native-commercial|old-ad/);
    const disabled = enhance.transformGrpcBody(fixture.body, `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/${method}`, enhance.parseArgument('{"ads":false}'));
    assert.deepEqual(disabled.body, fixture.body);
  }
});

test("9.9 asynchronous ViewUnite removes whole merchandise modules and preserves unknown modules", () => {
  const goods = join(scalar(1, 55), string(199, "opaque-merchandise-fixture"));
  const normal = join(scalar(1, 28), message(22, message(1,
    join(scalar(1, 1), message(2, string(1, "ordinary-relate"))))));
  const unknown = join(scalar(1, 190), message(199, new Uint8Array([255, 255])));
  const fixture = frame(message(2, join(message(1, goods), message(1, normal), message(1, unknown))));
  const result = enhance.transformGrpcBody(fixture, `${grpcRoot}/bilibili.app.viewunite.v1.View/AIRelateAsync`);
  assert.equal(result.valid, true);
  const asyncModule = children(result.body.slice(5), 2)[0];
  assert.deepEqual(children(asyncModule, 1), [normal, unknown]);
});

test("9.9 DmView filters timed commercial commands without deleting subtitles, masks, or ordinary commands", () => {
  const ordinary = join(string(4, "#UP#"), string(9, '{"icon":"normal-icon"}'));
  const ad = join(string(4, "#UP#"), string(9, '{"mini_program":{"id":"fixture"},"show_time":30}'));
  const goods = join(string(4, "#LINK#"), string(9, '{"goods":{"item_id":"fixture"}}'));
  const preserved = join(scalar(1, 0),
    message(2, join(scalar(1, 123456), scalar(2, 1), string(5, "https://example.invalid/mask"))),
    message(3, join(string(1, "zh-CN"), string(2, "中文"), message(3,
      join(scalar(1, 1), string(3, "zh-CN"), string(5, "https://example.invalid/subtitle"))))),
    message(25, string(99, "qoe-keep")), string(90, "unknown-keep"));
  const input = frame(join(preserved, message(22, join(message(1, ordinary), message(1, ad), message(1, goods))), string(18, "activity-meta")));
  const result = enhance.transformGrpcBody(input, `${grpcRoot}/bilibili.community.service.dm.v1.DM/DmView`);
  assert.equal(result.valid, true);
  assert.deepEqual(result.body, frame(join(preserved, message(22, message(1, ordinary)))));
});

test("9.9 empty goods placeholders do not turn an ordinary CommandDm into an ad", () => {
  for (const goods of [null, {}, [], false]) {
    const command = join(string(4, "#UP#"), string(9, JSON.stringify({ goods, icon: "normal", title: "广告 商品只是文字" })));
    const input = frame(message(22, message(1, command)));
    const result = enhance.transformGrpcBody(input, `${grpcRoot}/bilibili.community.service.dm.v1.DM/DmView`);
    assert.deepEqual(result.body, input);
    assert.equal(result.changed, 0);
  }
});

test("9.9 new overseas moss engine keeps a valid gRPC status even when User-Agent branding changes", () => {
  const body = frame(message(1, string(1, "ordinary")));
  const success = enhance.normalizeGrpcResponseHeaders(
    { "Content-Type": "application/grpc", "grpc-status": "0" }, body,
    { "User-Agent": "bilibili/9.9.0", "X-Bili-Moss-Engine-Type": "1" },
  );
  assert.equal(success["grpc-status"], "0");
  const error = enhance.normalizeGrpcResponseHeaders(
    { "Content-Type": "application/grpc", "grpc-status": "16", "grpc-message": "unauthenticated" }, body,
    { "User-Agent": "bili-universal/90900100", "x-bili-moss-engine-type": "1" },
  );
  assert.equal(error["grpc-status"], "16");
  assert.equal(error["grpc-message"], "unauthenticated");
  for (const engine of [undefined, "1"]) {
    const legacy = enhance.normalizeGrpcResponseHeaders(
      { "Content-Type": "application/grpc", "grpc-status": "0" }, body,
      { "User-Agent": "bili-inter/fixture", "x-bili-moss-engine-type": engine },
    );
    assert.equal(legacy["grpc-status"], undefined, "preserve the reviewed legacy white-client exception");
  }
});

test("9.9 generated gzip filter works in JSC without browser streams or native ungzip", async () => {
  const payload = dynamicFixture().body.slice(5);
  const source = fs.readFileSync(path.join(root, "dist/bilibili-enhance.js"), "utf8");
  let finish;
  const done = new Promise((resolve) => { finish = resolve; });
  let calls = 0;
  vm.runInNewContext(source, {
    $argument: '{"ads":true}',
    $request: { url: `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/DynAll`, headers: { "x-bili-moss-engine-type": "1" } },
    $response: { bodyBytes: frame(new Uint8Array(gzipSync(payload)), 1), headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip" } },
    $done(value) { calls += 1; finish(value); },
    Uint8Array, Uint16Array, Uint32Array, Int32Array, ArrayBuffer, Promise,
    console: { log() {} },
  });
  const completion = await done;
  assert.ok(completion.body, "JSC must filter gzip instead of silently passing through");
  assert.doesNotMatch(text(completion.body), /native-commercial|creator-goods/);
  assert.equal(completion.headers["grpc-encoding"], undefined);
  assert.equal(calls, 1);
});

test("9.9 JSON Dynamics removes explicit promotions and goods without touching video, prose, or cursors", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "test/fixtures/bilibili-9.9.0/ios990-dynamic-goods.json")));
  const url = "https://api.biliapi.net/x/polymer/web-dynamic/v1/feed/all?type=video&offset=CURSOR_FIXTURE";
  const result = enhance.transformJsonText(JSON.stringify(fixture), url);
  assert.equal(result.valid, true);
  const output = JSON.parse(result.body);
  assert.deepEqual(output.data.items.map((item) => item.id_str), ["1001", "1003"]);
  assert.equal(output.data.items[0].modules.module_dynamic.additional, null);
  assert.deepEqual(output.data.items[0].ad_info, {});
  assert.deepEqual(output.data.items[0].business_info, {});
  assert.deepEqual(output.data.items[0].modules.module_dynamic.major, fixture.data.items[0].modules.module_dynamic.major);
  assert.deepEqual(output.data.items[1], fixture.data.items[2]);
  assert.equal(output.data.offset, fixture.data.offset);
  assert.equal(output.data.update_baseline, fixture.data.update_baseline);
  assert.equal(output.data.has_more, true);
  assert.equal(refresh.isVolatileMetadataUrl(url), true);
});

test("9.9 JSON View merchandise enum is scoped to modules, with no ordinary title filtering", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "test/fixtures/bilibili-9.9.0/ios990-view-merchandise.json")));
  const result = enhance.transformJsonText(JSON.stringify(fixture), "https://app.bilibili.com/x/v2/view");
  const output = JSON.parse(result.body);
  assert.deepEqual(output.data.modules, [fixture.data.modules[2]]);
  assert.equal(output.data.title, fixture.data.title);
  assert.deepEqual(output.data.relates, fixture.data.relates);
});

test("9.9 bounded gzip supports stored/fixed/dynamic blocks and rejects corrupt or excessive output", () => {
  const plain = Buffer.from("ordinary protobuf payload ".repeat(5000));
  for (const options of [{ level: 0 }, { strategy: 4 }, { level: 9 }]) {
    assert.deepEqual(Buffer.from(gzip.ungzip(gzipSync(plain, options), 4194304)), plain);
  }
  const source = gzipSync(plain);
  const crcError = new Uint8Array(source);
  crcError[crcError.length - 8] ^= 1;
  assert.throws(() => gzip.ungzip(crcError, 4194304), /checksum/);
  const shortSize = new Uint8Array(source);
  shortSize.fill(0, shortSize.length - 4);
  assert.throws(() => gzip.ungzip(shortSize, 4194304), /too large/);
  assert.throws(() => gzip.ungzip(source.subarray(0, source.length - 3), 4194304));
  assert.throws(() => gzip.ungzip(join(source, source), 4194304));
  assert.throws(() => gzip.ungzip(gzipSync(Buffer.alloc(4194305)), 4194304), /too large/);
  assert.throws(() => gzip.ungzip(source, 16), /too large/);
});

test("9.9 generated response matchers have one owner for every exact registry endpoint", () => {
  const scripts = fs.readFileSync(path.join(root, "dist/Bilibili.CDN.Enhanced.sgmodule"), "utf8")
    .split("\n").map((line) => {
      const match = line.match(/type=http-response,pattern=(.*?),requires-body=/);
      return match ? new RegExp(match[1]) : null;
    }).filter(Boolean);
  for (const entry of endpoints.REGISTRY.filter((entry) => entry.path)) {
    for (const host of entry.hosts) {
      const url = `https://${host}${entry.path}`;
      assert.equal(scripts.filter((pattern) => pattern.test(url)).length, 1, url);
    }
  }
});

test("9.9 generated PlayerUnite pipeline blocks the banner and delayed popup while keeping signed media intact", async () => {
  const media = message(1, message(5, message(2, join(
    string(1, "https://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/11/22/99001/99001-1-100023.m4s?upsig=SIGNED_FIXTURE"),
    scalar(3, 1000000), scalar(4, 7),
  ))));
  const viewInfo = message(9, join(
    message(1, join(string(1, "commercial"), message(2,
      join(message(3, string(1, "delayed-commercial-dialog")), scalar(9, 5))))),
    message(2, message(1, string(1, "under-player-miniapp"))),
    message(3, message(5, string(1, "commercial-countdown"))),
    message(90, new Uint8Array([255, 0, 255])),
  ));
  const input = frame(join(media, viewInfo));
  const url = `${grpcRoot}/bilibili.app.playerunite.v1.Player/PlayViewUnite`;
  const result = await runRuntime("bilibili-cdn.js", { url, headers: { "x-bili-moss-engine-type": "1" } }, {
    bodyBytes: frame(new Uint8Array(gzipSync(input.slice(5))), 1),
    headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip", ETag: '"stale"' },
  }, { ads: true, debug: true, cdn: "auto" });
  assert.deepEqual(result.completion.body, frame(join(media, message(9, message(90, new Uint8Array([255, 0, 255]))))));
  assert.equal(result.calls, 1);
  assert.equal(result.probes, 0);
  assert.equal(result.completion.headers["grpc-encoding"], undefined);
  assert.equal(result.completion.headers["grpc-status"], "0");
  assert.match(result.logs.join("\n"), /handler=player-unite-ui.*changed=3.*writeBack=body/);
  const cdnOnly = await runRuntime("bilibili-cdn.js", { url, headers: {} }, { body: input, headers: {} }, { cdn: "off" });
  assert.equal(cdnOnly.completion.body, undefined);
  assert.equal(cdnOnly.completion.headers, undefined);
  assert.equal(cdnOnly.calls, 1);
});

test("9.9 cold, refresh, and long-resume requests use the same Dynamic body filter and cache guards", async () => {
  const input = dynamicFixture().body;
  let first;
  for (const method of ["DynAll", "DynVideo"]) {
    for (const stage of ["cold", "refresh", "resume-30s", "resume-5m", "resume-30m"]) {
      const url = `https://app.biliapi.net/bilibili.app.dynamic.v2.Dynamic/${method}`;
      const request = { url, method: "POST", body: "signed-request-fixture", headers: {
        "User-Agent": "bilibili/9.9.0", "X-Bili-Moss-Engine-Type": "1",
        "If-None-Match": '"unfiltered"', "IF-MODIFIED-SINCE": "yesterday", "If-Range": '"old"',
        Authorization: "Bearer PRIVATE_FIXTURE", "grpc-accept-encoding": "br",
      } };
      const original = JSON.stringify(request);
      const guarded = refresh.guardRequest(url, request.headers);
      assert.equal(JSON.stringify(request), original, stage);
      assert.equal(guarded.removedValidators, 3);
      assert.equal(guarded.headers["grpc-accept-encoding"], "gzip,identity");
      const runtime = await runRuntime("bilibili-enhance.js", { ...request, headers: guarded.headers }, {
        statusCode: 200, bodyBytes: frame(new Uint8Array(gzipSync(input.slice(5))), 1),
        headers: { "Content-Type": "application/grpc+proto", "grpc-encoding": "gzip", ETag: '"raw"', Age: "60", Expires: "tomorrow" },
      });
      first ||= runtime.completion.body;
      assert.deepEqual(runtime.completion.body, first, stage);
      assert.equal(runtime.completion.headers["grpc-status"], "0");
      assert.equal(runtime.completion.headers.ETag, undefined);
      assert.equal(runtime.completion.headers.Age, undefined);
      assert.match(runtime.completion.headers["Cache-Control"], /no-store/);
      assert.equal(runtime.calls, 1);
      assert.equal(runtime.probes, 0);
      assert.doesNotMatch(runtime.logs.join("\n"), /PRIVATE_FIXTURE|signed-request-fixture|普通标题|cursor-kept/);
      assert.match(runtime.logs.join("\n"), /gzipCodec=bundled writeBack=body/);
    }
  }
});

test("9.9 runtime preserves RPC/HTTP errors, success trailers, and unchanged gzip encodings", async () => {
  for (const [file, method] of [
    ["bilibili-enhance.js", "bilibili.app.dynamic.v2.Dynamic/DynAll"],
    ["bilibili-cdn.js", "bilibili.app.playerunite.v1.Player/PlayViewUnite"],
  ]) {
    for (const extra of [
      { headers: { "grpc-status": "16", "grpc-message": "unauthenticated" } },
      { statusCode: 503, headers: {} },
      { h2_trailers: { "grpc-status": "7" }, headers: {} },
    ]) {
      const response = { bodyBytes: dynamicFixture().body, ...extra,
        headers: { "Content-Type": "application/grpc", ...extra.headers } };
      const state = await runRuntime(file, { url: `${grpcRoot}/${method}`, headers: { "x-bili-moss-engine-type": "1" } }, response);
      assert.equal(state.completion.body, undefined);
      assert.notEqual(state.completion.headers?.["grpc-status"], "0");
      if (extra.headers["grpc-status"]) assert.equal(state.completion.headers["grpc-status"], "16");
      if (extra.h2_trailers) assert.deepEqual(state.completion.h2_trailers, extra.h2_trailers);
      assert.equal(state.calls, 1);
    }
    const body = frame(new Uint8Array(gzipSync(string(100, "ordinary-unknown-field"))), 1);
    const unchanged = await runRuntime(file, { url: `${grpcRoot}/${method}`, headers: { "x-bili-moss-engine-type": "1" } }, {
      bodyBytes: body, h2_trailers: { "grpc-status": "0" },
      headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip", ETag: '"raw"' },
    });
    assert.equal(unchanged.completion.body, undefined);
    assert.equal(unchanged.completion.headers["grpc-encoding"], "gzip");
    assert.deepEqual(unchanged.completion.h2_trailers, { "grpc-status": "0" });
    assert.match(unchanged.completion.headers["Cache-Control"], /no-store/);
    assert.equal(unchanged.calls, 1);
  }
});

test("9.9 all frames share the decompression budget, with no partially filtered result on overflow", async () => {
  const payload = join(message(1, message(1, scalar(1, 15))), string(100, "x".repeat(2200000)));
  const compressed = frame(new Uint8Array(gzipSync(payload)), 1);
  const input = join(compressed, compressed);
  const result = await enhance.transformGrpcBodyAsync(input, `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/DynAll`, undefined,
    { responseHeaders: { "grpc-encoding": "gzip" } });
  assert.equal(result.valid, false);
  assert.equal(result.changed, 0);
  assert.equal(result.reason, "grpc-size-limit");
  assert.deepEqual(result.body, input);
});

test("9.9 personal Dynamic replies use their direct list layout and retain offsets and normal additions", () => {
  const fixture = dynamicFixture();
  const vote = message(3, message(8, join(scalar(1, 3), message(8, string(1, "vote-keep")))));
  const pgc = message(3, message(8, join(scalar(1, 1), message(2, string(1, "pgc-keep")))));
  const input = frame(join(message(1, join(fixture.ordinary, fixture.goods, vote, pgc)), message(1, fixture.nativeAd),
    string(2, "personal-offset"), scalar(3, 1), string(4, "personal-read-offset"), message(5, scalar(1, 1))));
  for (const method of ["DynAllPersonal", "DynVideoPersonal"]) {
    const result = enhance.transformGrpcBody(input, `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/${method}`);
    assert.deepEqual(children(result.body.slice(5), 1), [join(fixture.ordinary, vote, pgc)]);
    assert.equal(text(children(result.body.slice(5), 2)[0]), "personal-offset");
    assert.equal(text(children(result.body.slice(5), 4)[0]), "personal-read-offset");
  }
});

test("9.9 an all-merchandise asynchronous module leaves no empty wrapper", () => {
  const input = frame(message(2, message(1, scalar(1, 55))));
  const result = enhance.transformGrpcBody(input, `${grpcRoot}/bilibili.app.viewunite.v1.View/AIRelateAsync`);
  assert.equal(result.valid, true);
  assert.deepEqual(result.body, frame(new Uint8Array()));
});

test("9.9 malformed or unsupported gzip is not partially written or cached", async () => {
  for (const body of [new Uint8Array([1, 0, 0, 0, 99]), frame(new Uint8Array([31, 139, 8]), 1)]) {
    const result = await runRuntime("bilibili-enhance.js", {
      url: `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/DynAll`, headers: { "x-bili-moss-engine-type": "1" },
    }, { bodyBytes: body, headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip", ETag: '"stale"' } });
    assert.equal(result.completion.body, undefined);
    assert.equal(result.completion.headers["grpc-encoding"], "gzip");
    assert.notEqual(result.completion.headers["grpc-status"], "0");
    assert.equal(result.completion.headers.ETag, undefined);
    assert.match(result.completion.headers["Cache-Control"], /no-store/);
    assert.equal(result.calls, 1);
  }
});

test("9.9 mixed gzip and identity frames keep order and untouched bytes after filter writes", async () => {
  const ordinaryCompressed = frame(new Uint8Array(gzipSync(string(100, "ordinary-unchanged"))), 1);
  const fixture = dynamicFixture();
  const input = join(ordinaryCompressed, fixture.body, frame(new Uint8Array(gzipSync(fixture.body.slice(5))), 1));
  const expectedFiltered = enhance.transformGrpcBody(fixture.body, `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/DynAll`).body;
  const result = await runRuntime("bilibili-enhance.js", {
    url: `${grpcRoot}/bilibili.app.dynamic.v2.Dynamic/DynAll`, headers: {},
  }, { bodyBytes: input, headers: { "Content-Type": "application/grpc", "grpc-encoding": "gzip", "Content-Encoding": "gzip", "Content-Length": "999" } });
  assert.deepEqual(result.completion.body, join(ordinaryCompressed, expectedFiltered, expectedFiltered));
  assert.equal(result.completion.headers["grpc-encoding"], "gzip", "the untouched compressed frame still needs gzip metadata");
  assert.equal(result.completion.headers["Content-Encoding"], undefined);
  assert.equal(result.completion.headers["Content-Length"], undefined);
  assert.equal(result.calls, 1);
});
