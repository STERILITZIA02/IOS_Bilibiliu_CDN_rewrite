import {
  bundledCatalog,
  isModuleCatalog,
  type ModuleCatalog,
  type ModuleVariant,
} from "./catalog";

export const REPOSITORY =
  "STERILITZIA02/IOS_Bilibiliu_CDN_rewrite";
export const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
export const RAW_ROOT =
  `https://raw.githubusercontent.com/${REPOSITORY}/main`;

const CATALOG_URL = `${RAW_ROOT}/dist/module-options.json`;
const MODULE_URLS: Record<ModuleVariant, string> = {
  cdn: `${RAW_ROOT}/dist/Bilibili.CDN.Switcher.sgmodule`,
  enhanced: `${RAW_ROOT}/dist/Bilibili.CDN.Enhanced.sgmodule`,
};

async function fetchWithTimeout(
  url: string,
  timeoutMs = 7000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain;q=0.9",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadLatestCatalog(): Promise<{
  catalog: ModuleCatalog;
  source: "repository" | "bundled";
}> {
  try {
    const response = await fetchWithTimeout(CATALOG_URL);
    if (
      response.ok &&
      Number(response.headers.get("content-length") || 0) < 262144
    ) {
      const value: unknown = await response.json();
      if (isModuleCatalog(value)) {
        return { catalog: value, source: "repository" };
      }
    }
  } catch {
    // The reviewed bundled catalog keeps the UI usable during a GitHub outage.
  }
  return { catalog: bundledCatalog, source: "bundled" };
}

export async function loadLatestModule(
  variant: ModuleVariant,
): Promise<{ text: string; sourceUrl: string }> {
  const sourceUrl = MODULE_URLS[variant];
  const response = await fetchWithTimeout(sourceUrl);
  if (!response.ok) {
    throw new Error(`GitHub module returned HTTP ${response.status}`);
  }
  const text = await response.text();
  if (
    text.length < 1000 ||
    text.length > 1024 * 1024 ||
    !text.startsWith("#!name=") ||
    !/^#!version=\d+\.\d+\.\d+$/m.test(text) ||
    !text.includes("[Script]") ||
    !text.includes("[MITM]") ||
    !/^#!arguments=.+$/m.test(text) ||
    (variant === "enhanced" &&
      !text.includes("Bilibili Enhance JSON")) ||
    (variant === "cdn" && text.includes("Bilibili Enhance"))
  ) {
    throw new Error("GitHub module failed structural validation");
  }
  return { text, sourceUrl };
}
