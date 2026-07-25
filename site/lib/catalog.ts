import bundledCatalogJson from "../../config/module-options.json";

export type ModuleVariant = "cdn" | "enhanced";
export type OptionType = "boolean" | "number" | "string";

export interface ModuleOptionGroup {
  id: string;
  title: string;
  surface: string;
}

export interface ModuleOption {
  key: string;
  argument: string;
  group: string;
  label: string;
  description: string;
  type: OptionType;
  default: boolean | number | string;
  minimum?: number;
  maximum?: number;
  variants: ModuleVariant[];
}

export interface ModuleCatalog {
  schemaVersion: number;
  groups: ModuleOptionGroup[];
  options: ModuleOption[];
}

const SAFE_ARGUMENT = /^[^,:\r\n]{1,64}$/;
const SAFE_KEY = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
const VARIANTS = new Set<ModuleVariant>(["cdn", "enhanced"]);
const TYPES = new Set<OptionType>(["boolean", "number", "string"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}
function isGroup(value: unknown): value is ModuleOptionGroup {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 32 &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    value.title.length <= 64 &&
    typeof value.surface === "string" &&
    value.surface.length > 0 &&
    value.surface.length <= 32
  );
}

function isOption(value: unknown): value is ModuleOption {
  if (
    !isRecord(value) ||
    typeof value.key !== "string" ||
    !SAFE_KEY.test(value.key) ||
    typeof value.argument !== "string" ||
    !SAFE_ARGUMENT.test(value.argument) ||
    typeof value.group !== "string" ||
    typeof value.label !== "string" ||
    value.label.length === 0 ||
    value.label.length > 80 ||
    typeof value.description !== "string" ||
    value.description.length === 0 ||
    value.description.length > 500 ||
    typeof value.type !== "string" ||
    !TYPES.has(value.type as OptionType) ||
    !Array.isArray(value.variants) ||
    value.variants.length === 0 ||
    value.variants.some(
      (variant) =>
        typeof variant !== "string" ||
        !VARIANTS.has(variant as ModuleVariant),
    )
  ) {
    return false;
  }

  if (value.type === "boolean") {
    return typeof value.default === "boolean";
  }
  if (value.type === "string") {
    return (
      typeof value.default === "string" &&
      value.default.length <= 253 &&
      !/[,\r\n]/.test(value.default)
    );
  }
  return (
    typeof value.default === "number" &&
    Number.isFinite(value.default) &&
    typeof value.minimum === "number" &&
    Number.isFinite(value.minimum) &&
    typeof value.maximum === "number" &&
    Number.isFinite(value.maximum) &&
    value.minimum <= value.default &&
    value.default <= value.maximum
  );
}

export function isModuleCatalog(value: unknown): value is ModuleCatalog {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.groups) ||
    value.groups.length === 0 ||
    value.groups.length > 16 ||
    !value.groups.every(isGroup) ||
    !Array.isArray(value.options) ||
    value.options.length === 0 ||
    value.options.length > 64 ||
    !value.options.every(isOption)
  ) {
    return false;
  }

  const groupIds = new Set(value.groups.map((group) => group.id));
  const keys = value.options.map((option) => option.key);
  const argumentsList = value.options.map((option) => option.argument);
  return (
    new Set(groupIds).size === value.groups.length &&
    new Set(keys).size === keys.length &&
    new Set(argumentsList).size === argumentsList.length &&
    value.options.every((option) => groupIds.has(option.group))
  );
}

if (!isModuleCatalog(bundledCatalogJson)) {
  throw new Error("Bundled module catalog is invalid");
}

export const bundledCatalog: ModuleCatalog = bundledCatalogJson;

export function optionsForVariant(
  catalog: ModuleCatalog,
  variant: ModuleVariant,
) {
  return catalog.options.filter((option) =>
    option.variants.includes(variant),
  );
}
