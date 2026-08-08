/*
 * Bilibili CDN v10 background benchmark for Shadowrocket cron.
 *
 * This script uses anonymous public play information, validates byte-identical
 * interior ranges serially, and persists only bounded host statistics.
 */
(function (root, factory) {
  "use strict";

  var core =
    typeof module !== "undefined" && module.exports
      ? require("./bilibili-cdn.js")
      : root.BiliCdnSwitcher;
  var api = factory(root, core);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliCdnBenchmark = api;
  }

  if (
    typeof $done === "function" &&
    typeof $response === "undefined" &&
    root.__BILICDN_BENCHMARK_DISABLED__ !== true
  ) {
    api.runShadowrocket();
  }
})(this, function (root, cdn) {
  "use strict";

  var NAME = "BiliCDN Benchmark";
  var AKAMAI_HOST = "upos-hz-mirrorakam.akamaized.net";
  var PROBE_TIMEOUT_MS = 5000;
  var PREFIX_END = 65535;
  var INTERNAL_LENGTH = 1024 * 1024;
  var ALIGNMENT = 65536;
  var RETRY_MS = 30 * 60 * 1000;
  var LOCK_MS = 60 * 1000;
  var BENCHMARK_BUDGET_MS = 45 * 1000;
  var SUSTAINED_SHORTLIST_SIZE = 3;
  var FRACTIONS = [0.25, 0.5, 0.75];
  var PUBLIC_SAMPLES = [
    { bvid: "BV1xx411c7mD" },
    { bvid: "BV1GJ411x7h7" },
    { bvid: "BV1Q541167Qg" }
  ];

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function boundedNumber(value, fallback, minimum, maximum) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function parseArgument(argument) {
    var parsed = cdn.parseArgument(
      typeof argument === "string" ? argument : ""
    );
    return {
      debug: Boolean(parsed.debug),
      enabled: Boolean(parsed.auto && parsed.probeMode === "cron"),
      intervalHours: boundedNumber(parsed.intervalHours, 2, 2, 72),
      networkProfile: cdn.normalizeNetworkProfile(parsed.networkProfile),
      probeMode: parsed.probeMode,
      resetToken:
        typeof parsed.resetToken === "string" ? parsed.resetToken : "",
      switchThreshold: boundedNumber(parsed.switchThreshold, 20, 10, 80)
    };
  }

  function hostnameForUrl(value) {
    var match = /^https?:\/\/([^\/?#]+)/i.exec(String(value || ""));
    var authority = match ? match[1] : "";
    return authority.replace(/:\d+$/, "").toLowerCase();
  }

  function pathForUrl(value) {
    var match = /^https?:\/\/[^\/?#]+([^?#]*)/i.exec(String(value || ""));
    return match && match[1] ? match[1] : "";
  }

  function addExactUrl(exactByHost, value) {
    var hostname;
    if (typeof value !== "string" || !cdn.isVodMediaUrl(value)) {
      return;
    }
    hostname = hostnameForUrl(value);
    if (hostname && !exactByHost[hostname]) {
      exactByHost[hostname] = value;
    }
  }

  function extractMediaSample(value) {
    var parsed = value;
    var data;
    var video;
    var primaryUrl;
    var backups;
    var exactByHost = {};
    var index;
    var requiredKbps;
    var kind = "video";
    var bandwidth = 0;
    var quality = 0;
    var codecid = 0;
    if (typeof value === "string") {
      try {
        parsed = JSON.parse(value);
      } catch (error) {
        return null;
      }
    }
    if (!isObject(parsed) || Array.isArray(parsed)) {
      return null;
    }
    data = isObject(parsed.data) ? parsed.data : parsed.result;
    if (
      data &&
      data.dash &&
      Array.isArray(data.dash.video)
    ) {
      for (index = 0; index < data.dash.video.length; index += 1) {
        video = data.dash.video[index];
        primaryUrl = video && (video.base_url || video.baseUrl);
        backups = video && (video.backup_url || video.backupUrl);
        if (
          typeof primaryUrl === "string" &&
          cdn.isVodMediaUrl(primaryUrl) &&
          Array.isArray(backups) &&
          backups.length > 0
        ) {
          requiredKbps = cdn.requiredThroughputKbps(
            "video",
            video.bandwidth
          );
          bandwidth = boundedNumber(video.bandwidth, 0, 0, 1000000000);
          quality = boundedNumber(video.id || video.quality, 0, 0, 1000);
          codecid = boundedNumber(video.codecid, 0, 0, 1000);
          break;
        }
      }
    }
    if (!primaryUrl && data && Array.isArray(data.durl)) {
      for (index = 0; index < data.durl.length; index += 1) {
        video = data.durl[index];
        primaryUrl = video && video.url;
        backups = video && (video.backup_url || video.backupUrl);
        if (
          typeof primaryUrl === "string" &&
          cdn.isVodMediaUrl(primaryUrl) &&
          Array.isArray(backups) &&
          backups.length > 0
        ) {
          requiredKbps = cdn.requiredThroughputKbps("segment", 0);
          kind = "segment";
          break;
        }
        primaryUrl = "";
      }
    }
    if (!primaryUrl || !Array.isArray(backups)) {
      return null;
    }
    addExactUrl(exactByHost, primaryUrl);
    for (index = 0; index < backups.length; index += 1) {
      addExactUrl(exactByHost, backups[index]);
    }
    return {
      exactByHost: exactByHost,
      bandwidthBitsPerSecond: bandwidth,
      bucket: cdn.mediaBucketForDescriptor({
        bandwidthBitsPerSecond: bandwidth,
        codecid: codecid,
        kind: kind,
        quality: quality,
        requiredKbps: requiredKbps || 0
      }),
      codecid: codecid,
      kind: kind,
      objectId: cdn.stableHash("o", pathForUrl(primaryUrl)),
      primaryHost: hostnameForUrl(primaryUrl),
      primaryUrl: primaryUrl,
      quality: quality,
      requiredKbps: requiredKbps || 0
    };
  }

  function emptyProfile() {
    return {
      challengerCursor: 0,
      hosts: {},
      lastRunAt: 0,
      nextRunAt: 0,
      pendingHost: "",
      rangeCursor: 0,
      sampleCursor: 0,
      selectedAt: 0,
      selectedHost: ""
    };
  }

  function ensureProfile(state, networkProfile) {
    var name = cdn.normalizeNetworkProfile(networkProfile);
    if (!isObject(state.profiles) || Array.isArray(state.profiles)) {
      state.profiles = {};
    }
    if (!state.profiles[name]) {
      state.profiles[name] = emptyProfile();
    }
    return state.profiles[name];
  }

  function candidateUrlForHost(media, hostname) {
    if (media.exactByHost[hostname]) {
      return media.exactByHost[hostname];
    }
    if (hostname === AKAMAI_HOST) {
      return "";
    }
    return cdn.replaceVodHostname(media.primaryUrl, hostname);
  }

  function buildCandidatePlan(media, state, config, now) {
    var profile = ensureProfile(state, config && config.networkProfile);
    var maintained =
      config && Array.isArray(config.candidates) && config.candidates.length > 0
        ? config.candidates
        : cdn.FIXED_CDN_CANDIDATES;
    var plan = [];
    var seen = {};
    var referenceHost = media.exactByHost[AKAMAI_HOST]
      ? AKAMAI_HOST
      : media.primaryHost;
    var challenger;
    var challengerIndex;

    function circuitOpen(hostname) {
      var health = profile.hosts && profile.hosts[hostname];
      return Boolean(
        health &&
        boundedNumber(health.openUntil, 0, 0, 9e15) >
          boundedNumber(now, 0, 0, 9e15)
      );
    }

    function add(hostname, source) {
      var url;
      hostname = String(hostname || "").toLowerCase();
      if (
        !hostname ||
        seen[hostname] ||
        circuitOpen(hostname) ||
        cdn.FIXED_CDN_CANDIDATES.indexOf(hostname) === -1
      ) {
        return;
      }
      url = candidateUrlForHost(media, hostname);
      if (!url || !cdn.isVodMediaUrl(url)) {
        return;
      }
      seen[hostname] = true;
      plan.push({ hostname: hostname, source: source, url: url });
    }

    if (circuitOpen(referenceHost)) {
      referenceHost = media.primaryHost;
    }
    add(referenceHost, "reference");
    add(profile.pendingHost, "pending");
    add(profile.selectedHost, "selected");
    add(AKAMAI_HOST, "akamai");
    if (maintained.length > 0) {
      challengerIndex = profile.challengerCursor % maintained.length;
      challenger = String(maintained[challengerIndex] || "").toLowerCase();
      add(challenger, "challenger");
    }
    return plan;
  }

  function internalRangeForTotal(totalLength, cursor) {
    var total = Math.floor(
      boundedNumber(totalLength, 0, 0, Number.MAX_SAFE_INTEGER)
    );
    var length;
    var maximumStart;
    var start;
    var fraction;
    if (total <= 0) {
      return null;
    }
    length = Math.min(INTERNAL_LENGTH, total);
    maximumStart = total - length;
    fraction = FRACTIONS[Math.abs(Math.floor(cursor || 0)) % FRACTIONS.length];
    start = Math.floor((maximumStart * fraction) / ALIGNMENT) * ALIGNMENT;
    start = Math.max(0, Math.min(start, maximumStart));
    return { end: start + length - 1, start: start };
  }

  function normalizedValidation(result, candidate, range) {
    var validation = cdn.validateProbeResponse(result || {}, candidate.url, range);
    var elapsedMs = Math.max(
      1,
      Math.round(boundedNumber(result && result.elapsedMs, PROBE_TIMEOUT_MS, 1, 60000))
    );
    return {
      bodyLength: validation.bodyLength || 0,
      contentClass: validation.contentClass || "",
      elapsedMs: elapsedMs,
      ok: Boolean(validation.ok),
      rangeEnd: validation.rangeEnd,
      rangeStart: validation.rangeStart,
      reason: validation.reason || "invalid",
      sampleHash: validation.sampleHash || "",
      status: validation.status || 0,
      throughputKbps: validation.ok
        ? Math.round(((validation.bodyLength || 0) * 8) / elapsedMs)
        : 0,
      totalLength: validation.totalLength || 0,
      ttfbMs: boundedNumber(
        result && result.ttfbMs,
        elapsedMs,
        0,
        60000
      )
    };
  }

  function responseTtfbMs(response, elapsedMs) {
    var timing = response && response.timing;
    var timings = response && response.timings;
    var values = [
      response && response.ttfbMs,
      timing && timing.ttfbMs,
      timings && timings.ttfbMs,
      timings && timings.ttfb
    ];
    var index;
    var value;
    for (index = 0; index < values.length; index += 1) {
      value = Number(values[index]);
      if (Number.isFinite(value) && value > 0 && value <= elapsedMs) {
        return value;
      }
    }
    /* Callback-only runtimes expose 64 KiB completion time as a TTFB upper bound. */
    return elapsedMs;
  }

  function equivalentToReference(candidate, reference) {
    return Boolean(
      candidate.ok &&
      reference.ok &&
      candidate.rangeStart === reference.rangeStart &&
      candidate.rangeEnd === reference.rangeEnd &&
      candidate.totalLength === reference.totalLength &&
      candidate.bodyLength === reference.bodyLength &&
      candidate.sampleHash &&
      candidate.sampleHash === reference.sampleHash &&
      (
        candidate.contentClass === reference.contentClass ||
        candidate.contentClass === "binary" ||
        reference.contentClass === "binary"
      )
    );
  }

  function runBenchmark(config, services, callback) {
    var completed = false;
    var now;
    var startedAt;
    var state;
    var profile;
    var sample;
    var lockToken;
    var probeCount = 0;
    var elapsedBudgetMs = 0;
    var successfulHosts = [];
    var candidatePlan;
    var media;
    var internalRange;
    var startupReference;
    var sustainedReference;
    var startupRows = [];
    var shortlist = [];

    function finish(result) {
      if (completed) {
        return;
      }
      completed = true;
      callback(result);
    }

    function persistAndFinish(reason, nextAt, extra) {
      var latest;
      var name = cdn.normalizeNetworkProfile(config.networkProfile);
      var output = extra || {};
      profile.lastRunAt = now;
      profile.nextRunAt = nextAt;
      latest = cdn.loadHostAutoState(services);
      if (
        latest.lock &&
        latest.lock.token &&
        latest.lock.token !== lockToken
      ) {
        finish({
          probeCount: probeCount,
          reason: "stale-lock",
          selectedHost: profile.selectedHost || ""
        });
        return;
      }
      latest.profiles[name] = profile;
      latest.lock = null;
      latest.resetToken = state.resetToken;
      cdn.saveHostAutoState(services, latest, now);
      output.probeCount = probeCount;
      output.elapsedBudgetMs = Math.max(
        elapsedBudgetMs,
        Math.max(0, services.now() - startedAt)
      );
      output.reason = reason;
      output.selectedHost = profile.selectedHost || "";
      finish(output);
    }

    function budgetAllowsProbe() {
      var wallElapsed = Math.max(0, services.now() - startedAt);
      return Math.max(wallElapsed, elapsedBudgetMs) + PROBE_TIMEOUT_MS <=
        BENCHMARK_BUDGET_MS;
    }

    function probe(candidate, range, phase, done) {
      var enriched = {
        hostname: candidate.hostname,
        phase: phase,
        probeRange: range,
        source: candidate.source,
        url: candidate.url
      };
      probeCount += 1;
      try {
        services.probe(enriched, PROBE_TIMEOUT_MS, function (result) {
          var normalized = normalizedValidation(result, candidate, range);
          elapsedBudgetMs += normalized.elapsedMs;
          done(normalized);
        });
      } catch (error) {
        var failed = normalizedValidation({ error: true, status: 0 }, candidate, range);
        elapsedBudgetMs += failed.elapsedMs;
        done(failed);
      }
    }

    function record(candidate, result, equivalent, phase) {
      var health = cdn.recordHostSample(
        state,
        config.networkProfile,
        candidate.hostname,
        {
          at: now,
          bucket: media.bucket,
          elapsedMs: result.elapsedMs,
          objectId: media.objectId,
          ok: Boolean(equivalent),
          phase: phase,
          reason: equivalent ? "validated" : result.ok ? "object-mismatch" : result.reason,
          status: result.status,
          throughputKbps: equivalent ? result.throughputKbps : 0,
          ttfbMs: result.ttfbMs
        },
        now
      );
      if (equivalent && phase === "sustained") {
        successfulHosts.push(candidate.hostname);
      }
      return health;
    }

    function finishCandidates() {
      var descriptor = {
        bandwidthBitsPerSecond: media.bandwidthBitsPerSecond,
        codecid: media.codecid,
        kind: media.kind,
        quality: media.quality,
        requiredKbps: media.requiredKbps
      };
      var winner = cdn.selectStableHost(state, config, descriptor, now);
      var pending = "";
      var index;
      var health;
      profile = ensureProfile(state, config.networkProfile);
      if (winner) {
        profile.selectedHost = winner;
        profile.selectedAt = now;
        profile.pendingHost = "";
      } else {
        profile.pendingHost = "";
        for (index = 0; index < successfulHosts.length; index += 1) {
          if (successfulHosts[index] === candidatePlan[0].hostname) {
            continue;
          }
          health = profile.hosts[successfulHosts[index]];
          if (
            health &&
            health.openUntil <= now &&
            health.buckets &&
            health.buckets[media.bucket] &&
            health.buckets[media.bucket].metrics &&
            health.buckets[media.bucket].metrics.objectCount < 2
          ) {
            pending = successfulHosts[index];
            break;
          }
        }
        if (pending) {
          profile.pendingHost = pending;
        }
      }
      profile.challengerCursor += 1;
      profile.rangeCursor += 1;
      profile.sampleCursor += 1;
      persistAndFinish(
        "completed",
        now + config.intervalHours * 60 * 60 * 1000,
        { candidateCount: candidatePlan.length }
      );
    }

    function startupRank(row) {
      var result = row && row.result;
      if (!row || !row.equivalent || !result) {
        return -1;
      }
      return (
        (1000 / (100 + Math.max(1, result.ttfbMs || 60000))) * 75 +
        Math.min(5, (result.throughputKbps || 0) / 10000) * 5
      );
    }

    function buildSustainedShortlist() {
      var ranked = startupRows.slice(1).filter(function (row) {
        return row.equivalent;
      });
      ranked.sort(function (left, right) {
        return startupRank(right) - startupRank(left);
      });
      shortlist = startupRows.length > 0 ? [startupRows[0].candidate] : [];
      ranked.slice(0, SUSTAINED_SHORTLIST_SIZE - 1).forEach(function (row) {
        shortlist.push(row.candidate);
      });
    }

    function probeSustainedAt(index) {
      var candidate;
      if (index >= shortlist.length) {
        finishCandidates();
        return;
      }
      if (!budgetAllowsProbe()) {
        persistAndFinish(
          "budget-exhausted",
          now + RETRY_MS,
          { candidateCount: candidatePlan.length }
        );
        return;
      }
      candidate = shortlist[index];
      probe(candidate, internalRange, "sustained", function (result) {
        var equivalent;
        if (index === 0) {
          sustainedReference = result;
          if (!sustainedReference.ok) {
            record(candidate, result, false, "sustained");
            persistAndFinish("reference-range-failed", now + RETRY_MS);
            return;
          }
          equivalent = true;
        } else {
          equivalent = equivalentToReference(result, sustainedReference);
        }
        record(candidate, result, equivalent, "sustained");
        probeSustainedAt(index + 1);
      });
    }

    function finishStartupPhase() {
      buildSustainedShortlist();
      if (shortlist.length === 0 || !startupReference) {
        persistAndFinish("reference-prefix-failed", now + RETRY_MS);
        return;
      }
      internalRange = internalRangeForTotal(
        startupReference.totalLength,
        profile.rangeCursor
      );
      if (!internalRange) {
        persistAndFinish("reference-range-invalid", now + RETRY_MS);
        return;
      }
      probeSustainedAt(0);
    }

    function probeStartupAt(index) {
      var candidate;
      if (index >= candidatePlan.length) {
        finishStartupPhase();
        return;
      }
      if (!budgetAllowsProbe()) {
        persistAndFinish(
          "budget-exhausted",
          now + RETRY_MS,
          { candidateCount: candidatePlan.length }
        );
        return;
      }
      candidate = candidatePlan[index];
      probe(candidate, { end: PREFIX_END, start: 0 }, "startup", function (result) {
        var equivalent;
        if (index === 0) {
          startupReference = result;
          equivalent = Boolean(result.ok && result.totalLength > 0);
          if (!equivalent) {
            record(candidate, result, false, "startup");
            persistAndFinish("reference-prefix-failed", now + RETRY_MS);
            return;
          }
        } else {
          equivalent = equivalentToReference(result, startupReference);
        }
        record(candidate, result, equivalent, "startup");
        startupRows.push({
          candidate: candidate,
          equivalent: equivalent,
          result: result
        });
        probeStartupAt(index + 1);
      });
    }

    if (
      typeof callback !== "function" ||
      !services ||
      typeof services.now !== "function" ||
      typeof services.read !== "function" ||
      typeof services.write !== "function" ||
      typeof services.fetchPlayInfo !== "function" ||
      typeof services.probe !== "function" ||
      !cdn
    ) {
      if (typeof callback === "function") {
        finish({ probeCount: 0, reason: "services-unavailable", selectedHost: "" });
      }
      return;
    }
    config = isObject(config) ? config : parseArgument("");
    if (config.enabled === false || config.probeMode === "off") {
      finish({ probeCount: 0, reason: "disabled", selectedHost: "" });
      return;
    }
    config.networkProfile = cdn.resolveRuntimeNetworkProfile(
      config.networkProfile,
      services
    );
    config.intervalHours = boundedNumber(config.intervalHours, 2, 2, 72);
    now = services.now();
    startedAt = now;
    state = cdn.loadHostAutoState(services);
    if (config.resetToken && state.resetToken !== config.resetToken) {
      state = cdn.createEmptyHostAutoState();
      state.resetToken = config.resetToken;
    }
    profile = ensureProfile(state, config.networkProfile);
    if (profile.nextRunAt > now) {
      finish({
        probeCount: 0,
        reason: "interval-pending",
        selectedHost: profile.selectedHost || ""
      });
      return;
    }
    if (state.lock && state.lock.expiresAt > now) {
      finish({
        probeCount: 0,
        reason: "locked",
        selectedHost: profile.selectedHost || ""
      });
      return;
    }
    lockToken = cdn.stableHash(
      "l",
      config.networkProfile + "|" + now + "|" + String(Math.random())
    );
    state.lock = {
      createdAt: now,
      expiresAt: now + LOCK_MS,
      token: lockToken
    };
    if (!cdn.saveHostAutoState(services, state, now)) {
      finish({ probeCount: 0, reason: "state-write-failed", selectedHost: "" });
      return;
    }
    sample = PUBLIC_SAMPLES[profile.sampleCursor % PUBLIC_SAMPLES.length];
    services.fetchPlayInfo(sample, function (error, value) {
      if (error) {
        profile.sampleCursor += 1;
        persistAndFinish("sample-fetch-failed", now + RETRY_MS);
        return;
      }
      media = extractMediaSample(value);
      if (!media) {
        profile.sampleCursor += 1;
        persistAndFinish("sample-invalid", now + RETRY_MS);
        return;
      }
      candidatePlan = buildCandidatePlan(media, state, config, now);
      if (candidatePlan.length === 0) {
        profile.sampleCursor += 1;
        persistAndFinish("no-candidates", now + RETRY_MS);
        return;
      }
      probeStartupAt(0);
    });
  }

  function createShadowrocketServices() {
    var storeAvailable =
      typeof $persistentStore !== "undefined" &&
      $persistentStore &&
      typeof $persistentStore.read === "function" &&
      typeof $persistentStore.write === "function";

    function requestJson(url, callback) {
      var client = typeof $httpClient !== "undefined" ? $httpClient : null;
      if (!client || typeof client.get !== "function") {
        callback(new Error("http-unavailable"));
        return;
      }
      client.get({
        headers: {
          "Accept-Encoding": "identity",
          Referer: "https://www.bilibili.com/",
          "User-Agent": "BiliCDN-Background-Benchmark/10",
          "X-BiliCDN-Background": "1"
        },
        timeout: 8,
        url: url
      }, function (error, response, body) {
        var parsed;
        if (
          error ||
          Number(response && (response.statusCode || response.status)) !== 200
        ) {
          callback(error || new Error("http-status"));
          return;
        }
        try {
          parsed = JSON.parse(typeof body === "string" ? body : "");
        } catch (parseError) {
          callback(parseError);
          return;
        }
        callback(null, parsed);
      });
    }

    return {
      networkInfo: function () {
        var network = typeof $network !== "undefined" ? $network : null;
        var wifi;
        var cellular;
        if (!network || typeof network !== "object") {
          return null;
        }
        wifi = network.wifi;
        if (wifi && typeof wifi === "object") {
          return {
            identifier: String(wifi.ssid || wifi.bssid || ""),
            type: "wifi"
          };
        }
        cellular = network.cellular;
        if (cellular && typeof cellular === "object") {
          return {
            identifier: String(
              cellular.carrier || cellular.radio || cellular.network || ""
            ),
            type: "cellular"
          };
        }
        return null;
      },
      fetchPlayInfo: function (sample, callback) {
        var bvid = encodeURIComponent(sample.bvid);
        requestJson(
          "https://api.bilibili.com/x/player/pagelist?bvid=" + bvid,
          function (error, pageList) {
            var cid;
            if (error) {
              callback(error);
              return;
            }
            cid =
              pageList &&
              Array.isArray(pageList.data) &&
              pageList.data[0] &&
              Number(pageList.data[0].cid);
            if (!Number.isSafeInteger(cid) || cid <= 0) {
              callback(new Error("cid-unavailable"));
              return;
            }
            requestJson(
              "https://api.bilibili.com/x/player/playurl" +
                "?bvid=" + bvid +
                "&cid=" + encodeURIComponent(String(cid)) +
                "&fnval=16&qn=80&fourk=1",
              callback
            );
          }
        );
      },
      now: function () {
        return Date.now();
      },
      persistent: Boolean(storeAvailable),
      probe: function (candidate, timeoutMs, callback) {
        var client = typeof $httpClient !== "undefined" ? $httpClient : null;
        var started = Date.now();
        var completed = false;
        var timer = null;
        var request = {
          "auto-redirect": false,
          "binary-mode": true,
          headers: {
            "Accept-Encoding": "identity",
            Range:
              "bytes=" +
              candidate.probeRange.start +
              "-" +
              candidate.probeRange.end,
            Referer: "https://www.bilibili.com/",
            "User-Agent": "BiliCDN-Background-Benchmark/10",
            "X-BiliCDN-Background": "1"
          },
          timeout: Math.ceil(timeoutMs / 1000),
          url: candidate.url
        };

        function complete(error, response, body) {
          var elapsed;
          if (completed) {
            return;
          }
          completed = true;
          if (timer !== null && typeof clearTimeout === "function") {
            clearTimeout(timer);
          }
          elapsed = Math.max(1, Date.now() - started);
          callback({
            body: body !== undefined ? body : "",
            elapsedMs: elapsed,
            error: Boolean(error),
            headers: response && response.headers || {},
            status: Number(response && (response.statusCode || response.status)) || 0,
            ttfbMs: responseTtfbMs(response, elapsed),
            url: response && response.url || candidate.url
          });
        }

        if (!client || typeof client.get !== "function") {
          complete(true, null, "");
          return;
        }
        if (typeof setTimeout === "function") {
          timer = setTimeout(function () {
            complete(true, null, "");
          }, timeoutMs);
        }
        try {
          client.get(request, complete);
        } catch (error) {
          complete(true, null, "");
        }
      },
      read: function (key) {
        return storeAvailable ? $persistentStore.read(key) : null;
      },
      write: function (value, key) {
        return storeAvailable ? $persistentStore.write(value, key) : false;
      }
    };
  }

  function safeLog(message) {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.log === "function"
    ) {
      console.log("[" + NAME + "] " + message);
    }
  }

  function runShadowrocket() {
    var config = parseArgument(
      typeof $argument === "string" ? $argument : ""
    );
    var services = createShadowrocketServices();
    var done = false;
    function complete() {
      if (!done) {
        done = true;
        $done();
      }
    }
    try {
      runBenchmark(config, services, function (result) {
        if (config.debug) {
          safeLog(
            "reason=" + result.reason +
              ", probes=" + result.probeCount +
              ", selected=" + (result.selectedHost || "none")
          );
        }
        complete();
      });
    } catch (error) {
      safeLog(
        "error=" + (error && error.message ? error.message : String(error))
      );
      complete();
    }
  }

  return {
    PUBLIC_SAMPLES: PUBLIC_SAMPLES,
    PROBE_TIMEOUT_MS: PROBE_TIMEOUT_MS,
    buildCandidatePlan: buildCandidatePlan,
    createShadowrocketServices: createShadowrocketServices,
    extractMediaSample: extractMediaSample,
    internalRangeForTotal: internalRangeForTotal,
    parseArgument: parseArgument,
    runBenchmark: runBenchmark,
    runShadowrocket: runShadowrocket
  };
});
