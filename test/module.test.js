"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const cdn = require("../src/bilibili-cdn.js");

const root = path.resolve(__dirname, "..");
const moduleText = fs.readFileSync(
  path.join(root, "dist", "Bilibili.CDN.sgmodule"),
  "utf8",
);
const rules = fs.readFileSync(
  path.join(root, "dist", "Bilibili.list"),
  "utf8",
);
const candidateConfig = JSON.parse(
  fs.readFileSync(
    path.join(root, "config", "cdn-candidates.json"),
    "utf8",
  ),
);

test("generated module has routing, enhancement, CDN, and scoped MITM sections", () => {
  assert.match(moduleText, /\[Rule\]/);
  assert.match(moduleText, /RULE-SET,https:\/\/raw\.githubusercontent\.com\//);
  assert.match(moduleText, /\[Script\]/);
  assert.match(moduleText, /Bilibili Enhance JSON = type=http-response/);
  assert.match(moduleText, /Bilibili Enhance gRPC = type=http-response/);
  assert.match(moduleText, /Bilibili CDN JSON = type=http-response/);
  assert.match(moduleText, /Bilibili CDN gRPC = type=http-response/);
  assert.match(moduleText, /binary-body-mode=1/);
  assert.match(moduleText, /engine=webview/);
  assert.match(moduleText, /\[MITM\]/);
  assert.match(moduleText, /h2 = true/);
  assert.match(moduleText, /grpc\.biliapi\.net/);
  assert.match(moduleText, /api\.live\.bilibili\.com/);
  const mitmHostnameLine = moduleText
    .split(/\r?\n/)
    .find((line) => line.startsWith("hostname = "));
  assert.ok(mitmHostnameLine);
  assert.doesNotMatch(mitmHostnameLine, /bilivideo|acgvideo|akamaized/);
  assert.match(moduleText, /#!arguments=广告过滤:true,/);
  assert.match(moduleText, /界面精简:true/);
  assert.match(moduleText, /搜索推广:true/);
  assert.match(moduleText, /直播带货:true/);
  assert.match(moduleText, /"intervalHours":\{\{\{测速间隔\}\}\}/);
  assert.match(moduleText, /"switchThreshold":\{\{\{切换阈值\}\}\}/);
});

test("enhancement gRPC pattern is narrow and body processing is bounded", () => {
  const scriptLine = moduleText
    .split(/\r?\n/)
    .find((line) => line.startsWith("Bilibili Enhance gRPC = "));
  const match = scriptLine.match(/,pattern=(.+?),requires-body=1,/);
  assert.ok(match);
  const pattern = new RegExp(match[1]);

  for (const url of [
    "https://grpc.biliapi.net/bilibili.app.view.v1.View/View",
    "https://app.bilibili.com/bilibili.app.viewunite.v1.View/RelatesFeed",
    "https://grpc.biliapi.net/bilibili.app.dynamic.v2.Dynamic/DynAll",
    "https://grpc.biliapi.net/bilibili.polymer.app.search.v1.Search/SearchAll",
    "https://grpc.bilibili.com/bilibili.main.community.reply.v1.Reply/MainList",
  ]) {
    assert.match(url, pattern);
  }

  for (const url of [
    "https://grpc.biliapi.net/bilibili.app.playurl.v1.PlayURL/PlayView",
    "https://grpc.biliapi.net/bilibili.community.service.dm.v1.DM/DmView",
    "https://grpc.biliapi.net/bilibili.app.interface.v1.Teenagers/ModeStatus",
  ]) {
    assert.doesNotMatch(url, pattern);
  }
  assert.match(scriptLine, /max-size=1048576/);
  assert.match(scriptLine, /engine=webview/);
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

test("enhancement response pattern covers only reviewed API endpoints", () => {
  const scriptLine = moduleText
    .split(/\r?\n/)
    .find((line) => line.startsWith("Bilibili Enhance JSON = "));
  const match = scriptLine.match(/,pattern=(.+?),requires-body=1,/);
  assert.ok(match);
  const pattern = new RegExp(match[1]);

  for (const url of [
    "https://app.bilibili.com/x/v2/splash/show",
    "https://app.biliapi.net/x/v2/feed/index/story?device=phone",
    "https://app.bilibili.com/x/resource/show/tab/v2",
    "https://app.bilibili.com/x/v2/account/mine",
    "https://api.bilibili.com/x/v2/reply/main?oid=1",
    "https://api.bilibili.com/pgc/page/cinema/tab",
    "https://api.live.bilibili.com/xlive/app-room/v1/index/getInfoByRoom",
  ]) {
    assert.match(url, pattern);
  }

  for (const url of [
    "https://upos-sz-mirrorali.bilivideo.com/upgcxcode/video.m4s",
    "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo",
    "https://passport.bilibili.com/x/passport-login/web/login",
  ]) {
    assert.doesNotMatch(url, pattern);
  }
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

test("automatic CDN candidates match the reviewed configuration", () => {
  const configured = [
    ...candidateConfig.maintained,
    ...candidateConfig.supplemental,
  ];
  assert.deepEqual(cdn.AUTO_CDN_CANDIDATES, configured);
  assert.equal(new Set(configured).size, configured.length);
  assert.ok(configured.length >= 13);
  for (const hostname of configured) {
    assert.equal(cdn.normalizeCdnHost(hostname), hostname);
    assert.equal(cdn.isBilibiliMediaHost(hostname), true);
  }
});

test("all remote module resources use HTTPS", () => {
  const urls = moduleText.match(/https?:\/\/[^,\s]+/g) || [];
  assert.ok(urls.length >= 4);
  for (const url of urls) {
    assert.ok(url.startsWith("https://"), `non-HTTPS URL: ${url}`);
  }
});

test("generated scripts are local, non-empty, and checksummed", () => {
  const checksums = fs.readFileSync(
    path.join(root, "dist", "SHA256SUMS.txt"),
    "utf8",
  );
  for (const filename of [
    "bilibili-cdn.js",
    "bilibili-enhance.js",
  ]) {
    const content = fs.readFileSync(
      path.join(root, "dist", filename),
      "utf8",
    );
    assert.ok(content.length > 1000);
    assert.match(checksums, new RegExp(`  ${filename.replace(".", "\\.")}$`, "m"));
  }
});
