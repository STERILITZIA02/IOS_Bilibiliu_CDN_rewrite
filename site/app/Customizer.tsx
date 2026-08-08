"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  optionsForVariant,
  type ModuleCatalog,
  type ModuleOption,
  type ModuleVariant,
} from "@/lib/catalog";
import { REPOSITORY_URL } from "@/lib/repository";

type OptionValue = boolean | number | string;
type OptionValues = Record<string, OptionValue>;

const STORAGE_KEY = "biliflow-customizer-v3";

function defaultsFor(catalog: ModuleCatalog): OptionValues {
  return Object.fromEntries(
    catalog.options.map((option) => [option.key, option.default]),
  );
}

function valueMatchesOption(
  value: unknown,
  option: ModuleOption,
): value is OptionValue {
  if (option.type === "boolean") {
    return typeof value === "boolean";
  }
  if (option.type === "string") {
    return typeof value === "string" && value.length <= 253;
  }
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    typeof option.minimum === "number" &&
    typeof option.maximum === "number" &&
    value >= option.minimum &&
    value <= option.maximum
  );
}

function mergeValues(
  catalog: ModuleCatalog,
  candidate: unknown,
): OptionValues {
  const defaults = defaultsFor(catalog);
  if (!candidate || typeof candidate !== "object") {
    return defaults;
  }
  const values = candidate as Record<string, unknown>;
  for (const option of catalog.options) {
    if (valueMatchesOption(values[option.key], option)) {
      defaults[option.key] = values[option.key] as OptionValue;
    }
  }
  return defaults;
}

function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "check"
    | "cloud"
    | "copy"
    | "github"
    | "home"
    | "mine"
    | "refresh"
    | "rocket"
    | "shield"
    | "sparkles";
  size?: number;
}) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    cloud: (
      <>
        <path d="M17.5 19H7a5 5 0 1 1 1.7-9.7A6 6 0 0 1 20 12a3.5 3.5 0 0 1-2.5 7Z" />
        <path d="m9 14 2 2 4-5" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
      </>
    ),
    github: (
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" />
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    mine: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7h-5V2" />
        <path d="M20 7a9 9 0 1 0 1 8" />
      </>
    ),
    rocket: (
      <>
        <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2l2-2-3-3-2 2Z" />
        <path d="m9 15-3-3s2-5 6-7.5C16 2 21.5 2.5 21.5 2.5S22 8 19.5 12c-2.5 4-7.5 6-7.5 6l-3-3Z" />
        <circle cx="16" cy="8" r="2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3-1.2 3.8L7 8l3.8 1.2L12 13l1.2-3.8L17 8l-3.8-1.2L12 3Z" />
        <path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8L5 15Z" />
        <path d="m19 13-.6 1.4L17 15l1.4.6L19 17l.6-1.4L21 15l-1.4-.6L19 13Z" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

function Toggle({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span />
    </button>
  );
}

function VisibilityRow({
  option,
  visible,
  onChange,
}: {
  option: ModuleOption;
  visible: boolean;
  onChange: (visible: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <strong>{option.label}</strong>
        <span>{visible ? "当前显示" : "当前隐藏"}</span>
      </div>
      <Toggle
        checked={visible}
        label={`${visible ? "隐藏" : "显示"}${option.label}`}
        onChange={onChange}
      />
    </div>
  );
}

function FeatureRow({
  option,
  enabled,
  onChange,
}: {
  option: ModuleOption;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="setting-row feature-row">
      <div className="setting-copy">
        <strong>{option.label}</strong>
        <span>{option.description}</span>
      </div>
      <Toggle
        checked={enabled}
        label={`${enabled ? "关闭" : "开启"}${option.label}`}
        onChange={onChange}
      />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: "home" | "mine" | "shield" | "sparkles";
}) {
  return (
    <div className="section-heading">
      <div className="section-icon">
        <Icon name={icon} />
      </div>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function Customizer({
  initialCatalog,
}: {
  initialCatalog: ModuleCatalog;
}) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [catalogSource, setCatalogSource] = useState<
    "repository" | "bundled" | "loading"
  >("loading");
  const [variant, setVariant] =
    useState<ModuleVariant>("enhanced");
  const [values, setValues] = useState<OptionValues>(() =>
    defaultsFor(initialCatalog),
  );
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hydrationFrame = window.requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }
      setOrigin(window.location.origin);
      try {
        const stored = JSON.parse(
          window.localStorage.getItem(STORAGE_KEY) || "null",
        ) as {
          variant?: ModuleVariant;
          values?: unknown;
        } | null;
        if (
          stored?.variant === "cdn" ||
          stored?.variant === "enhanced"
        ) {
          setVariant(stored.variant);
        }
        setValues(mergeValues(initialCatalog, stored?.values));
      } catch {
        setValues(defaultsFor(initialCatalog));
      }
    });

    void fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("catalog unavailable");
        }
        return (await response.json()) as {
          catalog: ModuleCatalog;
          source: "repository" | "bundled";
        };
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setCatalog(payload.catalog);
        setCatalogSource(payload.source);
        setValues((current) =>
          mergeValues(payload.catalog, current),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogSource("bundled");
        }
      });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(hydrationFrame);
    };
  }, [initialCatalog]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ variant, values }),
      );
    } catch {
      // Private browsing may deny storage; customization still works.
    }
  }, [variant, values]);

  const groups = useMemo(
    () =>
      Object.fromEntries(
        catalog.groups.map((group) => [
          group.id,
          catalog.options.filter(
            (option) => option.group === group.id,
          ),
        ]),
      ) as Record<string, ModuleOption[]>,
    [catalog],
  );

  const applicableOptions = useMemo(
    () => optionsForVariant(catalog, variant),
    [catalog, variant],
  );

  const moduleUrl = useMemo(() => {
    if (!origin) {
      return "";
    }
    const url = new URL("/module.sgmodule", origin);
    url.searchParams.set("variant", variant);
    for (const option of applicableOptions) {
      url.searchParams.set(
        option.key,
        String(values[option.key] ?? option.default),
      );
    }
    return url.toString();
  }, [applicableOptions, origin, values, variant]);

  const installUrl = moduleUrl
    ? `shadowrocket://install?module=${encodeURIComponent(moduleUrl)}`
    : "#";
  const repoSynced = catalogSource === "repository";
  const uiEnabled =
    variant === "enhanced" && Boolean(values.ui);
  const intervalOption = catalog.options.find(
    (option) => option.key === "intervalHours",
  );
  const thresholdOption = catalog.options.find(
    (option) => option.key === "switchThreshold",
  );

  const visibilityOptions = useMemo(
    () =>
      ["home", "mine", "more"].flatMap((group) =>
        (groups[group] || []).filter(
          (option) => option.type === "boolean",
        ),
      ),
    [groups],
  );
  const visibleItems = visibilityOptions.filter(
    (option) => !Boolean(values[option.key]),
  );
  const hiddenItems = visibilityOptions.filter((option) =>
    Boolean(values[option.key]),
  );
  const effectiveVisibleItems = uiEnabled
    ? visibleItems
    : visibilityOptions;
  const effectiveHiddenItems = uiEnabled ? hiddenItems : [];

  function setValue(key: string, value: OptionValue) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function resetDefaults() {
    setValues(defaultsFor(catalog));
    setVariant("enhanced");
    setCopied(false);
  }

  async function copyModuleUrl() {
    if (!moduleUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(moduleUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("复制下面的模块地址", moduleUrl);
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="BiliFlow 首页">
          <span className="brand-mark">
            <span>B</span>
          </span>
          <span>
            <strong>BiliFlow</strong>
            <small>模块定制器</small>
          </span>
        </a>
        <nav>
          <a href="#modules">模块</a>
          <a href="#network">网络</a>
          <a
            href={REPOSITORY_URL}
            rel="noreferrer"
            target="_blank"
          >
            <Icon name="github" size={18} />
            <span>GitHub</span>
          </a>
        </nav>
      </header>

      <div className="page-shell" id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" />
              {repoSynced
                ? "已连接 GitHub main 最新配置"
                : catalogSource === "loading"
                  ? "正在同步 GitHub 配置"
                  : "GitHub 暂不可用 · 使用内置安全配置"}
            </div>
            <h1>
              你的 Bilibili，
              <br />
              <span>只保留真正需要的。</span>
            </h1>
            <p>
              选择 CDN-only 或 Enhanced，开启首页六条普通视频流，并逐项决定
              首页和“我的”显示什么。生成链接优先读取仓库最新模块，网络异常时
              使用本站同版本的已审核快照。Enhanced 3.9.0 已覆盖 Bilibili iOS
              9.6.1 的商业 AV/大型 Banner、闲鱼操作卡、魔力赏、Relate Story/搜索商业卡、
              后台恢复与首页六条补齐，并提供 TTFB 优先 CDN v10 与 v9 缓存媒体直达。
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#modules">
                开始定制
                <Icon name="arrow" />
              </a>
              <a
                className="button secondary"
                href={`${REPOSITORY_URL}/releases/latest`}
                rel="noreferrer"
                target="_blank"
              >
                查看发行版
              </a>
            </div>
            <div className="trust-row">
              <span><Icon name="shield" size={17} /> 不修改账号权益</span>
              <span><Icon name="refresh" size={17} /> 可持续更新</span>
              <span><Icon name="cloud" size={17} /> 同源生成</span>
            </div>
          </div>

          <div className="device-stage" aria-label="当前模块预览">
            <div className="device-card">
              <div className="device-status">
                <span>9:41</span>
                <span className="signal">●●● ᯤ 100%</span>
              </div>
              <div className="device-title">
                <span className="mini-avatar">B</span>
                <strong>当前配置</strong>
                <span className="sync-badge">
                  <Icon name="cloud" size={15} />
                  最新
                </span>
              </div>
              <div className="preview-plan">
                <span>已选择</span>
                <strong>
                  {variant === "enhanced"
                    ? "CDN + Enhanced"
                    : "CDN Switcher"}
                </strong>
                <small>
                  {variant === "enhanced"
                    ? "CDN、9.5.0 Story/搜索广告、六条 AV 与界面过滤"
                    : "仅 CDN 与流量分流"}
                </small>
              </div>
              {variant === "enhanced" ? (
                <div className="preview-grid">
                  <div>
                    <Icon name="home" />
                    <span>首页 / 我的</span>
                    <strong>{effectiveVisibleItems.length} 项显示</strong>
                  </div>
                  <div>
                    <Icon name="shield" />
                    <span>过滤能力</span>
                    <strong>
                      {(groups.features || []).filter((option) =>
                        Boolean(values[option.key]),
                      ).length} 项开启
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="preview-grid single">
                  <div>
                    <Icon name="cloud" />
                    <span>CDN 模式</span>
                    <strong>{String(values.cdn || "auto")}</strong>
                  </div>
                </div>
              )}
              <div className="preview-list">
                <div>
                  <span className="status-icon active">
                    <Icon name="check" size={15} />
                  </span>
                  <span>
                    <strong>完整分流规则</strong>
                    <small>视频、直播与 API</small>
                  </span>
                  <span className="status-text">开启</span>
                </div>
                <div>
                  <span className="status-icon active">
                    <Icon name="check" size={15} />
                  </span>
                  <span>
                    <strong>播放热路径零测速</strong>
                    <small>两阶段 cron、v9 缓存直达与 TTFB 优先评分</small>
                  </span>
                  <span className="status-text">开启</span>
                </div>
              </div>
              <div className="device-home-indicator" />
            </div>
          </div>
        </section>

        <section className="workspace" id="modules">
          <div className="workspace-main">
            <div className="panel version-panel">
              <SectionHeading
                description="两个版本都包含相同的 CDN 安全选择与 Bilibili 分流。"
                eyebrow="01 · 选择基础版本"
                icon="sparkles"
                title="从一个清晰的起点开始"
              />
              <div className="variant-grid">
                <button
                  className={variant === "enhanced" ? "selected" : ""}
                  onClick={() => setVariant("enhanced")}
                  type="button"
                >
                  <span className="variant-icon enhanced">
                    <Icon name="sparkles" />
                  </span>
                  <span>
                    <strong>CDN + Enhanced</strong>
                    <small>推荐 · 9.6.1 精确去广告、六条 AV 与 CDN v10 + v9 缓存直达</small>
                  </span>
                  <span className="radio-dot">
                    {variant === "enhanced" && <span />}
                  </span>
                </button>
                <button
                  className={variant === "cdn" ? "selected" : ""}
                  onClick={() => setVariant("cdn")}
                  type="button"
                >
                  <span className="variant-icon cdn">
                    <Icon name="cloud" />
                  </span>
                  <span>
                    <strong>仅 CDN Switcher</strong>
                    <small>只测速、选路和分流，不改变界面</small>
                  </span>
                  <span className="radio-dot">
                    {variant === "cdn" && <span />}
                  </span>
                </button>
              </div>
            </div>

            {variant === "enhanced" && (
              <>
                <div className="panel">
                  <SectionHeading
                    description="每项独立生效；关闭总开关时，下方界面选择保持但不执行。"
                    eyebrow="02 · 过滤能力"
                    icon="shield"
                    title="选择要启用的增强功能"
                  />
                  <div className="settings-list">
                    {(groups.features || []).map((option) => (
                      <FeatureRow
                        enabled={Boolean(values[option.key])}
                        key={option.key}
                        onChange={(enabled) =>
                          setValue(option.key, enabled)
                        }
                        option={option}
                      />
                    ))}
                  </div>
                </div>

                <div className={`panel ${uiEnabled ? "" : "muted-panel"}`}>
                  <SectionHeading
                    description="开关表示该入口是否显示。头像、搜索、消息、首页、关注和“我的”始终保留。"
                    eyebrow="03 · 首页"
                    icon="home"
                    title="决定首页显示什么"
                  />
                  {!uiEnabled && (
                    <div className="inline-notice">
                      “界面逐项精简”已关闭，下面选择暂不执行。
                    </div>
                  )}
                  <div className="settings-list compact">
                    {(groups.home || []).map((option) => (
                      <VisibilityRow
                        key={option.key}
                        onChange={(visible) =>
                          setValue(option.key, !visible)
                        }
                        option={option}
                        visible={!Boolean(values[option.key])}
                      />
                    ))}
                  </div>
                </div>

                <div className={`panel ${uiEnabled ? "" : "muted-panel"}`}>
                  <SectionHeading
                    description="服务入口逐项设置，未知的新服务默认保留，不使用整组白名单覆盖。"
                    eyebrow="04 · 我的"
                    icon="mine"
                    title="整理“我的”与更多服务"
                  />
                  <div className="subsection">
                    <div className="subsection-title">
                      <span>我的服务</span>
                      <small>
                        {(groups.mine || []).filter(
                          (option) => !Boolean(values[option.key]),
                        ).length}{" "}
                        项显示
                      </small>
                    </div>
                    <div className="settings-list compact">
                      {(groups.mine || []).map((option) => (
                        <VisibilityRow
                          key={option.key}
                          onChange={(visible) =>
                            setValue(option.key, !visible)
                          }
                          option={option}
                          visible={!Boolean(values[option.key])}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="subsection">
                    <div className="subsection-title">
                      <span>更多服务</span>
                      <small>
                        {(groups.more || []).filter(
                          (option) => !Boolean(values[option.key]),
                        ).length}{" "}
                        项显示
                      </small>
                    </div>
                    <div className="settings-list compact">
                      {(groups.more || []).map((option) => (
                        <VisibilityRow
                          key={option.key}
                          onChange={(visible) =>
                            setValue(option.key, !visible)
                          }
                          option={option}
                          visible={!Boolean(values[option.key])}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="panel" id="network">
              <SectionHeading
                description="默认值适合大多数网络；测速不会在每个请求中重复触发。"
                eyebrow={variant === "enhanced" ? "05 · 网络" : "02 · 网络"}
                icon="shield"
                title="CDN 与分流设置"
              />
              <div className="network-grid">
                <label>
                  <span>CDN 模式</span>
                  <select
                    onChange={(event) => {
                      const next = event.target.value;
                      setValue(
                        "cdn",
                        next === "custom"
                          ? "upos-sz-mirrorali.bilivideo.com"
                          : next,
                      );
                    }}
                    value={
                      ["auto", "off"].includes(String(values.cdn))
                        ? String(values.cdn)
                        : "custom"
                    }
                  >
                    <option value="auto">自动安全选择（推荐）</option>
                    <option value="off">关闭 CDN 改写</option>
                    <option value="custom">固定媒体主机</option>
                  </select>
                </label>
                {!["auto", "off"].includes(String(values.cdn)) && (
                  <label>
                    <span>固定 CDN 主机</span>
                    <input
                      onChange={(event) =>
                        setValue("cdn", event.target.value.trim())
                      }
                      placeholder="upos-…bilivideo.com"
                      spellCheck={false}
                      value={String(values.cdn)}
                    />
                  </label>
                )}
                <label>
                  <span>Bilibili 分流策略</span>
                  <input
                    onChange={(event) =>
                      setValue(
                        "routingPolicy",
                        event.target.value.trimStart(),
                      )
                    }
                    placeholder="DIRECT 或回国策略组"
                    value={String(values.routingPolicy)}
                  />
                </label>
                <label>
                  <span>PCDN 策略</span>
                  <input
                    onChange={(event) =>
                      setValue(
                        "pcdnPolicy",
                        event.target.value.trimStart(),
                      )
                    }
                    placeholder="DIRECT / REJECT / 策略组"
                    value={String(values.pcdnPolicy)}
                  />
                </label>
              </div>

              <details className="advanced">
                <summary>
                  <span>高级测速设置</span>
                  <small>缓存、阈值与调试</small>
                  <Icon name="arrow" size={18} />
                </summary>
                <div className="advanced-body">
                  <label className="full-field">
                    <span>网络档案</span>
                    <input
                      onChange={(event) =>
                        setValue(
                          "networkProfile",
                          event.target.value.trim(),
                        )
                      }
                      placeholder="auto / home_wifi / cellular"
                      value={String(values.networkProfile)}
                    />
                    <small>
                      手动命名可隔离不同网络的测速缓存；auto
                      不会声称识别你的 Wi‑Fi 名称。
                    </small>
                  </label>
                  <label>
                    <span>测速执行方式</span>
                    <select
                      onChange={(event) =>
                        setValue("probeMode", event.target.value)
                      }
                      value={String(values.probeMode)}
                    >
                      <option value="cron">
                        后台定时测速（推荐）
                      </option>
                      <option value="nonblocking">旧版 nonblocking（映射为 cron）</option>
                      <option value="blocking">
                        热路径诊断（会等待）
                      </option>
                      <option value="off">关闭后台测速，保留 Akamai 回退</option>
                    </select>
                    <small>
                      默认测速在独立 cron 中完成，打开视频、拖动和倍速响应均不发
                      Range 探测。主机需在两个不同匿名对象上通过内部 Range/hash
                      校验；连续失败会短期熔断。v9 还会用当前响应保存的完整目标 URL
                      接住 App 缓存/预加载的同一媒体请求，不拼接主机或签名。
                    </small>
                  </label>
                  <label className="range-field">
                    <span>
                      后台测速间隔
                      <strong>{Number(values.intervalHours)} 小时</strong>
                    </span>
                    <input
                      max={intervalOption?.maximum ?? 72}
                      min={intervalOption?.minimum ?? 2}
                      onChange={(event) =>
                        setValue(
                          "intervalHours",
                          Number(event.target.value),
                        )
                      }
                      type="range"
                      value={Number(values.intervalHours)}
                    />
                  </label>
                  <label className="range-field">
                    <span>
                      切换阈值
                      <strong>{Number(values.switchThreshold)}%</strong>
                    </span>
                    <input
                      max={thresholdOption?.maximum ?? 80}
                      min={thresholdOption?.minimum ?? 10}
                      onChange={(event) =>
                        setValue(
                          "switchThreshold",
                          Number(event.target.value),
                        )
                      }
                      type="range"
                      value={Number(values.switchThreshold)}
                    />
                  </label>
                  <div className="reset-field full-field">
                    <label>
                      <span>CDN 学习状态令牌</span>
                      <input
                        onChange={(event) =>
                          setValue(
                            "resetToken",
                            event.target.value.trim(),
                          )
                        }
                        placeholder="none"
                        value={String(values.resetToken)}
                      />
                    </label>
                    <button
                      onClick={() =>
                        setValue(
                          "resetToken",
                          `reset_${Date.now().toString(36)}`.slice(0, 32),
                        )
                      }
                      type="button"
                    >
                      生成重置令牌
                    </button>
                    <small>
                      令牌发生变化时仅清空一次测速缓存；生成后重新安装或更新模块即可。
                    </small>
                  </div>
                  <div className="setting-row">
                    <div className="setting-copy">
                      <strong>调试日志</strong>
                      <span>仅排错时临时开启，不记录完整媒体 URL。</span>
                    </div>
                    <Toggle
                      checked={Boolean(values.debug)}
                      label="切换调试日志"
                      onChange={(enabled) =>
                        setValue("debug", enabled)
                      }
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>

          <aside className="summary-column">
            <div className="summary-card">
              <div className="summary-header">
                <span>配置摘要</span>
                <button onClick={resetDefaults} type="button">
                  <Icon name="refresh" size={15} />
                  恢复默认
                </button>
              </div>
              <div className="summary-version">
                <span className={`variant-icon ${variant}`}>
                  <Icon
                    name={variant === "enhanced" ? "sparkles" : "cloud"}
                  />
                </span>
                <span>
                  <strong>
                    {variant === "enhanced"
                      ? "CDN + Enhanced"
                      : "仅 CDN Switcher"}
                  </strong>
                  <small>优先跟随 GitHub main · 含安全快照</small>
                </span>
              </div>
              {variant === "enhanced" && (
                <div className="summary-stats">
                  <div>
                    <strong>{effectiveVisibleItems.length}</strong>
                    <span>可配置项显示</span>
                  </div>
                  <div>
                    <strong>{effectiveHiddenItems.length}</strong>
                    <span>可配置项隐藏</span>
                  </div>
                </div>
              )}
              <div className="summary-lines">
                <div>
                  <span>CDN</span>
                  <strong>{String(values.cdn)}</strong>
                </div>
                <div>
                  <span>分流</span>
                  <strong>{String(values.routingPolicy)}</strong>
                </div>
                <div>
                  <span>缓存有效期</span>
                  <strong>{String(values.intervalHours)} 小时</strong>
                </div>
              </div>
              <a
                aria-disabled={!moduleUrl}
                className="install-button"
                href={installUrl}
              >
                <Icon name="rocket" />
                一键安装到 Shadowrocket
              </a>
              <button
                className="copy-button"
                disabled={!moduleUrl}
                onClick={copyModuleUrl}
                type="button"
              >
                <Icon name={copied ? "check" : "copy"} size={18} />
                {copied ? "链接已复制" : "复制可更新模块链接"}
              </button>
              <p className="install-note">
                安装后仍可在 Shadowrocket
                内更新；同一链接会保留本页选择，并优先获取最新脚本。
              </p>
            </div>
            <div className="safety-card">
              <Icon name="shield" />
              <div>
                <strong>明确的安全边界</strong>
                <p>
                  不伪造会员、订单、支付、登录或地区授权；HTTPS
                  解密只覆盖模块中列出的 Bilibili API 域名。
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <footer>
        <div>
          <span className="brand-mark small"><span>B</span></span>
          <span>
            <strong>BiliFlow</strong>
            <small>Open source · MIT License</small>
          </span>
        </div>
        <p>
          Bilibili 与 Shadowrocket
          商标归各自权利人所有。本项目为独立社区工具。
        </p>
        <a href={REPOSITORY_URL} rel="noreferrer" target="_blank">
          查看源代码 <Icon name="arrow" size={16} />
        </a>
      </footer>

      <div className="mobile-install-bar">
        <div>
          <small>当前版本</small>
          <strong>
            {variant === "enhanced" ? "CDN + Enhanced" : "仅 CDN"}
          </strong>
        </div>
        <a aria-disabled={!moduleUrl} href={installUrl}>
          <Icon name="rocket" size={19} />
          一键安装
        </a>
      </div>
    </main>
  );
}
