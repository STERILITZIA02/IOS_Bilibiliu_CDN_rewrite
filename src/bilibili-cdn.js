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

  function parseArgument(argument) {
    var config = {
      cdnHost: DEFAULT_CDN,
      debug: false,
      valid: true
    };
    var raw;
    var parsed;
    var pairs;
    var index;
    var splitAt;
    var key;
    var value;
    var normalized;
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
        normalized = normalizeCdnHost(String(parsed.cdn));
        if (normalized === null) {
          config.valid = false;
          config.cdnHost = null;
        } else {
          config.cdnHost = normalized;
        }
      }
      config.debug = parseBoolean(parsed.debug);
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
        normalized = normalizeCdnHost(value);
        if (normalized === null) {
          config.valid = false;
          config.cdnHost = null;
        } else {
          config.cdnHost = normalized;
        }
      } else if (key === "debug") {
        config.debug = parseBoolean(value);
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
    var config;
    var requestUrl;
    var body;
    var result;
    var binary;

    try {
      config = parseArgument(
        typeof $argument === "string" ? $argument : ""
      );
      if (!config.valid) {
        safeLog("invalid CDN argument; response left unchanged");
        $done({});
        return;
      }
      if (!config.cdnHost) {
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

  var api = {
    DEFAULT_CDN: DEFAULT_CDN,
    asciiBytesToString: asciiBytesToString,
    asciiStringToBytes: asciiStringToBytes,
    concatBytes: concatBytes,
    encodeVarint: encodeVarint,
    isBilibiliMediaHost: isBilibiliMediaHost,
    isVodMediaUrl: isVodMediaUrl,
    normalizeCdnHost: normalizeCdnHost,
    parseArgument: parseArgument,
    readVarint: readVarint,
    rewriteVodUrl: rewriteVodUrl,
    runShadowrocket: runShadowrocket,
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
