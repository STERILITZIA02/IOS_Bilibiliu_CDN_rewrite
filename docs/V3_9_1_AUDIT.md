# v3.9.1：Bilibili iOS 9.6.1 首页空流回归修复

## 根因

v3.9.0 的 `strictHomeVideoIdentity()` 要求首页普通 AV 同时具备正数 AVID、正数
CID、严格 BVID 和合法视频 URI，并把三个已知 `card_type` 当作硬白名单。Bilibili
iOS 9.6.1 的真实普通卡可能只下发其中一部分，因此非空 `data.items` 会被过滤为
空数组；零条结果还会触发一次补取，而补取响应经过相同条件后仍可能为空。

## v3.9.1 判定边界

首页判定改为“先排除、后确认”：

- `is_ad`、`is_commercial`、ad/cm/banner 类型、商业 ID/角标以及明确
  commercial、creative、tracking、exposure、click 载荷先删除；
- live、PGC/OGV、番剧、游戏、课程、文章、漫画和活动等明确非普通视频先删除；
- `goto`、`card_goto`、`type`、`player_args/playerArgs.type` 为 `av/video`，或
  已知普通卡型，任一可提供 AV 类型证据；
- item、`player_args`、`playerArgs`、archive、video、basic 中任一正数
  aid/avid、合法 BVID、数字/BVID `param` 或受支持视频 URI，均可提供强身份；
- CID 只用于宽松 fallback，不再是普通视频的必填项；未知新卡型不再被硬拒绝；
- 标题中的“广告”“闲鱼”“魔力赏”“推广”不作为商业证据。

## 非空首页保证

主判定若对服务端非空数组得到零条，会按原顺序执行两个有界 fallback：第一层仍
排除商业和非视频，只接受有明确 AV 特征、但身份仅剩 CID 等辅助证据的卡；第二层
只删除明确商业卡，最多保留前六条。若第二层仍为空，响应原样返回并记录
`feed-empty-fail-open`，不写入 `data.items=[]`。服务端原始空数组保持不变。

补取仅在首份结果保留 1–5 条时执行一次。AVID、BVID、`param` 和视频 URI 会先
规范化为同一身份再去重；补取失败、超时或没有新卡时继续使用首份结果，不递归、
不生成占位卡，Shadowrocket 入口仍只调用一次 `$done()`。

## 未改动范围

本版本不修改 endpoint registry、gRPC 后台恢复/广告处理、播放页、Story、
`BiliCDN.hostAuto.v10`、`BiliCDN.mediaRoutes.v9` 或 CDN 测速/选路算法。
