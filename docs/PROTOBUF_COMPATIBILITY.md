# Protobuf/gRPC 兼容性记录

> 字段核对日期：2026-07-27
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
字段号再通过 `bilibili-API-collect` 的公开镜像提交
`cfc5fddcc8a94b74d91970bb5b4eaeb349addc47` 核对。该镜像在核对时未声明
标准 SPDX 许可证；本仓库没有复制其 schema、注释或实现，只记录用于互操作所需
的字段号与语义事实。

## 当前处理表

| gRPC 方法 | 高置信处理 |
| --- | --- |
| `bilibili.app.view.v1.View/View` | 删除 `ViewReply` 的 `cms(30)`、`cm_config(31)`、`tf_panel_customized(34)`、`cm_ipad(41)`、兼容字段 `cm_under_player(48)`；始终移除含 `Relate.cm(28)` 的关联卡；严格模式下只保留 `Relate.goto(7) == "av"` |
| `bilibili.app.view.v1.View/ViewProgress` | 删除每次播放进度响应重新下发的 `video_guide(1)` 运营容器；保留 `chronos(2)`、视频快照/进度点及未知顶层字段 |
| `bilibili.app.view.v1.View/RelatesFeed` | 使用与上项相同的关系卡判据 |
| `bilibili.app.view.v1.View/TFInfo` | 删除运营商免流营销 `tf_toast(2)` 与 `tf_panel_customized(3)`；保留 `tips_id(1)`、`user_flag_new(4)` 和未知字段 |
| `bilibili.app.viewunite.v1.View/View` | 删除顶层 `cm(7)`；始终移除类型 `4`（游戏推广）、`5`（广告）、`11`（课程推广）、`game(5)`/`cm(6)` 载荷、非空 `cm_stock(11)` 或 `BasicInfo.unique_id(6)` 卡；严格模式下仅保留同时满足类型 `1 (AV)` 与 oneof `av(2)` 且不存在非 AV oneof `3/4/5/6/7/8/9/13/14` 的卡；移除介绍模块类型 `18`（活动横幅）、`55`（UP 主商品分享）以及受 `会员营销` 控制的 `29`（大会员横幅） |
| `bilibili.app.viewunite.v1.View/ViewProgress` | 删除每次播放进度响应重新下发的 `dm(4)` 运营/命令卡容器；保留 `video_guide(1)`、`chronos(2)`、视频快照及未知顶层字段 |
| `bilibili.app.viewunite.v1.View/RelatesFeed` | 使用与上项相同的关系卡判据；不处理介绍模块 |
| `bilibili.app.dynamic.v2.Dynamic/DynAll` | 仅移除 `DynamicItem.card_type == 15 (ad)` |
| `bilibili.polymer.app.search.v1.Search/SearchAll` | 仅移除 oneof 为 `game(11)` 或 `cm(25)` 的搜索卡 |
| `bilibili.main.community.reply.v1.Reply/MainList` | 删除顶层 `cm(11)`；仅移除正文或 URL map 明确含 `b23.tv/cm`、`b23.tv/mall` 的置顶评论 |

## 播放地址互操作字段

CDN 脚本只在模块精确列出的播放 gRPC 方法中运行。它不依赖完整 schema，而在
单个直接消息内同时存在主 URL 与备用 URL 时识别以下结构：

| 结构 | 主 URL | 备用 URL | 隔离元数据 |
| --- | --- | --- | --- |
| `DashVideo` | `base_url(1)` | `backup_url(2)` | 带宽、编码、大小、音频 ID、帧率、宽高等直接字段 |
| `DashItem` | `base_url(2)` | `backup_url(3)` | `id(1)`、带宽、编码、大小、帧率等直接字段 |
| `ResponseUrl` | `url(4)` | `backup_url(5)` | 分段序号、时长、大小、md5 等直接字段 |

`DashItem.id >= 30000` 作为音频表示，常规较小清晰度 ID 作为视频表示；无把握
的 ID 使用独立 `unknown` 类型，仍不会与已识别音频/视频共享缓存。资源路径、
直接表示字段、候选集合、网络档案和媒体类型共同参与固定长度缓存摘要。

自动模式只提升该消息自己的当前备用完整 URL，并把原始主 URL 放入对应备用
字段；不会把一个 Protobuf 消息的候选用于另一个消息。

## 解析与失败边界

- 所有广告/UI gRPC 处理均受 `广告过滤` 总开关控制；关闭时响应原样保留。
- `推荐仅普通视频` 默认开启且只影响播放页关系卡，并受 `广告过滤` 总开关控制；关闭后类型
  `0/2/3/6/7/8/9/10` 等合法非 AV 卡可恢复，但明确广告/推广判据仍执行。
- 仅支持标准 Protobuf wire type `0`、`1`、`2`、`5`。
- gRPC 压缩标志 `0` 直接处理；标志 `1` 按 Bilibili 当前 gzip 约定解压，最多
  4 MiB，修改后以标志 `0` 和新的消息长度输出。
- 未知帧标志、gzip 解压不可用/失败或解压后超限时，整份响应原样返回。
- 多帧响应逐帧处理并重算被修改帧的长度；未修改的压缩帧保持原字节。
- 任一帧损坏、长度越界或嵌套消息无法解析时，整份响应原样返回。
- 只有目标关系卡被清理后确实为空的嵌套容器才随之移除；其他字段与模块保留。
- 不处理播放地址、弹幕会员效果、青少年模式、后台播放、真实会员状态或付费权益字段。
- 模块把压缩前 gRPC 响应体上限限制为 1 MiB；更大的响应不进入脚本；脚本另有
  4 MiB 解压输出上限。

广告/UI gRPC 上限为 1 MiB；播放地址 gRPC 上限为 4 MiB。两类脚本均不匹配
媒体分片域名或处理媒体文件响应体。

## 更新规则

Bilibili App 升级后，只有在以下条件全部满足时才更新字段表：

1. 精确方法名未发生歧义。
2. 至少两个独立来源或一个当前实现加实际脱敏抓包能确认字段语义。
3. 新 fixture 证明目标字段删除后未知字段 byte-for-byte 保留。
4. 不涉及账号、会员、付费权限、画质权益或播放器时间线。
5. 解析失败测试仍返回原始响应。
