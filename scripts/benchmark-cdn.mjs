import { readFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { createRequire } from "node:module";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const cdn = require("../src/bilibili-cdn.js");
const cronCore = require("../src/bilibili-cdn-benchmark.js");
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const AKAMAI_HOST = "upos-hz-mirrorakam.akamaized.net";
const DEFAULT_TIMEOUT_MS = 15_000;

export function anonymousApiUrls(sample, cid) {
  const bvid = encodeURIComponent(String(sample?.bvid || ""));
  return {
    pagelist: `https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`,
    playurl:
      "https://api.bilibili.com/x/player/playurl" +
      `?bvid=${bvid}&cid=${encodeURIComponent(String(cid || ""))}` +
      "&fnval=16&qn=80&fourk=1",
  };
}

function hostnameForUrl(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function candidateUrlForHost(primaryUrl, hostname, exactByHost) {
  const normalized = String(hostname || "").toLowerCase();
  if (exactByHost?.[normalized]) return exactByHost[normalized];
  if (normalized === AKAMAI_HOST) return null;
  return cdn.replaceVodHostname(primaryUrl, normalized) || null;
}

async function defaultFetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "Accept-Encoding": "identity",
      Referer: "https://www.bilibili.com/",
      "User-Agent": "BiliCDN-Desktop-Benchmark/8",
    },
    redirect: "error",
  });
  if (!response.ok) {
    throw new Error(`API HTTP ${response.status}`);
  }
  return response.json();
}

export function requestRangeNode(
  urlText,
  range,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  return new Promise((resolve) => {
    const started = performance.now();
    const url = new URL(urlText);
    const transport = url.protocol === "https:" ? https : http;
    const expectedLength = range.end - range.start + 1;
    let settled = false;
    let timer;
    let ttfbMs = 0;

    function finish(value) {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({
        ...value,
        elapsedMs: Math.max(1, performance.now() - started),
        ttfbMs,
        url: urlText,
      });
    }

    const request = transport.request(
      url,
      {
        agent: false,
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "identity",
          Connection: "close",
          Range: `bytes=${range.start}-${range.end}`,
          Referer: "https://www.bilibili.com/",
          "User-Agent": "BiliCDN-Desktop-Benchmark/8",
        },
        method: "GET",
      },
      (response) => {
        ttfbMs = Math.max(0, performance.now() - started);
        const chunks = [];
        let received = 0;
        response.on("data", (chunk) => {
          received += chunk.length;
          if (received <= expectedLength + 1) chunks.push(chunk);
          if (received > expectedLength + 1) response.destroy();
        });
        response.on("end", () => {
          finish({
            body: Buffer.concat(chunks),
            error: false,
            headers: response.headers,
            status: response.statusCode || 0,
          });
        });
        response.on("error", (error) => {
          finish({
            body: Buffer.concat(chunks),
            error: true,
            headers: response.headers,
            reason: error.code || error.message,
            status: response.statusCode || 0,
          });
        });
      },
    );
    request.on("error", (error) => {
      finish({
        body: Buffer.alloc(0),
        error: true,
        headers: {},
        reason: error.code || error.message,
        status: 0,
      });
    });
    timer = setTimeout(() => {
      request.destroy(new Error("hard-deadline"));
    }, timeoutMs);
    request.end();
  });
}

async function resolveAnonymousMedia(samples, fetchJson) {
  let lastError;
  for (const sample of samples) {
    try {
      const initial = anonymousApiUrls(sample, "");
      const pages = await fetchJson(initial.pagelist);
      const cid = Number(pages?.data?.[0]?.cid);
      if (!Number.isSafeInteger(cid) || cid <= 0) {
        throw new Error("anonymous cid unavailable");
      }
      const urls = anonymousApiUrls(sample, cid);
      const playInfo = await fetchJson(urls.playurl);
      const media = cronCore.extractMediaSample(playInfo);
      if (!media) throw new Error("anonymous playurl had no VOD candidates");
      return { media, sample };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `all anonymous samples failed: ${lastError?.message || "unknown error"}`,
  );
}

function validate(result, url, range) {
  const checked = cdn.validateProbeResponse(result, url, range);
  return {
    ...checked,
    elapsedMs: Math.max(1, Number(result?.elapsedMs) || DEFAULT_TIMEOUT_MS),
    ttfbMs: Math.max(0, Number(result?.ttfbMs) || 0),
  };
}

function equivalent(left, right) {
  return Boolean(
    left.ok &&
      right.ok &&
      left.rangeStart === right.rangeStart &&
      left.rangeEnd === right.rangeEnd &&
      left.totalLength === right.totalLength &&
      left.bodyLength === right.bodyLength &&
      left.sampleHash &&
      left.sampleHash === right.sampleHash,
  );
}

export async function runCdnBenchmark({
  candidates,
  fetchJson = defaultFetchJson,
  requestRange = requestRangeNode,
  samples = cronCore.PUBLIC_SAMPLES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    const config = JSON.parse(
      await readFile(
        path.join(rootDirectory, "config", "cdn-candidates.json"),
        "utf8",
      ),
    );
    candidates = [...config.maintained, ...config.supplemental];
  }
  const { media, sample } = await resolveAnonymousMedia(samples, fetchJson);
  const referenceUrl = media.exactByHost[AKAMAI_HOST] || media.primaryUrl;
  const prefixRange = { start: 0, end: 65_535 };
  const prefixRaw = await requestRange(referenceUrl, prefixRange, timeoutMs);
  const prefix = validate(prefixRaw, referenceUrl, prefixRange);
  if (!prefix.ok || !prefix.totalLength) {
    throw new Error(`reference prefix failed: ${prefix.reason || "invalid"}`);
  }
  const range = cronCore.internalRangeForTotal(prefix.totalLength, 1);
  const referenceRaw = await requestRange(referenceUrl, range, timeoutMs);
  const reference = validate(referenceRaw, referenceUrl, range);
  if (!reference.ok) {
    throw new Error(`reference range failed: ${reference.reason || "invalid"}`);
  }

  const rows = [];
  const seen = new Set();
  for (const rawHost of candidates) {
    const hostname = String(rawHost || "").toLowerCase();
    if (seen.has(hostname)) continue;
    seen.add(hostname);
    const url = candidateUrlForHost(
      media.primaryUrl,
      hostname,
      media.exactByHost,
    );
    if (!url) {
      rows.push({
        hostname,
        ok: false,
        range: `${range.start}-${range.end}`,
        reason: "complete-url-unavailable",
        status: 0,
        throughputMbps: 0,
        totalMs: 0,
        ttfbMs: 0,
      });
      continue;
    }
    const raw = await requestRange(url, range, timeoutMs);
    const checked = validate(raw, url, range);
    const ok = equivalent(checked, reference);
    rows.push({
      hostname,
      ok,
      range: `${range.start}-${range.end}`,
      reason: ok
        ? "validated"
        : checked.ok
          ? "object-mismatch"
          : checked.reason || raw.reason || "failed",
      status: checked.status || Number(raw.status) || 0,
      throughputMbps: ok
        ? Math.round(
            ((checked.bodyLength * 8) / checked.elapsedMs / 1000) * 100,
          ) / 100
        : 0,
      totalMs: Math.round(checked.elapsedMs * 10) / 10,
      ttfbMs: Math.round(checked.ttfbMs * 10) / 10,
    });
  }
  return {
    referenceHost: hostnameForUrl(referenceUrl),
    rows,
    sample: sample.bvid,
  };
}

async function main() {
  const result = await runCdnBenchmark();
  console.log(
    `Anonymous sample ${result.sample}; strict reference ${result.referenceHost}`,
  );
  console.table(result.rows);
  if (!result.rows.some((row) => row.ok)) process.exitCode = 1;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(`BiliCDN benchmark failed: ${error.message}`);
    process.exitCode = 1;
  });
}
