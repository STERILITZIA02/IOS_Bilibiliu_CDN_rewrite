"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const refresh = require("../src/bilibili-refresh.js");

test("cache guard is exact to volatile Bilibili Home and Mine metadata", () => {
  for (const url of [
    "https://app.bilibili.com/x/v2/feed/index?device=phone",
    "https://app.biliapi.net/x/v2/feed/index/story?pull=1",
    "https://app.bilibili.com/x/v2/account/mine?build=9400000",
    "https://app.biliapi.net/x/v2/account/mine/ipad",
  ]) {
    assert.equal(refresh.isVolatileMetadataUrl(url), true);
  }
  for (const url of [
    "https://api.bilibili.com/x/v2/feed/index",
    "https://app.bilibili.com/x/v2/view",
    "https://app.bilibili.com/x/v2/account/myinfo",
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
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  });
});

test("Shadowrocket request entrypoint returns guarded headers only", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-refresh.js"),
    "utf8",
  );
  let completion;
  const context = {
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
    Object,
    RegExp,
    String,
  };

  vm.runInNewContext(source, context, {
    filename: "bilibili-refresh.js",
  });
  assert.equal(completion.headers["If-None-Match"], undefined);
  assert.equal(completion.headers["Cache-Control"], "no-cache");
  assert.equal(completion.headers["User-Agent"], "Bilibili/9400000");
  assert.equal("url" in completion, false);
  assert.equal("body" in completion, false);
});
