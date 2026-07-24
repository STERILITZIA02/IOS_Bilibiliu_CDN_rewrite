import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const checkOnly = process.argv.includes("--check");

const repository = "STERILITZIA02/IOS_Bilibiliu_CDN_rewrite";
const rawRoot = `https://raw.githubusercontent.com/${repository}/main`;
const homepage = `https://github.com/${repository}`;

const packageJson = JSON.parse(
  await readFile(path.join(rootDirectory, "package.json"), "utf8"),
);
const domains = JSON.parse(
  await readFile(path.join(rootDirectory, "config", "domains.json"), "utf8"),
);
const sourceScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-cdn.js"),
  "utf8",
);

function validateDomainList(name, values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
  const sorted = [...values].sort((left, right) => left.localeCompare(right));
  if (new Set(values).size !== values.length) {
    throw new Error(`${name} contains duplicate entries`);
  }
  if (JSON.stringify(sorted) !== JSON.stringify(values)) {
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

const moduleText = [
  "#!name=Bilibili CDN Switcher",
  "#!desc=哔哩哔哩点播 CDN 改写 + 视频、直播与 API 完整分流（iOS 26 / iOS 27）",
  `#!version=${packageJson.version}`,
  "#!author=STERILITZIA02",
  `#!homepage=${homepage}`,
  "#!icon=https://i0.hdslb.com/bfs/static/jinkela/long/images/512.png",
  "#!category=Bilibili",
  "#!arguments=CDN:upos-sz-mirrorali.bilivideo.com,分流策略:DIRECT,调试日志:false",
  "#!arguments-desc=CDN：点播视频目标主机；填写 off 可仅保留分流、不改写 CDN。\\n\\n分流策略：DIRECT 或现有配置中的策略组名称；境外用户可填写中国大陆节点组。\\n\\n调试日志：排错时临时设为 true。",
  "",
  "[Rule]",
  `RULE-SET,${rawRoot}/dist/Bilibili.list,{{{分流策略}}}`,
  "",
  "[Script]",
  `Bilibili CDN JSON = type=http-response,pattern=${jsonPattern},requires-body=1,max-size=4194304,timeout=10,engine=jsc,script-path=${rawRoot}/dist/bilibili-cdn.js,argument="{"cdn":"{{{CDN}}}","debug":{{{调试日志}}}}"`,
  `Bilibili CDN gRPC = type=http-response,pattern=${grpcPattern},requires-body=1,binary-body-mode=1,max-size=4194304,timeout=10,engine=webview,script-path=${rawRoot}/dist/bilibili-cdn.js,argument="{"cdn":"{{{CDN}}}","debug":{{{调试日志}}}}"`,
  "",
  "[MITM]",
  "h2 = true",
  "hostname = %APPEND% api.bilibili.com, app.bilibili.com, interface.bilibili.com, api.biliapi.net, app.biliapi.net, grpc.biliapi.net",
  "",
].join("\n");

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

const outputs = new Map([
  ["dist/Bilibili.CDN.sgmodule", moduleText],
  ["dist/Bilibili.list", ruleList],
  ["dist/bilibili-cdn.js", sourceScript],
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
