"use strict";

/*
 * Prevent Bilibili's volatile ad/UI metadata from falling back to an
 * unmodified conditional-cache entry after refresh or background suspension.
 *
 * This request helper is deliberately narrow:
 * - exact registry-reviewed Bilibili metadata hosts and paths only;
 * - request headers only (the signed URL and body are never changed).
 */
(function (root) {
  var endpointRegistry =
    typeof module !== "undefined" && module.exports
      ? require("./bilibili-endpoints.js")
      : root.BiliEndpointRegistry;

  function volatileEndpoint(requestUrl) {
    return endpointRegistry && endpointRegistry.classify
      ? endpointRegistry.classify(requestUrl, { requestGuard: true })
      : null;
  }

  function classifyVolatileEndpoint(requestUrl) {
    var matched = volatileEndpoint(requestUrl);
    return matched ? matched.id : "";
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
    var matched = volatileEndpoint(requestUrl);
    var endpoint = matched ? matched.id : "";
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
    if (matched.transport === "grpc") {
      setHeader(output, "grpc-accept-encoding", "gzip,identity");
    }
    return {
      changed: true,
      endpoint: endpoint,
      handler: matched.handler,
      headers: output,
      removedValidators: removedValidators,
      transport: matched.transport
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
          " handler=" +
          (result.handler || "none") +
          " transport=" +
          (result.transport || "unknown") +
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
