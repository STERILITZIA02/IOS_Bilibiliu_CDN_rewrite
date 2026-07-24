/*
 * Bilibili CDN Switcher for Shadowrocket
 *
 * This file deliberately has no runtime dependencies. It handles both JSON
 * playback responses and gRPC/Protobuf responses used by current Bilibili
 * iOS clients. Live stream hosts are not rewritten because their signatures
 * are tied to server-selected CDN metadata; live traffic is routed by the
 * companion rule set instead.
 */
(function (root) {
  "use strict";

  var NAME = "BiliCDN";
  var DEFAULT_CDN = "upos-sz-mirrorali.bilivideo.com";
  var AUTO_STATE_KEY = "BiliCDN.auto.v1";
  var DEFAULT_AUTO_INTERVAL_HOURS = 12;
  var DEFAULT_SWITCH_THRESHOLD = 20;
  var AUTO_BATCH_SIZE = 6;
  var AUTO_TEST_TIMEOUT_MS = 3000;
  var AUTO_RETRY_MS = 60 * 60 * 1000;
  var AUTO_MIN_HOLD_HOURS = 24;
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
  var MAX_PROTO_DEPTH = 32;
  var MAX_URL_BYTES = 65536;
  var PRIMARY_URL_KEYS = {
    baseUrl: true,
    base_url: true,
    url: true
  };
  // Current playershared Protobuf schemas use field 1 for DashVideo.base_url
  // and field 4 for ResponseUrl.url. Fields 2 and 5 are backup URLs and must
  // remain intact so the Bilibili client can still fail over.
  var PRIMARY_PROTO_URL_FIELDS = {
    1: true,
    4: true
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
    if (value instanceof Uint8Array) {
      return value;
    }
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (
      value &&
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

  function parseArgument(argument) {
    var config = {
      auto: false,
      cdnHost: DEFAULT_CDN,
      debug: false,
      intervalHours: DEFAULT_AUTO_INTERVAL_HOURS,
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
    return hostname === suffix || hostname.slice(-(suffix.length + 1)) === "." + suffix;
  }

  function isBilibiliMediaHost(hostname) {
    var index;

    hostname = hostname.toLowerCase();
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
    return {
      scheme: match[1],
      authority: authority,
      hostname: hostname,
      remainder: match[3]
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

  function findFirstJsonVodUrlInValue(value, depth) {
    var index;
    var keys;
    var key;
    var found;

    if (depth > 64 || value === null) {
      return null;
    }

    if (Array.isArray(value)) {
      for (index = 0; index < value.length; index += 1) {
        found = findFirstJsonVodUrlInValue(value[index], depth + 1);
        if (found) {
          return found;
        }
      }
      return null;
    }

    if (!isObject(value)) {
      return null;
    }

    keys = Object.keys(value);
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (
        PRIMARY_URL_KEYS[key] &&
        typeof value[key] === "string" &&
        isVodMediaUrl(value[key])
      ) {
        return value[key];
      }
    }

    for (index = 0; index < keys.length; index += 1) {
      found = findFirstJsonVodUrlInValue(value[keys[index]], depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }

  function findFirstJsonVodUrl(text) {
    var parsed;
    if (typeof text !== "string" || text === "") {
      return null;
    }
    try {
      parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
    } catch (error) {
      return null;
    }
    return findFirstJsonVodUrlInValue(parsed, 0);
  }

  function rewriteJsonValue(value, config, state, depth) {
    var index;
    var keys;
    var key;
    var rewritten;

    if (depth > 64 || value === null) {
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
        return { value: value, end: position };
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

    if (bytes.length > MAX_URL_BYTES) {
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

  function transformLengthDelimited(payload, config, depth, fieldNumber) {
    var text;
    var rewritten;
    var nested;

    if (payload.length >= 10 && payload.length <= MAX_URL_BYTES) {
      text = asciiBytesToString(payload);
      if (
        PRIMARY_PROTO_URL_FIELDS[fieldNumber] &&
        text &&
        /^https?:\/\//i.test(text)
      ) {
        rewritten = rewriteVodUrl(text, config.cdnHost);
        if (rewritten !== text) {
          return {
            bytes: asciiStringToBytes(rewritten),
            changed: 1,
            valid: true
          };
        }
        return { bytes: payload, changed: 0, valid: true };
      }
    }

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
        transformed = transformLengthDelimited(
          payload,
          config,
          depth,
          fieldNumber
        );
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

  function findFirstVodUrlInProtoMessage(bytes, depth) {
    var offset = 0;
    var tag;
    var fieldNumber;
    var wireType;
    var valueInfo;
    var lengthInfo;
    var payloadStart;
    var payloadEnd;
    var payload;
    var text;
    var nested;

    if (!bytes || bytes.length === 0 || depth > MAX_PROTO_DEPTH) {
      return null;
    }

    while (offset < bytes.length) {
      tag = readVarint(bytes, offset);
      if (!tag || tag.value === 0) {
        return null;
      }
      fieldNumber = Math.floor(tag.value / 8);
      wireType = tag.value % 8;
      if (fieldNumber < 1) {
        return null;
      }
      offset = tag.end;

      if (wireType === 0) {
        valueInfo = readVarint(bytes, offset);
        if (!valueInfo) {
          return null;
        }
        offset = valueInfo.end;
      } else if (wireType === 1) {
        if (offset + 8 > bytes.length) {
          return null;
        }
        offset += 8;
      } else if (wireType === 2) {
        lengthInfo = readVarint(bytes, offset);
        if (!lengthInfo || lengthInfo.value > bytes.length - lengthInfo.end) {
          return null;
        }
        payloadStart = lengthInfo.end;
        payloadEnd = payloadStart + lengthInfo.value;
        payload = bytes.subarray(payloadStart, payloadEnd);

        if (
          PRIMARY_PROTO_URL_FIELDS[fieldNumber] &&
          payload.length >= 10 &&
          payload.length <= MAX_URL_BYTES
        ) {
          text = asciiBytesToString(payload);
          if (text && isVodMediaUrl(text)) {
            return text;
          }
        }

        nested = findFirstVodUrlInProtoMessage(payload, depth + 1);
        if (nested) {
          return nested;
        }
        offset = payloadEnd;
      } else if (wireType === 5) {
        if (offset + 4 > bytes.length) {
          return null;
        }
        offset += 4;
      } else {
        return null;
      }
    }
    return null;
  }

  function readUint32Be(bytes, offset) {
    return (
      bytes[offset] * 0x1000000 +
      bytes[offset + 1] * 0x10000 +
      bytes[offset + 2] * 0x100 +
      bytes[offset + 3]
    );
  }

  function findFirstGrpcVodUrl(input) {
    var bytes = toUint8Array(input);
    var offset = 0;
    var frames = 0;
    var flag;
    var length;
    var frameEnd;
    var found;

    if (!bytes || bytes.length === 0) {
      return null;
    }

    while (offset + 5 <= bytes.length) {
      flag = bytes[offset];
      length = readUint32Be(bytes, offset + 1);
      frameEnd = offset + 5 + length;
      if (frameEnd > bytes.length) {
        frames = 0;
        break;
      }
      frames += 1;
      if (flag === 0) {
        found = findFirstVodUrlInProtoMessage(
          bytes.subarray(offset + 5, frameEnd),
          0
        );
        if (found) {
          return found;
        }
      }
      offset = frameEnd;
    }

    if (frames > 0 && offset === bytes.length) {
      return null;
    }
    return findFirstVodUrlInProtoMessage(bytes, 0);
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
      if (frameEnd > bytes.length) {
        frames = 0;
        break;
      }

      frames += 1;
      payload = bytes.subarray(offset + 5, frameEnd);
      if (flag === 0) {
        transformed = transformProtoMessage(payload, config, 0);
      } else {
        transformed = { bytes: payload, changed: 0, valid: true };
      }

      if (transformed.valid && transformed.changed > 0) {
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

    raw = transformProtoMessage(bytes, config, 0);
    return {
      body: raw.changed > 0 ? raw.bytes : bytes,
      changed: raw.changed,
      valid: raw.valid
    };
  }

  function createEmptyAutoState() {
    return {
      version: 1,
      selectedHost: null,
      selectedAt: 0,
      nextTestAt: 0,
      testingUntil: 0,
      cursor: 0,
      scores: {}
    };
  }

  function loadAutoState(services) {
    var state = createEmptyAutoState();
    var raw;
    var parsed;

    try {
      raw = services.read(AUTO_STATE_KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch (error) {
      parsed = null;
    }

    if (!isObject(parsed) || parsed.version !== 1) {
      return state;
    }

    if (
      typeof parsed.selectedHost === "string" &&
      isValidHostname(parsed.selectedHost) &&
      isBilibiliMediaHost(parsed.selectedHost)
    ) {
      state.selectedHost = parsed.selectedHost.toLowerCase();
    }
    state.selectedAt = boundedNumber(parsed.selectedAt, 0, 0, 9e15);
    state.nextTestAt = boundedNumber(parsed.nextTestAt, 0, 0, 9e15);
    state.testingUntil = boundedNumber(parsed.testingUntil, 0, 0, 9e15);
    state.cursor = Math.floor(
      boundedNumber(
        parsed.cursor,
        0,
        0,
        Math.max(0, AUTO_CDN_CANDIDATES.length - 1)
      )
    );
    if (isObject(parsed.scores) && !Array.isArray(parsed.scores)) {
      state.scores = parsed.scores;
    }
    return state;
  }

  function saveAutoState(services, state) {
    try {
      return services.write(JSON.stringify(state), AUTO_STATE_KEY);
    } catch (error) {
      return false;
    }
  }

  function addUniqueCandidate(output, hostname) {
    var normalized = normalizeCdnHost(hostname);
    if (
      normalized &&
      isBilibiliMediaHost(normalized) &&
      output.indexOf(normalized) === -1
    ) {
      output.push(normalized);
    }
  }

  function buildAutoCandidateBatch(state, sampleUrl) {
    var output = [];
    var parsed = parseHttpUrl(sampleUrl);
    var sourceHost =
      parsed && isBilibiliMediaHost(parsed.hostname)
        ? parsed.hostname
        : null;
    var cursor = state.cursor % AUTO_CDN_CANDIDATES.length;
    var scanned = 0;

    addUniqueCandidate(output, state.selectedHost);
    addUniqueCandidate(output, sourceHost);
    addUniqueCandidate(output, DEFAULT_CDN);

    while (
      output.length < AUTO_BATCH_SIZE &&
      scanned < AUTO_CDN_CANDIDATES.length
    ) {
      addUniqueCandidate(
        output,
        AUTO_CDN_CANDIDATES[
          (cursor + scanned) % AUTO_CDN_CANDIDATES.length
        ]
      );
      scanned += 1;
    }

    return {
      hosts: output,
      nextCursor:
        (cursor + Math.max(1, scanned)) % AUTO_CDN_CANDIDATES.length,
      sourceHost: sourceHost
    };
  }

  function findFastestResult(results) {
    var best = null;
    var index;
    var result;

    for (index = 0; index < results.length; index += 1) {
      result = results[index];
      if (
        result &&
        result.ok &&
        Number.isFinite(result.elapsedMs) &&
        result.elapsedMs > 0 &&
        (!best || result.elapsedMs < best.elapsedMs)
      ) {
        best = result;
      }
    }
    return best;
  }

  function resultForHost(results, hostname) {
    var index;
    for (index = 0; index < results.length; index += 1) {
      if (results[index].host === hostname) {
        return results[index];
      }
    }
    return null;
  }

  function pruneAutoScores(state) {
    var hosts = Object.keys(state.scores);
    var removeCount;
    var index;

    if (hosts.length <= 32) {
      return;
    }
    hosts.sort(function (left, right) {
      var leftAt =
        state.scores[left] && Number(state.scores[left].at);
      var rightAt =
        state.scores[right] && Number(state.scores[right].at);
      return (leftAt || 0) - (rightAt || 0);
    });
    removeCount = hosts.length - 32;
    for (index = 0; index < removeCount; index += 1) {
      delete state.scores[hosts[index]];
    }
  }

  function selectAutoCdn(sampleUrl, config, services, callback) {
    var parsedSample = parseHttpUrl(sampleUrl);
    var emergencyHost =
      parsedSample && isBilibiliMediaHost(parsedSample.hostname)
        ? parsedSample.hostname
        : DEFAULT_CDN;
    var intervalHours = boundedNumber(
      config && config.intervalHours,
      DEFAULT_AUTO_INTERVAL_HOURS,
      6,
      72
    );
    var switchThreshold = boundedNumber(
      config && config.switchThreshold,
      DEFAULT_SWITCH_THRESHOLD,
      10,
      80
    );
    var now;
    var state;
    var batch;
    var fallbackHost;
    var intervalMs;
    var holdMs;
    var results;
    var completed;
    var remaining;

    if (typeof callback !== "function") {
      return;
    }
    if (
      !services ||
      services.persistent === false ||
      typeof services.now !== "function" ||
      typeof services.read !== "function" ||
      typeof services.write !== "function" ||
      typeof services.benchmark !== "function"
    ) {
      callback({
        host: emergencyHost,
        reason: "services-unavailable",
        results: [],
        switched: false,
        tested: false
      });
      return;
    }

    now = services.now();
    state = loadAutoState(services);
    batch = buildAutoCandidateBatch(state, sampleUrl);
    fallbackHost =
      state.selectedHost || batch.sourceHost || emergencyHost;
    intervalMs = intervalHours * 60 * 60 * 1000;
    holdMs =
      Math.max(AUTO_MIN_HOLD_HOURS, intervalHours * 2) *
      60 *
      60 *
      1000;
    results = [];
    completed = {};

    function finishWithoutTest(reason) {
      callback({
        host: fallbackHost,
        reason: reason,
        results: [],
        switched: false,
        tested: false
      });
    }

    if (
      !sampleUrl ||
      !isVodMediaUrl(sampleUrl) ||
      batch.hosts.length === 0
    ) {
      finishWithoutTest("no-testable-url");
      return;
    }

    if (state.testingUntil > now) {
      finishWithoutTest("test-already-running");
      return;
    }
    if (state.nextTestAt > now) {
      finishWithoutTest("cached");
      return;
    }
    state.testingUntil = now + AUTO_TEST_TIMEOUT_MS + 10000;
    saveAutoState(services, state);
    remaining = batch.hosts.length;

    function finishBenchmark() {
      var best = findFastestResult(results);
      var previousHost = state.selectedHost;
      var selectedResult = previousHost
        ? resultForHost(results, previousHost)
        : null;
      var selectedHost = fallbackHost;
      var switched = false;
      var reason = "kept-current";
      var gain;
      var index;
      var result;

      state.testingUntil = 0;
      state.cursor = batch.nextCursor;
      state.nextTestAt = now + (best ? intervalMs : AUTO_RETRY_MS);

      for (index = 0; index < results.length; index += 1) {
        result = results[index];
        state.scores[result.host] = {
          at: now,
          ms: result.ok ? result.elapsedMs : null,
          ok: Boolean(result.ok)
        };
      }

      if (best) {
        if (!previousHost) {
          selectedHost = best.host;
          switched = true;
          reason = "initial-fastest";
        } else if (!selectedResult || !selectedResult.ok) {
          selectedHost = best.host;
          switched = selectedHost !== previousHost;
          reason = switched ? "current-unreachable" : "current-recovered";
        } else if (best.host !== previousHost) {
          gain =
            ((selectedResult.elapsedMs - best.elapsedMs) /
              selectedResult.elapsedMs) *
            100;
          if (
            now - state.selectedAt >= holdMs &&
            gain >= switchThreshold
          ) {
            selectedHost = best.host;
            switched = true;
            reason = "meaningfully-faster";
          } else {
            selectedHost = previousHost;
            reason =
              now - state.selectedAt < holdMs
                ? "minimum-hold"
                : "below-threshold";
          }
        } else {
          selectedHost = previousHost;
          reason = "current-fastest";
        }
      } else {
        reason = "all-tests-failed";
      }

      if (switched || !state.selectedHost) {
        state.selectedHost = selectedHost;
        state.selectedAt = now;
      }
      pruneAutoScores(state);
      saveAutoState(services, state);
      callback({
        host: selectedHost,
        reason: reason,
        results: results,
        switched: switched,
        tested: true
      });
    }

    function receiveResult(hostname, result) {
      if (completed[hostname]) {
        return;
      }
      completed[hostname] = true;
      results.push({
        elapsedMs:
          result && Number.isFinite(result.elapsedMs)
            ? Math.max(1, Math.round(result.elapsedMs))
            : AUTO_TEST_TIMEOUT_MS,
        host: hostname,
        ok: Boolean(result && result.ok),
        status: result && result.status ? result.status : 0
      });
      remaining -= 1;
      if (remaining === 0) {
        finishBenchmark();
      }
    }

    batch.hosts.forEach(function (hostname) {
      var testUrl = rewriteVodUrl(sampleUrl, hostname);
      try {
        services.benchmark(
          hostname,
          testUrl,
          AUTO_TEST_TIMEOUT_MS,
          function (result) {
            receiveResult(hostname, result);
          }
        );
      } catch (error) {
        receiveResult(hostname, {
          elapsedMs: AUTO_TEST_TIMEOUT_MS,
          ok: false,
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
        if (storeAvailable) {
          return $persistentStore.read(key);
        }
        return null;
      },
      write: function (value, key) {
        if (storeAvailable) {
          return $persistentStore.write(value, key);
        }
        return false;
      },
      benchmark: function (hostname, url, timeoutMs, callback) {
        var client =
          typeof $httpClient !== "undefined" ? $httpClient : null;
        var started = Date.now();
        var finished = false;
        var timer = null;
        var useHead =
          client && typeof client.head === "function";
        var request = {
          headers: {
            Referer: "https://www.bilibili.com/",
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)"
          },
          timeout: Math.max(1, Math.ceil(timeoutMs / 1000)),
          url: url
        };
        var method;

        function complete(error, response) {
          var rawStatus;
          var status;
          var elapsedMs;

          if (finished) {
            return;
          }
          finished = true;
          if (timer !== null && typeof clearTimeout === "function") {
            clearTimeout(timer);
          }
          rawStatus =
            response && (response.statusCode || response.status);
          status = Number(rawStatus);
          elapsedMs = Math.max(1, Date.now() - started);
          callback({
            elapsedMs: elapsedMs,
            host: hostname,
            ok:
              !error &&
              Number.isFinite(status) &&
              status >= 200 &&
              status < 400,
            status: Number.isFinite(status) ? status : 0
          });
        }

        if (!client) {
          complete(new Error("HTTP client unavailable"), null);
          return;
        }

        if (!useHead) {
          request.headers.Range = "bytes=0-16383";
        }
        method = useHead ? client.head : client.get;

        if (typeof setTimeout === "function") {
          timer = setTimeout(function () {
            complete(new Error("benchmark timeout"), null);
          }, timeoutMs + 250);
        }

        try {
          method.call(client, request, function (error, response) {
            complete(error, response);
          });
        } catch (error) {
          complete(error, null);
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

  function finishShadowrocketResponse(config, body, binary) {
    var result;

    try {
      if (!config.cdnHost) {
        if (config.debug) {
          safeLog("CDN rewrite disabled");
        }
        $done({});
        return;
      }

      if (binary) {
        result = transformGrpcBody(body, config);
        if (result.valid && result.changed > 0) {
          if (config.debug) {
            safeLog("rewrote " + result.changed + " Protobuf URL(s)");
          }
          $done({ body: result.body });
        } else {
          if (config.debug && !result.valid) {
            safeLog("unsupported binary response; left unchanged");
          }
          $done({});
        }
        return;
      }

      result = transformJsonText(
        typeof body === "string" ? body : "",
        config
      );
      if (result.valid && result.changed > 0) {
        if (config.debug) {
          safeLog("rewrote " + result.changed + " JSON URL(s)");
        }
        $done({ body: result.body });
      } else {
        if (config.debug && !result.valid) {
          safeLog("non-JSON response; left unchanged");
        }
        $done({});
      }
    } catch (error) {
      safeLog(
        "error; response left unchanged: " +
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
    var sampleUrl;
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
        finishShadowrocketResponse(config, body, binary);
        return;
      }

      sampleUrl = binary
        ? findFirstGrpcVodUrl(body)
        : findFirstJsonVodUrl(
            typeof body === "string" ? body : ""
          );
      services = createShadowrocketServices();
      selectAutoCdn(
        sampleUrl,
        config,
        services,
        function (selection) {
          try {
            config.cdnHost = selection.host;
            if (config.debug) {
              if (selection.tested) {
                safeLog(
                  "auto test " +
                    selection.results
                      .map(function (item) {
                        return (
                          item.host +
                          "=" +
                          (item.ok ? item.elapsedMs + "ms" : "failed")
                        );
                      })
                      .join(", ")
                );
              }
              safeLog(
                "auto selected " +
                  selection.host +
                  " (" +
                  selection.reason +
                  ")"
              );
            }
            finishShadowrocketResponse(config, body, binary);
          } catch (error) {
            safeLog(
              "auto selection error; response left unchanged: " +
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
    AUTO_CDN_CANDIDATES: AUTO_CDN_CANDIDATES,
    AUTO_STATE_KEY: AUTO_STATE_KEY,
    DEFAULT_CDN: DEFAULT_CDN,
    asciiBytesToString: asciiBytesToString,
    asciiStringToBytes: asciiStringToBytes,
    concatBytes: concatBytes,
    encodeVarint: encodeVarint,
    findFirstGrpcVodUrl: findFirstGrpcVodUrl,
    findFirstJsonVodUrl: findFirstJsonVodUrl,
    isBilibiliMediaHost: isBilibiliMediaHost,
    isVodMediaUrl: isVodMediaUrl,
    normalizeCdnHost: normalizeCdnHost,
    parseArgument: parseArgument,
    readVarint: readVarint,
    rewriteVodUrl: rewriteVodUrl,
    runShadowrocket: runShadowrocket,
    selectAutoCdn: selectAutoCdn,
    transformGrpcBody: transformGrpcBody,
    transformJsonText: transformJsonText,
    transformProtoMessage: transformProtoMessage
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
