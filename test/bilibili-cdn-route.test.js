"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const cdn = require("../src/bilibili-cdn.js");
const route = require("../src/bilibili-cdn-route.js");

const sourceHost = "upos-sz-mirrorcosov.bilivideo.com";
const targetHost = "upos-hz-mirrorakam.akamaized.net";
const mediaPath = "/upgcxcode/77/26/40368802677/40368802677-1-100026.m4s";
const now = Date.UTC(2026, 7, 3, 0, 0, 0);
const deadline = Math.floor(now / 1000) + 60 * 60;

function mediaUrl(hostname, objectPath, signature, extra = "") {
  return (
    `http://${hostname}${objectPath}` +
    `?e=shared&deadline=${deadline}&oi=3734641973` +
    "&trid=route-transactionU&mid=1245893059&nbs=1" +
    "&platform=iphone&uipk=5&gen=playurlv3" +
    `&upsig=${signature}&bvc=vod&buvid=device-binding&bw=541201` +
    extra
  );
}

const primaryUrl = mediaUrl(sourceHost, mediaPath, "primary-signature", "&os=cosovbv&orderid=0,2");
const exactTargetUrl = mediaUrl(
  targetHost,
  mediaPath,
  "target-signature",
  `&os=akam&hdnts=exp=${deadline}~hmac=exact-target-hmac&orderid=1,2`,
);

function playurlFixture(primary = primaryUrl, target = exactTargetUrl) {
  return {
    code: 0,
    data: {
      dash: {
        audio: [],
        video: [
          {
            backup_url: [target],
            bandwidth: 541201,
            base_url: primary,
            codecid: 7,
            id: 80,
          },
        ],
      },
    },
  };
}

function makeEnvironment(initial = {}) {
  const storage = { ...initial };
  const writes = [];
  return {
    services: {
      now() {
        return now;
      },
      persistent: true,
      read(key) {
        return storage[key] || null;
      },
      write(value, key) {
        storage[key] = value;
        writes.push({ key, value });
        return true;
      },
    },
    storage,
    writes,
  };
}

function process(body, environment) {
  return new Promise((resolve) => {
    cdn.processSafeAutoResponse(
      body,
      false,
      cdn.parseArgument(""),
      environment.services,
      resolve,
    );
  });
}

test("fresh PlayView persists an exact signed route that catches a cached cosov request", async () => {
  const environment = makeEnvironment();
  const result = await process(JSON.stringify(playurlFixture()), environment);
  const output = JSON.parse(result.body).data.dash.video[0];

  assert.equal(result.reason, "cold-akamai");
  assert.equal(output.base_url, exactTargetUrl);
  assert.equal(result.routesStored, 1);
  assert.equal(environment.writes.length, 1);
  assert.equal(environment.writes[0].key, cdn.MEDIA_ROUTE_STATE_KEY);

  const persisted = JSON.parse(environment.storage[cdn.MEDIA_ROUTE_STATE_KEY]);
  const entries = Object.values(persisted.entries);
  assert.equal(persisted.version, 9);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].targetUrl, exactTargetUrl);
  assert.deepEqual(entries[0].sourceHosts, [sourceHost, targetHost]);
  assert.ok(entries[0].expiresAt > now);
  assert.ok(entries[0].expiresAt <= deadline * 1000 - 30_000);

  const selected = route.selectMediaRequest(
    primaryUrl,
    "GET",
    {
      Host: sourceHost,
      Range: "bytes=1048576-2097151",
      "User-Agent": "Bilibili Freedoooooom/MarkII",
    },
    JSON.stringify({ cdn: "auto", networkProfile: "auto" }),
    environment.services,
  );

  assert.equal(selected.changed, true);
  assert.equal(selected.reason, "exact-signed-route");
  assert.equal(selected.url, exactTargetUrl);
  assert.equal(selected.headers.Host, targetHost);
  assert.equal(selected.headers.Range, "bytes=1048576-2097151");
  assert.equal(selected.headers["User-Agent"], "Bilibili Freedoooooom/MarkII");
  assert.doesNotMatch(selected.url, /primary-signature/);
  assert.match(selected.url, /target-signature/);
  assert.match(selected.url, /hdnts=exp=/);
});

test("response and request runtimes derive the same object-and-binding route key", () => {
  const responsePrimary = cdn.mediaRouteKeyForUrl(primaryUrl, "auto");
  const responseTarget = cdn.mediaRouteKeyForUrl(exactTargetUrl, "auto");
  const requestPrimary = route.mediaRouteKeyForUrl(primaryUrl, "auto");
  const requestTarget = route.mediaRouteKeyForUrl(exactTargetUrl, "auto");

  assert.equal(responsePrimary.key, responseTarget.key);
  assert.equal(responsePrimary.key, requestPrimary.key);
  assert.equal(requestPrimary.key, requestTarget.key);
  assert.equal(responsePrimary.expiresAt, requestPrimary.expiresAt);
  assert.match(responsePrimary.key, /^m2_[0-9a-f]{32}$/);
});

test("automatic network profile hashing remains identical across response and request runtimes", async () => {
  const environment = makeEnvironment();
  environment.services.networkInfo = () => ({
    identifier: "Young Home WiFi",
    type: "wifi",
  });
  await process(JSON.stringify(playurlFixture()), environment);
  const expectedProfile = cdn.resolveRuntimeNetworkProfile("auto", environment.services);
  const persisted = JSON.parse(environment.storage[cdn.MEDIA_ROUTE_STATE_KEY]);
  const entry = Object.values(persisted.entries)[0];

  assert.equal(entry.networkProfile, expectedProfile);
  assert.equal(
    route.resolveRuntimeNetworkProfile("auto", environment.services),
    expectedProfile,
  );
  assert.equal(
    route.selectMediaRequest(
      primaryUrl,
      "GET",
      { Range: "bytes=0-65535" },
      "cdn=auto&profile=auto",
      environment.services,
    ).changed,
    true,
  );
  assert.equal(
    route.selectMediaRequest(
      primaryUrl,
      "GET",
      { Range: "bytes=0-65535" },
      "cdn=auto&profile=auto",
      {
        ...environment.services,
        networkInfo: () => ({ identifier: "Spark NZ", type: "cellular" }),
      },
    ).changed,
    false,
  );
});

test("request routing fails open outside the exact signed object binding", async () => {
  const environment = makeEnvironment();
  await process(JSON.stringify(playurlFixture()), environment);
  const cases = [
    {
      label: "different transaction",
      url: primaryUrl.replace("route-transactionU", "other-transactionU"),
      method: "GET",
      argument: "cdn=auto",
    },
    {
      label: "different object",
      url: primaryUrl.replace("40368802677-1-100026", "40368802677-1-100025"),
      method: "GET",
      argument: "cdn=auto",
    },
    {
      label: "already target",
      url: exactTargetUrl,
      method: "GET",
      argument: "cdn=auto",
    },
    {
      label: "post",
      url: primaryUrl,
      method: "POST",
      argument: "cdn=auto",
    },
    {
      label: "live",
      url: "http://d1--ov-gotcha105.bilivideo.com/live-bvc/1/live.m3u8?cdn=ov",
      method: "GET",
      argument: "cdn=auto",
    },
    {
      label: "unknown host",
      url: primaryUrl.replace(sourceHost, "media.attacker.example"),
      method: "GET",
      argument: "cdn=auto",
    },
    {
      label: "fixed mode respects the configured response policy",
      url: primaryUrl,
      method: "GET",
      argument: "cdn=upos-sz-mirrorali.bilivideo.com",
    },
    {
      label: "off mode",
      url: primaryUrl,
      method: "GET",
      argument: "cdn=off",
    },
  ];

  for (const entry of cases) {
    const result = route.selectMediaRequest(
      entry.url,
      entry.method,
      { Range: "bytes=0-1" },
      entry.argument,
      environment.services,
    );
    assert.equal(result.changed, false, entry.label);
    assert.equal(result.url, entry.url, entry.label);
  }

  const expired = route.selectMediaRequest(
    primaryUrl,
    "GET",
    {},
    "cdn=auto",
    { ...environment.services, now: () => deadline * 1000 },
  );
  assert.equal(expired.changed, false);

  const corrupt = makeEnvironment({ [cdn.MEDIA_ROUTE_STATE_KEY]: "{broken" });
  assert.equal(
    route.selectMediaRequest(
      primaryUrl,
      "GET",
      {},
      "cdn=auto",
      corrupt.services,
    ).changed,
    false,
  );
});

test("v9 route state is expiry-pruned and bounded to the newest 64 exact URLs", () => {
  const oversized = { entries: {}, version: 9 };
  for (let index = 0; index < 80; index += 1) {
    const objectPath = `/upgcxcode/77/26/${index}/object-${index}.m4s`;
    const primary = mediaUrl(sourceHost, objectPath, `primary-${index}`);
    const target = mediaUrl(targetHost, objectPath, `target-${index}`);
    const binding = cdn.mediaRouteKeyForUrl(target, "auto");
    oversized.entries[binding.key] = {
      expiresAt: binding.expiresAt,
      networkProfile: "auto",
      observedAt: now + index,
      sourceHosts: [sourceHost, targetHost],
      targetHost,
      targetUrl: target,
    };
  }
  const expiredTarget = mediaUrl(
    targetHost,
    "/upgcxcode/expired/object.m4s",
    "expired",
  ).replace(String(deadline), String(Math.floor(now / 1000) - 1));
  const expiredBinding = cdn.mediaRouteKeyForUrl(expiredTarget, "auto");
  oversized.entries[expiredBinding.key] = {
    expiresAt: now - 1,
    networkProfile: "auto",
    observedAt: now + 100,
    sourceHosts: [sourceHost],
    targetHost,
    targetUrl: expiredTarget,
  };

  const sanitized = cdn.sanitizeMediaRouteState(oversized, now);
  assert.equal(sanitized.version, 9);
  assert.equal(Object.keys(sanitized.entries).length, 64);
  assert.equal(sanitized.entries[expiredBinding.key], undefined);
});

test("Shadowrocket request entrypoint returns only an exact URL and preserved headers", async () => {
  const environment = makeEnvironment();
  await process(JSON.stringify(playurlFixture()), environment);
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-cdn-route.js"),
    "utf8",
  );
  let completion;
  const logs = [];
  const context = {
    $argument: JSON.stringify({ cdn: "auto", debug: true, networkProfile: "auto" }),
    $done(value) {
      completion = value;
    },
    $persistentStore: {
      read(key) {
        return environment.storage[key] || null;
      },
    },
    $request: {
      headers: {
        ":authority": sourceHost,
        Range: "bytes=0-1048575",
        "User-Agent": "Bilibili Freedoooooom/MarkII",
      },
      method: "GET",
      url: primaryUrl,
    },
    Date: { now: () => now },
    JSON,
    Math,
    Number,
    Object,
    RegExp,
    String,
    console: {
      log(message) {
        logs.push(message);
      },
    },
    decodeURIComponent,
  };

  vm.runInNewContext(source, context, { filename: "bilibili-cdn-route.js" });
  assert.equal(completion.url, exactTargetUrl);
  assert.equal(completion.headers[":authority"], targetHost);
  assert.equal(completion.headers.Range, "bytes=0-1048575");
  assert.equal("body" in completion, false);
  assert.equal("response" in completion, false);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /changed=1 source=upos-sz-mirrorcosov/);
  assert.match(logs[0], /target=upos-hz-mirrorakam/);
  assert.doesNotMatch(logs[0], /upsig|hdnts|route-transaction|device-binding/);
});
