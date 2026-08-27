"use strict";

// Bundled at build time; no downloads, browser streams, or Worker are needed.
(function (root) {
  var codec = typeof module !== "undefined" && module.exports
    ? require("fflate")
    : root.fflate;
  var crcTable;

  function crcUpdate(crc, bytes) {
    var index;
    var bit;
    var value;
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (index = 0; index < 256; index += 1) {
        value = index;
        for (bit = 0; bit < 8; bit += 1) {
          value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
        }
        crcTable[index] = value;
      }
    }
    for (index = 0; index < bytes.length; index += 1) {
      crc = crcTable[(crc ^ bytes[index]) & 255] ^ crc >>> 8;
    }
    return crc;
  }

  function uint32(bytes, offset) {
    return (bytes[offset] | bytes[offset + 1] << 8 |
      bytes[offset + 2] << 16 | bytes[offset + 3] << 24) >>> 0;
  }

  function validateHeader(bytes) {
    var flags = bytes[3];
    var offset = 10;
    var footer = bytes.length - 8;
    var index;
    if (bytes.length < 18 || bytes[0] !== 31 || bytes[1] !== 139 || bytes[2] !== 8 || flags & 224) {
      throw new Error("invalid gzip header");
    }
    if (flags & 4) {
      if (offset + 2 > footer) {
        throw new Error("truncated gzip extra");
      }
      offset += 2 + (bytes[offset] | bytes[offset + 1] << 8);
    }
    for (index = 0; index < 2; index += 1) {
      if (flags & (index === 0 ? 8 : 16)) {
        while (offset < footer && bytes[offset] !== 0) {
          offset += 1;
        }
        offset += 1;
      }
    }
    if (flags & 2) {
      if (offset + 2 > footer ||
          ((crcUpdate(-1, bytes.subarray(0, offset)) ^ -1) & 65535) !==
          (bytes[offset] | bytes[offset + 1] << 8)) {
        throw new Error("invalid gzip header checksum");
      }
      offset += 2;
    }
    if (offset >= footer) {
      throw new Error("truncated gzip header");
    }
  }

  function ungzip(bytes, limit) {
    var expected;
    var total = 0;
    var crc = -1;
    var chunks = [];
    var stream;
    var offset;
    var output;
    var index;
    if (!codec || !codec.Gunzip || !(bytes instanceof Uint8Array) ||
        !(limit >= 0) || limit > 4 * 1024 * 1024) {
      throw new Error("invalid gzip input or limit");
    }
    validateHeader(bytes);
    expected = uint32(bytes, bytes.length - 4);
    if (expected > limit) {
      throw new Error("decompressed gRPC message is too large");
    }
    stream = new codec.Gunzip(function (chunk) {
      total += chunk.length;
      if (total > limit || total > expected) {
        throw new Error("decompressed gRPC message is too large");
      }
      crc = crcUpdate(crc, chunk);
      if (chunk.length) {
        chunks.push(chunk);
      }
    });
    // A gRPC frame is a single compressed message. Unexpected extra members
    // are not partially decoded: the caller will keep the original response.
    stream.onmember = function () {
      throw new Error("multiple gzip members in one gRPC frame");
    };
    // Limit each inflate step as well as total output, even if ISIZE is forged.
    for (offset = 0; offset < bytes.length; offset += 1024) {
      stream.push(bytes.subarray(offset, offset + 1024), offset + 1024 >= bytes.length);
    }
    if (total !== expected || ((crc ^ -1) >>> 0) !== uint32(bytes, bytes.length - 8)) {
      throw new Error("invalid gzip length or checksum");
    }
    output = new Uint8Array(total);
    offset = 0;
    for (index = 0; index < chunks.length; index += 1) {
      output.set(chunks[index], offset);
      offset += chunks[index].length;
    }
    return output;
  }

  var api = { ungzip: ungzip };
  root.BiliGzip = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(this);
