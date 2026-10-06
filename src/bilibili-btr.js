/*
 * BiliFlow BTR: bounded media Range transport for Shadowrocket.
 * Range splitting and download scheduling adapted from Bilibili-thread-ripper
 * bbf4d3dee502a16e424232ae6a51705f52b0e60d. Browser/player hooks are not used.
 *
 * MIT License
 * Copyright (c) 2026 Bilibili-thread-ripper contributors
 * Copyright (c) 2026 BiliFlow contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BiliBTR = api;
  if (typeof $done === "function" && typeof $request !== "undefined" &&
      typeof $response === "undefined" && root.__BILIBTR_DISABLED__ !== true) {
    api.runShadowrocket(root);
  }
})(this, function () {
  "use strict";
  var KIB = 1024, MIB = 1024 * KIB;
  var INTERNAL = "x-bilibtr-internal";
  var STATE_KEY = "BiliBTR.health.v2", LEASE_KEY = "BiliBTR.lease.v1";
  var DIAGNOSTIC_KEY = "BiliBTR.diagnostics.v1";
  var MEDIA_AUTHORITY = "(?:[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.bilivideo\\.(?:com|cn|net)|upos-hz-mirrorakam\\.akamaized\\.net)";
  var REQUEST_PATTERN = "^(?:http:\\/\\/" + MEDIA_AUTHORITY + "(?::80)?|https:\\/\\/" + MEDIA_AUTHORITY +
    "(?::443)?)\\/upgcxcode\\/[^?\\s]+\\.(?:m4s|mp4)(?:\\?|$)";
  var LADDER = [1, 2, 3, 4, 6, 8];
  var HOSTS = {
    mainland: ["upos-sz-mirrorali.bilivideo.com", "upos-sz-mirrorcos.bilivideo.com", "upos-sz-mirrorhw.bilivideo.com"],
    overseas: ["upos-sz-mirrorcosov.bilivideo.com", "upos-sz-mirroraliov.bilivideo.com"]
  };
  function number(value, fallback, minimum, maximum) {
    var parsed = Number(value);
    return Math.max(minimum, Math.min(maximum, value !== "" && Number.isFinite(parsed) ? Math.floor(parsed) : fallback));
  }
  function parseArgument(argument) {
    var raw = {}, valid = true;
    String(argument || "").split("&").filter(Boolean).forEach(function (item) {
      var parts = item.split("=");
      if (parts.length !== 2 || Object.prototype.hasOwnProperty.call(raw, parts[0])) valid = false;
      if (!/^(?:enabled|threads|maxThreads|maxMiB|budgetMs|mode|debug)$/.test(parts[0])) valid = false;
      raw[parts[0]] = parts[1];
    });
    var threads = raw.threads || "auto";
    var mode = raw.mode || "original";
    if (!/^(?:auto|[1-8])$/.test(threads) || !/^(?:original|mainland|overseas)$/.test(mode)) valid = false;
    if (raw.enabled && !/^(?:true|false)$/.test(raw.enabled)) valid = false;
    return {
      enabled: valid && raw.enabled === "true", valid: valid,
      auto: threads === "auto", threads: threads === "auto" ? 2 : Number(threads),
      maxThreads: number(raw.maxThreads, 8, 1, 8),
      maxBytes: number(raw.maxMiB, 4, 1, 8) * MIB,
      budgetMs: number(raw.budgetMs, 8000, 2000, 15000),
      mode: mode, debug: raw.debug === "true"
    };
  }
  function headers(value) {
    var result = {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i].toLowerCase(), item = value[keys[i]];
      if (Object.prototype.hasOwnProperty.call(result, key) || typeof item !== "string" || /[\r\n\0]/.test(item)) return null;
      result[key] = item;
    }
    return result;
  }
  function mediaUrl(value) {
    if (typeof value !== "string" || value.length > 8192 || /[\x00-\x20\x7f\\#]/.test(value)) return null;
    var match = /^(https?):\/\/([a-z0-9.-]+)(?::(\d+))?(\/[^?]*)(\?[^#]*)?$/i.exec(value);
    if (!match || !/^\/upgcxcode\/.+\.(?:m4s|mp4)$/i.test(match[4])) return null;
    var scheme = match[1].toLowerCase(), port = scheme === "http" ? "80" : "443";
    if (match[3] && match[3] !== port) return null;
    var host = match[2].toLowerCase();
    if (host.length > 253 || host.split(".").some(function (label) { return !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label); })) return null;
    if (!/(?:^|\.)bilivideo\.(?:com|cn|net)$/.test(host) && host !== "upos-hz-mirrorakam.akamaized.net") return null;
    return { url: value, scheme: scheme, port: port, host: host, path: match[4], query: match[5] || "" };
  }
  function byteRange(value) {
    var match = /^bytes=(\d+)-(\d+)$/i.exec(String(value || "").trim());
    if (!match) return null;
    var start = Number(match[1]), end = Number(match[2]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start || !Number.isSafeInteger(end - start + 1)) return null;
    return { start: start, end: end, length: end - start + 1 };
  }
  function hasBody(value) {
    if (value === undefined || value === null || value === "") return false;
    var binary = bytes(value);
    return binary ? binary.length > 0 : true;
  }
  function requestReason(request, config) {
    if (!config.valid || !config.enabled) return "disabled";
    if (!request || String(request.method).toUpperCase() !== "GET") return "method";
    var url = mediaUrl(request.url), h = headers(request.headers), range = h && byteRange(h.range);
    if (!url) return "url-unsupported";
    if (!h) return "headers-unavailable";
    if (h[INTERNAL]) return "internal";
    if (!range) return /^bytes=\d+-$/i.test(h.range || "") ? "range-open" : "range-unsupported";
    if (range.length < 256 * KIB) return "range-small";
    if (range.length > config.maxBytes) return "range-large";
    if (h.host && h.host.toLowerCase() !== url.host && h.host.toLowerCase() !== url.host + ":" + url.port) return "host-mismatch";
    // Other headers can carry authentication or representation selectors. Never silently drop them.
    var allowed = /^(?:range|accept|accept-encoding|accept-language|user-agent|referer|host|connection|cache-control|pragma)$/;
    if (Object.keys(h).some(function (key) { return !allowed.test(key); })) return "protected-headers";
    if (hasBody(request.body) || hasBody(request.bodyBytes)) return "request-body";
    return "eligible";
  }
  function planRequest(request, config) {
    if (requestReason(request, config) !== "eligible") return null;
    var url = mediaUrl(request.url), h = headers(request.headers), range = byteRange(h.range);
    return { url: url, headers: h, range: range };
  }
  function sameTarget(actual, expected) {
    var a = mediaUrl(actual), b = mediaUrl(expected);
    return Boolean(a && b && a.scheme === b.scheme && a.host === b.host && a.path === b.path && a.query === b.query);
  }
  function bytes(value) {
    if (value instanceof Uint8Array) return value;
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return new Uint8Array(value);
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    // Text is never a safe transport for media bytes, including a binary-looking string.
    return null;
  }
  function failure(reason, status, retryAfter) {
    var error = new Error(reason);
    error.reason = reason; error.status = Number(status) || 0; error.retryAfter = retryAfter || "";
    return error;
  }
  function validator(h) {
    var etag = h.etag || "";
    if (/^"[^"\x00-\x20\x7f]{1,180}"$/.test(etag)) return { kind: "etag", value: etag, etag: etag, opaqueTag: "", lastModified: "" };
    // RFC 9110 8.8.2.2: a Last-Modified date at least 60 seconds before the response's
    // Date can be treated as strong by a client. Some Bilibili mirrors send an unquoted
    // 32-hex ETag; never invent quoting or treat it as a valid entity-tag for If-Range.
    var modified = h["last-modified"] || "", date = h.date || "";
    var dateMs = Date.parse(date), modifiedMs = Date.parse(modified);
    if (Number.isFinite(dateMs) && Number.isFinite(modifiedMs) &&
        new Date(modifiedMs).toUTCString() === modified && new Date(dateMs).toUTCString() === date &&
        dateMs - modifiedMs >= 60000) {
      return { kind: "date", value: modified, etag: "", opaqueTag: etag.slice(0, 180), lastModified: modified };
    }
    return null;
  }
  function validate(result, range, expectedUrl, identity) {
    var h = headers(result && result.headers), status = Number(result && (result.status || result.statusCode));
    if (!h || status !== 206) throw failure("status", status, h && h["retry-after"]);
    var cr = /^bytes (\d+)-(\d+)\/(\d+)$/i.exec(h["content-range"] || "");
    var body = bytes(result.body);
    var type = (h["content-type"] || "").split(";")[0].trim().toLowerCase();
    if (!body) throw failure("binary-unavailable", status);
    if (!cr || Number(cr[1]) !== range.start || Number(cr[2]) !== range.end ||
        !Number.isSafeInteger(Number(cr[3])) || Number(cr[3]) <= range.end ||
        !body || body.length !== range.length ||
        (h["content-length"] && Number(h["content-length"]) !== range.length)) throw failure("range-invalid", status);
    if (!/^(?:video\/mp4|audio\/mp4|application\/octet-stream|binary\/octet-stream)$/.test(type) ||
        (h["content-encoding"] && h["content-encoding"].toLowerCase() !== "identity")) throw failure("representation", status);
    if (result.url && !sameTarget(result.url, expectedUrl)) throw failure("redirect", status);
    var version = validator(h);
    if (!version) throw failure("strong-validator-required", status);
    var total = Number(cr[3]);
    if (identity && (total !== identity.total || type !== identity.type || version.kind !== identity.version.kind ||
        version.value !== identity.version.value || version.opaqueTag !== identity.version.opaqueTag)) throw failure("object-changed", status);
    return { body: body, total: total, version: version, type: type };
  }
  function equalBytes(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
    return true;
  }
  function sameVersion(a, b) {
    return a.total === b.total && a.type === b.type && a.version.kind === b.version.kind &&
      a.version.value === b.version.value && a.version.opaqueTag === b.version.opaqueTag;
  }
  // Adapted from upstream assignPrimaries: spread tasks using smooth weighted
  // round-robin, give each verified route one initial measurement, and retire
  // measured routes below 1/12 of the fastest for this short-lived request.
  function routePicker(routes) {
    return function () {
      var usable = routes.filter(function (route) { return route.failures < 2; });
      if (!usable.length) throw failure("no-route");
      var untried = usable.find(function (route) { return !route.assigned; });
      if (untried) { untried.assigned = true; return untried; }
      var top = Math.max.apply(null, usable.map(function (route) { return route.speed || 1; }));
      var pool = usable.filter(function (route) { return !route.measured || route.speed >= top / 12; });
      var total = 0, best = pool[0];
      pool.forEach(function (route) {
        var weight = Math.max(route.speed || 1, top * 0.05);
        total += weight; route.credit = (route.credit || 0) + weight;
        if (route.credit > (best.credit || 0)) best = route;
      });
      best.credit -= total;
      return best;
    };
  }
  function hash(value) {
    var a = 2166136261, b = 2246822519;
    for (var i = 0; i < value.length; i += 1) {
      a = Math.imul(a ^ value.charCodeAt(i), 16777619);
      b = Math.imul(b ^ value.charCodeAt(i), 3266489917);
    }
    return ("00000000" + (a >>> 0).toString(16)).slice(-8) + ("00000000" + (b >>> 0).toString(16)).slice(-8);
  }
  function controller(config, saved, now) {
    saved = saved || {};
    var level = config.auto ? number(saved && saved.threads, 2, 1, config.maxThreads) : Math.min(config.threads, config.maxThreads);
    if (config.auto) level = LADDER.filter(function (n) { return n <= level; }).pop() || 1;
    var cooldown = 0, trial = null, changedAt = number(saved.changedAt, 0, 0, now);
    var baseline = number(saved.baselineBps, 0, 0, 1e9), samples = number(saved.samples, 0, 0, 2);
    if (saved && saved.cooldownUntil > now && saved.cooldownUntil <= now + 15 * 60 * 1000) {
      cooldown = saved.cooldownUntil;
    }
    if (config.auto && !cooldown && saved.trialFrom >= 1 && saved.trialFrom < level && saved.trialBps > 0) {
      var from = number(saved.trialFrom, 1, 1, level - 1);
      if (saved.trialAt > 0 && saved.trialAt <= now && now - saved.trialAt < 30000) {
        trial = { from: from, rate: number(saved.trialBps, 0, 0, 1e9), at: saved.trialAt };
      } else { level = from; cooldown = now + 30000; samples = 0; }
    }
    function next(value) { return LADDER.filter(function (n) { return n > value && n <= config.maxThreads; })[0] || value; }
    return {
      threads: function () { return level; },
      observe: function (sample, at) {
        if (!config.auto) return;
        if (sample.status === 429 || sample.failed) {
          level = Math.max(1, Math.floor(level / 2)); trial = null;
          cooldown = at + (sample.status === 429 ? 180000 : 30000); samples = 0; baseline = 0; changedAt = at;
          return;
        }
        // Ignore short tails, under-filled windows and measurements from an older limit.
        // A pending trial can continue in the next script invocation instead of reverting
        // before the higher concurrency was ever used.
        if (sample.bytes < 256 * KIB || sample.elapsedMs < 150 || !sample.saturated ||
            (sample.usedThreads !== undefined && sample.usedThreads !== level)) return;
        var rate = sample.bytes * 1000 / sample.elapsedMs;
        if (trial) {
          if (rate < trial.rate * 1.08) {
            level = trial.from; cooldown = at + 90000; baseline = trial.rate; samples = 0; changedAt = at;
          } else { baseline = rate; samples = 1; }
          trial = null;
          return;
        }
        baseline = baseline > 0 ? baseline * 0.5 + rate * 0.5 : rate;
        samples = Math.min(2, samples + 1);
        if (samples >= 2 && at >= cooldown && (!changedAt || at - changedAt >= 2500) && next(level) > level) {
          trial = { from: level, rate: baseline, at: at }; level = next(level); samples = 0; changedAt = at;
        }
      },
      snapshot: function () { return { threads: level, cooldownUntil: cooldown, baselineBps: baseline,
        samples: samples, trialFrom: trial ? trial.from : 0, trialBps: trial ? trial.rate : 0, trialAt: trial ? trial.at : 0,
        changedAt: changedAt }; }
    };
  }
  function readJson(services, key) {
    try {
      var value = services.read && services.read(key);
      if (typeof value !== "string" || value.length > 32768) return {};
      var parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_) { return {}; }
  }
  function writeJson(services, key, value) {
    try { return Boolean(services.write && services.write(JSON.stringify(value), key)); } catch (_) { return false; }
  }
  function storedHealth(services, key, now) {
    var entry = readJson(services, STATE_KEY)[key];
    if (!entry || entry.at > now || entry.at <= now - 900000) return {};
    return entry.at > now - 300000 ? entry : { blockedUntil: entry.blockedUntil };
  }
  function saveHealth(services, key, entry, now) {
    var state = readJson(services, STATE_KEY), clean = {};
    state[key] = entry;
    Object.keys(state).filter(function (k) {
      return /^[0-9a-f]{16}$/.test(k) && state[k] && state[k].at <= now && state[k].at > now - 900000;
    }).sort(function (a, b) { return state[b].at - state[a].at; }).slice(0, 24).forEach(function (k) {
      var v = state[k];
      clean[k] = { at: v.at, threads: number(v.threads, 2, 1, 8), cooldownUntil: number(v.cooldownUntil, 0, 0, now + 900000),
        blockedUntil: number(v.blockedUntil, 0, 0, now + 900000), baselineBps: number(v.baselineBps, 0, 0, 1e9),
        samples: number(v.samples, 0, 0, 2), trialFrom: number(v.trialFrom, 0, 0, 8), trialBps: number(v.trialBps, 0, 0, 1e9),
        trialAt: number(v.trialAt, 0, 0, now), changedAt: number(v.changedAt, 0, 0, now),
        connectionBps: number(v.connectionBps, 0, 0, 1e9) };
    });
    writeJson(services, STATE_KEY, clean);
  }
  function pause(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  // Cooperative admission, not an atomic process-wide semaphore. Recheck ownership before
  // each queue refill and response. Unavailable storage fails open instead of multiplying memory use.
  async function lease(services, now, duration) {
    if (!services.read || !services.write) return null;
    var token = hash(String(now) + ":" + Math.random());
    var old = readJson(services, LEASE_KEY);
    if (old.until > now && old.until <= now + 60000) return null;
    var value = { owner: token, until: now + duration + 1000 };
    if (!writeJson(services, LEASE_KEY, value)) return null;
    await (services.pause || pause)(25);
    function owns() { var latest = readJson(services, LEASE_KEY); return latest.owner === token; }
    if (!owns()) return null;
    return { owns: owns, release: function () { if (owns()) writeJson(services, LEASE_KEY, {}); } };
  }
  function retryDelay(value, now) {
    if (/^\d+$/.test(value)) return Math.min(900000, Math.max(1000, Number(value) * 1000));
    var date = Date.parse(value);
    return Number.isFinite(date) ? Math.min(900000, Math.max(1000, date - now)) : 180000;
  }
  async function accelerate(request, config, services) {
    var reason = requestReason(request, config);
    var plan = planRequest(request, config);
    var now = services.now || Date.now, started = now(), expires = started + config.budgetMs;
    // Actual media demand extends the existing background benchmark's quiet period.
    try {
      var activity = Number(services.read && services.read("BiliCDN.uiActivity.v1"));
      if (config.enabled && request && request.method === "GET" && mediaUrl(request.url) && reason !== "internal" &&
          (!activity || activity > started || started - activity >= 30000) && services.write) {
        services.write(String(started), "BiliCDN.uiActivity.v1");
      }
    } catch (_) { /* Activity storage must never delay playback. */ }
    if (!plan) return { action: "pass", reason: reason };
    var networkHost = String(services.network || "unknown") + "|" + plan.url.scheme + "|" + plan.url.host;
    var key = hash(networkHost + "|" + config.mode + "|" + (config.auto ? "auto" : "fixed") + "|" +
      Math.ceil(Math.log2(plan.range.length / (256 * KIB))));
    var rateKey = hash(networkHost + "|rate");
    var addressKey = hash(String(services.network || "unknown") + "|address|" + plan.url.url);
    var saved = storedHealth(services, key, started);
    var addressSaved = storedHealth(services, addressKey, started);
    var rateSaved = storedHealth(services, rateKey, started);
    if ([saved, addressSaved, rateSaved].some(function (entry) { return entry.blockedUntil > started && entry.blockedUntil <= started + 900000; })) return { action: "pass", reason: "backoff" };
    var admission = await lease(services, started, config.budgetMs);
    if (!admission) return { action: "pass", reason: "busy" };
    var auto = controller(config, saved, started), tasks = new Set(), stopped = false;
    var requests = 0, downloaded = 0, received = 0, retried = 0, peak = 0, active = 0;
    var history = [auto.threads()], routes = [], output = null;
    var success = false, lingering = false;
    var hardTimer = null, canceledByClient = false, removeSignal = function () {};
    function stop(reason) {
      stopped = true;
      tasks.forEach(function (task) { task.cancel(reason); });
    }
    function check() {
      if (stopped || now() >= expires) throw failure(canceledByClient ? "canceled" : "deadline");
      if (!admission.owns()) throw failure("lease-lost");
    }
    function download(url, range, identity, timeout) {
      check();
      return new Promise(function (resolve, reject) {
        var done = false, handle = null, timer = null, nativePending = true;
        var begin = now(), limit = Math.max(1, Math.min(timeout || 3000, expires - begin));
        var task = { cancel: function (reason) { finish(reason || failure("canceled")); } };
        function finish(error, result) {
          if (done) return; done = true;
          clearTimeout(timer); tasks.delete(task); active -= 1;
          if (error && nativePending) {
            if (handle && typeof handle.cancel === "function") { try { handle.cancel(); } catch (_) { lingering = true; } }
            else lingering = true;
          }
          if (error) reject(error); else resolve(result);
        }
        var h = { Range: "bytes=" + range.start + "-" + range.end, "Accept-Encoding": "identity", "X-BiliBTR-Internal": "1" };
        if (plan.headers["user-agent"]) h["User-Agent"] = plan.headers["user-agent"];
        if (plan.headers.referer) h.Referer = plan.headers.referer;
        if (plan.headers.accept) h.Accept = plan.headers.accept;
        if (plan.headers["accept-language"]) h["Accept-Language"] = plan.headers["accept-language"];
        if (identity) h["If-Range"] = identity.version.value;
        requests += 1; active += 1; peak = Math.max(peak, active); tasks.add(task);
        timer = setTimeout(function () { finish(failure("timeout")); }, limit);
        try {
          handle = services.request({ url: url, headers: h, timeoutMs: limit, maxBytes: range.length }, function (error, result) {
            nativePending = false;
            if (done) return;
            var rawBytes = result && bytes(result.body);
            if (rawBytes) received += rawBytes.length;
            if (error) { finish(failure("transport")); return; }
            try {
              check();
              var valid = validate(result, range, url, identity);
              downloaded += valid.body.length;
              valid.elapsedMs = Math.max(1, now() - begin);
              finish(null, valid);
            } catch (problem) { finish(problem); }
          });
          if (done && stopped && handle && typeof handle.cancel === "function") handle.cancel();
        } catch (_) { nativePending = false; finish(failure("transport")); }
      });
    }
    try {
      var signal = request.signal;
      if (signal && typeof signal.addEventListener === "function") {
        var onAbort = function () { canceledByClient = true; stop(); };
        signal.addEventListener("abort", onAbort);
        removeSignal = function () { signal.removeEventListener("abort", onAbort); };
        if (signal.aborted) onAbort();
      }
      hardTimer = setTimeout(function () { stop(failure("deadline")); }, Math.max(1, expires - now()));
      var first = { start: plan.range.start, end: plan.range.start + 64 * KIB - 1, length: 64 * KIB };
      var reference = await download(plan.url.url, first, null, 2500);
      if (reference.total <= plan.range.end) throw failure("unsatisfied-range");
      output = new Uint8Array(plan.range.length);
      output.set(reference.body, 0);
      routes.push({ url: plan.url.url, identity: reference, speed: first.length * 1000 / reference.elapsedMs, failures: 0 });
      // Cross-CDN use is opt-in and bounded to two reviewed mirrors. The original URL is
      // always the byte reference; each new host needs its own stable validator and two
      // byte-identical ranges, since entity tags are scoped to an origin.
      var mirrorKey = hash(String(services.network || "unknown") + "|mirrors|" + plan.url.url + "|" + config.mode + "|" +
        reference.total + "|" + reference.version.value + "|" + reference.version.opaqueTag);
      var mirrorBackoff = storedHealth(services, mirrorKey, now());
      var candidates = (mirrorBackoff.blockedUntil > now() ? [] : HOSTS[config.mode] || [])
        .filter(function (host) { return host !== plan.url.host; }).slice(0, 2);
      if (candidates.length && expires - now() > 3000) {
        var tail = { start: plan.range.end - 64 * KIB + 1, end: plan.range.end, length: 64 * KIB };
        var tailRef = await download(plan.url.url, tail, reference, 1200);
        output.set(tailRef.body, tail.start - plan.range.start);
        for (var ci = 0; ci < candidates.length && expires - now() > 2000; ci += 1) {
          var candidate = plan.url.scheme + "://" + candidates[ci] + plan.url.path + plan.url.query;
          try {
            var checks;
            if (auto.threads() > 1) {
              var settled = await Promise.all([download(candidate, first, null, 1000), download(candidate, tail, null, 1000)]
                .map(function (promise) { return promise.then(function (value) { return { value: value }; }, function (error) { return { error: error }; }); }));
              if (settled.some(function (item) { return item.error; })) throw settled.find(function (item) { return item.error; }).error;
              checks = settled.map(function (item) { return item.value; });
            } else checks = [await download(candidate, first, null, 1000), await download(candidate, tail, null, 1000)];
            var a = checks[0], b = checks[1];
            // Entity tags are scoped to their origin, not globally comparable across CDNs.
            // Prove sampled bytes against the original and pin each route to its OWN strong
            // validator. Subsequent subranges use that route's If-Range token.
            if (sameVersion(a, b) && a.total === reference.total && a.type === reference.type &&
                equalBytes(a.body, reference.body) && equalBytes(b.body, tailRef.body)) {
              routes.push({ url: candidate, identity: { version: a.version, total: a.total, type: a.type },
                speed: (a.body.length + b.body.length) * 1000 / (a.elapsedMs + b.elapsedMs), failures: 0 });
            }
          } catch (candidateError) { if (lingering) throw candidateError; check(); }
        }
        if (routes.length === 1) saveHealth(services, mirrorKey, { at: now(), blockedUntil: now() + 120000 }, now());
      }
      var end = plan.range.end - (tailRef ? tailRef.body.length : 0);
      var cursor = first.end + 1, connectionSpeed = number(saved.connectionBps > 0 ? saved.connectionBps : routes[0].speed, routes[0].speed, 1, 1e9);
      var pickRoute = routePicker(routes);
      var limit = auto.threads();
      // Freeze chunk geometry within one request: shrinking every batch amplified RTT and
      // made concurrency trials compare different chunk sizes. Refill freed slots immediately.
      var geometry = Math.ceil((end - cursor + 1) / Math.max(4, limit * 2) / (64 * KIB)) * 64 * KIB;
      var spread = Math.ceil((end - cursor + 1) / Math.max(4, limit) / (64 * KIB)) * 64 * KIB;
      var chunkSize = Math.max(64 * KIB, Math.min(MIB, spread, Math.max(geometry,
        Math.floor(connectionSpeed * 0.6 / (64 * KIB)) * 64 * KIB)));
      await new Promise(function (resolve, reject) {
        var running = 0, failed = false;
        var windowStart = now(), measuredAt = windowStart, busyMs = 0, completedBytes = 0, completions = 0, observedPeak = 0;
        function integrate() {
          var at = now(); busyMs += Math.max(0, at - measuredAt) * Math.min(running, limit); measuredAt = at;
        }
        function observe(final) {
          if (!final && completions < Math.max(2, limit)) return;
          var at = now(), elapsed = Math.max(1, at - windowStart);
          if (!final && (elapsed < 150 || completedBytes < 256 * KIB)) return;
          auto.observe({ bytes: completedBytes, elapsedMs: elapsed, usedThreads: limit,
            saturated: observedPeak >= limit && busyMs >= elapsed * limit * 0.6 }, at);
          var desired = auto.threads();
          // Carry an unexecuted trial to the next request; don't claim a higher actual
          // limit or judge it on a tail too short to fill its slots.
          if (desired < limit || end - cursor + 1 >= chunkSize * Math.max(1, desired - running)) limit = desired;
          windowStart = at; measuredAt = at; busyMs = 0; completedBytes = 0; completions = 0; observedPeak = running;
        }
        function fail(error) { if (!failed) { failed = true; reject(error); } }
        async function pieceJob(piece) {
          var usable = routes.filter(function (route) { return route.failures < 2; }).sort(function (x, y) { return y.speed - x.speed; });
          if (!usable.length) throw failure("no-route");
          var route = pickRoute();
          for (var attempt = 0; attempt < 2; attempt += 1) {
            try {
              var timeout = Math.max(1500, Math.min(5000, piece.length * 1500 / Math.max(1, route.speed) + 300));
              var response = await download(route.url, piece, route.identity, timeout);
              check();
              route.failures = 0;
              if (piece.length >= 48 * KIB) {
                var measuredSpeed = piece.length * 1000 / response.elapsedMs;
                route.speed = route.speed * 0.65 + measuredSpeed * 0.35;
                connectionSpeed = connectionSpeed * 0.7 + measuredSpeed * 0.3;
                route.measured = true;
              }
              output.set(response.body, piece.start - plan.range.start);
              return;
            } catch (error) {
              check();
              if ((error.status >= 400 && error.status < 500) ||
                  /^(?:object-changed|range-invalid|representation|redirect|strong-validator-required|binary-unavailable)$/.test(error.reason)) throw error;
              route.failures += 1;
              if (attempt || lingering || expires - now() < 600) throw error;
              retried += 1;
              route = usable.find(function (item) { return item !== route && item.failures < 2; }) || route;
            }
          }
        }
        function pump() {
          if (failed) return;
          try {
            check();
            while (running < limit && cursor <= end) {
              var size = Math.min(chunkSize, end - cursor + 1);
              var piece = { start: cursor, end: cursor + size - 1, length: size };
              cursor += size;
              integrate(); running += 1; observedPeak = Math.max(observedPeak, running);
              if (running === limit && history[history.length - 1] !== limit) history.push(limit);
              (function (item) {
                pieceJob(item).then(function () {
                  if (failed) return;
                  integrate(); running -= 1; completedBytes += item.length; completions += 1;
                  observe(cursor > end && running === 0);
                  if (cursor > end && running === 0) resolve(); else pump();
                }, fail);
              })(piece);
            }
            if (cursor > end && running === 0) resolve();
          } catch (error) { fail(error); }
        }
        pump();
      });
      check();
      saveHealth(services, key, Object.assign({ at: now(), blockedUntil: 0, connectionBps: connectionSpeed }, auto.snapshot()), now());
      success = true;
      var responseHeaders = {
        "Content-Type": reference.type, "Content-Length": String(plan.range.length),
        "Content-Range": "bytes " + plan.range.start + "-" + plan.range.end + "/" + reference.total,
        "Accept-Ranges": "bytes", "Cache-Control": "private, no-store"
      };
      if (reference.version.etag) responseHeaders.ETag = reference.version.etag;
      if (reference.version.lastModified) responseHeaders["Last-Modified"] = reference.version.lastModified;
      return { action: "respond", reason: "accelerated", response: { status: 206, headers: responseHeaders,
        body: output }, stats: { requests: requests, retries: retried, downloadedBytes: downloaded,
        receivedBytes: received, deliveredBytes: plan.range.length, elapsedMs: now() - started,
        deliveredMiBps: Math.round(plan.range.length * 1000000 / (MIB * Math.max(1, now() - started))) / 1000,
        peak: peak, threads: history, nextThreads: auto.snapshot().threads, routes: routes.length } };
    } catch (error) {
      stop();
      if (!canceledByClient && !/^(?:lease-lost|deadline|canceled)$/.test(error.reason)) {
        var addressFailure = (error.status >= 400 && error.status < 500 && error.status !== 429) ||
          /^(?:strong-validator-required|representation|object-changed|range-invalid|unsatisfied-range|redirect|binary-unavailable)$/.test(error.reason);
        if (!addressFailure) auto.observe({ failed: true, status: error.status }, now());
        // A refused signature does not blacklist its host. Cool down acceleration briefly,
        // allowing the app to retry its original URL/backup/refresh flow without interception.
        var wait = error.status === 429 ? retryDelay(error.retryAfter, now()) :
          /^(?:strong-validator-required|representation)$/.test(error.reason) ? 60000 : 15000;
        saveHealth(services, addressFailure ? addressKey : error.status === 429 ? rateKey : key,
          Object.assign({ at: now(), blockedUntil: now() + wait }, auto.snapshot()), now());
      }
      return { action: "pass", reason: error.reason || "error", stats: { requests: requests, peak: peak,
        downloadedBytes: downloaded, receivedBytes: received, elapsedMs: now() - started } };
    } finally {
      clearTimeout(hardTimer); removeSignal(); stop();
      // If native cancellation is not available, keep admission until the lease expires.
      // It limits immediate overlap with late native callbacks after fail-open.
      if (!lingering && (success || services.cancellable === true || tasks.size === 0)) admission.release();
    }
  }
  function createShadowrocketServices(root) {
    var client = root.$httpClient, store = root.$persistentStore;
    var network = root.$network || {}, wifi = network.wifi || {}, cell = network.cellular || {};
    return {
      now: Date.now, network: hash(String(wifi.ssid || wifi.bssid || cell.carrier || "unknown")),
      read: store && function (key) { return store.read(key); },
      write: store && function (value, key) { return store.write(value, key); },
      cancellable: false,
      request: function (options, callback) {
        if (!client || typeof client.get !== "function") { callback(new Error("http-unavailable")); return null; }
        var native = client.get({ url: options.url, headers: options.headers,
          "binary-mode": true, "auto-redirect": false, "auto-cookie": false,
          timeout: Math.max(1, Math.ceil(options.timeoutMs / 1000)) }, function (error, response, body) {
          var binary = [bytes(response && response.bodyBytes), bytes(body), bytes(response && response.body)];
          callback(error, { status: response && (response.statusCode || response.status),
            headers: response && response.headers, url: response && response.url,
            body: binary.find(function (value) { return value && value.length > 0; }) || binary.find(Boolean) || body });
        });
        if (native && typeof native.abort === "function") return { cancel: function () { native.abort(); } };
        if (native && typeof native.cancel === "function") return { cancel: function () { native.cancel(); } };
        return null;
      }
    };
  }
  function recordDiagnostic(root, services, config, request, result) {
    if (!config.enabled || result.reason === "internal" || !root.console) return;
    var at = (services.now || Date.now)();
    var previous = readJson(services, DIAGNOSTIC_KEY);
    var version = String(root.__BILIFLOW_VERSION__ || "dev");
    var counts = {}, oldCounts = previous.counts || {}, stats = result.stats || {};
    Object.keys(oldCounts).filter(function (key) { return /^[a-z-]{1,40}$/.test(key); }).slice(0, 32).forEach(function (key) {
      counts[key] = number(oldCounts[key], 0, 0, 100000);
    });
    var code = /^[a-z-]{1,40}$/.test(result.reason || "") ? result.reason : "error";
    counts[code] = Math.min(100000, (counts[code] || 0) + 1);
    var scheme = /^http:/.test(request && request.url || "") ? "http" : "https";
    var totals = {
      version: version, lastLogAt: number(previous.lastLogAt, 0, 0, at), counts: counts,
      http: number(previous.http, 0, 0, 100000) + (scheme === "http" ? 1 : 0),
      https: number(previous.https, 0, 0, 100000) + (scheme === "https" ? 1 : 0),
      peak: Math.max(number(previous.peak, 0, 0, 8), stats.peak || 0),
      deliveredBytes: number(previous.deliveredBytes, 0, 0, 1e12) + (stats.deliveredBytes || 0)
    };
    if (config.debug) root.console.log("[BiliBTR] " + JSON.stringify({ version: version, event: "request", scheme: scheme,
      reason: code, stats: stats }));
    var summary = null;
    if (!totals.lastLogAt || at - totals.lastLogAt >= 30000 || previous.version !== version) {
      summary = { version: version, event: "summary", counts: counts,
        http: totals.http, https: totals.https, peak: totals.peak, deliveredBytes: totals.deliveredBytes };
      totals.lastLogAt = at; totals.counts = {}; totals.http = 0; totals.https = 0; totals.peak = 0; totals.deliveredBytes = 0;
    }
    if (writeJson(services, DIAGNOSTIC_KEY, totals) && summary) root.console.log("[BiliBTR] " + JSON.stringify(summary));
  }
  function runShadowrocket(root) {
    var completed = false;
    function done(value) { if (!completed) { completed = true; root.$done(value); } }
    try {
      var config = parseArgument(typeof root.$argument === "string" ? root.$argument : "");
      var services = createShadowrocketServices(root);
      function finish(result) {
        try { recordDiagnostic(root, services, config, root.$request, result); } catch (_) { /* Diagnostics never block completion. */ }
        done(result.action === "respond" ? { response: result.response } : {});
      }
      accelerate(root.$request, config, services).then(finish, function () { finish({ action: "pass", reason: "runtime-error" }); });
    } catch (_) { done({}); }
  }
  return { parseArgument: parseArgument, planRequest: planRequest, requestReason: requestReason, byteRange: byteRange, mediaUrl: mediaUrl,
    validate: validate, controller: controller, routePicker: routePicker, accelerate: accelerate, createShadowrocketServices: createShadowrocketServices,
    runShadowrocket: runShadowrocket, recordDiagnostic: recordDiagnostic, REQUEST_PATTERN: REQUEST_PATTERN,
    STATE_KEY: STATE_KEY, LEASE_KEY: LEASE_KEY, DIAGNOSTIC_KEY: DIAGNOSTIC_KEY };
});
