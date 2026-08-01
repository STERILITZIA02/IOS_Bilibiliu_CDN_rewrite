# v3.7.0 增量审计：Mine 9.5.0 字段、响应表示绕过与 CDN 内部采样

> 审计日期：2026-08-01
> 目标 App：Bilibili iOS 9.5.0（日志 UA/build `90500100`）
> 证据输入：用户提供的 `PacketTunnel-20260801181511.log`、两张真机截图、当前仓库与固定提交的公开互操作资料。

## 结论与证据边界

本轮确认并修复了四个代码级问题：

1. **高：Mine 9.5.0 字段漏项。** `/x/v2/account/mine` 已命中请求和响应脚本，
   但 `vip_section_right`、`rework_v1.worst_creative` 以及 iPad section 数组未进入
   现有精确适配器。这能直接解释大会员中心横幅、首次投稿卡和部分模块在新响应后恢复。
2. **高：Mine 选项存在跨目标误判。** 默认开启的“首次投稿/有奖发布”兼容 URI 含宽泛
   `uper/activity`，默认开启的“能量加油站”含宽泛 `blackboard`；它们可能在目标开关
   关闭时仍顺带删除创作中心、设置或社区中心，表现为模块管理不遵守开关。
3. **高：CDN 只采文件开头。** v3.6 的两次 1 MiB 样本都从 byte 0 开始；冷门对象的
   开头可能已经在边缘缓存，而后续区间仍走慢速回源，因此会把“首段快、持续慢”的候选
   晋升为主 URL。
4. **中：JSON `bodyBytes` 表示绕过。** 运行时只对 gRPC 优先读取 `bodyBytes`。若
   Shadowrocket 以二进制视图提供 JSON 响应，JSON classifier 会收到空正文并安全透传，
   从而形成偶发漏滤。现在只做严格 UTF-8 解码；未知压缩、非法 UTF-8 和损坏数据仍原样放行。

这份日志中未出现 `/x/v2/view`、`View`、`ViewUnite`、`ViewProgress`、
`RelatesFeed`、`PlayPause` 或 `ViewEndPage`，因此**不能从本日志确认截图中的播放页广告
究竟由哪一个响应重新注入**。仓库保留并回归验证现有 JSON View、View v1、ViewUnite、
延迟关系卡、进度、暂停和结束页精确处理；没有为了截图而清空未知 Protobuf 字段。

日志只出现一个 `upos-sz-mirrorcosov.bilivideo.com` 媒体对象及并行音视频请求，且没有
捕获对应 playurl 响应处理记录。因此它能证明实际媒体线路，但不能证明当次 URL 是否由
CDN 脚本晋升，也不能单独量化卡顿原因。日志含临时签名、设备/账号标识和凭证字段，禁止
公开上传原文件。

## Mine：修改前后的重新注入链路

修改前：

```text
冷启动 / 后台恢复 / 登录态变化
  -> /x/v2/account/mine 新响应
  -> 请求 cache guard 已执行
  -> response handler 已执行
  -> 已知 vip_section_v2 / sections_v2 被过滤
  -> vip_section_right、rework_v1.worst_creative 或 iPad 数组未进入适配器
  -> App 用新响应重新渲染横幅或服务项
```

修改后：

```text
每一份 Mine / Mine iPad 响应独立处理
  -> strict JSON string 或 strict UTF-8 bodyBytes
  -> 精确删除 vip_section_right（仅会员营销开启）
  -> 精确删除 rework_v1.worst_creative（仅“隐藏首次投稿”开启）
  -> 只递归进入已知 phone/iPad UI 容器
  -> 稳定 ID -> 已验证精确 URI/action -> section -> 精确标题回退
  -> 宽泛旧 URI 兼容项必须同时命中精确目标标题，不得跨选项删除
  -> 保留 account、vip 状态、历史/收藏、未知模块、未知容器与原始顺序
  -> 写回 no-store 的过滤结果
```

公开 `AccountMine` 模型确认了 `vip_section_right`、`vip_section_v2`、
`rework_v1.worst_creative`、`ipad_sections`、`ipad_recommend_sections` 与
`ipad_more_sections`；公开 Mine 样例与过滤器还交叉确认了本轮补充的稳定服务 ID 和
`activity://main/preference` 设置动作。运行时代码为本仓库独立实现，没有复制上游实现。

## 播放页广告处理

保留以下精确路径：

- JSON `/x/v2/view`：顶层 CM/player/under-player 字段、已知 View UI 容器和普通 AV 白名单；
- View v1：顶层已确认商业字段与 `Relate.goto == "av"` 普通视频判据；
- ViewUnite：顶层 `cm(7)`，介绍模块 18/29/37/55/63，关系卡
  `cm(6)`、`cm_stock(11)`、`basic_info.unique_id` 及严格 AV oneof；
- `RelatesFeed`：每份延迟响应独立执行相同关系卡判据；
- `ViewProgress`：只处理已验证 VideoGuide/OperationCard 商业字段；
- `PlayPause`：只删除含明确商业证据的 length-delimited 字段；
- `ViewEndPage`：只过滤 `ViewEndPageCard.relate(1)` 中的广告或非普通 AV。

本轮没有新增宽泛主机、素材域拒绝或“整消息置空”。当前公开
BiliUniverse ADBlock 固定提交仍以 ViewUnite 顶层 `cm`、关系卡 `cm_stock`/
`unique_id` 和介绍模块 18/29/55 为主要已知入口，与本仓库现有精确处理一致。

## CDN：修改前后的连接、缓存、探测与切换

修改前：

```text
playurl -> 有 v6 缓存则应用
        -> 无缓存立即返回服务端 URL
        -> 主备各探测 bytes=0-1048575
        -> 2 分钟后仍探测 bytes=0-1048575
        -> 两次通过后晋升
        -> 复核仍只看文件开头
```

修改后：

```text
playurl -> v6 状态不迁移，按当前服务端 URL 重新学习 v7
        -> 有 v7 已验证缓存则立即应用
        -> 无缓存立即返回服务端原始 URL，不等待探测
        -> 第一次主备取相同 bytes=0-262143（总额外 512 KiB）
        -> 记录同一对象总长度，但不晋升
        -> 至少 2 分钟后主备取相同 1 MiB 文件内部区间
        -> 206 / Range / 总长 / 实长 / hash / 类型 / 编码 / 重定向全部一致
        -> 内部吞吐满足绝对下限、1.35x 表示余量与相对阈值
        -> 第二次成功后才供后续新 playurl 响应使用
        -> 8 分钟复核在 1/2、1/4、3/4 附近轮转内部区间
        -> 失败、403、慢速、对象不一致或不再更优则清除选择并回退服务端 URL
```

首个探索从 2 MiB 降至 512 KiB，额外探测流量下降 75%，同时第二次确认不再被边缘缓存的
文件前缀欺骗。主备仍使用同一 Range；短对象会安全裁剪到实际结尾。候选始终来自当前
响应的完整签名 URL，音频、视频、分段、清晰度、codec、representation、媒体对象、
alias lane、网络档案、候选集合和 CDN 家族继续隔离。直播 URL 永不改写。

## 修改文件与关键差异

- `src/bilibili-enhance.js`
  - 补充 Mine 9.5.0 精确字段、iPad 容器、稳定 ID/URI；
  - 修复 Mine 宽泛 URI 在独立开关之间的串扰；
  - 增加 JSON `bodyBytes` 严格 UTF-8 读取；
  - 保留未知结构 fail-open。
- `src/bilibili-cdn.js`
  - 状态升级 `safeAuto.v7`；
  - 首次 256 KiB、第二次/复核内部 1 MiB；
  - 记录总长度和轮转游标，诊断只记录 phase/Range/摘要。
- `test/bilibili-enhance.test.js`、`test/bilibili-cdn.test.js`、
  `test/module.test.js`
  - 新增对应回归和生成器约束。
- `README.md`、`CHANGELOG.md`、`docs/*`、`site/*`
  - 同步版本、安装/更新、算法、安全边界和网站说明。

## 保留功能与安全透传

以下现有功能保持不变：四个 splash、热搜/运营词、首页严格六条普通 AV、Story、搜索、
播放页普通 AV 推荐、暂停/结束页字段级过滤、直播购物、VIP materials/report、Mine 逐项
开关、PubModule、DeviceFeature 诊断、gzip/multi-frame gRPC、CDN fixed 安全路径、
音视频/表示隔离、签名保护、失败回退和 live no-op。

仍安全透传：

- 本日志没有出现的实际播放页广告响应及其中未知字段；
- `myinfo`、`DeviceFeature` 中没有 fixture 证明承载目标 UI 的未知 action；
- `Module/List`（仅诊断，不阻断资源更新）；
- 未知 JSON 容器、未知 Protobuf field/oneof、非法 UTF-8、未知压缩、截断或超限正文；
- 未经响应提供的 CDN 主机，以及任何跨对象、跨 alias、跨表示的 URL。

## 自动验证

- `node --check`：CDN 与 Enhance 源文件通过；
- `npm test`：107/107 通过；
- `npm run build:check` 与站点 ESLint 通过；
- 站点生产构建与 SSR/路由测试 4/4 通过（沙箱内 Vite 遇到 Windows `spawn EPERM`，
  在获准的沙箱外相同命令通过，属于执行环境限制而非代码失败）；
- 未声明本轮已完成真实 iPhone/Shadowrocket 验收。

新增回归包括：

- `vip_section_right`、`rework_v1.worst_creative`、phone/iPad section；
- 关闭开关时完整保留；账号/会员/未知字段保留；
- 默认首次投稿/有奖/能量规则不再误删创作、社区、设置或游戏入口；
- JSON `bodyBytes` 后台响应不能绕过过滤；
- 第一次两条 256 KiB，总计 512 KiB；
- 第二次相同非零内部 1 MiB；
- 前缀相同、内部 hash 不同拒绝晋升；
- 内部 Range 偏移/截断拒绝；
- 复核位置轮转；v6 状态不复用；
- 现有 9.5 View/ViewUnite/Progress/Pause/EndPage 回归继续通过。

## 真机验收

1. 在 Shadowrocket 更新 Enhanced 模块，确认版本与脚本 URL 均为 `3.7.0`；重新应用配置。
2. 完全退出 Bilibili，依次验证冷启动、热启动、后台 30 分钟恢复和网络切换。
3. Mine 页面确认大会员营销横幅、首次投稿及已选隐藏项不再恢复；会员身份、到期时间、
   历史、收藏、钱包/订单等未选择隐藏的功能正常。
4. 横屏、竖屏、冷门视频、稍后再看、追番各播放至少 10 分钟，切换清晰度并拖动进度；
   验证无 403、无声音、绿屏、无限缓冲或音画不同步。
5. 每个视频首次进入、暂停/恢复、后台恢复、结束/连播时检查播放器下方广告。
6. 若仍漏出，开启模块 `调试日志`，只复现一次并导出最短日志；分享前删除 Cookie、
   access_key、SESSDATA、buvid、完整 query、完整媒体 URL 和账号/设备 ID。

固定 raw/BiliFlow URL 用户无需重新订阅，只需更新模块。若使用本地 Release 附件副本，
需要重新下载安装最新附件。

## 回滚

1. 先把 `CDN=off`，保留 Enhanced，确认卡顿是否消失；
2. 如只需取消本轮 CDN 学习，修改一次 `重置令牌` 或回到 v3.6.0；
3. 关闭 `会员营销` 或对应 Mine 逐项开关可恢复目标 UI；
4. 从 GitHub Release 安装 v3.6.0 附件可完整回滚；
5. 停用模块可恢复 Bilibili 原始网络行为。
