"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const cdn = require("../src/bilibili-cdn.js");

const originalHost = "upos-sz-mirrorcosov.bilivideo.com";
const backupHost = "upos-hz-mirrorakam.akamaized.net";
const secondBackupHost = "upos-sz-mirrorhw.bilivideo.com";
const targetHost = "upos-sz-mirrorali.bilivideo.com";
const vodPath = "/upgcxcode/31/21/62131/video.m4s";
const originalUrl =
  `https://${originalHost}${vodPath}?deadline=1784897148&bvc=vod&token=old-primary`;
const backupUrl =
  `https://${backupHost}${vodPath}?deadline=1784897148&bvc=vod&token=old-backup`;
const secondBackupUrl =
  `https://${secondBackupHost}${vodPath}?deadline=1784897148&bvc=vod&token=old-second`;
const liveUrl =
  "https://d1--ov-gotcha105.bilivideo.com/live-bvc/757333/live_demo.m3u8?cdn=ov-gotcha105";
const fixedConfig = cdn.parseArgument(
  JSON.stringify({ cdn: targetHost, debug: false }),
);
const autoConfig = cdn.parseArgument(
  JSON.stringify({
    cdn: "auto",
    debug: false,
    intervalHours: 12,
    networkProfile: "auto",
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

function varintField(fieldNumber, value) {
  return bytes(fieldTag(fieldNumber, 0), cdn.encodeVarint(value));
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

function videoFixture({
  primary = originalUrl,
  backup = backupUrl,
  secondBackup,
  quality = 80,
  codec = 7,
} = {}) {
  const backups = secondBackup ? [backup, secondBackup] : [backup];
  return {
    code: 0,
    data: {
      dash: {
        audio: [],
        video: [
          {
            backupUrl: [...backups],
            backup_url: [...backups],
            bandwidth: 1800000,
            baseUrl: primary,
            base_url: primary,
            codecid: codec,
            id: quality,
            mimeType: "video/mp4",
          },
        ],
      },
    },
  };
}

function validProbe(candidate, elapsedMs = 100, overrides = {}) {
  const body =
    overrides.body === undefined
      ? Buffer.alloc(cdn.AUTO_RANGE_END + 1, 1)
      : overrides.body;
  return {
    body,
    elapsedMs,
    error: false,
    headers: {
      "Content-Length": String(cdn.AUTO_RANGE_END + 1),
      "Content-Range": `bytes 0-${cdn.AUTO_RANGE_END}/9999999`,
      "Content-Type": "video/mp4",
      ...(overrides.headers || {}),
    },
    status: 206,
    url: candidate.url,
    ...overrides,
  };
}

function makeEnvironment({
  now = Date.UTC(2026, 6, 26, 12, 0, 0),
  responder,
  state,
} = {}) {
  let clock = now;
  const calls = [];
  const storage = {};
  if (state) {
    storage[cdn.AUTO_STATE_KEY] = JSON.stringify(state);
  }

  return {
    advance(milliseconds) {
      clock += milliseconds;
    },
    calls,
    get now() {
      return clock;
    },
    services: {
      now() {
        return clock;
      },
      persistent: true,
      probe(candidate, timeoutMs, callback) {
        calls.push({ candidate, timeoutMs });
        const result = responder
          ? responder(candidate, calls.length)
          : validProbe(candidate, candidate.id === calls[0]?.candidate.id ? 100 : 50);
        callback(result);
      },
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

function processAuto(body, binary, config, environment) {
  return new Promise((resolve) => {
    cdn.processSafeAutoResponse(
      body,
      binary,
      config,
      environment.services,
      resolve,
    );
  });
}

function descriptorStateEntry(descriptor, candidateId, now, expiresAt) {
  return {
    candidateCursor: 0,
    candidateId,
    candidateSetHash: descriptor.candidateSetHash,
    expiresAt,
    failureCount: 0,
    lastFailureAt: 0,
    lastUsedAt: now,
    nextProbeAt: expiresAt,
    pendingCandidateId: null,
    pendingSince: 0,
    pendingSuccesses: 0,
    scores: {},
    selectedAt: now,
    successCount: 2,
    validatedAt: now,
  };
}

test("normalizes arguments, defaults to safe auto, and isolates network profiles", () => {
  assert.equal(cdn.normalizeCdnHost(targetHost.toUpperCase()), targetHost);
  assert.equal(cdn.normalizeCdnHost(`https://${targetHost}/`), targetHost);
  assert.equal(cdn.normalizeCdnHost("off"), "");
  assert.equal(cdn.normalizeCdnHost("https://bad host/"), null);
  assert.equal(cdn.normalizeCdnHost("127.0.0.1"), null);
  assert.deepEqual(cdn.parseArgument(""), {
    auto: true,
    cdnHost: null,
    debug: false,
    intervalHours: 12,
    networkProfile: "auto",
    switchThreshold: 20,
    valid: true,
  });
  assert.deepEqual(fixedConfig, {
    auto: false,
    cdnHost: targetHost,
    debug: false,
    intervalHours: 12,
    networkProfile: "auto",
    switchThreshold: 20,
    valid: true,
  });
  assert.deepEqual(
    cdn.parseArgument("cdn=auto&profile=Home_WiFi&interval=1&threshold=99"),
    {
      auto: true,
      cdnHost: null,
      debug: false,
      intervalHours: 6,
      networkProfile: "home_wifi",
      switchThreshold: 80,
      valid: true,
    },
  );
  assert.equal(cdn.parseArgument("cdn=%").valid, false);
  assert.equal(cdn.normalizeNetworkProfile("../../secret"), "auto");
});

test("fixed mode rewrites only Bilibili VOD URLs and preserves signed live URLs", () => {
  assert.equal(
    cdn.rewriteVodUrl(originalUrl, targetHost),
    `https://${targetHost}${vodPath}?deadline=1784897148&bvc=vod&token=old-primary`,
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

test("fixed JSON mode rewrites primaries without replacing backups", () => {
  const fixture = videoFixture();
  fixture.data.dash.audio = [
    {
      base_url: originalUrl.replace("video.m4s", "audio.m4s"),
      backup_url: [backupUrl.replace("video.m4s", "audio.m4s")],
    },
  ];
  fixture.data.durl = [{ url: originalUrl, backup_url: [backupUrl] }];

  const result = cdn.transformJsonText(JSON.stringify(fixture), fixedConfig);
  const output = JSON.parse(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 4);
  assert.match(output.data.dash.video[0].baseUrl, new RegExp(targetHost));
  assert.match(output.data.dash.video[0].base_url, new RegExp(targetHost));
  assert.match(output.data.dash.audio[0].base_url, new RegExp(targetHost));
  assert.match(output.data.durl[0].url, new RegExp(targetHost));
  assert.deepEqual(output.data.dash.video[0].backup_url, [backupUrl]);
  assert.deepEqual(output.data.dash.video[0].backupUrl, [backupUrl]);
});

test("fixed Protobuf mode handles DashVideo, DashItem, and ResponseUrl safely", () => {
  const dashVideo = bytes(
    stringField(1, originalUrl),
    stringField(2, backupUrl),
    varintField(3, 123456),
  );
  const dashAudio = bytes(
    varintField(1, 30216),
    stringField(2, originalUrl.replace("video.m4s", "audio.m4s")),
    stringField(3, backupUrl.replace("video.m4s", "audio.m4s")),
  );
  const responseUrl = bytes(
    varintField(1, 1),
    stringField(4, originalUrl),
    stringField(5, backupUrl),
  );
  const payload = bytes(
    messageField(1, dashVideo),
    messageField(2, dashAudio),
    messageField(3, responseUrl),
  );
  const framed = grpcFrame(payload);
  const result = cdn.transformGrpcBody(framed, fixedConfig);
  const output = asciiFromBinary(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 3);
  assert.equal(output.split(targetHost).length - 1, 3);
  assert.equal(output.split(backupHost).length - 1, 3);
  assert.equal(cdn.findFirstGrpcVodUrl(framed), originalUrl);
});

test("fixed mode leaves compressed frames, malformed bodies, and live URLs unchanged", () => {
  const compressed = grpcFrame(stringField(1, originalUrl), 1);
  const compressedResult = cdn.transformGrpcBody(compressed, fixedConfig);
  assert.equal(compressedResult.changed, 0);
  assert.deepEqual(Buffer.from(compressedResult.body), Buffer.from(compressed));

  const malformed = new Uint8Array([0, 0, 0, 0, 20, 8, 1]);
  const malformedResult = cdn.transformGrpcBody(malformed, fixedConfig);
  assert.equal(malformedResult.valid, false);
  assert.deepEqual(Buffer.from(malformedResult.body), Buffer.from(malformed));

  const live = grpcFrame(stringField(4, liveUrl));
  const liveResult = cdn.transformGrpcBody(live, fixedConfig);
  assert.equal(liveResult.changed, 0);
  assert.deepEqual(Buffer.from(liveResult.body), Buffer.from(live));
});

test("safe auto requires two separated successful probes and never switches the learning response", async () => {
  const input = JSON.stringify(videoFixture());
  const environment = makeEnvironment({
    responder(candidate, callNumber) {
      return validProbe(candidate, callNumber % 2 === 1 ? 100 : 50);
    },
  });

  const first = await processAuto(input, false, autoConfig, environment);
  assert.equal(first.changed, 0);
  assert.equal(first.body, input);
  assert.equal(first.reason, "alternative-pending");
  assert.equal(environment.calls.length, 2);

  environment.advance(cdn.AUTO_CONFIRM_DELAY_MS);
  const second = await processAuto(input, false, autoConfig, environment);
  assert.equal(second.changed, 0);
  assert.equal(second.body, input);
  assert.equal(second.reason, "alternative-confirmed");
  assert.equal(environment.calls.length, 4);

  const third = await processAuto(input, false, autoConfig, environment);
  const output = JSON.parse(third.body);
  assert.equal(third.probed, false);
  assert.ok(third.changed > 0);
  assert.equal(output.data.dash.video[0].base_url, backupUrl);
  assert.equal(output.data.dash.video[0].baseUrl, backupUrl);
  assert.equal(output.data.dash.video[0].backup_url[0], originalUrl);
  assert.equal(output.data.dash.video[0].backupUrl[0], originalUrl);
});

test("safe auto maps a cached fingerprint to current server URLs without reusing old signatures", async () => {
  const oldInput = JSON.stringify(videoFixture());
  const environment = makeEnvironment({
    responder(candidate, callNumber) {
      return validProbe(candidate, callNumber % 2 === 1 ? 100 : 40);
    },
  });
  await processAuto(oldInput, false, autoConfig, environment);
  environment.advance(cdn.AUTO_CONFIRM_DELAY_MS);
  await processAuto(oldInput, false, autoConfig, environment);

  const freshPrimary = originalUrl
    .replace("1784897148", "1784999999")
    .replace("old-primary", "fresh-primary");
  const freshBackup = backupUrl
    .replace("1784897148", "1784999999")
    .replace("old-backup", "fresh-backup");
  const freshInput = JSON.stringify(
    videoFixture({ primary: freshPrimary, backup: freshBackup }),
  );
  const result = await processAuto(freshInput, false, autoConfig, environment);
  const output = JSON.parse(result.body);
  const persisted = environment.storage[cdn.AUTO_STATE_KEY];

  assert.equal(output.data.dash.video[0].base_url, freshBackup);
  assert.equal(output.data.dash.video[0].backup_url[0], freshPrimary);
  assert.doesNotMatch(result.body, /old-primary|old-backup/);
  assert.doesNotMatch(
    persisted,
    /deadline|token=|upgcxcode|bilivideo|akamaized|1784897148/,
  );
});

test("safe JSON cache keys isolate video, audio, quality, codec, profile, and candidate set", () => {
  const fixture = videoFixture({ secondBackup: secondBackupUrl });
  fixture.data.dash.audio = [
    {
      backup_url: [backupUrl.replace("video.m4s", "audio.m4s")],
      bandwidth: 192000,
      base_url: originalUrl.replace("video.m4s", "audio.m4s"),
      codecid: 0,
      id: 30216,
      mime_type: "audio/mp4",
    },
  ];
  fixture.data.dash.video.push({
    ...fixture.data.dash.video[0],
    id: 64,
  });

  const state = cdn.createEmptyAutoState();
  const first = cdn.prepareSafeJson(
    JSON.stringify(fixture),
    autoConfig,
    state,
    1000,
  );
  const keys = first.descriptors.map((descriptor) => descriptor.resourceKey);
  assert.equal(first.descriptors.length, 3);
  assert.equal(new Set(keys).size, 3);
  assert.deepEqual(
    first.descriptors.map((descriptor) => descriptor.kind).sort(),
    ["audio", "video", "video"],
  );

  const codecFixture = videoFixture({ codec: 12, secondBackup: secondBackupUrl });
  const codecDescriptor = cdn.prepareSafeJson(
    JSON.stringify(codecFixture),
    autoConfig,
    state,
    1000,
  ).descriptors[0];
  assert.notEqual(codecDescriptor.resourceKey, keys[0]);

  const profileConfig = { ...autoConfig, networkProfile: "home_wifi" };
  const profileDescriptor = cdn.prepareSafeJson(
    JSON.stringify(fixture),
    profileConfig,
    state,
    1000,
  ).descriptors[0];
  assert.notEqual(profileDescriptor.resourceKey, keys[0]);

  const candidateFixture = videoFixture();
  const candidateDescriptor = cdn.prepareSafeJson(
    JSON.stringify(candidateFixture),
    autoConfig,
    state,
    1000,
  ).descriptors[0];
  assert.notEqual(candidateDescriptor.resourceKey, keys[0]);
});

test("safe auto never promotes across standard, MCDN, or PCDN families", () => {
  const mcdnUrl =
    `https://edge.mcdn.bilivideo.cn:4483${vodPath}?bvc=vod&token=mcdn`;
  const pcdnUrl =
    `https://edge-pcdn-1.biliapi.net${vodPath}?bvc=vod&token=pcdn`;
  const descriptor = cdn.buildMediaDescriptor(
    "json",
    "video",
    originalUrl,
    [mcdnUrl, pcdnUrl, backupUrl],
    "id=80",
  );

  assert.equal(cdn.candidateFamilyForUrl(originalUrl), "standard");
  assert.equal(cdn.candidateFamilyForUrl(mcdnUrl), "mcdn");
  assert.equal(cdn.candidateFamilyForUrl(pcdnUrl), "pcdn");
  assert.equal(descriptor.family, "standard");
  assert.deepEqual(
    descriptor.candidates.map((candidate) => candidate.url),
    [originalUrl, backupUrl],
  );
  assert.equal(
    cdn.buildMediaDescriptor(
      "json",
      "video",
      originalUrl,
      [mcdnUrl, pcdnUrl],
      "id=80",
    ),
    null,
  );
});

test("a cached video choice never changes audio or a different representation", () => {
  const fixture = videoFixture();
  fixture.data.dash.audio = [
    {
      backup_url: [backupUrl.replace("video.m4s", "audio.m4s")],
      base_url: originalUrl.replace("video.m4s", "audio.m4s"),
      id: 30216,
    },
  ];
  fixture.data.dash.video.push({
    ...fixture.data.dash.video[0],
    id: 64,
  });
  const now = 10_000;
  const state = cdn.createEmptyAutoState();
  const discovered = cdn.prepareSafeJson(
    JSON.stringify(fixture),
    autoConfig,
    state,
    now,
  );
  const selected = discovered.descriptors.find(
    (descriptor) => descriptor.kind === "video",
  );
  state.entries[selected.resourceKey] = descriptorStateEntry(
    selected,
    selected.candidates[1].id,
    now,
    now + 60_000,
  );

  const applied = cdn.prepareSafeJson(
    JSON.stringify(fixture),
    autoConfig,
    state,
    now + 1,
  );
  const output = JSON.parse(applied.body);
  assert.equal(output.data.dash.video[0].base_url, backupUrl);
  assert.equal(output.data.dash.video[1].base_url, originalUrl);
  assert.equal(
    output.data.dash.audio[0].base_url,
    originalUrl.replace("video.m4s", "audio.m4s"),
  );
});

test("expired cache entries stop applying before revalidation", () => {
  const input = JSON.stringify(videoFixture());
  const now = 20_000;
  const state = cdn.createEmptyAutoState();
  const discovered = cdn.prepareSafeJson(input, autoConfig, state, now);
  const descriptor = discovered.descriptors[0];
  state.entries[descriptor.resourceKey] = descriptorStateEntry(
    descriptor,
    descriptor.candidates[1].id,
    now - 10_000,
    now - 1,
  );

  const expired = cdn.prepareSafeJson(input, autoConfig, state, now);
  assert.equal(expired.changed, 0);
  assert.equal(expired.body, input);
});

test("strict probe validator rejects non-media, ignored ranges, redirects, encoding, and error bodies", () => {
  const candidate = { id: cdn.candidateIdForUrl(originalUrl), url: originalUrl };
  assert.equal(cdn.validateProbeResponse(validProbe(candidate), originalUrl).ok, true);
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, { status: 200 }),
      originalUrl,
    ).ok,
    false,
  );
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, {
        headers: { "Content-Type": "text/html" },
      }),
      originalUrl,
    ).ok,
    false,
  );
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, {
        headers: { "Content-Range": "bytes 1-16384/999999" },
      }),
      originalUrl,
    ).ok,
    false,
  );
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, {
        headers: { "Content-Encoding": "gzip" },
      }),
      originalUrl,
    ).ok,
    false,
  );
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, {
        body: Buffer.from("<html>AccessDenied</html>"),
        headers: {
          "Content-Length": "25",
          "Content-Range": "bytes 0-24/25",
          "Content-Type": "application/octet-stream",
        },
      }),
      originalUrl,
    ).ok,
    false,
  );
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, { url: backupUrl }),
      originalUrl,
    ).ok,
    false,
  );
});

test("probe throttling and per-resource locks prevent repeated hot-path tests", async () => {
  const input = JSON.stringify(videoFixture());
  const now = Date.UTC(2026, 6, 26, 12, 0, 0);
  const globallyThrottled = cdn.createEmptyAutoState();
  globallyThrottled.lastProbeAt = now;
  const globalEnvironment = makeEnvironment({ now, state: globallyThrottled });
  const globalResult = await processAuto(
    input,
    false,
    autoConfig,
    globalEnvironment,
  );
  assert.equal(globalResult.probed, false);
  assert.equal(globalEnvironment.calls.length, 0);

  const state = cdn.createEmptyAutoState();
  const descriptor = cdn.prepareSafeJson(
    input,
    autoConfig,
    state,
    now,
  ).descriptors[0];
  state.locks[descriptor.resourceKey] = now + 5000;
  const lockedEnvironment = makeEnvironment({ now, state });
  const lockedResult = await processAuto(
    input,
    false,
    autoConfig,
    lockedEnvironment,
  );
  assert.equal(lockedResult.probed, false);
  assert.equal(lockedEnvironment.calls.length, 0);
});

test("failed alternatives back off and state capacity is bounded", async () => {
  const input = JSON.stringify(videoFixture());
  const environment = makeEnvironment({
    responder(candidate) {
      return {
        body: "",
        elapsedMs: 2200,
        error: true,
        headers: {},
        status: 0,
        url: candidate.url,
      };
    },
  });
  const result = await processAuto(input, false, autoConfig, environment);
  const state = JSON.parse(environment.storage[cdn.AUTO_STATE_KEY]);
  const entry = Object.values(state.entries)[0];
  assert.equal(result.reason, "alternative-failed");
  assert.equal(entry.failureCount, 1);
  assert.equal(entry.nextProbeAt, environment.now + 30 * 60 * 1000);

  const oversized = cdn.createEmptyAutoState();
  for (let index = 0; index < cdn.AUTO_CACHE_CAPACITY + 10; index += 1) {
    const key = cdn.stableHash("r", `entry-${index}`);
    oversized.entries[key] = {
      ...descriptorStateEntry(
        {
          candidateSetHash: cdn.stableHash("s", `set-${index}`),
        },
        cdn.stableHash("c", `candidate-${index}`),
        index,
        999999,
      ),
      lastUsedAt: index,
    };
  }
  const capacityEnvironment = makeEnvironment({ state: oversized });
  const loaded = cdn.loadAutoState(capacityEnvironment.services);
  assert.equal(Object.keys(loaded.entries).length, cdn.AUTO_CACHE_CAPACITY);
});

test("safe Protobuf mode isolates DashVideo, DashItem audio, and ResponseUrl", () => {
  const audioPrimary = originalUrl.replace("video.m4s", "audio.m4s");
  const audioBackup = backupUrl.replace("video.m4s", "audio.m4s");
  const dashVideo = bytes(
    stringField(1, originalUrl),
    stringField(2, backupUrl),
    varintField(3, 1800000),
  );
  const dashAudio = bytes(
    varintField(1, 30216),
    stringField(2, audioPrimary),
    stringField(3, audioBackup),
    varintField(4, 192000),
  );
  const segment = bytes(
    varintField(1, 1),
    stringField(4, originalUrl),
    stringField(5, secondBackupUrl),
  );
  const input = grpcFrame(
    bytes(
      messageField(1, dashVideo),
      messageField(2, dashAudio),
      messageField(3, segment),
    ),
  );
  const now = 50_000;
  const state = cdn.createEmptyAutoState();
  const discovered = cdn.prepareSafeGrpc(input, autoConfig, state, now);

  assert.equal(discovered.valid, true);
  assert.equal(discovered.descriptors.length, 3);
  assert.deepEqual(
    discovered.descriptors.map((descriptor) => descriptor.kind),
    ["video", "audio", "segment"],
  );
  assert.equal(
    new Set(discovered.descriptors.map((descriptor) => descriptor.resourceKey))
      .size,
    3,
  );

  for (const descriptor of discovered.descriptors) {
    state.entries[descriptor.resourceKey] = descriptorStateEntry(
      descriptor,
      descriptor.candidates[1].id,
      now,
      now + 60_000,
    );
  }
  const applied = cdn.prepareSafeGrpc(input, autoConfig, state, now + 1);
  const output = asciiFromBinary(applied.body);
  assert.equal(applied.valid, true);
  assert.ok(applied.changed >= 3);
  assert.equal(output.split(backupHost).length - 1, 2);
  assert.equal(output.split(secondBackupHost).length - 1, 1);
  assert.equal(output.split(originalHost).length - 1, 3);
});

test("safe gRPC fails open for malformed input and never edits compressed frames", () => {
  const compressed = grpcFrame(
    bytes(stringField(1, originalUrl), stringField(2, backupUrl)),
    1,
  );
  const compressedResult = cdn.prepareSafeGrpc(
    compressed,
    autoConfig,
    cdn.createEmptyAutoState(),
    1,
  );
  assert.equal(compressedResult.valid, true);
  assert.equal(compressedResult.changed, 0);
  assert.equal(compressedResult.descriptors.length, 0);

  const malformed = new Uint8Array([0, 0, 0, 0, 20, 8, 1]);
  const malformedResult = cdn.prepareSafeGrpc(
    malformed,
    autoConfig,
    cdn.createEmptyAutoState(),
    1,
  );
  assert.equal(malformedResult.valid, false);
  assert.equal(malformedResult.changed, 0);
  assert.deepEqual(Buffer.from(malformedResult.body), Buffer.from(malformed));
});

test("safe auto fails open when persistence or HTTP services are unavailable", async () => {
  const input = JSON.stringify(videoFixture());
  const result = await new Promise((resolve) => {
    cdn.processSafeAutoResponse(input, false, autoConfig, null, resolve);
  });
  assert.equal(result.changed, 0);
  assert.equal(result.body, input);
  assert.equal(result.reason, "services-unavailable");
});

test("Shadowrocket fixed entrypoint returns only the changed JSON body", () => {
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

test("Shadowrocket auto entrypoint persists validation, then uses a fresh signed backup", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-cdn.js"),
    "utf8",
  );
  const storage = {};
  let clock = Date.UTC(2026, 6, 26, 12, 0, 0);

  function execute(body) {
    let completion;
    let call = 0;
    const context = {
      $argument: JSON.stringify({
        cdn: "auto",
        debug: false,
        intervalHours: 12,
        networkProfile: "auto",
        switchThreshold: 20,
      }),
      $done(value) {
        completion = value;
      },
      $httpClient: {
        get(request, callback) {
          call += 1;
          clock += call % 2 === 1 ? 100 : 40;
          callback(
            null,
            {
              headers: {
                "Content-Length": String(cdn.AUTO_RANGE_END + 1),
                "Content-Range": `bytes 0-${cdn.AUTO_RANGE_END}/9999999`,
                "Content-Type": "video/mp4",
              },
              status: 206,
              url: request.url,
            },
            "\x01".repeat(cdn.AUTO_RANGE_END + 1),
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
      $response: { body },
      ArrayBuffer,
      Boolean,
      clearTimeout,
      console,
      Date: { now: () => clock },
      decodeURIComponent,
      JSON,
      Math,
      Number,
      Object,
      RegExp,
      setTimeout,
      String,
      Uint8Array,
    };
    vm.runInNewContext(source, context, { filename: "bilibili-cdn.js" });
    return completion;
  }

  const input = JSON.stringify(videoFixture());
  const first = execute(input);
  assert.equal(Object.keys(first).length, 0);
  clock += cdn.AUTO_CONFIRM_DELAY_MS;
  const second = execute(input);
  assert.equal(Object.keys(second).length, 0);

  const freshPrimary = originalUrl.replace("old-primary", "runtime-primary");
  const freshBackup = backupUrl.replace("old-backup", "runtime-backup");
  const third = execute(
    JSON.stringify(videoFixture({ primary: freshPrimary, backup: freshBackup })),
  );
  assert.equal(typeof third.body, "string");
  const output = JSON.parse(third.body);
  assert.equal(output.data.dash.video[0].base_url, freshBackup);
  assert.equal(output.data.dash.video[0].backup_url[0], freshPrimary);
});

test("random malformed gRPC inputs never escape and never grow unbounded", () => {
  let seed = 0x12345678;
  function randomByte() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return seed & 0xff;
  }

  for (let iteration = 0; iteration < 2000; iteration += 1) {
    const length = randomByte();
    const input = new Uint8Array(length);
    for (let index = 0; index < input.length; index += 1) {
      input[index] = randomByte();
    }
    const result = cdn.prepareSafeGrpc(
      input,
      autoConfig,
      cdn.createEmptyAutoState(),
      iteration,
    );
    assert.ok(result && result.body);
    assert.ok(result.body.length <= Math.max(input.length * 2, input.length + 512));
  }
});
