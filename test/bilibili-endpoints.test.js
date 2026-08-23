"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const endpoints = require("../src/bilibili-endpoints.js");

test("endpoint registry rows are complete and uniquely classified", () => {
  assert.ok(endpoints.REGISTRY.length >= 30);
  const ids = new Set();
  for (const row of endpoints.REGISTRY) {
    assert.match(row.id, /^[a-z0-9-]+$/);
    assert.equal(ids.has(row.id), false, row.id);
    ids.add(row.id);
    assert.ok(Array.isArray(row.hosts) && row.hosts.length > 0, row.id);
    assert.ok(row.path || row.pathPattern, row.id);
    assert.ok(["json", "grpc"].includes(row.transport), row.id);
    assert.equal(typeof row.handler, "string", row.id);
    assert.equal(typeof row.volatile, "boolean", row.id);
    assert.equal(typeof row.requestGuard, "boolean", row.id);
    assert.equal(typeof row.responseFilter, "boolean", row.id);
  }
  assert.equal(endpoints.validateRegistry(), true);
});

test("registry classifies reviewed JSON, gRPC, and 9.5 log discoveries", () => {
  const cases = [
    ["https://app.bilibili.com/x/v2/feed/index?pull=1", "feed", "json"],
    ["https://app.biliapi.net/x/v2/search?keyword=x", "search-results", "json"],
    ["https://app.bilibili.com/x/v2/search/type?type=0", "search-results", "json"],
    ["https://app.biliapi.net/x/v2/view?aid=1", "view", "json"],
    [
      "https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/ViewProgress",
      "grpc-view-unite-progress",
      "grpc",
    ],
    [
      "https://app.biliapi.net/bilibili.app.viewunite.v1.View/RelatesFeed",
      "grpc-view-unite-relates",
      "grpc",
    ],
    [
      "https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/AIRelateAsync",
      "grpc-view-unite-ai-relate-async",
      "grpc",
    ],
    [
      "https://api.live.bilibili.com/xlive/app-interface/v2/index/feed",
      "live-feed",
      "json",
    ],
    [
      "https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByUser",
      "live-user",
      "json",
    ],
    [
      "https://app.bilibili.com/bilibili.app.show.v1.Popular/Index",
      "grpc-popular",
      "grpc",
    ],
    [
      "https://grpc.bilibili.com/bilibili.app.story.v1.Story/BottomDiversionEntrance",
      "grpc-story-bottom-diversion",
      "grpc",
    ],
  ];
  for (const [url, id, transport] of cases) {
    const row = endpoints.classify(url);
    assert.equal(row?.id, id);
    assert.equal(row?.transport, transport);
  }
  assert.equal(
    endpoints.classify("https://evil.example/x/v2/feed/index"),
    null,
  );
  assert.equal(
    endpoints.classify("https://app.bilibili.com/x/v2/search/typeahead"),
    null,
  );
  assert.equal(
    endpoints.classify("https://app.bilibili.com/x/v2/view/extra"),
    null,
  );
  assert.equal(
    endpoints.classify(
      "https://grpc.biliapi.net/bilibili.app.playerunite.v1.Player/PlayViewUnite",
      { requestGuard: true },
    )?.id,
    "grpc-playerunite-ui-guard",
  );
  assert.equal(
    endpoints.classify(
      "https://grpc.biliapi.net/bilibili.app.playerunite.v1.Player/PlayViewUniteV2",
      { requestGuard: true },
    ),
    null,
  );
  assert.equal(
    endpoints.classify(
      "https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/AIRelateAsyncV2",
    )?.id,
    "grpc-metadata-diagnostic",
  );
  assert.equal(
    endpoints.classify(
      "https://api.live.bilibili.com/xlive/app-interface/v2/index/feeds",
    ),
    null,
  );
});

test("registry-generated matchers cover exactly their runtime groups", () => {
  const refresh = new RegExp(endpoints.matcherPattern({ requestGuard: true }));
  const enhanceGrpc = new RegExp(
    endpoints.matcherPattern({ runtime: "enhance", transport: "grpc" }),
  );
  const story = new RegExp(
    endpoints.matcherPattern({ runtime: "story", transport: "json" }),
  );

  for (const url of [
    "https://app.bilibili.com/x/v2/feed/index",
    "https://app.biliapi.net/x/v2/search/type?type=0",
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/ViewProgress",
    "https://app.biliapi.net/bilibili.app.viewunite.v1.View/RelatesFeed",
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/PlayPause",
    "https://grpc.biliapi.net/bilibili.app.viewunite.v1.View/AIRelateAsync",
    "https://grpc.biliapi.net/bilibili.app.playerunite.v1.Player/PlayViewUnite",
    "https://grpc.bilibili.com/bilibili.app.story.v1.Story/BottomDiversionEntrance",
    "https://api.live.bilibili.com/xlive/app-interface/v2/index/feed",
    "https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByUser",
  ]) {
    assert.match(url, refresh);
  }
  assert.match(
    "https://grpc.biliapi.net/bilibili.app.show.v1.Popular/Index",
    enhanceGrpc,
  );
  assert.doesNotMatch(
    "https://grpc.biliapi.net/bilibili.app.playurl.v1.PlayURL/PlayView",
    enhanceGrpc,
  );
  assert.match("https://app.bilibili.com/x/v2/feed/index/story", story);
  assert.doesNotMatch("https://app.bilibili.com/x/v2/feed/index", story);
});

test("transport detection is independent from endpoint membership", () => {
  const unknownGrpc = new Uint8Array([0, 0, 0, 0, 2, 8, 1]);
  assert.equal(
    endpoints.detectTransport({
      body: unknownGrpc,
      contentType: "application/octet-stream",
    }),
    "grpc",
  );
  assert.equal(
    endpoints.detectTransport({
      body: new Uint8Array([1, 2, 3]),
      contentType: "application/grpc+proto",
    }),
    "grpc",
  );
  assert.equal(
    endpoints.detectTransport({ body: "{\"code\":0}", contentType: "application/json" }),
    "json",
  );
  assert.equal(
    endpoints.detectTransport({
      body: new Uint8Array([1, 2, 3]),
      contentType: "application/octet-stream",
    }),
    "binary",
  );
});
