"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const refresh = require("../src/bilibili-refresh.js");

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
    "https://app.bilibili.com/x/v2/account/mine?build=9400000",
    "https://app.biliapi.net/x/v2/account/mine/ipad",
    "https://app.bilibili.com/x/v2/account/myinfo",
    "https://api.bilibili.com/x/vip/ads/materials",
    "https://api.biliapi.net/x/vip/ads/material/report",
  ]) {
    assert.equal(refresh.isVolatileMetadataUrl(url), true);
  }
  for (const url of [
    "https://api.bilibili.com/x/v2/feed/index",
    "https://app.bilibili.com/x/v2/view/extra",
    "https://app.bilibili.com/x/v2/account/myinfo/extra",
    "https://api.bilibili.com/x/vip/ads/material",
    "https://evil.example/x/v2/account/mine",
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
    "Cache-Control": "no-cache, no-store",
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
    "feed-relate-story",
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
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-refresh.js"),
    "utf8",
  );
  let completion;
  const logs = [];
  const context = {
    $argument: '{"debug":true}',
    $done(value) {
      completion = value;
    },
    $request: {
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
  assert.equal(completion.headers["Cache-Control"], "no-cache, no-store");
  assert.equal(completion.headers["User-Agent"], "Bilibili/9400000");
  assert.equal("url" in completion, false);
  assert.equal("body" in completion, false);
  assert.deepEqual(logs, [
    "[BiliRefresh] endpoint=feed-index changed=1 validatorsRemoved=1 reason=fresh-response-requested",
  ]);
});
