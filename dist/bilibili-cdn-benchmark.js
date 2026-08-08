/*
 * Bilibili CDN Switcher v10 for Shadowrocket
 *
 * Default auto mode performs no network probes on playback responses. It reads
 * bounded host-level state produced by the background cron benchmark and falls
 * back to a complete, server-provided Akamai URL when learning is unavailable.
 *
 * Fixed-host mode remains available as an explicit compatibility option.
 * Live URLs are never rewritten because their signatures are bound to
 * server-selected CDN metadata.
 */
(function (root) {
  "use strict";

  var NAME = "BiliCDN";
  var DEFAULT_CDN = "upos-sz-mirrorali.bilivideo.com";
  var AUTO_STATE_KEY = "BiliCDN.safeAuto.v7";
  var HOST_AUTO_STATE_KEY = "BiliCDN.hostAuto.v10";
  var HOST_AUTO_STATE_VERSION = 10;
  var MEDIA_ROUTE_STATE_KEY = "BiliCDN.mediaRoutes.v9";
  var MEDIA_ROUTE_STATE_VERSION = 9;
  var AKAMAI_COLD_HOST = "upos-hz-mirrorakam.akamaized.net";
  var DEFAULT_AUTO_INTERVAL_HOURS = 2;
  var DEFAULT_SWITCH_THRESHOLD = 20;
  var RUNTIME_OPTION_LIMITS = {
    intervalHours: {
      defaultValue: DEFAULT_AUTO_INTERVAL_HOURS,
      maximum: 72,
      minimum: 2
    },
    switchThreshold: {
      defaultValue: DEFAULT_SWITCH_THRESHOLD,
      maximum: 80,
      minimum: 10
    }
  };
  var AUTO_CACHE_CAPACITY = 64;
  var MEDIA_ROUTE_CAPACITY = 64;
  var MEDIA_ROUTE_EXPIRY_SAFETY_MS = 30 * 1000;
  var MEDIA_ROUTE_MAX_TTL_MS = 2 * 60 * 60 * 1000;
  var MEDIA_ROUTE_MAX_URL_BYTES = 8192;
  var AUTO_HOST_CAPACITY = 48;
  var AUTO_CONFIRM_DELAY_MS = 2 * 60 * 1000;
  var AUTO_EXPLORE_DELAY_MS = 30 * 60 * 1000;
  var AUTO_GLOBAL_PROBE_GAP_MS = 2 * 60 * 1000;
  var AUTO_HOST_BACKOFF_BASE_MS = 15 * 60 * 1000;
  var AUTO_HOST_BACKOFF_MAX_MS = 2 * 60 * 60 * 1000;
  var AUTO_LOCK_MS = 10 * 1000;
  var AUTO_PROBE_TIMEOUT_MS = 5000;
  var AUTO_EXPLORE_RANGE_END = 262143;
  var AUTO_RANGE_END = 1048575;
  var AUTO_SAMPLE_ALIGNMENT = 65536;
  var AUTO_INTERIOR_SAMPLE_FRACTIONS = [0.5, 0.25, 0.75];
  var AUTO_RETRY_MS = 30 * 60 * 1000;
  var AUTO_SELECTED_REVALIDATE_MS = 8 * 60 * 1000;
  var MAX_GRPC_DECOMPRESSED_BYTES = 4 * 1024 * 1024;
  var MAX_PROTO_DEPTH = 32;
  var MAX_URL_BYTES = 65536;
  var MAX_JSON_DEPTH = 64;
  var AUTO_SCORE_SAMPLE_LIMIT = 5;
  var AUTO_HOST_SCORE_SAMPLE_LIMIT = 8;
  var AUTO_MIN_AUDIO_THROUGHPUT_KBPS = 256;
  var AUTO_MIN_SEGMENT_THROUGHPUT_KBPS = 1500;
  var AUTO_MIN_VIDEO_THROUGHPUT_KBPS = 2500;
  var AUTO_REPRESENTATION_HEADROOM = 1.35;
  var HOST_PROFILE_CAPACITY = 4;
  var HOST_AUTO_CAPACITY = 16;
  var HOST_SAMPLE_CAPACITY = 8;
  var HOST_OBJECT_CAPACITY = 4;
  var HOST_ALIAS_FRESH_MS = 6 * 60 * 60 * 1000;
  var HOST_STATE_STALE_MS = 24 * 60 * 60 * 1000;
  var HOST_CIRCUIT_OPEN_MS = 2 * 60 * 60 * 1000;
  var HOST_MIN_OBJECTS = 2;
  var HOST_MAX_FAILURE_RATE = 0.25;
  var HOST_MAX_JITTER_RATIO = 0.65;
  var HOST_MIN_THROUGHPUT_KBPS = 10000;
  var HOST_REPRESENTATION_HEADROOM = 1.8;
  var HOST_MEDIA_BUCKETS = ["audio", "normal-video", "high-bitrate-video"];
  var HIGH_BITRATE_REQUIRED_KBPS = 8000;

  /*
   * This list is documentation and fixed-mode input guidance only. Safe auto
   * mode never injects these hosts into a server-provided candidate set.
   */
  var FIXED_CDN_CANDIDATES = [
    "upos-sz-mirrorali.bilivideo.com",
    "upos-sz-mirrorcos.bilivideo.com",
    "upos-sz-mirrorhw.bilivideo.com",
    "upos-sz-mirroraliov.bilivideo.com",
    "upos-sz-mirrorcosov.bilivideo.com",
    "cn-hk-eq-01-01.bilivideo.com",
    "cn-hk-eq-01-03.bilivideo.com",
    "cn-hk-eq-01-09.bilivideo.com",
    "cn-hk-eq-01-10.bilivideo.com",
    "cn-hk-eq-01-12.bilivideo.com",
    "cn-hk-eq-01-13.bilivideo.com",
    "cn-hk-eq-01-14.bilivideo.com",
    "cn-jxnc-cmcc-bcache-06.bilivideo.com",
    "upos-hz-mirrorakam.akamaized.net",
    "upos-sz-mirroralib.bilivideo.com",
    "upos-sz-mirrorbos.bilivideo.com"
  ];

  var PRIMARY_URL_KEYS = {
    baseUrl: true,
    base_url: true,
    url: true
  };
  var BACKUP_URL_KEYS = {
    backupUrl: true,
    backup_url: true
  };
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
  var FIXED_MEDIA_SUFFIXES = [
    "acgvideo.com",
    "bilivideo.com",
    "bilivideo.cn",
    "bilivideo.net",
    "bilibilivideo.com"
  ];
  var JSON_METADATA_KEYS = [
    "id",
    "quality",
    "codecid",
    "codec",
    "codecs",
    "mimeType",
    "mime_type",
    "audio_id",
    "frame_rate",
    "frameRate",
    "width",
    "height",
    "bandwidth"
  ];
  /*
   * Verified against the public PlayView/PlayViewUnite schemas. Every method
   * currently matched by the module wraps VodInfo/VideoInfo in reply field 1.
   * Only these paths may be decoded as media messages; arbitrary
   * length-delimited fields are never recursively guessed.
   */
  var PLAYVIEW_MEDIA_PATHS = [
    [1, 5, 2],
    [1, 5, 3, 1],
    [1, 6],
    [1, 7, 2],
    [1, 9, 2]
  ];
  var PGC_V2_MEDIA_PATHS = [
    [1, 5, 2],
    [1, 5, 3, 1],
    [1, 6],
    [1, 7, 2]
  ];
  var GRPC_MEDIA_PATHS = {
    "app-playurl-v1": PLAYVIEW_MEDIA_PATHS,
    "playerunite-v1": PLAYVIEW_MEDIA_PATHS,
    "pgc-v1": PLAYVIEW_MEDIA_PATHS,
    "pgc-v2": PGC_V2_MEDIA_PATHS,
    "cheese-v1": PLAYVIEW_MEDIA_PATHS,
    /* Backward-compatible utility adapter; runtime classification is specific. */
    "playview-v1": PLAYVIEW_MEDIA_PATHS
  };

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function classifyGrpcAdapter(requestUrl) {
    var value = typeof requestUrl === "string" ? requestUrl : "";
    if (
      /\/bilibili\.app\.playerunite\.v1\.Player\/PlayViewUnite(?:\?|$)/i.test(
        value
      )
    ) {
      return "playerunite-v1";
    }
    if (
      /\/bilibili\.app\.playurl\.v1\.PlayURL\/PlayView(?:\?|$)/i.test(value)
    ) {
      return "app-playurl-v1";
    }
    if (
      /\/bilibili\.pgc\.gateway\.player\.v2\.PlayURL\/PlayView(?:\?|$)/i.test(
        value
      )
    ) {
      return "pgc-v2";
    }
    if (
      /\/bilibili\.pgc\.gateway\.player\.v1\.PlayURL\/PlayView(?:\?|$)/i.test(
        value
      )
    ) {
      return "pgc-v1";
    }
    if (
      /\/bilibili\.cheese\.gateway\.player\.v1\.PlayURL\/PlayView(?:\?|$)/i.test(
        value
      )
    ) {
      return "cheese-v1";
    }
    return "";
  }

  function protoPathState(adapter, path) {
    var paths = GRPC_MEDIA_PATHS[adapter] || [];
    var exact = false;
    var prefix = false;
    var index;
    var inner;
    var matches;
    for (index = 0; index < paths.length; index += 1) {
      if (path.length > paths[index].length) {
        continue;
      }
      matches = true;
      for (inner = 0; inner < path.length; inner += 1) {
        if (path[inner] !== paths[index][inner]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        prefix = true;
        if (path.length === paths[index].length) {
          exact = true;
        }
      }
    }
    return { exact: exact, prefix: prefix };
  }

  function isByteView(value) {
    return (
      typeof ArrayBuffer !== "undefined" &&
      (value instanceof ArrayBuffer ||
        (typeof ArrayBuffer.isView === "function" &&
          ArrayBuffer.isView(value)))
    );
  }

  function toUint8Array(value) {
    if (typeof Uint8Array !== "undefined" && value instanceof Uint8Array) {
      return value;
    }
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (
      value &&
      typeof ArrayBuffer !== "undefined" &&
      value.buffer instanceof ArrayBuffer &&
      typeof value.byteOffset === "number" &&
      typeof value.byteLength === "number"
    ) {
      return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }
    return null;
  }

  function parseBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    if (typeof value === "string") {
      return /^(?:1|true|yes|on)$/i.test(value.trim());
    }
    return false;
  }

  function boundedNumber(value, fallback, minimum, maximum) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  function isValidHostname(hostname) {
    var labels;
    var index;

    if (
      typeof hostname !== "string" ||
      hostname.length < 3 ||
      hostname.length > 253 ||
      hostname.indexOf(".") === -1 ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
    ) {
      return false;
    }

    labels = hostname.split(".");
    for (index = 0; index < labels.length; index += 1) {
      if (
        !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(labels[index])
      ) {
        return false;
      }
    }
    return true;
  }

  function normalizeCdnHost(value) {
    var host;
    var match;

    if (typeof value !== "string") {
      return null;
    }

    host = value.trim().toLowerCase();
    if (/^(?:off|none|false|0)$/i.test(host)) {
      return "";
    }

    match = /^(?:https?:\/\/)?([^\/?#]+)\/?$/i.exec(host);
    if (!match || match[1].indexOf("@") !== -1 || match[1].indexOf(":") !== -1) {
      return null;
    }

    host = match[1].replace(/\.$/, "");
    return (
      isValidHostname(host) &&
      isAllowedFixedCdnHost(host)
    )
      ? host
      : null;
  }

  function applyCdnSetting(config, value) {
    var raw;
    var normalized;

    if (typeof value !== "string") {
      config.valid = false;
      config.cdnHost = null;
      config.auto = false;
      return;
    }

    raw = value.trim();
    if (/^auto$/i.test(raw)) {
      config.auto = true;
      config.cdnHost = null;
      return;
    }

    normalized = normalizeCdnHost(raw);
    config.auto = false;
    if (normalized === null) {
      config.valid = false;
      config.cdnHost = null;
    } else {
      config.cdnHost = normalized;
    }
  }

  function normalizeNetworkProfile(value) {
    var profile =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    if (!profile) {
      return "auto";
    }
    return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(profile)
      ? profile
      : "auto";
  }

  function normalizedNetworkType(value) {
    var type = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (/^(?:wifi|wi-fi|wlan)$/.test(type)) {
      return "wifi";
    }
    if (/^(?:cell|cellular|mobile|wwan|4g|5g|lte)$/.test(type)) {
      return "cellular";
    }
    return "";
  }

  function resolveRuntimeNetworkProfile(configuredProfile, services) {
    var configured = normalizeNetworkProfile(configuredProfile);
    var info;
    var type;
    var identifier;
    var hash;
    if (configured !== "auto") {
      return configured;
    }
    try {
      info = services && typeof services.networkInfo === "function"
        ? services.networkInfo()
        : null;
    } catch (error) {
      info = null;
    }
    if (!isObject(info) || Array.isArray(info)) {
      return "auto";
    }
    type = normalizedNetworkType(info.type);
    if (!type) {
      return "auto";
    }
    identifier = typeof info.identifier === "string"
      ? info.identifier.trim()
      : "";
    if (!identifier) {
      return type;
    }
    hash = stableHash("n", type + "\u0000" + identifier);
    return type + "_" + hash.slice(-16);
  }

  function normalizeProbeMode(value) {
    var mode =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    return mode === "blocking" || mode === "off" ? mode : "cron";
  }

  function normalizeResetToken(value) {
    var token =
      typeof value === "string" ? value.trim().toLowerCase() : "";
    return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(token) ? token : "";
  }

  function parseArgument(argument) {
    var config = {
      auto: true,
      cdnHost: null,
      debug: false,
      intervalHours: DEFAULT_AUTO_INTERVAL_HOURS,
      networkProfile: "auto",
      probeMode: "cron",
      resetToken: "",
      switchThreshold: DEFAULT_SWITCH_THRESHOLD,
      valid: true
    };
    var raw;
    var parsed;
    var pairs;
    var index;
    var splitAt;
    var key;
    var value;
    var decodedKey;
    var decodedValue;

    if (typeof argument !== "string" || argument.trim() === "") {
      return config;
    }

    raw = argument.trim();
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      parsed = null;
    }

    if (isObject(parsed) && !Array.isArray(parsed)) {
      if (Object.prototype.hasOwnProperty.call(parsed, "cdn")) {
        applyCdnSetting(config, String(parsed.cdn));
      }
      config.debug = parseBoolean(parsed.debug);
      config.networkProfile = normalizeNetworkProfile(
        parsed.networkProfile || parsed.profile
      );
      config.probeMode = normalizeProbeMode(
        parsed.probeMode || parsed.probes
      );
      config.resetToken = normalizeResetToken(parsed.resetToken);
      config.intervalHours = boundedNumber(
        parsed.intervalHours,
        DEFAULT_AUTO_INTERVAL_HOURS,
        RUNTIME_OPTION_LIMITS.intervalHours.minimum,
        RUNTIME_OPTION_LIMITS.intervalHours.maximum
      );
      config.switchThreshold = boundedNumber(
        parsed.switchThreshold,
        DEFAULT_SWITCH_THRESHOLD,
        RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
        RUNTIME_OPTION_LIMITS.switchThreshold.maximum
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
        decodedKey = decodeURIComponent(pairs[index].slice(0, splitAt));
        decodedValue = decodeURIComponent(pairs[index].slice(splitAt + 1));
      } catch (error) {
        config.valid = false;
        config.cdnHost = null;
        return config;
      }
      key = decodedKey.trim().toLowerCase();
      value = decodedValue.trim();
      if (key === "cdn") {
        applyCdnSetting(config, value);
      } else if (key === "debug") {
        config.debug = parseBoolean(value);
      } else if (key === "networkprofile" || key === "profile") {
        config.networkProfile = normalizeNetworkProfile(value);
      } else if (key === "probemode" || key === "probes") {
        config.probeMode = normalizeProbeMode(value);
      } else if (key === "resettoken") {
        config.resetToken = normalizeResetToken(value);
      } else if (key === "intervalhours" || key === "interval") {
        config.intervalHours = boundedNumber(
          value,
          DEFAULT_AUTO_INTERVAL_HOURS,
          RUNTIME_OPTION_LIMITS.intervalHours.minimum,
          RUNTIME_OPTION_LIMITS.intervalHours.maximum
        );
      } else if (key === "switchthreshold" || key === "threshold") {
        config.switchThreshold = boundedNumber(
          value,
          DEFAULT_SWITCH_THRESHOLD,
          RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
          RUNTIME_OPTION_LIMITS.switchThreshold.maximum
        );
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

  function isAllowedFixedCdnHost(hostname) {
    var index;

    hostname = String(hostname || "").toLowerCase();
    if (FIXED_CDN_CANDIDATES.indexOf(hostname) !== -1) {
      return true;
    }
    for (index = 0; index < FIXED_MEDIA_SUFFIXES.length; index += 1) {
      if (hostnameMatchesSuffix(hostname, FIXED_MEDIA_SUFFIXES[index])) {
        return true;
      }
    }
    return false;
  }

  function parseHttpUrl(value) {
    var match;
    var authority;
    var hostname;
    var remainder;
    var queryAt;

    if (typeof value !== "string") {
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
      remainder: remainder,
      scheme: match[1].toLowerCase()
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

  function rewriteVodUrl(value, cdnHost) {
    var parsed;

    if (!cdnHost || !isVodMediaUrl(value)) {
      return value;
    }
    parsed = parseHttpUrl(value);
    if (!parsed || parsed.hostname === cdnHost) {
      return value;
    }
    return parsed.scheme + "://" + cdnHost + parsed.remainder;
  }

  function replaceVodHostname(value, cdnHost) {
    var parsed;
    var portMatch;
    if (
      FIXED_CDN_CANDIDATES.indexOf(String(cdnHost || "").toLowerCase()) === -1 ||
      !isVodMediaUrl(value)
    ) {
      return "";
    }
    parsed = parseHttpUrl(value);
    if (!parsed) {
      return "";
    }
    portMatch = /:(\d+)$/.exec(parsed.authority);
    return (
      parsed.scheme +
      "://" +
      String(cdnHost).toLowerCase() +
      (portMatch ? ":" + portMatch[1] : "") +
      parsed.remainder
    );
  }

  function rewriteJsonValue(value, config, state, depth) {
    var index;
    var keys;
    var key;
    var rewritten;

    if (depth > MAX_JSON_DEPTH || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        rewriteJsonValue(value[index], config, state, depth + 1);
      }
      return;
    }
    if (!isObject(value)) {
      return;
    }

    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (PRIMARY_URL_KEYS[key] && typeof value[key] === "string") {
        rewritten = rewriteVodUrl(value[key], config.cdnHost);
        if (rewritten !== value[key]) {
          value[key] = rewritten;
          state.changed += 1;
        }
      } else {
        rewriteJsonValue(value[key], config, state, depth + 1);
      }
    }
  }

  function jsonAliasLanes(value) {
    var mappings = [
      ["baseUrl", "backupUrl"],
      ["base_url", "backup_url"]
    ];
    var lanes = [];
    var coveredPrimary = {};
    var primaryCount = 0;
    var index;
    var primaryKey;
    var backupKey;
    var primaryUrl;
    var backups;

    Object.keys(PRIMARY_URL_KEYS).forEach(function (key) {
      if (typeof value[key] === "string" && isVodMediaUrl(value[key])) {
        primaryCount += 1;
      }
    });
    for (index = 0; index < mappings.length; index += 1) {
      primaryKey = mappings[index][0];
      backupKey = mappings[index][1];
      primaryUrl = value[primaryKey];
      backups = arrayOfVodUrls(value[backupKey]);
      if (
        typeof primaryUrl === "string" &&
        isVodMediaUrl(primaryUrl) &&
        backups.length > 0
      ) {
        lanes.push({
          backupKey: backupKey,
          backups: backups,
          primaryId: candidateIdForUrl(primaryUrl),
          primaryKey: primaryKey,
          primaryUrl: primaryUrl
        });
        coveredPrimary[primaryKey] = true;
      }
    }
    if (typeof value.url === "string" && isVodMediaUrl(value.url)) {
      backupKey =
        !coveredPrimary.base_url && Array.isArray(value.backup_url)
          ? "backup_url"
          : !coveredPrimary.baseUrl && Array.isArray(value.backupUrl)
            ? "backupUrl"
            : "";
      backups = backupKey ? arrayOfVodUrls(value[backupKey]) : [];
      if (backups.length > 0) {
        lanes.push({
          backupKey: backupKey,
          backups: backups,
          primaryId: candidateIdForUrl(value.url),
          primaryKey: "url",
          primaryUrl: value.url
        });
        coveredPrimary.url = true;
      }
    }
    if (lanes.length === 0 || Object.keys(coveredPrimary).length !== primaryCount) {
      return null;
    }
    for (index = 1; index < lanes.length; index += 1) {
      if (lanes[index].primaryId !== lanes[0].primaryId) {
        return null;
      }
    }
    return lanes;
  }

  function laneUrlForCandidate(lane, candidateId) {
    var index;
    if (lane.primaryId === candidateId) {
      return lane.primaryUrl;
    }
    for (index = 0; index < lane.backups.length; index += 1) {
      if (candidateIdForUrl(lane.backups[index]) === candidateId) {
        return lane.backups[index];
      }
    }
    return "";
  }

  function rotateJsonAliasLane(value, lane, selectedId) {
    var selectedUrl = laneUrlForCandidate(lane, selectedId);
    var array = value[lane.backupKey];
    var next = [lane.primaryUrl];
    var index;
    var item;
    var itemId;
    var changed = 0;
    if (!selectedUrl || selectedId === lane.primaryId) {
      return 0;
    }
    if (value[lane.primaryKey] !== selectedUrl) {
      value[lane.primaryKey] = selectedUrl;
      changed += 1;
    }
    for (index = 0; index < array.length; index += 1) {
      item = array[index];
      itemId = typeof item === "string" ? candidateIdForUrl(item) : null;
      if (itemId === selectedId || itemId === lane.primaryId) {
        continue;
      }
      next.push(item);
    }
    if (JSON.stringify(next) !== JSON.stringify(array)) {
      value[lane.backupKey] = next;
      changed += 1;
    }
    return changed;
  }

  function rotateJsonAliasLaneToUrl(value, lane, selectedUrl) {
    var selectedId = candidateIdForUrl(selectedUrl);
    var array = value[lane.backupKey];
    var next = [lane.primaryUrl];
    var seen = {};
    var index;
    var item;
    var itemId;
    var changed = 0;
    if (!selectedId || selectedId === lane.primaryId || !isVodMediaUrl(selectedUrl)) {
      return 0;
    }
    seen[lane.primaryUrl] = true;
    if (value[lane.primaryKey] !== selectedUrl) {
      value[lane.primaryKey] = selectedUrl;
      changed += 1;
    }
    for (index = 0; index < array.length; index += 1) {
      item = array[index];
      itemId = typeof item === "string" ? candidateIdForUrl(item) : null;
      if (
        itemId === selectedId ||
        itemId === lane.primaryId ||
        seen[item]
      ) {
        continue;
      }
      seen[item] = true;
      next.push(item);
    }
    if (JSON.stringify(next) !== JSON.stringify(array)) {
      value[lane.backupKey] = next;
      changed += 1;
    }
    return changed;
  }

  function fixedCandidateOnCurrentObject(value, cdnHost) {
    var lanes = jsonAliasLanes(value);
    var selectedId = "";
    var index;
    var inner;
    var parsed;
    var candidateId;
    var changed = 0;
    if (!lanes) {
      return 0;
    }
    for (index = 0; index < lanes.length; index += 1) {
      candidateId = "";
      for (inner = 0; inner < lanes[index].backups.length; inner += 1) {
        parsed = parseHttpUrl(lanes[index].backups[inner]);
        if (parsed && parsed.hostname === cdnHost) {
          candidateId = candidateIdForUrl(lanes[index].backups[inner]);
          break;
        }
      }
      if (!candidateId || (selectedId && selectedId !== candidateId)) {
        return 0;
      }
      selectedId = candidateId;
    }
    if (!selectedId || selectedId === lanes[0].primaryId) {
      return 0;
    }
    for (index = 0; index < lanes.length; index += 1) {
      if (!laneUrlForCandidate(lanes[index], selectedId)) {
        return 0;
      }
    }
    for (index = 0; index < lanes.length; index += 1) {
      changed += rotateJsonAliasLane(value, lanes[index], selectedId);
    }
    return changed;
  }

  function walkSafeFixedJson(value, config, depth) {
    var changed = 0;
    var keys;
    var index;
    var key;
    if (depth > MAX_JSON_DEPTH || value === null) {
      return 0;
    }
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        changed += walkSafeFixedJson(value[index], config, depth + 1);
      }
      return changed;
    }
    if (!isObject(value)) {
      return 0;
    }
    changed += fixedCandidateOnCurrentObject(value, config.cdnHost);
    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!PRIMARY_URL_KEYS[key] && !BACKUP_URL_KEYS[key]) {
        changed += walkSafeFixedJson(value[key], config, depth + 1);
      }
    }
    return changed;
  }

  function transformJsonText(text, config) {
    var input = typeof text === "string" ? text : "";
    var parsed;
    var state = { changed: 0 };

    if (!config || !config.valid || !config.cdnHost || input === "") {
      return { body: input, changed: 0, valid: Boolean(config && config.valid) };
    }
    try {
      parsed = JSON.parse(input.replace(/^\uFEFF/, ""));
    } catch (error) {
      return { body: input, changed: 0, valid: false };
    }

    state.changed = walkSafeFixedJson(parsed, config, 0);
    return {
      body: state.changed > 0 ? JSON.stringify(parsed) : input,
      changed: state.changed,
      valid: true
    };
  }

  function readVarint(bytes, offset) {
    var value = 0;
    var shift = 0;
    var position = offset;
    var current;
    var contribution;
    var safe = true;

    while (position < bytes.length && position - offset < 10) {
      current = bytes[position];
      if (safe) {
        contribution = (current & 0x7f) * Math.pow(2, shift);
        if (
          !Number.isSafeInteger(contribution) ||
          value > Number.MAX_SAFE_INTEGER - contribution
        ) {
          safe = false;
        } else {
          value += contribution;
        }
      }
      position += 1;
      if ((current & 0x80) === 0) {
        return {
          end: position,
          safe: safe,
          value: safe ? value : null
        };
      }
      shift += 7;
    }
    return null;
  }

  function encodeVarint(value) {
    var output = [];
    var current = value;

    if (!Number.isSafeInteger(current) || current < 0) {
      throw new Error("Cannot encode invalid varint");
    }
    do {
      if (current >= 128) {
        output.push((current % 128) | 0x80);
        current = Math.floor(current / 128);
      } else {
        output.push(current);
        current = 0;
      }
    } while (current > 0);
    return new Uint8Array(output);
  }

  function concatBytes(chunks, totalLength) {
    var output;
    var offset = 0;
    var index;
    var chunk;

    if (typeof totalLength !== "number") {
      totalLength = 0;
      for (index = 0; index < chunks.length; index += 1) {
        totalLength += chunks[index].length;
      }
    }
    output = new Uint8Array(totalLength);
    for (index = 0; index < chunks.length; index += 1) {
      chunk = chunks[index];
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }

  function asciiBytesToString(bytes) {
    var output = "";
    var index;
    var batch = [];

    if (!bytes || bytes.length > MAX_URL_BYTES) {
      return null;
    }
    for (index = 0; index < bytes.length; index += 1) {
      if (bytes[index] > 0x7f || bytes[index] === 0) {
        return null;
      }
      batch.push(bytes[index]);
      if (batch.length === 4096) {
        output += String.fromCharCode.apply(null, batch);
        batch = [];
      }
    }
    if (batch.length > 0) {
      output += String.fromCharCode.apply(null, batch);
    }
    return output;
  }

  function asciiStringToBytes(value) {
    var output = new Uint8Array(value.length);
    var index;
    for (index = 0; index < value.length; index += 1) {
      output[index] = value.charCodeAt(index);
    }
    return output;
  }

  function printableAsciiBytesToString(bytes) {
    var text = asciiBytesToString(bytes);
    var index;
    if (text === null) {
      return null;
    }
    for (index = 0; index < bytes.length; index += 1) {
      if (bytes[index] < 0x20 || bytes[index] > 0x7e) {
        return null;
      }
    }
    return text;
  }

  function manualPrimaryFieldForProto(bytes) {
    var fields = parseProtoFields(bytes);
    var representationId;
    if (!fields) {
      return 0;
    }
    if (
      protoUrlsForField(fields, 1).length === 1 &&
      protoUrlsForField(fields, 2).length > 0
    ) {
      return 1;
    }
    representationId = firstProtoVarint(fields, 1);
    if (
      representationId !== null &&
      protoUrlsForField(fields, 2).length === 1 &&
      protoUrlsForField(fields, 3).length > 0
    ) {
      return 2;
    }
    if (
      protoUrlsForField(fields, 4).length === 1 &&
      protoUrlsForField(fields, 5).length > 0
    ) {
      return 4;
    }
    if (protoUrlsForField(fields, 1).length === 1) {
      return 1;
    }
    if (
      representationId !== null &&
      protoUrlsForField(fields, 2).length === 1
    ) {
      return 2;
    }
    if (protoUrlsForField(fields, 4).length === 1) {
      return 4;
    }
    return 0;
  }

  function transformLengthDelimited(payload, config, depth) {
    var nested;

    if (depth >= MAX_PROTO_DEPTH || payload.length === 0) {
      return { bytes: payload, changed: 0, valid: true };
    }
    nested = transformProtoMessage(payload, config, depth + 1);
    if (nested.valid && nested.changed > 0) {
      return nested;
    }
    return { bytes: payload, changed: 0, valid: true };
  }

  function transformProtoMessage(bytes, config, depth) {
    var offset = 0;
    var chunks = [];
    var changed = 0;
    var tagStart;
    var tag;
    var fieldNumber;
    var wireType;
    var valueInfo;
    var lengthInfo;
    var payloadStart;
    var payloadEnd;
    var payload;
    var transformed;
    var text;
    var rewritten;
    var primaryField = manualPrimaryFieldForProto(bytes);

    if (!bytes || bytes.length === 0) {
      return { bytes: bytes, changed: 0, valid: true };
    }

    while (offset < bytes.length) {
      tagStart = offset;
      tag = readVarint(bytes, offset);
      if (!tag || !tag.safe || tag.value === 0) {
        return { bytes: bytes, changed: 0, valid: false };
      }
      fieldNumber = Math.floor(tag.value / 8);
      wireType = tag.value % 8;
      if (fieldNumber < 1) {
        return { bytes: bytes, changed: 0, valid: false };
      }
      offset = tag.end;

      if (wireType === 0) {
        valueInfo = readVarint(bytes, offset);
        if (!valueInfo) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        offset = valueInfo.end;
        chunks.push(bytes.subarray(tagStart, offset));
      } else if (wireType === 1) {
        if (offset + 8 > bytes.length) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        offset += 8;
        chunks.push(bytes.subarray(tagStart, offset));
      } else if (wireType === 2) {
        lengthInfo = readVarint(bytes, offset);
        if (
          !lengthInfo ||
          !lengthInfo.safe ||
          lengthInfo.value > bytes.length - lengthInfo.end
        ) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        payloadStart = lengthInfo.end;
        payloadEnd = payloadStart + lengthInfo.value;
        payload = bytes.subarray(payloadStart, payloadEnd);
        text =
          payload.length <= MAX_URL_BYTES
            ? printableAsciiBytesToString(payload)
            : null;
        if (
          fieldNumber === primaryField &&
          text &&
          isVodMediaUrl(text)
        ) {
          rewritten = rewriteVodUrl(text, config.cdnHost);
          transformed =
            rewritten !== text
              ? {
                  bytes: asciiStringToBytes(rewritten),
                  changed: 1,
                  valid: true
                }
              : { bytes: payload, changed: 0, valid: true };
        } else {
          transformed = transformLengthDelimited(payload, config, depth);
        }
        if (transformed.changed > 0) {
          chunks.push(bytes.subarray(tagStart, tag.end));
          chunks.push(encodeVarint(transformed.bytes.length));
          chunks.push(transformed.bytes);
          changed += transformed.changed;
        } else {
          chunks.push(bytes.subarray(tagStart, payloadEnd));
        }
        offset = payloadEnd;
      } else if (wireType === 5) {
        if (offset + 4 > bytes.length) {
          return { bytes: bytes, changed: 0, valid: false };
        }
        offset += 4;
        chunks.push(bytes.subarray(tagStart, offset));
      } else {
        return { bytes: bytes, changed: 0, valid: false };
      }
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function fixedProtoLayout(fields, cdnHost) {
    var layouts = [
      { backupField: 2, primaryField: 1 },
      { backupField: 3, primaryField: 2, requiresId: true },
      { backupField: 5, primaryField: 4 }
    ];
    var layout;
    var primaryUrls;
    var backupUrls;
    var index;
    var inner;
    var parsed;
    for (index = 0; index < layouts.length; index += 1) {
      layout = layouts[index];
      if (
        layout.requiresId &&
        firstProtoVarint(fields, 1) === null
      ) {
        continue;
      }
      primaryUrls = protoUrlsForField(fields, layout.primaryField);
      backupUrls = protoUrlsForField(fields, layout.backupField);
      if (primaryUrls.length !== 1 || backupUrls.length === 0) {
        continue;
      }
      for (inner = 0; inner < backupUrls.length; inner += 1) {
        parsed = parseHttpUrl(backupUrls[inner]);
        if (parsed && parsed.hostname === cdnHost) {
          return {
            backupField: layout.backupField,
            primaryField: layout.primaryField,
            primaryId: candidateIdForUrl(primaryUrls[0]),
            primaryUrl: primaryUrls[0],
            targetId: candidateIdForUrl(backupUrls[inner]),
            targetUrl: backupUrls[inner]
          };
        }
      }
      parsed = parseHttpUrl(primaryUrls[0]);
      if (parsed && parsed.hostname === cdnHost) {
        return null;
      }
    }
    return null;
  }

  function transformSafeFixedProtoMessage(bytes, config, depth, path) {
    var fields;
    var layout;
    var chunks = [];
    var changed = 0;
    var index;
    var field;
    var nextPayload;
    var nextChanges;
    var nested;
    var fieldId;
    var pathState;
    var childPath;
    path = Array.isArray(path) ? path : [];
    if (!bytes || depth > MAX_PROTO_DEPTH) {
      return { bytes: bytes, changed: 0, valid: false };
    }
    fields = parseProtoFields(bytes);
    if (!fields) {
      return { bytes: bytes, changed: 0, valid: false };
    }
    pathState = protoPathState(config.grpcAdapter, path);
    if (!pathState.prefix) {
      return { bytes: bytes, changed: 0, valid: true };
    }
    layout = pathState.exact
      ? fixedProtoLayout(fields, config.cdnHost)
      : null;
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      nextPayload = null;
      nextChanges = 0;
      if (field.wireType === 2) {
        fieldId = field.text ? candidateIdForUrl(field.text) : null;
        if (
          layout &&
          field.fieldNumber === layout.primaryField &&
          fieldId === layout.primaryId
        ) {
          nextPayload = asciiStringToBytes(layout.targetUrl);
          nextChanges = 1;
        } else if (
          layout &&
          field.fieldNumber === layout.backupField &&
          fieldId === layout.targetId
        ) {
          nextPayload = asciiStringToBytes(layout.primaryUrl);
          nextChanges = 1;
        } else if (!field.text && field.payload.length > 0) {
          childPath = path.concat([field.fieldNumber]);
          if (!protoPathState(config.grpcAdapter, childPath).prefix) {
            chunks.push(bytes.subarray(field.rawStart, field.end));
            continue;
          }
          nested = transformSafeFixedProtoMessage(
            field.payload,
            config,
            depth + 1,
            childPath
          );
          if (nested.valid && nested.changed > 0) {
            nextPayload = nested.bytes;
            nextChanges = nested.changed;
          }
        }
      }
      if (nextPayload) {
        chunks.push(bytes.subarray(field.rawStart, field.tagEnd));
        chunks.push(encodeVarint(nextPayload.length));
        chunks.push(nextPayload);
        changed += nextChanges;
      } else {
        chunks.push(bytes.subarray(field.rawStart, field.end));
      }
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function readUint32Be(bytes, offset) {
    return (
      bytes[offset] * 0x1000000 +
      bytes[offset + 1] * 0x10000 +
      bytes[offset + 2] * 0x100 +
      bytes[offset + 3]
    );
  }

  function grpcHeader(flag, length) {
    var header = new Uint8Array(5);
    header[0] = flag;
    header[1] = Math.floor(length / 0x1000000) & 0xff;
    header[2] = Math.floor(length / 0x10000) & 0xff;
    header[3] = Math.floor(length / 0x100) & 0xff;
    header[4] = length & 0xff;
    return header;
  }

  function parseGrpcFrames(input) {
    var bytes = toUint8Array(input);
    var frames = [];
    var offset = 0;
    var flag;
    var length;
    var end;
    if (!bytes || bytes.length < 5) {
      return {
        body: bytes || new Uint8Array(),
        frames: frames,
        valid: false
      };
    }
    while (offset < bytes.length) {
      if (offset + 5 > bytes.length) {
        return { body: bytes, frames: [], valid: false };
      }
      flag = bytes[offset];
      length = readUint32Be(bytes, offset + 1);
      end = offset + 5 + length;
      if (
        (flag !== 0 && flag !== 1) ||
        end > bytes.length ||
        end < offset + 5
      ) {
        return { body: bytes, frames: [], valid: false };
      }
      frames.push({
        end: end,
        flag: flag,
        payloadStart: offset + 5,
        start: offset
      });
      offset = end;
    }
    return { body: bytes, frames: frames, valid: true };
  }

  function hasCompressedGrpcFrame(input) {
    var parsed = parseGrpcFrames(input);
    var index;
    if (!parsed.valid) {
      return false;
    }
    for (index = 0; index < parsed.frames.length; index += 1) {
      if (parsed.frames[index].flag === 1) {
        return true;
      }
    }
    return false;
  }

  function decompressGzip(input) {
    var bytes = toUint8Array(input);
    var output;
    var stream;
    var reader;
    var chunks = [];
    var total = 0;

    if (!bytes) {
      return Promise.reject(new Error("invalid gzip input"));
    }
    if (
      typeof $utils !== "undefined" &&
      $utils &&
      typeof $utils.ungzip === "function"
    ) {
      try {
        output = toUint8Array($utils.ungzip(bytes));
        if (
          !output ||
          output.length > MAX_GRPC_DECOMPRESSED_BYTES
        ) {
          throw new Error("decompressed gRPC message is too large");
        }
        return Promise.resolve(output);
      } catch (error) {
        return Promise.reject(error);
      }
    }
    if (
      typeof DecompressionStream !== "function" ||
      typeof ReadableStream !== "function"
    ) {
      return Promise.reject(
        new Error("gzip decompression is unavailable")
      );
    }
    try {
      stream = new ReadableStream({
        start: function (controller) {
          controller.enqueue(bytes);
          controller.close();
        }
      }).pipeThrough(new DecompressionStream("gzip"));
      reader = stream.getReader();
    } catch (error) {
      return Promise.reject(error);
    }

    function readNext() {
      return reader.read().then(function (entry) {
        var chunk;
        if (entry.done) {
          return concatBytes(chunks);
        }
        chunk = toUint8Array(entry.value);
        if (!chunk) {
          throw new Error("invalid decompressed gRPC chunk");
        }
        total += chunk.length;
        if (total > MAX_GRPC_DECOMPRESSED_BYTES) {
          try {
            reader.cancel();
          } catch (error) {
            // The size guard is authoritative even if cancellation fails.
          }
          throw new Error("decompressed gRPC message is too large");
        }
        chunks.push(chunk);
        return readNext();
      });
    }

    return readNext();
  }

  function grpcEncodingFromHeaders(headers) {
    var keys;
    var index;
    if (!isObject(headers) || Array.isArray(headers)) {
      return "";
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      if (String(keys[index]).toLowerCase() === "grpc-encoding") {
        return String(headers[keys[index]] || "").trim().toLowerCase();
      }
    }
    return "";
  }

  function hasGzipMagic(bytes) {
    return Boolean(
      bytes &&
        bytes.length >= 2 &&
        bytes[0] === 0x1f &&
        bytes[1] === 0x8b
    );
  }

  function decompressGrpcFrames(input, grpcEncoding) {
    var parsed = parseGrpcFrames(input);
    var original = parsed.body;
    var total = 0;
    var tasks;
    var encoding =
      typeof grpcEncoding === "string"
        ? grpcEncoding.trim().toLowerCase()
        : "";
    var compressedFrames;
    if (!parsed.valid) {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "invalid-framing",
        valid: false
      });
    }
    if (!hasCompressedGrpcFrame(original)) {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "not-compressed",
        valid: true
      });
    }
    if (encoding && encoding !== "gzip" && encoding !== "x-gzip") {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "unsupported-grpc-encoding",
        valid: false
      });
    }
    compressedFrames = parsed.frames.filter(function (frame) {
      return frame.flag === 1;
    });
    if (
      compressedFrames.some(function (frame) {
        return !hasGzipMagic(original.slice(frame.payloadStart, frame.end));
      })
    ) {
      return Promise.resolve({
        body: original,
        changed: false,
        reason: "compression-mismatch",
        valid: false
      });
    }
    tasks = parsed.frames.map(function (frame) {
      var payload = original.slice(frame.payloadStart, frame.end);
      return (
        frame.flag === 1
          ? decompressGzip(payload)
          : Promise.resolve(payload)
      ).then(function (decoded) {
        total += decoded.length;
        if (total > MAX_GRPC_DECOMPRESSED_BYTES) {
          throw new Error("decompressed gRPC response is too large");
        }
        return decoded;
      });
    });
    return Promise.all(tasks).then(
      function (payloads) {
        var chunks = [];
        var index;
        for (index = 0; index < payloads.length; index += 1) {
          chunks.push(grpcHeader(0, payloads[index].length));
          chunks.push(payloads[index]);
        }
        return {
          body: concatBytes(chunks),
          changed: true,
          reason: "gzip-decoded",
          valid: true
        };
      },
      function () {
        return {
          body: original,
          changed: false,
          reason: "gzip-decode-failed",
          valid: false
        };
      }
    );
  }

  function transformGrpcBody(input, config) {
    var bytes = toUint8Array(input);
    var offset = 0;
    var chunks = [];
    var changed = 0;
    var frames = 0;
    var flag;
    var length;
    var frameEnd;
    var payload;
    var transformed;
    var raw;

    if (!bytes || !config || !config.valid || !config.cdnHost) {
      return {
        body: bytes || input,
        changed: 0,
        valid: Boolean(bytes && config && config.valid)
      };
    }

    while (offset + 5 <= bytes.length) {
      flag = bytes[offset];
      length = readUint32Be(bytes, offset + 1);
      frameEnd = offset + 5 + length;
      if ((flag !== 0 && flag !== 1) || frameEnd > bytes.length) {
        frames = 0;
        break;
      }
      frames += 1;
      payload = bytes.subarray(offset + 5, frameEnd);
      transformed =
        flag === 0
          ? transformSafeFixedProtoMessage(payload, config, 0, [])
          : { bytes: payload, changed: 0, valid: true };

      if (!transformed.valid) {
        return { body: bytes, changed: 0, valid: false };
      }
      if (transformed.changed > 0) {
        chunks.push(grpcHeader(flag, transformed.bytes.length));
        chunks.push(transformed.bytes);
        changed += transformed.changed;
      } else {
        chunks.push(bytes.subarray(offset, frameEnd));
      }
      offset = frameEnd;
    }

    if (frames > 0 && offset === bytes.length) {
      return {
        body: changed > 0 ? concatBytes(chunks) : bytes,
        changed: changed,
        valid: true
      };
    }
    if (bytes.length >= 5 && (bytes[0] === 0 || bytes[0] === 1)) {
      return { body: bytes, changed: 0, valid: false };
    }

    raw = transformSafeFixedProtoMessage(bytes, config, 0, []);
    return {
      body: raw.changed > 0 ? raw.bytes : bytes,
      changed: raw.changed,
      valid: raw.valid
    };
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
    var hdntsMatch;
    if (expiry > 0) {
      return expiry;
    }
    hdntsMatch = /(?:^|~)exp=(\d{9,13})(?:~|$)/i.exec(
      String(values && values.hdnts || "")
    );
    return hdntsMatch ? unixExpiryMilliseconds(hdntsMatch[1]) : 0;
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
    if (typeof url !== "string" || url.length > MEDIA_ROUTE_MAX_URL_BYTES) {
      return null;
    }
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

  function createEmptyMediaRouteState() {
    return { entries: {}, version: MEDIA_ROUTE_STATE_VERSION };
  }

  function sanitizeMediaRouteSourceHosts(value) {
    var output = [];
    var seen = {};
    var index;
    var hostname;
    if (!Array.isArray(value)) {
      return output;
    }
    for (index = 0; index < value.length && output.length < 16; index += 1) {
      hostname = String(value[index] || "").toLowerCase();
      if (
        !seen[hostname] &&
        isValidHostname(hostname) &&
        isBilibiliMediaHost(hostname)
      ) {
        seen[hostname] = true;
        output.push(hostname);
      }
    }
    return output;
  }

  function sanitizeMediaRouteEntry(key, value, now) {
    var networkProfile;
    var targetUrl;
    var binding;
    var target;
    var targetHost;
    var sourceHosts;
    var expiresAt;
    if (!isObject(value) || Array.isArray(value)) {
      return null;
    }
    networkProfile = normalizeNetworkProfile(value.networkProfile);
    targetUrl = typeof value.targetUrl === "string" ? value.targetUrl : "";
    if (!targetUrl || targetUrl.length > MEDIA_ROUTE_MAX_URL_BYTES) {
      return null;
    }
    binding = mediaRouteKeyForUrl(targetUrl, networkProfile);
    target = parseHttpUrl(targetUrl);
    targetHost = String(value.targetHost || "").toLowerCase();
    sourceHosts = sanitizeMediaRouteSourceHosts(value.sourceHosts);
    if (
      !binding ||
      binding.key !== key ||
      !target ||
      target.hostname !== targetHost ||
      !isBilibiliMediaHost(targetHost) ||
      sourceHosts.length === 0 ||
      sourceHosts.indexOf(targetHost) === -1
    ) {
      return null;
    }
    expiresAt = Math.min(
      boundedNumber(value.expiresAt, 0, 0, 9e15),
      binding.expiresAt,
      boundedNumber(now, 0, 0, 9e15) + MEDIA_ROUTE_MAX_TTL_MS
    );
    if (expiresAt <= now) {
      return null;
    }
    return {
      expiresAt: expiresAt,
      networkProfile: networkProfile,
      observedAt: boundedNumber(value.observedAt, 0, 0, 9e15),
      sourceHosts: sourceHosts,
      targetHost: targetHost,
      targetUrl: targetUrl
    };
  }

  function sanitizeMediaRouteState(value, now) {
    var state = createEmptyMediaRouteState();
    var rows = [];
    var keys;
    var index;
    var key;
    var entry;
    now = boundedNumber(now, 0, 0, 9e15);
    if (
      !isObject(value) ||
      Array.isArray(value) ||
      value.version !== MEDIA_ROUTE_STATE_VERSION ||
      !isObject(value.entries) ||
      Array.isArray(value.entries)
    ) {
      return state;
    }
    keys = Object.keys(value.entries).slice(0, MEDIA_ROUTE_CAPACITY * 4);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!/^m2_[0-9a-f]{32}$/.test(key)) {
        continue;
      }
      entry = sanitizeMediaRouteEntry(key, value.entries[key], now);
      if (entry) {
        rows.push({ entry: entry, key: key });
      }
    }
    rows.sort(function (left, right) {
      return right.entry.observedAt - left.entry.observedAt;
    });
    for (
      index = 0;
      index < rows.length && index < MEDIA_ROUTE_CAPACITY;
      index += 1
    ) {
      state.entries[rows[index].key] = rows[index].entry;
    }
    return state;
  }

  function loadMediaRouteState(services, now) {
    var raw;
    var parsed;
    try {
      raw = services && typeof services.read === "function"
        ? services.read(MEDIA_ROUTE_STATE_KEY)
        : null;
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }
    return sanitizeMediaRouteState(parsed, now);
  }

  function saveMediaRouteState(services, state, now) {
    try {
      return Boolean(
        services &&
        typeof services.write === "function" &&
        services.write(
          JSON.stringify(sanitizeMediaRouteState(state, now)),
          MEDIA_ROUTE_STATE_KEY
        )
      );
    } catch (error) {
      return false;
    }
  }

  function mediaRouteForDescriptor(descriptor, config, now) {
    var selectedId;
    var primaryBinding;
    var targetBinding;
    var target;
    var sourceHosts = [];
    var seenHosts = {};
    var index;
    var candidate;
    var candidateBinding;
    var candidateParsed;
    var expiresAt;
    if (
      !descriptor ||
      !descriptor.selectedUrl ||
      descriptor.selectedAlias ||
      !descriptor.candidateById
    ) {
      return null;
    }
    selectedId = candidateIdForUrl(descriptor.selectedUrl);
    if (
      !selectedId ||
      selectedId === descriptor.primaryId ||
      descriptor.candidateById[selectedId] !== descriptor.selectedUrl
    ) {
      return null;
    }
    primaryBinding = mediaRouteKeyForUrl(
      descriptor.primaryUrl,
      config && config.networkProfile
    );
    targetBinding = mediaRouteKeyForUrl(
      descriptor.selectedUrl,
      config && config.networkProfile
    );
    target = parseHttpUrl(descriptor.selectedUrl);
    if (
      !primaryBinding ||
      !targetBinding ||
      primaryBinding.key !== targetBinding.key ||
      !target
    ) {
      return null;
    }
    for (index = 0; index < descriptor.candidates.length; index += 1) {
      candidate = descriptor.candidates[index];
      candidateBinding = mediaRouteKeyForUrl(
        candidate && candidate.url,
        config && config.networkProfile
      );
      candidateParsed = parseHttpUrl(candidate && candidate.url);
      if (
        candidateBinding &&
        candidateBinding.key === primaryBinding.key &&
        candidateParsed &&
        !seenHosts[candidateParsed.hostname]
      ) {
        seenHosts[candidateParsed.hostname] = true;
        sourceHosts.push(candidateParsed.hostname);
      }
    }
    if (sourceHosts.length < 2 || sourceHosts.indexOf(target.hostname) === -1) {
      return null;
    }
    expiresAt = Math.min(
      primaryBinding.expiresAt,
      targetBinding.expiresAt,
      now + MEDIA_ROUTE_MAX_TTL_MS
    );
    if (expiresAt <= now) {
      return null;
    }
    return {
      entry: {
        expiresAt: expiresAt,
        networkProfile: normalizeNetworkProfile(config && config.networkProfile),
        observedAt: now,
        sourceHosts: sourceHosts,
        targetHost: target.hostname,
        targetUrl: descriptor.selectedUrl
      },
      key: primaryBinding.key
    };
  }

  function persistPreparedMediaRoutes(services, descriptors, config, now) {
    var state;
    var routes = [];
    var index;
    var route;
    if (
      !config ||
      !config.auto ||
      !hasStateServices(services) ||
      !Array.isArray(descriptors)
    ) {
      return 0;
    }
    for (index = 0; index < descriptors.length; index += 1) {
      route = mediaRouteForDescriptor(descriptors[index], config, now);
      if (route) {
        routes.push(route);
      }
    }
    if (routes.length === 0) {
      return 0;
    }
    state = loadMediaRouteState(services, now);
    for (index = 0; index < routes.length; index += 1) {
      state.entries[routes[index].key] = routes[index].entry;
    }
    return saveMediaRouteState(services, state, now) ? routes.length : 0;
  }

  function queryFreeCandidateFingerprint(url) {
    var parsed = parseHttpUrl(url);
    if (!parsed || !isVodMediaUrl(url)) {
      return null;
    }
    return (
      parsed.scheme +
      "://" +
      parsed.authority.toLowerCase() +
      parsed.path
    );
  }

  function candidateIdForUrl(url) {
    var parsed = parseHttpUrl(url);
    if (!parsed || !isVodMediaUrl(url)) {
      return null;
    }
    return stableHash(
      "c",
      parsed.scheme + "://" + parsed.authority.toLowerCase()
    );
  }

  function candidateFamilyForUrl(url) {
    var parsed = parseHttpUrl(url);
    var hostname;
    if (!parsed) {
      return "invalid";
    }
    hostname = parsed.hostname;
    if (hostnameMatchesSuffix(hostname, "mcdn.bilivideo.cn")) {
      return "mcdn";
    }
    if (
      hostname.indexOf("pcdn") !== -1 ||
      hostnameMatchesSuffix(hostname, "onethingpcs.com")
    ) {
      return "pcdn";
    }
    return "standard";
  }

  function stableScalar(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "1" : "0";
    }
    if (typeof value === "string" && value.length <= 128) {
      return value;
    }
    return "";
  }

  function jsonMetadataSignature(value) {
    var output = [];
    var index;
    var key;
    var scalar;

    for (index = 0; index < JSON_METADATA_KEYS.length; index += 1) {
      key = JSON_METADATA_KEYS[index];
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        scalar = stableScalar(value[key]);
        if (scalar !== "") {
          output.push(key + "=" + scalar);
        }
      }
    }
    return output.join("&");
  }

  function requiredThroughputKbps(kind, bandwidthBitsPerSecond) {
    var bandwidth = boundedNumber(
      bandwidthBitsPerSecond,
      0,
      0,
      1000000000
    );
    var representationFloor =
      bandwidth > 0
        ? Math.ceil((bandwidth / 1000) * AUTO_REPRESENTATION_HEADROOM)
        : 0;
    if (kind === "audio") {
      return Math.max(AUTO_MIN_AUDIO_THROUGHPUT_KBPS, representationFloor);
    }
    if (kind === "segment") {
      return Math.max(AUTO_MIN_SEGMENT_THROUGHPUT_KBPS, representationFloor);
    }
    return Math.max(AUTO_MIN_VIDEO_THROUGHPUT_KBPS, representationFloor);
  }

  function mediaBucketForDescriptor(descriptor) {
    var kind = String(descriptor && descriptor.kind || "").toLowerCase();
    var required = boundedNumber(
      descriptor && descriptor.requiredKbps,
      0,
      0,
      100000000
    );
    var bandwidth = boundedNumber(
      descriptor && descriptor.bandwidthBitsPerSecond,
      0,
      0,
      1000000000
    );
    var quality = boundedNumber(descriptor && descriptor.quality, 0, 0, 1000);
    var codecid = boundedNumber(descriptor && descriptor.codecid, 0, 0, 1000);
    if (kind === "audio") {
      return "audio";
    }
    return (
      required >= HIGH_BITRATE_REQUIRED_KBPS ||
      bandwidth >= 5500000 ||
      quality >= 112 ||
      (
        quality >= 80 &&
        (codecid === 12 || codecid === 13) &&
        bandwidth >= 4000000
      )
    )
      ? "high-bitrate-video"
      : "normal-video";
  }

  function metadataNumber(metadata, keys) {
    var text = typeof metadata === "string" ? metadata : "";
    var index;
    var match;
    for (index = 0; index < keys.length; index += 1) {
      match = new RegExp("(?:^|&)" + keys[index] + "=([0-9]+)(?:&|$)").exec(text);
      if (match) {
        return boundedNumber(match[1], 0, 0, 1000000000);
      }
    }
    return 0;
  }

  function buildMediaDescriptor(
    format,
    kind,
    primaryUrl,
    backupUrls,
    metadata,
    bandwidthBitsPerSecond
  ) {
    var primaryParsed = parseHttpUrl(primaryUrl);
    var primaryFamily = candidateFamilyForUrl(primaryUrl);
    var candidates = [];
    var candidateById = {};
    var candidateIds = [];
    var index;
    var url;
    var candidateId;
    var sortedIds;
    var candidateSetHash;
    var resourceMaterial;
    var reusableRepresentation;

    if (!primaryParsed || !isVodMediaUrl(primaryUrl)) {
      return null;
    }
    candidates.push({ id: candidateIdForUrl(primaryUrl), url: primaryUrl });
    candidateById[candidates[0].id] = primaryUrl;
    candidateIds.push(candidates[0].id);

    for (index = 0; index < backupUrls.length; index += 1) {
      url = backupUrls[index];
      candidateId = candidateIdForUrl(url);
      if (
        candidateId &&
        candidateFamilyForUrl(url) === primaryFamily &&
        !candidateById[candidateId]
      ) {
        candidateById[candidateId] = url;
        candidateIds.push(candidateId);
        candidates.push({ id: candidateId, url: url });
      }
    }
    if (candidates.length < 2) {
      return null;
    }

    sortedIds = candidateIds.slice().sort();
    candidateSetHash = stableHash("s", sortedIds.join("|"));
    /*
     * A representation signature is not a media-object identity. Reusing a
     * selected host across two videos that happen to share quality/codec can
     * route the next signed object through a candidate that was never
     * validated for it. Always bind learned state to the exact query-free
     * media path while still including representation metadata.
     */
    reusableRepresentation = false;
    resourceMaterial = [
      format,
      kind || "unknown",
      primaryFamily,
      "object:" + primaryParsed.path,
      metadata || "",
      candidateSetHash
    ].join("\u0000");

    return {
      candidateById: candidateById,
      candidateIds: candidateIds,
      candidates: candidates,
      candidateSetHash: candidateSetHash,
      codecid: metadataNumber(metadata, ["codecid"]),
      family: primaryFamily,
      format: format,
      keyMaterial: resourceMaterial,
      kind: kind || "unknown",
      bandwidthBitsPerSecond: boundedNumber(
        bandwidthBitsPerSecond,
        0,
        0,
        1000000000
      ),
      metadata: metadata || "",
      primaryId: candidates[0].id,
      primaryUrl: primaryUrl,
      quality: metadataNumber(metadata, ["quality", "id"]),
      requiredKbps: requiredThroughputKbps(
        kind || "unknown",
        bandwidthBitsPerSecond
      ),
      reusableRepresentation: reusableRepresentation
    };
  }

  function descriptorResourceKey(descriptor, config) {
    return stableHash(
      "r",
      normalizeNetworkProfile(config && config.networkProfile) +
        "\u0000" +
        descriptor.keyMaterial
    );
  }

  function isHostCircuitOpen(state, candidateId, now) {
    var health =
      state &&
      state.hosts &&
      /^c2_[0-9a-f]{32}$/.test(candidateId || "")
        ? state.hosts[candidateId]
        : null;
    return Boolean(health && health.openUntil > now);
  }

  function descriptorCandidateForHost(descriptor, hostname) {
    var index;
    var parsed;
    for (index = 0; index < descriptor.candidates.length; index += 1) {
      parsed = parseHttpUrl(descriptor.candidates[index].url);
      if (parsed && parsed.hostname === hostname) {
        return descriptor.candidates[index].url;
      }
    }
    return "";
  }

  function selectHostUrlForDescriptor(descriptor, config, now) {
    var stableHost = selectStableHost(
      config && config.hostAutoState,
      config,
      descriptor,
      now
    );
    var primary = parseHttpUrl(descriptor.primaryUrl);
    var exactUrl;
    var aliasUrl;

    descriptor.selectedAlias = false;
    descriptor.selectedHost = "";
    descriptor.selectionSource = "server-primary";
    if (stableHost) {
      descriptor.selectedHost = stableHost;
      if (primary && primary.hostname === stableHost) {
        descriptor.selectionSource = "host-state-primary";
        return null;
      }
      exactUrl = descriptorCandidateForHost(descriptor, stableHost);
      if (exactUrl) {
        descriptor.selectionSource = "host-state";
        return exactUrl;
      }
      if (
        stableHost !== AKAMAI_COLD_HOST &&
        FIXED_CDN_CANDIDATES.indexOf(stableHost) !== -1 &&
        descriptor.family === "standard"
      ) {
        aliasUrl = replaceVodHostname(descriptor.primaryUrl, stableHost);
        if (aliasUrl) {
          descriptor.selectedAlias = true;
          descriptor.selectionSource = "host-state";
          return aliasUrl;
        }
      }
      /* Never synthesize an Akamai URL: its query may be host-bound. */
      if (stableHost === AKAMAI_COLD_HOST) {
        descriptor.selectionSource = "server-primary";
        return null;
      }
    }

    exactUrl = descriptorCandidateForHost(descriptor, AKAMAI_COLD_HOST);
    if (
      exactUrl &&
      candidateIdForUrl(exactUrl) !== descriptor.primaryId
    ) {
      descriptor.selectedHost = AKAMAI_COLD_HOST;
      descriptor.selectionSource = "cold-akamai";
      return exactUrl;
    }
    return null;
  }

  function selectedUrlForDescriptor(descriptor, config, state, now) {
    var key = descriptorResourceKey(descriptor, config);
    var entry = state.entries[key];
    var selectedUrl;

    descriptor.resourceKey = key;
    if (
      config &&
      config.hostAutoState &&
      config.hostAutoState.version === HOST_AUTO_STATE_VERSION
    ) {
      return selectHostUrlForDescriptor(descriptor, config, now);
    }
    if (
      !entry ||
      entry.candidateSetHash !== descriptor.candidateSetHash ||
      !entry.candidateId ||
      entry.candidateId === descriptor.primaryId ||
      entry.expiresAt <= now ||
      entry.validatedAt <= 0 ||
      isHostCircuitOpen(state, entry.candidateId, now) ||
      (
        config &&
        config.probeMode !== "off" &&
        entry.validatedAt + AUTO_SELECTED_REVALIDATE_MS <= now
      )
    ) {
      return null;
    }
    selectedUrl = descriptor.candidateById[entry.candidateId];
    return selectedUrl || null;
  }

  function arrayOfVodUrls(value) {
    var output = [];
    var index;
    if (!Array.isArray(value)) {
      return output;
    }
    for (index = 0; index < value.length; index += 1) {
      if (typeof value[index] === "string" && isVodMediaUrl(value[index])) {
        output.push(value[index]);
      }
    }
    return output;
  }

  function intersectBackupLists(lists) {
    var output;
    var allowed;
    var index;
    var inner;
    var candidateId;

    if (lists.length === 0) {
      return [];
    }
    output = lists[0].slice();
    for (index = 1; index < lists.length; index += 1) {
      allowed = {};
      for (inner = 0; inner < lists[index].length; inner += 1) {
        candidateId = candidateIdForUrl(lists[index][inner]);
        if (candidateId) {
          allowed[candidateId] = true;
        }
      }
      output = output.filter(function (url) {
        return Boolean(allowed[candidateIdForUrl(url)]);
      });
    }
    return output;
  }

  function detectJsonMediaObject(value, kind, config, state, now) {
    var lanes = jsonAliasLanes(value);
    var backupLists = [];
    var index;
    var descriptor;
    var selectedUrl;
    var selectedId;
    var laneSelectedUrl;
    var changed = 0;

    if (!lanes) {
      return null;
    }
    for (index = 0; index < lanes.length; index += 1) {
      backupLists.push(lanes[index].backups);
    }

    descriptor = buildMediaDescriptor(
      "json",
      kind,
      lanes[0].primaryUrl,
      intersectBackupLists(backupLists),
      jsonMetadataSignature(value),
      value.bandwidth
    );
    if (!descriptor) {
      return null;
    }
    descriptor.resourceKey = descriptorResourceKey(descriptor, config);
    selectedUrl = selectedUrlForDescriptor(
      descriptor,
      config,
      state,
      now
    );
    descriptor.selectedUrl = selectedUrl;

    if (!selectedUrl) {
      return { changed: 0, descriptor: descriptor };
    }
    selectedId = candidateIdForUrl(selectedUrl);
    for (index = 0; index < lanes.length; index += 1) {
      laneSelectedUrl = laneUrlForCandidate(lanes[index], selectedId);
      if (!laneSelectedUrl && descriptor.selectedAlias) {
        laneSelectedUrl = replaceVodHostname(
          lanes[index].primaryUrl,
          descriptor.selectedHost
        );
      }
      if (!laneSelectedUrl) {
        return { changed: 0, descriptor: descriptor };
      }
    }
    for (index = 0; index < lanes.length; index += 1) {
      laneSelectedUrl = laneUrlForCandidate(lanes[index], selectedId);
      if (!laneSelectedUrl && descriptor.selectedAlias) {
        laneSelectedUrl = replaceVodHostname(
          lanes[index].primaryUrl,
          descriptor.selectedHost
        );
      }
      changed += rotateJsonAliasLaneToUrl(
        value,
        lanes[index],
        laneSelectedUrl
      );
    }
    return { changed: changed, descriptor: descriptor };
  }

  function jsonChildKind(key, currentKind) {
    var lower = String(key || "").toLowerCase();
    if (
      lower === "video" ||
      lower === "videos" ||
      lower === "dash_video"
    ) {
      return "video";
    }
    if (
      lower === "audio" ||
      lower === "audios" ||
      lower === "dash_audio" ||
      lower === "dolby" ||
      lower === "flac"
    ) {
      return "audio";
    }
    if (
      lower === "durl" ||
      lower === "segment" ||
      lower === "segments"
    ) {
      return "segment";
    }
    return currentKind || "unknown";
  }

  function walkSafeJson(value, kind, config, state, now, descriptors, depth) {
    var detected;
    var keys;
    var index;
    var key;
    var changed = 0;

    if (depth > MAX_JSON_DEPTH || value === null) {
      return 0;
    }
    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        changed += walkSafeJson(
          value[index],
          kind,
          config,
          state,
          now,
          descriptors,
          depth + 1
        );
      }
      return changed;
    }
    if (!isObject(value)) {
      return 0;
    }

    detected = detectJsonMediaObject(value, kind, config, state, now);
    if (detected) {
      descriptors.push(detected.descriptor);
      changed += detected.changed;
    }

    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (!PRIMARY_URL_KEYS[key] && !BACKUP_URL_KEYS[key]) {
        changed += walkSafeJson(
          value[key],
          jsonChildKind(key, kind),
          config,
          state,
          now,
          descriptors,
          depth + 1
        );
      }
    }
    return changed;
  }

  function prepareSafeJson(text, config, state, now) {
    var input = typeof text === "string" ? text : "";
    var parsed;
    var descriptors = [];
    var changed;

    if (!input) {
      return { body: input, changed: 0, descriptors: descriptors, valid: true };
    }
    try {
      parsed = JSON.parse(input.replace(/^\uFEFF/, ""));
    } catch (error) {
      return { body: input, changed: 0, descriptors: descriptors, valid: false };
    }

    changed = walkSafeJson(
      parsed,
      "unknown",
      config,
      state,
      now,
      descriptors,
      0
    );
    return {
      body: changed > 0 ? JSON.stringify(parsed) : input,
      changed: changed,
      descriptors: descriptors,
      valid: true
    };
  }

  function createEmptyAutoState() {
    return {
      entries: {},
      hosts: {},
      lastProbeAt: 0,
      lockTokens: {},
      locks: {},
      resetToken: "",
      version: 7
    };
  }

  function boundedInteger(value, fallback, minimum, maximum) {
    return Math.floor(boundedNumber(value, fallback, minimum, maximum));
  }

  function median(values) {
    var sorted;
    var middle;
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    sorted = values.slice().sort(function (left, right) {
      return left - right;
    });
    middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  function summarizeProbeSamples(samples) {
    var successful = samples.filter(function (sample) {
      return sample.ok;
    });
    var elapsed = successful.map(function (sample) {
      return sample.elapsedMs;
    });
    var throughput = successful.map(function (sample) {
      return sample.throughputKbps;
    });
    var medianMs = median(elapsed);
    var deviations = elapsed.map(function (value) {
      return Math.abs(value - medianMs);
    });
    return {
      failureRate: samples.length === 0
        ? 0
        : (samples.length - successful.length) / samples.length,
      jitterMs: median(deviations),
      medianMs: medianMs,
      medianThroughputKbps: median(throughput),
      sampleCount: samples.length,
      successCount: successful.length
    };
  }

  function percentile25(values) {
    var sorted;
    var index;
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    sorted = values.slice().sort(function (left, right) {
      return left - right;
    });
    index = Math.floor((sorted.length - 1) * 0.25);
    return sorted[index];
  }

  function createEmptyHostAutoState() {
    return {
      lock: null,
      profiles: {},
      resetToken: "",
      version: HOST_AUTO_STATE_VERSION
    };
  }

  function sanitizeHostObjectId(value) {
    return /^o2_[0-9a-f]{32}$/.test(value || "") ? value : "";
  }

  function sanitizeHostBenchmarkSample(value) {
    var objectId;
    var phase;
    var bucket;
    if (!isObject(value) || Array.isArray(value)) {
      return null;
    }
    objectId = sanitizeHostObjectId(value.objectId);
    phase = /^(?:startup|sustained)$/.test(String(value.phase || ""))
      ? String(value.phase)
      : "combined";
    bucket = HOST_MEDIA_BUCKETS.indexOf(String(value.bucket || "")) !== -1
      ? String(value.bucket)
      : "normal-video";
    return {
      at: boundedNumber(value.at, 0, 0, 9e15),
      bucket: bucket,
      elapsedMs: boundedNumber(value.elapsedMs, 0, 0, 60000),
      objectId: objectId,
      ok: Boolean(value.ok),
      phase: phase,
      reason:
        typeof value.reason === "string"
          ? value.reason.slice(0, 48)
          : "",
      status: boundedInteger(value.status, 0, 0, 999),
      throughputKbps: boundedNumber(
        value.throughputKbps,
        0,
        0,
        100000000
      ),
      ttfbMs: boundedNumber(value.ttfbMs, 0, 0, 60000)
    };
  }

  function summarizeHostSamples(samples, objects) {
    var successful = samples.filter(function (sample) {
      return sample.ok;
    });
    var startup = successful.filter(function (sample) {
      return sample.phase === "startup" || sample.phase === "combined";
    });
    var sustained = successful.filter(function (sample) {
      return sample.phase === "sustained" || sample.phase === "combined";
    });
    var startupThroughput = startup.map(function (sample) {
      return sample.throughputKbps;
    });
    var sustainedThroughput = sustained.map(function (sample) {
      return sample.throughputKbps;
    });
    var ttfb = startup.map(function (sample) {
      return sample.ttfbMs;
    });
    var medianTtfbMs = median(ttfb);
    var ttfbDeviations = ttfb.map(function (value) {
      return Math.abs(value - medianTtfbMs);
    });
    var medianSustained = median(sustainedThroughput);
    var throughputDeviations = sustainedThroughput.map(function (value) {
      return Math.abs(value - medianSustained);
    });
    var ttfbJitter = medianTtfbMs > 0
      ? median(ttfbDeviations) / medianTtfbMs
      : 0;
    var throughputJitter = medianSustained > 0
      ? median(throughputDeviations) / medianSustained
      : 0;
    var p25Sustained = percentile25(sustainedThroughput);
    return {
      failureRate:
        samples.length === 0
          ? 0
          : (samples.length - successful.length) / samples.length,
      jitterRatio: Math.max(ttfbJitter, throughputJitter),
      lastSuccessAt: successful.reduce(function (latest, sample) {
        return Math.max(latest, sample.at || 0);
      }, 0),
      medianStartupThroughputKbps: median(startupThroughput),
      medianStartupTtfbMs: medianTtfbMs,
      medianSustainedThroughputKbps: medianSustained,
      medianThroughputKbps: medianSustained,
      medianTtfbMs: medianTtfbMs,
      objectCount: Array.isArray(objects) ? objects.length : 0,
      p25StartupThroughputKbps: percentile25(startupThroughput),
      p25SustainedThroughputKbps: p25Sustained,
      p25ThroughputKbps: p25Sustained,
      sampleCount: samples.length,
      startupSuccessCount: startup.length,
      successCount: successful.length,
      sustainedSuccessCount: sustained.length
    };
  }

  function createEmptyHostBucket() {
    return {
      lastSuccessAt: 0,
      metrics: summarizeHostSamples([], []),
      objects: [],
      samples: []
    };
  }

  function sanitizeHostBucket(value, bucketName) {
    var bucket = createEmptyHostBucket();
    var seenObjects = {};
    var index;
    var objectId;
    var sample;
    if (!isObject(value) || Array.isArray(value)) {
      return bucket;
    }
    if (Array.isArray(value.objects)) {
      for (
        index = Math.max(0, value.objects.length - HOST_OBJECT_CAPACITY);
        index < value.objects.length;
        index += 1
      ) {
        objectId = sanitizeHostObjectId(value.objects[index]);
        if (objectId && !seenObjects[objectId]) {
          seenObjects[objectId] = true;
          bucket.objects.push(objectId);
        }
      }
    }
    if (Array.isArray(value.samples)) {
      for (
        index = Math.max(0, value.samples.length - HOST_SAMPLE_CAPACITY);
        index < value.samples.length;
        index += 1
      ) {
        sample = sanitizeHostBenchmarkSample(value.samples[index]);
        if (!sample || sample.bucket !== bucketName) {
          continue;
        }
        bucket.samples.push(sample);
        if (
          sample.ok &&
          sample.objectId &&
          (sample.phase === "sustained" || sample.phase === "combined") &&
          !seenObjects[sample.objectId]
        ) {
          seenObjects[sample.objectId] = true;
          bucket.objects.push(sample.objectId);
          if (bucket.objects.length > HOST_OBJECT_CAPACITY) {
            delete seenObjects[bucket.objects.shift()];
          }
        }
      }
    }
    bucket.lastSuccessAt = Math.max(
      boundedNumber(value.lastSuccessAt, 0, 0, 9e15),
      bucket.samples.reduce(function (latest, row) {
        return row.ok ? Math.max(latest, row.at || 0) : latest;
      }, 0)
    );
    bucket.objects = bucket.objects.slice(-HOST_OBJECT_CAPACITY);
    bucket.metrics = summarizeHostSamples(bucket.samples, bucket.objects);
    return bucket;
  }

  function sanitizeHostAutoHealth(value) {
    var health = {
      buckets: {},
      failureStreak: 0,
      lastFailureAt: 0,
      lastSuccessAt: 0,
      lastUsedAt: 0,
      metrics: summarizeHostSamples([], []),
      objects: [],
      openUntil: 0,
      samples: []
    };
    var index;
    var sample;
    var bucketName;
    var bucketInput;
    var directBuckets = {};

    if (!isObject(value) || Array.isArray(value)) {
      for (index = 0; index < HOST_MEDIA_BUCKETS.length; index += 1) {
        health.buckets[HOST_MEDIA_BUCKETS[index]] = createEmptyHostBucket();
      }
      return health;
    }
    if (Array.isArray(value.samples)) {
      for (index = 0; index < value.samples.length; index += 1) {
        sample = sanitizeHostBenchmarkSample(value.samples[index]);
        if (sample) {
          if (!directBuckets[sample.bucket]) {
            directBuckets[sample.bucket] = { objects: [], samples: [] };
          }
          directBuckets[sample.bucket].samples.push(sample);
        }
      }
      if (Array.isArray(value.objects)) {
        if (!directBuckets["normal-video"]) {
          directBuckets["normal-video"] = { objects: [], samples: [] };
        }
        directBuckets["normal-video"].objects = value.objects;
      }
    }
    for (index = 0; index < HOST_MEDIA_BUCKETS.length; index += 1) {
      bucketName = HOST_MEDIA_BUCKETS[index];
      bucketInput = value.buckets && value.buckets[bucketName]
        ? value.buckets[bucketName]
        : directBuckets[bucketName];
      health.buckets[bucketName] = sanitizeHostBucket(bucketInput, bucketName);
    }
    health.failureStreak = boundedInteger(
      value.failureStreak,
      0,
      0,
      HOST_SAMPLE_CAPACITY
    );
    health.lastFailureAt = boundedNumber(value.lastFailureAt, 0, 0, 9e15);
    health.lastSuccessAt = boundedNumber(value.lastSuccessAt, 0, 0, 9e15);
    health.lastUsedAt = boundedNumber(value.lastUsedAt, 0, 0, 9e15);
    health.openUntil = boundedNumber(value.openUntil, 0, 0, 9e15);
    for (index = 0; index < HOST_MEDIA_BUCKETS.length; index += 1) {
      health.lastSuccessAt = Math.max(
        health.lastSuccessAt,
        health.buckets[HOST_MEDIA_BUCKETS[index]].lastSuccessAt
      );
    }
    health.samples = health.buckets["normal-video"].samples;
    health.objects = health.buckets["normal-video"].objects;
    health.metrics = health.buckets["normal-video"].metrics;
    return health;
  }

  function sanitizeHostProfile(value) {
    var profile = {
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
    var hostRows = [];
    var keys;
    var index;
    var hostname;
    var health;

    if (!isObject(value) || Array.isArray(value)) {
      return profile;
    }
    profile.challengerCursor = boundedInteger(
      value.challengerCursor,
      0,
      0,
      1000000
    );
    profile.lastRunAt = boundedNumber(value.lastRunAt, 0, 0, 9e15);
    profile.nextRunAt = boundedNumber(value.nextRunAt, 0, 0, 9e15);
    hostname = String(value.pendingHost || "").toLowerCase();
    if (FIXED_CDN_CANDIDATES.indexOf(hostname) !== -1) {
      profile.pendingHost = hostname;
    }
    profile.rangeCursor = boundedInteger(value.rangeCursor, 0, 0, 1000000);
    profile.sampleCursor = boundedInteger(value.sampleCursor, 0, 0, 1000000);
    profile.selectedAt = boundedNumber(value.selectedAt, 0, 0, 9e15);
    hostname = String(value.selectedHost || "").toLowerCase();
    if (FIXED_CDN_CANDIDATES.indexOf(hostname) !== -1) {
      profile.selectedHost = hostname;
    }
    if (isObject(value.hosts) && !Array.isArray(value.hosts)) {
      keys = Object.keys(value.hosts);
      for (index = 0; index < keys.length; index += 1) {
        hostname = String(keys[index] || "").toLowerCase();
        if (!isValidHostname(hostname) || !isBilibiliMediaHost(hostname)) {
          continue;
        }
        health = sanitizeHostAutoHealth(value.hosts[keys[index]]);
        hostRows.push({ health: health, hostname: hostname });
      }
    }
    hostRows.sort(function (left, right) {
      return right.health.lastUsedAt - left.health.lastUsedAt;
    });
    for (
      index = 0;
      index < hostRows.length && index < HOST_AUTO_CAPACITY;
      index += 1
    ) {
      profile.hosts[hostRows[index].hostname] = hostRows[index].health;
    }
    return profile;
  }

  function sanitizeHostAutoState(value, now) {
    var state = createEmptyHostAutoState();
    var profileRows = [];
    var keys;
    var index;
    var profileName;
    var profile;
    var lock;

    if (
      !isObject(value) ||
      Array.isArray(value) ||
      value.version !== HOST_AUTO_STATE_VERSION
    ) {
      return state;
    }
    state.resetToken = normalizeResetToken(value.resetToken);
    if (isObject(value.profiles) && !Array.isArray(value.profiles)) {
      keys = Object.keys(value.profiles);
      for (index = 0; index < keys.length; index += 1) {
        profileName = normalizeNetworkProfile(keys[index]);
        if (profileName !== keys[index]) {
          continue;
        }
        profile = sanitizeHostProfile(value.profiles[keys[index]]);
        profileRows.push({ name: profileName, profile: profile });
      }
    }
    profileRows.sort(function (left, right) {
      return Math.max(right.profile.lastRunAt, right.profile.selectedAt) -
        Math.max(left.profile.lastRunAt, left.profile.selectedAt);
    });
    for (
      index = 0;
      index < profileRows.length && index < HOST_PROFILE_CAPACITY;
      index += 1
    ) {
      state.profiles[profileRows[index].name] = profileRows[index].profile;
    }
    lock = value.lock;
    if (
      isObject(lock) &&
      !Array.isArray(lock) &&
      typeof lock.token === "string" &&
      /^[a-z0-9_-]{1,64}$/i.test(lock.token) &&
      boundedNumber(lock.expiresAt, 0, 0, 9e15) > boundedNumber(now, 0, 0, 9e15)
    ) {
      state.lock = {
        createdAt: boundedNumber(lock.createdAt, 0, 0, 9e15),
        expiresAt: boundedNumber(lock.expiresAt, 0, 0, 9e15),
        token: lock.token
      };
    }
    return state;
  }

  function loadHostAutoState(services) {
    var raw;
    var parsed;
    var now =
      services && typeof services.now === "function" ? services.now() : 0;
    try {
      raw = services && typeof services.read === "function"
        ? services.read(HOST_AUTO_STATE_KEY)
        : null;
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }
    return sanitizeHostAutoState(parsed, now);
  }

  function saveHostAutoState(services, state, now) {
    try {
      return Boolean(
        services &&
        typeof services.write === "function" &&
        services.write(
          JSON.stringify(sanitizeHostAutoState(state, now)),
          HOST_AUTO_STATE_KEY
        )
      );
    } catch (error) {
      return false;
    }
  }

  function ensureHostProfile(state, networkProfile) {
    var profileName = normalizeNetworkProfile(networkProfile);
    var profile;
    var rows;
    var index;
    if (!isObject(state.profiles) || Array.isArray(state.profiles)) {
      state.profiles = {};
    }
    profile = state.profiles[profileName];
    if (!profile) {
      profile = sanitizeHostProfile(null);
      state.profiles[profileName] = profile;
    }
    rows = Object.keys(state.profiles);
    if (rows.length > HOST_PROFILE_CAPACITY) {
      rows.sort(function (left, right) {
        var leftProfile = state.profiles[left];
        var rightProfile = state.profiles[right];
        return Math.max(rightProfile.lastRunAt, rightProfile.selectedAt) -
          Math.max(leftProfile.lastRunAt, leftProfile.selectedAt);
      });
      for (index = HOST_PROFILE_CAPACITY; index < rows.length; index += 1) {
        if (rows[index] !== profileName) {
          delete state.profiles[rows[index]];
        }
      }
    }
    return profile;
  }

  function recordHostSample(
    state,
    networkProfile,
    hostname,
    value,
    now
  ) {
    var profile;
    var health;
    var sample;
    var recentFailures = 0;
    var index;
    hostname = String(hostname || "").toLowerCase();
    if (
      !isObject(state) ||
      state.version !== HOST_AUTO_STATE_VERSION ||
      !isValidHostname(hostname) ||
      !isBilibiliMediaHost(hostname)
    ) {
      return null;
    }
    sample = sanitizeHostBenchmarkSample(value);
    if (!sample) {
      return null;
    }
    if (!sample.at) {
      sample.at = boundedNumber(now, 0, 0, 9e15);
    }
    profile = ensureHostProfile(state, networkProfile);
    health = sanitizeHostAutoHealth(profile.hosts[hostname]);
    var bucket = health.buckets[sample.bucket];
    bucket.samples.push(sample);
    if (bucket.samples.length > HOST_SAMPLE_CAPACITY) {
      bucket.samples = bucket.samples.slice(-HOST_SAMPLE_CAPACITY);
    }
    health.lastUsedAt = sample.at;
    if (sample.ok) {
      health.failureStreak = 0;
      health.lastSuccessAt = sample.at;
      bucket.lastSuccessAt = sample.at;
      health.openUntil = 0;
      if (
        sample.objectId &&
        (sample.phase === "sustained" || sample.phase === "combined") &&
        bucket.objects.indexOf(sample.objectId) === -1
      ) {
        bucket.objects.push(sample.objectId);
        if (bucket.objects.length > HOST_OBJECT_CAPACITY) {
          bucket.objects = bucket.objects.slice(-HOST_OBJECT_CAPACITY);
        }
      }
    } else {
      health.failureStreak = Math.min(
        HOST_SAMPLE_CAPACITY,
        health.failureStreak + 1
      );
      health.lastFailureAt = sample.at;
      for (
        index = Math.max(0, bucket.samples.length - 4);
        index < bucket.samples.length;
        index += 1
      ) {
        if (!bucket.samples[index].ok) {
          recentFailures += 1;
        }
      }
      if (health.failureStreak >= 2 || recentFailures >= 2) {
        health.openUntil = Math.max(
          health.openUntil,
          sample.at + HOST_CIRCUIT_OPEN_MS
        );
      }
    }
    bucket.metrics = summarizeHostSamples(bucket.samples, bucket.objects);
    health.buckets[sample.bucket] = bucket;
    health.samples = health.buckets["normal-video"].samples;
    health.objects = health.buckets["normal-video"].objects;
    health.metrics = health.buckets["normal-video"].metrics;
    profile.hosts[hostname] = health;
    return health;
  }

  function hostBucketHealth(health, descriptor) {
    var bucket = mediaBucketForDescriptor(descriptor);
    return health && health.buckets ? health.buckets[bucket] : null;
  }

  function requiredHostThroughputKbps(descriptor) {
    var bucket = mediaBucketForDescriptor(descriptor);
    var representation = Math.ceil(
      Math.max(0, descriptor && descriptor.requiredKbps || 0) *
        HOST_REPRESENTATION_HEADROOM
    );
    if (bucket === "audio") {
      return Math.max(512, representation);
    }
    if (bucket === "high-bitrate-video") {
      return Math.max(HOST_MIN_THROUGHPUT_KBPS, representation);
    }
    return Math.max(3000, representation);
  }

  function stableHostScore(health, descriptor) {
    var bucket = hostBucketHealth(health, descriptor);
    var metrics = bucket && bucket.metrics;
    var required = requiredHostThroughputKbps(descriptor);
    var startupMargin;
    var sustainedMargin;
    var latencyScore;
    var rawScore;
    if (!metrics) {
      return -1;
    }
    startupMargin = Math.min(
      3,
      (metrics.p25StartupThroughputKbps || 0) / Math.max(1, required)
    );
    sustainedMargin = Math.min(
      3,
      (metrics.p25SustainedThroughputKbps || 0) / Math.max(1, required)
    );
    latencyScore = 1000 / (100 + Math.max(1, metrics.medianStartupTtfbMs || 60000));
    rawScore =
      latencyScore * 5.5 +
      (startupMargin / 3) * 20 +
      (sustainedMargin / 3) * 25;
    return rawScore *
      Math.max(0, 1 - (metrics.failureRate || 0)) /
      Math.max(1, 1 + (metrics.jitterRatio || 0));
  }

  function hostEligibleForDescriptor(health, descriptor, now) {
    var bucket = hostBucketHealth(health, descriptor);
    var metrics = bucket && bucket.metrics;
    var required = requiredHostThroughputKbps(descriptor);
    return Boolean(
      health &&
      bucket &&
      metrics &&
      health.openUntil <= now &&
      bucket.lastSuccessAt > 0 &&
      bucket.lastSuccessAt + HOST_ALIAS_FRESH_MS >= now &&
      metrics.objectCount >= HOST_MIN_OBJECTS &&
      metrics.startupSuccessCount >= HOST_MIN_OBJECTS &&
      metrics.sustainedSuccessCount >= HOST_MIN_OBJECTS &&
      metrics.failureRate <= HOST_MAX_FAILURE_RATE &&
      metrics.jitterRatio <= HOST_MAX_JITTER_RATIO &&
      metrics.p25StartupThroughputKbps >= required &&
      metrics.p25SustainedThroughputKbps >= required
    );
  }

  function selectStableHost(state, config, descriptor, now) {
    var profileName = normalizeNetworkProfile(
      config && config.networkProfile
    );
    var profile =
      state && state.version === HOST_AUTO_STATE_VERSION && state.profiles
        ? state.profiles[profileName]
        : null;
    var selected;
    var keys;
    var index;
    var hostname;
    var score;
    var bestHost = "";
    var bestScore = -1;
    var selectedScore = -1;
    var selectedEligible = false;
    var threshold;
    if (!profile) {
      return "";
    }
    if (
      profile.lastRunAt > 0 &&
      profile.lastRunAt + HOST_STATE_STALE_MS < now
    ) {
      return "";
    }
    selected = String(profile.selectedHost || "").toLowerCase();
    selectedEligible = Boolean(
      FIXED_CDN_CANDIDATES.indexOf(selected) !== -1 &&
      hostEligibleForDescriptor(profile.hosts[selected], descriptor, now)
    );
    if (selectedEligible) {
      selectedScore = stableHostScore(profile.hosts[selected], descriptor);
    }
    keys = Object.keys(profile.hosts || {});
    for (index = 0; index < keys.length; index += 1) {
      hostname = keys[index];
      if (
        FIXED_CDN_CANDIDATES.indexOf(hostname) === -1 ||
        !hostEligibleForDescriptor(profile.hosts[hostname], descriptor, now)
      ) {
        continue;
      }
      score = stableHostScore(profile.hosts[hostname], descriptor);
      if (score > bestScore) {
        bestScore = score;
        bestHost = hostname;
      }
    }
    if (!selectedEligible) {
      return bestHost;
    }
    if (!bestHost || bestHost === selected) {
      return selected;
    }
    threshold = boundedNumber(
      config && config.switchThreshold,
      DEFAULT_SWITCH_THRESHOLD,
      RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
      RUNTIME_OPTION_LIMITS.switchThreshold.maximum
    );
    if (bestScore >= selectedScore * (1 + threshold / 100)) {
      return bestHost;
    }
    return selected;
  }

  function sanitizeProbeSample(value) {
    if (!isObject(value) || Array.isArray(value)) {
      return null;
    }
    return {
      at: boundedNumber(value.at, 0, 0, 9e15),
      elapsedMs: boundedNumber(value.elapsedMs, 0, 0, 60000),
      ok: Boolean(value.ok),
      reason:
        typeof value.reason === "string"
          ? value.reason.slice(0, 48)
          : "",
      status: boundedInteger(value.status, 0, 0, 999),
      throughputKbps: boundedNumber(
        value.throughputKbps,
        0,
        0,
        100000000
      )
    };
  }

  function sanitizeScoreMap(value) {
    var output = {};
    var keys;
    var index;
    var key;
    var score;
    var samples;
    var sample;
    var inner;

    if (!isObject(value) || Array.isArray(value)) {
      return output;
    }
    keys = Object.keys(value).slice(0, 12);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      score = value[key];
      if (
        /^c2_[0-9a-f]{32}$/.test(key) &&
        isObject(score) &&
        !Array.isArray(score)
      ) {
        samples = [];
        if (Array.isArray(score.samples)) {
          for (
            inner = Math.max(
              0,
              score.samples.length - AUTO_SCORE_SAMPLE_LIMIT
            );
            inner < score.samples.length;
            inner += 1
          ) {
            sample = sanitizeProbeSample(score.samples[inner]);
            if (sample) {
              samples.push(sample);
            }
          }
        } else {
          sample = sanitizeProbeSample(score);
          if (sample) {
            samples.push(sample);
          }
        }
        output[key] = {
          metrics: summarizeProbeSamples(samples),
          samples: samples
        };
      }
    }
    return output;
  }

  function sanitizeAutoEntry(value) {
    var entry = {
      candidateCursor: 0,
      candidateId: null,
      candidateSetHash: null,
      expiresAt: 0,
      failureCount: 0,
      lastFailureAt: 0,
      lastUsedAt: 0,
      nextProbeAt: 0,
      objectLength: 0,
      pendingCandidateId: null,
      pendingSince: 0,
      pendingSuccesses: 0,
      sampleCursor: 0,
      scores: {},
      selectedAt: 0,
      successCount: 0,
      validatedAt: 0
    };

    if (!isObject(value) || Array.isArray(value)) {
      return entry;
    }
    if (/^c2_[0-9a-f]{32}$/.test(value.candidateId || "")) {
      entry.candidateId = value.candidateId;
    }
    if (/^s2_[0-9a-f]{32}$/.test(value.candidateSetHash || "")) {
      entry.candidateSetHash = value.candidateSetHash;
    }
    if (/^c2_[0-9a-f]{32}$/.test(value.pendingCandidateId || "")) {
      entry.pendingCandidateId = value.pendingCandidateId;
    }
    entry.candidateCursor = boundedInteger(
      value.candidateCursor,
      0,
      0,
      1000000
    );
    entry.expiresAt = boundedNumber(value.expiresAt, 0, 0, 9e15);
    entry.failureCount = boundedInteger(value.failureCount, 0, 0, 1000000);
    entry.lastFailureAt = boundedNumber(value.lastFailureAt, 0, 0, 9e15);
    entry.lastUsedAt = boundedNumber(value.lastUsedAt, 0, 0, 9e15);
    entry.nextProbeAt = boundedNumber(value.nextProbeAt, 0, 0, 9e15);
    entry.objectLength = boundedNumber(
      value.objectLength,
      0,
      0,
      Number.MAX_SAFE_INTEGER
    );
    entry.pendingSince = boundedNumber(value.pendingSince, 0, 0, 9e15);
    entry.pendingSuccesses = boundedInteger(
      value.pendingSuccesses,
      0,
      0,
      2
    );
    entry.sampleCursor = boundedInteger(
      value.sampleCursor,
      0,
      0,
      1000000
    );
    entry.scores = sanitizeScoreMap(value.scores);
    entry.selectedAt = boundedNumber(value.selectedAt, 0, 0, 9e15);
    entry.successCount = boundedInteger(value.successCount, 0, 0, 1000000);
    entry.validatedAt = boundedNumber(value.validatedAt, 0, 0, 9e15);
    return entry;
  }

  function sanitizeHostHealth(value) {
    var health = {
      failureStreak: 0,
      lastFailureAt: 0,
      lastSuccessAt: 0,
      lastUsedAt: 0,
      metrics: summarizeProbeSamples([]),
      openUntil: 0,
      samples: [],
      slowStreak: 0
    };
    var samples = [];
    var index;
    var sample;

    if (!isObject(value) || Array.isArray(value)) {
      return health;
    }
    if (Array.isArray(value.samples)) {
      for (
        index = Math.max(
          0,
          value.samples.length - AUTO_HOST_SCORE_SAMPLE_LIMIT
        );
        index < value.samples.length;
        index += 1
      ) {
        sample = sanitizeProbeSample(value.samples[index]);
        if (sample) {
          samples.push(sample);
        }
      }
    }
    health.failureStreak = boundedInteger(
      value.failureStreak,
      0,
      0,
      16
    );
    health.lastFailureAt = boundedNumber(
      value.lastFailureAt,
      0,
      0,
      9e15
    );
    health.lastSuccessAt = boundedNumber(
      value.lastSuccessAt,
      0,
      0,
      9e15
    );
    health.lastUsedAt = boundedNumber(value.lastUsedAt, 0, 0, 9e15);
    health.openUntil = boundedNumber(value.openUntil, 0, 0, 9e15);
    health.samples = samples;
    health.metrics = summarizeProbeSamples(samples);
    health.slowStreak = boundedInteger(value.slowStreak, 0, 0, 2);
    return health;
  }

  function sanitizeHostMap(value) {
    var output = {};
    var keys;
    var index;
    var key;
    if (!isObject(value) || Array.isArray(value)) {
      return output;
    }
    keys = Object.keys(value).slice(0, AUTO_HOST_CAPACITY * 2);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (/^c2_[0-9a-f]{32}$/.test(key)) {
        output[key] = sanitizeHostHealth(value[key]);
      }
    }
    return output;
  }

  function loadAutoState(services) {
    var state = createEmptyAutoState();
    var raw;
    var parsed;
    var keys;
    var index;
    var key;
    var lockUntil;
    var lockToken;

    try {
      raw = services.read(AUTO_STATE_KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }
    if (!isObject(parsed) || parsed.version !== 7) {
      return state;
    }

    state.lastProbeAt = boundedNumber(parsed.lastProbeAt, 0, 0, 9e15);
    state.resetToken = normalizeResetToken(parsed.resetToken);
    state.hosts = sanitizeHostMap(parsed.hosts);
    if (isObject(parsed.entries) && !Array.isArray(parsed.entries)) {
      keys = Object.keys(parsed.entries).slice(0, AUTO_CACHE_CAPACITY * 2);
      for (index = 0; index < keys.length; index += 1) {
        key = keys[index];
        if (/^r2_[0-9a-f]{32}$/.test(key)) {
          state.entries[key] = sanitizeAutoEntry(parsed.entries[key]);
        }
      }
    }
    if (isObject(parsed.locks) && !Array.isArray(parsed.locks)) {
      keys = Object.keys(parsed.locks).slice(0, AUTO_CACHE_CAPACITY * 2);
      for (index = 0; index < keys.length; index += 1) {
        key = keys[index];
        lockUntil = boundedNumber(parsed.locks[key], 0, 0, 9e15);
        if (/^r2_[0-9a-f]{32}$/.test(key) && lockUntil > 0) {
          state.locks[key] = lockUntil;
          if (
            isObject(parsed.lockTokens) &&
            !Array.isArray(parsed.lockTokens)
          ) {
            lockToken =
              typeof parsed.lockTokens[key] === "string"
                ? parsed.lockTokens[key]
                : "";
            if (/^l2_[0-9a-f]{32}$/.test(lockToken)) {
              state.lockTokens[key] = lockToken;
            }
          }
        }
      }
    }
    pruneAutoState(state, 0);
    return state;
  }

  function pruneAutoState(state, now) {
    var keys = Object.keys(state.entries);
    var hostKeys = Object.keys(state.hosts || {});
    var lockKeys = Object.keys(state.locks);
    var removeCount;
    var index;

    for (index = 0; index < lockKeys.length; index += 1) {
      if (state.locks[lockKeys[index]] <= now) {
        delete state.locks[lockKeys[index]];
        delete state.lockTokens[lockKeys[index]];
      }
    }
    if (hostKeys.length > AUTO_HOST_CAPACITY) {
      hostKeys.sort(function (left, right) {
        return (
          (state.hosts[left].lastUsedAt || 0) -
          (state.hosts[right].lastUsedAt || 0)
        );
      });
      removeCount = hostKeys.length - AUTO_HOST_CAPACITY;
      for (index = 0; index < removeCount; index += 1) {
        delete state.hosts[hostKeys[index]];
      }
    }
    if (keys.length <= AUTO_CACHE_CAPACITY) {
      return;
    }
    keys.sort(function (left, right) {
      return (
        (state.entries[left].lastUsedAt || 0) -
        (state.entries[right].lastUsedAt || 0)
      );
    });
    removeCount = keys.length - AUTO_CACHE_CAPACITY;
    for (index = 0; index < removeCount; index += 1) {
      delete state.entries[keys[index]];
      delete state.locks[keys[index]];
      delete state.lockTokens[keys[index]];
    }
  }

  function saveAutoState(services, state, now) {
    try {
      pruneAutoState(state, now);
      return Boolean(
        services.write(JSON.stringify(state), AUTO_STATE_KEY)
      );
    } catch (error) {
      return false;
    }
  }

  function resetAutoEntryForDescriptor(entry, descriptor) {
    entry.candidateId = null;
    entry.candidateSetHash = descriptor.candidateSetHash;
    entry.expiresAt = 0;
    entry.failureCount = 0;
    entry.lastFailureAt = 0;
    entry.nextProbeAt = 0;
    entry.objectLength = 0;
    entry.pendingCandidateId = null;
    entry.pendingSince = 0;
    entry.pendingSuccesses = 0;
    entry.sampleCursor = 0;
    entry.scores = {};
    entry.selectedAt = 0;
    entry.successCount = 0;
    entry.validatedAt = 0;
  }

  function ttlForConfig(config) {
    return (
      boundedNumber(
        config && config.intervalHours,
        DEFAULT_AUTO_INTERVAL_HOURS,
        RUNTIME_OPTION_LIMITS.intervalHours.minimum,
        RUNTIME_OPTION_LIMITS.intervalHours.maximum
      ) *
      60 *
      60 *
      1000
    );
  }

  function applyResetToken(services, state, config, now) {
    var token = normalizeResetToken(config && config.resetToken);
    var reset;
    if (!token || state.resetToken === token) {
      return state;
    }
    reset = createEmptyAutoState();
    reset.resetToken = token;
    saveAutoState(services, reset, now);
    return reset;
  }

  function hasStateServices(services) {
    return Boolean(
      services &&
        services.persistent !== false &&
        typeof services.now === "function" &&
        typeof services.read === "function" &&
        typeof services.write === "function"
    );
  }

  function hasSafeServices(services) {
    return Boolean(
      hasStateServices(services) && typeof services.probe === "function"
    );
  }

  function findProbeDescriptor(descriptors, state, now) {
    var index;
    var descriptor;
    var entry;

    if (state.lastProbeAt + AUTO_GLOBAL_PROBE_GAP_MS > now) {
      return null;
    }
    for (index = 0; index < descriptors.length; index += 1) {
      descriptor = descriptors[index];
      if (!descriptor || descriptor.candidates.length < 2) {
        continue;
      }
      if (state.locks[descriptor.resourceKey] > now) {
        continue;
      }
      entry = state.entries[descriptor.resourceKey];
      if (
        !entry ||
        entry.candidateSetHash !== descriptor.candidateSetHash ||
        entry.nextProbeAt <= now ||
        (
          entry.candidateId &&
          (
            isHostCircuitOpen(state, entry.candidateId, now) ||
            entry.validatedAt + AUTO_SELECTED_REVALIDATE_MS <= now
          )
        )
      ) {
        return descriptor;
      }
    }
    return null;
  }

  function hostPreferenceScore(state, candidateId) {
    var health =
      state && state.hosts
        ? state.hosts[candidateId]
        : null;
    var metrics = health && health.metrics;
    if (!metrics || metrics.successCount < 2) {
      return -1;
    }
    return (
      (metrics.medianThroughputKbps || 0) *
      Math.max(0, 1 - (metrics.failureRate || 0)) /
      Math.max(1, 1 + (metrics.jitterMs || 0) / 100)
    );
  }

  function chooseAlternativeCandidate(descriptor, entry, state, now) {
    var backupCandidates = descriptor.candidates.slice(1);
    var eligible = [];
    var preferred = null;
    var preferredScore = -1;
    var score;
    var index;

    if (entry.candidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (
          backupCandidates[index].id === entry.candidateId &&
          !isHostCircuitOpen(state, backupCandidates[index].id, now)
        ) {
          return backupCandidates[index];
        }
      }
    }
    if (entry.pendingCandidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (
          backupCandidates[index].id === entry.pendingCandidateId &&
          !isHostCircuitOpen(state, backupCandidates[index].id, now)
        ) {
          return backupCandidates[index];
        }
      }
    }
    for (index = 0; index < backupCandidates.length; index += 1) {
      if (!isHostCircuitOpen(state, backupCandidates[index].id, now)) {
        eligible.push(backupCandidates[index]);
        score = hostPreferenceScore(state, backupCandidates[index].id);
        if (score > preferredScore) {
          preferredScore = score;
          preferred = backupCandidates[index];
        }
      }
    }
    if (preferred) {
      return preferred;
    }
    return eligible.length > 0
      ? eligible[entry.candidateCursor % eligible.length]
      : null;
  }

  function probeRangeForEntry(entry) {
    var deepSample = Boolean(
      entry &&
      (
        entry.candidateId ||
        (
          entry.pendingCandidateId &&
          entry.pendingSuccesses >= 1
        )
      )
    );
    var sampleEnd = deepSample
      ? AUTO_RANGE_END
      : AUTO_EXPLORE_RANGE_END;
    var sampleLength = sampleEnd + 1;
    var totalLength = boundedInteger(
      entry && entry.objectLength,
      0,
      0,
      Number.MAX_SAFE_INTEGER
    );
    var maximumStart;
    var fraction;
    var start = 0;
    var end;

    if (
      deepSample &&
      totalLength > sampleLength + AUTO_SAMPLE_ALIGNMENT
    ) {
      maximumStart = totalLength - sampleLength;
      fraction = AUTO_INTERIOR_SAMPLE_FRACTIONS[
        (entry.sampleCursor || 0) %
          AUTO_INTERIOR_SAMPLE_FRACTIONS.length
      ];
      start = Math.floor(
        (maximumStart * fraction) / AUTO_SAMPLE_ALIGNMENT
      ) * AUTO_SAMPLE_ALIGNMENT;
      start = Math.max(
        AUTO_SAMPLE_ALIGNMENT,
        Math.min(start, maximumStart)
      );
    }
    end = start + sampleLength - 1;
    if (totalLength > 0) {
      end = Math.min(end, totalLength - 1);
    }
    return {
      end: end,
      phase: deepSample ? "confirm" : "explore",
      start: start
    };
  }

  function candidateWithProbeRange(candidate, range) {
    return {
      id: candidate.id,
      probeRange: range,
      url: candidate.url
    };
  }

  function parseProtoFields(bytes) {
    var fields = [];
    var offset = 0;
    var tagStart;
    var tag;
    var fieldNumber;
    var wireType;
    var valueInfo;
    var lengthInfo;
    var payloadStart;
    var payloadEnd;
    var payload;
    var text;

    if (!bytes || bytes.length === 0) {
      return fields;
    }
    while (offset < bytes.length) {
      tagStart = offset;
      tag = readVarint(bytes, offset);
      if (!tag || !tag.safe || tag.value === 0) {
        return null;
      }
      fieldNumber = Math.floor(tag.value / 8);
      wireType = tag.value % 8;
      if (fieldNumber < 1 || fieldNumber > 536870911) {
        return null;
      }
      offset = tag.end;

      if (wireType === 0) {
        valueInfo = readVarint(bytes, offset);
        if (!valueInfo) {
          return null;
        }
        offset = valueInfo.end;
        fields.push({
          end: offset,
          fieldNumber: fieldNumber,
          rawStart: tagStart,
          tagEnd: tag.end,
          value: valueInfo.safe ? valueInfo.value : null,
          valueSafe: valueInfo.safe,
          wireType: wireType
        });
      } else if (wireType === 1) {
        if (offset + 8 > bytes.length) {
          return null;
        }
        offset += 8;
        fields.push({
          end: offset,
          fieldNumber: fieldNumber,
          rawStart: tagStart,
          tagEnd: tag.end,
          wireType: wireType
        });
      } else if (wireType === 2) {
        lengthInfo = readVarint(bytes, offset);
        if (
          !lengthInfo ||
          !lengthInfo.safe ||
          lengthInfo.value > bytes.length - lengthInfo.end
        ) {
          return null;
        }
        payloadStart = lengthInfo.end;
        payloadEnd = payloadStart + lengthInfo.value;
        payload = bytes.subarray(payloadStart, payloadEnd);
        text =
          payload.length <= MAX_URL_BYTES
            ? printableAsciiBytesToString(payload)
            : null;
        fields.push({
          end: payloadEnd,
          fieldNumber: fieldNumber,
          payload: payload,
          rawStart: tagStart,
          tagEnd: tag.end,
          text: text,
          wireType: wireType
        });
        offset = payloadEnd;
      } else if (wireType === 5) {
        if (offset + 4 > bytes.length) {
          return null;
        }
        offset += 4;
        fields.push({
          end: offset,
          fieldNumber: fieldNumber,
          rawStart: tagStart,
          tagEnd: tag.end,
          wireType: wireType
        });
      } else {
        return null;
      }
    }
    return fields;
  }

  function protoUrlsForField(fields, fieldNumber) {
    var output = [];
    var index;
    for (index = 0; index < fields.length; index += 1) {
      if (
        fields[index].fieldNumber === fieldNumber &&
        fields[index].wireType === 2 &&
        fields[index].text &&
        isVodMediaUrl(fields[index].text)
      ) {
        output.push(fields[index].text);
      }
    }
    return output;
  }

  function firstProtoVarint(fields, fieldNumber) {
    var index;
    for (index = 0; index < fields.length; index += 1) {
      if (
        fields[index].fieldNumber === fieldNumber &&
        fields[index].wireType === 0 &&
        fields[index].valueSafe !== false
      ) {
        return fields[index].value;
      }
    }
    return null;
  }

  function detectProtoMedia(fields, config, state, now) {
    var primaryUrls;
    var backupUrls;
    var primaryField;
    var backupField;
    var kind;
    var representationId;
    var bandwidth = 0;
    var stableMetadata = "";
    var descriptor;

    primaryUrls = protoUrlsForField(fields, 1);
    backupUrls = protoUrlsForField(fields, 2);
    if (primaryUrls.length === 1 && backupUrls.length > 0) {
      primaryField = 1;
      backupField = 2;
      kind = "video";
      bandwidth = firstProtoVarint(fields, 3) || 0;
    } else {
      primaryUrls = protoUrlsForField(fields, 2);
      backupUrls = protoUrlsForField(fields, 3);
      representationId = firstProtoVarint(fields, 1);
      if (
        representationId !== null &&
        primaryUrls.length === 1 &&
        backupUrls.length > 0
      ) {
        primaryField = 2;
        backupField = 3;
        if (representationId >= 30000) {
          kind = "audio";
        } else if (representationId <= 200) {
          kind = "video";
        } else {
          kind = "unknown";
        }
        if (kind === "video" || kind === "audio") {
          stableMetadata = "representation=" + representationId;
        }
        bandwidth = firstProtoVarint(fields, 4) || 0;
      } else {
        primaryUrls = protoUrlsForField(fields, 4);
        backupUrls = protoUrlsForField(fields, 5);
        if (primaryUrls.length === 1 && backupUrls.length > 0) {
          primaryField = 4;
          backupField = 5;
          kind = "segment";
        } else {
          return null;
        }
      }
    }

    descriptor = buildMediaDescriptor(
      "proto",
      kind,
      primaryUrls[0],
      backupUrls,
      stableMetadata,
      bandwidth
    );
    if (!descriptor) {
      return null;
    }
    descriptor.backupField = backupField;
    descriptor.primaryField = primaryField;
    descriptor.resourceKey = descriptorResourceKey(descriptor, config);
    descriptor.selectedUrl = selectedUrlForDescriptor(
      descriptor,
      config,
      state,
      now
    );
    return descriptor;
  }

  function transformDirectProtoField(field, descriptor) {
    var fieldId;
    var selectedId;

    if (
      !descriptor ||
      !descriptor.selectedUrl ||
      field.wireType !== 2 ||
      !field.text
    ) {
      return null;
    }
    fieldId = candidateIdForUrl(field.text);
    selectedId = candidateIdForUrl(descriptor.selectedUrl);
    if (
      field.fieldNumber === descriptor.primaryField &&
      fieldId === descriptor.primaryId
    ) {
      return asciiStringToBytes(descriptor.selectedUrl);
    }
    if (
      field.fieldNumber === descriptor.backupField &&
      fieldId === selectedId
    ) {
      return asciiStringToBytes(descriptor.primaryUrl);
    }
    return null;
  }

  function walkSafeProtoMessage(
    bytes,
    config,
    state,
    now,
    descriptors,
    depth,
    path
  ) {
    var fields;
    var descriptor;
    var chunks = [];
    var changed = 0;
    var index;
    var field;
    var directPayload;
    var nested;
    var nextPayload;
    var nextChanges;
    var childPath;
    var pathState;
    var originalAlreadyBackedUp = false;
    path = Array.isArray(path) ? path : [];

    if (!bytes || depth > MAX_PROTO_DEPTH) {
      return { bytes: bytes, changed: 0, valid: false };
    }
    fields = parseProtoFields(bytes);
    if (!fields) {
      return { bytes: bytes, changed: 0, valid: false };
    }

    pathState = protoPathState(config.grpcAdapter, path);
    if (!pathState.prefix) {
      return { bytes: bytes, changed: 0, valid: true };
    }
    descriptor = pathState.exact
      ? detectProtoMedia(fields, config, state, now)
      : null;
    if (descriptor) {
      descriptors.push(descriptor);
    }
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      nextPayload = null;
      nextChanges = 0;

      if (field.wireType === 2) {
        if (
          descriptor &&
          field.fieldNumber === descriptor.backupField &&
          field.text &&
          candidateIdForUrl(field.text) === descriptor.primaryId
        ) {
          originalAlreadyBackedUp = true;
        }
        directPayload = transformDirectProtoField(field, descriptor);
        if (directPayload) {
          nextPayload = directPayload;
          nextChanges = 1;
        } else if (
          !field.text &&
          depth < MAX_PROTO_DEPTH &&
          field.payload.length > 0
        ) {
          childPath = path.concat([field.fieldNumber]);
          if (!protoPathState(config.grpcAdapter, childPath).prefix) {
            chunks.push(bytes.subarray(field.rawStart, field.end));
            continue;
          }
          nested = walkSafeProtoMessage(
            field.payload,
            config,
            state,
            now,
            descriptors,
            depth + 1,
            childPath
          );
          if (nested.valid && nested.changed > 0) {
            nextPayload = nested.bytes;
            nextChanges = nested.changed;
          }
        }
      }

      if (nextPayload) {
        chunks.push(bytes.subarray(field.rawStart, field.tagEnd));
        chunks.push(encodeVarint(nextPayload.length));
        chunks.push(nextPayload);
        changed += nextChanges;
      } else {
        chunks.push(bytes.subarray(field.rawStart, field.end));
      }
    }
    if (
      descriptor &&
      descriptor.selectedAlias &&
      descriptor.selectedUrl &&
      changed > 0 &&
      !originalAlreadyBackedUp
    ) {
      directPayload = asciiStringToBytes(descriptor.primaryUrl);
      chunks.push(encodeVarint(descriptor.backupField * 8 + 2));
      chunks.push(encodeVarint(directPayload.length));
      chunks.push(directPayload);
      changed += 1;
    }
    return {
      bytes: changed > 0 ? concatBytes(chunks) : bytes,
      changed: changed,
      valid: true
    };
  }

  function prepareSafeGrpc(input, config, state, now) {
    var bytes = toUint8Array(input);
    var descriptors = [];
    var offset = 0;
    var chunks = [];
    var changed = 0;
    var frames = 0;
    var flag;
    var length;
    var frameEnd;
    var transformed;

    if (!bytes) {
      return {
        body: input,
        changed: 0,
        descriptors: descriptors,
        valid: false
      };
    }

    while (offset + 5 <= bytes.length) {
      flag = bytes[offset];
      length = readUint32Be(bytes, offset + 1);
      frameEnd = offset + 5 + length;
      if ((flag !== 0 && flag !== 1) || frameEnd > bytes.length) {
        frames = 0;
        break;
      }
      frames += 1;
      if (flag === 0) {
        transformed = walkSafeProtoMessage(
          bytes.subarray(offset + 5, frameEnd),
          config,
          state,
          now,
          descriptors,
          0,
          []
        );
        if (!transformed.valid) {
          return {
            body: bytes,
            changed: 0,
            descriptors: [],
            valid: false
          };
        }
      } else {
        transformed = {
          bytes: bytes.subarray(offset + 5, frameEnd),
          changed: 0,
          valid: true
        };
      }

      if (transformed.changed > 0) {
        chunks.push(grpcHeader(flag, transformed.bytes.length));
        chunks.push(transformed.bytes);
        changed += transformed.changed;
      } else {
        chunks.push(bytes.subarray(offset, frameEnd));
      }
      offset = frameEnd;
    }

    if (frames > 0 && offset === bytes.length) {
      return {
        body: changed > 0 ? concatBytes(chunks) : bytes,
        changed: changed,
        descriptors: descriptors,
        valid: true
      };
    }
    if (bytes.length >= 5 && (bytes[0] === 0 || bytes[0] === 1)) {
      return {
        body: bytes,
        changed: 0,
        descriptors: [],
        valid: false
      };
    }

    transformed = walkSafeProtoMessage(
      bytes,
      config,
      state,
      now,
      descriptors,
      0,
      []
    );
    return {
      body: transformed.changed > 0 ? transformed.bytes : bytes,
      changed: transformed.changed,
      descriptors: transformed.valid ? descriptors : [],
      valid: transformed.valid
    };
  }

  function findFirstJsonVodUrl(text) {
    var config = parseArgument("cdn=auto");
    var prepared = prepareSafeJson(
      text,
      config,
      createEmptyAutoState(),
      0
    );
    return prepared.descriptors.length > 0
      ? prepared.descriptors[0].primaryUrl
      : null;
  }

  function findFirstGrpcVodUrl(input) {
    var config = parseArgument("cdn=auto");
    config.grpcAdapter = "app-playurl-v1";
    var prepared = prepareSafeGrpc(
      input,
      config,
      createEmptyAutoState(),
      0
    );
    return prepared.descriptors.length > 0
      ? prepared.descriptors[0].primaryUrl
      : null;
  }

  function headerValue(headers, name) {
    var keys;
    var index;
    var value;

    if (!isObject(headers)) {
      return "";
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      if (keys[index].toLowerCase() === name.toLowerCase()) {
        value = headers[keys[index]];
        if (Array.isArray(value)) {
          return value.join(",");
        }
        return value === undefined || value === null ? "" : String(value);
      }
    }
    return "";
  }

  function bodyByteLength(body) {
    var bytes = toUint8Array(body);
    if (bytes) {
      return bytes.length;
    }
    if (typeof body === "string") {
      return body.length;
    }
    return -1;
  }

  function bodyAsciiPrefix(body, maximum) {
    var bytes = toUint8Array(body);
    var output = "";
    var index;
    var code;

    if (typeof body === "string") {
      return body.slice(0, maximum);
    }
    if (!bytes) {
      return "";
    }
    for (index = 0; index < bytes.length && index < maximum; index += 1) {
      code = bytes[index];
      output += code >= 0x20 && code <= 0x7e ? String.fromCharCode(code) : ".";
    }
    return output;
  }

  function probeBodyHash(body) {
    var bytes = toUint8Array(body);
    var hashes = [
      0x811c9dc5,
      0x9e3779b1,
      0x85ebca6b,
      0xc2b2ae35
    ];
    var primes = [0x01000193, 0x27d4eb2d, 0x165667b1, 0x9e3779b1];
    var index;
    var lane;
    var code;
    if (!bytes && typeof body !== "string") {
      return "";
    }
    for (
      index = 0;
      index < (bytes ? bytes.length : body.length);
      index += 1
    ) {
      code = bytes ? bytes[index] : body.charCodeAt(index) & 0xff;
      for (lane = 0; lane < hashes.length; lane += 1) {
        hashes[lane] ^= code + lane * 257;
        hashes[lane] = imul32(hashes[lane], primes[lane]);
        hashes[lane] ^= hashes[lane] >>> 13;
      }
    }
    return (
      "h2_" +
      hex32(hashes[0]) +
      hex32(hashes[1]) +
      hex32(hashes[2]) +
      hex32(hashes[3])
    );
  }

  function probeContentClass(contentType) {
    if (/^video\//.test(contentType)) {
      return "video";
    }
    if (/^audio\//.test(contentType)) {
      return "audio";
    }
    return "binary";
  }

  function validateProbeResponse(result, expectedUrl, expectedRange) {
    var status = Number(
      result && (result.statusCode || result.status)
    );
    var headers = result && result.headers;
    var contentRange = headerValue(headers, "content-range");
    var contentType = headerValue(headers, "content-type").toLowerCase();
    var contentEncoding = headerValue(headers, "content-encoding").toLowerCase();
    var contentLengthHeader = headerValue(headers, "content-length");
    var rangeMatch;
    var rangeStart;
    var rangeEnd;
    var totalLength;
    var requestedStart = boundedInteger(
      expectedRange && expectedRange.start,
      0,
      0,
      Number.MAX_SAFE_INTEGER
    );
    var requestedEnd = boundedInteger(
      expectedRange && expectedRange.end,
      AUTO_RANGE_END,
      requestedStart,
      Number.MAX_SAFE_INTEGER
    );
    var expectedLength;
    var contentLength;
    var actualLength;
    var prefix;
    var finalUrl;

    if (!result || result.error || status !== 206) {
      return { ok: false, reason: "status", status: Number.isFinite(status) ? status : 0 };
    }
    if (
      !(
        /^video\//.test(contentType) ||
        /^audio\//.test(contentType) ||
        /^(?:application\/octet-stream|application\/binary|binary\/octet-stream)(?:;|$)/.test(
          contentType
        )
      )
    ) {
      return { ok: false, reason: "content-type", status: status };
    }
    if (contentEncoding && contentEncoding !== "identity") {
      return { ok: false, reason: "content-encoding", status: status };
    }

    rangeMatch = /^bytes\s+(\d+)-(\d+)\/(\d+)$/i.exec(
      contentRange.trim()
    );
    if (!rangeMatch) {
      return { ok: false, reason: "content-range", status: status };
    }
    rangeStart = Number(rangeMatch[1]);
    rangeEnd = Number(rangeMatch[2]);
    totalLength = Number(rangeMatch[3]);
    if (
      rangeStart !== requestedStart ||
      !Number.isSafeInteger(rangeEnd) ||
      !Number.isSafeInteger(totalLength) ||
      rangeEnd < rangeStart ||
      rangeEnd > requestedEnd ||
      totalLength <= rangeEnd
    ) {
      return { ok: false, reason: "range-size", status: status };
    }
    if (
      rangeEnd < requestedEnd &&
      totalLength !== rangeEnd + 1
    ) {
      return { ok: false, reason: "range-truncated", status: status };
    }
    expectedLength = rangeEnd - rangeStart + 1;
    actualLength = bodyByteLength(result.body);
    if (actualLength !== expectedLength) {
      return { ok: false, reason: "body-size", status: status };
    }
    if (contentLengthHeader !== "") {
      contentLength = Number(contentLengthHeader);
      if (
        !Number.isSafeInteger(contentLength) ||
        contentLength !== expectedLength
      ) {
        return { ok: false, reason: "content-length", status: status };
      }
    }

    prefix = bodyAsciiPrefix(result.body, 96)
      .replace(/^\s+/, "")
      .toLowerCase();
    if (
      /^(?:<|[\{\[])/.test(prefix) ||
      /(?:<!doctype|<html|accessdenied|nosuchkey|invalidargument|error\s*[:=])/.test(
        prefix
      )
    ) {
      return { ok: false, reason: "error-body", status: status };
    }

    finalUrl =
      typeof result.url === "string"
        ? result.url
        : result.response &&
            typeof result.response.url === "string"
          ? result.response.url
          : "";
    if (
      finalUrl &&
      queryFreeCandidateFingerprint(finalUrl) !==
        queryFreeCandidateFingerprint(expectedUrl)
    ) {
      return { ok: false, reason: "redirect", status: status };
    }
    return {
      bodyLength: actualLength,
      contentClass: probeContentClass(contentType),
      ok: true,
      rangeEnd: rangeEnd,
      rangeStart: rangeStart,
      reason: "validated",
      sampleHash: probeBodyHash(result.body),
      status: status,
      totalLength: totalLength
    };
  }

  function normalizeProbeResult(result, candidate) {
    var validation = validateProbeResponse(
      result || {},
      candidate.url,
      candidate.probeRange
    );
    var elapsedMs = boundedNumber(
      result && result.elapsedMs,
      AUTO_PROBE_TIMEOUT_MS,
      1,
      60000
    );
    return {
      bodyLength: validation.bodyLength || 0,
      candidateId: candidate.id,
      contentClass: validation.contentClass || "",
      elapsedMs: Math.round(elapsedMs),
      ok: validation.ok,
      rangeEnd:
        Number.isSafeInteger(validation.rangeEnd)
          ? validation.rangeEnd
          : -1,
      rangeStart:
        Number.isSafeInteger(validation.rangeStart)
          ? validation.rangeStart
          : -1,
      reason: validation.reason,
      sampleHash: validation.sampleHash || "",
      status: validation.status,
      throughputKbps: validation.ok
        ? Math.round(
            ((validation.bodyLength || 0) * 8) / elapsedMs
          )
        : 0,
      totalLength:
        Number.isSafeInteger(validation.totalLength)
          ? validation.totalLength
          : 0
    };
  }

  function probePairEquivalent(primaryResult, alternativeResult) {
    if (!primaryResult.ok || !alternativeResult.ok) {
      return false;
    }
    if (
      primaryResult.rangeStart !== alternativeResult.rangeStart ||
      primaryResult.rangeEnd !== alternativeResult.rangeEnd ||
      primaryResult.totalLength !== alternativeResult.totalLength ||
      primaryResult.bodyLength !== alternativeResult.bodyLength ||
      !primaryResult.sampleHash ||
      primaryResult.sampleHash !== alternativeResult.sampleHash
    ) {
      return false;
    }
    return (
      primaryResult.contentClass === alternativeResult.contentClass ||
      primaryResult.contentClass === "binary" ||
      alternativeResult.contentClass === "binary"
    );
  }

  function recordProbeScore(entry, result, now) {
    var score = entry.scores[result.candidateId];
    var samples =
      score && Array.isArray(score.samples)
        ? score.samples.slice()
        : [];
    samples.push({
      at: now,
      elapsedMs: result.elapsedMs,
      ok: result.ok,
      reason: result.reason,
      status: result.status,
      throughputKbps: result.throughputKbps || 0
    });
    if (samples.length > AUTO_SCORE_SAMPLE_LIMIT) {
      samples = samples.slice(-AUTO_SCORE_SAMPLE_LIMIT);
    }
    entry.scores[result.candidateId] = {
      metrics: summarizeProbeSamples(samples),
      samples: samples
    };
  }

  function hostBackoffMs(failureStreak) {
    return Math.min(
      AUTO_HOST_BACKOFF_MAX_MS,
      AUTO_HOST_BACKOFF_BASE_MS *
        Math.pow(2, Math.max(0, Math.min(3, failureStreak - 1)))
    );
  }

  function recordHostProbe(state, result, descriptor, now, verdict) {
    var health;
    var samples;
    var sufficient;
    if (
      !state ||
      !result ||
      !/^c2_[0-9a-f]{32}$/.test(result.candidateId || "") ||
      verdict === "neutral"
    ) {
      return;
    }
    if (!isObject(state.hosts) || Array.isArray(state.hosts)) {
      state.hosts = {};
    }
    health = sanitizeHostHealth(state.hosts[result.candidateId]);
    samples = health.samples.slice();
    samples.push({
      at: now,
      elapsedMs: result.elapsedMs,
      ok: verdict === "verified",
      reason:
        verdict === "mismatch"
          ? "object-mismatch"
          : result.reason,
      status: result.status,
      throughputKbps: result.throughputKbps || 0
    });
    if (samples.length > AUTO_HOST_SCORE_SAMPLE_LIMIT) {
      samples = samples.slice(-AUTO_HOST_SCORE_SAMPLE_LIMIT);
    }
    health.samples = samples;
    health.metrics = summarizeProbeSamples(samples);
    health.lastUsedAt = now;

    if (verdict !== "verified") {
      health.failureStreak = Math.min(16, health.failureStreak + 1);
      health.slowStreak = 0;
      health.lastFailureAt = now;
      health.openUntil = Math.max(
        health.openUntil,
        now + hostBackoffMs(health.failureStreak)
      );
      state.hosts[result.candidateId] = health;
      return;
    }

    health.lastSuccessAt = now;
    health.failureStreak = 0;
    sufficient =
      (result.throughputKbps || 0) >=
      Math.max(1, descriptor.requiredKbps || 0);
    if (sufficient) {
      health.slowStreak = 0;
      health.openUntil = 0;
    } else {
      health.slowStreak = Math.min(2, health.slowStreak + 1);
      if (health.slowStreak >= 2) {
        health.lastFailureAt = now;
        health.openUntil = Math.max(
          health.openUntil,
          now + AUTO_HOST_BACKOFF_BASE_MS
        );
      }
    }
    state.hosts[result.candidateId] = health;
  }

  function alternativeQualifies(
    primaryResult,
    alternativeResult,
    config,
    entry,
    descriptor
  ) {
    var gain;
    var primaryScore;
    var alternativeScore;
    var primaryElapsed = primaryResult.elapsedMs;
    var alternativeElapsed = alternativeResult.elapsedMs;
    var primaryThroughput = primaryResult.throughputKbps || 0;
    var alternativeThroughput = alternativeResult.throughputKbps || 0;
    var threshold = boundedNumber(
      config && config.switchThreshold,
      DEFAULT_SWITCH_THRESHOLD,
      RUNTIME_OPTION_LIMITS.switchThreshold.minimum,
      RUNTIME_OPTION_LIMITS.switchThreshold.maximum
    );

    if (!alternativeResult.ok) {
      return false;
    }
    if (!primaryResult.ok) {
      return false;
    }
    if (
      descriptor &&
      (alternativeResult.throughputKbps || 0) <
        Math.max(1, descriptor.requiredKbps || 0)
    ) {
      return false;
    }
    primaryScore =
      entry &&
      entry.scores &&
      entry.scores[primaryResult.candidateId];
    alternativeScore =
      entry &&
      entry.scores &&
      entry.scores[alternativeResult.candidateId];
    if (
      primaryScore &&
      primaryScore.metrics &&
      primaryScore.metrics.successCount > 0
    ) {
      primaryElapsed = primaryScore.metrics.medianMs;
      primaryThroughput =
        primaryScore.metrics.medianThroughputKbps ||
        primaryThroughput;
    }
    if (
      alternativeScore &&
      alternativeScore.metrics &&
      alternativeScore.metrics.successCount > 0
    ) {
      alternativeElapsed = alternativeScore.metrics.medianMs;
      alternativeThroughput =
        alternativeScore.metrics.medianThroughputKbps ||
        alternativeThroughput;
      if (
        (
          alternativeScore.metrics.sampleCount >= 3 &&
          alternativeScore.metrics.failureRate > 0.34
        ) ||
        (
          alternativeScore.metrics.successCount >= 2 &&
          alternativeScore.metrics.medianMs > 0 &&
          alternativeScore.metrics.jitterMs /
              alternativeScore.metrics.medianMs >
            0.5
        )
      ) {
        return false;
      }
    }
    gain =
      primaryThroughput > 0 && alternativeThroughput > 0
        ? (
            (alternativeThroughput - primaryThroughput) /
            primaryThroughput
          ) * 100
        : (
            (primaryElapsed - alternativeElapsed) /
            primaryElapsed
          ) * 100;
    return gain >= threshold;
  }

  function clearPendingCandidate(entry) {
    entry.pendingCandidateId = null;
    entry.pendingSince = 0;
    entry.pendingSuccesses = 0;
  }

  function clearSelectedCandidate(entry) {
    entry.candidateId = null;
    entry.expiresAt = 0;
    entry.selectedAt = 0;
    entry.validatedAt = 0;
  }

  function applyHostResetToken(services, state, config, now) {
    var token = normalizeResetToken(config && config.resetToken);
    var reset;
    if (!token || state.resetToken === token) {
      return state;
    }
    reset = createEmptyHostAutoState();
    reset.resetToken = token;
    if (hasStateServices(services)) {
      saveHostAutoState(services, reset, now);
    }
    return reset;
  }

  function processHostAutoResponse(
    input,
    binary,
    config,
    services,
    callback
  ) {
    var original = input;
    var now =
      services && typeof services.now === "function"
        ? services.now()
        : Date.now();
    var state = hasStateServices(services)
      ? loadHostAutoState(services)
      : createEmptyHostAutoState();
    var hotConfig = {};
    var keys;
    var index;
    var prepared;
    var reason = "server-primary";
    var families = {};
    var candidateCount = 0;
    var routesStored = 0;

    if (typeof callback !== "function") {
      return;
    }
    if (!config || !config.valid || !config.auto) {
      callback({
        body: original,
        candidateCount: 0,
        candidateFamilies: "none",
        changed: 0,
        descriptors: 0,
        probed: false,
        probeCount: 0,
        probeSummary: "none",
        reason: "invalid-config",
        routesStored: 0,
        scriptElapsedMs: 0,
        valid: Boolean(config && config.valid)
      });
      return;
    }
    state = applyHostResetToken(services, state, config, now);
    keys = Object.keys(config);
    for (index = 0; index < keys.length; index += 1) {
      hotConfig[keys[index]] = config[keys[index]];
    }
    hotConfig.hostAutoState = state;
    hotConfig.networkProfile = resolveRuntimeNetworkProfile(
      config.networkProfile,
      services
    );
    prepared = binary
      ? prepareSafeGrpc(input, hotConfig, createEmptyAutoState(), now)
      : prepareSafeJson(
          typeof input === "string" ? input : "",
          hotConfig,
          createEmptyAutoState(),
          now
        );
    if (!prepared.valid) {
      callback({
        body: original,
        candidateCount: 0,
        candidateFamilies: "none",
        changed: 0,
        descriptors: 0,
        probed: false,
        probeCount: 0,
        probeSummary: "none",
        reason: "unsupported-response",
        routesStored: 0,
        scriptElapsedMs: Math.max(0, (
          services && typeof services.now === "function"
            ? services.now()
            : now
        ) - now),
        valid: false
      });
      return;
    }
    for (index = 0; index < prepared.descriptors.length; index += 1) {
      candidateCount += prepared.descriptors[index].candidates.length;
      families[prepared.descriptors[index].family] = true;
      if (/^host-state/.test(prepared.descriptors[index].selectionSource || "")) {
        reason = "host-auto-selected";
      } else if (
        reason !== "host-auto-selected" &&
        prepared.descriptors[index].selectionSource === "cold-akamai"
      ) {
        reason = "cold-akamai";
      }
    }
    routesStored = persistPreparedMediaRoutes(
      services,
      prepared.descriptors,
      hotConfig,
      now
    );
    callback({
      body: prepared.body,
      candidateCount: candidateCount,
      candidateFamilies: Object.keys(families).join(",") || "none",
      changed: prepared.changed,
      descriptors: prepared.descriptors.length,
      probed: false,
      probeCount: 0,
      probeSummary: "none",
      reason: reason,
      routesStored: routesStored,
      scriptElapsedMs: Math.max(0, (
        services && typeof services.now === "function"
          ? services.now()
          : now
      ) - now),
      valid: true
    });
  }

  function nextSelectedProbeAt(now, expiresAt) {
    return Math.min(
      expiresAt,
      now + AUTO_SELECTED_REVALIDATE_MS
    );
  }

  function updateEntryAfterProbe(
    state,
    entry,
    descriptor,
    primaryResult,
    alternativeResult,
    config,
    now
  ) {
    var equivalent = probePairEquivalent(
      primaryResult,
      alternativeResult
    );
    var qualifies;
    var wasSelected =
      entry.candidateId === alternativeResult.candidateId;
    var expiredSelection =
      wasSelected && entry.expiresAt <= now;
    var reason;

    entry.lastUsedAt = now;
    recordProbeScore(entry, primaryResult, now);
    recordProbeScore(entry, alternativeResult, now);
    recordHostProbe(
      state,
      alternativeResult,
      descriptor,
      now,
      !alternativeResult.ok
        ? "failure"
        : (
            !primaryResult.ok
              ? "neutral"
              : (equivalent ? "verified" : "mismatch")
          )
    );
    if (equivalent) {
      entry.objectLength = primaryResult.totalLength;
      if (
        primaryResult.rangeStart > 0 ||
        primaryResult.bodyLength > AUTO_EXPLORE_RANGE_END + 1
      ) {
        entry.sampleCursor += 1;
      }
    }
    qualifies =
      equivalent &&
      alternativeQualifies(
        primaryResult,
        alternativeResult,
        config,
        entry,
        descriptor
      );

    if (!alternativeResult.ok) {
      if (wasSelected) {
        clearSelectedCandidate(entry);
      }
      clearPendingCandidate(entry);
      entry.failureCount += 1;
      entry.lastFailureAt = now;
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_RETRY_MS;
      return wasSelected ? "selected-failed" : "alternative-failed";
    }

    if (!primaryResult.ok) {
      clearPendingCandidate(entry);
      entry.failureCount += 1;
      entry.lastFailureAt = now;
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_RETRY_MS;
      return "primary-failed";
    }

    if (!equivalent) {
      if (wasSelected) {
        clearSelectedCandidate(entry);
      }
      clearPendingCandidate(entry);
      entry.failureCount += 1;
      entry.lastFailureAt = now;
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_RETRY_MS;
      return primaryResult.ok && alternativeResult.ok
        ? "object-mismatch"
        : "pair-unverified";
    }

    if (wasSelected) {
      entry.successCount += 1;
      entry.failureCount = 0;
      entry.validatedAt = now;
      if (!expiredSelection) {
        entry.nextProbeAt = nextSelectedProbeAt(
          now,
          entry.expiresAt
        );
        return "selected-validated";
      }
      if (qualifies) {
        entry.selectedAt = now;
        entry.expiresAt = now + ttlForConfig(config);
        entry.nextProbeAt = nextSelectedProbeAt(
          now,
          entry.expiresAt
        );
        return "selected-renewed";
      }

      clearSelectedCandidate(entry);
      clearPendingCandidate(entry);
      entry.candidateCursor += 1;
      entry.nextProbeAt = now + AUTO_EXPLORE_DELAY_MS;
      return "selected-no-longer-preferred";
    }

    if (qualifies) {
      if (
        entry.pendingCandidateId === alternativeResult.candidateId &&
        entry.pendingSuccesses >= 1 &&
        now - entry.pendingSince >= AUTO_CONFIRM_DELAY_MS
      ) {
        entry.pendingSuccesses = 2;
        entry.candidateId = alternativeResult.candidateId;
        entry.selectedAt = now;
        entry.validatedAt = now;
        entry.expiresAt = now + ttlForConfig(config);
        entry.successCount += 1;
        entry.failureCount = 0;
        clearPendingCandidate(entry);
        entry.nextProbeAt = nextSelectedProbeAt(
          now,
          entry.expiresAt
        );
        return "alternative-confirmed";
      }

      if (entry.pendingCandidateId !== alternativeResult.candidateId) {
        entry.pendingCandidateId = alternativeResult.candidateId;
        entry.pendingSince = now;
        entry.pendingSuccesses = 1;
      }
      entry.nextProbeAt = entry.pendingSince + AUTO_CONFIRM_DELAY_MS;
      return "alternative-pending";
    }

    reason = alternativeResult.ok
      ? "alternative-not-faster"
      : "alternative-failed";
    if (!alternativeResult.ok) {
      entry.failureCount += 1;
      entry.lastFailureAt = now;
    }
    clearPendingCandidate(entry);
    entry.candidateCursor += 1;
    entry.nextProbeAt =
      now +
      (alternativeResult.ok ? AUTO_EXPLORE_DELAY_MS : AUTO_RETRY_MS);
    return reason;
  }

  function processSafeAutoResponse(
    input,
    binary,
    config,
    services,
    callback
  ) {
    var original = input;
    var now;
    var state;
    var prepared;
    var descriptor;
    var entry;
    var probeRange;
    var primaryCandidate;
    var alternativeCandidate;
    var results = {};
    var finished = false;
    var callbackDelivered = false;
    var claimedLockUntil = 0;
    var claimedLockToken = "";

    if (
      config &&
      config.auto &&
      config.valid &&
      config.probeMode !== "blocking"
    ) {
      processHostAutoResponse(
        input,
        binary,
        config,
        services,
        callback
      );
      return;
    }

    function deliver(result) {
      var descriptors;
      var families = {};
      var candidateCount = 0;
      var index;
      var candidate;
      var probeRows = [];
      if (callbackDelivered) {
        return;
      }
      descriptors =
        prepared && Array.isArray(prepared.descriptors)
          ? prepared.descriptors
          : [];
      for (index = 0; index < descriptors.length; index += 1) {
        candidateCount += Array.isArray(descriptors[index].candidates)
          ? descriptors[index].candidates.length
          : 0;
        if (descriptors[index].family) {
          families[descriptors[index].family] = true;
        }
      }
      [primaryCandidate, alternativeCandidate].forEach(function (item, lane) {
        candidate = item && results[item.id];
        if (candidate) {
          probeRows.push(
            String(lane) +
              ":" +
              String(candidate.status || 0) +
              "/" +
              String(candidate.elapsedMs || 0) +
              "ms/" +
              String(candidate.throughputKbps || 0) +
              "kbps/" +
              String((item.probeRange && item.probeRange.phase) || "unknown") +
              ":" +
              String((item.probeRange && item.probeRange.start) || 0) +
              "-" +
              String((item.probeRange && item.probeRange.end) || 0) +
              "/" +
              String(candidate.reason || "unknown")
          );
        }
      });
      result.candidateCount = candidateCount;
      result.candidateFamilies = Object.keys(families).join(",") || "none";
      result.probeSummary =
        probeRows.join(";") ||
        ((result.probeCount || 0) > 0 ? "started" : "none");
      callbackDelivered = true;
      callback(result);
    }

    if (typeof callback !== "function") {
      return;
    }
    if (!config || !config.valid || !config.auto || !hasStateServices(services)) {
      deliver({
        body: original,
        changed: 0,
        descriptors: 0,
        probed: false,
        reason: "services-unavailable",
        valid: Boolean(config && config.valid)
      });
      return;
    }

    now = services.now();
    state = applyResetToken(
      services,
      loadAutoState(services),
      config,
      now
    );
    prepared = binary
      ? prepareSafeGrpc(input, config, state, now)
      : prepareSafeJson(
          typeof input === "string" ? input : "",
          config,
          state,
          now
        );
    if (!prepared.valid) {
      deliver({
        body: original,
        changed: 0,
        descriptors: 0,
        probed: false,
        reason: "unsupported-response",
        valid: false
      });
      return;
    }

    /*
     * Cache application is always independent from probing. "off" is a
     * deterministic cache-only mode, while a runtime without $httpClient can
     * still reuse an already verified selection.
     */
    if (config.probeMode === "off" || !hasSafeServices(services)) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason:
          config.probeMode === "off"
            ? "probe-disabled"
            : "probe-unavailable",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }

    /*
     * Re-read immediately before claiming a probe. Response parsing can take
     * time, and another script invocation may have claimed the global slot or
     * this resource while the current body was being inspected.
     */
    state = applyResetToken(
      services,
      loadAutoState(services),
      config,
      services.now()
    );
    descriptor = findProbeDescriptor(prepared.descriptors, state, now);
    if (!descriptor) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason: "cache-or-throttle",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }

    entry = state.entries[descriptor.resourceKey];
    if (!entry) {
      entry = sanitizeAutoEntry(null);
      state.entries[descriptor.resourceKey] = entry;
    }
    if (entry.candidateSetHash !== descriptor.candidateSetHash) {
      resetAutoEntryForDescriptor(entry, descriptor);
    }
    entry.lastUsedAt = now;
    alternativeCandidate = chooseAlternativeCandidate(
      descriptor,
      entry,
      state,
      now
    );
    if (!alternativeCandidate) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason: "no-alternative",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }
    probeRange = probeRangeForEntry(entry);
    primaryCandidate = candidateWithProbeRange(
      descriptor.candidates[0],
      probeRange
    );
    alternativeCandidate = candidateWithProbeRange(
      alternativeCandidate,
      probeRange
    );

    claimedLockUntil = now + AUTO_LOCK_MS;
    claimedLockToken = stableHash(
      "l",
      descriptor.resourceKey +
        "|" +
        now +
        "|" +
        String(Math.random())
    );
    state.locks[descriptor.resourceKey] = claimedLockUntil;
    state.lockTokens[descriptor.resourceKey] = claimedLockToken;
    state.lastProbeAt = now;
    if (!saveAutoState(services, state, now)) {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        probeCount: 0,
        reason: "state-write-failed",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
      return;
    }

    function finishIfComplete() {
      var latestState;
      var latestEntry;
      var completedAt;
      var updateReason;

      if (
        finished ||
        !results[primaryCandidate.id] ||
        !results[alternativeCandidate.id]
      ) {
        return;
      }
      finished = true;
      completedAt = services.now();
      latestState = loadAutoState(services);
      if (
        latestState.locks[descriptor.resourceKey] !== claimedLockUntil ||
        latestState.lockTokens[descriptor.resourceKey] !== claimedLockToken
      ) {
        if (config.probeMode === "blocking") {
          deliver({
            body: prepared.body,
            changed: prepared.changed,
            descriptors: prepared.descriptors.length,
            probed: true,
            probeCount: 2,
            reason: "stale-probe",
            scriptElapsedMs: Math.max(0, completedAt - now),
            valid: true
          });
        }
        return;
      }
      latestEntry = latestState.entries[descriptor.resourceKey];
      if (!latestEntry) {
        latestEntry = sanitizeAutoEntry(null);
        latestState.entries[descriptor.resourceKey] = latestEntry;
      }
      if (latestEntry.candidateSetHash !== descriptor.candidateSetHash) {
        resetAutoEntryForDescriptor(latestEntry, descriptor);
      }
      updateReason = updateEntryAfterProbe(
        latestState,
        latestEntry,
        descriptor,
        results[primaryCandidate.id],
        results[alternativeCandidate.id],
        config,
        completedAt
      );
      if (latestState.locks[descriptor.resourceKey] === claimedLockUntil) {
        delete latestState.locks[descriptor.resourceKey];
        delete latestState.lockTokens[descriptor.resourceKey];
      }
      saveAutoState(services, latestState, completedAt);
      if (config.probeMode === "blocking") {
        deliver({
          body: prepared.body,
          changed: prepared.changed,
          descriptors: prepared.descriptors.length,
          probed: true,
          probeCount: 2,
          reason: updateReason,
          scriptElapsedMs: Math.max(0, completedAt - now),
          valid: true
        });
      }
    }

    function receive(candidate, result) {
      if (finished || results[candidate.id]) {
        return;
      }
      results[candidate.id] = normalizeProbeResult(result, candidate);
      finishIfComplete();
    }

    [primaryCandidate, alternativeCandidate].forEach(function (candidate) {
      try {
        services.probe(
          candidate,
          AUTO_PROBE_TIMEOUT_MS,
          function (result) {
            receive(candidate, result);
          }
        );
      } catch (error) {
        receive(candidate, {
          body: "",
          elapsedMs: AUTO_PROBE_TIMEOUT_MS,
          error: true,
          headers: {},
          status: 0
        });
      }
    });

    /*
     * The default path never waits for Range probes. Shadowrocket may keep the
     * best-effort callbacks alive after $done(); if it does not, the lock
     * expires and no unverified state is ever applied. Users can explicitly
     * opt into "blocking" for a deterministic learning run.
     */
    if (config.probeMode !== "blocking") {
      deliver({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: true,
        probeCount: 2,
        reason: "probe-started-nonblocking",
        scriptElapsedMs: Math.max(0, services.now() - now),
        valid: true
      });
    }
  }

  function createShadowrocketServices() {
    var storeAvailable =
      typeof $persistentStore !== "undefined" &&
      $persistentStore &&
      typeof $persistentStore.read === "function" &&
      typeof $persistentStore.write === "function";

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
      now: function () {
        return Date.now();
      },
      persistent: Boolean(storeAvailable),
      read: function (key) {
        return storeAvailable ? $persistentStore.read(key) : null;
      },
      write: function (value, key) {
        return storeAvailable
          ? $persistentStore.write(value, key)
          : false;
      },
      probe: function (candidate, timeoutMs, callback) {
        var client =
          typeof $httpClient !== "undefined" ? $httpClient : null;
        var started = Date.now();
        var completed = false;
        var timer = null;
        var rangeStart = boundedInteger(
          candidate && candidate.probeRange && candidate.probeRange.start,
          0,
          0,
          Number.MAX_SAFE_INTEGER
        );
        var rangeEnd = boundedInteger(
          candidate && candidate.probeRange && candidate.probeRange.end,
          AUTO_RANGE_END,
          rangeStart,
          Number.MAX_SAFE_INTEGER
        );
        var request = {
          "auto-redirect": false,
          "binary-mode": true,
          headers: {
            "Accept-Encoding": "identity",
            Range: "bytes=" + rangeStart + "-" + rangeEnd,
            Referer: "https://www.bilibili.com/",
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)"
          },
          timeout: Math.max(1, Math.ceil(timeoutMs / 1000)),
          url: candidate.url
        };

        function complete(error, response, data) {
          var status;
          if (completed) {
            return;
          }
          completed = true;
          if (timer !== null && typeof clearTimeout === "function") {
            clearTimeout(timer);
          }
          status = Number(
            response && (response.statusCode || response.status)
          );
          callback({
            body:
              data !== undefined
                ? data
                : response && response.body !== undefined
                  ? response.body
                  : "",
            elapsedMs: Math.max(1, Date.now() - started),
            error: Boolean(error),
            headers: (response && response.headers) || {},
            status: Number.isFinite(status) ? status : 0,
            url:
              response && typeof response.url === "string"
                ? response.url
                : ""
          });
        }

        if (!client || typeof client.get !== "function") {
          complete(true, null, "");
          return;
        }
        if (typeof setTimeout === "function") {
          timer = setTimeout(function () {
            complete(true, null, "");
          }, timeoutMs + 250);
        }
        try {
          client.get(request, complete);
        } catch (error) {
          complete(true, null, "");
        }
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

  function finishManualShadowrocketResponse(config, body, binary) {
    var result;

    try {
      if (!config.cdnHost) {
        if (config.debug) {
          safeLog("fixed CDN rewrite disabled");
        }
        $done({});
        return;
      }

      result = binary
        ? transformGrpcBody(body, config)
        : transformJsonText(
            typeof body === "string" ? body : "",
            config
          );
      if (result.valid && result.changed > 0) {
        if (config.debug) {
          safeLog(
            "fixed mode rewrote " +
              result.changed +
              (binary ? " Protobuf" : " JSON") +
              " URL(s)"
          );
        }
        $done({ body: result.body });
      } else {
        if (config.debug && !result.valid) {
          safeLog("unsupported response; left unchanged");
        }
        $done({});
      }
    } catch (error) {
      safeLog(
        "fixed mode error; response left unchanged: " +
          (error && error.message ? error.message : String(error))
      );
      $done({});
    }
  }

  function finishAutoShadowrocketResponse(
    config,
    body,
    binary,
    services
  ) {
    processSafeAutoResponse(
      body,
      binary,
      config,
      services,
      function (result) {
        try {
          if (config.debug) {
            safeLog(
              "safe auto: " +
                result.reason +
                ", descriptors=" +
                result.descriptors +
                ", changed=" +
                result.changed +
                ", probes=" +
                (result.probeCount || 0) +
                ", candidates=" +
                (result.candidateCount || 0) +
                ", families=" +
                (result.candidateFamilies || "none") +
                ", routes=" +
                (result.routesStored || 0) +
                ", probe_summary=" +
                (result.probeSummary || "none") +
                ", elapsed_ms=" +
                (result.scriptElapsedMs || 0)
            );
          }
          if (result.valid && result.changed > 0) {
            $done({ body: result.body });
          } else {
            $done({});
          }
        } catch (error) {
          safeLog(
            "safe auto callback error; response left unchanged: " +
              (error && error.message
                ? error.message
                : String(error))
          );
          $done({});
        }
      }
    );
  }

  function processShadowrocketBody(config, body, binary) {
    if (!config.auto) {
      finishManualShadowrocketResponse(config, body, binary);
      return;
    }
    finishAutoShadowrocketResponse(
      config,
      body,
      binary,
      createShadowrocketServices()
    );
  }

  function runShadowrocket() {
    var config;
    var requestUrl;
    var body;
    var binary;
    var grpcResponse;
    var grpcEncoding;

    try {
      config = parseArgument(
        typeof $argument === "string" ? $argument : ""
      );
      if (!config.valid) {
        safeLog("invalid CDN argument; response left unchanged");
        $done({});
        return;
      }
      if (!config.auto && !config.cdnHost) {
        if (config.debug) {
          safeLog("CDN rewrite disabled");
        }
        $done({});
        return;
      }

      requestUrl =
        typeof $request !== "undefined" && $request && $request.url
          ? String($request.url)
          : "";
      if (
        typeof $request !== "undefined" &&
        $request &&
        headerValue($request.headers, "x-bilicdn-background") === "1"
      ) {
        $done({});
        return;
      }
      config.grpcAdapter = classifyGrpcAdapter(requestUrl);
      grpcResponse = Boolean(config.grpcAdapter);
      body =
        typeof $response !== "undefined" && $response
          ? (
              grpcResponse &&
              $response.bodyBytes !== undefined &&
              $response.bodyBytes !== null
                ? $response.bodyBytes
                : $response.body
            )
          : null;
      binary = isByteView(body) || grpcResponse;

      if (binary && hasCompressedGrpcFrame(body)) {
        grpcEncoding = grpcEncodingFromHeaders(
          typeof $response !== "undefined" && $response
            ? $response.headers
            : null
        );
        decompressGrpcFrames(body, grpcEncoding).then(function (decoded) {
          if (!decoded.valid) {
            if (config.debug) {
              safeLog(
                "compressed gRPC response could not be decoded; reason=" +
                  decoded.reason
              );
            }
            $done({});
            return;
          }
          processShadowrocketBody(config, decoded.body, true);
        }, function (error) {
          if (config.debug) {
            safeLog(
              "compressed gRPC error; response left unchanged: " +
                (
                  error && error.message
                    ? error.message
                    : String(error)
                )
            );
          }
          $done({});
        });
        return;
      }
      processShadowrocketBody(config, body, binary);
    } catch (error) {
      safeLog(
        "error; response left unchanged: " +
          (error && error.message ? error.message : String(error))
      );
      $done({});
    }
  }

  var api = {
    AUTO_CACHE_CAPACITY: AUTO_CACHE_CAPACITY,
    AUTO_EXPLORE_RANGE_END: AUTO_EXPLORE_RANGE_END,
    AUTO_HOST_BACKOFF_BASE_MS: AUTO_HOST_BACKOFF_BASE_MS,
    AUTO_HOST_CAPACITY: AUTO_HOST_CAPACITY,
    FIXED_CDN_CANDIDATES: FIXED_CDN_CANDIDATES,
    AUTO_CONFIRM_DELAY_MS: AUTO_CONFIRM_DELAY_MS,
    AUTO_GLOBAL_PROBE_GAP_MS: AUTO_GLOBAL_PROBE_GAP_MS,
    AUTO_RANGE_END: AUTO_RANGE_END,
    AUTO_SELECTED_REVALIDATE_MS: AUTO_SELECTED_REVALIDATE_MS,
    AUTO_STATE_KEY: AUTO_STATE_KEY,
    HOST_ALIAS_FRESH_MS: HOST_ALIAS_FRESH_MS,
    HOST_AUTO_STATE_KEY: HOST_AUTO_STATE_KEY,
    HOST_AUTO_STATE_VERSION: HOST_AUTO_STATE_VERSION,
    HOST_STATE_STALE_MS: HOST_STATE_STALE_MS,
    MEDIA_ROUTE_CAPACITY: MEDIA_ROUTE_CAPACITY,
    MEDIA_ROUTE_EXPIRY_SAFETY_MS: MEDIA_ROUTE_EXPIRY_SAFETY_MS,
    MEDIA_ROUTE_MAX_TTL_MS: MEDIA_ROUTE_MAX_TTL_MS,
    MEDIA_ROUTE_STATE_KEY: MEDIA_ROUTE_STATE_KEY,
    DEFAULT_CDN: DEFAULT_CDN,
    RUNTIME_OPTION_LIMITS: RUNTIME_OPTION_LIMITS,
    asciiBytesToString: asciiBytesToString,
    asciiStringToBytes: asciiStringToBytes,
    alternativeQualifies: alternativeQualifies,
    buildMediaDescriptor: buildMediaDescriptor,
    candidateFamilyForUrl: candidateFamilyForUrl,
    candidateIdForUrl: candidateIdForUrl,
    concatBytes: concatBytes,
    createEmptyAutoState: createEmptyAutoState,
    createEmptyHostAutoState: createEmptyHostAutoState,
    createEmptyMediaRouteState: createEmptyMediaRouteState,
    createShadowrocketServices: createShadowrocketServices,
    descriptorResourceKey: descriptorResourceKey,
    decompressGrpcFrames: decompressGrpcFrames,
    encodeVarint: encodeVarint,
    findFirstGrpcVodUrl: findFirstGrpcVodUrl,
    findFirstJsonVodUrl: findFirstJsonVodUrl,
    isBilibiliMediaHost: isBilibiliMediaHost,
    isAllowedFixedCdnHost: isAllowedFixedCdnHost,
    isVodMediaUrl: isVodMediaUrl,
    hasCompressedGrpcFrame: hasCompressedGrpcFrame,
    loadAutoState: loadAutoState,
    loadHostAutoState: loadHostAutoState,
    loadMediaRouteState: loadMediaRouteState,
    mediaBucketForDescriptor: mediaBucketForDescriptor,
    mediaRouteKeyForUrl: mediaRouteKeyForUrl,
    normalizeCdnHost: normalizeCdnHost,
    normalizeNetworkProfile: normalizeNetworkProfile,
    parseArgument: parseArgument,
    prepareSafeGrpc: prepareSafeGrpc,
    prepareSafeJson: prepareSafeJson,
    probeRangeForEntry: probeRangeForEntry,
    probeBodyHash: probeBodyHash,
    processSafeAutoResponse: processSafeAutoResponse,
    persistPreparedMediaRoutes: persistPreparedMediaRoutes,
    recordHostSample: recordHostSample,
    queryFreeCandidateFingerprint: queryFreeCandidateFingerprint,
    readVarint: readVarint,
    requiredThroughputKbps: requiredThroughputKbps,
    resolveRuntimeNetworkProfile: resolveRuntimeNetworkProfile,
    rewriteVodUrl: rewriteVodUrl,
    replaceVodHostname: replaceVodHostname,
    runShadowrocket: runShadowrocket,
    stableHash: stableHash,
    sanitizeHostAutoState: sanitizeHostAutoState,
    sanitizeMediaRouteState: sanitizeMediaRouteState,
    saveHostAutoState: saveHostAutoState,
    selectStableHost: selectStableHost,
    transformGrpcBody: transformGrpcBody,
    transformJsonText: transformJsonText,
    transformProtoMessage: transformProtoMessage,
    updateEntryAfterProbe: updateEntryAfterProbe,
    validateProbeResponse: validateProbeResponse
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliCdnSwitcher = api;
  }

  if (
    typeof $done === "function" &&
    typeof $response !== "undefined" &&
    root.__BILIFLOW_COMBINED__ !== true
  ) {
    runShadowrocket();
  }
})(this);

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
