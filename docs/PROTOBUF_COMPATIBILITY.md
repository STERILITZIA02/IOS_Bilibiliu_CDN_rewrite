# Protobuf/gRPC 兼容性记录

> 字段核对日期：2026-07-26
> 过滤器实现：`src/bilibili-enhance.js`

本项目不打包完整 Bilibili Protobuf schema，也不使用“猜测式递归删除”。过滤器只在精确的 gRPC 方法上读取少量广告判别字段，删除目标字段或重复项时原样复制其余 wire bytes。未知字段、未知 oneof、压缩帧和无法解析的消息全部保留。

字段语义主要与 [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock) 当前 Apache-2.0 实现交叉核对；字段号再通过 `bilibili-API-collect` 的公开镜像提交 `cfc5fddcc8a94b74d91970bb5b4eaeb349addc47` 核对。后者采用 CC BY-NC 4.0；本仓库没有复制其 schema、注释或实现，只记录用于互操作所需的字段号与语义事实。

## 当前处理表

| gRPC 方法 | 高置信处理 |
| --- | --- |
| `bilibili.app.view.v1.View/View` | 删除 `ViewReply` 的 `cms(30)`、`cm_config(31)`、`cm_ipad(41)`、`cm_under_player(48)`；仅移除含 `Relate.cm(28)` 的关联卡 |
| `bilibili.app.view.v1.View/RelatesFeed` | 仅移除含 `Relate.cm(28)` 的卡 |
| `bilibili.app.viewunite.v1.View/View` | 删除顶层 `cm(7)`；在详情介绍的 `Relates` 中移除明确的游戏/CM 类型、`cm_stock` 或非空推广 `unique_id` 卡 |
| `bilibili.app.viewunite.v1.View/RelatesFeed` | 使用与上项相同的卡片判据 |
| `bilibili.app.dynamic.v2.Dynamic/DynAll` | 仅移除 `DynamicItem.card_type == 15 (ad)` |
| `bilibili.polymer.app.search.v1.Search/SearchAll` | 仅移除 oneof 为 `game(11)` 或 `cm(25)` 的搜索卡 |
| `bilibili.main.community.reply.v1.Reply/MainList` | 删除顶层 `cm(11)`；仅移除正文或 URL map 明确含 `b23.tv/cm`、`b23.tv/mall` 的置顶评论 |

## 解析与失败边界

- 仅支持标准 Protobuf wire type `0`、`1`、`2`、`5`。
- gRPC 压缩标志不为 `0` 的帧原样保留。
- 多帧响应逐帧处理并重算被修改帧的长度。
- 任一未压缩帧损坏、长度越界或嵌套消息无法解析时，整份响应原样返回。
- 不处理播放地址、弹幕会员效果、青少年模式、后台播放、会员提示或付费权益字段。
- 模块把 gRPC 响应体上限限制为 1 MiB；更大的响应不进入脚本。

## 更新规则

Bilibili App 升级后，只有在以下条件全部满足时才更新字段表：

1. 精确方法名未发生歧义。
2. 至少两个独立来源或一个当前实现加实际脱敏抓包能确认字段语义。
3. 新 fixture 证明目标字段删除后未知字段 byte-for-byte 保留。
4. 不涉及账号、会员、付费权限、画质权益或播放器时间线。
5. 解析失败测试仍返回原始响应。
