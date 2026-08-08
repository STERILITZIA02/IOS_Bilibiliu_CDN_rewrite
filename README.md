# Bilibili Shadowrocket CDN 与界面增强

[![CI](https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/actions/workflows/ci.yml/badge.svg)](https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/actions/workflows/ci.yml)

面向 iPhone / iPad、iOS 26 / iOS 27 的 Bilibili Shadowrocket 项目。仓库提供
两个可以独立安装、在 Shadowrocket 内持续更新的版本：

| 版本 | 包含内容 | 适合谁 |
| --- | --- | --- |
| **CDN Switcher** | Bilibili 分流、JSON/gRPC 播放地址处理、安全 CDN 自动选择 | 只想改善链路，不改变 App 内容和界面 |
| **CDN + Enhanced** | CDN Switcher 的全部能力，以及首页六条普通视频流、搜索/播放页普通视频广告过滤、暂停/页面广告过滤、直播购物弹层清理、首页/“我的”逐项精简 | 希望清理广告、非普通视频推荐和不需要的服务入口 |

旧地址 `Bilibili.CDN.sgmodule` 会继续更新，并作为 **Enhanced 兼容别名**，
因此已经安装 v1/v2 的用户不会在更新后意外失去增强功能。

> [!IMPORTANT]
> 自动化测试不能替代真实 iPhone/iPad、Shadowrocket 与 Bilibili App
> 组合的真机验收。仓库会明确区分“代码测试通过”和“真机已验证”；发布前后的
> 检查矩阵见 [真机验收清单](docs/DEVICE_ACCEPTANCE.md)。
>
> v3.9.0 针对 Bilibili iOS 9.6.1 统一 endpoint registry、补齐首页商业 AV/大
> Banner 与闲鱼操作卡过滤，并上线 TTFB 优先的 hostAuto v10；证据、字段边界与
> 真机复测项见 [v3.9 审计](docs/V3_9_AUDIT.md)。v3.8.2 的魔力赏修复见
> [v3.8.2 审计](docs/V3_8_2_AUDIT.md)。v3.8.1 针对 App 缓存/预加载地址
> 早于新 PlayView 响应发出的竞态，增加了同一媒体对象的完整签名 URL 直达，见
> [v3.8.1 审计](docs/V3_8_1_AUDIT.md)。
> v3.8 的后台测速、Akamai 冷启动与 9.5.0 `/relate/story` 修复仍见
> [v3.8 审计](docs/V3_8_AUDIT.md)。

## 下载与直接安装

### CDN + Enhanced

- [一键安装 Enhanced][install-enhanced]
- [Enhanced 固定更新地址][raw-enhanced]
- [Enhanced 最新发行版][release-enhanced]

### 仅 CDN Switcher

- [一键安装 CDN-only][install-cdn]
- [CDN-only 固定更新地址][raw-cdn]
- [CDN-only 最新发行版][release-cdn]

### 校验与归档

- [最新发行版校验文件][latest-checksums]
- [全部 GitHub Releases][releases]
- [历史兼容更新地址][raw-compat]

[install-enhanced]: https://lowertop.github.io/Shadowrocket-First/redirect.html?url=shadowrocket%3A%2F%2Finstall%3Fmodule%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2FSTERILITZIA02%2FIOS_Bilibiliu_CDN_rewrite%2Fmain%2Fdist%2FBilibili.CDN.Enhanced.sgmodule
[install-cdn]: https://lowertop.github.io/Shadowrocket-First/redirect.html?url=shadowrocket%3A%2F%2Finstall%3Fmodule%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2FSTERILITZIA02%2FIOS_Bilibiliu_CDN_rewrite%2Fmain%2Fdist%2FBilibili.CDN.Switcher.sgmodule
[raw-enhanced]: https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/dist/Bilibili.CDN.Enhanced.sgmodule
[raw-cdn]: https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/dist/Bilibili.CDN.Switcher.sgmodule
[raw-compat]: https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/dist/Bilibili.CDN.sgmodule
[release-enhanced]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/latest/download/Bilibili.CDN.Enhanced.sgmodule
[release-cdn]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/latest/download/Bilibili.CDN.Switcher.sgmodule
[latest-checksums]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/latest/download/SHA256SUMS.txt
[releases]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases

推荐安装 `raw.githubusercontent.com/.../main/dist/...` 固定地址。之后可在
`Shadowrocket → 配置 → 模块 → 更新模块` 获取新版本。发行版适合归档和
SHA-256 校验，但不会像 `main` 固定地址一样实时跟随仓库。

## 网站定制器

仓库的 [`site/`](site/) 是同一项目的一部分，不是割裂的演示工程。它会：

- [打开已公开的 BiliFlow 在线定制器](https://biliflow-shadowrocket.strelitziaxx.chatgpt.site/)；
- 从本仓库 `main` 分支读取经过验证的最新选项目录；
- 提供首页推荐“仅 6 个普通视频”等独立过滤开关；
- 显示首页、“我的服务”和“更多服务”中当前显示/隐藏的可配置项；
- 允许逐项开关，再生成带完整参数的稳定模块 URL；
- 每次 Shadowrocket 更新该 URL 时，优先取得仓库最新模块并保留选择；
- 只访问两个固定模块源，不接受用户提供的远程脚本地址；
- 拒绝未知参数、重复参数、越界数字、换行/配置注入和不安全主机。

网站不需要账号、数据库、Cookie、分析脚本，也不收集 Bilibili 或
Shadowrocket 数据。GitHub 暂时不可用时，生成接口只使用与站点部署来自同一
已验证提交的目录和模块快照；在线目录与模块不一致、参数漂移或任一快照结构
校验失败时仍会失败关闭，不会下发未知脚本。

## 首次启用

1. 安装两个版本中的一个，并在模块列表中启用。
2. 把 Shadowrocket 首页的“全局路由”设为 **配置**。国内和海外都选“配置”，
   不是“场景”。
3. 打开当前配置的 `ⓘ → HTTPS 解密`，生成 Shadowrocket CA。
4. 按 iOS 提示安装描述文件，然后进入
   `设置 → 通用 → 关于本机 → 证书信任设置`，完全信任该 CA。
5. 回到 Shadowrocket，确认 HTTPS 解密已开启，重新应用当前配置。
6. 完全退出 Bilibili App 后重新打开，依次测试首页、普通视频、番剧、评论和直播。

CDN-only 只会把以下播放 API 主机加入 MITM：

```text
api.bilibili.com
app.bilibili.com
interface.bilibili.com
api.biliapi.net
app.biliapi.net
grpc.bilibili.com
grpc.biliapi.net
```

Enhanced 还会加入 `api.live.bilibili.com`、
`line3-h5-mobile-api.biligame.com`、`api.vc.bilibili.com` 与
`manga.bilibili.com`，分别用于处理直播间明确的活动/购物卡片、内嵌游戏推广、
旧搜索运营词和漫画闪屏专用接口。每个脚本 matcher 都限定到已审核的精确路径；
点播和直播媒体 CDN 不会加入 MITM。HTTPS 解密页面
中的 `google.cn`、`googlevideo.com` 等主机来自其他模块或原配置，不是本项目
添加的范围。

只需要域名分流、不需要任何响应脚本时，可以不启用 HTTPS 解密；此时 `[Rule]`
仍工作，但 CDN、广告和界面响应处理不会生效。

## 国内与海外分流

“全局路由”一律选 **配置**。“场景”只是 Shadowrocket 的可选自动化入口，并不是
本模块在国内使用的前提。

| 使用位置 | `分流策略` 建议 | 说明 |
| --- | --- | --- |
| 中国大陆 | `DIRECT` | Bilibili API、视频和直播直连 |
| 海外且有中国大陆回国策略组 | 填写该策略组的准确名称 | 普通新加坡/香港代理不等同于大陆回国线路 |
| 海外且没有回国线路 | 先用 `DIRECT` 做基线 | 本项目不会绕过地区版权或账号授权 |

如果 `分流策略` 不是 `DIRECT`，同时又不想阻断 PCDN，请把 `PCDN策略` 设置为
同一个策略组。PCDN 窄规则位于通用 Bilibili 规则之前。

## Enhanced 功能与逐项开关

### 核心增强

| 参数 | 默认 | 行为 |
| --- | --- | --- |
| `广告过滤` | `true` | 过滤明确广告字段、魔力赏等已审核营销角标，以及播放进度、暂停页、结束页和专用素材接口重新下发的运营容器 |
| `首页推荐6个普通视频` | `true` | 在`广告过滤`开启时，每次首页/推荐响应只保留按原顺序出现的前 6 个明确普通 AV；同时清理横幅、广告、小游戏/应用、纪录片、影视、综艺、直播、活动和未知卡片 |
| `推荐仅普通视频` | `true` | 在`广告过滤`开启时，播放页推荐只保留明确普通 AV；移除番剧、综艺、纪录片、影视、直播、游戏、课程、活动、广告、必火推荐及未知类型卡片 |
| `界面精简` | `true` | 启用下面的首页/“我的”逐项设置 |
| `搜索推广` | `true` | 隐藏明确的搜索运营推广词 |
| `直播带货` | `true` | 隐藏直播间明确购物卡片、业务编号 33 的购物标签及已验证商业弹层 |
| `会员营销` | `true` | 隐藏“我的”页与大会员中心营销横幅/弹层，不改会员数据 |

`首页推荐6个普通视频=true` 对每一份新的 `/x/v2/feed/index` 响应独立执行，
不会只清理首次结果：卡片必须同时有 `goto/card_goto=av|video`，以及
正数 AVID、合法 BVID、正数 CID 和合法 `/video/` URI 的完整普通视频身份。
JSON 卡片还必须属于当前已验证的普通 AV 卡型
`small_cover_v2`、`large_cover_single_v9` 或 `large_cover_v1`。如果第一份响应
不足 6 个，Enhanced 最多使用原始完整请求 URL 和原请求身份做 **1 次** 2.2 秒
有界、禁止条件缓存的补取；补取响应再次经过同一白名单，按 AV 身份去重，只补到
6 个为止。补取失败或仍不足时保留已经过滤的实际数量，不伪造、不复用旧卡片，也
不递归请求。普通视频标题即使含“广告”“纪录片”或“魔力赏”也不会仅凭标题误删；
只有协议分类、营销字段或商业动作明确命中才删除。

`推荐仅普通视频=true` 是播放页推荐列表的有意严格边界：JSON 必须有
`goto/card_goto/type=av|video`、普通视频 `player_args` 或 `/video/` 地址，只有
AVID/BVID 而没有类型证据的卡片不会放行；旧版 View gRPC 只保留同时具有
`goto=av` 与 aid/param/video URI 身份的卡；
ViewUnite 必须同时是关系卡类型 `1 (AV)` 且实际 oneof 为 `av(2)`。类型伪装、
字段缺失或载荷为纪录片/番剧、资源、游戏、CM、直播、AI、特殊内容的卡片会删除，
未知非目标字段仍按原始 wire bytes 保留。关闭该开关可恢复合法非视频推荐，但
`广告过滤=true` 时明确 CM、广告/游戏/课程推广、活动横幅、大会员横幅和 UP 主
商品分享模块仍会清理。

播放页 gRPC 脚本优先读取 Shadowrocket 的 `bodyBytes`，逐帧处理未压缩或 gzip
消息，并在 WebView 引擎内设置 4 MiB 解压上限；因此播放器下广告和关系卡会在
第一次渲染前完成过滤。损坏帧、未知压缩格式、未知 schema、超限响应或解压能力
不可用时整份响应原样放行，避免破坏播放。

针对 Bilibili iOS 9.4.0 与 9.5.0（9.5.0 请求构建号 `90500100`），App 从后台
恢复或暂停时可能重新请求 `ViewProgress`、`PlayPause` 与 `ViewEndPage`。
Enhanced 不再清空整个 `video_guide` 或 `dm`：它只进入已验证的
`VideoGuide.material(1)` / 兼容 `right_material(4)`，删除活动类型或具有明确
商业证据的素材；`mall-magic-c` 魔力赏链接属于明确商业证据。在 ViewUnite 的
`DmResource.cards(3)` 中只删除已验证的预约活动、跳转和预约游戏运营卡。普通弹幕、
关注卡、关注视频/追番卡、进度点、合约卡、
Chronos、视频快照、播放地址和未知 wire bytes 均保留。`PlayPause` 同样只删除有商业证据的
length-delimited 字段；`ViewEndPage` 按
`ViewEndPageCard.relate(1)` 执行普通 AV/广告判据。无法识别 schema 时记录
no-op 并原样放行。

搜索结果广告由 `广告过滤=true` 控制，独立于只负责运营搜索词的
`搜索推广`。JSON `/x/v2/search`、`/x/v2/search/type` 与 gRPC
`SearchAll`/`SearchByType` 会删除明确 `cm`、游戏、购买、横幅、top-game
商业 oneof，以及普通 AV 外壳内的 `CardBusinessBadge`；普通视频、用户和未知
schema 原样保留。精确的 gRPC `Search/DefaultWords` 和旧版
`api.vc.bilibili.com/.../Search/recommend_words` 会在两个相关开关均开启时返回
合法空结果。字段缺失或无法确认商业语义时不依据标题猜测。漫画
`Comic/Flash` 与 `Comic/ListFlash` 是独立的专用闪屏接口，只在
`广告过滤=true` 时返回空对象。

`/x/v2/feed/index/story`、其 `/cart` 异步购物响应与 9.5.0 新增的
`/x/v2/feed/index/relate/story` 使用同一个
“先过滤、后处理 CDN”的响应脚本，避免多个脚本分别写回同一响应。严格 Story
模式只保留具有真实视频身份、状态可用且无商业角标的 `vertical_av`；同一响应
里的媒体 URL 仍只允许使用当前对象自己的服务端主/备候选。

首页/推荐页和“我的”页的易变请求另有精确请求侧缓存保护：只对四个 splash
接口、`/x/v2/feed/index`、`/x/v2/feed/index/story(/cart)`、
`/x/v2/feed/index/relate/story`、`/x/v2/view`、
`/x/v2/account/mine(/ipad)`、`/x/v2/account/myinfo`、搜索运营词、漫画闪屏以及
两个 VIP 广告素材/上报接口移除条件缓存校验头，并设置 `no-cache, no-store`；响应侧在
feed/story、mine、view、splash 与 VIP 素材/上报等实际过滤接口成功分类后，也会
移除 ETag/Last-Modified/Content-Length 等缓存元数据并返回 `no-store`，避免
过滤后的页面被旧响应覆盖。`myinfo` 仍只诊断、不改正文或响应头。不修改原始 URL、
查询参数、请求体或签名。后台恢复后得到的新响应会再次经过同一过滤器。
异步 `Mine/PubModule` 只删除发布引导 `PubGuide`，保留 UGC、动态及未知卡；
`Popular/Index` 备用推荐流同样只保留最多 6 个有明确视频身份的普通 AV。

大会员中心只处理营销 `banners`/已审核横幅列表变体和具有高置信营销标记的弹层；
“我的”页还会删除协议中明确用于会员营销的 `vip_section`、`vip_section_v2`、
`modular_vip_section`，并对 `/x/vip/ads/materials` 返回经核对的空素材成功
结构；`/x/vip/ads/material/report` 单独返回无副作用的成功上报结构。以下内容属于
保护边界：真实会员状态、到期时间、会员标签、钱包、订单、付款渠道、权益列表和
未知账号字段。每份新的“我的”响应都会独立过滤，因此切后台后服务端重新下发也
不会依赖上一次响应的本地状态。

### 默认隐藏

- 首页右上角“游戏中心”、“新征程”频道；
- 底部“发布（＋）”、“会员购”；
- “发布你的第一个视频”、“有奖发布”、“我的课程”、“看视频免流量”；
- “工房”、“能量加油站”、“BW 乐园”、“B萌投票”。

### 默认显示，可单独隐藏

- 个性装扮、我的钱包、游戏中心、会员购订单、我的直播、必火推广；
- 创作中心、社区中心；
- 联系客服、听视频、未成年人守护、设置。

头像、搜索、消息/红点、首页、关注、“我的”和未知新**导航入口**始终不作为清理
目标。只有首页/推荐视频流与播放页关系卡采用各自明确开关控制的普通 AV 白名单；
其他页面不会用静态白名单覆盖服务器返回结果。

## CDN 与网络参数

两个版本共享以下参数：

| 参数 | 默认 | 作用 |
| --- | --- | --- |
| `CDN` | `auto` | 安全自动模式；也可填固定媒体主机或 `off` |
| `分流策略` | `DIRECT` | `DIRECT`、`PROXY` 或现有策略组名称 |
| `PCDN策略` | `DIRECT` | 只匹配 `*pcdn*.biliapi.net`；设为 `REJECT` 才阻断 |
| `网络档案` | `auto` | 手动命名不同网络缓存，如 `home_wifi`、`cellular` |
| `测速方式` | `cron` | 默认独立后台匿名测速；旧 `nonblocking` 映射为 `cron`；`blocking` 仅诊断；`off` 停止后台测速 |
| `重置令牌` | `none` | 改成新的安全字符串时清空一次 CDN 学习状态 |
| `测速间隔` | `2` | 后台 cron 每两小时唤醒，达到设置的 2–72 小时间隔后才实际测速 |
| `切换阈值` | `20` | 当前线路健康时，挑战者综合分至少领先该百分比才切换；当前线路不健康时立即回退/切换 |
| `调试日志` | `false` | 排错时临时开启；不输出完整 URL、签名或正文 |

`网络档案=auto` 会在 Shadowrocket 暴露网络信息时区分 Wi‑Fi、蜂窝与未知网络；
稳定网络名只以 16 位 hash 保存。运行时没有此能力时回落共享 `auto`，也可手动填写
`home_wifi`、`cellular` 等档案名。

### v10 启动优先选择 + v9 缓存媒体直达

`CDN=auto` 把测速彻底移出播放响应热路径。打开视频、跳着看、切倍速、切清晰度或
从后台恢复时，脚本只同步读取 `$persistentStore` 并重排 URL，调用 Range probe 的
次数恒为零：

1. Shadowrocket cron 每两小时唤醒；脚本按“测速间隔”决定是否真正运行。它轮换三个
   公共、未登录样本，不读取 App Cookie、`access_key`、`buvid`、设备 ID 或用户日志；
2. 第一阶段对完整参考 URL、当前选择、pending、完整 Akamai 和轮换挑战者逐个执行
   64 KiB Range，校验前缀内容并记录启动 TTFB/短段吞吐；第二阶段只让参考与第一
   阶段最优的两个挑战者在 1/4、1/2、3/4 位置轮换同一个 1 MiB 内部 Range；候选
   串行执行，每请求硬截止 5 秒，整轮不超过 Shadowrocket 45 秒预算；
3. 候选必须同时满足 `206`、Range 起止、总长、实长、内容 hash、类型、无压缩及
   无跨对象重定向；HTML/JSON 错误页直接失败；
4. audio、normal-video、high-bitrate-video 各自最多保存 8 个摘要和 4 个对象 hash。
   候选至少通过两个不同对象、最近 6 小时成功、失败率不高于 25%、抖动比不高于
   0.65、未熔断，并同时满足当前表示的 64 KiB 与 1 MiB 吞吐余量；
5. 先判定能否满足当前表示带宽，再按启动 TTFB、短段吞吐、持续吞吐、失败率和抖动
   评分。健康当前线路只有在挑战者领先“切换阈值”时才切换；当前线路失效则立即切换。
   连续两次失败或最近四次中两次失败会熔断两小时；
6. 无新鲜合格状态时，如果当前响应带服务端完整 Akamai 备用 URL，会立即把它提升为
   主 URL，并把原主 URL 放在备选首位；这直接绕开日志中 cosov 内部卡住约 2 秒后
   才尝试 Akamai 的等待；
7. Akamai 永远只使用服务端返回的完整签名 URL，绝不裸换 hostname。维护列表内的
   非 Akamai alias 只有通过两个不同对象验证后，才可从当前主 URL复制并仅替换主机名；
   scheme、port、path 和 query 保持不变；
8. v10 键为 `BiliCDN.hostAuto.v10`，最多 4 个网络档案、每档 16 主机。持久化只含
   主机名、对象 hash、统计和时间戳，不含完整 URL、path、query、token 或正文；
9. alias 6 小时后失效，状态 24 小时后只按冷启动规则处理。v8 主机状态不迁移；
   旧 `nonblocking` 参数会映射为 `cron`，不再依赖 `$done()` 后回调。

日志还证明 App 有时会先用缓存/预加载的旧 PlayView 地址发起媒体请求，然后新
PlayView 响应才到达。v9 为这条竞态增加一条不测速的请求侧直达路径：响应脚本在
`$done()` 前，把当前媒体对象实际选中的**完整服务端 URL**写入
`BiliCDN.mediaRoutes.v9`；轻量 `http-request` 脚本只拦截点播 `/upgcxcode/` 的
GET/HEAD，用 path、`deadline/exp`、`trid`、`mid`、`oi`、`buvid` 和表示档案核对
同一对象后，逐字节使用该目标 URL。它不拼接 hostname、不合成签名，不改 Range、
User-Agent 或请求体，也不需要对媒体 CDN 开启 MITM。

v9 状态最多 64 条，并在签名到期前至少 30 秒失效，单条最长保留 2 小时。状态缺失、
损坏、过期、对象或档案不一致时原地址直接放行；下一份新播放响应会重新填充。

首次安装无需等待学习：有完整 Akamai 备用时即刻使用稳定冷启动回退。后台 cron 在至少
两个不同匿名对象上验证出更优且稳定的非 Akamai 主机后，后续新视频才会使用它。
`测速方式=off` 停止 cron 学习但保留完整 Akamai 回退；`CDN=off` 才完全停止 CDN 改写。

Akamai 不是统一“失效”或统一“最快”。它只会在 Bilibili 本次响应已经提供
`upos-hz-mirrorakam.akamaized.net` 的完整签名备用 URL 时参与验证；把其他 CDN
的签名 URL 直接换成 Akamai 会失败，因此安全自动模式和固定模式都不会盲拼 host。

固定主机模式只接受 Bilibili 自有媒体域或仓库明确审核的固定候选，并且只会在
**当前同一媒体对象、同一 alias lane 已经返回的完整主/备用 URL** 中提升目标
host；目标不存在时安全 no-op，不再拼接新 host。共享 CDN 服务商上的任意未审核
子域和普通第三方主机都会被拒绝，避免把签名播放地址泄露给非目标服务器。参考候选见
[`config/cdn-candidates.json`](config/cdn-candidates.json)。直播签名 URL
永远不做固定 CDN 替换，只按规则分流。

## PCDN 边界

模块只提供：

```text
DOMAIN-WILDCARD,*pcdn*.biliapi.net,{{{PCDN策略}}}
```

默认 `DIRECT` 与默认分流等效。项目不会加入宽泛 IP/CIDR、整个
`mcdn.bilivideo.cn` 拒绝或 `DOMAIN-KEYWORD,bilibili` 拒绝，因为这些做法可能
破坏点播、直播、登录和其他正常请求。

## 更新、回滚与排错

更新：

1. `配置 → 模块 → 更新模块`；
2. 打开一次“编辑参数”，确认出现 `首页推荐6个普通视频` 且保持开启；
3. 重新应用配置；
4. 完全退出并重开 Bilibili App。

从 `3.0.1` 起，模块中的规则集和脚本 URL 都带当前版本键。更新模块后
Shadowrocket 会取得新的远程资源地址，不会继续复用上一版同名脚本缓存。

如果原先安装的是 README 的固定 `main/dist/*.sgmodule` 地址、历史兼容地址或
BiliFlow 生成的固定 URL，升级到 3.9.0 **不需要重新订阅**，只需执行上述“更新
模块”。更新后模块详情应显示 `3.9.0`，脚本 URL 应含 `?v=3.9.0`。只有把 Release
附件下载成本地文件、或使用不带远程 URL 的旧副本时，才需要重新安装固定地址。

按影响最小顺序回滚：

1. `CDN=off`，保留分流和 Enhanced；
2. 关闭 `广告过滤`、`首页推荐6个普通视频`、`推荐仅普通视频`、`界面精简`、
   `搜索推广`、`直播带货`、`会员营销`；
3. 把 `PCDN策略` 改回与 `分流策略` 相同；
4. 换成 CDN-only；
5. 停用模块，恢复 Bilibili 原始网络行为。

完全无效果时，优先检查：

- 首页“全局路由”是否为 **配置**；
- 当前配置是否真正包含并启用了模块；
- HTTPS 解密、CA 安装和完全信任是否完成；
- 是否有其他模块同时改写相同 Bilibili API；
- 更新后是否重新应用配置并完全重启 App。

视频无法播放时，先设 `CDN=off`，再把 `PCDN策略` 恢复为与分流相同；海外用户还应
确认所选策略确实是可用的大陆回国线路。

提交广告/UI 残留 Issue 时，请提供 App 版本、脱敏接口 URL、入口名称和最小响应
结构。不要公开 Cookie、`access_key`、`SESSDATA`、设备标识或完整签名 URL。

## 隐私、安全与功能边界

- 不伪造登录、会员、订单、支付、课程/番剧购买结果；
- 不绕过地区版权、收费内容、账号授权或服务端鉴权；
- 不上传 Cookie、token、响应正文或完整媒体签名；v9 只在本机短期保存当前响应
  实际选中的完整媒体 URL，并按对象绑定、签名到期和 64 条容量清理；
- 不对媒体 CDN 做 MITM，不处理媒体分片响应体；
- 不访问第三方测速/分析服务；cron 只访问匿名 Bilibili 播放 API 与维护列表中的
  Bilibili 媒体主机，Akamai 仅使用服务端完整 URL；
- 未知 JSON、损坏 Protobuf、未知/损坏压缩 gRPC、存储或网络异常全部故障开放；
- 已审核 Bilibili gRPC 的 gzip 帧只在 4 MiB 解压上限内处理，修改后按标准
  未压缩帧重新封装；
- 网站生成器固定源、严格校验、无数据库、无登录、无分析与无用户数据上报。

HTTPS 解密会让 Shadowrocket 在设备本地读取列出的 Bilibili API 明文响应。只安装
自己信任的模块与 CA，不要分享导出的私有证书；同时遵守所在地法律、Bilibili
服务条款和内容版权限制。

## 开发与验证

需要 Node.js 22 或更高版本：

```bash
npm run build
npm run check
npm --prefix site ci --ignore-scripts --no-audit --no-fund
npm run check:all
npm run smoke:auto
npm run benchmark:cdn
```

- `npm run check` 验证确定性生成物，并覆盖 JSON、gRPC/Protobuf、首次响应
  `bodyBytes`/gzip、9.6.1 首页/操作卡、暂停/结束页、后台恢复缓存保护、首页/播放页普通视频
  白名单、逐项开关、双模块、两阶段 Range、v10 评分、v9 请求直达、签名/对象隔离、阈值、锁、
  退避、容量和故障开放。
- `npm run check:all` 在上述核心检查后继续执行网站 lint、生产构建和路由安全测试；
  CI 与 Release 均使用该命令。
- `npm run smoke:auto` 是可选联网冒烟，只探测公共播放响应中的主/备用 URL。
- 网站测试执行生产构建、SSR、双版本生成、固定远程源和注入拒绝测试。
- CI 不依赖实时 Bilibili；实时探测不会作为合并门禁。

生成物：

- `dist/Bilibili.CDN.Switcher.sgmodule`：CDN-only；
- `dist/Bilibili.CDN.Enhanced.sgmodule`：CDN + 广告/UI；
- `dist/Bilibili.CDN.sgmodule`：Enhanced 历史兼容别名；
- `dist/Bilibili.list`：可独立使用的分流规则；
- `dist/bilibili-cdn.js`、`dist/bilibili-cdn-route.js`、`dist/bilibili-enhance.js`、
  `dist/bilibili-refresh.js`：播放地址、响应增强和易变页面请求缓存保护脚本；
- `dist/module-options.json`：模块与网站共用的选项目录；
- `dist/modules.list`：三个持续更新模块 URL 的版本化发行清单；
- `dist/SHA256SUMS.txt`：发行资产 SHA-256。

设计、数据流和失败边界见
[v3 架构说明](docs/V3_ARCHITECTURE.md) 与
[Protobuf 兼容说明](docs/PROTOBUF_COMPATIBILITY.md)；本轮 9.6.1 根因和字段边界见
[v3.9 审计](docs/V3_9_AUDIT.md)。

## 验收状态

自动化覆盖范围、真机待确认项和记录模板见
[docs/DEVICE_ACCEPTANCE.md](docs/DEVICE_ACCEPTANCE.md)。没有完成真实设备矩阵时，
不应把“测试通过”表述为“所有 iOS/Bilibili 组合 100% 验证”。

## 参考与许可

实现为本仓库独立代码。上游只用于核对公开端点、字段语义、模块语法和兼容风险；
来源、固定提交和许可证见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与
[上游调研基线](docs/UPSTREAM_RESEARCH.md)。

项目以 [MIT License](LICENSE) 发布。
