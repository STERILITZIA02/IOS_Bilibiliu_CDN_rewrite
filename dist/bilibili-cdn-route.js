"use strict";

/*
 * BiliFlow cached-media route for Shadowrocket.
 *
 * The playback response runtime stores a bounded table of complete signed URLs
 * that Bilibili returned for the same media object. This request runtime only
 * performs a synchronous lookup and exact URL replacement. It never probes a
 * CDN, edits a signature, or constructs an Akamai URL.
 */
(function (root) {
  var NAME = "BiliRoute";
  var MEDIA_ROUTE_STATE_KEY = "BiliCDN.mediaRoutes.v9";
  var MEDIA_ROUTE_STATE_VERSION = 9;
  var MEDIA_ROUTE_EXPIRY_SAFETY_MS = 30 * 1000;
  var MEDIA_ROUTE_MAX_TTL_MS = 2 * 60 * 60 * 1000;
  var MEDIA_ROUTE_MAX_URL_BYTES = 8192;
  var MEDIA_SUFFIXES = [
    "acgvideo.com",
    "bilivideo.com",
    "bilivideo.cn",
    "bilivideo.net",
    "bilibilivideo.com",
    "ourdvsss.com",
    "ksyungslb.com",
    "00cdn.com"
  ];

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function parseBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    return /^(?:1|true|yes|on)$/i.test(String(value || "").trim());
  }

  function normalizeNetworkProfile(value) {
    var profile = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (!profile) {
      return "auto";
    }
    return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(profile) ? profile : "auto";
  }

  function parseRuntimeArgument(argument) {
    var config = { auto: true, debug: false, networkProfile: "auto" };
    var raw = typeof argument === "string" ? argument.trim() : "";
    var parsed;
    var pairs;
    var index;
    var splitAt;
    var key;
    var value;
    if (!raw) {
      return config;
    }
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }
    if (isObject(parsed) && !Array.isArray(parsed)) {
      if (Object.prototype.hasOwnProperty.call(parsed, "cdn")) {
        config.auto = /^auto$/i.test(String(parsed.cdn || "").trim());
      }
      config.debug = parseBoolean(parsed.debug);
      config.networkProfile = normalizeNetworkProfile(
        parsed.networkProfile || parsed.profile
      );
      return config;
    }
    pairs = raw.split(/[&,]/);
    for (index = 0; index < pairs.length; index += 1) {
      splitAt = pairs[index].indexOf("=");
      if (splitAt === -1) {
        continue;
      }
      try {
        key = decodeURIComponent(pairs[index].slice(0, splitAt))
          .trim()
          .toLowerCase();
        value = decodeURIComponent(pairs[index].slice(splitAt + 1)).trim();
      } catch (error) {
        return { auto: false, debug: false, networkProfile: "auto" };
      }
      if (key === "cdn") {
        config.auto = /^auto$/i.test(value);
      } else if (key === "debug") {
        config.debug = parseBoolean(value);
      } else if (key === "networkprofile" || key === "profile") {
        config.networkProfile = normalizeNetworkProfile(value);
      }
    }
    return config;
  }

  function hostnameMatchesSuffix(hostname, suffix) {
    return (
      hostname === suffix ||
      hostname.slice(-(suffix.length + 1)) === "." + suffix
    );
  }

  function isBilibiliMediaHost(hostname) {
    var index;
    hostname = String(hostname || "").toLowerCase();
    for (index = 0; index < MEDIA_SUFFIXES.length; index += 1) {
      if (hostnameMatchesSuffix(hostname, MEDIA_SUFFIXES[index])) {
        return true;
      }
    }
    return (
      /^upos-[a-z0-9-]+\.akamaized\.net$/i.test(hostname) ||
      /^uposdash-[a-z0-9-]+\.yfcdn\.net$/i.test(hostname)
    );
  }

  function parseHttpUrl(value) {
    var match;
    var authority;
    var hostname;
    var remainder;
    var queryAt;
    if (typeof value !== "string" || value.length > MEDIA_ROUTE_MAX_URL_BYTES) {
      return null;
    }
    match = /^(https?):\/\/([^\/?#]+)([^#]*)$/i.exec(value);
    if (!match) {
      return null;
    }
    authority = match[2];
    if (authority.indexOf("@") !== -1) {
      return null;
    }
    hostname = authority.replace(/:\d+$/, "").toLowerCase();
    remainder = match[3] || "/";
    queryAt = remainder.indexOf("?");
    return {
      authority: authority,
      hostname: hostname,
      path: queryAt === -1 ? remainder : remainder.slice(0, queryAt),
      query: queryAt === -1 ? "" : remainder.slice(queryAt),
      remainder: remainder
    };
  }

  function isVodMediaUrl(value) {
    var parsed = parseHttpUrl(value);
    var lowerRemainder;
    if (!parsed || !isBilibiliMediaHost(parsed.hostname)) {
      return false;
    }
    lowerRemainder = parsed.remainder.toLowerCase();
    return (
      /^\/upgcxcode\//.test(lowerRemainder) ||
      /(?:[?&])bvc=vod(?:&|$)/.test(lowerRemainder)
    );
  }

  function imul32(left, right) {
    var leftHigh;
    var leftLow;
    var rightHigh;
    var rightLow;
    if (typeof Math.imul === "function") {
      return Math.imul(left, right);
    }
    leftHigh = (left >>> 16) & 0xffff;
    leftLow = left & 0xffff;
    rightHigh = (right >>> 16) & 0xffff;
    rightLow = right & 0xffff;
    return (
      (leftLow * rightLow +
        (((leftHigh * rightLow + leftLow * rightHigh) & 0xffff) << 16)) |
      0
    );
  }

  function hex32(value) {
    return ("00000000" + (value >>> 0).toString(16)).slice(-8);
  }

  function stableHash(prefix, value) {
    var text = String(value);
    var hashes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
    var primes = [0x01000193, 0x27d4eb2d, 0x165667b1, 0x1b873593];
    var index;
    var lane;
    var code;
    for (index = 0; index < text.length; index += 1) {
      code = text.charCodeAt(index);
      for (lane = 0; lane < hashes.length; lane += 1) {
        hashes[lane] ^= code + lane * 257;
        hashes[lane] = imul32(hashes[lane], primes[lane]);
        hashes[lane] ^= hashes[lane] >>> 13;
      }
    }
    return (
      prefix +
      "2_" +
      hex32(hashes[0]) +
      hex32(hashes[1]) +
      hex32(hashes[2]) +
      hex32(hashes[3])
    );
  }

  function decodeMediaQueryValue(value) {
    try {
      return decodeURIComponent(String(value || "").replace(/\+/g, "%20"));
    } catch (error) {
      return "";
    }
  }

  function mediaRouteQueryValues(parsed) {
    var allowed = {
      buvid: true,
      deadline: true,
      exp: true,
      expires: true,
      hdnts: true,
      mid: true,
      oi: true,
      trid: true
    };
    var output = {};
    var query = parsed && typeof parsed.query === "string"
      ? parsed.query.replace(/^\?/, "")
      : "";
    var pairs;
    var index;
    var splitAt;
    var key;
    var value;
    if (!query || query.length > MEDIA_ROUTE_MAX_URL_BYTES) {
      return output;
    }
    pairs = query.split("&");
    for (index = 0; index < pairs.length; index += 1) {
      splitAt = pairs[index].indexOf("=");
      key = decodeMediaQueryValue(
        splitAt === -1 ? pairs[index] : pairs[index].slice(0, splitAt)
      ).toLowerCase();
      if (!allowed[key] || Object.prototype.hasOwnProperty.call(output, key)) {
        continue;
      }
      value = decodeMediaQueryValue(
        splitAt === -1 ? "" : pairs[index].slice(splitAt + 1)
      );
      if (value.length <= 512) {
        output[key] = value;
      }
    }
    return output;
  }

  function unixExpiryMilliseconds(value) {
    var text = String(value || "").trim();
    var parsed;
    if (!/^\d{9,13}$/.test(text)) {
      return 0;
    }
    parsed = Number(text);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      return 0;
    }
    return parsed < 100000000000 ? parsed * 1000 : parsed;
  }

  function signedMediaExpiryMilliseconds(values) {
    var expiry = unixExpiryMilliseconds(
      values && (values.deadline || values.expires || values.exp)
    );
    var match;
    if (expiry > 0) {
      return expiry;
    }
    match = /(?:^|~)exp=(\d{9,13})(?:~|$)/i.exec(
      String(values && values.hdnts || "")
    );
    return match ? unixExpiryMilliseconds(match[1]) : 0;
  }

  function boundedMediaBindingValue(value) {
    value = typeof value === "string" ? value : "";
    return value.length <= 256 ? value : "";
  }

  function mediaRouteKeyForUrl(url, networkProfile) {
    var parsed;
    var values;
    var signedExpiresAt;
    var transaction;
    var member;
    var originIp;
    var device;
    var material;
    parsed = parseHttpUrl(url);
    if (!parsed || !isVodMediaUrl(url)) {
      return null;
    }
    values = mediaRouteQueryValues(parsed);
    signedExpiresAt = signedMediaExpiryMilliseconds(values);
    transaction = boundedMediaBindingValue(values.trid);
    member = boundedMediaBindingValue(values.mid);
    originIp = boundedMediaBindingValue(values.oi);
    device = boundedMediaBindingValue(values.buvid);
    if (
      signedExpiresAt <= MEDIA_ROUTE_EXPIRY_SAFETY_MS ||
      (!transaction && !(member && originIp) && !device)
    ) {
      return null;
    }
    material = [
      normalizeNetworkProfile(networkProfile),
      parsed.path,
      String(signedExpiresAt),
      transaction,
      member,
      originIp,
      device
    ].join("\u0000");
    return {
      authority: parsed.authority,
      expiresAt: signedExpiresAt - MEDIA_ROUTE_EXPIRY_SAFETY_MS,
      hostname: parsed.hostname,
      key: stableHash("m", material),
      path: parsed.path,
      signedExpiresAt: signedExpiresAt
    };
  }

  function headerValue(headers, name) {
    var keys;
    var index;
    if (!isObject(headers) || Array.isArray(headers)) {
      return "";
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      if (keys[index].toLowerCase() === name.toLowerCase()) {
        return String(headers[keys[index]] || "");
      }
    }
    return "";
  }

  function rewriteAuthorityHeaders(headers, authority) {
    var output = {};
    var keys;
    var index;
    var key;
    if (!isObject(headers) || Array.isArray(headers)) {
      return null;
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      output[key] =
        /^(?:host|:authority)$/i.test(key) ? authority : headers[key];
    }
    return output;
  }

  function stringArrayContainsHostname(value, hostname) {
    var index;
    if (!Array.isArray(value)) {
      return false;
    }
    for (index = 0; index < value.length && index < 16; index += 1) {
      if (String(value[index] || "").toLowerCase() === hostname) {
        return true;
      }
    }
    return false;
  }

  function unchangedResult(url, reason) {
    return { changed: false, reason: reason, url: String(url || "") };
  }

  function selectMediaRequest(
    requestUrl,
    method,
    headers,
    argument,
    services
  ) {
    var config = parseRuntimeArgument(argument);
    var parsed = parseHttpUrl(requestUrl);
    var binding;
    var now;
    var raw;
    var state;
    var entry;
    var target;
    var targetBinding;
    var expiresAt;
    method = String(method || "GET").toUpperCase();
    if (!config.auto) {
      return unchangedResult(requestUrl, "mode-disabled");
    }
    if (
      (method !== "GET" && method !== "HEAD") ||
      !parsed ||
      !isVodMediaUrl(requestUrl) ||
      headerValue(headers, "x-bilicdn-background") === "1"
    ) {
      return unchangedResult(requestUrl, "request-unmatched");
    }
    if (
      !services ||
      typeof services.now !== "function" ||
      typeof services.read !== "function"
    ) {
      return unchangedResult(requestUrl, "state-unavailable");
    }
    binding = mediaRouteKeyForUrl(requestUrl, config.networkProfile);
    if (!binding) {
      return unchangedResult(requestUrl, "binding-unavailable");
    }
    now = Number(services.now());
    if (!Number.isFinite(now) || binding.expiresAt <= now) {
      return unchangedResult(requestUrl, "request-expired");
    }
    try {
      raw = services.read(MEDIA_ROUTE_STATE_KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch (error) {
      state = null;
    }
    if (
      !isObject(state) ||
      state.version !== MEDIA_ROUTE_STATE_VERSION ||
      !isObject(state.entries) ||
      Array.isArray(state.entries)
    ) {
      return unchangedResult(requestUrl, "state-invalid");
    }
    entry = state.entries[binding.key];
    if (!isObject(entry) || Array.isArray(entry)) {
      return unchangedResult(requestUrl, "route-missing");
    }
    target = parseHttpUrl(entry.targetUrl);
    targetBinding = mediaRouteKeyForUrl(
      entry.targetUrl,
      entry.networkProfile
    );
    expiresAt = Number(entry.expiresAt);
    if (
      normalizeNetworkProfile(entry.networkProfile) !== config.networkProfile ||
      !target ||
      !targetBinding ||
      targetBinding.key !== binding.key ||
      target.hostname !== String(entry.targetHost || "").toLowerCase() ||
      !isBilibiliMediaHost(target.hostname) ||
      !stringArrayContainsHostname(entry.sourceHosts, parsed.hostname) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= now ||
      expiresAt > targetBinding.expiresAt ||
      expiresAt > now + MEDIA_ROUTE_MAX_TTL_MS ||
      target.hostname === parsed.hostname ||
      entry.targetUrl === requestUrl
    ) {
      return unchangedResult(requestUrl, "route-ineligible");
    }
    return {
      changed: true,
      headers: rewriteAuthorityHeaders(headers, target.authority),
      reason: "exact-signed-route",
      sourceHost: parsed.hostname,
      targetHost: target.hostname,
      url: entry.targetUrl
    };
  }

  function createShadowrocketServices() {
    var readable =
      typeof $persistentStore !== "undefined" &&
      $persistentStore &&
      typeof $persistentStore.read === "function";
    return {
      now: function () {
        return Date.now();
      },
      read: function (key) {
        return readable ? $persistentStore.read(key) : null;
      }
    };
  }

  function safeLog(message) {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.log === "function"
    ) {
      console.log("[" + NAME + "] " + String(message));
    }
  }

  function runShadowrocket() {
    var requestUrl =
      typeof $request !== "undefined" && $request
        ? String($request.url || "")
        : "";
    var method =
      typeof $request !== "undefined" && $request
        ? String($request.method || "GET")
        : "GET";
    var headers =
      typeof $request !== "undefined" && $request
        ? $request.headers
        : null;
    var argument = typeof $argument === "string" ? $argument : "";
    var config = parseRuntimeArgument(argument);
    var result;
    var completion;
    try {
      result = selectMediaRequest(
        requestUrl,
        method,
        headers,
        argument,
        createShadowrocketServices()
      );
      if (config.debug) {
        safeLog(
          "changed=" +
            (result.changed ? 1 : 0) +
            " source=" +
            (result.sourceHost || "none") +
            " target=" +
            (result.targetHost || "none") +
            " reason=" +
            result.reason
        );
      }
      if (!result.changed) {
        $done({});
        return;
      }
      completion = { url: result.url };
      if (result.headers) {
        completion.headers = result.headers;
      }
      $done(completion);
    } catch (error) {
      if (config.debug) {
        safeLog("changed=0 source=none target=none reason=exception");
      }
      $done({});
    }
  }

  var api = {
    MEDIA_ROUTE_STATE_KEY: MEDIA_ROUTE_STATE_KEY,
    isBilibiliMediaHost: isBilibiliMediaHost,
    isVodMediaUrl: isVodMediaUrl,
    mediaRouteKeyForUrl: mediaRouteKeyForUrl,
    normalizeNetworkProfile: normalizeNetworkProfile,
    parseRuntimeArgument: parseRuntimeArgument,
    runShadowrocket: runShadowrocket,
    selectMediaRequest: selectMediaRequest,
    stableHash: stableHash
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliCdnRoute = api;
  }

  if (
    typeof $done === "function" &&
    typeof $request !== "undefined" &&
    typeof $response === "undefined"
  ) {
    runShadowrocket();
  }
})(this);
