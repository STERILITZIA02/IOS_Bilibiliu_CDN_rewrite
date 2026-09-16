"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const cdn = require("../src/bilibili-cdn.js");
const benchmark = require("../src/bilibili-cdn-benchmark.js");
const now = Date.UTC(2026, 8, 16);
const primaryHost = "upos-sz-mirrorcosov.bilivideo.com";
const backupHost = "upos-hz-mirrorakam.akamaized.net";
const absentHost = "upos-sz-mirrorali.bilivideo.com";
const mediaUrl = (host, file = "video.m4s") => `https://${host}/upgcxcode/10/20/30/${file}?deadline=1900000000&upsig=${host}&bvc=vod`;
const primary = mediaUrl(primaryHost);
const backup = mediaUrl(backupHost);
const join = (...chunks) => cdn.concatBytes(chunks);
const field = (id, data) => join(cdn.encodeVarint(id * 8 + 2), cdn.encodeVarint(data.length), data);
const textField = (id, value) => field(id, new Uint8Array(Buffer.from(value)));

function fixture(alternative = backup) {
  return { code: 0, data: { dash: { video: [{
    base_url: primary, backup_url: [alternative], baseUrl: primary, backupUrl: [alternative],
    id: 80, codecid: 7, bandwidth: 1800000, codecs: "avc1.640028",
    SegmentBase: { Initialization: "0-1000", indexRange: "1001-2000" },
  }], audio: [{
    base_url: mediaUrl(primaryHost, "audio.m4s"), backup_url: [mediaUrl(backupHost, "audio.m4s")],
    id: 30280, bandwidth: 192000, codecs: "mp4a.40.2", duration: 123.456,
  }] } } };
}

function learned(host, bucket = "normal-video") {
  const state = cdn.createEmptyHostAutoState();
  for (const object of ["a", "b"]) {
    for (const phase of ["startup", "sustained"]) {
      cdn.recordHostSample(state, "auto", host, { at: now - 1000,
        bucket, objectId: cdn.stableHash("o", object), phase, ok: true,
        throughputKbps: 40000, elapsedMs: 100, ttfbMs: 40, status: 206,
      }, now);
    }
  }
  return state;
}

async function process(input, state) {
  const reads = [];
  const writes = [];
  const services = { now: () => now, persistent: true,
    read(key) { reads.push(key); return key === cdn.HOST_AUTO_STATE_KEY && state ? JSON.stringify(state) : null; },
    write(value, key) { writes.push({ value, key }); return true; },
    probe() { assert.fail("no playback probes"); },
  };
  const result = await new Promise(resolve => cdn.processSafeAutoResponse(
    JSON.stringify(input), false, cdn.parseArgument(""), services, resolve,
  ));
  return { result, reads, writes, output: JSON.parse(result.body) };
}

test("cold auto preserves server primaries and stores only a bounded activity timestamp", async () => {
  const input = fixture();
  const { result, output, reads, writes } = await process(input);
  assert.deepEqual(output, input);
  assert.equal(result.reason, "server-primary");
  assert.equal(result.probeCount, 0);
  assert.equal(result.routesStored, 0);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].key, cdn.PLAYBACK_ACTIVITY_KEY);
  assert.deepEqual(JSON.parse(writes[0].value), { at: now, profile: "auto" });
  assert.deepEqual(reads, [cdn.HOST_AUTO_STATE_KEY, cdn.PLAYBACK_ACTIVITY_KEY]);
});

test("public-sample host scores cannot synthesize a URL for another signed object", async () => {
  const input = fixture();
  const { output, result } = await process(input, learned(absentHost));
  assert.deepEqual(output, input);
  assert.equal(result.changed, 0);
});

test("learned server backup preserves representation indexes, original fallback and audio timing", async () => {
  const input = fixture();
  const { output, result, writes } = await process(input, learned(backupHost));
  const video = output.data.dash.video[0];
  assert.equal(video.base_url, backup);
  assert.equal(video.baseUrl, backup);
  assert.deepEqual(video.backup_url, [primary]);
  assert.deepEqual(video.backupUrl, [primary]);
  assert.deepEqual(video.SegmentBase, input.data.dash.video[0].SegmentBase);
  assert.equal(video.codecs, input.data.dash.video[0].codecs);
  assert.equal(video.bandwidth, input.data.dash.video[0].bandwidth);
  assert.deepEqual(output.data.dash.audio, input.data.dash.audio);
  assert.equal(result.routesStored, 0);
  assert.ok(writes.every(write => write.key === cdn.PLAYBACK_ACTIVITY_KEY));
});

test("a backup for a different media path is never promoted in automatic or fixed JSON mode", async () => {
  const input = fixture(mediaUrl(backupHost, "other-quality.m4s"));
  const { output } = await process(input, learned(backupHost));
  assert.deepEqual(output, input);
  const fixed = cdn.transformJsonText(JSON.stringify(input), cdn.parseArgument(`cdn=${backupHost}`));
  assert.equal(JSON.parse(fixed.body).data.dash.video[0].base_url, primary);
});

test("gRPC keeps a foreign representation backup and opaque index bytes unchanged", () => {
  const dash = join(textField(1, primary), textField(2, mediaUrl(backupHost, "other-quality.m4s")), textField(100, "opaque-segment-index"));
  const payload = field(1, field(5, field(2, dash)));
  const frame = join(new Uint8Array([0, payload.length >>> 24, payload.length >>> 16 & 255, payload.length >>> 8 & 255, payload.length & 255]), payload);
  const config = { ...cdn.parseArgument(""), grpcAdapter: "playerunite-v1", hostAutoState: learned(backupHost) };
  assert.deepEqual(cdn.prepareSafeGrpc(frame, config, cdn.createEmptyAutoState(), now).body, frame);
  assert.deepEqual(cdn.transformGrpcBody(frame, { ...cdn.parseArgument(`cdn=${backupHost}`), grpcAdapter: "playerunite-v1" }).body, frame);
});

test("legacy media request entrypoint cannot redirect retries, seek ranges, HEAD or If-Range", () => {
  const source = fs.readFileSync(path.join(__dirname, "../dist/bilibili-cdn-route.js"), "utf8");
  for (const request of [
    { url: primary, method: "GET", headers: {} },
    { url: primary, method: "GET", headers: { Range: "bytes=6000000-", "If-Range": '"etag-old-cdn"' } },
    { url: backup, method: "GET", headers: { Range: "bytes=1000-2000" } },
    { url: primary, method: "HEAD", headers: {} },
  ]) {
    let count = 0;
    vm.runInNewContext(source, { $argument: "", $request: request,
      $done(value) { count += 1; assert.deepEqual(JSON.parse(JSON.stringify(value)), {}); },
      $persistentStore: { read() { assert.fail("retired redirect must not read cached URLs"); }, write() { assert.fail("no writes"); } },
      $httpClient: { get() { assert.fail("no probes"); } }, console: { log() {} },
    });
    assert.equal(count, 1);
  }
});

test("distributed modules never intercept media Range requests", () => {
  for (const file of ["Bilibili.CDN.Switcher.sgmodule", "Bilibili.CDN.Enhanced.sgmodule"]) {
    const source = fs.readFileSync(path.join(__dirname, "../dist", file), "utf8");
    assert.doesNotMatch(source, /Cached Media Route|script-path=[^\n]*bilibili-cdn-route\.js/);
    assert.match(source, /Bilibili CDN JSON = type=http-response/);
    assert.match(source, /Bilibili CDN gRPC = type=http-response/);
  }
});

test("background candidates include the server primary and only exact same-object URLs", () => {
  const media = benchmark.extractMediaSample(fixture());
  const plan = benchmark.buildCandidatePlan(media, cdn.createEmptyHostAutoState(), { networkProfile: "auto", candidates: [absentHost] }, now);
  assert.ok(plan.some(candidate => candidate.hostname === primaryHost));
  assert.ok(plan.some(candidate => candidate.hostname === backupHost));
  assert.ok(plan.every(candidate => candidate.url === media.exactByHost[candidate.hostname]));
});

test("benchmark can learn the audio bucket instead of applying video measurements to audio", () => {
  const media = benchmark.extractMediaSample(fixture(), "audio");
  assert.equal(media.kind, "audio");
  assert.equal(media.bucket, "audio");
  assert.equal(media.primaryUrl, mediaUrl(primaryHost, "audio.m4s"));
});

test("background probes defer after a recent playback response and isolate network profiles", async () => {
  const services = { now: () => now, read: key => key === cdn.PLAYBACK_ACTIVITY_KEY
    ? JSON.stringify({ at: now - 30000, profile: "auto" }) : null,
  write() { assert.fail("deferred job must not write"); },
  fetchPlayInfo() { assert.fail("deferred job must not fetch"); },
  probe() { assert.fail("deferred job must not probe"); } };
  const result = await new Promise(resolve => benchmark.runBenchmark(benchmark.parseArgument(""), services, resolve));
  assert.equal(result.reason, "playback-active");
  assert.equal(result.probeCount, 0);
  assert.equal(cdn.playbackRecentlyActive(services, "wifi_other", now), false);
  assert.equal(cdn.playbackRecentlyActive(services, "auto", now + 180000), false);
});

test("initial learning is capped at six runs then honors the configured interval", async () => {
  let clock = now;
  const storage = {};
  const kinds = [];
  const services = { now: () => clock, read: key => storage[key] || null,
    write(value, key) { storage[key] = value; return true; },
    fetchPlayInfo(sample, done) {
      done(null, JSON.stringify(fixture()).replaceAll("/30/", `/${sample.bvid}/`));
    },
    probe(candidate, _timeout, done) {
      if (candidate.phase === "startup") kinds.push(candidate.url.includes("audio.m4s") ? "audio" : "video");
      const { start, end } = candidate.probeRange;
      done({ status: 206, url: candidate.url, elapsedMs: 80, ttfbMs: 20,
        body: Buffer.alloc(end - start + 1, 1),
        headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/9999999` },
      });
    },
  };
  for (let run = 0; run < 6; run += 1) {
    const result = await new Promise(resolve => benchmark.runBenchmark(benchmark.parseArgument("interval=2"), services, resolve));
    assert.equal(result.reason, "completed");
    const profile = JSON.parse(storage[cdn.HOST_AUTO_STATE_KEY]).profiles.auto;
    assert.equal(profile.learningRuns, run + 1);
    assert.equal(profile.nextRunAt - clock, run < 5 ? 600000 : 7200000);
    clock = profile.nextRunAt;
  }
  assert.ok(kinds.includes("audio"));
  assert.ok(kinds.includes("video"));
});
