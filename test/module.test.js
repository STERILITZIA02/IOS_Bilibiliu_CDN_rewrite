"use strict";

const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const cdn = require("../src/bilibili-cdn.js");

const root = path.resolve(__dirname, "..");
const compatibilityModule = fs.readFileSync(
  path.join(root, "dist", "Bilibili.CDN.sgmodule"),
  "utf8",
);
const enhancedModule = fs.readFileSync(
  path.join(root, "dist", "Bilibili.CDN.Enhanced.sgmodule"),
  "utf8",
);
const cdnOnlyModule = fs.readFileSync(
  path.join(root, "dist", "Bilibili.CDN.Switcher.sgmodule"),
  "utf8",
);
const moduleText = enhancedModule;
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
const cdnSource = fs.readFileSync(
  path.join(root, "src", "bilibili-cdn.js"),
  "utf8",
);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const releaseWorkflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "release.yml"),
  "utf8",
);

test("generated Enhanced and CDN-only modules are independently functional", () => {
  assert.equal(compatibilityModule, enhancedModule);
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
  assert.match(moduleText, /会员营销:true/);
  assert.match(moduleText, /隐藏我的钱包:false/);
  assert.match(moduleText, /隐藏设置:false/);
  assert.match(moduleText, /PCDN策略:DIRECT/);
  assert.match(moduleText, /网络档案:auto/);
  assert.match(
    moduleText,
    /DOMAIN-WILDCARD,\*pcdn\*\.biliapi\.net,\{\{\{PCDN策略\}\}\}/,
  );
  assert.doesNotMatch(moduleText, /DOMAIN-SUFFIX,mcdn\.bilivideo\.cn,REJECT/);
  assert.match(moduleText, /"networkProfile":"\{\{\{网络档案\}\}\}"/);
  assert.match(moduleText, /"intervalHours":\{\{\{测速间隔\}\}\}/);
  assert.match(moduleText, /"switchThreshold":\{\{\{切换阈值\}\}\}/);
  assert.match(moduleText, /"hideMineWallet":\{\{\{隐藏我的钱包\}\}\}/);
  assert.match(moduleText, /"hideMoreSettings":\{\{\{隐藏设置\}\}\}/);

  assert.match(cdnOnlyModule, /^#!name=Bilibili CDN Switcher$/m);
  assert.match(cdnOnlyModule, /\[Rule\]/);
  assert.match(cdnOnlyModule, /Bilibili CDN JSON = type=http-response/);
  assert.match(cdnOnlyModule, /Bilibili CDN gRPC = type=http-response/);
  assert.doesNotMatch(cdnOnlyModule, /Bilibili Enhance/);
  assert.doesNotMatch(cdnOnlyModule, /广告过滤|界面精简|隐藏我的钱包/);
  const cdnMitmHostnameLine = cdnOnlyModule
    .split(/\r?\n/)
    .find((line) => line.startsWith("hostname = "));
  assert.ok(cdnMitmHostnameLine);
  assert.doesNotMatch(cdnMitmHostnameLine, /api\.live\.bilibili\.com/);
  assert.doesNotMatch(
    cdnMitmHostnameLine,
    /bilivideo|acgvideo|akamaized/,
  );
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
    "https://grpc.bilibili.com/bilibili.app.playurl.v1.PlayURL/PlayView",
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
    "https://api.bilibili.com/x/vip/web/vip_center/combine",
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

test("fixed-mode CDN guidance matches the reviewed configuration", () => {
  const configured = [
    ...candidateConfig.maintained,
    ...candidateConfig.supplemental,
  ];
  assert.deepEqual(cdn.FIXED_CDN_CANDIDATES, configured);
  assert.equal(new Set(configured).size, configured.length);
  assert.ok(configured.length >= 13);
  for (const hostname of configured) {
    assert.equal(cdn.normalizeCdnHost(hostname), hostname);
    assert.equal(cdn.isBilibiliMediaHost(hostname), true);
  }
});

test("safe auto uses server-provided URLs, GET Range validation, and bounded state", () => {
  assert.doesNotMatch(cdnSource, /function selectAutoCdn|\.benchmark\(/);
  assert.match(cdnSource, /Range: "bytes=0-" \+ AUTO_RANGE_END/);
  assert.match(cdnSource, /status !== 206/);
  assert.match(cdnSource, /AUTO_CACHE_CAPACITY = 64/);
  assert.match(cdnSource, /AUTO_GLOBAL_PROBE_GAP_MS = 2 \* 60 \* 1000/);
  assert.match(cdnSource, /descriptor\.candidates\.slice\(1\)/);
  assert.match(cdnSource, /queryFreeCandidateFingerprint/);
});

test("all remote module resources use HTTPS", () => {
  for (const generatedModule of [enhancedModule, cdnOnlyModule]) {
    const urls = generatedModule.match(/https?:\/\/[^,\s]+/g) || [];
    assert.ok(urls.length >= 3);
    for (const url of urls) {
      assert.ok(url.startsWith("https://"), `non-HTTPS URL: ${url}`);
    }
  }
});

test("generated artifacts are local, non-empty, and checksummed", () => {
  const checksums = fs.readFileSync(
    path.join(root, "dist", "SHA256SUMS.txt"),
    "utf8",
  );
  for (const filename of [
    "Bilibili.CDN.sgmodule",
    "Bilibili.CDN.Enhanced.sgmodule",
    "Bilibili.CDN.Switcher.sgmodule",
    "Bilibili.list",
    "bilibili-cdn.js",
    "bilibili-enhance.js",
    "module-options.json",
  ]) {
    const content = fs.readFileSync(
      path.join(root, "dist", filename),
      "utf8",
    );
    assert.ok(content.length > 1000);
    const expected = createHash("sha256").update(content).digest("hex");
    assert.match(
      checksums,
      new RegExp(`^${expected}  ${filename.replace(".", "\\.")}$`, "m"),
    );
  }
});

test("published module option catalog matches the reviewed source schema", () => {
  const sourceCatalog = JSON.parse(
    fs.readFileSync(
      path.join(root, "config", "module-options.json"),
      "utf8",
    ),
  );
  const publishedCatalog = JSON.parse(
    fs.readFileSync(
      path.join(root, "dist", "module-options.json"),
      "utf8",
    ),
  );
  assert.deepEqual(publishedCatalog, sourceCatalog);
  assert.equal(
    new Set(publishedCatalog.options.map((option) => option.key)).size,
    publishedCatalog.options.length,
  );
  assert.ok(
    publishedCatalog.options.every(
      (option) =>
        option.variants.includes("cdn") ||
        option.variants.includes("enhanced"),
    ),
  );
});

test("release metadata and workflow publish every runtime artifact", () => {
  assert.match(moduleText, new RegExp(`^#!version=${packageJson.version}$`, "m"));
  assert.match(
    fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8"),
    new RegExp(`^## \\[${packageJson.version.replaceAll(".", "\\.")}\\]`, "m"),
  );
  for (const filename of [
    "Bilibili.CDN.sgmodule",
    "Bilibili.CDN.Enhanced.sgmodule",
    "Bilibili.CDN.Switcher.sgmodule",
    "Bilibili.list",
    "bilibili-cdn.js",
    "bilibili-enhance.js",
    "module-options.json",
    "SHA256SUMS.txt",
  ]) {
    assert.match(
      releaseWorkflow,
      new RegExp(`dist/${filename.replaceAll(".", "\\.")}`),
    );
  }
  assert.ok(fs.existsSync(path.join(root, "THIRD_PARTY_NOTICES.md")));
  assert.ok(fs.existsSync(path.join(root, "docs", "DEVICE_ACCEPTANCE.md")));
  assert.match(releaseWorkflow, /--verify-tag/);
  assert.match(releaseWorkflow, /--fail-on-no-commits/);
  assert.match(releaseWorkflow, /Real-device iOS 26\/27 acceptance/);
});
