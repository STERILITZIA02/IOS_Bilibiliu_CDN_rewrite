"use strict";

/*
 * Prevent Bilibili's volatile ad/UI metadata from falling back to an
 * unmodified conditional-cache entry after refresh or background suspension.
 *
 * This request helper is deliberately narrow:
 * - exact Bilibili app hosts only;
 * - exact reviewed Splash / Home / View / Mine / VIP-ad paths only;
 * - request headers only (the signed URL and body are never changed).
 */
(function (root) {
  var VOLATILE_HOSTS = {
    "app.bilibili.com": true,
    "app.biliapi.net": true
  };
  var VIP_AD_HOSTS = {
    "api.bilibili.com": true,
    "api.biliapi.net": true,
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

  function classifyVolatileEndpoint(requestUrl) {
    var parsed = parseRequestUrl(requestUrl);
    if (!parsed) {
      return "";
    }
    if (VOLATILE_HOSTS[parsed.host]) {
      if (parsed.path === "/x/v2/splash/list") {
        return "splash-list";
      }
      if (parsed.path === "/x/v2/splash/show") {
        return "splash-show";
      }
      if (parsed.path === "/x/v2/splash/event/list2") {
        return "splash-event-list2";
      }
      if (parsed.path === "/x/v2/splash/brand/list") {
        return "splash-brand-list";
      }
      if (parsed.path === "/x/v2/feed/index") {
        return "feed-index";
      }
      if (parsed.path === "/x/v2/feed/index/story") {
        return "feed-story";
      }
      if (parsed.path === "/x/v2/feed/index/story/cart") {
        return "feed-story-cart";
      }
      if (parsed.path === "/x/v2/feed/index/relate/story") {
        return "feed-relate-story";
      }
      if (parsed.path === "/x/v2/view") {
        return "view-json";
      }
      if (parsed.path === "/x/v2/account/mine") {
        return "mine";
      }
      if (parsed.path === "/x/v2/account/mine/ipad") {
        return "mine-ipad";
      }
      if (parsed.path === "/x/v2/account/myinfo") {
        return "myinfo";
      }
    }
    if (VIP_AD_HOSTS[parsed.host]) {
      if (parsed.path === "/x/vip/ads/materials") {
        return "vip-materials";
      }
      if (parsed.path === "/x/vip/ads/material/report") {
        return "vip-material-report";
      }
    }
    return "";
  }

  function isVolatileMetadataUrl(requestUrl) {
    return Boolean(classifyVolatileEndpoint(requestUrl));
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
    var endpoint = classifyVolatileEndpoint(requestUrl);
    var keys;
    var index;
    var removedValidators = 0;
    if (!endpoint) {
      return {
        changed: false,
        endpoint: "",
        headers: headers
      };
    }
    output = copyHeaders(headers);
    keys = Object.keys(output);
    for (index = 0; index < keys.length; index += 1) {
      if (/^(?:if-none-match|if-modified-since|if-range)$/i.test(keys[index])) {
        removedValidators += 1;
      }
    }
    deleteHeader(output, "if-none-match");
    deleteHeader(output, "if-modified-since");
    deleteHeader(output, "if-range");
    setHeader(output, "Cache-Control", "no-cache, no-store");
    setHeader(output, "Pragma", "no-cache");
    return {
      changed: true,
      endpoint: endpoint,
      headers: output,
      removedValidators: removedValidators
    };
  }

  function debugEnabled(argument) {
    var text = typeof argument === "string" ? argument.trim() : "";
    var parsed;
    if (!text) {
      return false;
    }
    try {
      parsed = JSON.parse(text);
      return Boolean(parsed && parsed.debug === true);
    } catch (error) {
      return /(?:^|[&,])debug=(?:1|true)(?:$|[&,])/i.test(text);
    }
  }

  function safeLog(message) {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.log === "function"
    ) {
      console.log("[BiliRefresh] " + String(message));
    }
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
    if (
      debugEnabled(
        typeof $argument === "string" ? $argument : ""
      )
    ) {
      safeLog(
        "endpoint=" +
          (result.endpoint || "unmatched") +
          " changed=" +
          (result.changed ? 1 : 0) +
          " validatorsRemoved=" +
          (result.removedValidators || 0) +
          " reason=" +
          (result.changed ? "fresh-response-requested" : "endpoint-unmatched")
      );
    }
    if (result.changed) {
      $done({ headers: result.headers });
    } else {
      $done({});
    }
  }

  var api = {
    classifyVolatileEndpoint: classifyVolatileEndpoint,
    debugEnabled: debugEnabled,
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
