# v3.8.0 审计：Shadowrocket 零探测播放热路径、CDN cron 与 Relate Story

> 审计日期：2026-08-03（Pacific/Auckland）
> 日志样本：`/Users/young/Downloads/PacketTunnel-20260802231603.log`
> App 基线：Bilibili iOS 9.5.0，build `90500100`
> 结论边界：代码与匿名桌面网络测试已完成；iPhone/Shadowrocket 长后台仍需按本文清单真机验收。

## 1. 日志结论

日志共 4320 行。分析时只统计 endpoint、主机、时间与脚本生命周期；日志中的
`access_key`、签名 query 和设备参数没有复制进仓库、测试 fixture 或持久状态。

主要卡顿不是“TCP 完全连不上”，而是主线路很快建连后在媒体传输阶段卡住，App 约
2 秒后才启用备用线路：

- 服务端主 URL 为 `upos-sz-mirrorcosov.bilivideo.com`，完整备用 URL 为
  `upos-hz-mirrorakam.akamaized.net`；
- cosov DNS/TCP 常在约 30–35 ms 完成，例如日志 538–561、749 行，但随后出现关闭、
  重试或长时间没有有效媒体进展；
- 日志中精确出现 **23 次** Akamai `match tcp request` 等待 `2000–2004 ms`，例如
  664、723、734、880、891 行。这一固定量级更符合备用连接的延迟启用，而不是 DNS
  或 Akamai 自身连接慢；
- Akamai 真正开始连接后，本样本多在约 150–223 ms 内完成 TCP 连接。把服务端已经
  给出的完整 Akamai URL直接提升，可消除“先等 cosov 卡住，再等约 2 秒 fallback”这一段；
- `bilibili-cdn.js` 的 WebKit 上下文被 recycle 6 次。v3.7 默认 `nonblocking` 在
  `$done()` 后等待 probe 回调写状态，但日志中没有一次测速专用 User-Agent；因此不能
  把 post-`$done()` 回调当作 Shadowrocket 持久学习机制；
- `/x/v2/feed/index/relate/story` 出现在日志 993 行，但 v3.7 的 Story/Refresh matcher
  未覆盖，竖屏相关推荐广告和其中的播放 URL 可绕过同一过滤/选路链。

## 2. 16 个候选的匿名手动复核

测试使用公共未登录 playurl，不读取日志 URL、Cookie、`access_key`、`buvid` 或设备
标识。每个候选先与服务端参考 URL比较三个 Range 的状态、起止、总长、实长与正文
hash。当前网络下，仓库维护的 16 个候选都曾对该对象返回内容一致的 `206`：

```text
upos-sz-mirrorali.bilivideo.com
upos-sz-mirrorcos.bilivideo.com
upos-sz-mirrorhw.bilivideo.com
upos-sz-mirroraliov.bilivideo.com
upos-sz-mirrorcosov.bilivideo.com
cn-hk-eq-01-01.bilivideo.com
cn-hk-eq-01-03.bilivideo.com
cn-hk-eq-01-09.bilivideo.com
cn-hk-eq-01-10.bilivideo.com
cn-hk-eq-01-12.bilivideo.com
cn-hk-eq-01-13.bilivideo.com
cn-hk-eq-01-14.bilivideo.com
cn-jxnc-cmcc-bcache-06.bilivideo.com
upos-hz-mirrorakam.akamaized.net
upos-sz-mirroralib.bilivideo.com
upos-sz-mirrorbos.bilivideo.com
```

“能返回相同字节”不等于持续稳定。随后对代表性主机做三轮 4 MiB 内部 Range 复测：

| 主机 | 三轮结果（Mbps） | 成功 | 观察 |
| --- | --- | ---: | --- |
| `mirroraliov` | 9.55 / 176.83 / 112.96 | 3/3 | 峰值最高，但低分位和抖动差 |
| 完整 Akamai | 25.80 / 22.54 / 22.86 | 3/3 | 峰值不最高，但三轮最稳定 |
| `mirrorhw` | 17.05 / 21.47 / 13.88 | 3/3 | 可用但低于 Akamai |
| `cn-hk-eq-01-03` | 22.99 / 11.45 / 23.42 | 3/3 | 有明显低谷 |
| `mirrorali` | — | 1/3 | 两次 `ECONNRESET` |
| `mirrorcosov` | — | 0/3 | 两次 15 秒硬超时，另一次 reset |

同一轮还观察到 cosov 前缀约 185 ms，但 1 MiB 内部样本约 10.9–11.9 秒；这证明只测
DNS、TCP、TTFB 或文件前缀会把“连接快、内部持续传输卡”的主机误判为快线。

这些数字只代表 2026-08-03 当前出口网络，不应硬编码成全球排序。v3.8 因而选择
“p25 + 失败率 + 抖动 + 两个不同对象”而不是单次峰值；本轮会让稳定约 22–26 Mbps
的 Akamai 优先于峰值更高但低分位约 9.6 Mbps 的 aliov。

实现完成后的最终 1 MiB 全量复跑再次验证了这种波动：`mirroraliov` 为 40.42 Mbps /
104.4 ms TTFB，`mirrorcosov` 为 7.34 Mbps，完整 Akamai 为 7.14 Mbps，而
`mirrorali` 本轮 5 秒后失败；其余 12 个候选均返回内容一致的 `206`，约
2.50–5.59 Mbps。单次最快仍是 aliov，但它不能推翻前述三轮低分位；完整 Akamai
继续作为无状态冷启动 fallback，后台状态只有在两个对象和低分位门槛都通过后才会
允许 aliov 等镜像接管热路径。

可用以下命令在当前网络重新逐个验证；输出只含主机、状态、Range、TTFB、总耗时、
吞吐和原因：

```bash
npm run benchmark:cdn
```

## 3. v3.8 CDN 实现

### 播放响应热路径

JSON、gRPC 和 Story 响应执行相同顺序：

1. `CDN=off`：不改写；固定主机只提升当前对象已经带回的完整 URL；
2. `CDN=auto`：同步读取 `BiliCDN.hostAuto.v8`，整个响应不调用 `$httpClient` probe；
3. 有新鲜合格胜者时使用它；服务端已有完整候选就重排，非 Akamai alias 仅在两个
   不同匿名对象验证后才复制当前主 URL并替换 hostname；
4. 无合格胜者时，若响应有完整 Akamai 备用 URL则立即提升；原主 URL成为第一备用；
5. 响应没有完整 Akamai 时不裸换 host，保留服务器主 URL。

这条路径不等待 cron 锁、不做第二次确认、不在 `$done()` 后写样本。测试对 JSON、gRPC
和 legacy `nonblocking` 输入都断言 probe 次数为 0、完成回调一次且无延后持久写入。

### 独立 cron

模块增加一个六字段 Shadowrocket cron：

```ini
Bilibili CDN Background Benchmark = type=cron,cronexp=0 17 */2 * * *,wake-system=1,timeout=45,engine=webview,...
```

cron 的每个媒体请求硬截止 5 秒并串行执行，避免候选争抢带宽，并在 45 秒任务总时限内为状态持久化留出余量。每轮轮换公共样本、
内部 Range 和挑战者；当前胜者、完整 Akamai 与尚待第二对象确认的候选会优先复核。
持久状态上限为 4 个网络档案、每档 16 主机、每主机 8 样本和 4 个对象 hash。状态不
保存 path、query、完整 URL、正文或用户凭证。

资格门槛：两个不同对象、6 小时内成功、失败率不高于 25%、p25 吞吐至少
`max(10 Mbps, 表示所需吞吐 × 1.8)` 且未熔断。连续两次失败或最近四次中两次失败
熔断两小时；一次失败只降低评分，不立即清空最后选择。alias 6 小时过期，状态超过
24 小时回到完整 Akamai冷启动。v7 状态不迁移。

## 4. 去广告与后台恢复

- Story matcher 现在精确覆盖 `/story`、`/story/cart` 与 `/relate/story`；
- Refresh 请求缓存守卫同步覆盖三者，移除条件缓存头并强制 no-cache；
- `/relate/story` 复用严格 Story handler：只保留明确、状态正常、无商业证据的
  `vertical_av`，未知结构 fail-open；
- 同一生成运行时先过滤广告，再对剩余项应用 v8 CDN；只调用一次 `$done()`；
- 修改后的响应统一移除 ETag/Last-Modified/Content-Length 并返回 `no-store`，避免
  长后台后旧响应或 304 把广告重新带回。

## 5. 主要文件

- `src/bilibili-cdn.js`：v8 主机状态、稳定评分、冷启动 Akamai、JSON/gRPC 热路径；
- `src/bilibili-cdn-benchmark.js`：Shadowrocket cron runtime；
- `scripts/benchmark-cdn.mjs`：匿名桌面逐主机复测工具；
- `src/bilibili-enhance.js`、`src/bilibili-refresh.js`：Relate Story；
- `scripts/build.mjs`：cron、版本化 runtime 与模块生成；
- `test/bilibili-cdn*.test.js`、`test/benchmark-cdn.test.js`、`test/module.test.js`：
  状态、热路径、cron、严格 Range、模块和 combined runtime 回归。

## 6. 更新、回滚与真机验收

更新模块后应看到 `3.8.0`，所有 runtime URL 含 `?v=3.8.0`，`[Script]` 中恰有一个
`Bilibili CDN Background Benchmark`。默认参数应为 `CDN=auto`、`测速方式=cron`、
`测速间隔=2`。

按影响从小到大回滚：

1. `测速方式=off`：停止 cron，仍保留完整 Akamai冷启动回退；
2. 修改“重置令牌”：清空一次 v8 学习状态；
3. `CDN=off`：完全停止 CDN URL改写；
4. 关闭 `广告过滤`/严格推荐开关；
5. 停用模块。

真机至少验证：冷启动、后台 30 分钟、后台 4 小时、Wi‑Fi/蜂窝切换、五个不同视频、
4K、2× 倍速、连续十次拖动、竖屏相关推荐、暂停/恢复与自动连播。新的 PacketTunnel
日志应显示 cron 独立运行；每个 playurl response 中不应出现后台测速 UA，也不应再先
等待约 2 秒才开始服务端完整 Akamai请求。
