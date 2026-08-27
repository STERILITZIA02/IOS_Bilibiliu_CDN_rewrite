# Bilibili iOS 9.9.0 / 海外版最小抓包与真机验证

本指南补齐截图不能证明的 endpoint、状态、压缩与恢复行为。v3.11.0 已有协议等价
自动测试，但没有对应手机的真实响应载荷，不能据此宣称全部广告或海外动态已真机解决。

## 先核对运行版本

1. 分别记录国内、海外 App 的**完整名称、商店链接/ID、版本与 build**。
   美国商店的 9.9.0、旧 bili-inter 白版和 BiliBili Intl 不是可互换的协议身份。
2. 发布后更新到 Enhanced 3.11.0，只启用一套 Bilibili 响应脚本，重新应用配置。
   `script-path` 应含 `?v=3.11.0`；即时 gRPC 两条脚本应为 `engine=jsc`。
3. 开启“调试日志”，确认输出 `runtime=3.11.0`、`gzipCodec=bundled`。
   若仍是旧版本、没有日志、证书未信任或另一个脚本抢先命中，应先排除安装问题。
4. 不把 bilivideo/acgvideo/akamaized 等媒体 CDN 加入解密，不改 WBI 或签名 query。
5. 完全退出 Bilibili 后重开一次，避免把旧进程内广告误当成新响应过滤失败。无需
   清空已下载视频、账号或整个 App 数据。

## 最小复测顺序

| 阶段 | 操作 | 核对 |
| --- | --- | --- |
| overseas-dynamic | 海外版动态综合流刷新三次、切视频流、向下翻页、进入个人动态 | 成功/失败时间、真实 host/RPC/UA 前缀、status/headers、offset 是否递进 |
| cold-view | 国内版打开带“UP主分享好物”的普通视频 | 主 View 与 AIRelateAsync 到达后商品区/空白占位是否消失 |
| playing | 同一视频持续播放 5 分钟，暂停/恢复、拖动到中后段 | DmView、ViewProgress、PlayerUnite 等请求与广告倒计时/底部弹出时间 |
| resume | 分别后台 30 秒、5 分钟、30 分钟后打开动态及视频页 | 有新请求、304、未命中，还是完全无请求的 UI 恢复 |
| playback | 4K/倍速/连续拖动/切清晰度/自动连播 | 无新增热路径探测，音视频、签名 URL、进度保持正常 |

每次记录录屏中的本地时间，并导出同一时间窗的 Shadowrocket 请求/PacketTunnel
日志。若运行时支持响应体导出，只导出出现问题的目标元数据接口。

## 目标请求

- `bilibili.app.dynamic.v2.Dynamic/DynAll`、`DynVideo`、`DynAllPersonal`、`DynVideoPersonal`。
- `/x/polymer/web-dynamic/v1/feed/all`；若实际请求是其他 host/path，原样记录其
  **去 query 后地址**，不要自行套用已知 JSON/proto。
- `bilibili.app.playerunite.v1.Player/PlayViewUnite`：只能有一个响应 owner。
- `bilibili.app.viewunite.v1.View/View`、`AIRelateAsync`、`ViewProgress`、
  `RelatesFeed`、`PlayPause`、`ViewEndPage`，以及旧 `bilibili.app.view.v1.View` 同名方法。
- `bilibili.community.service.dm.v1.DM/DmView`，不是 DmSegMobile 普通弹幕分段。

## 每条记录的最小字段

- host、path/RPC method、HTTP method、status、HTTP/1.1 / HTTP/2 / HTTP/3。
- Content-Type、Content-Encoding、grpc-encoding、grpc-status、moss engine、
  runtime 版本、是否暴露 h2_trailers 及其 grpc-status。
- 原/改写后的 body 字节数、gRPC frame flag/size、顶层 field number 分布。
- registry、handler、changed、removed、reason、writeBack、gzipCodec。
- 请求 validator 被移除的数量/名称；响应 ETag/Age/Last-Modified/Expires 是否已去除。
- JSON 广告对象的完整父路径；protobuf 必须保留原 wire type 与层级。

不要公开完整 query、access_key、Cookie、SESSDATA、Buvid、设备 ID、签名 URL。
脱敏时用稳定占位符替换值，不能删掉决定解析行为的容器、字段号或类型。
请分别提供“未启用模块的原响应”和“启用后的同类响应”；不要把未脱敏数据提交仓库。

## 待确认事项

1. 海外动态失败时的 UA 是否为 bili-inter；是否缺 grpc-status，是否存在真实
   401/403/非零 RPC 错误，是否使用了未覆盖 API，而不是推断为本地过滤造成。
2. 商品卡是主 View.type=55、AIRelateAsync.type=55，还是另一个模块/oneof。
3. 红果短剧与华莱士横幅是否来自 PlayerUnite ViewInfo、DmView command、
   ViewProgress，或新的投放接口；需要正文/wire diff 才能增加字段规则。
4. 后台恢复时若**有请求**，按 matcher→transport→handler→writeBack 顺序定位。
   若**无请求**，明确写“该时间窗无网络请求，App 内存/本地 UI 恢复”，而不是
   报告脚本成功/失败；Shadowrocket 没有修改该内存的入口。
5. 只有看到元数据 API 的 HTTP/3 确实绕过脚本，才考虑精确 API host 的 TCP 回落。
   本版不默认禁用 QUIC、不牺牲媒体 CDN，也不自动重放带身份的 gRPC POST。
