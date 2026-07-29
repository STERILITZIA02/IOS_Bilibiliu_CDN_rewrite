# Protobuf/gRPC 兼容性记录

> 字段核对日期：2026-07-29
> 过滤器实现：`src/bilibili-enhance.js`
>
> 播放地址实现：`src/bilibili-cdn.js`

本项目不打包完整 Bilibili Protobuf schema，也不使用“猜测式递归删除”。过滤器
只在精确的 gRPC 方法上读取少量广告或推荐类型判别字段，删除目标字段或重复项时
原样复制其余 wire bytes。未知字段和无法解析的消息全部保留；受支持的 gzip
压缩帧先在有界 WebView 流中解压，播放页关系卡的未知类型在
`推荐仅普通视频=true` 时删除。

字段语义主要与 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock)
和 [kokoryh/Sparkle](https://github.com/kokoryh/Sparkle) 的当前实现交叉核对；
字段号再通过 `pskdje/bilibili-API-collect` 的公开提交
`271b123a083698bf576101c21f534b3418768a43` 核对。该仓库在核对时未声明
标准 SPDX 许可证；本仓库没有复制其 schema、注释或实现，只记录用于互操作所需
的字段号与语义事实。

## 当前处理表

| gRPC 方法 | 高置信处理 |
| --- | --- |
| `bilibili.app.view.v1.View/View` | 删除 `ViewReply` 的 `cms(30)`、`cm_config(31)`、`tf_panel_customized(34)`、`cm_ipad(41)`、兼容字段 `cm_under_player(48)`；始终移除含 `Relate.cm(28)` 的关联卡；严格模式下只保留 `Relate.goto(7) == "av"` 且存在 `aid(1)`、有效 `param(8)` 或 video URI(9) 的关系卡 |
| `bilibili.app.view.v1.View/ViewProgress` | 进入 `video_guide(1)`，删除类型 `1`（活动）/`6`（活动图标）或含明确商业证据的 `VideoGuide.material(1)`，并兼容处理含商业证据的 `right_material(4)`；保留其他 Material、视频点、合约卡、`chronos(2)`、视频快照及未知字段 |
| `bilibili.app.view.v1.View/RelatesFeed` | 使用与上项相同的关系卡判据 |
| `bilibili.app.view.v1.View/TFInfo` | 删除运营商免流营销 `tf_toast(2)` 与 `tf_panel_customized(3)`；保留 `tips_id(1)`、`user_flag_new(4)` 和未知字段 |
| `bilibili.app.viewunite.v1.View/View` | 删除顶层 `cm(7)`；始终移除类型 `4`（游戏推广）、`5`（广告）、`11`（课程推广）、`game(5)`/`cm(6)` 载荷、非空 `cm_stock(11)` 或 `BasicInfo.unique_id(6)` 卡；严格模式下仅保留同时满足类型 `1 (AV)` 与 oneof `av(2)` 且不存在非 AV oneof `3/4/5/6/7/8/9/13/14` 的卡；移除介绍模块类型 `18`（活动）、`37`（特殊推广标签）、`55`（商品分享）、`63`（视频提及推广）以及受 `会员营销` 控制的 `29`（大会员横幅） |
| `bilibili.app.viewunite.v1.View/ViewProgress` | 对 `video_guide(1)` 使用上项判据；另在 `dm(4)` 内仅过滤 `OperationCard(3)` 的 `biz_type(5)` 为 `2`（预约活动）、`3`（跳转）或 `5`（预约游戏）的运营卡。保留 command DM、AttentionCard、关注视频 `1`、追番 `4`、Chronos、视频快照、未知 OperationCard 类型及未知 wire bytes |
| `bilibili.app.viewunite.v1.View/PlayPause` | 逐个检查顶层 length-delimited 字段；只删除载荷中含已审核商业 URL、creative/ad ID 或暂停广告标记的字段。9.4.0/9.5.0 构建信息用于诊断 adapter 标签，不作为盲目清空消息的依据；无证据字段和未知 wire bytes 保留 |
| `bilibili.app.viewunite.v1.View/ViewEndPage` | 按公开 schema 读取重复 `ViewEndPageCard(1)`，再读取其 `relate(1)`；使用与 ViewUnite 关系卡相同的广告与普通 AV 判据，保留普通 AV、`card_index(2)`、未知顶层字段和未知 wire bytes |
| `bilibili.app.viewunite.v1.View/RelatesFeed` | 使用与上项相同的关系卡判据；不处理介绍模块 |
| `bilibili.app.mine.v1.Mine/PubModule` | 只删除 `PubCard.pub_guide(1)`，保留 `ugc(2)`、`opus(3)`、`more(4)`、`card_type(5)` 与未知字段 |
| `bilibili.app.mine.v1.Mine/DeviceFeature` | 验证 `DeviceFeatureResp.actionData(1)` 为严格 UTF-8 JSON；当前没有能证明具体广告 action 的脱敏 fixture，因此只输出诊断原因并逐字节透传 |
| `bilibili.app.resource.v1.Module/List` | 公开 schema 确认 `ListReply.env(1)`、`pools(2)`、`list_version(3)`；该资源更新入口仅做结构诊断，永不清空、拒绝或阻断 |
| `bilibili.app.show.v1.Popular/Index` | 重复 `Card(1)` 最多保留前 6 个明确普通 AV；仅接受 `smallCoverV5(1)`/`largeCoverV1(2)`，拒绝 `rcmdOneItem(10)`、`smallCoverV5Ad(11)`、`ad_info(12)` 和非 AV/无视频身份卡 |
| `bilibili.app.dynamic.v2.Dynamic/DynAll` | 仅移除 `DynamicItem.card_type == 15 (ad)` |
| `bilibili.polymer.app.search.v1.Search/SearchAll` | 仅移除 oneof 为 `game(11)` 或 `cm(25)` 的搜索卡 |
| `bilibili.main.community.reply.v1.Reply/MainList` | 删除顶层 `cm(11)`；仅移除正文或 URL map 明确含 `b23.tv/cm`、`b23.tv/mall` 的置顶评论 |

## 播放地址互操作字段

CDN 脚本只在模块精确列出的播放 gRPC 方法中运行。它不依赖完整 schema，而在
单个直接消息内同时存在主 URL 与备用 URL 时识别以下结构：

当前方法覆盖 `bilibili.app.playerunite.v1.Player/PlayViewUnite`、
`bilibili.app.playurl.v1.PlayURL/PlayView`、PGC gateway player `v1/v2` 与
`bilibili.cheese.gateway.player.v1.PlayURL/PlayView`，用于普通/短视频/竖屏/
稍后再看、番剧影视和课程等仍返回同类播放结构的入口。未知新方法不做猜测式匹配。

app PlayURL、PlayerUnite、PGC v1 与 Cheese/PUGV 使用已核对的 reply field `1`
下媒体路径 `5.2`、`5.3.1`、`6`、`7.2`、`9.2`；PGC v2 只使用其公开 schema
存在的 `5.2`、`5.3.1`、`6`、`7.2`，不会把未知 field `9` 猜成无损音频。

| 结构 | 主 URL | 备用 URL | 隔离元数据 |
| --- | --- | --- | --- |
| `DashVideo` | `base_url(1)` | `backup_url(2)` | 缺少已确认表示 ID，因此按精确对象路径隔离 |
| `DashItem` | `base_url(2)` | `backup_url(3)` | `id(1)` 作为稳定表示身份；音频/视频分别复用匿名主机评分 |
| `ResponseUrl` | `url(4)` | `backup_url(5)` | 分段 URL 始终按精确对象路径隔离 |

`DashItem.id >= 30000` 作为音频表示，常规较小清晰度 ID 作为视频表示；无把握
的 ID 使用独立 `unknown` 类型，仍不会与已识别音频/视频共享缓存。稳定表示 ID、
候选集合、网络档案和媒体类型共同参与固定长度缓存摘要；无法确认表示身份时还会
加入精确资源路径。

自动模式只提升该消息自己的当前备用完整 URL，并把原始主 URL 放入对应备用
字段；不会把一个 Protobuf 消息的候选用于另一个消息。

## 解析与失败边界

- 所有广告/UI gRPC 处理均受 `广告过滤` 总开关控制；关闭时响应原样保留。
- `推荐仅普通视频` 默认开启且只影响播放页关系卡，并受 `广告过滤` 总开关控制；关闭后类型
  `0/2/3/6/7/8/9/10` 等合法非 AV 卡可恢复，但明确广告/推广判据仍执行。
- 仅支持标准 Protobuf wire type `0`、`1`、`2`、`5`。
- 超过 JavaScript safe integer 的 uint64 varint 不转换成 Number；原始 varint
  bytes 保留，且不会导致整条消息解析失败。
- gRPC 压缩标志 `0` 直接处理；标志 `1` 按 Bilibili 当前 gzip 约定解压，最多
  4 MiB，修改后以标志 `0` 和新的消息长度输出。
- 未知帧标志、gzip 解压不可用/失败或解压后超限时，整份响应原样返回。
- 多帧响应逐帧处理并重算被修改帧的长度；整份响应无需修改时保持原字节。
- 任一帧损坏、长度越界或嵌套消息无法解析时，整份响应原样返回。
- 只有目标关系卡被清理后确实为空的嵌套容器才随之移除；其他字段与模块保留。
- 不处理播放地址、弹幕会员效果、青少年模式、后台播放、真实会员状态或付费权益字段。
- 模块把压缩前 gRPC 响应体上限限制为 4 MiB；更大的响应不进入脚本；脚本另有
  4 MiB 解压输出上限。

广告/UI gRPC 与播放地址 gRPC 上限均为 4 MiB。两类脚本均不匹配
媒体分片域名或处理媒体文件响应体。

## 更新规则

Bilibili App 升级后，只有在以下条件全部满足时才更新字段表：

1. 精确方法名未发生歧义。
2. 至少两个独立来源或一个当前实现加实际脱敏抓包能确认字段语义。
3. 新 fixture 证明目标字段删除后未知字段 byte-for-byte 保留。
4. 不涉及账号、会员、付费权限、画质权益或播放器时间线。
5. 解析失败测试仍返回原始响应。
