"use strict";

/*
 * Prevent Bilibili's volatile Home/Mine metadata from falling back to an
 * unmodified conditional-cache entry after a long background suspension.
 *
 * This request helper is deliberately narrow:
 * - exact Bilibili app hosts only;
 * - exact Home Feed / Story / Mine paths only;
 * - request headers only (the signed URL and body are never changed).
 */
(function (root) {
  var VOLATILE_HOSTS = {
    "app.bilibili.com": true,
    "app.biliapi.net": true
  };

  function parseRequestUrl(requestUrl) {
    var match = /^https?:\/\/([^/?#]+)(\/[^?#]*)?/i.exec(
      String(requestUrl || "")
    );
    if (!match) {
      return null;
    }
    return {
      host: String(match[1]).toLowerCase(),
      path: match[2] || "/"
    };
  }

  function isVolatileMetadataUrl(requestUrl) {
    var parsed = parseRequestUrl(requestUrl);
    return Boolean(
      parsed &&
        VOLATILE_HOSTS[parsed.host] &&
        (
          parsed.path === "/x/v2/feed/index" ||
          parsed.path === "/x/v2/feed/index/story" ||
          /^\/x\/v2\/account\/mine(?:\/ipad)?$/.test(parsed.path)
        )
    );
  }

  function copyHeaders(headers) {
    var output = {};
    var keys;
    var index;
    if (!headers || typeof headers !== "object") {
      return output;
    }
    keys = Object.keys(headers);
    for (index = 0; index < keys.length; index += 1) {
      output[keys[index]] = headers[keys[index]];
    }
    return output;
  }

  function deleteHeader(headers, name) {
    var keys = Object.keys(headers);
    var index;
    for (index = 0; index < keys.length; index += 1) {
      if (keys[index].toLowerCase() === name) {
        delete headers[keys[index]];
      }
    }
  }

  function setHeader(headers, name, value) {
    deleteHeader(headers, name.toLowerCase());
    headers[name] = value;
  }

  function guardRequest(requestUrl, headers) {
    var output;
    if (!isVolatileMetadataUrl(requestUrl)) {
      return {
        changed: false,
        headers: headers
      };
    }
    output = copyHeaders(headers);
    deleteHeader(output, "if-none-match");
    deleteHeader(output, "if-modified-since");
    deleteHeader(output, "if-range");
    setHeader(output, "Cache-Control", "no-cache");
    setHeader(output, "Pragma", "no-cache");
    return {
      changed: true,
      headers: output
    };
  }

  function runShadowrocket() {
    var requestUrl =
      typeof $request !== "undefined" && $request
        ? String($request.url || "")
        : "";
    var result = guardRequest(
      requestUrl,
      typeof $request !== "undefined" && $request
        ? $request.headers
        : null
    );
    if (result.changed) {
      $done({ headers: result.headers });
    } else {
      $done({});
    }
  }

  var api = {
    guardRequest: guardRequest,
    isVolatileMetadataUrl: isVolatileMetadataUrl,
    runShadowrocket: runShadowrocket
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliRefreshGuard = api;
  }

  if (
    typeof $done === "function" &&
    typeof $request !== "undefined" &&
    typeof $response === "undefined"
  ) {
    runShadowrocket();
  }
})(this);
