import {
  optionsForVariant,
  type ModuleCatalog,
  type ModuleOption,
  type ModuleVariant,
} from "@/lib/catalog";
import {
  loadLatestCatalog,
  loadLatestModule,
} from "@/lib/repository";
import candidateConfig from "../../../config/cdn-candidates.json";

const SAFE_FIXED_CDN_HOSTS = new Set<string>([
  ...candidateConfig.maintained,
  ...candidateConfig.supplemental,
]);
const SAFE_OWNED_CDN_HOST =
  /^(?:[a-z0-9-]+\.)+(?:acgvideo\.com|bilivideo\.(?:com|cn|net)|bilibilivideo\.com)$/i;
const SAFE_POLICY = /^[\p{L}\p{N}_.+ -]{1,64}$/u;
const SAFE_PROFILE = /^[A-Za-z0-9._-]{1,40}$/;

class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestError";
  }
}
function parseVariant(value: string | null): ModuleVariant {
  if (value === null || value === "enhanced") {
    return "enhanced";
  }
  if (value === "cdn") {
    return "cdn";
  }
  throw new RequestError("variant 只能是 enhanced 或 cdn");
}

function parseBoolean(value: string, option: ModuleOption): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new RequestError(`${option.key} 必须是 true 或 false`);
}

function parseNumber(value: string, option: ModuleOption): number {
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) {
    throw new RequestError(`${option.key} 必须是数字`);
  }
  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    typeof option.minimum !== "number" ||
    typeof option.maximum !== "number" ||
    parsed < option.minimum ||
    parsed > option.maximum
  ) {
    throw new RequestError(
      `${option.key} 必须在 ${option.minimum} 到 ${option.maximum} 之间`,
    );
  }
  return parsed;
}

function parseString(value: string, option: ModuleOption): string {
  if (value.length === 0 || value.length > 253 || /[,\r\n:{}]/.test(value)) {
    throw new RequestError(`${option.key} 包含不安全字符`);
  }
  if (
    option.key === "cdn" &&
    value !== "auto" &&
    value !== "off" &&
    !SAFE_OWNED_CDN_HOST.test(value) &&
    !SAFE_FIXED_CDN_HOSTS.has(value.toLowerCase())
  ) {
    throw new RequestError(
      "CDN 只能是 auto、off 或受支持的 Bilibili 媒体主机",
    );
  }
  if (
    (option.key === "routingPolicy" ||
      option.key === "pcdnPolicy") &&
    !SAFE_POLICY.test(value)
  ) {
    throw new RequestError(`${option.key} 不是安全的策略名称`);
  }
  if (
    option.key === "networkProfile" &&
    !SAFE_PROFILE.test(value)
  ) {
    throw new RequestError(
      "networkProfile 仅支持字母、数字、点、横线和下划线",
    );
  }
  return value;
}

function parseOptionValue(
  raw: string,
  option: ModuleOption,
): boolean | number | string {
  if (option.type === "boolean") {
    return parseBoolean(raw, option);
  }
  if (option.type === "number") {
    return parseNumber(raw, option);
  }
  return parseString(raw, option);
}

function formatValue(value: boolean | number | string): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

function resolveArguments(
  url: URL,
  catalog: ModuleCatalog,
  variant: ModuleVariant,
): Map<string, boolean | number | string> {
  const options = optionsForVariant(catalog, variant);
  const allowed = new Map(options.map((option) => [option.key, option]));
  const values = new Map<string, boolean | number | string>(
    options.map((option) => [option.key, option.default]),
  );

  for (const [key, raw] of url.searchParams) {
    if (key === "variant") {
      continue;
    }
    const option = allowed.get(key);
    if (!option) {
      throw new RequestError(`未知或不适用于当前版本的参数：${key}`);
    }
    if (url.searchParams.getAll(key).length !== 1) {
      throw new RequestError(`参数不能重复：${key}`);
    }
    values.set(key, parseOptionValue(raw, option));
  }
  return values;
}

function customizeModule(
  template: string,
  catalog: ModuleCatalog,
  variant: ModuleVariant,
  values: Map<string, boolean | number | string>,
): string {
  const options = optionsForVariant(catalog, variant);
  const expectedArguments = options.map((option) => option.argument);
  const argumentsMatch = template.match(/^#!arguments=(.+)$/m);
  const templateArguments = argumentsMatch?.[1]
    .split(",")
    .map((entry) => entry.slice(0, entry.indexOf(":")));
  const templatePlaceholders = new Set(
    Array.from(
      template.matchAll(/\{\{\{([^{}\r\n]+)\}\}\}/g),
      (match) => match[1],
    ),
  );
  const expectedPlaceholders = new Set(expectedArguments);

  if (
    !templateArguments ||
    templateArguments.some((argument) => argument.length === 0) ||
    templateArguments.length !== expectedArguments.length ||
    templateArguments.some(
      (argument, index) => argument !== expectedArguments[index],
    ) ||
    templatePlaceholders.size !== expectedPlaceholders.size ||
    Array.from(templatePlaceholders).some(
      (argument) => !expectedPlaceholders.has(argument),
    )
  ) {
    throw new Error("Latest module arguments are out of sync with catalog");
  }

  for (const option of options) {
    if (!template.includes(`{{{${option.argument}}}}`)) {
      throw new Error(
        `Latest module is out of sync with option ${option.key}`,
      );
    }
  }
  const argumentsLine = options
    .map(
      (option) =>
        `${option.argument}:${formatValue(
          values.get(option.key) ?? option.default,
        )}`,
    )
    .join(",");
  const customized = template.replace(
    /^#!arguments=.+$/m,
    `#!arguments=${argumentsLine}`,
  );
  if (customized === template && !template.includes(argumentsLine)) {
    throw new Error("Unable to customize module arguments");
  }
  return customized;
}

function errorResponse(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.getAll("variant").length > 1) {
      throw new RequestError("variant 参数不能重复");
    }
    const variant = parseVariant(url.searchParams.get("variant"));
    const { catalog, source: catalogSource } =
      await loadLatestCatalog();
    const values = resolveArguments(url, catalog, variant);
    const {
      text,
      sourceUrl,
      source: moduleSource,
    } = await loadLatestModule(
      variant,
      catalogSource === "bundled",
    );
    const customized = customizeModule(
      text,
      catalog,
      variant,
      values,
    );
    const filename =
      variant === "cdn"
        ? "Bilibili.CDN.Switcher.sgmodule"
        : "Bilibili.CDN.Enhanced.sgmodule";

    return new Response(customized, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Type": "text/plain; charset=utf-8",
        "X-Bilibili-Module-Source": sourceUrl,
        "X-Bilibili-Module-Snapshot": moduleSource,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof RequestError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse(
      "暂时无法生成经过校验的模块，请稍后重试。",
      502,
    );
  }
}
