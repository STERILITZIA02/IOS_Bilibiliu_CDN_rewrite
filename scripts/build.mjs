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

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(path.join(rootDirectory, relativePath), "utf8"),
  );
}

const packageJson = await readJson("package.json");
const assetVersion = encodeURIComponent(packageJson.version);
const domains = await readJson("config/domains.json");
const candidateConfig = await readJson("config/cdn-candidates.json");
const moduleOptions = await readJson("config/module-options.json");
const sourceScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-cdn.js"),
  "utf8",
);
const benchmarkScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-cdn-benchmark.js"),
  "utf8",
);
const enhanceScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-enhance.js"),
  "utf8",
);
const refreshScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-refresh.js"),
  "utf8",
);

function validateDomainList(name, values, requireSorted = true) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
  const sorted = [...values].sort((left, right) =>
    left.localeCompare(right),
  );
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

function validateModuleOptions(schema, enhanceApi) {
  if (
    !schema ||
    schema.schemaVersion !== 1 ||
    !Array.isArray(schema.groups) ||
    !Array.isArray(schema.options)
  ) {
    throw new Error("config/module-options.json has an invalid schema");
  }

  const groupIds = new Set();
  for (const group of schema.groups) {
    if (
      !group ||
      typeof group.id !== "string" ||
      !group.id ||
      typeof group.title !== "string" ||
      !group.title ||
      typeof group.surface !== "string" ||
      !group.surface ||
      groupIds.has(group.id)
    ) {
      throw new Error("module option groups must be unique and complete");
    }
    groupIds.add(group.id);
  }

  const keys = new Set();
  const argumentsSeen = new Set();
  const supportedTypes = new Set(["boolean", "number", "string"]);
  const supportedVariants = new Set(["cdn", "enhanced"]);

  for (const option of schema.options) {
    if (
      !option ||
      typeof option.key !== "string" ||
      !/^[A-Za-z][A-Za-z0-9]*$/.test(option.key) ||
      keys.has(option.key)
    ) {
      throw new Error(`invalid or duplicate module option key: ${option?.key}`);
    }
    if (
      typeof option.argument !== "string" ||
      !option.argument ||
      /[,\r\n:]/.test(option.argument) ||
      argumentsSeen.has(option.argument)
    ) {
      throw new Error(
        `invalid or duplicate Shadowrocket argument: ${option.argument}`,
      );
    }
    if (
      !groupIds.has(option.group) ||
      typeof option.label !== "string" ||
      !option.label ||
      typeof option.description !== "string" ||
      !option.description ||
      !supportedTypes.has(option.type)
    ) {
      throw new Error(`module option ${option.key} is incomplete`);
    }
    if (
      !Array.isArray(option.variants) ||
      option.variants.length === 0 ||
      option.variants.some((variant) => !supportedVariants.has(variant))
    ) {
      throw new Error(`module option ${option.key} has invalid variants`);
    }
    if (option.type === "boolean" && typeof option.default !== "boolean") {
      throw new Error(`${option.key} must have a boolean default`);
    }
    if (
      option.type === "number" &&
      (
        !Number.isFinite(option.default) ||
        !Number.isFinite(option.minimum) ||
        !Number.isFinite(option.maximum) ||
        option.minimum > option.maximum ||
        option.default < option.minimum ||
        option.default > option.maximum
      )
    ) {
      throw new Error(`${option.key} has an invalid numeric range`);
    }
    if (
      option.type === "string" &&
      (
        typeof option.default !== "string" ||
        /[,\r\n]/.test(option.default)
      )
    ) {
      throw new Error(`${option.key} must have a safe string default`);
    }
    keys.add(option.key);
    argumentsSeen.add(option.argument);
  }

  const sourceUiDefaults = enhanceApi.UI_OPTION_DEFAULTS;
  if (!sourceUiDefaults || typeof sourceUiDefaults !== "object") {
    throw new Error("bilibili-enhance.js must export UI_OPTION_DEFAULTS");
  }
  const schemaUiDefaults = Object.fromEntries(
    schema.options
      .filter((option) => option.key.startsWith("hide"))
      .map((option) => [option.key, option.default]),
  );
  if (
    JSON.stringify(Object.keys(schemaUiDefaults).sort()) !==
      JSON.stringify(Object.keys(sourceUiDefaults).sort()) ||
    Object.keys(schemaUiDefaults).some(
      (key) => schemaUiDefaults[key] !== sourceUiDefaults[key],
    )
  ) {
    throw new Error(
      "module-options UI defaults and bilibili-enhance.js are out of sync",
    );
  }

  const requiredKeys = [
    "ads",
    "homeFeedVideoOnly",
    "videoOnlyRecommendations",
    "ui",
    "searchPromotions",
    "liveShopping",
    "vipPromotions",
    "cdn",
    "routingPolicy",
    "pcdnPolicy",
    "networkProfile",
    "probeMode",
    "resetToken",
    "intervalHours",
    "switchThreshold",
    "debug",
  ];
  for (const key of requiredKeys) {
    if (!keys.has(key)) {
      throw new Error(`module option ${key} is required`);
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
const enhanceApi = require(
  path.join(rootDirectory, "src", "bilibili-enhance.js"),
);
if (
  JSON.stringify(sourceApi.FIXED_CDN_CANDIDATES) !==
  JSON.stringify(configuredCandidates)
) {
  throw new Error(
    "config/cdn-candidates.json and FIXED_CDN_CANDIDATES are out of sync",
  );
}
validateModuleOptions(moduleOptions, enhanceApi);

for (const [key, limits] of Object.entries(
  sourceApi.RUNTIME_OPTION_LIMITS || {},
)) {
  const option = moduleOptions.options.find((entry) => entry.key === key);
  if (
    !option ||
    option.type !== "number" ||
    option.default !== limits.defaultValue ||
    option.minimum !== limits.minimum ||
    option.maximum !== limits.maximum
  ) {
    throw new Error(
      `module-options ${key} default/range and bilibili-cdn.js are out of sync`,
    );
  }
}

const optionByKey = new Map(
  moduleOptions.options.map((option) => [option.key, option]),
);

function optionsForVariant(variant) {
  return moduleOptions.options.filter((option) =>
    option.variants.includes(variant),
  );
}

function formatDefault(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

function argumentPlaceholder(key) {
  const option = optionByKey.get(key);
  if (!option) {
    throw new Error(`unknown module argument key: ${key}`);
  }
  return `{{{${option.argument}}}}`;
}

function argumentsLine(variant) {
  return optionsForVariant(variant)
    .map(
      (option) =>
        `${option.argument}:${formatDefault(option.default)}`,
    )
    .join(",");
}

function argumentsDescription(variant) {
  return optionsForVariant(variant)
    .map(
      (option) =>
        `${option.argument}：${option.description}`,
    )
    .join("\\n\\n");
}

function scriptArgument(keys) {
  const pairs = keys.map((key) => {
    const option = optionByKey.get(key);
    const placeholder = argumentPlaceholder(key);
    const value =
      option.type === "string" ? `"${placeholder}"` : placeholder;
    return `"${key}":${value}`;
  });
  return `{${pairs.join(",")}}`;
}

const networkArgumentKeys = [
  "cdn",
  "networkProfile",
  "probeMode",
  "resetToken",
  "intervalHours",
  "switchThreshold",
  "debug",
];
const enhanceArgumentKeys = [
  "ads",
  "homeFeedVideoOnly",
  "videoOnlyRecommendations",
  "ui",
  "searchPromotions",
  "liveShopping",
  "vipPromotions",
  ...Object.keys(enhanceApi.UI_OPTION_DEFAULTS),
  "debug",
];
const cdnScriptArgument = scriptArgument(networkArgumentKeys);
const benchmarkScriptArgument = scriptArgument([
  "cdn",
  "networkProfile",
  "probeMode",
  "resetToken",
  "intervalHours",
  "debug",
]);
const enhanceScriptArgument = scriptArgument(enhanceArgumentKeys);
const storyArgumentKeys = [
  ...new Set([...networkArgumentKeys, ...enhanceArgumentKeys]),
];

function storyScriptArgument(includeEnhancements) {
  const common = scriptArgument(
    includeEnhancements ? storyArgumentKeys : networkArgumentKeys,
  );
  return `${common.slice(0, -1)},"enhanceStory":${
    includeEnhancements ? "true" : "false"
  }}`;
}

const combinedStoryScript = [
  '"use strict";\nthis.__BILIFLOW_COMBINED__ = true;',
  enhanceScript,
  sourceScript,
  `(function (root) {
  "use strict";

  function noStoreHeaders() {
    var headers =
      typeof $response !== "undefined" && $response
        ? $response.headers
        : null;
    return root.BiliEnhance.noStoreResponseHeaders(headers);
  }

  function complete(body, changed) {
    var result = { headers: noStoreHeaders() };
    if (changed > 0 && typeof body === "string") {
      result.body = body;
    }
    $done(result);
  }

  function enhancementEnabled(rawArgument) {
    return /"enhanceStory"\\s*:\\s*true/.test(
      String(rawArgument || "")
    );
  }

  function run() {
    var rawArgument =
      typeof $argument === "string" ? $argument : "";
    var original =
      typeof $response !== "undefined" &&
      $response &&
      typeof $response.body === "string"
        ? $response.body
        : "";
    var requestUrl =
      typeof $request !== "undefined" && $request
        ? String($request.url || "")
        : "";
    var working = original;
    var enhanceChanges = 0;
    var enhanceConfig;
    var enhanceResult;
    var cdnConfig;
    var fixedResult;

    if (!root.BiliEnhance || !root.BiliCdnSwitcher) {
      complete(original, 0);
      return;
    }

    if (enhancementEnabled(rawArgument)) {
      enhanceConfig = root.BiliEnhance.parseArgument(rawArgument);
      if (enhanceConfig.valid) {
        enhanceResult = root.BiliEnhance.transformJsonText(
          original,
          requestUrl,
          enhanceConfig
        );
        if (enhanceResult.valid && enhanceResult.changed > 0) {
          working = enhanceResult.body;
          enhanceChanges = enhanceResult.changed;
        }
      }
    }

    cdnConfig = root.BiliCdnSwitcher.parseArgument(rawArgument);
    if (!cdnConfig.valid || (!cdnConfig.auto && !cdnConfig.cdnHost)) {
      complete(working, enhanceChanges);
      return;
    }
    cdnConfig.grpcAdapter = "";
    if (cdnConfig.auto) {
      root.BiliCdnSwitcher.processSafeAutoResponse(
        working,
        false,
        cdnConfig,
        root.BiliCdnSwitcher.createShadowrocketServices(),
        function (cdnResult) {
          var cdnChanges =
            cdnResult && cdnResult.valid
              ? Number(cdnResult.changed || 0)
              : 0;
          complete(
            cdnChanges > 0 ? cdnResult.body : working,
            enhanceChanges + cdnChanges
          );
        }
      );
      return;
    }
    fixedResult = root.BiliCdnSwitcher.transformJsonText(
      working,
      cdnConfig
    );
    complete(
      fixedResult.valid && fixedResult.changed > 0
        ? fixedResult.body
        : working,
      enhanceChanges +
        (
          fixedResult.valid
            ? Number(fixedResult.changed || 0)
            : 0
        )
    );
  }

  try {
    run();
  } catch (error) {
    complete(
      typeof $response !== "undefined" &&
      $response &&
      typeof $response.body === "string"
        ? $response.body
        : "",
      0
    );
  }
})(this);`,
].join("\n");

const cdnOnlyStoryScript = [
  '"use strict";\nthis.__BILIFLOW_COMBINED__ = true;',
  sourceScript,
  `(function (root) {
  "use strict";

  function noStoreHeaders(headers) {
    var output = {};
    var keys =
      headers && typeof headers === "object"
        ? Object.keys(headers)
        : [];
    var index;
    var key;
    for (index = 0; index < keys.length; index += 1) {
      key = keys[index];
      if (
        !/^(?:age|cache-control|content-length|etag|expires|last-modified|pragma)$/i.test(
          key
        )
      ) {
        output[key] = headers[key];
      }
    }
    output["Cache-Control"] = "no-store, no-cache, must-revalidate";
    output.Pragma = "no-cache";
    output.Expires = "0";
    return output;
  }

  function complete(body, changed) {
    var headers =
      typeof $response !== "undefined" && $response
        ? $response.headers
        : null;
    var result = { headers: noStoreHeaders(headers) };
    if (changed > 0 && typeof body === "string") {
      result.body = body;
    }
    $done(result);
  }

  function run() {
    var rawArgument =
      typeof $argument === "string" ? $argument : "";
    var original =
      typeof $response !== "undefined" &&
      $response &&
      typeof $response.body === "string"
        ? $response.body
        : "";
    var config = root.BiliCdnSwitcher.parseArgument(rawArgument);
    var fixedResult;
    if (!config.valid || (!config.auto && !config.cdnHost)) {
      complete(original, 0);
      return;
    }
    config.grpcAdapter = "";
    if (config.auto) {
      root.BiliCdnSwitcher.processSafeAutoResponse(
        original,
        false,
        config,
        root.BiliCdnSwitcher.createShadowrocketServices(),
        function (cdnResult) {
          var changed =
            cdnResult && cdnResult.valid
              ? Number(cdnResult.changed || 0)
              : 0;
          complete(
            changed > 0 ? cdnResult.body : original,
            changed
          );
        }
      );
      return;
    }
    fixedResult = root.BiliCdnSwitcher.transformJsonText(
      original,
      config
    );
    complete(
      fixedResult.valid && fixedResult.changed > 0
        ? fixedResult.body
        : original,
      fixedResult.valid
        ? Number(fixedResult.changed || 0)
        : 0
    );
  }

  try {
    run();
  } catch (error) {
    complete(
      typeof $response !== "undefined" &&
      $response &&
      typeof $response.body === "string"
        ? $response.body
        : "",
      0
    );
  }
})(this);`,
].join("\n");

const combinedBenchmarkScript = [sourceScript, benchmarkScript].join("\n");

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
  String.raw`^https?:\/\/(?:(?:grpc|app)\.(?:bilibili\.com|biliapi\.net))\/(?:bilibili\.app\.playerunite\.v1\.Player\/PlayViewUnite|bilibili\.app\.playurl\.v1\.PlayURL\/PlayView|bilibili\.(?:pgc\.gateway\.player\.(?:v1|v2)|cheese\.gateway\.player\.v1)\.PlayURL\/PlayView)(?:\?|$)`;
const enhancePattern =
  String.raw`^https?:\/\/(?:(?:app\.bilibili\.com|app\.biliapi\.net)\/(?:x\/v2\/(?:splash\/(?:brand\/list|event\/list2|list|show)|feed\/index|search(?:\/square|\/type)?|view|account\/(?:mine(?:\/ipad)?|myinfo))|x\/(?:resource\/(?:show\/tab\/v2|top\/activity|patch\/tab(?:\/v2)?)|vip\/ads\/(?:materials|material\/report)))|(?:api\.bilibili\.com|api\.biliapi\.net)\/(?:pgc\/(?:page\/(?:bangumi|cinema\/tab)|activity\/deliver\/material\/receive)|x\/(?:resource\/(?:top\/activity|patch\/tab(?:\/v2)?)|vip\/(?:web\/vip_center\/combine|ads\/(?:materials|material\/report))|web-interface\/(?:wbi\/)?index\/top\/feed\/rcmd|v2\/reply\/main))|api\.live\.bilibili\.com\/xlive\/(?:app-room\/v1\/index\/getInfoByRoom|e-commerce-interface\/v1\/ecommerce-user\/get_shopping_info)|line3-h5-mobile-api\.biligame\.com\/game\/live\/large_card_material|api\.vc\.bilibili\.com\/search_svr\/v\d+\/Search\/recommend_words|manga\.bilibili\.com\/twirp\/comic\.v\d+\.Comic\/(?:Flash|ListFlash))(?:\?|$)`;
const storyPattern =
  String.raw`^https?:\/\/(?:app\.bilibili\.com|app\.biliapi\.net)\/x\/v2\/feed\/index\/(?:story(?:\/cart)?|relate\/story)(?:\?|$)`;
const enhanceGrpcPattern =
  String.raw`^https?:\/\/(?:(?:grpc|app)\.bilibili\.com|(?:grpc|app)\.biliapi\.net)\/(?:bilibili\.app\.(?:view\.v1\.View\/(?:View|ViewProgress|RelatesFeed|TFInfo)|viewunite\.v1\.View\/(?:View|ViewProgress|PlayPause|ViewEndPage|RelatesFeed)|mine\.v1\.Mine\/(?:PubModule|DeviceFeature)|resource\.v1\.Module\/List|show\.v1\.Popular\/Index|dynamic\.v2\.Dynamic\/DynAll|interface\.v1\.Search\/DefaultWords)|bilibili\.polymer\.app\.search\.v1\.Search\/(?:SearchAll|SearchByType)|bilibili\.main\.community\.reply\.v1\.Reply\/MainList)(?:\?|$)`;
const refreshPattern =
  String.raw`^https?:\/\/(?:(?:app\.bilibili\.com|app\.biliapi\.net)\/(?:x\/v2\/(?:splash\/(?:brand\/list|event\/list2|list|show)|feed\/index(?:\/(?:story(?:\/cart)?|relate\/story))?|view|account\/(?:mine(?:\/ipad)?|myinfo))|x\/vip\/ads\/(?:materials|material\/report))|(?:api\.bilibili\.com|api\.biliapi\.net)\/x\/vip\/ads\/(?:materials|material\/report)|api\.vc\.bilibili\.com\/search_svr\/v\d+\/Search\/recommend_words|manga\.bilibili\.com\/twirp\/comic\.v\d+\.Comic\/(?:Flash|ListFlash))(?:\?|$)`;

function versionedRaw(relativePath) {
  return `${rawRoot}/${relativePath}?v=${assetVersion}`;
}

function ruleSection() {
  return [
    "[Rule]",
    `DOMAIN-WILDCARD,*pcdn*.biliapi.net,${argumentPlaceholder(
      "pcdnPolicy",
    )}`,
    `RULE-SET,${versionedRaw("dist/Bilibili.list")},${argumentPlaceholder(
      "routingPolicy",
    )}`,
  ];
}

function cdnScriptLines() {
  return [
    `Bilibili CDN JSON = type=http-response,pattern=${jsonPattern},requires-body=1,max-size=4194304,timeout=10,engine=jsc,script-path=${versionedRaw("dist/bilibili-cdn.js")},argument="${cdnScriptArgument}"`,
    `Bilibili CDN gRPC = type=http-response,pattern=${grpcPattern},requires-body=1,binary-body-mode=1,max-size=4194304,timeout=10,engine=webview,script-path=${versionedRaw("dist/bilibili-cdn.js")},argument="${cdnScriptArgument}"`,
  ];
}

function cdnCronLines() {
  return [
    `Bilibili CDN Background Benchmark = type=cron,cronexp=0 17 */2 * * *,wake-system=1,timeout=45,engine=webview,script-path=${versionedRaw("dist/bilibili-cdn-benchmark.js")},argument="${benchmarkScriptArgument}"`,
  ];
}

function enhanceScriptLines() {
  return [
    `Bilibili Enhance Fresh UI = type=http-request,pattern=${refreshPattern},timeout=3,engine=jsc,script-path=${versionedRaw("dist/bilibili-refresh.js")},argument="{"debug":{{{调试日志}}}}"`,
    `Bilibili Enhance JSON = type=http-response,pattern=${enhancePattern},requires-body=1,max-size=4194304,timeout=8,engine=jsc,script-path=${versionedRaw("dist/bilibili-enhance.js")},argument="${enhanceScriptArgument}"`,
    `Bilibili Enhance gRPC = type=http-response,pattern=${enhanceGrpcPattern},requires-body=1,binary-body-mode=1,max-size=4194304,timeout=10,engine=webview,script-path=${versionedRaw("dist/bilibili-enhance.js")},argument="${enhanceScriptArgument}"`,
  ];
}

function storyScriptLines(includeEnhancements) {
  const runtime = includeEnhancements
    ? "dist/bilibili-story.js"
    : "dist/bilibili-story-cdn.js";
  return [
    `Bilibili Story Safe Pipeline = type=http-response,pattern=${storyPattern},requires-body=1,max-size=4194304,timeout=10,engine=jsc,script-path=${versionedRaw(runtime)},argument="${storyScriptArgument(includeEnhancements)}"`,
  ];
}

function buildModule({
  name,
  description,
  variant,
  includeEnhancements,
}) {
  const mitmHosts = [
    "api.bilibili.com",
    "app.bilibili.com",
    "interface.bilibili.com",
    "api.biliapi.net",
    "app.biliapi.net",
    "grpc.bilibili.com",
    "grpc.biliapi.net",
  ];
  if (includeEnhancements) {
    mitmHosts.push("api.live.bilibili.com");
    mitmHosts.push("line3-h5-mobile-api.biligame.com");
    mitmHosts.push("api.vc.bilibili.com");
    mitmHosts.push("manga.bilibili.com");
  }

  return [
    `#!name=${name}`,
    `#!desc=${description}`,
    `#!version=${packageJson.version}`,
    "#!author=STERILITZIA02",
    `#!homepage=${homepage}`,
    "#!icon=https://i0.hdslb.com/bfs/static/jinkela/long/images/512.png",
    "#!category=Bilibili",
    `#!arguments=${argumentsLine(variant)}`,
    `#!arguments-desc=${argumentsDescription(variant)}`,
    "",
    ...ruleSection(),
    "",
    "[Script]",
    ...cdnCronLines(),
    ...(includeEnhancements ? enhanceScriptLines() : []),
    ...storyScriptLines(includeEnhancements),
    ...cdnScriptLines(),
    "",
    "[MITM]",
    "h2 = true",
    `hostname = %APPEND% ${mitmHosts.join(", ")}`,
    "",
  ].join("\n");
}

const cdnOnlyModule = buildModule({
  name: "Bilibili CDN Switcher",
  description:
    "仅包含保守 CDN 自动选择与视频、直播、API 分流；不改动页面内容或账号数据（iPhone / iPad）",
  variant: "cdn",
  includeEnhancements: false,
});
const enhancedModule = buildModule({
  name: "Bilibili CDN Enhanced",
  description:
    "CDN 自动选择 + 广告过滤 + 首页六条普通视频流 + 播放页普通视频推荐白名单 + 首页/我的逐项精简；不修改账号、会员、订单与付费权益（iPhone / iPad）",
  variant: "enhanced",
  includeEnhancements: true,
});
const publishedCatalog = `${JSON.stringify(moduleOptions, null, 2)}\n`;

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

const outputs = new Map([
  ["dist/Bilibili.CDN.Switcher.sgmodule", cdnOnlyModule],
  ["dist/Bilibili.CDN.Enhanced.sgmodule", enhancedModule],
  // Keep the v1/v2 URL updating in place; it intentionally tracks Enhanced.
  ["dist/Bilibili.CDN.sgmodule", enhancedModule],
  ["dist/Bilibili.list", ruleList],
  ["dist/bilibili-cdn.js", sourceScript],
  ["dist/bilibili-cdn-benchmark.js", combinedBenchmarkScript],
  ["dist/bilibili-enhance.js", enhanceScript],
  ["dist/bilibili-refresh.js", refreshScript],
  ["dist/bilibili-story.js", combinedStoryScript],
  ["dist/bilibili-story-cdn.js", cdnOnlyStoryScript],
  ["dist/module-options.json", publishedCatalog],
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
