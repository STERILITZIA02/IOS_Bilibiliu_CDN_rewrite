# v3.9.2：Bilibili iOS 9.7.0 有界兼容审计

> 审计日期：2026-08-14  
> 基线：`main` / `0e17118131615adfa3549bccbaa544a772182122` / package `3.9.1`  
> 目标版本：`3.9.2`

## 结论与证据边界

本次确认并修复的是现有实现中的五个有界缺口：搜索结果只枚举少数直接数组、
首页商业证据没有进入新的显式 wrapper、播放页商业模块别名覆盖不足、相关推荐
缺少独立商品结构判定，以及恢复请求的缓存指令/诊断信息不完整。

工作区没有 Bilibili iOS 9.7.0 原始响应、gRPC body 或对应 PacketTunnel 日志。
现有日志来自 9.5.0 请求构建号 `90500100`；可获得的公开 proto 与上游实现也没有
足以证明 9.7.0 新增 RPC 或 field number 的材料。因此：

- 本次四份 `ios970-*.json` 是按缺陷描述制作的**结构等价 fixture**，不是冒充真机
  抓包的“真实 fixture”；
- endpoint registry 没有新增未经证实的 row；已存在的精确 Search、Feed、View、
  ViewUnite 与 RelatesFeed row 已由 matcher/分类测试重新验证；
- protobuf 没有新增猜测字段号。只对既有公开 schema 已确认的 CM oneof 做回归；
- 4 MiB gRPC 解压限制没有证据显示不足，因此保持不变；
- 真机载荷与 HTTP/3/无网络恢复仍需按
  [`BILIBILI_9_7_CAPTURE.md`](BILIBILI_9_7_CAPTURE.md) 取证。

这也是选择补丁版本 `3.9.2`、而不是宣称加入新 endpoint/protobuf 的 `3.10.0`
的原因。

## 四张问题图与生命周期问题

| 缺陷 | 已存在的精确 endpoint | 修复前可确认的代码根因 | v3.9.2 处理 | 证据状态 |
| --- | --- | --- | --- | --- |
| A 搜索“创作推广”及绑定 CTA | JSON `/x/v2/search`、`/x/v2/search/type`；gRPC `bilibili.polymer.app.search.v1.Search/SearchAll`、`SearchByType` | JSON 仅检查 `data.items/item/result` 等直接列表，嵌套 section/card 可绕过；父卡放行时绑定 module 也会一起留下 | 仅在命名搜索容器中最多 8 层有界遍历，命中明确 business/card/badge/promotion/creative 证据时删除整个父卡，CTA 随父卡一起删除 | JSON 结构等价 fixture 通过；9.7.0 真机父路径待确认 |
| B 首页 RTX 5090D 原生广告 | `/x/v2/feed/index` 与既有首页 gRPC row | 伪装 AV 的商业证据若藏在 `inline_data`、`native_ad` 或 business wrapper 内，原判定未必看到；fallback 必须继续排除它 | 只进入列举的商业 wrapper，并要求 wrapper 自身具备高置信商业证据；严格和两级 fallback 共用同一排除判定 | JSON 结构等价 fixture 通过；首页非空与六条顺序回归通过；真机字段待确认 |
| C 播放页闲鱼横幅 | JSON `/x/v2/view`；gRPC View/ViewUnite 及既有 progress/pause/end row | JSON View 容器/操作区别名不完整，目标模块可能不在旧 `operation_card` 路径 | 覆盖 `view_modules`、`under_player_modules`、`operation_area` 等有界别名；仅在商业 action 容器内识别 Goofish/Taobao scheme/URI 和闲鱼按钮，删除整个数组元素及其 layout | JSON 结构等价 fixture 通过；确切 9.7.0 来源 endpoint 待真机确认 |
| D 相关推荐会员购商品卡 | JSON `/x/v2/view`；gRPC View/RelatesFeed、ViewUnite/RelatesFeed | 商品 AV 外壳在关闭严格推荐白名单时可保留，且缺少独立 product/purchase/mall/goods/commerce 结构判定 | 精确商品 type 或显式商品 payload 任一成立即移除；价格/定金文字本身不构成证据；普通 relates 相对顺序不变 | JSON 结构等价 fixture 与已确认 ViewUnite CM oneof 回归通过；9.7.0 商品 oneof 是否变化待确认 |
| E 后台恢复重新漏出 | registry 中 `volatile && requestGuard` 的上述 metadata endpoint | 请求已有 validator 清理，但 Cache-Control 缺少明确 `max-age=0`；日志不足以区分 matcher、304、新响应与无网络内存恢复 | 请求写入 `no-cache, no-store, max-age=0` 并记录删除的 validator；已分类 volatile 响应即使 changed=0 仍统一 no-store；诊断输出 registry/method/status/path/reason | 自动化覆盖 304-shaped、changed=0、30 秒/5 分钟等价调用；真实 HTTP/3、304 与 no-network 恢复待真机确认 |

表中的 endpoint 是 v3.9.1 registry 已审核且仍匹配的 endpoint，不等于声称四张截图
已由真机证明分别来自这些 endpoint。

## JSON 路径与结构变化

新增的运行时覆盖是字段名有界、容器有界的，不是任意递归关键词扫描：

| 用途 | 新增或扩展路径/证据 |
| --- | --- |
| 搜索容器 | `data.pages[].sections[].cards[]`，以及现有搜索根下命名为 `blocks/cards/data/groups/item/items/list/modules/pages/result/rows/sections` 的容器，最大深度 8 |
| 搜索商业证据 | `business_type=creator_promotion|creative_promotion|business_promotion|native_ad`、`promotion_label`、`business_label`、`card_business_badge` 和已有 explicit creative/report 证据 |
| 首页商业 wrapper | `item.inline_data/inlineData/native_ad/nativeAd/business_data/businessData`，且 wrapper 自身必须高置信命中 |
| 播放页模块 | `data.view_modules[]`、`activity_modules[]`、`operation_area`、`under_player_modules[]` 及已有 operation/marketing 容器 |
| 商品 relate | `data.relates[].goods_info` 等明确 `product/purchase/mall/goods/commerce` type 或 payload；普通 title/desc 中的价格、商品、广告、推广不参与判断 |

fixture 中的稳定示例路径只是用来锁定算法边界。收到真实 9.7.0 载荷后，应把实际父路径
加入上表，并仅在需要时扩展命名容器；不得把 walker 改为无界对象递归。

## gRPC / protobuf 审计

公开 schema 与既有实现能确认的相关边界仍为：

- SearchAll reply 的重复 Item 为 field 4，SearchByType reply 为 field 6；搜索 Item
  已知 oneof 包括 banner 9、game 11、purchase 12、cm 25、top-game 29、av 37；
- 旧 View Relate 中 CM 为 field 28；RelatesFeedReply 的 repeated relate 为 field 1；
- ViewUnite RelateCard 的外层 type 为 field 1，AV oneof 为 field 2，game 为 field 5，
  CM 为 field 6，basic_info 为 field 12；本次商品回归使用 `type=5 + CM field 6`；
- 未知字段继续以原始 wire bytes 保留，单帧/多帧、identity/gzip、响应头与失败开放
  继续由 v3.9.0 逻辑处理。

本次没有新增、删除或重编号 protobuf field。自动测试新增了 ViewUnite CM 商品结构的
identity/gzip 回归，并验证 field 99 未知数据仍存在。若真机 9.7.0 商品卡并非 CM
oneof，必须先取得原始 body 并做 wire diff，再写新的精确过滤器。

## 后台恢复流程

1. request matcher 仍由 endpoint registry 的 `volatile/requestGuard` 生成；搜索、首页、
   View、ViewProgress、PlayPause、ViewEndPage 与两个 RelatesFeed 方法均已有精确 row。
2. 请求脚本大小写不敏感地删除 `If-None-Match`、`If-Modified-Since`、`If-Range`，设置
   `Cache-Control: no-cache, no-store, max-age=0` 和 `Pragma: no-cache`；gRPC 仍协商
   `gzip,identity`。URL、query、WBI、body、鉴权和媒体请求不变。
3. 响应脚本对所有已分类 volatile 响应执行既有 no-store 规范化；即使未删除 UI
   字段，也不把原始 ETag/Last-Modified/Age/Expires 带回缓存。
4. debug 日志可区分 endpoint id、handler/transport/method/status、content encoding、
   body size、命中数组路径、观察到的 type、删除数量与最终 reason。
5. 如果恢复时完全没有网络请求，Shadowrocket 无法回溯修改 App 已解码的内存或本地
   数据库。v3.9.2 不伪造 scene lifecycle hook，也没有对签名/WBI/gRPC/媒体 URL
   添加 cache-buster。

## 诊断 reason

- `ios970-search-commercial-removed`
- `ios970-feed-ad-removed`
- `ios970-view-xianyu-removed`
- `ios970-relate-product-removed`
- `resume-fresh-response`
- 既有 `endpoint-unmatched`、`unsupported-grpc-compression`、
  `feed-empty-fail-open` 等继续保留

日志只打印去 query 的 path、有限 top key/array path/type 摘要，不打印完整响应、
Cookie、access_key、签名 URL 或搜索词。

## 自动测试与真机状态

自动测试覆盖：

- 四类结构等价 JSON 缺陷及绑定 CTA/布局整体删除；
- 普通搜索/首页/相关推荐中的“广告、闲鱼、推广、商品、下载、价格”文字不误删；
- 首页六条、字段不完整非空 fallback、冷启动/30 秒/5 分钟恢复一致；
- JSON、identity/gzip gRPC、未知 field 保留；
- endpoint 分类、response matcher、request guard、相似路径不误配、CDN-only 隔离；
- changed=0 volatile 响应 no-store 与 304-shaped 响应头归一化；
- 原有 CDN hot-path、hostAuto v10、mediaRoutes v9 和签名 URL 测试由全套回归覆盖。

真机状态：**未验证**。本仓库环境不能运行 iPhone、Shadowrocket 或 Bilibili 9.7.0，
也没有用户描述的四张原图/原始 body 可供逐字段核对。发布说明必须保留这一状态，直到
[`DEVICE_ACCEPTANCE.md`](DEVICE_ACCEPTANCE.md) 的 9.7.0 项被实际设备填写。

## 未改动的播放边界

- `src/bilibili-cdn.js`、`src/bilibili-cdn-route.js`、hostAuto v10、mediaRoutes v9
  与测速排序没有源代码变化；
- 播放响应热路径仍为零 probe；
- Akamai 仍只使用服务端返回的完整签名 URL；
- 媒体 CDN 不加入 MITM，Range/UA/媒体响应体不修改；
- 首页 v3.9.1 的两级 fallback、非空 fail-open、补取与去重逻辑保持不变。
