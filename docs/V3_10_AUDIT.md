# v3.10.0：Bilibili iOS 9.8.0 异步广告与恢复态审计

> 审计日期：2026-08-21
> 远端基线：`main` / `697801b405ee467b29e42002d53129d686d1a2cc`
> 本地前置版本：package `3.9.4`（包含尚未推送的首页魔力赏角标修复）
> 目标版本：`3.10.0`

## 结论与证据等级

Apple App Store 已显示 Bilibili 正式版 `9.8.0`。当前工作区没有 9.8.0 原始抓包；
唯一 PacketTunnel 日志的 UA/build 为 `9.5.0 / 90500100`，因此不能用于宣称 9.8.0
新增 host、HTTP/3 或字段。

本版的核心适配来自 2026-08-09 的当前公开实现与同仓库 proto：新增精确 RPC
`bilibili.app.viewunite.v1.View/AIRelateAsync`，并公开了响应字段结构。其他补齐项也
仅使用公开 proto 中可核对的字段或当前 JSON handler 中的精确 path/card type。

## 根因表

| 表面问题 | 修复前真实根因 | v3.10.0 修复 | 证据 |
| --- | --- | --- | --- |
| 主 View 正常，稍后或后台恢复后相关推荐重新出现广告 | `AIRelateAsync` 被 generic gRPC diagnostic matcher 命中，已有 request guard/no-store，但 handler 只诊断并透传正文 | 新增精确 registry row；删除 `cm(1)`，进入 `module(2) -> modules(1) -> Module.relates(22)` 过滤同一关系卡，并移除空关系模块 | 当前公开 route、handler 与 proto 明确确认 |
| iPad/旧 View 残留标签、特殊卡和充电入口 | View v1 handler 只删旧字段 30/31/34/41/48，漏了公开 `label(23)`、`special_cell_new(50)` 与 `req_user(4).elec_plus_btn(9)` | 只删上述精确字段；ReqUser 其他字段和未知 bytes 保留 | 公开 `bilibili.app.view.v1` proto |
| ViewUnite 仍有充电/标题运营标签 | 主 View 只处理 `cm(7)`、Tab 与 relates | 增加 `req_user(3).elec_plus_btn(7)`；UGC_HEADLINE module 只清 `head_line(5).label(1)` | 公开 ViewUnite proto |
| 评论区置顶运营卡残留 | 旧 handler 只清顶层 `cm(11)` 与含明确商业短链的 top reply | 过滤 `subject_top_cards(28)` 中 Type.CM=3 和 OPERATION=5，保留评分、UP 保护/精选、投票和电竞卡 | 公开 MainList proto |
| 动态出现直播推荐干扰 | Dynamic handler 只删除 AD=15 | 同时删除公开 LIVE_RCMD=18，普通动态保留 | 公开 Dynamic proto |
| 直播首页/主播页商业容器残留 | endpoint registry 只有房间详情；首页 feed 与 getInfoByUser 未进入脚本 | 新增两个精确 JSON row；删除 `banner_v2`/`activity_card_v1`、play-together/function card；房间已审核 commerce tab ID 同步清理，预约数据保留 | 当前公开 JSON router/handler；9.8.0 真机路径仍待抓包 |

## 后台恢复处理

三个新增 endpoint 均声明 `volatile=true`、`requestGuard=true`、
`responseFilter=true`。请求侧删除大小写任意的 `If-None-Match`、
`If-Modified-Since`、`If-Range`，写入 `Cache-Control: no-cache, no-store,
max-age=0` 与 `Pragma: no-cache`；gRPC 协商固定 `gzip,identity`。

响应侧无论 `changed` 是否为零，都删除 ETag、Last-Modified、Age、Expires、旧缓存头
与 Content-Length，返回一致 no-store。专项运行时测试覆盖 cold、30 秒、5 分钟和
30 分钟恢复，正文一致且 `$done()` 每次只调用一次。

若恢复时完全没有网络请求，Shadowrocket 不能修改 App 已解码的进程内存/本地数据库。
本版没有添加无依据 cache-buster、QUIC 阻断、媒体 MITM 或 iOS lifecycle hook。

## Protobuf 写回边界

- identity、gzip 与多帧逐帧处理，顺序保留；改写压缩帧输出 flag=0。
- 只清目标 field/repeated element，不重建整个消息；未知字段保持原始 wire bytes。
- 损坏帧、未知压缩或解析失败原样放行。
- gRPC Content-Type、grpc-status 与 no-store 头继续走统一规范化。
- 4 MiB 上限未扩大；当前没有超过限制的 9.8.0 证据。

## 自动验证状态

- 新增 9.8.0 JSON fixture：直播 feed 与主播页商业/干扰容器。
- 新增 exact-wire fixture：AIRelateAsync、View v1、ViewUnite、MainList、DynAll。
- `npm run check:all` 通过：核心测试 172/172，站点测试 4/4，lint 与确定性构建通过。
- `npm run smoke:auto` 通过：两条真实媒体内部 Range 均返回 206，1 MiB 正文与
  总长度一致性校验成功。
- 真机验收：尚未执行，不能由自动测试代替。

## 保持不变

- 首页六条普通 AV、两级非空 fallback、一次补取和普通标题误杀保护。
- JSON/gRPC/Story 单次 `$done()` 合并流水线。
- hostAuto v10、mediaRoutes v9、播放响应热路径零探测、CDN 评分与切换阈值。
- 服务端完整签名 URL、Akamai 禁止拼接、Range/UA/媒体请求头和媒体 MITM 边界。
- Resource `Module/List` 继续诊断透传；公开 schema 表明它是模块资源下载清单，不应
  为了“界面恢复原版”而清空，否则可能破坏 App 资源更新。

## 真机仍需确认

1. 9.8.0 实际 build 与 `AIRelateAsync` 的 host、帧大小、压缩方式和字段分布。
2. 冷启动/恢复是否切换替代 host、HTTP/3 或另一个新 RPC。
3. “界面完全原版”发生时是否有新请求；若没有，记录进程内存恢复事实。
4. 直播两条 JSON path 是否在 9.8.0 iPhone/iPad 均使用相同结构。

抓包步骤见 [`BILIBILI_9_8_CAPTURE.md`](BILIBILI_9_8_CAPTURE.md)。
