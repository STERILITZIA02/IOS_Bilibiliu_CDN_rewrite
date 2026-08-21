# Bilibili iOS 9.7.0 脱敏抓包与差分指南

本指南用于补齐 v3.9.4 尚缺的真实载荷证据。目标是确认 9.7.0 的 endpoint、JSON
父路径或 protobuf field，而不是只提交截图文字。请勿公开 Cookie、SESSDATA、
access_key、buvid、设备标识、证书私钥或完整媒体签名 URL。

## 准备

1. 记录 iPhone/iPad 型号、iOS、Shadowrocket、Bilibili App 版本与 build。
2. 仅启用本仓库 Enhanced 模块，暂时关闭其他会匹配 Bilibili API 的模块。
3. 确认 HTTPS 解密 CA 已完全信任；将 Enhanced 参数 `调试日志=true`。
4. 不扩大 MITM 到 `bilivideo`、`acgvideo`、`akamaized.net` 等媒体主机。
5. 开始录屏并在日志中记下每个动作的本地时间；不要通过修改系统时钟制造差分。

## 两轮动作序列

每轮都从完全杀掉 Bilibili 开始。第一轮保留原始模块行为，第二轮可在确认安全后关闭
`广告过滤` 采集未过滤载荷；不要同时改变 CDN、账号、网络或其他参数。

1. 冷启动，停在首页 10 秒，下拉刷新一次并切换一次首页 Tab。
2. 搜索 `千问3.8max`，等待全部/分类结果稳定，再滚动触发一次分页。
3. 打开一个普通视频，等待播放器下方简介/运营区和相关推荐稳定。
4. 暂停、拖动进度、恢复播放、触发一次自动连播或重新进入视频。
5. 回首页，将 App 放后台 30 秒后恢复，重复步骤 1–4。
6. 再放后台 5 分钟后恢复，重复步骤 1–4。
7. 分别导出 Shadowrocket 请求记录、脚本 debug 日志和 PacketTunnel 日志，并保留
   录屏中的动作时间点。

## 每个请求必须记录

| 类别 | 必填内容 |
| --- | --- |
| 定位 | 去 query 后的 host、path 或完整 gRPC service/method；HTTP method |
| 传输 | HTTP/1.1、HTTP/2 或 HTTP/3；JSON/gRPC；Content-Type、Content-Encoding、grpc-encoding |
| 结果 | status（特别是 200/304）、响应体字节数、是否完全没有新请求 |
| 缓存 | 请求中 If-None-Match/If-Modified-Since/If-Range 是否存在；响应 ETag/Last-Modified/Age/Expires/Cache-Control |
| 命中 | Enhanced request/response 脚本是否命中；registry id、handler、reason、changed/removed |
| 生命周期 | cold、refresh、background-30s、background-5m 中的哪一步 |

URL 只保留 host/path 和决定分类的非敏感参数名；query 值统一替换成
`<REDACTED>`。不要把整条带签名 URL 粘贴到 issue。

## JSON 载荷

对每类缺陷保存一份未过滤的最小响应副本，并完成以下脱敏：

- Cookie/token/sign/WBI 值、账号/设备 ID、时间戳替换为固定占位符；
- 图片与跳转 URL 保留 scheme、host、path 形状，但删除 query 值；
- 保留对象层级、数组位置、key 名、值类型、card/business/module type；
- 保留广告对象的完整父路径，以及它与 CTA、layout、relate 的兄弟/父子关系；
- 不只摘录“广告”“闲鱼”“商品”等文字。

目标路径至少包括：

- 搜索商业主体及 recommendation/action/download CTA 的共同父数组；
- 首页广告卡的 `goto/card_goto/card_type`、商业 badge/wrapper 与视频身份；
- 首页魔力赏双列卡的完整对象，尤其是“广告”角标与“人数感兴趣”分别落在哪个
  JSON 字段；若来自 gRPC，保存 `Popular/Index` 原始帧以核对具体 oneof；
- 闲鱼横幅所在 module 数组、operation/action/button/jump URI 与 layout；
- 播放器下“商品名 + 广告 · 兴趣人数”原生卡的完整父数组、标签路径、
  卡片类型、layout 与跳转证据；
- 会员购卡所在 relates 数组、商品 type/oneof、price/deposit/sales/purchase URI；
- 冷启动和恢复响应的同一路径结构差分。

## gRPC 载荷

仅有文本日志不足以确认 field number。必须同时提供：

1. 精确 service/method、Content-Type、grpc-encoding、响应 status；
2. 原始脱敏 `bodyBytes` 或每帧 payload 的 base64/hex；
3. 帧数、每帧 compression flag 与 frame size；
4. 解压后的顶层 field number/ wire type 统计；
5. 同一普通卡与商业卡的 wire diff；
6. 可对应到公开 proto 的 message/oneof 名称，或明确标记“未知待确认”。

不得从截图顺序或文案猜 field number。若必须脱敏 protobuf 字符串，替换值时保持原
wire type；长度变化后重新编码该 length-delimited field，不要直接覆盖原字节造成帧损坏。

## 冷启动与后台恢复差分

将四个阶段按时间对齐：`cold`、`refresh`、`background-30s`、`background-5m`。

- 有新请求：比较 endpoint/host/transport 是否变化，request guard 是否命中，是否仍
  发出 validator，是否收到 304，response filter 是否命中及客户端是否采用修改正文。
- 只有 HTTP/3/QUIC 请求绕过：记录精确 API metadata host/path；不要把媒体 CDN
  混入证据。只有该事实确认后才讨论最窄 TCP 回落。
- 完全没有网络请求：用录屏和 PacketTunnel 时间段证明。此类现象是 App 进程内存或
  本地数据库恢复，Shadowrocket 无法在恢复瞬间修改已解码 UI；不要记录成脚本命中。
- 若恢复请求使用替代 host/path：同时给出冷启动与恢复两条精确记录，供 registry
  增加有边界的新 row。

## 期望 debug 摘要

正常日志应能看到类似字段，但不应包含 query 或正文：

```text
registry=<id> handler=<handler> transport=<json|grpc> method=<GET|POST>
status=<200|304> content-type=<type> content-encoding=<encoding> bytes=<n>
paths=<bounded-array-paths> types=<bounded-card-or-business-types>
changed=<n> removed=<n> reason=<stable-reason>
```

请求守卫日志还应列出被删除的 validator 名称与数量。若 `registry` 为空、reason 为
unknown/unmatched、gRPC 压缩不支持或 top-field 分布变化，请连同精确 host/path/method
一并提交。

## 可接受的证据包

建议目录结构：

```text
ios970-capture/
  environment.txt
  action-timeline.txt
  cold.requests.redacted.log
  resume-30s.requests.redacted.log
  resume-5m.requests.redacted.log
  search.json
  feed.json
  view.json
  relates.json
  grpc-method-name.frame-1.bin
  grpc-summary.txt
```

提交前再次搜索 `access_key`、`SESSDATA`、`Cookie`、`buvid`、`sign`、`w_rid` 和媒体
URL query，确保没有真实值。结构证据齐全后，下一版本才能把实际 endpoint/JSON path/
protobuf field 写入 registry、实现与审计文档。
