"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const primaryHost = "upos-sz-mirrorcosov.bilivideo.com";
const akamaiHost = "upos-hz-mirrorakam.akamaized.net";
const aliasHost = "upos-sz-mirrorali.bilivideo.com";
const path = "/upgcxcode/31/21/tool-sample.m4s";
const primaryUrl = `https://${primaryHost}${path}?deadline=1900000000&token=primary`;
const akamaiUrl = `https://${akamaiHost}${path}?deadline=1900000000&token=akamai`;

test("desktop benchmark API requests are anonymous and candidate URL rules never synthesize Akamai", async () => {
  const tool = await import("../scripts/benchmark-cdn.mjs");
  const urls = tool.anonymousApiUrls({ bvid: "BV1xx411c7mD" }, 62131);
  for (const value of Object.values(urls)) {
    assert.doesNotMatch(
      value,
      /access_key|cookie|buvid|device|mid=|sessdata|token=/i,
    );
  }
  assert.equal(
    tool.candidateUrlForHost(primaryUrl, aliasHost, {}),
    primaryUrl.replace(primaryHost, aliasHost),
  );
  assert.equal(tool.candidateUrlForHost(primaryUrl, akamaiHost, {}), null);
  assert.equal(
    tool.candidateUrlForHost(primaryUrl, akamaiHost, {
      [akamaiHost]: akamaiUrl,
    }),
    akamaiUrl,
  );
});

test("desktop benchmark validates hosts serially and returns redacted measurements", async () => {
  const tool = await import("../scripts/benchmark-cdn.mjs");
  const total = 8 * 1024 * 1024;
  const calls = [];
  const playFixture = {
    code: 0,
    data: {
      dash: {
        video: [
          {
            bandwidth: 1_800_000,
            backup_url: [akamaiUrl],
            base_url: primaryUrl,
          },
        ],
      },
    },
  };
  async function fetchJson(url) {
    return url.includes("/pagelist")
      ? { code: 0, data: [{ cid: 62131 }] }
      : playFixture;
  }
  async function requestRange(url, range) {
    calls.push({ range: { ...range }, url });
    const length = Math.min(range.end, total - 1) - range.start + 1;
    return {
      body: Buffer.alloc(length, 1),
      elapsedMs: new URL(url).hostname === aliasHost ? 80 : 120,
      headers: {
        "content-length": String(length),
        "content-range": `bytes ${range.start}-${range.start + length - 1}/${total}`,
        "content-type": "video/mp4",
      },
      status: 206,
      ttfbMs: 20,
      url,
    };
  }

  const result = await tool.runCdnBenchmark({
    candidates: [aliasHost, akamaiHost],
    fetchJson,
    requestRange,
    samples: [{ bvid: "BV1xx411c7mD" }],
  });

  assert.equal(result.rows.length, 2);
  assert.deepEqual(
    result.rows.map((row) => row.hostname),
    [aliasHost, akamaiHost],
  );
  assert.ok(result.rows.every((row) => row.ok));
  assert.ok(result.rows[0].throughputMbps > result.rows[1].throughputMbps);
  assert.ok(calls.length >= 4);
  assert.deepEqual(
    calls.slice(2).map((call) => new URL(call.url).hostname),
    [aliasHost, akamaiHost],
  );
  assert.doesNotMatch(
    JSON.stringify(result.rows),
    /https?:|upgcxcode|deadline=|token=/,
  );
});
