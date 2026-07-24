"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const moduleText = fs.readFileSync(
  path.join(root, "dist", "Bilibili.CDN.sgmodule"),
  "utf8",
);
const rules = fs.readFileSync(
  path.join(root, "dist", "Bilibili.list"),
  "utf8",
);

test("generated module has routing, JSON, gRPC, and scoped MITM sections", () => {
  assert.match(moduleText, /\[Rule\]/);
  assert.match(moduleText, /RULE-SET,https:\/\/raw\.githubusercontent\.com\//);
  assert.match(moduleText, /\[Script\]/);
  assert.match(moduleText, /Bilibili CDN JSON = type=http-response/);
  assert.match(moduleText, /Bilibili CDN gRPC = type=http-response/);
  assert.match(moduleText, /binary-body-mode=1/);
  assert.match(moduleText, /engine=webview/);
  assert.match(moduleText, /\[MITM\]/);
  assert.match(moduleText, /h2 = true/);
  assert.match(moduleText, /grpc\.biliapi\.net/);
  assert.doesNotMatch(moduleText, /api\.live\.bilibili\.com/);
});

test("generated response patterns compile and cover current playback APIs", () => {
  const scriptLines = moduleText
    .split(/\r?\n/)
    .filter((line) => /^Bilibili CDN (?:JSON|gRPC) = /.test(line));
  assert.equal(scriptLines.length, 2);

  const patterns = scriptLines.map((line) => {
    const match = line.match(/,pattern=(.+?),requires-body=1,/);
    assert.ok(match, `missing pattern in ${line}`);
    return new RegExp(match[1]);
  });
  const [jsonPattern, grpcPattern] = patterns;

  for (const url of [
    "https://api.bilibili.com/x/player/playurl?bvid=test",
    "https://api.bilibili.com/x/player/wbi/playurl?bvid=test",
    "https://api.bilibili.com/pgc/player/web/v2/playurl?ep_id=1",
    "https://app.biliapi.net/pugv/player/api/playurl?avid=1",
  ]) {
    assert.match(url, jsonPattern);
  }

  for (const url of [
    "https://grpc.biliapi.net/bilibili.app.playerunite.v1.Player/PlayViewUnite",
    "https://app.bilibili.com/bilibili.app.playurl.v1.PlayURL/PlayView",
    "https://app.biliapi.net/bilibili.pgc.gateway.player.v2.PlayURL/PlayView",
  ]) {
    assert.match(url, grpcPattern);
  }

  assert.doesNotMatch(
    "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo",
    jsonPattern,
  );
});

test("rule set covers main, API, VOD CDN, live CDN, and static domains", () => {
  for (const line of [
    "DOMAIN-SUFFIX,bilibili.com",
    "DOMAIN-SUFFIX,biliapi.net",
    "DOMAIN-SUFFIX,bilivideo.com",
    "DOMAIN-SUFFIX,acgvideo.com",
    "DOMAIN-SUFFIX,hdslb.com",
  ]) {
    assert.ok(rules.includes(line), `missing ${line}`);
  }
});

test("all remote module resources use HTTPS", () => {
  const urls = moduleText.match(/https?:\/\/[^,\s]+/g) || [];
  assert.ok(urls.length >= 4);
  for (const url of urls) {
    assert.ok(url.startsWith("https://"), `non-HTTPS URL: ${url}`);
  }
});
