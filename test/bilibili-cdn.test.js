"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { gunzipSync, gzipSync } = require("node:zlib");

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
const presentFixedConfig = {
  ...cdn.parseArgument(JSON.stringify({ cdn: backupHost, debug: false })),
  grpcAdapter: "playview-v1",
};
const autoConfig = cdn.parseArgument(
  JSON.stringify({
    cdn: "auto",
    debug: false,
    intervalHours: 12,
    networkProfile: "auto",
    probeMode: "blocking",
    switchThreshold: 20,
  }),
);
const grpcAutoConfig = { ...autoConfig, grpcAdapter: "playview-v1" };

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
  const rangeStart = candidate?.probeRange?.start ?? 0;
  const rangeEnd = candidate?.probeRange?.end ?? cdn.AUTO_RANGE_END;
  const rangeLength = rangeEnd - rangeStart + 1;
  const body =
    overrides.body === undefined
      ? Buffer.alloc(rangeLength, 1)
      : overrides.body;
  return {
    body,
    elapsedMs,
    error: false,
    headers: {
      "Content-Length": String(rangeLength),
      "Content-Range": `bytes ${rangeStart}-${rangeEnd}/9999999`,
      "Content-Type": "video/mp4",
      ...(overrides.headers || {}),
    },
    status: 206,
    url: candidate.url,
    ...overrides,
  };
}

function makeEnvironment({
  hostState,
  now = Date.UTC(2026, 6, 26, 12, 0, 0),
  responder,
  state,
} = {}) {
  let clock = now;
  const calls = [];
  const writes = [];
  const storage = {};
  if (state) {
    storage[cdn.AUTO_STATE_KEY] = JSON.stringify(state);
  }
  if (hostState) {
    storage[cdn.HOST_AUTO_STATE_KEY] = JSON.stringify(hostState);
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
        writes.push({ key, value });
        storage[key] = value;
        return true;
      },
    },
    storage,
    writes,
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

function recordHostProfileSamples(
  state,
  profile,
  hostname,
  {
    bucket = "normal-video",
    failures = 0,
    startupKbps = 24_000,
    startupTtfbMs = 40,
    sustainedKbps = 30_000,
    ttfbSeries,
  } = {},
  now = Date.UTC(2026, 7, 2, 12, 0, 0),
) {
  const objects = ["object-a", "object-b"];
  objects.forEach((object, objectIndex) => {
    const objectId = cdn.stableHash("o", `${profile}-${hostname}-${object}`);
    [0, 1].forEach((sampleIndex) => {
      const offset = objectIndex * 2 + sampleIndex;
      cdn.recordHostSample(
        state,
        profile,
        hostname,
        {
          at: now - (8 - offset) * 1_000,
          bucket,
          elapsedMs: startupTtfbMs + 25,
          objectId,
          ok: true,
          phase: "startup",
          status: 206,
          throughputKbps: startupKbps,
          ttfbMs: Array.isArray(ttfbSeries)
            ? ttfbSeries[offset % ttfbSeries.length]
            : startupTtfbMs,
        },
        now,
      );
      cdn.recordHostSample(
        state,
        profile,
        hostname,
        {
          at: now - (4 - offset) * 1_000,
          bucket,
          elapsedMs: 350,
          objectId,
          ok: true,
          phase: "sustained",
          status: 206,
          throughputKbps: sustainedKbps,
          ttfbMs: startupTtfbMs,
        },
        now,
      );
    });
  });
  for (let index = 0; index < failures; index += 1) {
    cdn.recordHostSample(
      state,
      profile,
      hostname,
      {
        at: now - index,
        bucket,
        elapsedMs: 5_000,
        objectId: cdn.stableHash("o", `${profile}-${hostname}-failure-${index}`),
        ok: false,
        phase: "startup",
        reason: "timeout",
        status: 0,
        throughputKbps: 0,
        ttfbMs: 5_000,
      },
      now,
    );
  }
}

test("normalizes arguments, defaults to safe auto, and isolates network profiles", () => {
  assert.equal(cdn.normalizeCdnHost(targetHost.toUpperCase()), targetHost);
  assert.equal(cdn.normalizeCdnHost(`https://${targetHost}/`), targetHost);
  assert.equal(cdn.normalizeCdnHost("off"), "");
  assert.equal(cdn.normalizeCdnHost("https://bad host/"), null);
  assert.equal(cdn.normalizeCdnHost("127.0.0.1"), null);
  assert.equal(cdn.normalizeCdnHost("cdn.attacker.example"), null);
  assert.equal(cdn.normalizeCdnHost("evil.ksyungslb.com"), null);
  assert.equal(cdn.normalizeCdnHost("upos-unknown.akamaized.net"), null);
  assert.equal(cdn.normalizeCdnHost(backupHost), backupHost);
  assert.equal(
    cdn.normalizeCdnHost("upos-sz-mirrorali.acgvideo.com"),
    "upos-sz-mirrorali.acgvideo.com",
  );
  assert.deepEqual(cdn.parseArgument(""), {
    auto: true,
    cdnHost: null,
    debug: false,
    intervalHours: 2,
    networkProfile: "auto",
    probeMode: "cron",
    resetToken: "",
    switchThreshold: 20,
    valid: true,
  });
  assert.deepEqual(fixedConfig, {
    auto: false,
    cdnHost: targetHost,
    debug: false,
    intervalHours: 2,
    networkProfile: "auto",
    probeMode: "cron",
    resetToken: "",
    switchThreshold: 20,
    valid: true,
  });
  assert.deepEqual(
    cdn.parseArgument("cdn=auto&profile=Home_WiFi&interval=1&threshold=99"),
    {
      auto: true,
      cdnHost: null,
      debug: false,
    intervalHours: 2,
    networkProfile: "home_wifi",
    probeMode: "cron",
      resetToken: "",
      switchThreshold: 80,
      valid: true,
    },
  );
  assert.equal(cdn.parseArgument("cdn=%").valid, false);
  assert.equal(cdn.normalizeNetworkProfile("../../secret"), "auto");
  assert.deepEqual(cdn.RUNTIME_OPTION_LIMITS, {
    intervalHours: { defaultValue: 2, maximum: 72, minimum: 2 },
    switchThreshold: { defaultValue: 20, maximum: 80, minimum: 10 },
  });
  assert.equal(cdn.parseArgument("probeMode=nonblocking").probeMode, "cron");
  assert.equal(cdn.isBilibiliMediaHost("edge.ksyungslb.com"), true);
  assert.equal(cdn.isAllowedFixedCdnHost("edge.ksyungslb.com"), false);
});

test("v10 host state is bounded, profile-isolated, and never migrates v8 selections", () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const oversized = {
    version: 10,
    resetToken: "reset_1",
    profiles: {},
    lock: { createdAt: now, expiresAt: now + 60_000, token: "lock_1" },
  };
  for (let profileIndex = 0; profileIndex < 6; profileIndex += 1) {
    const hosts = {};
    for (let hostIndex = 0; hostIndex < 20; hostIndex += 1) {
      const hostname = `probe-${profileIndex}-${hostIndex}.bilivideo.com`;
      hosts[hostname] = {
        lastUsedAt: now - hostIndex,
        objects: Array.from({ length: 8 }, (_, index) =>
          cdn.stableHash("o", `object-${index}`),
        ),
        samples: Array.from({ length: 12 }, (_, index) => ({
          at: now - index,
          elapsedMs: 100 + index,
          objectId: cdn.stableHash("o", `object-${index % 4}`),
          ok: true,
          status: 206,
          throughputKbps: 12_000 + index,
          ttfbMs: 20 + index,
        })),
      };
    }
    oversized.profiles[`profile_${profileIndex}`] = {
      challengerCursor: profileIndex,
      hosts,
      lastRunAt: now,
      nextRunAt: now + 1,
      rangeCursor: profileIndex,
      selectedAt: now,
      selectedHost: targetHost,
    };
  }

  const sanitized = cdn.sanitizeHostAutoState(oversized, now);
  assert.equal(sanitized.version, 10);
  assert.equal(Object.keys(sanitized.profiles).length, 4);
  for (const profile of Object.values(sanitized.profiles)) {
    assert.equal(Object.keys(profile.hosts).length, 16);
    for (const host of Object.values(profile.hosts)) {
      assert.ok(host.samples.length <= 8);
      assert.ok(host.objects.length <= 4);
    }
  }
  assert.deepEqual(
    cdn.loadHostAutoState({
      read(key) {
        if (key === cdn.AUTO_STATE_KEY) {
          return JSON.stringify(cdn.createEmptyAutoState());
        }
        return key === cdn.HOST_AUTO_STATE_KEY ? "{broken" : null;
      },
    }),
    cdn.createEmptyHostAutoState(),
  );
});

test("stable host selection uses p25 throughput, two objects, freshness, and circuit state", () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const state = cdn.createEmptyHostAutoState();
  const descriptor = cdn.buildMediaDescriptor(
    "json",
    "video",
    originalUrl,
    [backupUrl],
    "id=80",
    1_800_000,
  );
  [12_000, 18_000, 14_000, 16_000].forEach((throughputKbps, index) => {
    cdn.recordHostSample(
      state,
      "home_wifi",
      targetHost,
      {
        at: now - (3 - index) * 1_000,
        elapsedMs: 100 + index,
        objectId: cdn.stableHash("o", index < 2 ? "object-a" : "object-b"),
        ok: true,
        status: 206,
        throughputKbps,
        ttfbMs: 25 + index,
      },
      now,
    );
  });
  state.profiles.home_wifi.selectedHost = targetHost;
  state.profiles.home_wifi.selectedAt = now;

  const health = state.profiles.home_wifi.hosts[targetHost];
  assert.equal(health.metrics.p25ThroughputKbps, 12_000);
  assert.equal(health.metrics.objectCount, 2);
  assert.equal(
    cdn.selectStableHost(state, { networkProfile: "home_wifi" }, descriptor, now),
    targetHost,
  );
  assert.equal(
    cdn.selectStableHost(
      state,
      { networkProfile: "auto" },
      descriptor,
      now,
    ),
    "",
  );
  assert.equal(
    cdn.selectStableHost(
      state,
      { networkProfile: "home_wifi" },
      descriptor,
      now + 6 * 60 * 60 * 1000 + 1,
    ),
    "",
  );
  health.openUntil = now + 1;
  assert.equal(
    cdn.selectStableHost(state, { networkProfile: "home_wifi" }, descriptor, now),
    "",
  );
  assert.doesNotMatch(JSON.stringify(state), /upgcxcode|deadline=|token=/);
});

test("hostAuto v10 prefers lower startup TTFB after bandwidth eligibility", () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const state = cdn.createEmptyHostAutoState();
  const descriptor = cdn.buildMediaDescriptor(
    "json",
    "video",
    originalUrl,
    [backupUrl],
    "id=80&codecid=7&bandwidth=1800000",
    1_800_000,
  );
  recordHostProfileSamples(state, "wifi_lab", originalHost, {
    startupTtfbMs: 140,
    startupKbps: 35_000,
    sustainedKbps: 55_000,
  }, now);
  recordHostProfileSamples(state, "wifi_lab", targetHost, {
    startupTtfbMs: 22,
    startupKbps: 30_000,
    sustainedKbps: 45_000,
  }, now);
  state.profiles.wifi_lab.selectedHost = originalHost;
  state.profiles.wifi_lab.lastRunAt = now;

  assert.equal(
    cdn.selectStableHost(
      state,
      { networkProfile: "wifi_lab", switchThreshold: 10 },
      descriptor,
      now,
    ),
    targetHost,
  );
  const metrics = state.profiles.wifi_lab.hosts[targetHost].buckets["normal-video"].metrics;
  assert.equal(metrics.medianStartupTtfbMs, 22);
  assert.equal(metrics.p25SustainedThroughputKbps, 45_000);
});

test("hostAuto v10 rejects fast hosts with excessive failures or jitter", () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const state = cdn.createEmptyHostAutoState();
  const descriptor = cdn.buildMediaDescriptor(
    "json",
    "video",
    originalUrl,
    [backupUrl],
    "id=80",
    1_800_000,
  );
  recordHostProfileSamples(state, "wifi_lab", originalHost, {
    startupTtfbMs: 55,
    sustainedKbps: 30_000,
  }, now);
  recordHostProfileSamples(state, "wifi_lab", targetHost, {
    failures: 3,
    startupTtfbMs: 8,
    sustainedKbps: 90_000,
  }, now);
  recordHostProfileSamples(state, "wifi_lab", secondBackupHost, {
    startupTtfbMs: 20,
    sustainedKbps: 80_000,
    ttfbSeries: [5, 250, 5, 250],
  }, now);
  state.profiles.wifi_lab.lastRunAt = now;

  assert.equal(
    cdn.selectStableHost(
      state,
      { networkProfile: "wifi_lab", switchThreshold: 10 },
      descriptor,
      now,
    ),
    originalHost,
  );
});

test("switchThreshold prevents flapping but unhealthy selected hosts switch immediately", () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const state = cdn.createEmptyHostAutoState();
  const descriptor = cdn.buildMediaDescriptor(
    "json",
    "video",
    originalUrl,
    [backupUrl],
    "id=80",
    1_800_000,
  );
  recordHostProfileSamples(state, "wifi_lab", originalHost, {
    startupTtfbMs: 42,
    sustainedKbps: 35_000,
  }, now);
  recordHostProfileSamples(state, "wifi_lab", targetHost, {
    startupTtfbMs: 36,
    sustainedKbps: 36_000,
  }, now);
  state.profiles.wifi_lab.selectedHost = originalHost;
  state.profiles.wifi_lab.lastRunAt = now;

  assert.equal(
    cdn.selectStableHost(
      state,
      { networkProfile: "wifi_lab", switchThreshold: 20 },
      descriptor,
      now,
    ),
    originalHost,
  );
  state.profiles.wifi_lab.hosts[originalHost].openUntil = now + 60_000;
  assert.equal(
    cdn.selectStableHost(
      state,
      { networkProfile: "wifi_lab", switchThreshold: 20 },
      descriptor,
      now,
    ),
    targetHost,
  );
});

test("runtime network profiles hash stable identifiers and isolate Wi-Fi from cellular", () => {
  const wifi = cdn.resolveRuntimeNetworkProfile("auto", {
    networkInfo() {
      return { identifier: "Young Home WiFi", type: "wifi" };
    },
  });
  const cellular = cdn.resolveRuntimeNetworkProfile("auto", {
    networkInfo() {
      return { identifier: "Spark NZ", type: "cellular" };
    },
  });
  assert.match(wifi, /^wifi_[0-9a-f]{16}$/);
  assert.match(cellular, /^cellular_[0-9a-f]{16}$/);
  assert.doesNotMatch(wifi, /young|home/i);
  assert.notEqual(wifi, cellular);
  assert.equal(cdn.resolveRuntimeNetworkProfile("manual_profile", {}), "manual_profile");
});

test("audio, normal video, and high bitrate video select only their own performance bucket", () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const state = cdn.createEmptyHostAutoState();
  recordHostProfileSamples(state, "wifi_lab", targetHost, { bucket: "audio" }, now);
  recordHostProfileSamples(state, "wifi_lab", secondBackupHost, {
    bucket: "normal-video",
  }, now);
  recordHostProfileSamples(state, "wifi_lab", originalHost, {
    bucket: "high-bitrate-video",
    sustainedKbps: 55_000,
  }, now);
  state.profiles.wifi_lab.lastRunAt = now;
  const config = { networkProfile: "wifi_lab", switchThreshold: 10 };
  const audio = { kind: "audio", requiredKbps: 256 };
  const normal = { kind: "video", requiredKbps: 3_000 };
  const high = { kind: "video", requiredKbps: 12_000 };

  assert.equal(cdn.mediaBucketForDescriptor(audio), "audio");
  assert.equal(cdn.mediaBucketForDescriptor(normal), "normal-video");
  assert.equal(cdn.mediaBucketForDescriptor(high), "high-bitrate-video");
  assert.equal(cdn.selectStableHost(state, config, audio, now), targetHost);
  assert.equal(cdn.selectStableHost(state, config, normal, now), secondBackupHost);
  assert.equal(cdn.selectStableHost(state, config, high, now), originalHost);
});

test("default hot path performs zero probes and cold-promotes only a complete Akamai URL", async () => {
  const input = JSON.stringify(videoFixture());
  const environment = makeEnvironment();
  const config = cdn.parseArgument("");
  const result = await processAuto(input, false, config, environment);
  const output = JSON.parse(result.body).data.dash.video[0];

  assert.equal(result.reason, "cold-akamai");
  assert.equal(result.probeCount, 0);
  assert.equal(environment.calls.length, 0);
  assert.equal(environment.writes.length, 0);
  assert.equal(output.base_url, backupUrl);
  assert.deepEqual(output.backup_url, [originalUrl]);

  const withoutAkamai = JSON.stringify(videoFixture({ backup: secondBackupUrl }));
  const secondEnvironment = makeEnvironment();
  const unchanged = await processAuto(
    withoutAkamai,
    false,
    config,
    secondEnvironment,
  );
  assert.equal(unchanged.reason, "server-primary");
  assert.equal(unchanged.body, withoutAkamai);
  assert.equal(secondEnvironment.calls.length, 0);
  assert.equal(secondEnvironment.writes.length, 0);
});

test("a fresh two-object non-Akamai winner aliases a new signed object and preserves backups", async () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const state = cdn.createEmptyHostAutoState();
  ["object-a", "object-b"].forEach((object, index) => {
    cdn.recordHostSample(
      state,
      "auto",
      targetHost,
      {
        at: now - index * 1_000,
        elapsedMs: 80 + index,
        objectId: cdn.stableHash("o", object),
        ok: true,
        status: 206,
        throughputKbps: 30_000,
        ttfbMs: 20,
      },
      now,
    );
  });
  state.profiles.auto.selectedHost = targetHost;
  state.profiles.auto.selectedAt = now;
  const newPrimary = originalUrl.replace("video.m4s", "next-video.m4s");
  const newAkamai = backupUrl.replace("video.m4s", "next-video.m4s");
  const input = JSON.stringify(
    videoFixture({ primary: newPrimary, backup: newAkamai, secondBackup: secondBackupUrl }),
  );
  const environment = makeEnvironment({ hostState: state, now });
  const result = await processAuto(input, false, cdn.parseArgument(""), environment);
  const output = JSON.parse(result.body).data.dash.video[0];
  const expected = newPrimary.replace(originalHost, targetHost);

  assert.equal(result.reason, "host-auto-selected");
  assert.equal(environment.calls.length, 0);
  assert.equal(environment.writes.length, 0);
  assert.equal(output.base_url, expected);
  assert.deepEqual(output.backup_url, [newPrimary, newAkamai, secondBackupUrl]);
  assert.match(output.base_url, /token=old-primary$/);
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

test("fixed JSON mode promotes only a complete URL already returned for that media object", () => {
  const fixture = videoFixture();
  fixture.data.dash.audio = [
    {
      base_url: originalUrl.replace("video.m4s", "audio.m4s"),
      backup_url: [backupUrl.replace("video.m4s", "audio.m4s")],
    },
  ];
  fixture.data.durl = [{ url: originalUrl, backup_url: [backupUrl] }];

  const result = cdn.transformJsonText(
    JSON.stringify(fixture),
    presentFixedConfig,
  );
  const output = JSON.parse(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 8);
  assert.equal(output.data.dash.video[0].baseUrl, backupUrl);
  assert.equal(output.data.dash.video[0].base_url, backupUrl);
  assert.equal(
    output.data.dash.audio[0].base_url,
    backupUrl.replace("video.m4s", "audio.m4s"),
  );
  assert.equal(output.data.durl[0].url, backupUrl);
  assert.deepEqual(output.data.dash.video[0].backup_url, [originalUrl]);
  assert.deepEqual(output.data.dash.video[0].backupUrl, [originalUrl]);
  assert.deepEqual(output.data.dash.audio[0].backup_url, [
    originalUrl.replace("video.m4s", "audio.m4s"),
  ]);
  assert.deepEqual(output.data.durl[0].backup_url, [originalUrl]);
});

test("fixed JSON mode keeps camelCase and snake_case signatures in their own aliases", () => {
  const camelPrimary = originalUrl.replace("old-primary", "camel-primary");
  const snakePrimary = originalUrl.replace("old-primary", "snake-primary");
  const camelBackup = backupUrl.replace("old-backup", "camel-backup");
  const snakeBackup = backupUrl.replace("old-backup", "snake-backup");
  const fixture = videoFixture();
  const media = fixture.data.dash.video[0];
  media.baseUrl = camelPrimary;
  media.base_url = snakePrimary;
  media.backupUrl = [camelBackup];
  media.backup_url = [snakeBackup];

  const result = cdn.transformJsonText(
    JSON.stringify(fixture),
    presentFixedConfig,
  );
  const output = JSON.parse(result.body).data.dash.video[0];

  assert.equal(output.baseUrl, camelBackup);
  assert.equal(output.base_url, snakeBackup);
  assert.deepEqual(output.backupUrl, [camelPrimary]);
  assert.deepEqual(output.backup_url, [snakePrimary]);
  assert.doesNotMatch(output.baseUrl, /snake-/);
  assert.doesNotMatch(output.base_url, /camel-/);
});

test("fixed JSON mode fails open when the requested host is absent from any alias lane", () => {
  const fixture = videoFixture();
  fixture.data.dash.video[0].backupUrl = [backupUrl];
  fixture.data.dash.video[0].backup_url = [secondBackupUrl];
  const input = JSON.stringify(fixture);
  const result = cdn.transformJsonText(input, presentFixedConfig);

  assert.equal(result.changed, 0);
  assert.equal(result.body, input);
});

test("fixed Protobuf mode follows verified PlayView media field paths only", () => {
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
  const videoInfo = bytes(
    messageField(5, messageField(2, dashVideo)),
    messageField(5, messageField(3, messageField(1, responseUrl))),
    messageField(6, dashAudio),
  );
  const payload = messageField(1, videoInfo);
  const framed = grpcFrame(payload);
  const result = cdn.transformGrpcBody(framed, presentFixedConfig);
  const output = asciiFromBinary(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 6);
  assert.equal(output.split(backupHost).length - 1, 3);
  assert.equal(output.split(originalHost).length - 1, 3);
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

test("bounded gzip normalization enables fixed CDN rewriting for compressed gRPC", async () => {
  const responseUrl = bytes(
    varintField(1, 1),
    stringField(4, originalUrl),
    stringField(5, backupUrl),
  );
  const payload = messageField(
    1,
    messageField(5, messageField(3, messageField(1, responseUrl))),
  );
  const compressed = grpcFrame(
    new Uint8Array(gzipSync(payload)),
    1,
  );
  const decoded = await cdn.decompressGrpcFrames(compressed);

  assert.equal(decoded.valid, true);
  assert.equal(decoded.changed, true);
  assert.equal(decoded.body[0], 0);

  const discovered = cdn.prepareSafeGrpc(
    decoded.body,
    grpcAutoConfig,
    cdn.createEmptyAutoState(),
    0,
  );
  assert.equal(discovered.valid, true);
  assert.equal(discovered.descriptors.length, 1);

  const result = cdn.transformGrpcBody(decoded.body, presentFixedConfig);
  assert.equal(result.valid, true);
  assert.ok(result.changed >= 1);
  assert.match(asciiFromBinary(result.body), new RegExp(backupHost));
  assert.match(asciiFromBinary(result.body), new RegExp(originalHost));

  const malformed = grpcFrame(new Uint8Array([1, 2, 3, 4]), 1);
  const failed = await cdn.decompressGrpcFrames(malformed);
  assert.equal(failed.valid, false);
  assert.deepEqual(Buffer.from(failed.body), Buffer.from(malformed));
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
  assert.deepEqual(
    environment.calls.slice(0, 2).map(({ candidate }) => candidate.probeRange),
    [
      { start: 0, end: cdn.AUTO_EXPLORE_RANGE_END, phase: "explore" },
      { start: 0, end: cdn.AUTO_EXPLORE_RANGE_END, phase: "explore" },
    ],
  );
  assert.equal(
    environment.calls.slice(0, 2).reduce(
      (total, { candidate }) =>
        total + candidate.probeRange.end - candidate.probeRange.start + 1,
      0,
    ),
    512 * 1024,
  );

  environment.advance(cdn.AUTO_CONFIRM_DELAY_MS);
  const second = await processAuto(input, false, autoConfig, environment);
  assert.equal(second.changed, 0);
  assert.equal(second.body, input);
  assert.equal(second.reason, "alternative-confirmed");
  assert.equal(environment.calls.length, 4);
  const confirmationRanges = environment.calls
    .slice(2, 4)
    .map(({ candidate }) => candidate.probeRange);
  assert.equal(confirmationRanges[0].phase, "confirm");
  assert.ok(confirmationRanges[0].start > 0);
  assert.equal(
    confirmationRanges[0].end - confirmationRanges[0].start + 1,
    1024 * 1024,
  );
  assert.deepEqual(confirmationRanges[1], confirmationRanges[0]);

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

test("v7 never reuses a verified URL or signature across media objects", async () => {
  const firstInput = JSON.stringify(videoFixture());
  const environment = makeEnvironment({
    responder(candidate, callNumber) {
      return validProbe(candidate, callNumber % 2 === 1 ? 400 : 100);
    },
  });
  const firstDescriptor = cdn.prepareSafeJson(
    firstInput,
    autoConfig,
    cdn.createEmptyAutoState(),
    environment.now,
  ).descriptors[0];

  await processAuto(firstInput, false, autoConfig, environment);
  environment.advance(cdn.AUTO_CONFIRM_DELAY_MS);
  await processAuto(firstInput, false, autoConfig, environment);

  const nextPath = "/upgcxcode/99/88/778899/next-video.m4s";
  const nextPrimary = originalUrl
    .replace(vodPath, nextPath)
    .replace("old-primary", "next-primary");
  const nextBackup = backupUrl
    .replace(vodPath, nextPath)
    .replace("old-backup", "next-backup");
  const nextInput = JSON.stringify(
    videoFixture({ primary: nextPrimary, backup: nextBackup }),
  );
  const loadedState = cdn.loadAutoState(environment.services);
  const nextDescriptor = cdn.prepareSafeJson(
    nextInput,
    autoConfig,
    loadedState,
    environment.now,
  ).descriptors[0];
  const result = await processAuto(
    nextInput,
    false,
    autoConfig,
    environment,
  );
  const output = JSON.parse(result.body).data.dash.video[0];

  assert.equal(cdn.AUTO_STATE_KEY, "BiliCDN.safeAuto.v7");
  assert.notEqual(firstDescriptor.resourceKey, nextDescriptor.resourceKey);
  assert.equal(
    cdn.candidateIdForUrl(originalUrl),
    cdn.candidateIdForUrl(nextPrimary),
  );
  assert.notEqual(
    cdn.queryFreeCandidateFingerprint(originalUrl),
    cdn.queryFreeCandidateFingerprint(nextPrimary),
  );
  assert.equal(output.base_url, nextPrimary);
  assert.deepEqual(output.backup_url, [nextBackup]);
  assert.doesNotMatch(result.body, /old-primary|old-backup/);
  assert.doesNotMatch(
    environment.storage[cdn.AUTO_STATE_KEY],
    /upgcxcode|token=|bilivideo|akamaized/,
  );
});

test("safe auto applies a cached candidate with alias-local signed URLs only", () => {
  const fixture = videoFixture();
  const media = fixture.data.dash.video[0];
  const camelPrimary = originalUrl.replace("old-primary", "camel-current");
  const snakePrimary = originalUrl.replace("old-primary", "snake-current");
  const camelBackup = backupUrl.replace("old-backup", "camel-current");
  const snakeBackup = backupUrl.replace("old-backup", "snake-current");
  media.baseUrl = camelPrimary;
  media.base_url = snakePrimary;
  media.backupUrl = [camelBackup];
  media.backup_url = [snakeBackup];
  const input = JSON.stringify(fixture);
  const now = 50_000;
  const state = cdn.createEmptyAutoState();
  const descriptor = cdn.prepareSafeJson(
    input,
    autoConfig,
    state,
    now,
  ).descriptors[0];
  state.entries[descriptor.resourceKey] = descriptorStateEntry(
    descriptor,
    descriptor.candidates[1].id,
    now,
    now + 60_000,
  );

  const applied = cdn.prepareSafeJson(input, autoConfig, state, now + 1);
  const output = JSON.parse(applied.body).data.dash.video[0];
  assert.equal(output.baseUrl, camelBackup);
  assert.equal(output.base_url, snakeBackup);
  assert.deepEqual(output.backupUrl, [camelPrimary]);
  assert.deepEqual(output.backup_url, [snakePrimary]);
  assert.doesNotMatch(output.baseUrl, /snake-/);
  assert.doesNotMatch(output.base_url, /camel-/);
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

test("strict probe validator accepts an exact interior sample and rejects shifted or truncated ranges", () => {
  const range = {
    start: 2 * 1024 * 1024,
    end: 3 * 1024 * 1024 - 1,
    phase: "confirm",
  };
  const candidate = {
    id: cdn.candidateIdForUrl(originalUrl),
    probeRange: range,
    url: originalUrl,
  };
  const valid = validProbe(candidate);

  assert.equal(
    cdn.validateProbeResponse(valid, originalUrl, range).ok,
    true,
  );
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, {
        headers: {
          "Content-Length": String(1024 * 1024),
          "Content-Range": `bytes ${range.start + 1}-${range.end + 1}/9999999`,
          "Content-Type": "video/mp4",
        },
      }),
      originalUrl,
      range,
    ).ok,
    false,
  );
  assert.equal(
    cdn.validateProbeResponse(
      validProbe(candidate, 100, {
        body: Buffer.alloc(512 * 1024, 1),
        headers: {
          "Content-Length": String(512 * 1024),
          "Content-Range": `bytes ${range.start}-${range.start + 512 * 1024 - 1}/9999999`,
          "Content-Type": "video/mp4",
        },
      }),
      originalUrl,
      range,
    ).ok,
    false,
  );
});

test("probe scoring uses sustained sample throughput and a 1 MiB range", () => {
  const primary = {
    candidateId: cdn.candidateIdForUrl(originalUrl),
    elapsedMs: 100,
    ok: true,
    throughputKbps: 900,
  };
  const alternative = {
    candidateId: cdn.candidateIdForUrl(backupUrl),
    elapsedMs: 140,
    ok: true,
    throughputKbps: 1800,
  };
  const entry = {
    scores: {
      [primary.candidateId]: {
        metrics: {
          failureRate: 0,
          jitterMs: 8,
          medianMs: 100,
          medianThroughputKbps: 900,
          sampleCount: 3,
          successCount: 3,
        },
      },
      [alternative.candidateId]: {
        metrics: {
          failureRate: 0,
          jitterMs: 12,
          medianMs: 140,
          medianThroughputKbps: 1800,
          sampleCount: 3,
          successCount: 3,
        },
      },
    },
  };

  assert.equal(cdn.AUTO_RANGE_END, 1048575);
  assert.equal(
    cdn.alternativeQualifies(
      primary,
      alternative,
      { switchThreshold: 20 },
      entry,
    ),
    true,
  );

  const unstableEntry = {
    scores: {
      [alternative.candidateId]: {
        metrics: {
          failureRate: 0,
          jitterMs: 80,
          medianMs: 120,
          medianThroughputKbps: 1800,
          sampleCount: 2,
          successCount: 2,
        },
      },
    },
  };
  assert.equal(
    cdn.alternativeQualifies(
      primary,
      alternative,
      { switchThreshold: 20 },
      unstableEntry,
    ),
    false,
  );
});

test("auto promotion requires representation-aware sustained throughput headroom", () => {
  const descriptor = cdn.buildMediaDescriptor(
    "json",
    "video",
    originalUrl,
    [backupUrl],
    "id=80&bandwidth=4000000",
    4000000,
  );
  const primary = {
    candidateId: cdn.candidateIdForUrl(originalUrl),
    elapsedMs: 1000,
    ok: true,
    throughputKbps: 1000,
  };
  const tooSlow = {
    candidateId: cdn.candidateIdForUrl(backupUrl),
    elapsedMs: 200,
    ok: true,
    throughputKbps: 5000,
  };
  const sufficient = {
    ...tooSlow,
    elapsedMs: 150,
    throughputKbps: 6000,
  };

  assert.equal(descriptor.requiredKbps, 5400);
  assert.equal(
    cdn.alternativeQualifies(
      primary,
      tooSlow,
      { switchThreshold: 20 },
      { scores: {} },
      descriptor,
    ),
    false,
  );
  assert.equal(
    cdn.alternativeQualifies(
      primary,
      sufficient,
      { switchThreshold: 20 },
      { scores: {} },
      descriptor,
    ),
    true,
  );
});

test("pair validation rejects different samples and different total lengths", async () => {
  for (const mismatch of ["hash", "length"]) {
    const environment = makeEnvironment({
      responder(candidate, callNumber) {
        if (callNumber === 1) {
          return validProbe(candidate, 100);
        }
        if (mismatch === "hash") {
          return validProbe(candidate, 40, {
            body: Buffer.alloc(
              candidate.probeRange.end - candidate.probeRange.start + 1,
              2,
            ),
          });
        }
        const { start, end } = candidate.probeRange;
        return validProbe(candidate, 40, {
          headers: {
            "Content-Length": String(end - start + 1),
            "Content-Range": `bytes ${start}-${end}/10000000`,
            "Content-Type": "video/mp4",
          },
        });
      },
    });
    const result = await processAuto(
      JSON.stringify(videoFixture()),
      false,
      autoConfig,
      environment,
    );
    const state = JSON.parse(environment.storage[cdn.AUTO_STATE_KEY]);
    const entry = Object.values(state.entries)[0];
    assert.equal(result.reason, "object-mismatch");
    assert.equal(entry.candidateId, null);
    assert.equal(entry.pendingCandidateId, null);
  }
});

test("a matching cached prefix cannot promote a CDN whose interior sample differs", async () => {
  const input = JSON.stringify(videoFixture());
  const environment = makeEnvironment({
    responder(candidate, callNumber) {
      const deepAlternative =
        callNumber === 4 && candidate.probeRange.start > 0;
      return validProbe(candidate, callNumber % 2 === 1 ? 100 : 40, {
        body: Buffer.alloc(
          candidate.probeRange.end - candidate.probeRange.start + 1,
          deepAlternative ? 2 : 1,
        ),
      });
    },
  });

  const prefix = await processAuto(input, false, autoConfig, environment);
  assert.equal(prefix.reason, "alternative-pending");
  environment.advance(cdn.AUTO_CONFIRM_DELAY_MS);
  const interior = await processAuto(input, false, autoConfig, environment);
  const state = JSON.parse(environment.storage[cdn.AUTO_STATE_KEY]);
  const entry = Object.values(state.entries)[0];

  assert.equal(interior.reason, "object-mismatch");
  assert.ok(environment.calls[2].candidate.probeRange.start > 0);
  assert.deepEqual(
    environment.calls[3].candidate.probeRange,
    environment.calls[2].candidate.probeRange,
  );
  assert.equal(entry.candidateId, null);
  assert.equal(entry.pendingCandidateId, null);
});

test("legacy nonblocking input maps to cron and never schedules a hot-path probe", () => {
  const input = JSON.stringify(videoFixture());
  const callbacks = [];
  const storage = {};
  const now = Date.UTC(2026, 6, 28, 12, 0, 0);
  let completion;
  let completionCount = 0;
  const config = cdn.parseArgument(
    "cdn=auto&probeMode=nonblocking&intervalHours=12",
  );
  const services = {
    now: () => now,
    persistent: true,
    probe(candidate, timeoutMs, callback) {
      callbacks.push({ callback, candidate, timeoutMs });
    },
    read(key) {
      return storage[key] || null;
    },
    write(value, key) {
      storage[key] = value;
      return true;
    },
  };

  cdn.processSafeAutoResponse(input, false, config, services, (result) => {
    completion = result;
    completionCount += 1;
  });
  assert.equal(completionCount, 1);
  assert.equal(completion.reason, "cold-akamai");
  assert.equal(completion.scriptElapsedMs, 0);
  assert.ok(completion.candidateCount >= 2);
  assert.equal(completion.candidateFamilies, "standard");
  assert.equal(completion.probeSummary, "none");
  assert.equal(callbacks.length, 0);
  assert.equal(completionCount, 1);
  assert.equal(storage[cdn.AUTO_STATE_KEY], undefined);
});

test("off mode disables learning but still uses the complete Akamai cold fallback", () => {
  const input = JSON.stringify(videoFixture());
  const now = 75_000;
  const state = cdn.createEmptyAutoState();
  const offConfig = cdn.parseArgument(
    "cdn=auto&probeMode=off&intervalHours=72",
  );
  const descriptor = cdn.prepareSafeJson(
    input,
    offConfig,
    state,
    now,
  ).descriptors[0];
  state.entries[descriptor.resourceKey] = descriptorStateEntry(
    descriptor,
    descriptor.candidates[1].id,
    now,
    now + 72 * 60 * 60 * 1000,
  );
  const environment = makeEnvironment({ now, state });
  let result;
  cdn.processSafeAutoResponse(
    input,
    false,
    offConfig,
    environment.services,
    (value) => {
      result = value;
    },
  );

  assert.equal(result.reason, "cold-akamai");
  assert.equal(result.probeCount, 0);
  assert.ok(result.candidateCount >= 2);
  assert.equal(result.candidateFamilies, "standard");
  assert.equal(result.probeSummary, "none");
  assert.equal(environment.calls.length, 0);
  assert.equal(
    JSON.parse(result.body).data.dash.video[0].base_url,
    backupUrl,
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

test("a failed CDN host is circuit-broken across media objects without sharing URLs", async () => {
  let failAlternative = true;
  const environment = makeEnvironment({
    responder(candidate) {
      if (
        failAlternative &&
        candidate.id === cdn.candidateIdForUrl(backupUrl)
      ) {
        return {
          body: "",
          elapsedMs: 5000,
          error: true,
          headers: {},
          status: 0,
          url: candidate.url,
        };
      }
      return validProbe(
        candidate,
        candidate.id === cdn.candidateIdForUrl(originalUrl) ? 500 : 100,
      );
    },
  });
  const firstInput = JSON.stringify(videoFixture());
  const first = await processAuto(
    firstInput,
    false,
    autoConfig,
    environment,
  );
  const storedAfterFailure = JSON.parse(
    environment.storage[cdn.AUTO_STATE_KEY],
  );
  const hostHealth =
    storedAfterFailure.hosts[cdn.candidateIdForUrl(backupUrl)];

  assert.equal(first.reason, "alternative-failed");
  assert.ok(hostHealth.openUntil > environment.now);
  assert.doesNotMatch(
    environment.storage[cdn.AUTO_STATE_KEY],
    /bilivideo|akamaized|upgcxcode|token=|deadline=/,
  );

  const nextPath = "/upgcxcode/44/55/665544/next.m4s";
  const nextInput = JSON.stringify(
    videoFixture({
      primary: originalUrl.replace(vodPath, nextPath),
      backup: backupUrl.replace(vodPath, nextPath),
    }),
  );
  environment.advance(cdn.AUTO_GLOBAL_PROBE_GAP_MS);
  const callsBeforeCircuitCheck = environment.calls.length;
  const circuitResult = await processAuto(
    nextInput,
    false,
    autoConfig,
    environment,
  );
  assert.equal(circuitResult.reason, "no-alternative");
  assert.equal(environment.calls.length, callsBeforeCircuitCheck);
  assert.equal(circuitResult.body, nextInput);

  failAlternative = false;
  environment.advance(cdn.AUTO_HOST_BACKOFF_BASE_MS);
  const retried = await processAuto(
    nextInput,
    false,
    autoConfig,
    environment,
  );
  assert.equal(retried.reason, "alternative-pending");
  assert.equal(environment.calls.length, callsBeforeCircuitCheck + 2);
});

test("probe mode falls back to the server URL when a selection is stale", () => {
  const input = JSON.stringify(videoFixture());
  const now = Date.UTC(2026, 6, 30, 8, 0, 0);
  const state = cdn.createEmptyAutoState();
  const descriptor = cdn.prepareSafeJson(
    input,
    autoConfig,
    state,
    now,
  ).descriptors[0];
  state.entries[descriptor.resourceKey] = descriptorStateEntry(
    descriptor,
    descriptor.candidates[1].id,
    now - cdn.AUTO_SELECTED_REVALIDATE_MS,
    now + 12 * 60 * 60 * 1000,
  );

  const probing = cdn.prepareSafeJson(
    input,
    autoConfig,
    state,
    now,
  );
  const cacheOnly = cdn.prepareSafeJson(
    input,
    { ...autoConfig, probeMode: "off" },
    state,
    now,
  );

  assert.equal(probing.changed, 0);
  assert.equal(probing.body, input);
  assert.equal(
    JSON.parse(cacheOnly.body).data.dash.video[0].base_url,
    backupUrl,
  );
});

test("corrupted state fails open and a changed reset token clears v10 learning exactly once", async () => {
  const input = JSON.stringify(videoFixture());
  const environment = makeEnvironment();
  environment.storage[cdn.AUTO_STATE_KEY] = "{corrupted";
  assert.deepEqual(
    cdn.loadAutoState(environment.services),
    cdn.createEmptyAutoState(),
  );

  environment.storage[cdn.HOST_AUTO_STATE_KEY] = "{corrupted";
  assert.deepEqual(
    cdn.loadHostAutoState(environment.services),
    cdn.createEmptyHostAutoState(),
  );
  const populated = cdn.createEmptyHostAutoState();
  populated.profiles.auto = {
    challengerCursor: 1,
    hosts: {},
    lastRunAt: environment.now,
    nextRunAt: environment.now + 60_000,
    rangeCursor: 1,
    selectedAt: environment.now,
    selectedHost: targetHost,
  };
  environment.storage[cdn.HOST_AUTO_STATE_KEY] = JSON.stringify(populated);
  const resetConfig = cdn.parseArgument(
    "cdn=auto&probeMode=off&resetToken=reset_20260728",
  );
  await processAuto(input, false, resetConfig, environment);
  const reset = JSON.parse(environment.storage[cdn.HOST_AUTO_STATE_KEY]);
  assert.equal(reset.resetToken, "reset_20260728");
  assert.deepEqual(reset.profiles, {});
  assert.equal(environment.writes.length, 1);

  reset.profiles.auto = { ignored: true };
  environment.storage[cdn.HOST_AUTO_STATE_KEY] = JSON.stringify(reset);
  await processAuto(input, false, resetConfig, environment);
  const repeated = JSON.parse(environment.storage[cdn.HOST_AUTO_STATE_KEY]);
  assert.equal(repeated.resetToken, "reset_20260728");
  assert.equal(environment.writes.length, 1);
});

test("v7 ignores older learned selections instead of reusing prefix-only validation", () => {
  const oldState = {
    entries: {
      r2_0123456789abcdef0123456789abcdef: {
        candidateId: "c2_0123456789abcdef0123456789abcdef",
        expiresAt: Date.now() + 60_000,
      },
    },
    hosts: {},
    lastProbeAt: 1,
    locks: {},
    version: 6,
  };
  const loaded = cdn.loadAutoState({
    read(key) {
      return key === cdn.AUTO_STATE_KEY
        ? JSON.stringify(oldState)
        : null;
    },
  });

  assert.equal(loaded.version, 7);
  assert.deepEqual(loaded.entries, {});
  assert.equal(loaded.lastProbeAt, 0);
});

test("configured interval is the exact selection TTL with bounded revalidation", async () => {
  const config = cdn.parseArgument(
    "cdn=auto&probeMode=blocking&intervalHours=72&switchThreshold=20",
  );
  const environment = makeEnvironment({
    responder(candidate, callNumber) {
      return validProbe(candidate, callNumber % 2 === 1 ? 100 : 40);
    },
  });
  const input = JSON.stringify(videoFixture());
  await processAuto(input, false, config, environment);
  environment.advance(cdn.AUTO_CONFIRM_DELAY_MS);
  const confirmedAt = environment.now;
  await processAuto(input, false, config, environment);
  const state = JSON.parse(environment.storage[cdn.AUTO_STATE_KEY]);
  const entry = Object.values(state.entries)[0];
  assert.equal(entry.expiresAt, confirmedAt + 72 * 60 * 60 * 1000);
  assert.equal(
    entry.nextProbeAt,
    confirmedAt + cdn.AUTO_SELECTED_REVALIDATE_MS,
  );
  assert.ok(entry.nextProbeAt < entry.expiresAt);
});

test("selected CDN degradation is revalidated and cleared after eight minutes", async () => {
  const input = JSON.stringify(videoFixture());
  let selectedShouldFail = false;
  const environment = makeEnvironment({
    responder(candidate) {
      if (
        selectedShouldFail &&
        candidate.id === cdn.candidateIdForUrl(backupUrl)
      ) {
        return {
          body: "",
          elapsedMs: 5000,
          error: true,
          headers: {},
          status: 0,
          url: candidate.url,
        };
      }
      return validProbe(
        candidate,
        candidate.id === cdn.candidateIdForUrl(originalUrl)
          ? 100
          : 40,
      );
    },
  });

  await processAuto(input, false, autoConfig, environment);
  environment.advance(cdn.AUTO_CONFIRM_DELAY_MS);
  await processAuto(input, false, autoConfig, environment);
  const confirmationRange = {
    ...environment.calls[2].candidate.probeRange,
  };
  let state = JSON.parse(environment.storage[cdn.AUTO_STATE_KEY]);
  let entry = Object.values(state.entries)[0];
  assert.equal(entry.candidateId, cdn.candidateIdForUrl(backupUrl));

  environment.advance(cdn.AUTO_SELECTED_REVALIDATE_MS);
  selectedShouldFail = true;
  const failed = await processAuto(
    input,
    false,
    autoConfig,
    environment,
  );
  state = JSON.parse(environment.storage[cdn.AUTO_STATE_KEY]);
  entry = Object.values(state.entries)[0];

  assert.equal(failed.reason, "selected-failed");
  assert.ok(environment.calls[4].candidate.probeRange.start > 0);
  assert.notEqual(
    environment.calls[4].candidate.probeRange.start,
    confirmationRange.start,
  );
  assert.deepEqual(
    environment.calls[5].candidate.probeRange,
    environment.calls[4].candidate.probeRange,
  );
  assert.equal(entry.candidateId, null);
  assert.equal(entry.expiresAt, 0);
  assert.equal(entry.nextProbeAt, environment.now + 30 * 60 * 1000);

  const fallback = await processAuto(
    input,
    false,
    autoConfig,
    environment,
  );
  assert.equal(fallback.changed, 0);
  assert.equal(fallback.body, input);
  assert.equal(fallback.reason, "cache-or-throttle");
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
    messageField(
      1,
      bytes(
        messageField(5, messageField(2, dashVideo)),
        messageField(5, messageField(3, messageField(1, segment))),
        messageField(6, dashAudio),
      ),
    ),
  );
  const now = 50_000;
  const state = cdn.createEmptyAutoState();
  const discovered = cdn.prepareSafeGrpc(
    input,
    grpcAutoConfig,
    state,
    now,
  );

  assert.equal(discovered.valid, true);
  assert.equal(discovered.descriptors.length, 3);
  assert.deepEqual(
    discovered.descriptors.map((descriptor) => descriptor.kind),
    ["video", "segment", "audio"],
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
  const applied = cdn.prepareSafeGrpc(
    input,
    grpcAutoConfig,
    state,
    now + 1,
  );
  const output = asciiFromBinary(applied.body);
  assert.equal(applied.valid, true);
  assert.ok(applied.changed >= 3);
  assert.equal(output.split(backupHost).length - 1, 2);
  assert.equal(output.split(secondBackupHost).length - 1, 1);
  assert.equal(output.split(originalHost).length - 1, 3);
});

test("default gRPC hot path cold-falls back without probes and aliasing retains the original URL", async () => {
  const now = Date.UTC(2026, 7, 2, 12, 0, 0);
  const dashVideo = bytes(
    stringField(1, originalUrl),
    stringField(2, backupUrl),
    varintField(3, 1_800_000),
  );
  const input = grpcFrame(
    messageField(1, messageField(5, messageField(2, dashVideo))),
  );
  const config = {
    ...cdn.parseArgument(""),
    grpcAdapter: "app-playurl-v1",
  };
  const coldEnvironment = makeEnvironment({ now });
  const cold = await processAuto(input, true, config, coldEnvironment);
  const coldText = asciiFromBinary(cold.body);
  assert.equal(cold.reason, "cold-akamai");
  assert.equal(coldEnvironment.calls.length, 0);
  assert.equal(coldEnvironment.writes.length, 0);
  assert.match(coldText, new RegExp(backupHost));
  assert.match(coldText, new RegExp(originalHost));

  const state = cdn.createEmptyHostAutoState();
  ["grpc-object-a", "grpc-object-b"].forEach((object, index) => {
    cdn.recordHostSample(
      state,
      "auto",
      targetHost,
      {
        at: now - index,
        elapsedMs: 75,
        objectId: cdn.stableHash("o", object),
        ok: true,
        status: 206,
        throughputKbps: 32_000,
        ttfbMs: 18,
      },
      now,
    );
  });
  state.profiles.auto.selectedHost = targetHost;
  state.profiles.auto.selectedAt = now;
  const aliasEnvironment = makeEnvironment({ hostState: state, now });
  const aliased = await processAuto(input, true, config, aliasEnvironment);
  const aliasText = asciiFromBinary(aliased.body);
  assert.equal(aliased.reason, "host-auto-selected");
  assert.equal(aliasEnvironment.calls.length, 0);
  assert.equal(aliasEnvironment.writes.length, 0);
  assert.match(aliasText, new RegExp(targetHost));
  assert.match(aliasText, new RegExp(originalHost));
  assert.match(aliasText, new RegExp(backupHost));
});

test("safe gRPC fails open for malformed input and never edits compressed frames", () => {
  const compressed = grpcFrame(
    bytes(stringField(1, originalUrl), stringField(2, backupUrl)),
    1,
  );
  const compressedResult = cdn.prepareSafeGrpc(
    compressed,
    grpcAutoConfig,
    cdn.createEmptyAutoState(),
    1,
  );
  assert.equal(compressedResult.valid, true);
  assert.equal(compressedResult.changed, 0);
  assert.equal(compressedResult.descriptors.length, 0);

  const malformed = new Uint8Array([0, 0, 0, 0, 20, 8, 1]);
  const malformedResult = cdn.prepareSafeGrpc(
    malformed,
    grpcAutoConfig,
    cdn.createEmptyAutoState(),
    1,
  );
  assert.equal(malformedResult.valid, false);
  assert.equal(malformedResult.changed, 0);
  assert.deepEqual(Buffer.from(malformedResult.body), Buffer.from(malformed));
});

test("gRPC adapters preserve PGC v2 unknown field 9 and support multi-frame uint64", () => {
  const unsafeUint64 = bytes(
    fieldTag(99, 0),
    new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 1]),
  );
  const losslessAudio = bytes(
    varintField(1, 30251),
    stringField(2, originalUrl.replace("video.m4s", "lossless.m4s")),
    stringField(3, backupUrl.replace("video.m4s", "lossless.m4s")),
    unsafeUint64,
  );
  const fieldNineReply = grpcFrame(
    messageField(1, messageField(9, messageField(2, losslessAudio))),
  );
  const pgc = cdn.prepareSafeGrpc(
    fieldNineReply,
    { ...autoConfig, grpcAdapter: "pgc-v2" },
    cdn.createEmptyAutoState(),
    1,
  );
  const app = cdn.prepareSafeGrpc(
    fieldNineReply,
    { ...autoConfig, grpcAdapter: "app-playurl-v1" },
    cdn.createEmptyAutoState(),
    1,
  );
  assert.equal(pgc.descriptors.length, 0);
  assert.equal(app.descriptors.length, 1);
  assert.deepEqual(Buffer.from(pgc.body), Buffer.from(fieldNineReply));

  const dashVideo = bytes(
    stringField(1, originalUrl),
    stringField(2, backupUrl),
    unsafeUint64,
  );
  const firstFrame = grpcFrame(
    messageField(1, messageField(5, messageField(2, dashVideo))),
  );
  const secondFrame = grpcFrame(
    messageField(1, stringField(99, "future-frame-must-stay")),
  );
  const multiFrame = bytes(firstFrame, secondFrame);
  const discovered = cdn.prepareSafeGrpc(
    multiFrame,
    { ...autoConfig, grpcAdapter: "app-playurl-v1" },
    cdn.createEmptyAutoState(),
    10,
  );
  const state = cdn.createEmptyAutoState();
  const descriptor = discovered.descriptors[0];
  state.entries[descriptor.resourceKey] = descriptorStateEntry(
    descriptor,
    descriptor.candidates[1].id,
    10,
    1000,
  );
  const applied = cdn.prepareSafeGrpc(
    multiFrame,
    { ...autoConfig, grpcAdapter: "app-playurl-v1" },
    state,
    11,
  );
  const output = Buffer.from(applied.body);
  assert.ok(applied.changed > 0);
  assert.match(output.toString("latin1"), /future-frame-must-stay/);
  assert.ok(output.includes(Buffer.from(unsafeUint64)));
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
    $argument: JSON.stringify({ cdn: backupHost, debug: false }),
    $done(value) {
      completion = value;
    },
    $request: {
      url: "https://api.bilibili.com/x/player/playurl?bvid=test",
    },
    $response: {
      body: JSON.stringify({
        code: 0,
        data: { durl: [{ backup_url: [backupUrl], url: originalUrl }] },
      }),
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
  assert.match(completion.body, new RegExp(backupHost));
  assert.match(completion.body, /token=old-backup/);
});

test("Shadowrocket gRPC entrypoint prefers bodyBytes and decodes gzip", async () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-cdn.js"),
    "utf8",
  );
  const responseUrl = bytes(
    varintField(1, 1),
    stringField(4, originalUrl),
    stringField(5, backupUrl),
  );
  const payload = messageField(
    1,
    messageField(5, messageField(3, messageField(1, responseUrl))),
  );
  const input = grpcFrame(
    new Uint8Array(gzipSync(payload)),
    1,
  );
  let completion;
  const completed = new Promise((resolve) => {
    const context = {
      $argument: JSON.stringify({ cdn: backupHost, debug: false }),
      $done(value) {
        completion = value;
        resolve();
      },
      $request: {
        url: "https://grpc.biliapi.net/bilibili.app.playurl.v1.PlayURL/PlayView",
      },
      $response: {
        body: "text-body-must-not-win",
        headers: { "grpc-encoding": "gzip" },
        bodyBytes: input.buffer.slice(
          input.byteOffset,
          input.byteOffset + input.byteLength,
        ),
      },
      $utils: {
        ungzip(value) {
          return new Uint8Array(gunzipSync(new Uint8Array(value)));
        },
      },
      ArrayBuffer,
      Boolean,
      console,
      decodeURIComponent,
      JSON,
      Math,
      Number,
      Object,
      Promise,
      RegExp,
      String,
      Uint8Array,
    };
    vm.runInNewContext(source, context, {
      filename: "bilibili-cdn.js",
    });
  });

  await completed;
  assert.ok(completion && completion.body);
  assert.equal(new Uint8Array(completion.body)[0], 0);
  assert.match(
    asciiFromBinary(completion.body),
    new RegExp(backupHost),
  );
  assert.doesNotMatch(
    asciiFromBinary(completion.body),
    /text-body-must-not-win/,
  );
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
        probeMode: "blocking",
        switchThreshold: 20,
      }),
      $done(value) {
        completion = value;
      },
      $httpClient: {
        get(request, callback) {
          call += 1;
          clock += call % 2 === 1 ? 100 : 40;
          const range = /^bytes=(\d+)-(\d+)$/.exec(
            request.headers.Range,
          );
          const rangeStart = Number(range[1]);
          const rangeEnd = Number(range[2]);
          const rangeLength = rangeEnd - rangeStart + 1;
          callback(
            null,
            {
              headers: {
                "Content-Length": String(rangeLength),
                "Content-Range": `bytes ${rangeStart}-${rangeEnd}/9999999`,
                "Content-Type": "video/mp4",
              },
              status: 206,
              url: request.url,
            },
            "\x01".repeat(rangeLength),
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
