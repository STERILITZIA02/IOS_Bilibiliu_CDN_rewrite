"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const cdn = require("../src/bilibili-cdn.js");

const originalHost = "upos-sz-mirrorcosov.bilivideo.com";
const targetHost = "upos-sz-mirrorali.bilivideo.com";
const vodPath =
  "/upgcxcode/31/21/62131/video.m4s?deadline=1784897148&bvc=vod";
const originalUrl = `https://${originalHost}${vodPath}`;
const backupUrl = `https://upos-hz-mirrorakam.akamaized.net${vodPath}`;
const liveUrl =
  "https://d1--ov-gotcha105.bilivideo.com/live-bvc/757333/live_demo.m3u8?cdn=ov-gotcha105";
const config = cdn.parseArgument(
  JSON.stringify({ cdn: targetHost, debug: false }),
);
const autoConfig = cdn.parseArgument(
  JSON.stringify({
    cdn: "auto",
    debug: false,
    intervalHours: 12,
    switchThreshold: 20,
  }),
);

function bytes(...chunks) {
  const normalized = chunks.map((chunk) =>
    chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk),
  );
  return cdn.concatBytes(normalized);
}

function fieldTag(fieldNumber, wireType) {
  return cdn.encodeVarint(fieldNumber * 8 + wireType);
}

function stringField(fieldNumber, value) {
  const body = cdn.asciiStringToBytes(value);
  return bytes(fieldTag(fieldNumber, 2), cdn.encodeVarint(body.length), body);
}

function messageField(fieldNumber, message) {
  return bytes(
    fieldTag(fieldNumber, 2),
    cdn.encodeVarint(message.length),
    message,
  );
}

function grpcFrame(payload, flag = 0) {
  const header = new Uint8Array(5);
  header[0] = flag;
  header[1] = Math.floor(payload.length / 0x1000000) & 0xff;
  header[2] = Math.floor(payload.length / 0x10000) & 0xff;
  header[3] = Math.floor(payload.length / 0x100) & 0xff;
  header[4] = payload.length & 0xff;
  return bytes(header, payload);
}

function asciiFromBinary(value) {
  return Buffer.from(value).toString("latin1");
}

function makeAutoEnvironment(now, timings, state) {
  const storage = {};
  const calls = [];
  if (state) {
    storage[cdn.AUTO_STATE_KEY] = JSON.stringify(state);
  }

  return {
    calls,
    services: {
      benchmark(host, url, timeoutMs, callback) {
        calls.push({ host, timeoutMs, url });
        const timing = timings[host];
        callback({
          elapsedMs: typeof timing === "number" ? timing : timeoutMs,
          ok: typeof timing === "number",
          status: typeof timing === "number" ? 200 : 0,
        });
      },
      now() {
        return now;
      },
      persistent: true,
      read(key) {
        return storage[key] || null;
      },
      write(value, key) {
        storage[key] = value;
        return true;
      },
    },
    storage,
  };
}

function autoSelect(sampleUrl, configValue, environment) {
  return new Promise((resolve) => {
    cdn.selectAutoCdn(
      sampleUrl,
      configValue,
      environment.services,
      resolve,
    );
  });
}

test("normalizes a hostname or an HTTPS URL", () => {
  assert.equal(cdn.normalizeCdnHost(targetHost.toUpperCase()), targetHost);
  assert.equal(
    cdn.normalizeCdnHost(`https://${targetHost}/`),
    targetHost,
  );
  assert.equal(cdn.normalizeCdnHost("off"), "");
  assert.equal(cdn.normalizeCdnHost("https://bad host/"), null);
  assert.equal(cdn.normalizeCdnHost("127.0.0.1"), null);
});

test("parses module JSON arguments and fails closed on invalid hosts", () => {
  assert.deepEqual(config, {
    auto: false,
    cdnHost: targetHost,
    debug: false,
    intervalHours: 12,
    switchThreshold: 20,
    valid: true,
  });
  assert.deepEqual(cdn.parseArgument("cdn=off&debug=true"), {
    auto: false,
    cdnHost: "",
    debug: true,
    intervalHours: 12,
    switchThreshold: 20,
    valid: true,
  });
  assert.deepEqual(cdn.parseArgument('{"cdn":"bad host","debug":true}'), {
    auto: false,
    cdnHost: null,
    debug: true,
    intervalHours: 12,
    switchThreshold: 20,
    valid: false,
  });
  assert.deepEqual(cdn.parseArgument("cdn=%"), {
    auto: false,
    cdnHost: null,
    debug: false,
    intervalHours: 12,
    switchThreshold: 20,
    valid: false,
  });
  assert.deepEqual(
    cdn.parseArgument(
      '{"cdn":"auto","intervalHours":1,"switchThreshold":99}',
    ),
    {
      auto: true,
      cdnHost: null,
      debug: false,
      intervalHours: 6,
      switchThreshold: 80,
      valid: true,
    },
  );
});

test("rewrites only Bilibili VOD media URLs", () => {
  assert.equal(
    cdn.rewriteVodUrl(originalUrl, targetHost),
    `https://${targetHost}${vodPath}`,
  );
  assert.equal(cdn.rewriteVodUrl(liveUrl, targetHost), liveUrl);
  assert.equal(
    cdn.rewriteVodUrl(
      "https://example.com/upgcxcode/31/21/file.m4s?bvc=vod",
      targetHost,
    ),
    "https://example.com/upgcxcode/31/21/file.m4s?bvc=vod",
  );
});

test("rewrites DASH, DURL, and nested PGC JSON without replacing backups", () => {
  const fixture = {
    code: 0,
    data: {
      dash: {
        video: [
          {
            baseUrl: originalUrl,
            base_url: originalUrl,
            backupUrl: [backupUrl],
            backup_url: [backupUrl],
          },
        ],
        audio: [{ base_url: originalUrl, backup_url: [backupUrl] }],
      },
      durl: [{ url: originalUrl, backup_url: [backupUrl] }],
    },
    result: {
      video_info: {
        dash: {
          video: [{ base_url: originalUrl }],
          audio: [],
        },
      },
    },
  };

  const result = cdn.transformJsonText(JSON.stringify(fixture), config);
  const output = JSON.parse(result.body);

  assert.equal(cdn.findFirstJsonVodUrl(JSON.stringify(fixture)), originalUrl);
  assert.equal(result.valid, true);
  assert.equal(result.changed, 5);
  assert.match(output.data.dash.video[0].baseUrl, new RegExp(targetHost));
  assert.match(output.data.dash.video[0].base_url, new RegExp(targetHost));
  assert.match(output.data.dash.audio[0].base_url, new RegExp(targetHost));
  assert.match(output.data.durl[0].url, new RegExp(targetHost));
  assert.match(
    output.result.video_info.dash.video[0].base_url,
    new RegExp(targetHost),
  );
  assert.equal(output.data.dash.video[0].backupUrl[0], backupUrl);
  assert.equal(output.data.dash.video[0].backup_url[0], backupUrl);
});

test("leaves current signed live stream JSON unchanged", () => {
  const fixture = {
    code: 0,
    data: {
      playurl_info: {
        playurl: {
          stream: [
            {
              protocol_name: "http_hls",
              format: [
                {
                  format_name: "fmp4",
                  codec: [
                    {
                      base_url: "/live-bvc/1/live_demo/index.m3u8?",
                      url_info: [
                        {
                          host: "https://d1--ov-gotcha207.bilivideo.com",
                          extra: "expires=1784893489&cdn=ov-gotcha207",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  };
  const input = JSON.stringify(fixture);
  const result = cdn.transformJsonText(input, config);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 0);
  assert.equal(result.body, input);
});

test("fails open when a response is not JSON", () => {
  const input = "<html>upstream error</html>";
  const result = cdn.transformJsonText(input, config);
  assert.equal(result.valid, false);
  assert.equal(result.changed, 0);
  assert.equal(result.body, input);
});

test("rewrites deeply nested Protobuf URL strings and updates lengths", () => {
  // PlayViewUniteReply.vod_info.stream_list.dash_video:
  // reply(1) -> vod(5) -> stream(2) -> DashVideo(base_url=1, backup_url=2)
  const dashVideo = bytes(
    stringField(1, originalUrl),
    stringField(2, backupUrl),
    bytes(fieldTag(3, 0), cdn.encodeVarint(123456)),
  );
  const stream = messageField(2, dashVideo);
  const vodInfo = messageField(5, stream);
  const reply = messageField(1, vodInfo);
  const framed = grpcFrame(reply);

  const result = cdn.transformGrpcBody(framed, config);
  const output = asciiFromBinary(result.body);

  assert.equal(cdn.findFirstGrpcVodUrl(framed), originalUrl);
  assert.equal(result.valid, true);
  assert.equal(result.changed, 1);
  assert.equal(output.includes(originalHost), false);
  assert.equal(output.includes("upos-hz-mirrorakam.akamaized.net"), true);
  assert.equal(output.split(targetHost).length - 1, 1);

  const declaredLength =
    result.body[1] * 0x1000000 +
    result.body[2] * 0x10000 +
    result.body[3] * 0x100 +
    result.body[4];
  assert.equal(declaredLength, result.body.length - 5);
});

test("rewrites segmented primary URLs while preserving Protobuf backups", () => {
  const responseUrl = bytes(
    bytes(fieldTag(1, 0), cdn.encodeVarint(1)),
    stringField(4, originalUrl),
    stringField(5, backupUrl),
  );
  const result = cdn.transformGrpcBody(grpcFrame(responseUrl), config);
  const output = asciiFromBinary(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 1);
  assert.equal(output.includes(originalHost), false);
  assert.equal(output.includes(targetHost), true);
  assert.equal(output.includes("upos-hz-mirrorakam.akamaized.net"), true);
});

test("supports multiple gRPC frames and leaves compressed frames untouched", () => {
  const uncompressedPayload = stringField(1, originalUrl);
  const compressedPayload = stringField(1, originalUrl);
  const input = bytes(
    grpcFrame(uncompressedPayload, 0),
    grpcFrame(compressedPayload, 1),
  );

  const result = cdn.transformGrpcBody(input, config);
  const output = asciiFromBinary(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 1);
  assert.equal(output.split(targetHost).length - 1, 1);
  assert.equal(output.split(originalHost).length - 1, 1);
});

test("does not alter signed live URLs inside Protobuf", () => {
  const input = grpcFrame(stringField(4, liveUrl));
  const result = cdn.transformGrpcBody(input, config);
  assert.equal(result.valid, true);
  assert.equal(result.changed, 0);
  assert.deepEqual(Buffer.from(result.body), Buffer.from(input));
});

test("fails open for malformed gRPC and Protobuf bodies", () => {
  const malformed = new Uint8Array([0, 0, 0, 0, 20, 8, 1]);
  const result = cdn.transformGrpcBody(malformed, config);
  assert.equal(result.changed, 0);
  assert.equal(result.valid, false);
  assert.deepEqual(Buffer.from(result.body), Buffer.from(malformed));
});

test("auto mode tests at most six hosts and reuses its cached selection", async () => {
  const now = Date.UTC(2026, 6, 24, 12, 0, 0);
  const environment = makeAutoEnvironment(now, {
    [originalHost]: 140,
    [cdn.DEFAULT_CDN]: 100,
    "upos-sz-mirrorcos.bilivideo.com": 80,
    "upos-sz-mirrorhw.bilivideo.com": 120,
    "upos-sz-mirroraliov.bilivideo.com": 130,
    "upos-sz-mirrorhwov.bilivideo.com": 150,
  });

  const first = await autoSelect(originalUrl, autoConfig, environment);
  assert.equal(first.host, "upos-sz-mirrorcos.bilivideo.com");
  assert.equal(first.reason, "initial-fastest");
  assert.equal(first.tested, true);
  assert.ok(environment.calls.length <= 6);

  const cachedState = JSON.parse(environment.storage[cdn.AUTO_STATE_KEY]);
  assert.equal(cachedState.selectedHost, first.host);
  assert.equal(cachedState.nextTestAt, now + 12 * 60 * 60 * 1000);

  const cachedEnvironment = makeAutoEnvironment(
    now + 60 * 60 * 1000,
    {},
    cachedState,
  );
  const cached = await autoSelect(originalUrl, autoConfig, cachedEnvironment);
  assert.equal(cached.host, first.host);
  assert.equal(cached.reason, "cached");
  assert.equal(cached.tested, false);
  assert.equal(cachedEnvironment.calls.length, 0);
});

test("auto mode safely falls back when runtime services are unavailable", async () => {
  const selected = await new Promise((resolve) => {
    cdn.selectAutoCdn(originalUrl, autoConfig, null, resolve);
  });

  assert.equal(selected.host, originalHost);
  assert.equal(selected.reason, "services-unavailable");
  assert.equal(selected.tested, false);
  assert.deepEqual(selected.results, []);
});

test("auto mode applies hold time and improvement hysteresis", async () => {
  const now = Date.UTC(2026, 6, 26, 12, 0, 0);
  const baseState = {
    cursor: 0,
    nextTestAt: 0,
    scores: {},
    selectedAt: now - 25 * 60 * 60 * 1000,
    selectedHost: cdn.DEFAULT_CDN,
    testingUntil: 0,
    version: 1,
  };

  const belowThreshold = makeAutoEnvironment(now, {
    [cdn.DEFAULT_CDN]: 100,
    [originalHost]: 110,
    "upos-sz-mirrorcos.bilivideo.com": 85,
    "upos-sz-mirrorhw.bilivideo.com": 120,
    "upos-sz-mirroraliov.bilivideo.com": 130,
  }, baseState);
  const kept = await autoSelect(originalUrl, autoConfig, belowThreshold);
  assert.equal(kept.host, cdn.DEFAULT_CDN);
  assert.equal(kept.reason, "below-threshold");

  const faster = makeAutoEnvironment(now, {
    [cdn.DEFAULT_CDN]: 100,
    [originalHost]: 110,
    "upos-sz-mirrorcos.bilivideo.com": 70,
    "upos-sz-mirrorhw.bilivideo.com": 120,
    "upos-sz-mirroraliov.bilivideo.com": 130,
  }, baseState);
  const switched = await autoSelect(originalUrl, autoConfig, faster);
  assert.equal(switched.host, "upos-sz-mirrorcos.bilivideo.com");
  assert.equal(switched.reason, "meaningfully-faster");

  const heldState = {
    ...baseState,
    selectedAt: now - 13 * 60 * 60 * 1000,
  };
  const heldEnvironment = makeAutoEnvironment(now, {
    [cdn.DEFAULT_CDN]: 100,
    [originalHost]: 110,
    "upos-sz-mirrorcos.bilivideo.com": 40,
    "upos-sz-mirrorhw.bilivideo.com": 120,
    "upos-sz-mirroraliov.bilivideo.com": 130,
  }, heldState);
  const held = await autoSelect(originalUrl, autoConfig, heldEnvironment);
  assert.equal(held.host, cdn.DEFAULT_CDN);
  assert.equal(held.reason, "minimum-hold");
});

test("auto mode immediately fails over from an unreachable cached host", async () => {
  const now = Date.UTC(2026, 6, 26, 12, 0, 0);
  const state = {
    cursor: 0,
    nextTestAt: 0,
    scores: {},
    selectedAt: now - 2 * 60 * 60 * 1000,
    selectedHost: cdn.DEFAULT_CDN,
    testingUntil: 0,
    version: 1,
  };
  const environment = makeAutoEnvironment(now, {
    [originalHost]: 90,
    "upos-sz-mirrorcos.bilivideo.com": 80,
    "upos-sz-mirrorhw.bilivideo.com": 120,
    "upos-sz-mirroraliov.bilivideo.com": 130,
  }, state);

  const selected = await autoSelect(originalUrl, autoConfig, environment);
  assert.equal(selected.host, "upos-sz-mirrorcos.bilivideo.com");
  assert.equal(selected.reason, "current-unreachable");
});

test("Shadowrocket entrypoint returns only the changed JSON body", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-cdn.js"),
    "utf8",
  );
  let completion;
  const context = {
    $argument: JSON.stringify({ cdn: targetHost, debug: false }),
    $done(value) {
      completion = value;
    },
    $request: {
      url: "https://api.bilibili.com/x/player/playurl?bvid=test",
    },
    $response: {
      body: JSON.stringify({ code: 0, data: { durl: [{ url: originalUrl }] } }),
    },
    ArrayBuffer,
    Boolean,
    console,
    decodeURIComponent,
    JSON,
    Math,
    Number,
    Object,
    RegExp,
    String,
    Uint8Array,
  };

  vm.runInNewContext(source, context, { filename: "bilibili-cdn.js" });
  assert.ok(completion && typeof completion.body === "string");
  assert.match(completion.body, new RegExp(targetHost));
});

test("Shadowrocket auto entrypoint benchmarks, persists, and rewrites", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-cdn.js"),
    "utf8",
  );
  const storage = {};
  let completion;
  let clock = Date.UTC(2026, 6, 24, 12, 0, 0);
  const timings = {
    [originalHost]: 100,
    [cdn.DEFAULT_CDN]: 50,
    "upos-sz-mirrorcos.bilivideo.com": 80,
    "upos-sz-mirrorhw.bilivideo.com": 90,
    "upos-sz-mirroraliov.bilivideo.com": 110,
    "upos-sz-mirrorhwov.bilivideo.com": 120,
  };
  const context = {
    $argument: JSON.stringify({
      cdn: "auto",
      debug: false,
      intervalHours: 12,
      switchThreshold: 20,
    }),
    $done(value) {
      completion = value;
    },
    $httpClient: {
      head(request, callback) {
        const hostname = new URL(request.url).hostname;
        const elapsed = timings[hostname] || 3000;
        clock += elapsed;
        callback(
          elapsed < 3000 ? null : new Error("timeout"),
          elapsed < 3000 ? { status: 200 } : null,
        );
      },
    },
    $persistentStore: {
      read(key) {
        return storage[key] || null;
      },
      write(value, key) {
        storage[key] = value;
        return true;
      },
    },
    $request: {
      url: "https://api.bilibili.com/x/player/playurl?bvid=test",
    },
    $response: {
      body: JSON.stringify({ code: 0, data: { durl: [{ url: originalUrl }] } }),
    },
    ArrayBuffer,
    Boolean,
    clearTimeout,
    console,
    Date: { now: () => clock },
    decodeURIComponent,
    Error,
    JSON,
    Math,
    Number,
    Object,
    RegExp,
    setTimeout,
    String,
    Uint8Array,
    URL,
  };

  vm.runInNewContext(source, context, { filename: "bilibili-cdn.js" });

  assert.ok(completion && typeof completion.body === "string");
  assert.match(completion.body, new RegExp(cdn.DEFAULT_CDN));
  const state = JSON.parse(storage[cdn.AUTO_STATE_KEY]);
  assert.equal(state.selectedHost, cdn.DEFAULT_CDN);
  assert.ok(state.nextTestAt > 0);
});
