"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const cdn = require("../src/bilibili-cdn.js");

const originalHost = "upos-sz-mirrorcosov.bilivideo.com";
const targetHost = "upos-sz-mirrorali.bilivideo.com";
const vodPath =
  "/upgcxcode/31/21/62131/video.m4s?deadline=1784897148&bvc=vod";
const originalUrl = `https://${originalHost}${vodPath}`;
const backupUrl = `https://upos-hz-mirrorakam.akamaized.net${vodPath}`;
const liveUrl =
  "https://d1--ov-gotcha105.bilivideo.com/live-bvc/757333/live_demo.m3u8?cdn=ov-gotcha105";
const config = cdn.parseArgument(
  JSON.stringify({ cdn: targetHost, debug: false }),
);

function bytes(...chunks) {
  const normalized = chunks.map((chunk) =>
    chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk),
  );
  return cdn.concatBytes(normalized);
}

function fieldTag(fieldNumber, wireType) {
  return cdn.encodeVarint(fieldNumber * 8 + wireType);
}

function stringField(fieldNumber, value) {
  const body = cdn.asciiStringToBytes(value);
  return bytes(fieldTag(fieldNumber, 2), cdn.encodeVarint(body.length), body);
}

function messageField(fieldNumber, message) {
  return bytes(
    fieldTag(fieldNumber, 2),
    cdn.encodeVarint(message.length),
    message,
  );
}

function grpcFrame(payload, flag = 0) {
  const header = new Uint8Array(5);
  header[0] = flag;
  header[1] = Math.floor(payload.length / 0x1000000) & 0xff;
  header[2] = Math.floor(payload.length / 0x10000) & 0xff;
  header[3] = Math.floor(payload.length / 0x100) & 0xff;
  header[4] = payload.length & 0xff;
  return bytes(header, payload);
}

function asciiFromBinary(value) {
  return Buffer.from(value).toString("latin1");
}

test("normalizes a hostname or an HTTPS URL", () => {
  assert.equal(cdn.normalizeCdnHost(targetHost.toUpperCase()), targetHost);
  assert.equal(
    cdn.normalizeCdnHost(`https://${targetHost}/`),
    targetHost,
  );
  assert.equal(cdn.normalizeCdnHost("off"), "");
  assert.equal(cdn.normalizeCdnHost("https://bad host/"), null);
  assert.equal(cdn.normalizeCdnHost("127.0.0.1"), null);
});

test("parses module JSON arguments and fails closed on invalid hosts", () => {
  assert.deepEqual(config, {
    cdnHost: targetHost,
    debug: false,
    valid: true,
  });
  assert.deepEqual(cdn.parseArgument("cdn=off&debug=true"), {
    cdnHost: "",
    debug: true,
    valid: true,
  });
  assert.deepEqual(cdn.parseArgument('{"cdn":"bad host","debug":true}'), {
    cdnHost: null,
    debug: true,
    valid: false,
  });
  assert.deepEqual(cdn.parseArgument("cdn=%"), {
    cdnHost: null,
    debug: false,
    valid: false,
  });
});

test("rewrites only Bilibili VOD media URLs", () => {
  assert.equal(
    cdn.rewriteVodUrl(originalUrl, targetHost),
    `https://${targetHost}${vodPath}`,
  );
  assert.equal(cdn.rewriteVodUrl(liveUrl, targetHost), liveUrl);
  assert.equal(
    cdn.rewriteVodUrl(
      "https://example.com/upgcxcode/31/21/file.m4s?bvc=vod",
      targetHost,
    ),
    "https://example.com/upgcxcode/31/21/file.m4s?bvc=vod",
  );
});

test("rewrites DASH, DURL, and nested PGC JSON without replacing backups", () => {
  const fixture = {
    code: 0,
    data: {
      dash: {
        video: [
          {
            baseUrl: originalUrl,
            base_url: originalUrl,
            backupUrl: [backupUrl],
            backup_url: [backupUrl],
          },
        ],
        audio: [{ base_url: originalUrl, backup_url: [backupUrl] }],
      },
      durl: [{ url: originalUrl, backup_url: [backupUrl] }],
    },
    result: {
      video_info: {
        dash: {
          video: [{ base_url: originalUrl }],
          audio: [],
        },
      },
    },
  };

  const result = cdn.transformJsonText(JSON.stringify(fixture), config);
  const output = JSON.parse(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 5);
  assert.match(output.data.dash.video[0].baseUrl, new RegExp(targetHost));
  assert.match(output.data.dash.video[0].base_url, new RegExp(targetHost));
  assert.match(output.data.dash.audio[0].base_url, new RegExp(targetHost));
  assert.match(output.data.durl[0].url, new RegExp(targetHost));
  assert.match(
    output.result.video_info.dash.video[0].base_url,
    new RegExp(targetHost),
  );
  assert.equal(output.data.dash.video[0].backupUrl[0], backupUrl);
  assert.equal(output.data.dash.video[0].backup_url[0], backupUrl);
});

test("leaves current signed live stream JSON unchanged", () => {
  const fixture = {
    code: 0,
    data: {
      playurl_info: {
        playurl: {
          stream: [
            {
              protocol_name: "http_hls",
              format: [
                {
                  format_name: "fmp4",
                  codec: [
                    {
                      base_url: "/live-bvc/1/live_demo/index.m3u8?",
                      url_info: [
                        {
                          host: "https://d1--ov-gotcha207.bilivideo.com",
                          extra: "expires=1784893489&cdn=ov-gotcha207",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  };
  const input = JSON.stringify(fixture);
  const result = cdn.transformJsonText(input, config);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 0);
  assert.equal(result.body, input);
});

test("fails open when a response is not JSON", () => {
  const input = "<html>upstream error</html>";
  const result = cdn.transformJsonText(input, config);
  assert.equal(result.valid, false);
  assert.equal(result.changed, 0);
  assert.equal(result.body, input);
});

test("rewrites deeply nested Protobuf URL strings and updates lengths", () => {
  // PlayViewUniteReply.vod_info.stream_list.dash_video:
  // reply(1) -> vod(5) -> stream(2) -> DashVideo(base_url=1, backup_url=2)
  const dashVideo = bytes(
    stringField(1, originalUrl),
    stringField(2, backupUrl),
    bytes(fieldTag(3, 0), cdn.encodeVarint(123456)),
  );
  const stream = messageField(2, dashVideo);
  const vodInfo = messageField(5, stream);
  const reply = messageField(1, vodInfo);
  const framed = grpcFrame(reply);

  const result = cdn.transformGrpcBody(framed, config);
  const output = asciiFromBinary(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 1);
  assert.equal(output.includes(originalHost), false);
  assert.equal(output.includes("upos-hz-mirrorakam.akamaized.net"), true);
  assert.equal(output.split(targetHost).length - 1, 1);

  const declaredLength =
    result.body[1] * 0x1000000 +
    result.body[2] * 0x10000 +
    result.body[3] * 0x100 +
    result.body[4];
  assert.equal(declaredLength, result.body.length - 5);
});

test("rewrites segmented primary URLs while preserving Protobuf backups", () => {
  const responseUrl = bytes(
    bytes(fieldTag(1, 0), cdn.encodeVarint(1)),
    stringField(4, originalUrl),
    stringField(5, backupUrl),
  );
  const result = cdn.transformGrpcBody(grpcFrame(responseUrl), config);
  const output = asciiFromBinary(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 1);
  assert.equal(output.includes(originalHost), false);
  assert.equal(output.includes(targetHost), true);
  assert.equal(output.includes("upos-hz-mirrorakam.akamaized.net"), true);
});

test("supports multiple gRPC frames and leaves compressed frames untouched", () => {
  const uncompressedPayload = stringField(1, originalUrl);
  const compressedPayload = stringField(1, originalUrl);
  const input = bytes(
    grpcFrame(uncompressedPayload, 0),
    grpcFrame(compressedPayload, 1),
  );

  const result = cdn.transformGrpcBody(input, config);
  const output = asciiFromBinary(result.body);

  assert.equal(result.valid, true);
  assert.equal(result.changed, 1);
  assert.equal(output.split(targetHost).length - 1, 1);
  assert.equal(output.split(originalHost).length - 1, 1);
});

test("does not alter signed live URLs inside Protobuf", () => {
  const input = grpcFrame(stringField(4, liveUrl));
  const result = cdn.transformGrpcBody(input, config);
  assert.equal(result.valid, true);
  assert.equal(result.changed, 0);
  assert.deepEqual(Buffer.from(result.body), Buffer.from(input));
});

test("fails open for malformed gRPC and Protobuf bodies", () => {
  const malformed = new Uint8Array([0, 0, 0, 0, 20, 8, 1]);
  const result = cdn.transformGrpcBody(malformed, config);
  assert.equal(result.changed, 0);
  assert.equal(result.valid, false);
  assert.deepEqual(Buffer.from(result.body), Buffer.from(malformed));
});

test("Shadowrocket entrypoint returns only the changed JSON body", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "bilibili-cdn.js"),
    "utf8",
  );
  let completion;
  const context = {
    $argument: JSON.stringify({ cdn: targetHost, debug: false }),
    $done(value) {
      completion = value;
    },
    $request: {
      url: "https://api.bilibili.com/x/player/playurl?bvid=test",
    },
    $response: {
      body: JSON.stringify({ code: 0, data: { durl: [{ url: originalUrl }] } }),
    },
    ArrayBuffer,
    Boolean,
    console,
    decodeURIComponent,
    JSON,
    Math,
    Number,
    Object,
    RegExp,
    String,
    Uint8Array,
  };

  vm.runInNewContext(source, context, { filename: "bilibili-cdn.js" });
  assert.ok(completion && typeof completion.body === "string");
  assert.match(completion.body, new RegExp(targetHost));
});
