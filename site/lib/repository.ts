import {
  bundledCatalog,
  isModuleCatalog,
  type ModuleCatalog,
  type ModuleVariant,
} from "./catalog";
import bundledCdnModule from "../../dist/Bilibili.CDN.Switcher.sgmodule?raw";
import bundledEnhancedModule from "../../dist/Bilibili.CDN.Enhanced.sgmodule?raw";

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
const BUNDLED_MODULES: Record<ModuleVariant, string> = {
  cdn: bundledCdnModule,
  enhanced: bundledEnhancedModule,
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
    if (response.ok) {
      const text = await response.text();
      const value: unknown =
        text.length > 0 && text.length <= 262144
          ? JSON.parse(text)
          : null;
      if (isModuleCatalog(value)) {
        return { catalog: value, source: "repository" };
      }
    }
  } catch {
    // The reviewed bundled catalog keeps the UI usable during a GitHub outage.
  }
  return { catalog: bundledCatalog, source: "bundled" };
}

function isValidModule(
  text: string,
  variant: ModuleVariant,
): boolean {
  return !(
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
  );
}

function loadBundledModule(variant: ModuleVariant): {
  text: string;
  sourceUrl: string;
  source: "bundled";
} {
  const text = BUNDLED_MODULES[variant];
  if (!isValidModule(text, variant)) {
    throw new Error("Bundled module failed structural validation");
  }
  return {
    text,
    sourceUrl: `bundled:dist/${variant}`,
    source: "bundled",
  };
}

export async function loadLatestModule(
  variant: ModuleVariant,
  preferBundled = false,
): Promise<{
  text: string;
  sourceUrl: string;
  source: "repository" | "bundled";
}> {
  if (!preferBundled) {
    const sourceUrl = MODULE_URLS[variant];
    try {
      const response = await fetchWithTimeout(sourceUrl);
      if (response.ok) {
        const text = await response.text();
        if (isValidModule(text, variant)) {
          return { text, sourceUrl, source: "repository" };
        }
      }
    } catch {
      // Sites may temporarily be unable to reach GitHub. The exact reviewed
      // module from this deployment remains available as a bounded fallback.
    }
  }
  return loadBundledModule(variant);
}
