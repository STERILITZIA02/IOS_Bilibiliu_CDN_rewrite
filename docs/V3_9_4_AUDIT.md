# v3.9.4：首页魔力赏展示角标广告修复审计

> 审计日期：2026-08-17
> 基线：`main` / `697801b405ee467b29e42002d53129d686d1a2cc` / package `3.9.3`
> 目标版本：`3.9.4`

## 结论与证据边界

用户截图确认首页双列推荐流重新出现两张具有普通 AV 外壳的商业卡，封面右下角显示
独立“广告”，卡片副信息为“143 万人感兴趣”或“877 万人感兴趣”。截图不是网络
响应，不能证明实际 host、endpoint、JSON 父路径或传输类型。

本版没有据此猜测新 endpoint。实现同时覆盖现有 JSON 首页 handler 中公开卡片字段名
以及 endpoint registry 已确认的 gRPC `bilibili.app.show.v1.Popular/Index`；具体截图
仍需按抓包指南提供脱敏载荷，才能确认真机实际走到哪条分支。

## 根因与修复

| 分支 | 修复前根因 | v3.9.4 处理 | 证据状态 |
| --- | --- | --- | --- |
| JSON 首页 | 卡片保留普通 `av` 类型与 AVID，商业证据只出现在 `cover_right_text_1`、`corner_mark_style` 等展示字段；原显式商业标签表没有覆盖这些名字，因此主过滤与 fallback 均可能把卡保留 | 将公开卡片展示字段加入受限标签表。只检查角标、badge、推荐理由等字段，不扫描 `title`；整卡先于普通视频身份判断删除 | `data.items[]` 为截图结构等价 fixture，字段名来自公开 `bilibili.app.card.v1` schema；尚非截图对应真机 JSON 抓包 |
| gRPC Popular | 旧逻辑只识别 `Card.small_cover_v5_ad(11)` 与 `Base.ad_info(12)`；普通 `small_cover_v5(1)` / `large_cover_v1(2)` 外壳中的独立广告角标会漏过 | 在保留原 oneof/wire bytes 的前提下，仅检查 `SmallCoverV5` 文本字段 4/13 与 `ReasonStyle` 字段 7/9/12，以及 `LargeCoverV1` 文本字段 7/18/21 与样式字段 13–17；命中精确商业标签才删除该 repeated Card | field number 由公开 `bilibili.app.card.v1` proto 确认；截图对应 transport 仍待抓包 |

精确商业标签匹配支持独立“广告 / AD / 创作推广 / 商业推广 / 魔力赏”及其有界的
人数兴趣后缀。普通视频标题中的“广告”“魔力赏”不参与判断，时长、点赞数和普通
推荐理由不会命中。

## 首页非空与后台恢复

广告展示字段在主判定、第一层宽松 AV fallback 和第二层只删明确商业卡 fallback 中
使用同一个显式商业证据，因此不会由 fallback 重新放回。原服务器顺序、最多六条、
不足六条的一次补取和最终 `feed-empty-fail-open` 均未改变。

首页 JSON 与 Popular gRPC endpoint 的既有 registry、`volatile`、request guard 和
no-store 响应处理没有改动。冷启动、后台 30 秒和 5 分钟后的新响应会经过同一规则；
若 App 恢复时完全没有网络请求，Shadowrocket 仍无法回溯修改 App 已解码的内存 UI。

## 自动验证与未变更范围

- 新增截图结构等价 JSON fixture，并验证冷启动、后台 30 秒、后台 5 分钟结果一致。
- 验证首页两级 fallback 不会放回展示角标广告，普通标题关键词与六条顺序保留。
- 新增按确认 field number 编码的 gRPC identity fixture；验证两类角标广告删除、普通卡
  与未知 field 99 原样保留。
- `npm run check:all` 通过：核心测试 164/164，站点测试 4/4，lint 与确定性构建通过。
- `npm run smoke:auto` 通过：两条真实媒体内部 Range 均返回 206，1 MiB 正文与
  总长度一致性校验成功。真机尚未执行。
- 未变更 endpoint registry、refresh guard、hostAuto v10、mediaRoutes v9、CDN 评分/
  测速、签名 URL、Range 或媒体 MITM 边界。

## 真机待确认

1. 两张截图广告实际使用的 host/path、JSON 父路径或 gRPC method。
2. “广告”与“人数感兴趣”在原始未过滤响应中的完整兄弟/父子关系。
3. 冷启动、连续刷新、后台 30 秒与 5 分钟恢复是否都产生新请求并命中 Enhanced。

抓包方法见 [`BILIBILI_9_7_CAPTURE.md`](BILIBILI_9_7_CAPTURE.md)。
