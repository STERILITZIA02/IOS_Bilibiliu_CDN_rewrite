"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const cdn = require("../src/bilibili-cdn.js");
const benchmark = require("../src/bilibili-cdn-benchmark.js");

const primaryHost = "upos-sz-mirrorcosov.bilivideo.com";
const akamaiHost = "upos-hz-mirrorakam.akamaized.net";
const challengerHost = "upos-sz-mirrorali.bilivideo.com";
const totalLength = 10 * 1024 * 1024;

function mediaUrl(host, object = "sample-a", token = "signed") {
  return `https://${host}/upgcxcode/31/21/${object}.m4s?deadline=1900000000&token=${token}`;
}

function playFixture(object = "sample-a") {
  return {
    code: 0,
    data: {
      dash: {
        video: [
          {
            bandwidth: 1_800_000,
            base_url: mediaUrl(primaryHost, object, "primary"),
            backup_url: [
              mediaUrl(akamaiHost, object, "akamai"),
              mediaUrl("upos-sz-mirrorhw.bilivideo.com", object, "hw"),
            ],
            codecid: 7,
            id: 80,
          },
        ],
      },
    },
  };
}

function rangeResponse(
  candidate,
  { bodyByte = 1, elapsedMs = 100, status = 206 } = {},
) {
  const range = candidate.probeRange;
  const end = Math.min(range.end, totalLength - 1);
  const length = end - range.start + 1;
  return {
    body: Buffer.alloc(length, bodyByte),
    elapsedMs,
    error: false,
    headers: {
      "Content-Length": String(length),
      "Content-Range": `bytes ${range.start}-${end}/${totalLength}`,
      "Content-Type": "video/mp4",
    },
    status,
    ttfbMs: 20,
    url: candidate.url,
  };
}

function makeServices({ fixture = playFixture(), now = 1_000_000, state } = {}) {
  let clock = now;
  let currentFixture = fixture;
  const probes = [];
  const fetched = [];
  const storage = {};
  if (state) {
    storage[cdn.HOST_AUTO_STATE_KEY] = JSON.stringify(state);
  }
  return {
    advance(milliseconds) {
      clock += milliseconds;
    },
    fetched,
    probes,
    services: {
      fetchPlayInfo(sample, callback) {
        fetched.push(sample);
        callback(null, currentFixture);
      },
      now() {
        return clock;
      },
      persistent: true,
      probe(candidate, timeoutMs, callback) {
        probes.push({ candidate, timeoutMs });
        callback(
          rangeResponse(candidate, {
            elapsedMs: candidate.hostname === challengerHost ? 60 : 100,
          }),
        );
      },
      read(key) {
        return storage[key] || null;
      },
      write(value, key) {
        storage[key] = value;
        return true;
      },
    },
    setFixture(value) {
      currentFixture = value;
    },
    storage,
  };
}

function run(config, environment) {
  return new Promise((resolve) => {
    benchmark.runBenchmark(config, environment.services, resolve);
  });
}

test("benchmark arguments, anonymous samples, media extraction, and host planning are bounded", () => {
  assert.deepEqual(benchmark.parseArgument("profile=Home_WiFi&interval=1"), {
    debug: false,
    enabled: true,
    intervalHours: 2,
    networkProfile: "home_wifi",
    probeMode: "cron",
    resetToken: "",
  });
  assert.ok(benchmark.PUBLIC_SAMPLES.length >= 3);
  for (const sample of benchmark.PUBLIC_SAMPLES) {
    assert.match(sample.bvid, /^BV[0-9A-Za-z]{10}$/);
    assert.deepEqual(Object.keys(sample), ["bvid"]);
  }

  const media = benchmark.extractMediaSample(playFixture());
  assert.equal(media.primaryUrl, mediaUrl(primaryHost, "sample-a", "primary"));
  assert.equal(media.exactByHost[akamaiHost], mediaUrl(akamaiHost, "sample-a", "akamai"));
  assert.match(media.objectId, /^o2_[0-9a-f]{32}$/);

  const plan = benchmark.buildCandidatePlan(
    media,
    cdn.createEmptyHostAutoState(),
    { candidates: [challengerHost], networkProfile: "auto" },
  );
  assert.deepEqual(
    plan.map((candidate) => candidate.hostname),
    [akamaiHost, challengerHost],
  );
  assert.equal(plan[0].url, media.exactByHost[akamaiHost]);
  assert.equal(
    plan[1].url,
    media.primaryUrl.replace(primaryHost, challengerHost),
  );
});

test("Shadowrocket JSON callbacks accept the status field used by some builds", async (t) => {
  const previousClient = global.$httpClient;
  t.after(() => {
    if (previousClient === undefined) delete global.$httpClient;
    else global.$httpClient = previousClient;
  });
  global.$httpClient = {
    get(request, callback) {
      const body = request.url.includes("/pagelist")
        ? { code: 0, data: [{ cid: 62131 }] }
        : playFixture();
      callback(null, { status: 200 }, JSON.stringify(body));
    },
  };

  const services = benchmark.createShadowrocketServices();
  const value = await new Promise((resolve, reject) => {
    services.fetchPlayInfo({ bvid: "BV1xx411c7mD" }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
  assert.equal(value.code, 0);
  assert.equal(value.data.dash.video.length, 1);
});

test("internal ranges rotate through quarter, half, and three-quarter positions", () => {
  const ranges = [0, 1, 2].map((cursor) =>
    benchmark.internalRangeForTotal(totalLength, cursor),
  );
  assert.equal(ranges[0].end - ranges[0].start + 1, 1024 * 1024);
  assert.equal(ranges[1].end - ranges[1].start + 1, 1024 * 1024);
  assert.equal(ranges[2].end - ranges[2].start + 1, 1024 * 1024);
  assert.ok(ranges[0].start < ranges[1].start);
  assert.ok(ranges[1].start < ranges[2].start);
  assert.equal(ranges[0].start % 65536, 0);
});

test("cron benchmark validates serial ranges across two objects and persists only host summaries", async () => {
  const environment = makeServices();
  const config = {
    ...benchmark.parseArgument("profile=auto&interval=2"),
    candidates: [challengerHost],
  };
  const first = await run(config, environment);
  assert.equal(first.reason, "completed");
  assert.equal(first.selectedHost, "");
  assert.equal(first.probeCount, 3);
  assert.ok(environment.probes.every((item) => item.timeoutMs === 5_000));

  environment.advance(2 * 60 * 60 * 1000 + 1);
  environment.setFixture(playFixture("sample-b"));
  const second = await run(config, environment);
  const persisted = JSON.parse(environment.storage[cdn.HOST_AUTO_STATE_KEY]);
  const profile = persisted.profiles.auto;
  const health = profile.hosts[challengerHost];

  assert.equal(second.reason, "completed");
  assert.equal(second.selectedHost, challengerHost);
  assert.equal(profile.selectedHost, challengerHost);
  assert.equal(profile.rangeCursor, 2);
  assert.equal(profile.sampleCursor, 2);
  assert.equal(health.metrics.objectCount, 2);
  assert.equal(health.metrics.failureRate, 0);
  assert.equal(environment.fetched.length, 2);
  assert.notEqual(environment.fetched[0].bvid, environment.fetched[1].bvid);
  assert.doesNotMatch(
    environment.storage[cdn.HOST_AUTO_STATE_KEY],
    /https?:|upgcxcode|deadline=|token=|sample-a|sample-b/,
  );
});

test("one failed winner sample is retained while two failures open its circuit", async () => {
  const now = 5_000_000;
  const state = cdn.createEmptyHostAutoState();
  ["old-a", "old-b", "old-c", "old-d"].forEach((object, index) => {
    cdn.recordHostSample(
      state,
      "auto",
      challengerHost,
      {
        at: now - index,
        elapsedMs: 100,
        objectId: cdn.stableHash("o", object),
        ok: true,
        status: 206,
        throughputKbps: 30_000,
        ttfbMs: 20,
      },
      now,
    );
  });
  state.profiles.auto.selectedHost = challengerHost;
  state.profiles.auto.selectedAt = now;
  const environment = makeServices({ now, state });
  const originalProbe = environment.services.probe;
  environment.services.probe = (candidate, timeoutMs, callback) => {
    if (candidate.hostname === challengerHost) {
      environment.probes.push({ candidate, timeoutMs });
      callback(rangeResponse(candidate, { status: 200 }));
      return;
    }
    originalProbe(candidate, timeoutMs, callback);
  };
  const config = {
    ...benchmark.parseArgument(""),
    candidates: [challengerHost],
  };

  await run(config, environment);
  let persisted = JSON.parse(environment.storage[cdn.HOST_AUTO_STATE_KEY]);
  assert.equal(persisted.profiles.auto.selectedHost, challengerHost);
  assert.equal(persisted.profiles.auto.hosts[challengerHost].failureStreak, 1);
  assert.equal(persisted.profiles.auto.hosts[challengerHost].openUntil, 0);

  environment.advance(2 * 60 * 60 * 1000 + 1);
  environment.setFixture(playFixture("failure-b"));
  await run(config, environment);
  persisted = JSON.parse(environment.storage[cdn.HOST_AUTO_STATE_KEY]);
  assert.equal(persisted.profiles.auto.hosts[challengerHost].failureStreak, 2);
  assert.ok(
    persisted.profiles.auto.hosts[challengerHost].openUntil >
      environment.services.now(),
  );
});

test("a failed pending host is cleared instead of being retried forever", async () => {
  const now = 7_000_000;
  const state = cdn.createEmptyHostAutoState();
  cdn.recordHostSample(
    state,
    "auto",
    challengerHost,
    {
      at: now - 1,
      elapsedMs: 100,
      objectId: cdn.stableHash("o", "old-object"),
      ok: true,
      status: 206,
      throughputKbps: 30_000,
      ttfbMs: 20,
    },
    now,
  );
  state.profiles.auto.pendingHost = challengerHost;
  const environment = makeServices({ now, state });
  const originalProbe = environment.services.probe;
  environment.services.probe = (candidate, timeoutMs, callback) => {
    if (candidate.hostname === challengerHost) {
      environment.probes.push({ candidate, timeoutMs });
      callback(rangeResponse(candidate, { status: 200 }));
      return;
    }
    originalProbe(candidate, timeoutMs, callback);
  };

  await run(
    {
      ...benchmark.parseArgument(""),
      candidates: [challengerHost],
    },
    environment,
  );

  const persisted = JSON.parse(
    environment.storage[cdn.HOST_AUTO_STATE_KEY],
  );
  assert.equal(persisted.profiles.auto.pendingHost, "");
});
