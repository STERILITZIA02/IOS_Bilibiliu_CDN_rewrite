# v3.9.0：Bilibili iOS 9.6.1 广告恢复与 CDN 启动性能审计

## 证据范围

本轮审查逐项覆盖 `src/`、构建器、三个 Shadowrocket 模块、请求侧媒体路由、
测试、网站和发行工作流。工作区可读的 PacketTunnel 文件是 9.5.0
（UA/build `bili-universal/90500100`），不是 9.6.1；它确认元数据走 HTTP/2、
未出现 Bilibili 元数据 QUIC 绕过，并暴露了
`bilibili.app.story.v1.Story/BottomDiversionEntrance`。因此 v3.9.0 没有增加媒体或
元数据 TCP 强制回落，也不把媒体 CDN 放进 MITM。

9.6.1 的回归载荷以最小 fixture 固化。字段号只使用仓库既有证据和公开 protobuf：

- `bilibili.app.view.v1.ViewReply`: `tab(5)`、`cm(7)`；`CM.cm_under_player(1)`；
- `bilibili.app.viewunite.v1.Module`: `type(1)`、`relates(22)`、`banner(23)`；
- `ViewProgress`: `video_guide(1)`、`dm(4)`；`DmResource.operation_card(3)`；
- `OperationCard`: `biz_type(5)`、`content(6)`；
- ViewUnite 公共 RPC：`View`、`ViewProgress`、`RelatesFeed`、`ArcRefresh`；
- 仓库既有实证 RPC：`PlayPause`、`ViewEndPage`；日志实证 Story
  `BottomDiversionEntrance`。

没有对未知 protobuf 容器猜测 field number，也没有做全消息任意字段删除。

## 根因与修复

### 1. matcher、请求分类和响应分类漂移

旧实现分别维护模块正则、请求缓存守卫和响应 handler。新增/迁移 RPC 可能只进入
其中一条路径，造成冷启动命中过滤、恢复态请求却复用缓存或未进入脚本。

`src/bilibili-endpoints.js` 现为单一 registry。每条记录包含 host、精确 path/RPC
或受限诊断 pattern、transport、handler、volatile、requestGuard、responseFilter
和 runtime。构建器从同一表生成 JSON/gRPC/Story/刷新 matcher 和 MITM 主机，运行时
分类也读取同一表。

新增或显式纳入的恢复敏感族包括 Home、Popular、Story、View、ViewProgress、
RelatesFeed、ViewUnite View/ViewProgress/PlayPause/ViewEndPage/RelatesFeed/ArcRefresh，
以及受限的 view/viewunite/show/story/home/card/feed 未知 gRPC 诊断入口。日志确认的
`Story/BottomDiversionEntrance` 使用独立 handler。

### 2. gRPC 依赖“已知 endpoint”才识别

旧入口可能把新增 RPC 的二进制正文当文本并静默放行。v3.9.0 先独立判断 transport：

- `application/grpc`、`application/grpc+proto` 直接识别为 gRPC；
- 完整合法的 gRPC frame 序列可辅助识别；
- JSON、gRPC 和未知二进制分别记录。

debug 对未知方法只输出去 query 的 host/path、App version/build、content-type、
grpc encoding/status、帧 flag/size、顶层 field number 分布、handler、hitType、changed
和 reason，不输出 Cookie、access key、完整 query 或正文。

修改后的 gRPC 响应逐帧保留顺序，并统一删除失效长度/缓存头。解压并写回 flag=0 后
同步移除不再成立的 `grpc-encoding`。`bili-universal` moss engine 1 与 `bili-blue`
确保 `grpc-status: 0`，`bili-inter` 删除该头。请求侧把易变 gRPC 的
`grpc-accept-encoding` 设为 `gzip,identity`；无法支持的压缩格式会明确诊断。

### 3. 9.6.1 商业卡伪装与恢复态缓存回灌

首页严格模式以前接受不完整的视频身份，且商业证据表没有覆盖 9.6.1 的新角标和动作
容器。现在普通首页 AV 必须同时具备正数 aid、合法 bvid、正数 cid、合法视频 URI 和
审核过的普通卡型；最多保留六条。`ad_badge`、`ad_tag_style`、`badge_info`、
`commercial_label`、`business_badge`、`bottom_rcmd_reason_style`、角标文本容器、
creative/tracking/exposure/click/commercial action 及已确认 ad/cm/business oneof
只在审核过的商业元数据位置构成删除证据。普通 title 不参与全局关键词过滤。

视频页只在确认的操作卡、商业模块和按钮/action 容器内识别 `goofish.com`、
`2.taobao.com`、`market.m.taobao.com`、已确认淘宝/闲鱼 scheme，以及“闲鱼集市”与
“立即打开”。普通视频标题包含“闲鱼”“广告”“魔力赏”仍保留。

所有 volatile JSON/gRPC 请求移除 `If-None-Match`、`If-Modified-Since`、`If-Range`，
并设置 no-cache/no-store；对应响应即使正文未变化也返回 no-store，避免 304 或旧缓存
在后台恢复时覆盖已过滤结果。

## CDN hostAuto v10

播放响应热路径仍只同步读状态，probe 次数恒为零。`BiliCDN.mediaRoutes.v9` 保持
原 key 和竞态语义：只存、只写目标自己由服务端返回的完整签名 URL，当前已发出的
socket 不追溯修改，只影响之后的精确 GET/HEAD Range 请求。

`BiliCDN.hostAuto.v10` 不迁移 v8。每个网络档案和主机按 audio、normal-video、
high-bitrate-video 分桶，保存：

- 64 KiB startup TTFB 中位数和短段吞吐 p25；
- 1 MiB 内部 Range 持续吞吐 p25；
- failure rate、jitter ratio、last success、对象数和样本时间；
- 全局 failure streak 与两小时 circuit。

若 Shadowrocket 回调提供 TTFB timing，v10 直接使用；只提供“正文完成”回调的版本以
64 KiB 完成时间作为 TTFB 上界，因此仍偏向真正更快完成首段的节点，而不会伪造
不存在的首字节时间。

选择先要求 startup 与 sustained 都满足当前 descriptor 的 kind、bandwidth、quality、
codecid 对应带宽余量，再综合 TTFB、短段吞吐、持续吞吐、失败率与抖动。当前主机
健康时，挑战者必须领先配置的 `switchThreshold` 才切换；当前主机不健康则立即选
最优合格候选。不同网络不共享统计；Shadowrocket 提供网络信息时只保存 Wi-Fi/蜂窝
类型与稳定标识的 hash，不支持时回落 `auto`。

cron 第一阶段串行测试 reference、selected、pending、完整 Akamai 和轮换 challenger
的 64 KiB Range；第二阶段只测试 reference 与最优两个 challenger 的轮换 1 MiB
Range。每一步继续验证 206、Content-Range、总长、正文长度、hash、类型、identity
编码与对象一致性；跳过熔断主机，单请求 5 秒，整轮预算 45 秒。

## 自动化覆盖与真机边界

新增回归覆盖 9.6.1 首页混合 JSON、商业 AV、大 Banner、Goofish 操作卡、恢复一致性、
未压缩/gzip/多帧 gRPC、UA grpc-status、请求压缩协商、未知 RPC 诊断、普通标题误判、
TTFB 优先、失败/抖动淘汰、switchThreshold、网络隔离、媒体桶、热路径零 probe 和
mediaRoutes 完整签名绑定。

真机最小复测：冷启动首页、三次下拉/切 Tab；首页六条与三类商业残留；普通视频
横竖屏；暂停、连续 Seek、4K/倍速/切清晰度、自动连播；后台 30 秒与 10 分钟后分别
恢复首页和视频页；评论、账号、会员、进度、音频；Wi-Fi/蜂窝各完成两轮 cron；确认
媒体 CDN 不在 MITM，调试日志无完整 query 或凭据。
