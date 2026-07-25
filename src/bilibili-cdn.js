/*
 * Bilibili CDN Switcher v2 for Shadowrocket
 *
 * Default auto mode is deliberately conservative:
 * - it only considers the primary and backup URLs returned for one media item;
 * - it validates a small byte range before persisting a choice;
 * - it isolates choices by resource, representation, codec, media kind,
 *   candidate set, and an explicit network profile;
 * - it never stores signed query strings or rewrites media response bodies.
 *
 * Fixed-host mode remains available as an explicit compatibility option.
 * Live URLs are never rewritten because their signatures are bound to
 * server-selected CDN metadata.
 */
(function (root) {
  "use strict";

  var NAME = "BiliCDN";
  var DEFAULT_CDN = "upos-sz-mirrorali.bilivideo.com";
  var AUTO_STATE_KEY = "BiliCDN.safeAuto.v2";
  var DEFAULT_AUTO_INTERVAL_HOURS = 12;
  var DEFAULT_SWITCH_THRESHOLD = 20;
  var AUTO_CACHE_CAPACITY = 64;
  var AUTO_CONFIRM_DELAY_MS = 10 * 60 * 1000;
  var AUTO_EXPLORE_DELAY_MS = 30 * 60 * 1000;
  var AUTO_GLOBAL_PROBE_GAP_MS = 2 * 60 * 1000;
  var AUTO_LOCK_MS = 10 * 1000;
  var AUTO_PROBE_TIMEOUT_MS = 2200;
  var AUTO_RANGE_END = 16383;
  var AUTO_RETRY_MS = 30 * 60 * 1000;
  var MAX_PROTO_DEPTH = 32;
  var MAX_URL_BYTES = 65536;
  var MAX_JSON_DEPTH = 64;

  /*
   * This list is documentation and fixed-mode input guidance only. Safe auto
   * mode never injects these hosts into a server-provided candidate set.
   */
  var AUTO_CDN_CANDIDATES = [
    "upos-sz-mirrorali.bilivideo.com",
    "upos-sz-mirrorcos.bilivideo.com",
    "upos-sz-mirrorhw.bilivideo.com",
    "upos-sz-mirroraliov.bilivideo.com",
    "upos-sz-mirrorcosov.bilivideo.com",
    "upos-sz-mirrorhwov.bilivideo.com",
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
    "bilivideo.com",
    "bilivideo.cn",
    "bilivideo.net",
    "bilibilivideo.com",
    "ourdvsss.com",
    "ksyungslb.com",
    "00cdn.com"
  ];
  var JSON_METADATA_KEYS = [
    "id",
    "quality",
    "codecid",
    "codec",
    "codecs",
    "mimeType",
    "mime_type",
    "bandwidth",
    "audio_id",
    "frame_rate",
    "frameRate",
    "width",
    "height",
    "size",
    "md5"
  ];

  function isObject(value) {
    return value !== null && typeof value === "object";
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
    return isValidHostname(host) ? host : null;
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

  function parseArgument(argument) {
    var config = {
      auto: true,
      cdnHost: null,
      debug: false,
      intervalHours: DEFAULT_AUTO_INTERVAL_HOURS,
      networkProfile: "auto",
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
      config.intervalHours = boundedNumber(
        parsed.intervalHours,
        DEFAULT_AUTO_INTERVAL_HOURS,
        6,
        72
      );
      config.switchThreshold = boundedNumber(
        parsed.switchThreshold,
        DEFAULT_SWITCH_THRESHOLD,
        10,
        80
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
      } else if (key === "intervalhours" || key === "interval") {
        config.intervalHours = boundedNumber(
          value,
          DEFAULT_AUTO_INTERVAL_HOURS,
          6,
          72
        );
      } else if (key === "switchthreshold" || key === "threshold") {
        config.switchThreshold = boundedNumber(
          value,
          DEFAULT_SWITCH_THRESHOLD,
          10,
          80
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

    rewriteJsonValue(parsed, config, state, 0);
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

    while (position < bytes.length && position - offset < 10) {
      current = bytes[position];
      value += (current & 0x7f) * Math.pow(2, shift);
      position += 1;
      if ((current & 0x80) === 0) {
        if (!Number.isSafeInteger(value)) {
          return null;
        }
        return { end: position, value: value };
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
      if (!tag || tag.value === 0) {
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
        if (!lengthInfo || lengthInfo.value > bytes.length - lengthInfo.end) {
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
          ? transformProtoMessage(payload, config, 0)
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

    raw = transformProtoMessage(bytes, config, 0);
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
    var fingerprint = queryFreeCandidateFingerprint(url);
    return fingerprint ? stableHash("c", fingerprint) : null;
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

  function buildMediaDescriptor(format, kind, primaryUrl, backupUrls, metadata) {
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
    resourceMaterial = [
      format,
      kind || "unknown",
      primaryFamily,
      primaryParsed.path,
      metadata || "",
      candidateSetHash
    ].join("\u0000");

    return {
      candidateById: candidateById,
      candidateIds: candidateIds,
      candidates: candidates,
      candidateSetHash: candidateSetHash,
      family: primaryFamily,
      format: format,
      keyMaterial: resourceMaterial,
      kind: kind || "unknown",
      primaryId: candidates[0].id,
      primaryUrl: primaryUrl
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

  function selectedUrlForDescriptor(descriptor, config, state, now) {
    var key = descriptorResourceKey(descriptor, config);
    var entry = state.entries[key];
    var selectedUrl;

    descriptor.resourceKey = key;
    if (
      !entry ||
      entry.candidateSetHash !== descriptor.candidateSetHash ||
      !entry.candidateId ||
      entry.candidateId === descriptor.primaryId ||
      entry.expiresAt <= now ||
      entry.validatedAt <= 0
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
    var keys = Object.keys(value);
    var primaryKeys = [];
    var primaryId = null;
    var primaryUrl = null;
    var backupKeys = [];
    var backupLists = [];
    var index;
    var key;
    var candidateId;
    var backups;
    var descriptor;
    var selectedUrl;
    var selectedId;
    var changed = 0;
    var array;
    var nextArray;
    var inner;
    var itemId;

    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (
        PRIMARY_URL_KEYS[key] &&
        typeof value[key] === "string" &&
        isVodMediaUrl(value[key])
      ) {
        candidateId = candidateIdForUrl(value[key]);
        if (!primaryId) {
          primaryId = candidateId;
          primaryUrl = value[key];
        } else if (candidateId !== primaryId) {
          return null;
        }
        primaryKeys.push(key);
      }
      if (BACKUP_URL_KEYS[key] && Array.isArray(value[key])) {
        backups = arrayOfVodUrls(value[key]);
        if (backups.length > 0) {
          backupKeys.push(key);
          backupLists.push(backups);
        }
      }
    }
    if (!primaryUrl || backupLists.length === 0) {
      return null;
    }

    descriptor = buildMediaDescriptor(
      "json",
      kind,
      primaryUrl,
      intersectBackupLists(backupLists),
      jsonMetadataSignature(value)
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
    for (index = 0; index < primaryKeys.length; index += 1) {
      key = primaryKeys[index];
      if (value[key] !== selectedUrl) {
        value[key] = selectedUrl;
        changed += 1;
      }
    }

    for (index = 0; index < backupKeys.length; index += 1) {
      key = backupKeys[index];
      array = value[key];
      nextArray = [primaryUrl];
      for (inner = 0; inner < array.length; inner += 1) {
        itemId =
          typeof array[inner] === "string"
            ? candidateIdForUrl(array[inner])
            : null;
        if (itemId === selectedId || itemId === primaryId) {
          continue;
        }
        nextArray.push(array[inner]);
      }
      if (JSON.stringify(nextArray) !== JSON.stringify(array)) {
        value[key] = nextArray;
        changed += 1;
      }
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
      lastProbeAt: 0,
      locks: {},
      version: 2
    };
  }

  function boundedInteger(value, fallback, minimum, maximum) {
    return Math.floor(boundedNumber(value, fallback, minimum, maximum));
  }

  function sanitizeScoreMap(value) {
    var output = {};
    var keys;
    var index;
    var key;
    var score;

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
        output[key] = {
          at: boundedNumber(score.at, 0, 0, 9e15),
          elapsedMs: boundedNumber(score.elapsedMs, 0, 0, 60000),
          ok: Boolean(score.ok),
          status: boundedInteger(score.status, 0, 0, 999)
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
      pendingCandidateId: null,
      pendingSince: 0,
      pendingSuccesses: 0,
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
    entry.pendingSince = boundedNumber(value.pendingSince, 0, 0, 9e15);
    entry.pendingSuccesses = boundedInteger(
      value.pendingSuccesses,
      0,
      0,
      2
    );
    entry.scores = sanitizeScoreMap(value.scores);
    entry.selectedAt = boundedNumber(value.selectedAt, 0, 0, 9e15);
    entry.successCount = boundedInteger(value.successCount, 0, 0, 1000000);
    entry.validatedAt = boundedNumber(value.validatedAt, 0, 0, 9e15);
    return entry;
  }

  function loadAutoState(services) {
    var state = createEmptyAutoState();
    var raw;
    var parsed;
    var keys;
    var index;
    var key;
    var lockUntil;

    try {
      raw = services.read(AUTO_STATE_KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }
    if (!isObject(parsed) || parsed.version !== 2) {
      return state;
    }

    state.lastProbeAt = boundedNumber(parsed.lastProbeAt, 0, 0, 9e15);
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
        }
      }
    }
    pruneAutoState(state, 0);
    return state;
  }

  function pruneAutoState(state, now) {
    var keys = Object.keys(state.entries);
    var lockKeys = Object.keys(state.locks);
    var removeCount;
    var index;

    for (index = 0; index < lockKeys.length; index += 1) {
      if (state.locks[lockKeys[index]] <= now) {
        delete state.locks[lockKeys[index]];
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
    entry.pendingCandidateId = null;
    entry.pendingSince = 0;
    entry.pendingSuccesses = 0;
    entry.scores = {};
    entry.selectedAt = 0;
    entry.successCount = 0;
    entry.validatedAt = 0;
  }

  function ttlForConfig(config) {
    var requested =
      boundedNumber(
        config && config.intervalHours,
        DEFAULT_AUTO_INTERVAL_HOURS,
        6,
        72
      ) *
      60 *
      60 *
      1000;
    var maximum =
      normalizeNetworkProfile(config && config.networkProfile) === "auto"
        ? 6 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;
    return Math.min(requested, maximum);
  }

  function hasSafeServices(services) {
    return Boolean(
      services &&
        services.persistent !== false &&
        typeof services.now === "function" &&
        typeof services.read === "function" &&
        typeof services.write === "function" &&
        typeof services.probe === "function"
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
        entry.nextProbeAt <= now
      ) {
        return descriptor;
      }
    }
    return null;
  }

  function chooseAlternativeCandidate(descriptor, entry) {
    var backupCandidates = descriptor.candidates.slice(1);
    var index;

    if (entry.candidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (backupCandidates[index].id === entry.candidateId) {
          return backupCandidates[index];
        }
      }
    }
    if (entry.pendingCandidateId) {
      for (index = 0; index < backupCandidates.length; index += 1) {
        if (backupCandidates[index].id === entry.pendingCandidateId) {
          return backupCandidates[index];
        }
      }
    }
    return backupCandidates[
      entry.candidateCursor % backupCandidates.length
    ];
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
      if (!tag || tag.value === 0) {
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
          value: valueInfo.value,
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
        if (!lengthInfo || lengthInfo.value > bytes.length - lengthInfo.end) {
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
        fields[index].wireType === 0
      ) {
        return fields[index].value;
      }
    }
    return null;
  }

  function protoMetadataSignature(fields) {
    var output = [];
    var index;
    var field;

    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      if (field.wireType === 0) {
        output.push("v" + field.fieldNumber + "=" + field.value);
      } else if (
        field.wireType === 2 &&
        field.text &&
        field.text.length <= 64 &&
        !/^https?:\/\//i.test(field.text) &&
        /^[\x20-\x7e]+$/.test(field.text)
      ) {
        output.push("s" + field.fieldNumber + "=" + field.text);
      }
    }
    return output.join("&");
  }

  function detectProtoMedia(fields, config, state, now) {
    var primaryUrls;
    var backupUrls;
    var primaryField;
    var backupField;
    var kind;
    var representationId;
    var descriptor;

    primaryUrls = protoUrlsForField(fields, 1);
    backupUrls = protoUrlsForField(fields, 2);
    if (primaryUrls.length === 1 && backupUrls.length > 0) {
      primaryField = 1;
      backupField = 2;
      kind = "video";
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
      protoMetadataSignature(fields)
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
    depth
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

    if (!bytes || depth > MAX_PROTO_DEPTH) {
      return { bytes: bytes, changed: 0, valid: false };
    }
    fields = parseProtoFields(bytes);
    if (!fields) {
      return { bytes: bytes, changed: 0, valid: false };
    }

    descriptor = detectProtoMedia(fields, config, state, now);
    if (descriptor) {
      descriptors.push(descriptor);
    }
    for (index = 0; index < fields.length; index += 1) {
      field = fields[index];
      nextPayload = null;

      if (field.wireType === 2) {
        directPayload = transformDirectProtoField(field, descriptor);
        if (directPayload) {
          nextPayload = directPayload;
        } else if (
          !field.text &&
          depth < MAX_PROTO_DEPTH &&
          field.payload.length > 0
        ) {
          nested = walkSafeProtoMessage(
            field.payload,
            config,
            state,
            now,
            descriptors,
            depth + 1
          );
          if (nested.valid && nested.changed > 0) {
            nextPayload = nested.bytes;
          }
        }
      }

      if (nextPayload) {
        chunks.push(bytes.subarray(field.rawStart, field.tagEnd));
        chunks.push(encodeVarint(nextPayload.length));
        chunks.push(nextPayload);
        changed += 1;
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
          0
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
      0
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

  function validateProbeResponse(result, expectedUrl) {
    var status = Number(
      result && (result.statusCode || result.status)
    );
    var headers = result && result.headers;
    var contentRange = headerValue(headers, "content-range");
    var contentType = headerValue(headers, "content-type").toLowerCase();
    var contentEncoding = headerValue(headers, "content-encoding").toLowerCase();
    var contentLengthHeader = headerValue(headers, "content-length");
    var rangeMatch;
    var rangeEnd;
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

    rangeMatch = /^bytes\s+0-(\d+)\/(?:\d+|\*)$/i.exec(
      contentRange.trim()
    );
    if (!rangeMatch) {
      return { ok: false, reason: "content-range", status: status };
    }
    rangeEnd = Number(rangeMatch[1]);
    if (
      !Number.isSafeInteger(rangeEnd) ||
      rangeEnd < 0 ||
      rangeEnd > AUTO_RANGE_END
    ) {
      return { ok: false, reason: "range-size", status: status };
    }
    expectedLength = rangeEnd + 1;
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
    return { ok: true, reason: "validated", status: status };
  }

  function normalizeProbeResult(result, candidate) {
    var validation = validateProbeResponse(result || {}, candidate.url);
    var elapsedMs = boundedNumber(
      result && result.elapsedMs,
      AUTO_PROBE_TIMEOUT_MS,
      1,
      60000
    );
    return {
      candidateId: candidate.id,
      elapsedMs: Math.round(elapsedMs),
      ok: validation.ok,
      reason: validation.reason,
      status: validation.status
    };
  }

  function recordProbeScore(entry, result, now) {
    entry.scores[result.candidateId] = {
      at: now,
      elapsedMs: result.elapsedMs,
      ok: result.ok,
      status: result.status
    };
  }

  function alternativeQualifies(primaryResult, alternativeResult, config) {
    var gain;
    var threshold = boundedNumber(
      config && config.switchThreshold,
      DEFAULT_SWITCH_THRESHOLD,
      10,
      80
    );

    if (!alternativeResult.ok) {
      return false;
    }
    if (!primaryResult.ok) {
      return true;
    }
    gain =
      ((primaryResult.elapsedMs - alternativeResult.elapsedMs) /
        primaryResult.elapsedMs) *
      100;
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

  function updateEntryAfterProbe(
    entry,
    descriptor,
    primaryResult,
    alternativeResult,
    config,
    now
  ) {
    var qualifies = alternativeQualifies(
      primaryResult,
      alternativeResult,
      config
    );
    var wasSelected =
      entry.candidateId === alternativeResult.candidateId;
    var expiredSelection =
      wasSelected && entry.expiresAt <= now;
    var reason;

    entry.lastUsedAt = now;
    recordProbeScore(entry, primaryResult, now);
    recordProbeScore(entry, alternativeResult, now);

    if (wasSelected) {
      if (!alternativeResult.ok) {
        clearSelectedCandidate(entry);
        clearPendingCandidate(entry);
        entry.failureCount += 1;
        entry.lastFailureAt = now;
        entry.candidateCursor += 1;
        entry.nextProbeAt = now + AUTO_RETRY_MS;
        return "selected-failed";
      }

      entry.successCount += 1;
      entry.failureCount = 0;
      entry.validatedAt = now;
      if (!expiredSelection) {
        entry.nextProbeAt = entry.expiresAt;
        return "selected-validated";
      }
      if (qualifies) {
        entry.selectedAt = now;
        entry.expiresAt = now + ttlForConfig(config);
        entry.nextProbeAt = entry.expiresAt;
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
        entry.nextProbeAt = entry.expiresAt;
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
    var primaryCandidate;
    var alternativeCandidate;
    var results = {};
    var finished = false;

    if (typeof callback !== "function") {
      return;
    }
    if (!config || !config.valid || !config.auto || !hasSafeServices(services)) {
      callback({
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
    state = loadAutoState(services);
    prepared = binary
      ? prepareSafeGrpc(input, config, state, now)
      : prepareSafeJson(
          typeof input === "string" ? input : "",
          config,
          state,
          now
        );
    if (!prepared.valid) {
      callback({
        body: original,
        changed: 0,
        descriptors: 0,
        probed: false,
        reason: "unsupported-response",
        valid: false
      });
      return;
    }

    descriptor = findProbeDescriptor(prepared.descriptors, state, now);
    if (!descriptor) {
      callback({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        reason: "cache-or-throttle",
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
    primaryCandidate = descriptor.candidates[0];
    alternativeCandidate = chooseAlternativeCandidate(descriptor, entry);
    if (!alternativeCandidate) {
      callback({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        reason: "no-alternative",
        valid: true
      });
      return;
    }

    state.locks[descriptor.resourceKey] = now + AUTO_LOCK_MS;
    state.lastProbeAt = now;
    if (!saveAutoState(services, state, now)) {
      callback({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: false,
        reason: "state-write-failed",
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
      latestEntry = latestState.entries[descriptor.resourceKey];
      if (!latestEntry) {
        latestEntry = sanitizeAutoEntry(null);
        latestState.entries[descriptor.resourceKey] = latestEntry;
      }
      if (latestEntry.candidateSetHash !== descriptor.candidateSetHash) {
        resetAutoEntryForDescriptor(latestEntry, descriptor);
      }
      updateReason = updateEntryAfterProbe(
        latestEntry,
        descriptor,
        results[primaryCandidate.id],
        results[alternativeCandidate.id],
        config,
        completedAt
      );
      delete latestState.locks[descriptor.resourceKey];
      saveAutoState(services, latestState, completedAt);
      callback({
        body: prepared.body,
        changed: prepared.changed,
        descriptors: prepared.descriptors.length,
        probed: true,
        reason: updateReason,
        valid: true
      });
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
  }

  function createShadowrocketServices() {
    var storeAvailable =
      typeof $persistentStore !== "undefined" &&
      $persistentStore &&
      typeof $persistentStore.read === "function" &&
      typeof $persistentStore.write === "function";

    return {
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
        var request = {
          "auto-redirect": false,
          "binary-mode": true,
          headers: {
            "Accept-Encoding": "identity",
            Range: "bytes=0-" + AUTO_RANGE_END,
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

  function runShadowrocket() {
    var config;
    var requestUrl;
    var body;
    var binary;
    var services;

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
      body =
        typeof $response !== "undefined" && $response
          ? $response.body
          : null;
      binary =
        isByteView(body) ||
        /\/bilibili\.[a-z0-9.]+\/(?:PlayView|PlayViewUnite)(?:\?|$)/i.test(
          requestUrl
        );

      if (!config.auto) {
        finishManualShadowrocketResponse(config, body, binary);
        return;
      }

      services = createShadowrocketServices();
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
                  result.changed
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
    AUTO_CDN_CANDIDATES: AUTO_CDN_CANDIDATES,
    AUTO_CONFIRM_DELAY_MS: AUTO_CONFIRM_DELAY_MS,
    AUTO_GLOBAL_PROBE_GAP_MS: AUTO_GLOBAL_PROBE_GAP_MS,
    AUTO_RANGE_END: AUTO_RANGE_END,
    AUTO_STATE_KEY: AUTO_STATE_KEY,
    DEFAULT_CDN: DEFAULT_CDN,
    asciiBytesToString: asciiBytesToString,
    asciiStringToBytes: asciiStringToBytes,
    buildMediaDescriptor: buildMediaDescriptor,
    candidateFamilyForUrl: candidateFamilyForUrl,
    candidateIdForUrl: candidateIdForUrl,
    concatBytes: concatBytes,
    createEmptyAutoState: createEmptyAutoState,
    descriptorResourceKey: descriptorResourceKey,
    encodeVarint: encodeVarint,
    findFirstGrpcVodUrl: findFirstGrpcVodUrl,
    findFirstJsonVodUrl: findFirstJsonVodUrl,
    isBilibiliMediaHost: isBilibiliMediaHost,
    isVodMediaUrl: isVodMediaUrl,
    loadAutoState: loadAutoState,
    normalizeCdnHost: normalizeCdnHost,
    normalizeNetworkProfile: normalizeNetworkProfile,
    parseArgument: parseArgument,
    prepareSafeGrpc: prepareSafeGrpc,
    prepareSafeJson: prepareSafeJson,
    processSafeAutoResponse: processSafeAutoResponse,
    queryFreeCandidateFingerprint: queryFreeCandidateFingerprint,
    readVarint: readVarint,
    rewriteVodUrl: rewriteVodUrl,
    runShadowrocket: runShadowrocket,
    stableHash: stableHash,
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
    typeof $response !== "undefined"
  ) {
    runShadowrocket();
  }
})(this);
