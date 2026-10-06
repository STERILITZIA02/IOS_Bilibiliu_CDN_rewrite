"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const btr = require("../src/bilibili-btr.js");
const source = fs.readFileSync(path.join(__dirname, "../src/bilibili-btr.js"), "utf8");
const statusUrl = "http://bilibtr.invalid/status";
const mediaUrl = "http://upos-sz-mirrorcosov.bilivideo.com/upgcxcode/1/2/3/3-1-30080.m4s?upsig=SYNTHETIC_PRIVATE";

async function invoke({ url = statusUrl, argument = "enabled=true", store = new Map(), storage = "normal", method = "GET", consoleAvailable = true } = {}) {
  const completed = [], logs = [], outbound = [];
  const context = { Uint8Array, ArrayBuffer, setTimeout, clearTimeout,
    __BILIFLOW_VERSION__: "3.16.2", $argument: argument,
    $request: { url, method, headers: { Range: "bytes=0-", Cookie: "SYNTHETIC_COOKIE" } },
    $persistentStore: storage === "missing" ? undefined : {
      read: key => store.get(key),
      write(value, key) {
        if (storage === "throw") throw new Error("SYNTHETIC_STORE_SECRET");
        if (storage !== "false") store.set(key, value);
        return storage === "undefined" ? undefined : storage !== "false";
      }
    },
    $httpClient: { get(options) { outbound.push(options); assert.fail("diagnostics must never download media"); } },
    console: consoleAvailable ? { log: line => logs.push(line) } : undefined,
    $done: result => completed.push(result)
  };
  vm.runInNewContext(source, context);
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(completed.length, 1);
  return { result: completed[0], logs, outbound, store };
}

test("local status goes through the same BTR matcher and returns runtime evidence without network access", async () => {
  const matcher = new RegExp(btr.REQUEST_PATTERN);
  assert.equal(matcher.test(statusUrl), true);
  assert.equal(matcher.test("http://bilibtr.invalid:80/status"), true);
  for (const url of ["https://bilibtr.invalid/status", "http://bilibtr.invalid/status?x=1", "http://bilibtr.invalid/status/", "http://bilibtr.invalid.evil.test/status"]) {
    assert.equal(matcher.test(url), false, url);
  }
  const { result, outbound } = await invoke();
  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers["Content-Type"], "application/json; charset=utf-8");
  assert.equal(result.response.headers["Cache-Control"], "no-store");
  const report = JSON.parse(result.response.body);
  assert.equal(report.version, "3.16.2");
  assert.equal(report.scriptLoaded, true);
  assert.equal(report.argumentsValid, true);
  assert.equal(report.enabled, true);
  assert.equal(report.storageRoundTrip, true);
  assert.equal(report.requestsSeen, 0);
  assert.equal(outbound.length, 0);
  assert.doesNotMatch(result.response.body, /SYNTHETIC|upsig|Cookie|bilivideo/);
});

test("unexpanded parameters are visible even though acceleration fails open", async () => {
  const argument = "enabled=true&threads={{{并发数}}}", store = new Map();
  const media = await invoke({ url: mediaUrl, argument, store });
  assert.deepEqual(Object.keys(media.result), []);
  assert.ok(media.logs.some(line => line.includes("arguments-invalid")));
  const { result } = await invoke({ argument, store });
  const report = JSON.parse(result.response.body);
  assert.equal(report.argumentsValid, false);
  assert.equal(report.enabled, false);
  assert.equal(report.requestsSeen, 1);
  assert.equal(report.last.reason, "arguments-invalid");
  assert.doesNotMatch(result.response.body, /SYNTHETIC|upsig|\{\{\{/);
});

test("status distinguishes absent, failing and void-returning storage without changing leases", async () => {
  for (const storage of ["missing", "false", "throw", "undefined"]) {
    const store = new Map([[btr.LEASE_KEY, '{"owner":"existing","until":9999999999999}']]);
    const { result } = await invoke({ storage, store });
    const report = JSON.parse(result.response.body);
    assert.equal(report.storageRoundTrip, storage === "undefined", storage);
    assert.equal(store.get(btr.LEASE_KEY), '{"owner":"existing","until":9999999999999}');
    assert.equal(report.requestsSeen, 0, "a status check is not media activity");
    assert.doesNotMatch(result.response.body, /SYNTHETIC|existing/);
  }
});

test("media diagnostics survive unavailable console and retain the latest skip reason", async () => {
  const store = new Map();
  await invoke({ url: mediaUrl, store, consoleAvailable: false });
  const { result } = await invoke({ store });
  const report = JSON.parse(result.response.body);
  assert.equal(report.requestsSeen, 1);
  assert.equal(report.acceleratedRequests, 0);
  assert.equal(report.last.reason, "range-open");
  assert.equal(report.last.scheme, "http");
});

test("void-returning storage is accepted only after the written value is read back", async () => {
  const store = new Map(), calls = [];
  const req = { url: mediaUrl, method: "GET", headers: { Range: "bytes=0-262143" } };
  const services = { now: Date.now, pause: async () => {}, read: k => store.get(k), write(v, k) { store.set(k, v); },
    request(options, callback) {
      calls.push(options);
      const range = btr.byteRange(options.headers.Range);
      callback(null, { status: 206, url: options.url, headers: { "Content-Type": "video/mp4", ETag: '"object"',
        "Content-Range": `bytes ${range.start}-${range.end}/1048576` }, body: new Uint8Array(range.length) });
    }
  };
  const result = await btr.accelerate(req, btr.parseArgument(""), services);
  assert.equal(result.action, "respond");
  assert.ok(calls.length > 0);
  services.read = () => undefined;
  calls.length = 0;
  assert.equal((await btr.accelerate(req, btr.parseArgument(""), services)).action, "pass");
  assert.equal(calls.length, 0);
});

test("status ignores foreign-version or untrusted diagnostic properties", async () => {
  const store = new Map([[btr.DIAGNOSTIC_KEY, JSON.stringify({ version: "old", seen: 100, accelerated: 20,
    last: { reason: "SYNTHETIC_PRIVATE", url: mediaUrl }, secret: "SYNTHETIC_COOKIE" })]]);
  const { result } = await invoke({ store });
  const report = JSON.parse(result.response.body);
  assert.equal(report.requestsSeen, 0);
  assert.equal(report.last, null);
  assert.doesNotMatch(result.response.body, /SYNTHETIC|upsig|bilivideo/);
  const post = await invoke({ method: "POST" });
  assert.equal(post.result.response, undefined);
});
