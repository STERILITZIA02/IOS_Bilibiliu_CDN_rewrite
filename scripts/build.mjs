import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const checkOnly = process.argv.includes("--check");
const require = createRequire(import.meta.url);

const repository = "STERILITZIA02/IOS_Bilibiliu_CDN_rewrite";
const rawRoot = `https://raw.githubusercontent.com/${repository}/main`;
const homepage = `https://github.com/${repository}`;

const packageJson = JSON.parse(
  await readFile(path.join(rootDirectory, "package.json"), "utf8"),
);
const domains = JSON.parse(
  await readFile(path.join(rootDirectory, "config", "domains.json"), "utf8"),
);
const candidateConfig = JSON.parse(
  await readFile(
    path.join(rootDirectory, "config", "cdn-candidates.json"),
    "utf8",
  ),
);
const sourceScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-cdn.js"),
  "utf8",
);
const enhanceScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-enhance.js"),
  "utf8",
);

function validateDomainList(name, values, requireSorted = true) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
  const sorted = [...values].sort((left, right) => left.localeCompare(right));
  if (new Set(values).size !== values.length) {
    throw new Error(`${name} contains duplicate entries`);
  }
  if (requireSorted && JSON.stringify(sorted) !== JSON.stringify(values)) {
    throw new Error(`${name} must remain sorted`);
  }
  for (const value of values) {
    if (
      typeof value !== "string" ||
      value.length > 253 ||
      !/^[a-z0-9.-]+$/.test(value) ||
      !value.includes(".")
    ) {
      throw new Error(`${name} contains invalid domain: ${String(value)}`);
    }
  }
}

validateDomainList("domains.exact", domains.exact);
validateDomainList("domains.suffix", domains.suffix);
validateDomainList(
  "cdnCandidates.maintained",
  candidateConfig.maintained,
  false,
);
validateDomainList(
  "cdnCandidates.supplemental",
  candidateConfig.supplemental,
  false,
);

const configuredCandidates = [
  ...candidateConfig.maintained,
  ...candidateConfig.supplemental,
];
if (new Set(configuredCandidates).size !== configuredCandidates.length) {
  throw new Error("CDN candidate groups contain duplicate hosts");
}

const sourceApi = require(path.join(rootDirectory, "src", "bilibili-cdn.js"));
if (
  JSON.stringify(sourceApi.AUTO_CDN_CANDIDATES) !==
  JSON.stringify(configuredCandidates)
) {
  throw new Error(
    "config/cdn-candidates.json and AUTO_CDN_CANDIDATES are out of sync",
  );
}

const ruleList = [
  "# NAME: Bilibili",
  `# VERSION: ${packageJson.version}`,
  `# REPO: ${homepage}`,
  "# PURPOSE: Core Bilibili, video CDN, live CDN, API, and static-resource routing",
  "",
  ...domains.exact.map((domain) => `DOMAIN,${domain}`),
  ...domains.suffix.map((domain) => `DOMAIN-SUFFIX,${domain}`),
  "",
].join("\n");

const jsonPattern =
  String.raw`^https?:\/\/(?:(?:api|app)\.(?:bilibili\.com|biliapi\.net)|interface\.bilibili\.com)\/(?:x\/(?:player\/(?:wbi\/)?playurl(?:v2)?|v2\/playurl)|pgc\/player\/(?:api\/playurl(?:proj)?|web\/(?:v2\/)?playurl(?:\/html5)?)|pugv\/player\/(?:api|web)\/playurl|v2\/playurl)(?:\?|$)`;
const grpcPattern =
  String.raw`^https?:\/\/(?:grpc\.biliapi\.net|app\.(?:bilibili\.com|biliapi\.net))\/(?:bilibili\.app\.playerunite\.v1\.Player\/PlayViewUnite|bilibili\.app\.playurl\.v1\.PlayURL\/PlayView|bilibili\.pgc\.gateway\.player\.v2\.PlayURL\/PlayView)(?:\?|$)`;
const enhancePattern =
  String.raw`^https?:\/\/(?:(?:app\.bilibili\.com|app\.biliapi\.net)\/(?:x\/v2\/(?:splash\/(?:brand\/list|event\/list2|list|show)|feed\/index(?:\/story)?|search(?:\/square|\/type)?|view|account\/mine(?:\/ipad)?)|x\/resource\/show\/tab\/v2)|(?:api\.bilibili\.com|api\.biliapi\.net)\/(?:pgc\/page\/(?:bangumi|cinema\/tab)|x\/web-interface\/(?:wbi\/)?index\/top\/feed\/rcmd|x\/v2\/reply\/main)|api\.live\.bilibili\.com\/xlive\/app-room\/v1\/index\/getInfoByRoom)(?:\?|$)`;
const enhanceGrpcPattern =
  String.raw`^https?:\/\/(?:(?:grpc|app)\.bilibili\.com|(?:grpc|app)\.biliapi\.net)\/(?:bilibili\.app\.(?:view\.v1\.View\/(?:View|RelatesFeed)|viewunite\.v1\.View\/(?:View|RelatesFeed)|dynamic\.v2\.Dynamic\/DynAll)|bilibili\.polymer\.app\.search\.v1\.Search\/SearchAll|bilibili\.main\.community\.reply\.v1\.Reply\/MainList)(?:\?|$)`;

const moduleText = [
  "#!name=Bilibili CDN Switcher",
  "#!desc=哔哩哔哩低频自动测速选 CDN + 视频、直播与 API 完整分流（iOS 26 / iOS 27）",
  `#!version=${packageJson.version}`,
  "#!author=STERILITZIA02",
  `#!homepage=${homepage}`,
  "#!icon=https://i0.hdslb.com/bfs/static/jinkela/long/images/512.png",
  "#!category=Bilibili",
  "#!arguments=广告过滤:true,界面精简:true,搜索推广:true,直播带货:true,CDN:auto,分流策略:DIRECT,测速间隔:12,切换阈值:20,调试日志:false",
  "#!arguments-desc=广告过滤：处理明确广告字段与卡片，未知结构保留。\\n\\n界面精简：移除指定首页导航和“我的”营销入口，不修改账号或会员状态。\\n\\n搜索推广：移除搜索推广词；关闭后保留。\\n\\n直播带货：隐藏直播购物卡片；关闭后保留。\\n\\nCDN：auto 为自动测速选择；也可填写固定点播主机，或填写 off 仅保留分流。\\n\\n分流策略：DIRECT、PROXY 或现有策略组名称。\\n\\n测速间隔：6-72 小时，默认 12；每轮最多测试 6 个候选。\\n\\n切换阈值：新线路至少快多少百分比才切换，默认 20；正常线路至少保持 24 小时。\\n\\n调试日志：排错时临时设为 true。",
  "",
  "[Rule]",
  `RULE-SET,${rawRoot}/dist/Bilibili.list,{{{分流策略}}}`,
  "",
  "[Script]",
  `Bilibili Enhance JSON = type=http-response,pattern=${enhancePattern},requires-body=1,max-size=4194304,timeout=8,engine=jsc,script-path=${rawRoot}/dist/bilibili-enhance.js,argument="{"ads":{{{广告过滤}}},"ui":{{{界面精简}}},"searchPromotions":{{{搜索推广}}},"liveShopping":{{{直播带货}}},"debug":{{{调试日志}}}}"`,
  `Bilibili Enhance gRPC = type=http-response,pattern=${enhanceGrpcPattern},requires-body=1,binary-body-mode=1,max-size=1048576,timeout=8,engine=webview,script-path=${rawRoot}/dist/bilibili-enhance.js,argument="{"ads":{{{广告过滤}}},"ui":{{{界面精简}}},"searchPromotions":{{{搜索推广}}},"liveShopping":{{{直播带货}}},"debug":{{{调试日志}}}}"`,
  `Bilibili CDN JSON = type=http-response,pattern=${jsonPattern},requires-body=1,max-size=4194304,timeout=10,engine=jsc,script-path=${rawRoot}/dist/bilibili-cdn.js,argument="{"cdn":"{{{CDN}}}","intervalHours":{{{测速间隔}}},"switchThreshold":{{{切换阈值}}},"debug":{{{调试日志}}}}"`,
  `Bilibili CDN gRPC = type=http-response,pattern=${grpcPattern},requires-body=1,binary-body-mode=1,max-size=4194304,timeout=10,engine=webview,script-path=${rawRoot}/dist/bilibili-cdn.js,argument="{"cdn":"{{{CDN}}}","intervalHours":{{{测速间隔}}},"switchThreshold":{{{切换阈值}}},"debug":{{{调试日志}}}}"`,
  "",
  "[MITM]",
  "h2 = true",
  "hostname = %APPEND% api.bilibili.com, app.bilibili.com, interface.bilibili.com, api.biliapi.net, app.biliapi.net, grpc.bilibili.com, grpc.biliapi.net, api.live.bilibili.com",
  "",
].join("\n");

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

const outputs = new Map([
  ["dist/Bilibili.CDN.sgmodule", moduleText],
  ["dist/Bilibili.list", ruleList],
  ["dist/bilibili-cdn.js", sourceScript],
  ["dist/bilibili-enhance.js", enhanceScript],
]);

const checksums = [...outputs.entries()]
  .map(([relativePath, content]) => {
    const filename = path.basename(relativePath);
    return `${sha256(content)}  ${filename}`;
  })
  .join("\n")
  .concat("\n");
outputs.set("dist/SHA256SUMS.txt", checksums);

let hasMismatch = false;
for (const [relativePath, expected] of outputs) {
  const absolutePath = path.join(rootDirectory, relativePath);
  if (checkOnly) {
    let actual;
    try {
      actual = await readFile(absolutePath, "utf8");
    } catch {
      actual = null;
    }
    if (actual !== expected) {
      console.error(`Generated file is stale: ${relativePath}`);
      hasMismatch = true;
    }
  } else {
    await writeFile(absolutePath, expected, "utf8");
    console.log(`Wrote ${relativePath}`);
  }
}

if (hasMismatch) {
  console.error("Run `npm run build` and commit the regenerated files.");
  process.exitCode = 1;
}
