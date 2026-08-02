# Shadowrocket 后台 CDN 自适应与 Relate Story 去广告设计

日期：2026-08-02
状态：已获用户方向确认，待规格复核
目标客户端：Bilibili iOS 9.5.0（build 90500100）、Shadowrocket

## 1. 问题与证据

本设计只处理两类结果：在可用带宽充足时降低起播、倍速和拖动卡顿概率；让已知广告入口在冷启动、长时间后台恢复和新响应到达后继续被过滤。

### 1.1 播放卡顿

`PacketTunnel-20260802231603.log` 中，媒体主 URL 是
`upos-sz-mirrorcosov.bilivideo.com`，服务端完整备用 URL 是
`upos-hz-mirrorakam.akamaized.net`。主 CDN 通常约 30 ms 建连，但播放器随后反复在约
2 秒后才启用 Akamai 备用连接；日志中共有 23 次约 2000–2004 ms 的备用请求等待。

当前仓库默认 `测速方式=nonblocking`。它在启动 Range 请求后立即调用 `$done()`，再期望
回调更新持久状态。真实日志中脚本上下文在每份响应后被 recycle/dealloc，而且没有出现一次
测速专用 User-Agent，因此该学习路径在本次 Shadowrocket 运行中实际没有执行完成。

当前奥克兰网络的匿名公开媒体对象实测进一步确认：

- 16 个维护候选都能对三个不同 Range 返回内容一致的 206；
- `mirrorcosov` 的 256 KiB 文件头可在约 185 ms 完成，但两个 1 MiB 内部区间分别约
  10.9 秒和 11.9 秒；
- 三轮 4 MiB 持续测试中，`mirrorcosov` 两次 15 秒硬超时、一次连接重置；
- 服务端完整 Akamai URL 三轮约 22.5–25.8 Mbps，均成功；
- `mirroraliov` 峰值最高，但三轮约 9.6、176.8、113.0 Mbps，抖动明显；
- `mirrorali` 三轮中两轮连接重置。

结论：文件头、DNS、TCP 建连和单次短样本都不足以预测拖动后的持续吞吐。默认应优先
低分位吞吐和失败率，而不是峰值；播放响应热路径不能承担后台学习任务。

### 1.2 长时间后台后的广告恢复

Bilibili 9.5.0 新请求 `/x/v2/feed/index/relate/story` 出现在竖屏播放页切换链路中，
但 v3.7.0 的 Story、Enhance 和 Refresh matcher 均未覆盖它。它因此可以绕过：

- Story `data.items` 广告过滤；
- 请求端 ETag/Last-Modified 缓存守卫；
- 响应端 `no-store`；
- 嵌套 play URL 的 CDN 处理。

日志同时证明其他已匹配脚本仍在持续运行，所以本次“后台后失效”首先按端点漏配和缓存
重新注入修复，不归因于整个插件停止运行。

## 2. 目标与验收条件

### 2.1 CDN

1. 常规 playurl/PlayerUnite/Story 响应处理不发出任何测速请求。
2. 常规响应脚本在同步修改和持久状态读取完成后调用一次 `$done()`；`$done()` 后没有状态写入。
3. 无学习状态或状态过期时，只要当前响应含服务端完整 Akamai 备用 URL，稳定模式立即把它
   提升为主 URL，并保留原主 URL 和其他备用 URL。
4. 永不把普通 UPOS URL 仅替换 hostname 后伪造成 Akamai URL。
5. 非 Akamai alias 只有在后台脚本对至少两个不同公开媒体对象证明 Range 内容一致后才可晋升。
6. 选择状态按网络档案持久化，脚本上下文重建不影响使用。
7. 单次失败不清空最后有效选择；连续失败触发熔断并回退完整 Akamai 或服务端主 URL。
8. 直播 URL、未知结构、签名不完整候选保持原样。

### 2.2 去广告

1. `/x/v2/feed/index/relate/story` 同时命中请求缓存守卫和 Story Safe Pipeline。
2. 已知 `vertical_ad_*`、推广项、带明确商业字段的项被删除。
3. 普通 `vertical_av` 项、账号/播放必需字段和未知结构保持原样。
4. 同一响应只写回一次；先过滤 Story，再处理其余普通媒体项中的 play URL。
5. 过滤后的响应带 `Cache-Control: no-store` 等现有一致的禁缓存头。

## 3. 选择的架构

采用“后台 cron 自适应 + 播放热路径零测速 + 冷启动完整 Akamai”的混合方案。

```text
Shadowrocket cron（每两小时唤醒）
  -> 获取公开、未登录 playurl
  -> 选择轮转的内部 1 MiB Range
  -> 串行验证参考 URL、当前胜者、Akamai、一个挑战者
  -> 校验 206 / Content-Range / 总长 / 实长 / hash / 类型 / 重定向
  -> 更新 host-level v8 持久状态

Bilibili playurl / PlayerUnite / Story 响应
  -> 只读取 v8 host state
  -> 有新鲜稳定胜者：使用当前响应的完整 URL，或已验证的非 Akamai alias
  -> 无状态/过期：完整 Akamai URL 立即优先
  -> 无完整 Akamai：保留服务端主 URL
  -> 同步 $done()，不测速
```

Shadowrocket 社区手册明确列出 `cron` 脚本类型；公开 Bilibili cron 示例使用六字段
`cronexp`、`wake-system=1` 和超时参数。模块生成器将为包含 CDN 的模块加入：

```ini
Bilibili CDN Background Probe = type=cron,cronexp=0 17 */2 * * *,wake-system=1,timeout=45,engine=webview,...
```

Cron 每两小时被调度一次，但脚本内部仍读取“测速间隔”参数；尚未达到间隔时立即完成，避免
更改模块参数后必须重新生成 cron 表达式。

## 4. 后台测速算法

### 4.1 输入对象

使用仓库内维护的公开、未登录视频样本，不读取 Bilibili App Cookie、access_key、buvid、
设备 ID 或用户日志 URL。至少维护三个可替换样本；一个接口失败时尝试下一个。

请求带普通网页 Referer/User-Agent、`Accept-Encoding: identity` 和跳过脚本重入标记。
响应只在内存中解析，持久状态不保存完整 URL、query、签名或正文。

### 4.2 每轮候选

每轮最多测量：

1. 服务端完整参考 URL；优先完整 Akamai，缺少时用服务端主 URL；
2. 当前持久胜者；
3. 当前响应中的完整 Akamai（若未作为参考）；
4. 维护列表中由游标选出的一个非 Akamai挑战者。

重复主机去重。候选串行测试，避免并发争抢带宽污染结果。全部 16 个候选由游标逐轮覆盖；
当前胜者和 Akamai每轮复核。

### 4.3 Range

1. 先对参考 URL 取 64 KiB 前缀以获得严格总长度。
2. 在 1/4、1/2、3/4 三个文件内部位置间轮转同一 1 MiB Range。
3. 所有候选必须与参考 URL 的 Range 起止、总长度、实际长度和样本 hash 完全一致。
4. 单请求硬截止 5 秒；不是“5 秒无数据”的空闲超时，并为 45 秒 cron 总时限留出状态持久化余量。
5. 状态码非 206、错误页、压缩、跨对象重定向、Range 偏移或正文超限都记为失败。

每轮约 2–4 MiB，默认每 2 小时至多约 24–48 MiB/日；实际间隔可调大。测速脚本不在
用户打开视频、拖动或切倍速时运行于对应响应上下文。

### 4.4 稳定优先评分

每主机保留最近 8 个有界样本和最多 4 个已验证对象摘要。统计：

- 成功率、连续失败数；
- p25 和中位持续吞吐；
- 中位 TTFB；
- MAD/中位数形式的抖动比；
- 最近成功、最近失败和熔断截止时间；
- 验证过的不同媒体对象数。

默认选择资格：

- 至少两个不同对象验证一致；
- 最近 6 小时内成功；
- 最近样本失败率不高于 25%；
- p25 吞吐达到 `max(10 Mbps, representation 所需带宽 × 1.8)`；
- 未处于熔断状态。

稳定分数以 p25 吞吐为主体，按失败率和抖动惩罚。它会让本次稳定在约 22–26 Mbps 的
Akamai 优先于峰值更高但低分位只有约 9.6 Mbps 的 `mirroraliov`。

连续两次失败或最近 4 次中至少两次失败时熔断 2 小时。一次失败只降低评分并保留最后有效
选择；避免短暂网络波动导致频繁切线。

## 5. 播放响应热路径

### 5.1 状态选择顺序

对每个当前响应的媒体描述：

1. 固定 `CDN=off`：原样返回。
2. 用户显式固定主机：保留现有完整 URL 规则；本次响应没有该完整候选时不改写。
3. `CDN=auto` 且有新鲜、合格的 host-level 胜者：尝试当前对象上的该主机。
4. 无合格胜者、状态过期或状态损坏：若有服务端完整 Akamai URL，立即提升 Akamai。
5. 否则保留服务端主 URL。

热路径不读取或等待 cron 锁，不触发 Range，不进行第二次确认，不写测速样本。

### 5.2 URL 规则

- 服务端提供的完整候选可直接重新排序。
- Akamai 只接受服务端完整 URL；不做 hostname 替换。
- 非 Akamai alias 只允许维护列表内主机，且需要后台至少两个不同对象验证。
- alias 从当前服务端主 URL复制，仅替换 hostname；scheme、port、path、query 和 fragment
  原样保留。
- 晋升后把原主 URL 放入备选首位，去重但保持其余服务器顺序。

### 5.3 长后台与网络变化

v8 状态写入 `$persistentStore`，不依赖 JSC/WebView 实例。Cron 未运行时仍能使用最后有效
状态；超过 6 小时不再使用 alias，回退完整 Akamai。超过 24 小时或状态损坏时只执行冷启动
规则。

Shadowrocket 没有在已采用资料中提供可依赖的脚本级 SSID/蜂窝指纹，因此不伪造自动网络
识别。现有“网络档案”参数继续用于 Wi-Fi/蜂窝的用户显式隔离；`auto` 作为共享档案并依赖
短 TTL 与稳定 fallback。

## 6. v8 状态与迁移

新键使用 `BiliCDN.hostAuto.v8`。大致结构：

```json
{
  "version": 8,
  "resetToken": "none",
  "profiles": {
    "auto": {
      "lastRunAt": 0,
      "nextRunAt": 0,
      "challengerCursor": 0,
      "rangeCursor": 0,
      "selectedHost": "",
      "selectedAt": 0,
      "hosts": {}
    }
  },
  "lock": null
}
```

约束：最多 4 个网络档案、每档最多 16 个主机、每主机最多 8 个样本。v7 exact-object 选择
不迁移为 v8 host 选择，因为 v7 的真实 Shadowrocket 回调没有证据证明成功完成；首次 v8
运行按冷启动完整 Akamai规则工作。

Cron 锁带创建时间和 60 秒截止；过期锁可恢复。写入前重新读取并合并同一档案，减少并发覆盖。

## 7. Relate Story 与缓存恢复

### 7.1 Matcher

Story pattern 扩展为精确覆盖：

```text
/x/v2/feed/index/story
/x/v2/feed/index/story/cart
/x/v2/feed/index/relate/story
```

Refresh pattern 同步覆盖三者。普通 `/x/v2/feed/index` 仍由现有 Enhance 处理，避免同一响应被
两个 response 脚本写回。

### 7.2 分类与处理

`relate/story` 映射到现有 Story handler：

1. 正文必须为严格 JSON；否则原样返回。
2. `data.items` 为数组时应用已知 Story 广告判据。
3. 广告过滤开启且严格普通视频模式开启时，只保留明确 `vertical_av`。
4. 结构未知时 fail-open，不清空整个响应。
5. 过滤完成后在同一 runtime 中处理保留项内的 play URL。
6. 修改过的响应统一写入现有 no-store 头。

请求缓存守卫删除 `If-None-Match`、`If-Modified-Since`、Range 之外的已知条件缓存头，并添加
现有 cache-busting 请求头，避免后台恢复拿到 304 或旧广告响应。

## 8. 代码与工具变更

预计修改：

- `src/bilibili-cdn.js`：移除 auto 热路径 nonblocking 探测，读取 v8 host state并执行同步选择。
- `src/bilibili-cdn-benchmark.js`：Shadowrocket cron runtime。
- `src/bilibili-enhance.js`：识别 `relate/story`。
- `src/bilibili-refresh.js`：为 `relate/story` 应用请求缓存守卫。
- `scripts/build.mjs`：生成 cron dist、模块 cron 行和新 matcher。
- `config/module-options.json`：默认 `测速方式=cron`，更新描述和间隔范围。
- `scripts/benchmark-cdn.mjs`：匿名桌面逐项测速工具，不读取用户日志或凭证。
- `test/*`：v8、cron、Story、module 和构建回归。
- README、架构、审计、变更日志和站点说明。

`nonblocking` 作为旧参数输入时映射到 `cron`，不再启动 post-`$done()` 回调；`blocking` 仅保留
显式诊断兼容，`off` 禁止后台测速但仍允许冷启动完整 Akamai规则。

## 9. 测试策略

先写失败测试，再实现：

1. 热路径在 auto/cron 模式调用 probe 计数恒为 0。
2. 无状态且有完整 Akamai 时当前响应立即重排；无完整 Akamai 时不裸换。
3. 新鲜合格 alias 可跨新媒体对象应用当前 URL；过期、单对象或熔断 alias 不可用。
4. 原主 URL 与所有备用 URL 保留且去重。
5. v7 状态不迁移；v8 容量、TTL、锁和损坏状态恢复。
6. Cron 严格 Range/hash 校验、硬截止、轮转位置、挑战者轮转、对象数门槛和稳定评分。
7. Cron 失败不会清空最后有效选择，连续失败会熔断。
8. `/relate/story` matcher、classifier、广告删除、普通项保留、unknown fail-open、no-store。
9. Combined Story runtime 对同一响应只 `$done()` 一次并完成 CDN 处理。
10. 所有模块生成产物包含一个且仅一个 cron 行；Enhanced/CDN variant 均一致。
11. `npm run check`、站点构建、生成产物一致性和匿名联网 benchmark。

## 10. 回滚与真机验收

回滚开关：

- `CDN=off`：完全停止 CDN 改写；
- `测速方式=off`：停止 cron 学习，保留完整 Akamai冷启动 fallback；
- 修改“重置令牌”：清空 v8 学习状态；
- 关闭广告过滤：Story 原样返回。

真机至少验证：冷启动、后台 30 分钟、后台 4 小时、Wi-Fi/蜂窝切换、五个不同视频、4K、
倍速、连续十次拖动、竖屏相关推荐、暂停/恢复和自动连播。日志应看到 cron 独立运行，但每个
playurl response 中不出现测速 UA；媒体应直接请求选中主机，不再先等待约 2 秒才走 Akamai。
