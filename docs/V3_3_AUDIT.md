# v3.3.0 增量审计与定向修复记录

> 审计日期：2026-07-28
> 目标 App：Bilibili iOS 9.4.0
> 用户报告构建：`58ece148439d6782b1e6f9a9a37e82a1fd0db236`
> 范围：本仓库 Enhanced 广告/UI 链路与 CDN 自动/固定模式
> 原则：未知结构安全透传；不扩大到整个 Bilibili 域或媒体 CDN

本文记录从 v3.2.0 到 v3.3.0 的确认问题、证据边界、修复和验收方法。自动化只能
证明 fixture 与实现契约，不能替代真实 iPhone/iPad、Shadowrocket 和线上响应的
最终验收。

## 1. 确认问题与严重度

| 严重度 | 确认问题 | 直接影响 |
| --- | --- | --- |
| 严重 | 生成模块 matcher 与 runtime classifier 漂移 | classifier 已有或新增分支也可能根本收不到响应，形成“偶发漏过” |
| 严重 | v3.2.0 默认自动测速在当前 playurl 热路径等待两个 Range 回调 | 无缓存首播被两次探测延迟，探测超时会放大起播等待 |
| 严重 | 主备验证只证明各自可返回媒体样本，未充分证明是同一媒体对象 | 可能把更快但错误的对象晋升，导致绿屏、错音轨、403 或拖动断流 |
| 严重 | JSON 多种 URL alias 之间可能共享候选身份并写入另一 lane 的完整签名 URL | camelCase/snake_case token 串用，可能出现 403 或清晰度切换失败 |
| 高 | PlayPause/ViewEndPage 采用整消息清空 | 能挡广告，但会破坏未知正常字段，App/schema 更新时风险不可接受 |
| 高 | 条件缓存保护仅覆盖部分 Feed/Story/Mine 请求 | splash、view、myinfo、VIP 素材在热启动/后台恢复时可能走 304 或旧缓存 |
| 高 | 四个 splash 接口共用旧的通用清理策略 | keep IDs、预载/活动/品牌列表或 hash 未同步清空时可继续复用旧 creative |
| 高 | VIP 素材获取与素材上报没有完全分离 | 可能把上报当素材来源，或返回错误契约引发重试 |
| 高 | fixed 模式可通过替换 host 构造服务端未返回的 URL | 签名不一定适用于目标 host，存在 403、错误对象和签名泄露风险 |
| 中 | “我的页”匹配依赖中文标题与标识组合，且递归范围偏宽 | 标题变化时漏过；未知账号对象中相似字段存在误删风险 |
| 中 | DeviceFeature、myinfo、Module/List 缺乏明确诊断边界 | 容易为追求覆盖而误清空资源更新或账号响应 |
| 中 | PGC v2 与其他 PlayView 共用 field-9 媒体猜测 | 未公开字段可能被错误当作无损音频递归解析 |
| 中 | `networkProfile=auto`、TTL 和状态重置的用户语义不够准确 | 用户可能误以为自动识别 Wi-Fi；较长 TTL 或损坏状态难以解释/恢复 |

## 2. 会直接导致广告偶发漏过的入口

1. 生成的 `[Script]` matcher 未包含 classifier 中的新增端点时，请求不会进入脚本。
2. Feed/Mine 首次响应已过滤，但恢复、刷新或延迟响应命中 304/旧缓存时没有新的
   response body 可供过滤。
3. 四个 splash 阶段分别下发 list、show、event 和 brand 数据，只清旧字段不能
   清除另一路的 creative keep ID、hash 或预载列表。
4. View 首次响应过滤后，`ViewProgress`、`PlayPause`、`ViewEndPage` 和
   `RelatesFeed` 会在暂停、结束、连播或后台恢复时独立重新注入 UI。
5. Mine JSON 过滤后，`PubModule` 和 `DeviceFeature` 是并发/延迟返回；只处理
   首份响应不能覆盖发布引导或未来已验证 action。
6. `/x/vip/ads/materials` 与 `/x/vip/ads/material/report` 是不同阶段；只处理
   上报不能阻止素材，错误处理素材又可能触发重试。

## 3. 每个入口的具体修复

### matcher 与 classifier

- 用同一构建检查核对 JSON、gRPC、请求脚本 matcher 与 runtime classifier。
- JSON 精确增加四个 splash、`myinfo`、VIP materials/report。
- gRPC 精确增加 `Mine/DeviceFeature` 与
  `bilibili.app.resource.v1.Module/List`；没有域级通配。
- 为每个新增 URL 增加“模块文本能匹配 + runtime 能分类”的回归。

### splash

四个 endpoint 分别返回合法 `code=0`、`message="0"`、`ttl=1` 成功结构，并按
已验证字段清空其展示/预载/活动/品牌数组。共同清空 account、creative/keep ID
列表、hash 和旧 creative 保留标记，但只修改响应中实际存在的这些字段，不凭空
添加尚未验证的键。`pull_interval`、`has_new_splash_set` 及未知顶层/data 字段
原样保留。相同输出再次进入 handler 时不再变化，避免重试循环和旧 creative 复用。

### Feed、Story、View 和 Mine 生命周期

- 每份 `/feed/index`、Story、Popular 响应独立执行普通 AV 白名单，不读取或写入
  跨请求全局卡片状态。
- 新的请求侧脚本仅对精确易变端点移除 ETag/If-Modified-Since 等条件头，并设置
  `no-cache, no-store`，使刷新/恢复获得的新 body 再次进入响应过滤。
- 商业识别加入已审核的 `ad_info`、`cm`、creative/business/tracking、商业按钮
  及已知 banner 容器变体；标题文本不作为广告证据。
- Mine 优先按稳定 ID/module/tab/action/type、精确 scheme/URI、已知 section
  命中，中文标题只作最后回退；只递归已知 UI 容器。

### 播放页异步重新注入

- View JSON、View v1、ViewUnite、RelatesFeed 继续按各自已验证字段过滤。
- ViewProgress 每份响应都删除其已审核运营容器。
- PlayPause 不再整消息清空，只删除含明确商业 URL、creative/ad ID 或暂停广告
  标记的 length-delimited 字段；无商业证据字段保留。
- ViewEndPage 根据公开 schema 解包 `ViewEndPageCard.relate(1)`，只删除广告、
  商业伪装或严格模式下非普通 AV 的关系卡；普通 AV、card index 与未知字段保留。
- 多帧响应逐帧处理；任一损坏、未知压缩或超限时整份原样返回。

### VIP 与异步“我的页”模块

- materials 返回空 `list`/`list_v2`/coupon 等素材字段的成功结构。
- material/report 返回独立的无副作用成功上报结构，不把它当素材来源。
- PubModule 仍只删除 `PubGuide`，保留 UGC/opus/未知 oneof。
- myinfo 只分类和诊断，不改账号数据。
- DeviceFeature 只验证 field 1 的严格 UTF-8 JSON；没有真实脱敏 action fixture，
  因此当前全部 action 安全透传并记录 `no-verified-action`。
- Module/List 只做 schema 诊断，byte-for-byte 透传，不阻断资源更新。

## 4. 广告链路修改前后

### 修改前

```text
冷/热启动或后台恢复
  -> 可能命中旧缓存/304
  -> 部分端点进入 matcher
  -> 首份 Feed/View/Mine 被过滤
  -> splash / ViewProgress / PlayPause / ViewEndPage / PubModule / VIP 素材
     延迟或并发返回
  -> 未匹配、旧缓存或独立 handler 缺失时重新注入
  -> UI 再次出现广告/横幅/发布引导
```

### 修改后

```text
精确易变请求
  -> 移除条件缓存头并 no-cache/no-store
  -> 每份 response 独立分类
  -> endpoint-specific JSON 或 schema-specific gRPC adapter
  -> 字段级过滤 / 严格推荐白名单 / 已验证空成功契约
  -> changed 或安全 no-op
  -> 后续异步端点再次经过自己的 adapter
```

过滤器仍不可能控制服务器未返回响应体、Shadowrocket 超时终止脚本或系统完全绕过
MITM 的本地原生缓存，因此调试日志会区分 endpoint、schema、大小、gzip、
changed/no-op/fail-open 原因；遇到这类证据时应抓取脱敏元数据后再扩展规则。

## 5. CDN 流程修改前后

### 修改前

```text
playurl -> 解析媒体对象 -> 选择主/备 -> 等待两次 Range
        -> 分别可用且备用更快 -> 累计确认/缓存 -> $done
```

风险是无缓存首播被探测阻塞；两个各自有效的 206 并不必然属于同一对象；固定模式
可以构造本次响应中不存在的 host；JSON alias 可能复用另一 lane 的签名 URL。

### 修改后

```text
playurl
  -> endpoint-specific JSON/gRPC adapter
  -> 按对象/媒体/表示/alias lane 建 descriptor
  -> 读取并校验状态
  -> 有缓存：立即使用当前响应中同一 lane 的完整候选 URL
  -> 无缓存：默认立即返回服务端原始 URL
  -> nonblocking 尽力启动同一对象主/备样本探测
  -> 两端 Range/总长/样本长/hash/type 全等才记录
  -> 至少两次、间隔与阈值均满足后，未来响应才可提升
  -> 任何异常原始响应
```

## 6. 首播等待与 probe 行为

| 场景 | v3.2.0 | v3.3.0 |
| --- | --- | --- |
| 已验证缓存 | 解析后可能仍进入探测路径 | 先立即应用当前响应对应完整 URL |
| 无缓存默认 | 等待两个 Range 回调/超时 | `$done()` 不等待 probe |
| 确定性学习 | 默认热路径完成 | 用户临时选择 `blocking` |
| 禁止测速 | 无明确缓存-only 模式 | `probeMode=off`，只复用缓存 |
| 回调在 `$done()` 后被终止 | 不适用 | 不写未验证选择，锁自动过期 |
| 并发 playurl | 可能重复探测 | 持久化资源锁、随机令牌与全局间隔 |

## 7. 修改文件与关键职责

| 文件 | 关键修改 |
| --- | --- |
| `src/bilibili-enhance.js` | endpoint registry、splash/VIP 契约、商业识别、字段级 PlayPause/ViewEndPage、Mine 匹配、DeviceFeature/Module 诊断、多帧 gzip |
| `src/bilibili-refresh.js` | 精确易变请求缓存保护 |
| `src/bilibili-cdn.js` | nonblocking/cache-only、严格同对象 probe、adapter、alias 签名隔离、fixed 安全提升、TTL/锁/reset |
| `scripts/build.mjs` | matcher/classifier/参数一致性生成检查 |
| `config/module-options.json` | 测速模式、重置令牌、准确 network-profile 说明 |
| `test/*.test.js` | 广告生命周期、gRPC 与 CDN 回归 |
| `site/app/*`、`site/tests/*` | 新参数 UI、生成路由校验和网站回归 |
| `README.md`、`docs/*`、`CHANGELOG.md` | 证据边界、流程、验收和回滚 |

## 8. 保留的现有功能

- 去热搜和运营搜索词；
- 首页导航/发布/会员购及“我的页”逐项显示/隐藏；
- 首页每份响应最多前六条明确普通 AV；
- 播放页 JSON、View v1、ViewUnite 普通 AV 推荐；
- 横幅、会员营销、评论、动态、搜索、直播明确广告过滤；
- CDN-only、Enhanced 和历史 Enhanced 别名；
- `CDN=auto`、`off`、现有固定 host 参数、分流/PCDN 参数；
- raw 固定更新 URL、Release 资产和 BiliFlow 定制 URL。

## 9. 回归验证

完整门禁由下列命令组成：

```text
npm run build
npm run check:all
npm run smoke:auto
```

自动化覆盖四个 splash 与 keep IDs、Feed/Story/Popular、View/ViewUnite/
RelatesFeed/ViewProgress/PlayPause/ViewEndPage、Mine/PubModule/DeviceFeature、
VIP materials/report、gzip/bodyBytes/多帧/超限/未知字段，以及 CDN 无缓存
nonblocking、缓存立即使用、主备 hash/长度一致、表示和签名隔离、fixed 回退、
uint64、并发锁、损坏状态/reset、TTL 和 live URL 永不重写。最终命令结果与发布
提交 SHA 记录在 Release Notes；本次本地结果为核心 `87/87`、网站 `4/4`、lint
和生产构建通过。联网冒烟取得同一对象的两个 `206`、`65536` byte 样本与相同
总长度，结果为首轮 `alternative-pending`，没有改写当前响应。真机项目仍以
`DEVICE_ACCEPTANCE.md` 为准。

## 10. 证据不足并保持安全透传

| 接口或字段 | 当前行为 | 需要的新证据 |
| --- | --- | --- |
| `/x/v2/account/myinfo` 未知新 UI/广告字段 | 整体透传，仅诊断 | 9.4.0 脱敏响应证明字段只承载目标 UI |
| `Mine/DeviceFeature` actionData 中具体 action | 合法 JSON 也透传 | 脱敏 fixture + action 语义 + 未知字段保留测试 |
| `Module/List` | byte-for-byte 透传 | 默认不计划修改；它是资源更新入口 |
| splash 中未出现的 keep/hash 键、`pull_interval`、`has_new_splash_set` | 不补造键；间隔和未知布尔值原样保留 | 9.4.0 脱敏请求/响应证明客户端契约与重试语义 |
| PlayPause 无商业证据字段 | 保留 | 字段号/schema 与正常字段语义 |
| 未知 ViewEndPage 顶层字段或损坏 card | 保留/整份 fail-open | 当前 schema 或脱敏 fixture |
| 未知 gRPC method、压缩、超限或截断帧 | 整份原样返回 | 明确协议与有界解码能力 |
| 新静态素材域 | 不新增 matcher | 请求/响应证据证明只承载广告且不含封面/音频/字幕/弹幕 |
| Shadowrocket 自动 Wi-Fi/SSID 识别 | 不声称支持 | 官方稳定脚本 API 证据 |

## 11. 真机验收重点

1. 更新模块、重新应用配置、完全退出 Bilibili。
2. 冷启动和热启动各三次，确认无开屏 creative 且无 splash 重试循环。
3. 首页首次、下拉三次、连续翻页、后台 30 分钟恢复：每份最多六个普通 AV。
4. 第一次打开视频即确认播放器下广告不出现；暂停/恢复、拖动、切清晰度、结束、
   连播和三次前后台切换，确认广告不重新出现且普通结束页 AV 保留。
5. 从后台直接进“我的页”，确认逐项隐藏和会员横幅仍有效；会员、钱包、订单和
   权益数据正常。
6. 分别测试普通/短/竖屏/稍后再看、DASH 音视频、PGC、已购 PUGV 和 DURL；
   确认无无声、绿屏、403、错误音轨、无限缓冲或拖动断流。
7. 默认 nonblocking 对比 `CDN=off` 首播；如需学习只临时 blocking 一次。
8. Wi-Fi/蜂窝需要隔离时使用两个手动网络档案，不把 `auto` 当自动识别。

## 12. 回滚

1. 先把 `CDN=off`，保留分流和 Enhanced，验证是否为 CDN 选择问题。
2. 依次关闭广告总开关、首页六条、播放页普通视频、界面、会员、搜索和直播开关。
3. 把 `PCDN策略` 恢复成与 `分流策略` 相同。
4. 切换到 CDN-only，或将固定 raw URL 临时改为上一 Release 的
   `Bilibili.CDN.Enhanced.sgmodule`。
5. 最终停用模块，Bilibili 恢复原始网络行为。

回滚不需要删除账号、证书或 Shadowrocket 配置。若使用固定 `main/dist` 或
BiliFlow URL，正常升级到 v3.3.0 只需“更新模块”，不需要重新订阅。
