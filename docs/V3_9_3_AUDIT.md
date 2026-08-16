# v3.9.3：播放器下原生兴趣广告卡修复审计

> 审计日期：2026-08-16
> 基线：`main` / `f3d551372923e7003e28ed3b5dc7f6c113c95674` / package `3.9.2`
> 目标版本：`3.9.3`

## 结论与证据边界

用户截图确认了普通视频播放器下方重新出现一张原生广告卡：商品名
`AirPods Pro 3`，独立副标签为“广告 · 7.1万人感兴趣”。截图不包含原始 HTTP/gRPC
响应，因此本版不宣称截图已确认实际 JSON 父路径或新 protobuf field。

实现采用有界修复：增加与截图结构等价的 fixture，仅在已审核的卡片展示
容器中识别独立广告标签，而不将商品名、普通视频标题或简介中的关键词作为
广告证据。

## 根因与修复

| 路径 | 修复前的代码根因 | v3.9.3 处理 | 证据状态 |
| --- | --- | --- | --- |
| JSON View | View 容器过滤器能识别显式商业字段和已审核模块，但未在受控的单卡展示容器中检查独立“广告 · 兴趣人数”标签 | 仅遍历已审核的 `card/card_info/content/metadata/native_card/presentation` 包装和 `badge/label/subtitle/tag` 类标签字段；命中后删除整个 module 与 layout 占位 | `data.view_modules[].card.metadata.subtitle.text` 为截图等价 fixture 路径，非原始抓包确认 |
| gRPC ViewProgress | 现有 `VideoGuide.Material` 过滤依赖类型或其他商业证据，未覆盖该独立标签 | 在已确认的 `ViewProgressReply.video_guide(1) -> VideoGuide.material(1) -> Material.text(2)` 上应用同一精确标签判定，仅删除命中 Material，保留其他 repeated message 和未知 wire bytes | field path 由现有公开 schema/仓库兼容记录确认；本版没有新增或猜测 field number |

标签匹配是完整字段匹配，支持“广告”或“广告 · 数量人感兴趣/看过/围观/点击”；
不在任意字符串中做子串扫描。因此“广告、闲鱼、推广与商品行业观察”这类普通
标题仍保留。

## 后台恢复

endpoint registry 已精确覆盖 JSON `/x/v2/view` 和 gRPC `ViewProgress`，且两者均为
`volatile=true` / `requestGuard=true` / `responseFilter=true`。本版不新增 matcher，而是保证
同一新标签证据在冷启动、后台 30 秒和后台 5 分钟后的新响应中得到一致处理。
易变 View 响应仍删除 `ETag/Last-Modified/Age/Expires`，并写入 no-store/no-cache；合并
运行时只调用一次 `$done()`。

如果 App 恢复时完全没有网络请求，Shadowrocket 无法回溯修改已解码的 App 内存或
本地数据库。本版没有伪造 iOS scene lifecycle hook，也没有对签名、WBI、gRPC POST
或媒体 URL 添加 cache-buster。

## 回归范围

- 新增截图等价 JSON fixture：广告 module 整块删除，普通关键词标题保留。
- 新增已确认 protobuf field 回归：目标 Material 删除，普通 Material 与未知字段保留。
- 新增冷启动、后台 30 秒、5 分钟恢复、no-store 头和单次 `$done()` 回归。
- `npm run check:all` 通过：核心测试 161/161，站点测试 4/4，lint 与确定性构建通过。
- `npm run smoke:auto` 通过：两条真实媒体内部 Range 均返回 206，1 MiB 正文、总长度和内容一致性校验成功。
- 真机验收尚未执行。

## 未变更与待确认项

- 未变更 endpoint registry，未增加 JSON path matcher 或 protobuf field number。
- 未变更 hostAuto v10、mediaRoutes v9、CDN 评分/测速、签名 URL、Range 或媒体
  MITM 边界。
- 仍需按 [`BILIBILI_9_7_CAPTURE.md`](BILIBILI_9_7_CAPTURE.md) 补交截图复现时的脱敏 JSON/gRPC
  响应，以确认实际 endpoint、父路径、transport 与冷启动/恢复态差异。
