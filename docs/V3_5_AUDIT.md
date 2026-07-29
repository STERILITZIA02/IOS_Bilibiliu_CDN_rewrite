# v3.5.0 增量审计：Story、搜索、直播弹层与 CDN 对象隔离

> 审计日期：2026-07-30
>
> App 基线：Bilibili iOS 9.5.0，`build=90500100`
>
> 输入：用户提供的 PacketTunnel 日志、仓库 v3.4.0、当前公开协议与维护中实现
> 结论边界：自动化已验证代码与生成产物；真实 iPhone/iPad 视觉结果仍需按
> `DEVICE_ACCEPTANCE.md` 验收。

## 1. 已确认问题（按严重度）

### 严重：v4 CDN 选择可跨视频对象复用

v4 在存在音频/视频表示元数据时，缓存键使用“表示 + 编码 + 候选集合”，没有把
媒体对象路径纳入键。两个不同视频只要表示和候选家族相似，就可能命中同一条已选
主机质量记录。脚本虽然仍从新响应取完整 URL，但该主机没有针对新对象完成验证，
可能出现慢速、403、反复回退或 App 在主备之间抖动。

日志窗口内没有任何 CDN 响应脚本执行记录，却观察到同一媒体对象在多个服务端
主/备家族间被重复请求；这证明本次窗口的 Story 内嵌媒体绕过了 playurl matcher。
它不能单独证明每一次卡顿都由脚本造成，但与 v4 跨对象晋升风险叠加后，足以构成
必须修复的播放正确性问题。

### 高：Story 响应过滤与 CDN 处理割裂

v3.4.0 的 Enhanced matcher 会处理 `/x/v2/feed/index/story`，CDN matcher 只
处理 playurl JSON/gRPC。9.5.0 Story 响应本身可以带播放 URL，因此过滤脚本运行，
CDN 脚本却不运行。若简单让两个脚本都匹配，又存在两个响应脚本各自写回同一正文
的覆盖风险。

### 高：`/story/cart` 异步响应未匹配

日志确认 `/x/v2/feed/index/story/cart` 在 Story 主响应之后单独请求。v3.4.0 的
matcher、classifier 和缓存保护均未覆盖它，所以首份 Story 已过滤后，购物/推广
卡仍可能由第二份响应重新注入。

### 高：搜索分类结果和新增商业卡未覆盖

v3.4.0 只匹配 gRPC `SearchAll`，并只删除 `game(11)` 与 `cm(25)`。当前公开
schema 还存在：

- `SearchByTypeResponse.items(6)`；
- `banner(9)`、`purchase(12)`、`top_game(29)`；
- `special(7)`、`pedia_card(26)`、`pedia_card_inline(31)`、`av(37)` 内各自
  明确的 `CardBusinessBadge`。

因此分类搜索及“普通 AV 外壳 + 商业角标”会漏过。

### 中：直播延迟商业 UI 只处理三个固定字段

现有逻辑能处理 `activity_banner_info`、`shopping_info.is_show` 和
`new_tab_info.outer_list.biz_id=33`，但同一 `getInfoByRoom` 响应中延迟 UI
容器的明确商业项没有统一过滤。扩大到整个直播域会误伤播放和互动，因此只能在
该精确响应的已知 UI 容器中补强。

### 未确认：会员购微前端内部弹窗的精确 API

当前会员购入口是动态微前端。用户日志没有包含“进入会员购并出现弹窗”期间的
精确接口和脱敏正文，公开启动页也不能证明某个资源只承载广告。没有证据时整域
MITM、HTML 注入或阻断静态资源会威胁登录、订单、支付和已购权益，故本版不做。

## 2. 会直接导致广告偶发漏过的入口

1. `/story/cart`：主响应之后异步返回，旧 matcher 完全未命中。
2. `SearchByType`：旧 gRPC matcher 和 classifier 均未命中。
3. `SearchAll` 新 oneof/嵌套商业角标：endpoint 命中但 classifier 判据不完整。
4. `getInfoByRoom` 已知 UI 容器：固定字段过滤后仍可能保留延迟商业项。
5. Story 的伪装 `vertical_av`：旧逻辑只看 `card_goto`，没有要求真实视频身份、
   可用状态或排除商业角标。

## 3. 定向修复

| 漏网入口 | v3.5.0 修复 |
| --- | --- |
| Story 主响应 | 新增单一 `bilibili-story.js`，先执行 Enhanced，再在同一正文上执行 CDN，最终只调用一次 `$done()` |
| `/story/cart` | 精确 matcher/classifier/请求缓存保护；只删除已知商业载荷和已知 UI 容器内的高置信商业项 |
| 伪装 Story AV | 严格模式要求 `vertical_av`、真实 AV/BVID/CID/URI 身份、非负可用状态且没有商业标记 |
| JSON 搜索 | `/x/v2/search` 与 `/type` 使用搜索专用商业判据，处理 game/purchase/banner/top-game、商业角标和明确 mall URI |
| gRPC 搜索 | 增加 `SearchByType`；按 `SearchAll.item(4)` 或 `SearchByType.items(6)` 过滤确认 oneof，保留未知 bytes |
| 直播弹层 | 仍只匹配 `getInfoByRoom`；在 `items/cards/list/modules/banners/popups/widgets` 中删除明确商业项 |
| CDN 跨对象复用 | 状态升级为 `safeAuto.v5`；所有对象的键都包含精确无查询媒体路径 |

所有新增处理均幂等；无法解析、未知 schema、未知容器或未知字段原样放行。

## 4. 广告链路修改前后

### 修改前

```text
Story 主响应
  -> Enhanced 过滤
  -> App 渲染普通项

Story /cart 延迟响应
  -> matcher 未命中
  -> 购物/推广卡重新注入

SearchByType
  -> matcher 未命中
  -> 分类搜索商业卡进入 UI
```

### 修改后

```text
Story 主响应或 /cart
  -> 请求侧移除条件缓存
  -> 单一 Story runtime
     -> 精确 endpoint 过滤
     -> 同一正文 CDN 处理
  -> 一次 $done + no-store

SearchAll / SearchByType
  -> 精确 gRPC method
  -> 正确重复项 field
  -> 确认商业 oneof/Badge 删除
  -> 未知 wire bytes 原样复制
```

## 5. CDN 链路修改前后

### v4

```text
playurl/Story 媒体对象
  -> 表示/编码/候选集合摘要
  -> 可能命中另一视频的主机选择
  -> 从当前响应取该主机 URL
  -> 新对象未验证也可能被晋升
```

### v5

```text
playurl/Story 媒体对象
  -> 精确无查询路径
     + 音频/视频/分段种类
     + 表示/清晰度/编码
     + 候选集合/家族/网络档案
  -> 只命中当前媒体对象的验证状态
  -> 当前响应的同 alias 完整签名 URL
  -> 原主 URL 始终保留为 fallback
```

旧 `safeAuto.v4` 使用不同持久化键，不迁移到 v5。

## 6. 首播等待与 probe 行为

默认行为没有变慢：

- 有当前对象的已验证缓存：解析响应时立即应用。
- 没有缓存：当前播放先使用服务端原始 URL。
- `nonblocking`：启动最多一对 256 KiB Range probe 后立即完成响应，不等待结果。
- `blocking`：仅用户显式选择时等待，用于至少间隔两分钟的两次确定性确认。
- `off`：不 probe，只读取现有已验证缓存。

变化在于 probe 结果只对同一精确对象有效，不再把“某表示上的主机较快”外推到
另一条视频。

## 7. 修改文件与关键 diff

- `src/bilibili-enhance.js`
  - Story 身份/状态/商业角标判据；
  - `/story/cart` 精确 handler；
  - JSON 搜索专用判据；
  - gRPC `SearchByType` 与完整商业 oneof/Badge；
  - 直播已知 UI 容器过滤。
- `src/bilibili-cdn.js`
  - `safeAuto.v5`；
  - 媒体对象精确路径进入所有缓存键；
  - 导出组合运行时所需的安全服务适配器。
- `src/bilibili-refresh.js`
  - `/story/cart` 条件缓存保护。
- `scripts/build.mjs`
  - 生成 Enhanced `dist/bilibili-story.js` 与不含增强 handler 的
    `dist/bilibili-story-cdn.js`；
  - Story 只由单一响应脚本匹配；
  - `SearchByType` 进入精确 gRPC matcher。
- `test/*.test.js`
  - 新增 Story、购物、搜索、直播、组合运行时和 CDN 对象隔离回归。
- `.github/workflows/release.yml`
  - 发布新 Story runtime。
- `README.md`、`docs/*`、`site/*`
  - 更新 v3.5.0 行为、证据边界和验收说明。

## 8. 保留的现有功能

- 四个 splash 接口及 creative keep ID 清理；
- 首页六条普通 AV 与一次有界补取；
- 热搜/运营词、首页横幅和非普通视频过滤；
- JSON View、View v1、ViewUnite、RelatesFeed、ViewProgress、PlayPause、
  ViewEndPage 的字段级处理；
- “我的”逐项开关、PubModule、VIP materials/report；
- gzip、多帧、bodyBytes、uint64 与未知字段 fail-open；
- 安全 fixed 模式、live URL 不改写、主备 hash/长度验证、音视频/表示/alias 隔离；
- CDN-only、Enhanced 和 Enhanced 历史兼容别名；
- Shadowrocket 固定 URL 更新与 BiliFlow 定制参数。

## 9. 回归测试

核心自动化覆盖：

- Story 正常 AV、广告类型、商业角标、无身份 AV、删除状态 AV；
- `/story/cart` 商业载荷、弹层、未知对象保留和幂等；
- JSON 搜索 game/purchase/商业 Badge/mall URI；
- gRPC `SearchAll`/`SearchByType` 的直接 oneof、嵌套 Badge、未知字段；
- 直播商业弹层与普通互动组件；
- Story 单一 pipeline 只完成一次、保留当前签名 URL；
- v5 不跨媒体对象应用选择；
- 原有 splash/feed/view/mine/gzip/multi-frame/CDN 探测全部回归。

发布前还必须执行 `npm run check:all`、`npm run smoke:auto`、生成产物逐字节校验、
远端 raw/Release SHA-256 校验和 CI。

## 10. 安全透传项

以下项目证据不足，明确保持原样：

- 会员购微前端内部未知 API、HTML、JavaScript 和静态资源；
- `/story/cart` 中未知容器与未知对象；
- 搜索中未列出的 oneof 与没有商业 Badge 的普通/未知卡；
- 直播 `getInfoByRoom` 之外的未知接口；
- 未知 gRPC 方法、未知压缩、损坏/超限消息；
- 账号、设备、会员、订单、支付、已购权益和地区授权字段。

## 11. 真机验收

1. 在 Shadowrocket 更新模块，确认版本 `3.5.0`、脚本 URL 含 `?v=3.5.0`，
   并看到 `Bilibili Story Safe Pipeline`。
2. 完全退出 Bilibili 9.5.0 后重开；首页连续刷新三次，点开 Story 普通视频。
3. 确认首页/Story 没有广告、小游戏、购物卡或“已删除”的伪装卡。
4. 搜索普通视频，分别测试“综合”和“视频”分类，确认广告/推广卡消失且普通
   视频仍能打开。
5. 进入直播间，等待弹层并前后台切换；确认购物/商业弹层不出现，播放、弹幕、
   关注和礼物交互正常。
6. 连续打开至少十条不同视频，覆盖横屏、竖屏、稍后再看、番剧和清晰度切换；
   观察起播、拖动、音画、403、重复重连和速率。
7. 如会员购内部仍出现弹窗，单独抓取从点击会员购到弹窗出现后的短日志；日志需
   脱敏且不要包含 Cookie、SESSDATA、access_key、完整 query 或正文。

## 12. 更新、重新订阅与回滚

使用 `main/dist/*.sgmodule`、历史兼容地址或 BiliFlow 固定生成 URL 的用户
**不需要重新订阅**：

1. `配置 -> 模块 -> 更新模块`；
2. 重新应用配置；
3. 完全退出并重开 Bilibili。

旧 v4 CDN 状态会因新键自动失效。若需立即建立 v5 缓存，可暂时选择
`blocking`，完成两次间隔至少两分钟的验证后改回 `nonblocking`。

回滚顺序：

1. `CDN=off`；
2. 关闭 `广告过滤` 或相关细分开关；
3. 切换到 CDN-only；
4. 安装 GitHub Release 中的 v3.4.0 模块；
5. 停用模块恢复 App 原始行为。

回滚不需要清除 Bilibili 账号或 App 数据。v5 与 v4 使用不同持久化键。
