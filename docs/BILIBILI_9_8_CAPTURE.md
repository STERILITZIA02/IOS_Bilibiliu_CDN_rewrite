# Bilibili iOS 9.8.0 脱敏抓包与长期后台差分指南

本指南用于补齐 v3.10.0 仍缺的 9.8.0 真机载荷证据。App Store 已确认正式版
9.8.0 发布，但版本号和截图不能确认实际 endpoint、JSON 父路径、gRPC field 或
HTTP/3 行为。请勿公开 Cookie、SESSDATA、access_key、buvid、设备标识、WBI/签名
值或完整媒体 URL。

## 环境与模块

1. 记录设备、iOS、Shadowrocket、Bilibili `9.8.0` 与实际 build。
2. 只启用本仓库 Enhanced 3.10.0；关闭其他会命中 Bilibili API 的脚本。
3. HTTPS 解密 CA 完全信任，参数设为 `调试日志=true`。
4. 不把 `bilivideo`、`acgvideo`、`akamaized.net` 等媒体 CDN 加入 MITM。
5. 录屏并记录每一步本地时间，便于对齐请求、脚本日志和 PacketTunnel 日志。

## 必做生命周期

每轮从完全杀掉 Bilibili 开始：

1. 冷启动首页，等待 15 秒，下拉刷新并切换一次 Tab。
2. 打开普通视频，等待简介、评论和相关推荐全部异步加载；记录是否出现商品、游戏、
   直播、AI 推荐、闲鱼/淘宝横幅或兴趣广告。
3. 暂停、恢复、连续拖动三次并触发一次自动连播。
4. 回首页并分别后台 30 秒、5 分钟、30 分钟后恢复；每次重复步骤 1–3。
5. 进入直播首页和普通直播间，再进入主播信息页，记录 Banner、活动卡、组队/商业
   功能卡是否出现。

## 每个请求记录项

| 类别 | 内容 |
| --- | --- |
| 定位 | 去 query 后 host/path 或完整 gRPC service/method；GET/POST |
| 传输 | HTTP/1.1、HTTP/2、HTTP/3；Content-Type、Content-Encoding、grpc-encoding |
| 结果 | status（尤其 200/304）、body 字节数、是否完全没有网络请求 |
| 缓存 | 请求 validator；响应 ETag/Last-Modified/Age/Expires/Cache-Control |
| 脚本 | registry、handler、transport、changed、removed、reason、frame/topFields |
| 阶段 | cold、refresh、resume-30s、resume-5m、resume-30m |

优先核对这些已知入口：

- `bilibili.app.viewunite.v1.View/AIRelateAsync`
- `View`、`ViewProgress`、`RelatesFeed`、`PlayPause`、`ViewEndPage`
- `bilibili.main.community.reply.v1.Reply/MainList`
- `bilibili.app.dynamic.v2.Dynamic/DynAll`
- `/xlive/app-interface/v2/index/feed`
- `/xlive/app-room/v1/index/getInfoByRoom`
- `/xlive/app-room/v1/index/getInfoByUser`
- `/x/v2/feed/index`、`/x/resource/show/tab/v2`、`/x/v2/account/mine`

若 debug 出现 `registry=unmatched` 或 generic diagnostic，请保存精确 host/path/method；
不要只截取广告文字。

## gRPC 载荷要求

`AIRelateAsync` 当前公开 schema 为：

```text
AIRelateAsyncReply.cm(1)
AIRelateAsyncReply.module(2)
  AsyncModule.modules(1)
    Module.type(1)
    Module.relates(22)
      Relates.cards(1)
```

提交原始脱敏 bodyBytes/base64、每帧 flag/size、解压后的顶层 field 统计，并保留未知
field 的 wire type。若 9.8.0 实际结构不同，提供普通响应与商业响应的 wire diff；
不得从界面顺序猜字段号。

## 区分两类“恢复原版”

- 有新请求：检查是否切换 host/path/transport、matcher 是否命中、是否收到 304、
  handler 是否 changed，以及客户端是否采用修改后的正文。这属于模块可修复范围。
- 完全没有请求：App 直接从进程内存或本地数据库恢复已解码 UI，Shadowrocket 无法
  在恢复瞬间回溯修改。必须用录屏与 PacketTunnel 的空时间段证明，不能记录成脚本
  失效，也不能伪造 scene lifecycle hook。

只有真机证明精确元数据 API 因 HTTP/3/QUIC 绕过脚本，才讨论最窄 TCP 回落；禁止
阻断媒体 CDN。只有无签名 GET 的精确 endpoint 证明需要 cache-buster 时才评估有限
参数；不得修改 WBI、签名请求、gRPC POST 或媒体 URL。
