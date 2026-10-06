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
const endpointScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-endpoints.js"),
  "utf8",
);
const sourceScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-cdn.js"),
  "utf8",
);
const routeScript = await readFile(
  path.join(rootDirectory, "src", "bilibili-cdn-route.js"),
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
const responseScript = await readFile(path.join(rootDirectory, "src", "bilibili-response.js"), "utf8");
const btrScript = await readFile(path.join(rootDirectory, "src", "bilibili-btr.js"), "utf8");
const btrApi = require(path.join(rootDirectory, "src", "bilibili-btr.js"));
const fflateDirectory = path.resolve(path.dirname(require.resolve("fflate")), "..");
const gzipRuntime = [
  `/* fflate ${packageJson.devDependencies.fflate}\n${await readFile(path.join(fflateDirectory, "LICENSE"), "utf8")}*/`,
  await readFile(path.join(fflateDirectory, "umd", "index.js"), "utf8"),
  await readFile(path.join(rootDirectory, "src", "bilibili-gzip.js"), "utf8"),
].join("\n");

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
    "homeFeedRefill",
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
const endpointApi = require(
  path.join(rootDirectory, "src", "bilibili-endpoints.js"),
);
if (!endpointApi.validateRegistry()) {
  throw new Error("src/bilibili-endpoints.js has an invalid registry");
}
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
  "homeFeedRefill",
  "videoOnlyRecommendations",
  "ui",
  "searchPromotions",
  "liveShopping",
  "vipPromotions",
  ...Object.keys(enhanceApi.UI_OPTION_DEFAULTS),
  "debug",
];
const cdnScriptArgument = scriptArgument(networkArgumentKeys);
const enhancedCdnGrpcScriptArgument = scriptArgument([
  ...networkArgumentKeys,
  "ads",
]);
const benchmarkScriptArgument = scriptArgument([
  "cdn",
  "networkProfile",
  "probeMode",
  "resetToken",
  "intervalHours",
  "switchThreshold",
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
  responseScript,
  endpointScript,
  enhanceScript,
  sourceScript,
  `(function (root) {
  "use strict";

  function noStoreHeaders(changed) {
    var headers =
      typeof $response !== "undefined" && $response
        ? $response.headers
        : null;
    return root.BiliEnhance.noStoreResponseHeaders(headers, changed > 0);
  }

  function complete(body, changed) {
    var result = { headers: noStoreHeaders(changed) };
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
    if (!root.BiliResponse.canRewrite(typeof $response !== "undefined" ? $response : null)) {
      $done({});
      return;
    }
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
  responseScript,
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
    var result = { headers: noStoreHeaders(changed > 0 ? root.BiliResponse.rewrittenHeaders(headers) : headers) };
    if (changed > 0 && typeof body === "string") {
      result.body = body;
    }
    $done(result);
  }

  function run() {
    var rawArgument =
      typeof $argument === "string" ? $argument : "";
    if (!root.BiliResponse.canRewrite(typeof $response !== "undefined" ? $response : null)) {
      $done({});
      return;
    }
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

const combinedBenchmarkScript = [responseScript, sourceScript, benchmarkScript].join("\n");

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

const jsonPattern = endpointApi.matcherPattern({
  runtime: "cdn",
  transport: "json",
  responseFilter: true,
});
const grpcPattern = endpointApi.matcherPattern({
  runtime: "cdn",
  transport: "grpc",
  responseFilter: true,
});
const enhancePattern = endpointApi.matcherPattern({
  runtime: "enhance",
  transport: "json",
  responseFilter: true,
});
const storyPattern = endpointApi.matcherPattern({
  runtime: "story",
  transport: "json",
  responseFilter: true,
});
const enhanceGrpcPattern = endpointApi.matcherPattern({
  runtime: "enhance",
  transport: "grpc",
  responseFilter: true,
});
const refreshPattern = endpointApi.matcherPattern({ requestGuard: true });

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

function cdnScriptLines(includeEnhancements) {
  const grpcArgument = includeEnhancements
    ? enhancedCdnGrpcScriptArgument
    : cdnScriptArgument;
  return [
    `Bilibili CDN JSON = type=http-response,pattern=${jsonPattern},requires-body=1,max-size=4194304,timeout=10,engine=jsc,script-path=${versionedRaw("dist/bilibili-cdn.js")},argument="${cdnScriptArgument}"`,
    `Bilibili CDN gRPC = type=http-response,pattern=${grpcPattern},requires-body=1,binary-body-mode=1,max-size=4194304,timeout=10,engine=jsc,script-path=${versionedRaw("dist/bilibili-cdn.js")},argument="${grpcArgument}"`,
  ];
}

function cdnCronLines() {
  return [
    `Bilibili CDN Background Benchmark = type=cron,cronexp=0 */10 * * * *,wake-system=1,timeout=45,engine=webview,script-path=${versionedRaw("dist/bilibili-cdn-benchmark.js")},argument="${benchmarkScriptArgument}"`,
  ];
}

function enhanceScriptLines() {
  return [
    `Bilibili Enhance Fresh UI = type=http-request,pattern=${refreshPattern},timeout=3,engine=jsc,script-path=${versionedRaw("dist/bilibili-refresh.js")},argument="${scriptArgument([...enhanceArgumentKeys, "cdn", "probeMode"])}"`,
    `Bilibili Enhance JSON = type=http-response,pattern=${enhancePattern},requires-body=1,max-size=4194304,timeout=8,engine=jsc,script-path=${versionedRaw("dist/bilibili-enhance.js")},argument="${enhanceScriptArgument}"`,
    `Bilibili Enhance gRPC = type=http-response,pattern=${enhanceGrpcPattern},requires-body=1,binary-body-mode=1,max-size=4194304,timeout=10,engine=jsc,script-path=${versionedRaw("dist/bilibili-enhance.js")},argument="${enhanceScriptArgument}"`,
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
  const enabledRuntimes = includeEnhancements
    ? new Set(["cdn", "enhance", "story"])
    : new Set(["cdn", "story"]);
  const mitmHosts = [
    ...new Set(
      endpointApi.REGISTRY
        .filter((row) => row.runtimes.some((runtime) => enabledRuntimes.has(runtime)))
        .flatMap((row) => row.hosts),
    ),
  ];
  if (includeEnhancements) {
    // Registry-derived hosts already include every enhancement-only endpoint.
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
    ...cdnScriptLines(includeEnhancements),
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
// Separate opt-in companion: ordinary CDN/Enhanced installations keep media outside MITM.
const btrModule = [
  "#!name=Bilibili BTR Experimental",
  "#!desc=BTR HTTP/HTTPS 有界并发实验：持续补任务与自动线程学习；配合一个 CDN/Enhanced 使用，默认关闭，真机效果待验证。启用前阅读 BTR_PORT.md；停用整个模块可撤销媒体 HTTPS 解密。",
  `#!version=${packageJson.version}`,
  "#!author=STERILITZIA02 / Bilibili-thread-ripper contributors",
  `#!homepage=${homepage}/blob/main/docs/BTR_PORT.md`,
  "#!category=Bilibili",
  "#!arguments=启用加速:false,并发数:auto,并发上限:8,CDN模式:original,单次上限MiB:4,执行预算毫秒:8000,调试日志:false",
  "#!arguments-desc=启用加速：实验功能，默认 false；需与一个现有 CDN/Enhanced 模块配合\\n\\n并发数：auto 或 1–8；auto 按真实完成吞吐试探增减，并不读取 App 缓冲\\n\\n并发上限：1–8，每个被接管请求的上限；一个协作租约限制同时接管的请求，非系统原子锁\\n\\nCDN模式：original 仅使用原完整 URL；mainland/overseas 对最多两个候选做强校验和双采样后才并发\\n\\n单次上限MiB：1–8，超出范围由 App 原样下载\\n\\n执行预算毫秒：2000–15000，到期回退；脚本无法保证终止未暴露取消句柄的底层请求\\n\\n调试日志：只记录数量、线程变化和结果，不记录 URL、签名或账号",
  "",
  "[Script]",
  `Bilibili BTR Range = type=http-request,pattern=${btrApi.REQUEST_PATTERN},binary-body-mode=1,timeout=20,engine=jsc,enable={{{启用加速}}},script-path=${versionedRaw("dist/bilibili-btr.js")},argument="enabled={{{启用加速}}}&threads={{{并发数}}}&maxThreads={{{并发上限}}}&mode={{{CDN模式}}}&maxMiB={{{单次上限MiB}}}&budgetMs={{{执行预算毫秒}}}&debug={{{调试日志}}}"`,
  "",
  "[MITM]",
  "h2 = true",
  "hostname = %APPEND% *.bilivideo.com, *.bilivideo.cn, *.bilivideo.net, upos-hz-mirrorakam.akamaized.net",
  "",
].join("\n");
const modulesList = [
  `# BiliFlow Shadowrocket modules v${packageJson.version}`,
  `# Repository: ${homepage}`,
  `# Enhanced: ${versionedRaw("dist/Bilibili.CDN.Enhanced.sgmodule")}`,
  `# CDN-only: ${versionedRaw("dist/Bilibili.CDN.Switcher.sgmodule")}`,
  `# Enhanced compatibility alias: ${versionedRaw("dist/Bilibili.CDN.sgmodule")}`,
  `# Optional BTR experiment (separate opt-in): ${versionedRaw("dist/Bilibili.BTR.Experimental.sgmodule")}`,
  versionedRaw("dist/Bilibili.CDN.Enhanced.sgmodule"),
  versionedRaw("dist/Bilibili.CDN.Switcher.sgmodule"),
  versionedRaw("dist/Bilibili.CDN.sgmodule"),
  "",
].join("\n");

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

const outputs = new Map([
  ["dist/Bilibili.CDN.Switcher.sgmodule", cdnOnlyModule],
  ["dist/Bilibili.CDN.Enhanced.sgmodule", enhancedModule],
  ["dist/Bilibili.BTR.Experimental.sgmodule", btrModule],
  ["dist/bilibili-btr.js", `this.__BILIFLOW_VERSION__ = ${JSON.stringify(packageJson.version)};\n${btrScript}`],
  // Keep the v1/v2 URL updating in place; it intentionally tracks Enhanced.
  ["dist/Bilibili.CDN.sgmodule", enhancedModule],
  ["dist/Bilibili.list", ruleList],
  ["dist/bilibili-cdn.js", [responseScript, gzipRuntime, sourceScript].join("\n")],
  ["dist/bilibili-cdn-route.js", routeScript],
  ["dist/bilibili-cdn-benchmark.js", combinedBenchmarkScript],
  ["dist/bilibili-enhance.js", [responseScript, gzipRuntime, endpointScript, enhanceScript].join("\n")],
  ["dist/bilibili-refresh.js", [endpointScript, refreshScript].join("\n")],
  ["dist/bilibili-story.js", combinedStoryScript],
  ["dist/bilibili-story-cdn.js", cdnOnlyStoryScript],
  ["dist/module-options.json", publishedCatalog],
  ["dist/modules.list", modulesList],
]);
for (const relativePath of ["dist/bilibili-cdn.js", "dist/bilibili-enhance.js", "dist/bilibili-refresh.js"]) {
  outputs.set(relativePath, `this.__BILIFLOW_VERSION__ = ${JSON.stringify(packageJson.version)};\n${outputs.get(relativePath)}`);
}

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
