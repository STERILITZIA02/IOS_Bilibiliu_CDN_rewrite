"use strict";

(function (root) {
  function statusCode(response) {
    var value = response && (response.statusCode !== undefined ? response.statusCode : response.status);
    var match = String(value || "").match(/^(?:HTTP\/[\d.]+\s+)?(\d{3})(?:\s|$)/i);
    return match ? Number(match[1]) : 0;
  }

  function canRewrite(response) {
    var status = statusCode(response);
    // Missing status is supported by older script engines. Partial, cached,
    // redirected and failed responses must keep their original representation.
    return status === 0 || status === 200;
  }

  function rewrittenHeaders(headers) {
    var output = {};
    Object.keys(headers || {}).forEach(function (key) {
      // Script bodies are decoded. These fields describe the old bytes, not the
      // replacement JSON/protobuf. grpc-encoding is handled per gRPC frame.
      if (!/^(?:content-encoding|content-length|content-md5|digest|etag|last-modified)$/i.test(key)) {
        output[key] = headers[key];
      }
    });
    return output;
  }

  var api = { canRewrite: canRewrite, rewrittenHeaders: rewrittenHeaders, statusCode: statusCode };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BiliResponse = api;
  }
})(this);
