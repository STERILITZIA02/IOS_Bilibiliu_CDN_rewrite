# v3.6.0 增量审计：CDN 持续吞吐、失败线路熔断与精确广告入口

> 审计日期：2026-07-30
>
> App 基线：Bilibili iOS 9.5.0
>
> 输入：仓库 v3.5.0、用户提供的 PacketTunnel 日志、公开协议定义、当前上游实现、
> 当前公开接口与 2026-07-30 新西兰奥克兰网络快照
>
> 结论边界：代码、生成产物、自动化测试和公开网络样本已经验证；真实 iPhone/iPad
> 的最终 UI、后台恢复和长时间播放仍必须按 `DEVICE_ACCEPTANCE.md` 验收。任何一次
> 地域网络测速都不能证明某个 CDN 在全球永久可用或永久最快。

## 1. 已确认问题（按严重度）

### 严重：短样本低延迟不等于可持续播放吞吐

v3.5 的自动模式用 256 KiB 样本验证对象一致性和测量速度。这个大小足以发现错误页、
签名串用和明显的对象不一致，却可能把“首包快、随后限速”的线路误判为适合高码率视频。
一旦缓存该选择，同一媒体对象后续请求可能持续只有 100–200 KB/s，表现为频繁缓冲，
而不是立即失败。

### 严重：失败或持续低速的主机缺少跨媒体短期熔断

对象级缓存会阻止 URL、token 和 representation 串用，但同一个故障 CDN 主机仍可能在
下一条视频的服务端候选中再次被探测。网络区域性故障、403、超时或限速期间，这会造成
重复试错和多条视频连续卡顿。

### 高：已验证选择在长期后台恢复后可能已经陈旧

对象级选择的 TTL 允许较长时间复用；如果 App 长时间后台、蜂窝/Wi-Fi 发生变化，或节点
状态发生改变，仅依据旧成功记录立即晋升候选会放大恢复后的卡顿。旧逻辑没有较短的
“重新验证新鲜度”窗口。

### 高：搜索默认词和联想运营词有独立下发入口

搜索结果卡过滤不能覆盖搜索框默认词和联想词。当前公开实现与协议表明以下入口独立下发
运营内容：

- JSON `api.vc.bilibili.com/search_svr/v*/Search/recommend_words`
- gRPC `/bilibili.app.interface.v1.Search/DefaultWords`

它们在搜索结果已经过滤后仍可异步出现，属于独立重新注入链路。

### 中：漫画 Flash/ListFlash 是独立闪屏素材入口

`manga.bilibili.com/twirp/comic.v*.Comic/Flash` 和 `ListFlash` 与主 App 的四个 splash
接口不同。原 matcher 和 classifier 都不会命中，因此漫画入口可能继续显示自己的闪屏
运营素材。

### 未确认：会员购动态页面中所有弹窗都是广告

公开微前端中发现了店铺公告、主体变更和迁移提示等弹窗 API；这些接口同时涉及监管、
卖家账户和业务迁移，不能证明是纯广告。整域阻断或修改 HTML/JavaScript 可能破坏登录、
订单、支付与已购权益，本版本不做无证据规则。

## 2. 会直接导致广告偶发漏过的入口

1. `Search/DefaultWords`：gRPC endpoint 未匹配，搜索框默认运营词可在页面加载后出现。
2. `Search/recommend_words`：JSON endpoint 未匹配，联想运营词可独立刷新。
3. 漫画 `Flash` / `ListFlash`：独立域名和 endpoint 未匹配，主 splash 处理无法覆盖。
4. v3.5 已确认并保留修复的 Story `/cart`、`SearchByType`、直播延迟商业容器：
   它们都是主响应之后的独立异步响应，不能依赖第一次页面过滤。

首页、播放页、“我的页”、暂停页和结束页的既有精确 matcher/classifier/handler 没有被
放宽或替换；每份刷新、分页、恢复和异步响应仍独立、幂等地处理。

## 3. 每个入口的具体修复

| 入口 | v3.6.0 处理 |
| --- | --- |
| `Search/recommend_words` | 增加精确 host/path matcher 与 classifier；仅在广告过滤和搜索运营词开关同时启用时返回合法空 JSON 对象 |
| `Search/DefaultWords` | 增加精确 gRPC method matcher；返回协议允许的空 `DefaultWordsReply`，保留合法 gRPC framing |
| 漫画 `Flash` / `ListFlash` | 增加精确 twirp method matcher；广告过滤启用时返回 endpoint-specific 空 JSON 对象 |
| 缓存重新显示 | 新入口加入请求侧条件缓存保护，并在已修改响应上设置 no-store；每份响应独立处理，不依赖跨请求可变数组 |
| 未知版本/结构 | 不命中精确 endpoint、不能解析、超限、未知压缩或未知 schema 时原样放行 |

新增逻辑重复执行结果不再变化。它不扫描整个 Bilibili 域名，也不拦截普通搜索结果、
漫画正文、封面、音频、视频、字幕、弹幕或会员购业务资源。

## 4. 广告请求与异步重新注入链路

### 修改前

```text
搜索页主结果
  -> SearchAll / SearchByType 精确过滤
  -> UI 渲染普通结果

DefaultWords / recommend_words 延迟响应
  -> matcher 未命中
  -> 搜索框运营词重新出现

漫画入口
  -> 主 App splash 已过滤
  -> 漫画 Flash/ListFlash 使用独立域名和接口
  -> 闪屏运营素材仍可出现
```

### 修改后

```text
每一份主响应、刷新、分页和延迟响应
  -> 精确 endpoint registry
  -> endpoint-specific classifier
  -> 开关与 schema adapter
  -> changed: 合法空响应 + no-store
     no-op/fail-open: 原始响应

SearchAll / SearchByType
  -> 继续字段级过滤商业卡并保留未知 wire bytes

DefaultWords / recommend_words
  -> 独立精确空成功响应

漫画 Flash / ListFlash
  -> 独立精确空成功响应
```

## 5. CDN 连接、缓存、探测和切换流程

### v5

```text
当前响应媒体对象
  -> 精确对象/表示/codec/候选集缓存键
  -> 命中已验证选择时立即应用
  -> 未命中时原始 URL 先播放
  -> 256 KiB 主备样本验证
  -> 两次确认后缓存该对象选择

下一条视频
  -> 同一故障主机仍可作为新对象候选再次被探测
```

### v6

```text
当前响应媒体对象
  -> 精确对象 + audio/video/segment + representation + codec 隔离
  -> 从当前服务端响应读取完整签名 URL
  -> 检查对象选择新鲜度与主机短期熔断状态
     fresh: 立即应用，原主 URL 保留 fallback
     stale/open: 当前播放使用服务端原始 URL
  -> nonblocking 探测 1 MiB 相同 Range
  -> 校验 206、Content-Range、总长度、实际长度、hash、类型、压缩和重定向
  -> 同时校验表示码率所需吞吐与绝对吞吐下限
  -> 至少两次确认后仅缓存该媒体对象的 host 选择
  -> 403/超时/对象不一致/连续低速：对匿名 host 指纹短期熔断

下一条视频
  -> 只在这份服务端响应已经提供的完整候选中参考主机健康
  -> 不复制旧 URL、query、token、签名或 representation
```

主机健康状态只保存不可逆候选指纹、成功/失败计数和有限样本；不保存完整 hostname、
路径、query 或媒体 URL。状态容量和样本数量均有上限。

## 6. 首播等待与 probe 行为变化

- 默认 `nonblocking` 仍不会等待主备 probe 后才 `$done()`。
- 有新鲜且已验证缓存时立即应用当前响应中的对应完整 URL。
- 无缓存、缓存陈旧或主机熔断时，当前播放先用服务端原始 URL。
- 探测 Range 从 256 KiB 增至 1 MiB，降低“低首包延迟掩盖持续限速”的概率。
- 视频默认要求至少 2500 kbps，音频至少 256 kbps，分段至少 1500 kbps；如果协议提供
  representation bandwidth，还要求约 1.35 倍码率余量。
- 已验证选择默认 8 分钟后要求重新确认；硬失败退避从 15 分钟指数增长，最长 2 小时。
- `blocking` 仍只在用户显式选择时阻塞，用于诊断/快速建立两次确认。
- `off` 仍保持缓存只读兼容语义，不主动 probe。

1 MiB 是风险与 Shadowrocket 脚本时限之间的折中，不是完整文件吞吐保证。若节点在首
1 MiB 后才限速，仍应通过真机日志和后续样本继续定位。

## 7. 修改文件与关键 diff

- `src/bilibili-cdn.js`
  - 状态升级到 `safeAuto.v6`
  - 1 MiB 对象一致性/吞吐样本
  - representation bandwidth 与媒体类型吞吐下限
  - 8 分钟选择新鲜度、失败退避和主机短期熔断
  - 当前响应候选内的健康排序；保持签名、对象、音视频和表示隔离
- `src/bilibili-enhance.js`
  - 搜索 recommend words、gRPC DefaultWords、漫画 Flash/ListFlash 精确 adapter
- `scripts/build.mjs`
  - 精确 response/request matcher、MITM host 和 gRPC method
- `config/cdn-candidates.json`
  - 删除已确认 NXDOMAIN 的 `upos-sz-mirrorhwov.bilivideo.com`
- `config/module-options.json`
  - 同步 1 MiB、8 分钟和 v6 行为说明
- `test/*.test.js`
  - 新增吞吐余量、熔断、缓存新鲜度、隐私状态和新广告入口回归
- `README.md`、`docs/*`、`CHANGELOG.md`、`site/*`
  - 同步版本、证据边界、安装更新和验收说明
- `dist/*`
  - 由构建脚本确定性重新生成并更新 SHA-256

## 8. 保留的现有功能

- 四个主 App splash endpoint、creative keep IDs 和幂等空成功响应；
- 首页严格六条普通 AV、有界补页、横幅/游戏/应用/直播/PGC/商业卡过滤；
- 热搜、运营词和搜索结果商业卡过滤；
- 播放页普通视频推荐、JSON View、View v1、ViewUnite、RelatesFeed、ViewProgress、
  PlayPause、ViewEndPage 字段级处理；
- 暂停、恢复、结束、自动连播、Story `/cart` 和直播延迟商业容器处理；
- “我的页”逐项开关、PubModule、已验证 DeviceFeature action、VIP materials/report；
- gzip、多帧、bodyBytes、uint64、未知 protobuf wire bytes 和 fail-open；
- 普通视频、短视频、竖屏、稍后再看、番剧/PUGV/PlayerUnite/JSON playurl 覆盖；
- live URL 永不改写，fixed 安全模式与 legacy 兼容分支；
- CDN-only、Enhanced、历史兼容模块名和 BiliFlow 定制参数。

## 9. 回归与在线验证

发布前验证结果：

- 核心自动化：101/101 通过；
- CDN 专项：37/37 通过；
- Enhanced 专项：43/43 通过；
- 站点测试：4/4 通过；
- ESLint：通过；
- 站点生产构建：通过；
- 生成产物一致性检查：通过；
- 在线 `smoke:auto`：通过。

2026-07-30 奥克兰公开无登录样本：

- 5 个视频、12 个媒体对象；
- 服务端原样提供的 Akamai 完整签名候选：12/12 返回可验证 206、长度/hash 一致；
- 服务端原样提供的 cosov 完整签名候选：12/12 返回可验证 206、长度/hash 一致；
- 同一条 cosov 签名 URL 盲换 Akamai host 返回 403/HTML，证明不能自行拼接 host；
- `upos-sz-mirrorhwov.bilivideo.com` 经多个公共 DNS 解析为 NXDOMAIN，因此从候选表删除。

该快照只能证明“此时、此地、这些服务端签名对象”可用。Akamai 不应被全局标记为死亡，
也不应被全局强制为最快；v6 只相信当前响应提供的完整 URL 和本地验证结果。

## 10. 安全透传项

以下项目缺少足够证据，明确原样放行：

- 会员购微前端的店铺公告、主体变更、迁移提示、订单、支付和已购权益接口；
- 会员购未知 HTML、JavaScript、静态资源和未来 popup API；
- 漫画 Flash/ListFlash 之外的漫画正文、账户与购买接口；
- 未知搜索 method、未知 oneof 和没有商业标记的普通未知卡；
- 未知 gRPC schema、压缩、截断帧、超限消息和未来字段；
- 当前服务端响应未提供的 CDN host；
- 不能证明 Range 对象一致、返回错误页或发生跨对象重定向的候选。

若会员购仍出现广告弹窗，需要从点击入口到弹窗出现后的短窗口提供脱敏 endpoint、
content-type、状态码和响应结构摘要；不得提供 Cookie、SESSDATA、access_key、完整 query
或响应正文。

## 11. 真机验收

1. 在 Shadowrocket 更新模块，确认版本 `3.6.0`，脚本 URL 含 `?v=3.6.0`。
2. 检查并禁用外部旧规则中针对 Bilibili splash 的 `URL-REGEX ... REJECT`；它会在模块
   response handler 之前终止请求，使合法空成功响应无法执行。
3. 重新应用配置，完全退出并重开 Bilibili 9.5.0。
4. 冷启动、热启动、后台 30 分钟和后台数小时后分别验证首页、“我的页”和搜索页。
5. 首页连续刷新/翻页，确认每批严格六条普通视频且无广告、小游戏、应用、PGC/直播卡。
6. 搜索综合/视频分类，验证默认词、联想词、广告和商业卡消失，普通视频可打开。
7. 覆盖横屏、竖屏、Story、稍后再看、番剧、清晰度切换、拖动、暂停/恢复和自动连播；
   观察起播、吞吐、音画同步、403、绿屏和无限缓冲。
8. 在 Wi-Fi 与蜂窝之间切换并断网重连，确认陈旧 CDN 不被立即复用。
9. 进入直播和会员购，确认播放、弹幕、关注、登录、订单和已购权益正常；若仍有会员购
   弹窗，仅采集短时脱敏结构证据后再增加精确规则。

## 12. 更新、重新订阅与回滚

使用 `main/dist/*.sgmodule`、历史兼容地址或 BiliFlow 固定生成 URL 的用户不需要重新订阅：

1. `配置 -> 模块 -> 更新模块`；
2. 重新应用配置；
3. 完全退出并重开 Bilibili。

v5 CDN 状态使用不同持久化键，不会迁移到 v6。v6 会从当前服务端候选安全重学。

回滚顺序：

1. 将 `CDN` 设为 `off`；
2. 关闭广告总开关或对应细分开关；
3. 切换到 CDN-only 模块；
4. 安装 GitHub Release 中的 v3.5.0 模块；
5. 停用模块，恢复 App 原始行为。

回滚不需要清除 Bilibili 账户或 App 数据。
