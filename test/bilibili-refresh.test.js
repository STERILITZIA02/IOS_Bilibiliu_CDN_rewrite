"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const refresh = require("../src/bilibili-refresh.js");

function shadowrocketRuntimeSource(filename) {
  return [
    fs.readFileSync(
      path.join(__dirname, "..", "src", "bilibili-endpoints.js"),
      "utf8",
    ),
    fs.readFileSync(path.join(__dirname, "..", "src", filename), "utf8"),
  ].join("\n");
}

test("cache guard is exact to reviewed volatile Bilibili metadata", () => {
  for (const url of [
    "https://app.bilibili.com/x/v2/feed/index?device=phone",
    "https://app.biliapi.net/x/v2/feed/index/story?pull=1",
    "https://app.biliapi.net/x/v2/feed/index/story/cart?pull=1",
    "https://app.bilibili.com/x/v2/feed/index/relate/story?aid=1",
    "https://app.bilibili.com/x/v2/splash/list",
    "https://app.biliapi.net/x/v2/splash/show",
    "https://app.bilibili.com/x/v2/splash/event/list2",
    "https://app.biliapi.net/x/v2/splash/brand/list",
    "https://app.bilibili.com/x/v2/view",
    "https://app.biliapi.net/x/v2/search?keyword=x",
    "https://app.bilibili.com/x/v2/search/type?type=0",
    "https://app.bilibili.com/x/v2/account/mine?build=9400000",
    "https://app.biliapi.net/x/v2/account/mine/ipad",
    "https://app.bilibili.com/x/v2/account/myinfo",
    "https://api.bilibili.com/x/vip/ads/materials",
    "https://api.biliapi.net/x/vip/ads/material/report",
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/ViewProgress",
    "https://grpc.bilibili.com/bilibili.app.view.v1.View/RelatesFeed",
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/PlayPause",
    "https://app.biliapi.net/bilibili.app.viewunite.v1.View/RelatesFeed",
    "https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/AIRelateAsync",
    "https://grpc.biliapi.net/bilibili.app.playerunite.v1.Player/PlayViewUnite",
    "https://grpc.bilibili.com/bilibili.app.story.v1.Story/BottomDiversionEntrance",
    "https://api.live.bilibili.com/xlive/app-interface/v2/index/feed",
    "https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByUser",
  ]) {
    assert.equal(refresh.isVolatileMetadataUrl(url), true);
  }
  for (const url of [
    "https://app.bilibili.com/x/v2/view/extra",
    "https://app.bilibili.com/x/v2/search/typeahead",
    "https://app.bilibili.com/x/v2/account/myinfo/extra",
    "https://api.bilibili.com/x/vip/ads/material",
    "https://evil.example/x/v2/account/mine",
    "https://grpc.biliapi.net/bilibili.app.playerunite.v1.Player/PlayViewUniteV2",
  ]) {
    assert.equal(refresh.isVolatileMetadataUrl(url), false);
  }
});

test("cache guard removes validators without changing unrelated headers", () => {
  const original = {
    Accept: "application/json",
    "If-None-Match": "\"server-original\"",
    "if-modified-since": "Sun, 26 Jul 2026 01:00:00 GMT",
    "IF-RANGE": "\"range\"",
    "X-Bili-Trace-Id": "trace-1",
  };
  const result = refresh.guardRequest(
    "https://app.bilibili.com/x/v2/account/mine?build=9400000",
    original,
  );

  assert.equal(result.changed, true);
  assert.equal(result.endpoint, "mine");
  assert.equal(result.removedValidators, 3);
  assert.deepEqual(result.removedValidatorNames, [
    "if-none-match",
    "if-modified-since",
    "if-range",
  ]);
  assert.deepEqual(original, {
    Accept: "application/json",
    "If-None-Match": "\"server-original\"",
    "if-modified-since": "Sun, 26 Jul 2026 01:00:00 GMT",
    "IF-RANGE": "\"range\"",
    "X-Bili-Trace-Id": "trace-1",
  });
  assert.deepEqual(result.headers, {
    Accept: "application/json",
    "X-Bili-Trace-Id": "trace-1",
    "Cache-Control": "no-cache, no-store, max-age=0",
    Pragma: "no-cache",
  });
});

test("cache guard diagnostics identify endpoints without retaining queries", () => {
  assert.equal(
    refresh.classifyVolatileEndpoint(
      "https://app.bilibili.com/x/v2/splash/event/list2?loaded=secret",
    ),
    "splash-event-list2",
  );
  assert.equal(
    refresh.classifyVolatileEndpoint(
      "https://app.bilibili.com/x/v2/feed/index/relate/story?access_key=secret",
    ),
    "story-relate",
  );
  assert.equal(
    refresh.classifyVolatileEndpoint(
      "https://api.biliapi.net/x/vip/ads/material/report?sign=secret",
    ),
    "vip-material-report",
  );
  assert.equal(refresh.debugEnabled('{"debug":true}'), true);
  assert.equal(refresh.debugEnabled('{"debug":false}'), false);
});

test("Shadowrocket request entrypoint returns guarded headers only", () => {
  const source = shadowrocketRuntimeSource("bilibili-refresh.js");
  let completion;
  const logs = [];
  const context = {
    $argument: '{"debug":true}',
    $done(value) {
      completion = value;
    },
    $request: {
      method: "GET",
      headers: {
        "If-None-Match": "\"stale\"",
        "User-Agent": "Bilibili/9400000",
      },
      url: "https://app.bilibili.com/x/v2/feed/index?pull=1",
    },
    console: {
      log(message) {
        logs.push(message);
      },
    },
    Object,
    RegExp,
    String,
  };

  vm.runInNewContext(source, context, {
    filename: "bilibili-refresh.js",
  });
  assert.equal(completion.headers["If-None-Match"], undefined);
  assert.equal(
    completion.headers["Cache-Control"],
    "no-cache, no-store, max-age=0",
  );
  assert.equal(completion.headers["User-Agent"], "Bilibili/9400000");
  assert.equal("url" in completion, false);
  assert.equal("body" in completion, false);
  assert.deepEqual(logs, [
    "[BiliRefresh] host=app.bilibili.com path=/x/v2/feed/index method=GET endpoint=feed handler=feed transport=json changed=1 validatorsRemoved=1 validators=if-none-match reason=resume-fresh-response",
  ]);
});

test("gRPC request guard constrains compression without touching Range or body metadata", () => {
  const original = {
    Range: "bytes=0-65535",
    "grpc-accept-encoding": "br,gzip",
    "If-None-Match": '"stale"',
    Authorization: "Bearer keep",
  };
  const result = refresh.guardRequest(
    "https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/ViewProgress",
    original,
  );
  assert.equal(result.transport, "grpc");
  assert.equal(result.removedValidators, 1);
  assert.equal(result.headers["grpc-accept-encoding"], "gzip,identity");
  assert.equal(result.headers.Range, "bytes=0-65535");
  assert.equal(result.headers.Authorization, "Bearer keep");
  assert.equal(original["grpc-accept-encoding"], "br,gzip");
});

test("9.8.0 asynchronous metadata guards remove every validator", () => {
  const validators = {
    "IF-NONE-MATCH": '"stale"',
    "If-Modified-Since": "Thu, 20 Aug 2026 00:00:00 GMT",
    "if-range": '"range"',
    "grpc-accept-encoding": "br,gzip",
    Authorization: "Bearer keep",
  };
  const grpc = refresh.guardRequest(
    "https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/AIRelateAsync",
    validators,
  );
  assert.equal(grpc.endpoint, "grpc-view-unite-ai-relate-async");
  assert.equal(grpc.removedValidators, 3);
  assert.deepEqual(grpc.removedValidatorNames.sort(), [
    "if-modified-since",
    "if-none-match",
    "if-range",
  ]);
  assert.equal(grpc.headers["grpc-accept-encoding"], "gzip,identity");
  assert.equal(grpc.headers.Authorization, "Bearer keep");
  assert.equal(grpc.headers["Cache-Control"], "no-cache, no-store, max-age=0");
  assert.equal(grpc.headers.Pragma, "no-cache");

  for (const url of [
    "https://api.live.bilibili.com/xlive/app-interface/v2/index/feed",
    "https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByUser",
  ]) {
    const guarded = refresh.guardRequest(url, validators);
    assert.equal(guarded.transport, "json");
    assert.equal(guarded.removedValidators, 3);
    assert.equal(guarded.headers["grpc-accept-encoding"], "br,gzip");
    assert.equal(guarded.headers["Cache-Control"], "no-cache, no-store, max-age=0");
  }
});

test("player-unite UI metadata is fresh without touching its body or signature", () => {
  const original = {
    "If-None-Match": '"stale-player-ui"',
    "If-Modified-Since": "Sat, 22 Aug 2026 00:00:00 GMT",
    "grpc-accept-encoding": "br,gzip",
    Authorization: "Bearer keep-player-token",
    "X-Bili-Signature": "keep-signature",
  };
  const result = refresh.guardRequest(
    "https://grpc.biliapi.net/bilibili.app.playerunite.v1.Player/PlayViewUnite",
    original,
  );
  assert.equal(result.endpoint, "grpc-playerunite-ui-guard");
  assert.equal(result.transport, "grpc");
  assert.equal(result.removedValidators, 2);
  assert.equal(result.headers["grpc-accept-encoding"], "gzip,identity");
  assert.equal(result.headers.Authorization, "Bearer keep-player-token");
  assert.equal(result.headers["X-Bili-Signature"], "keep-signature");
  assert.equal(result.headers["Cache-Control"], "no-cache, no-store, max-age=0");
});
