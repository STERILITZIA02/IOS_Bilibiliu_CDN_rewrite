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
> **v3.13.0 播放稳定性修复**：针对国际版默认 CDN 下反复加载、快进花屏和音画
> 不同步的反馈，取消媒体请求重定向、自动拼接主机与无测速的 Akamai 提升。
> 只在播放信息中提升同一媒体路径的完整服务端候选；保留播放器重试、Range、
> 音视频索引与时间线。后台加入原主线路比较、独立音频样本、有上限的初期学习
> 和播放信息请求后的三分钟测速暂停。详见 [v3.13 审计](docs/V3_13_AUDIT.md)。
> 用户已反馈“关闭旧模块后花屏/不同步消失”；新版修复尚需同设备复测。
>
> v3.12.0 面向 iOS **9.11.0 / 海外版 6.5.0**（App Store `id1517062289`）：
> 首页默认不再等待补齐，新增可选“首页补齐6条”；CDN 用持续吞吐判断带宽是否足够，
> 避免高延迟小包测速误淘汰海外节点，并修复冷启动绕过熔断、缓存旧目标与测速参考
> 节点故障问题。新增番剧频道商业横幅过滤，6.x 语义版本 UA 不再套用旧白版状态头
> 删除逻辑。公开资料、合成回归和本机匿名 Range 测速已核对；两个版本的实际 UA、
> 未公开接口及真机缓冲效果仍待验证。见 [v3.12 审计与方案比较](docs/V3_12_AUDIT.md)
> 和 [9.11.0 / 6.5.0 抓包指南](docs/BILIBILI_9_11_CAPTURE.md)。
>
> v3.10.1 处理 9.8.0 仍会出现的播放器下 Banner、倒计时提示和延迟底部广告弹窗：
> Enhanced 在同一 CDN gRPC 流水线内删除公开协议确认的 PlayerUnite
> `ViewInfo.dialog_map/prompt_bar/toasts`，并过滤携带明确广告、小程序或游戏元数据的
> `ViewProgress CommandDm`。首页 fallback 也不再放回小游戏、直播或全广告响应。
> 详情与证据边界见 [v3.10.1 审计](docs/V3_10_1_AUDIT.md)。
>
> v3.10.0 针对 Bilibili iOS 9.8.0 增加 `View/AIRelateAsync` 异步相关推荐
> 过滤，阻止主 View 已过滤后由延迟/恢复请求重新注入 `cm`、商品、游戏、直播和
> 非普通视频卡；同时补齐公开 schema 已确认的 View、ViewUnite、评论置顶运营卡、
> 动态直播推荐与直播首页商业容器。所有新 endpoint 都进入同一 request guard 与
> no-store 流程。证据边界与真机抓包项见 [v3.10 审计](docs/V3_10_AUDIT.md) 和
> [9.8.0 抓包指南](docs/BILIBILI_9_8_CAPTURE.md)。
>
> v3.9.4 修复首页普通 AV 外壳的魔力赏/原生广告卡：JSON 仅检查角标、封面 badge
> 与推荐理由等展示字段，gRPC `Popular/Index` 仅检查公开 `bilibili.app.card.v1`
> 中已确认的小/大封面展示字段；两级首页 fallback 也不会放回这些卡。普通标题中的
> “广告/魔力赏”仍不参与判定，详见 [v3.9.4 审计](docs/V3_9_4_AUDIT.md)。
>
> v3.9.3 修复播放器下新的原生兴趣广告卡：仅在已审核的卡片展示容器中识别
> 独立“广告 · 兴趣人数”标签，并删除整卡及其布局占位；同一有界证据也用于
> 已确认的 `ViewProgress VideoGuide.Material.text(2)`。普通标题中的“广告/闲鱼/
> 推广/商品”仍不参与判定。证据边界与冷启动/恢复态回归见
> [v3.9.3 审计](docs/V3_9_3_AUDIT.md)。
>
> v3.9.2 为 Bilibili iOS 9.7.0 增加搜索创作推广、首页原生广告、播放器下闲鱼
> 横幅、相关推荐会员购商品卡的有界结构过滤，并强化恢复态缓存与脱敏诊断。现有
> 证据不含 9.7.0 原始抓包，因此没有猜测新 endpoint 或 protobuf field；确认项、
> 自动测试边界与待抓包项见 [v3.9.2 审计](docs/V3_9_2_AUDIT.md) 和
> [9.7.0 抓包指南](docs/BILIBILI_9_7_CAPTURE.md)。v3.9.1 的首页非空修复见
> [v3.9.1 审计](docs/V3_9_1_AUDIT.md)。v3.9.0 的 endpoint registry、商业
> AV/大 Banner、闲鱼操作卡与 TTFB 优先 hostAuto v10 见
> [v3.9 审计](docs/V3_9_AUDIT.md)。v3.8.2 的魔力赏修复见
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
| `广告过滤` | `true` | 过滤明确广告字段、创作推广/魔力赏等已审核营销结构、播放器下商业横幅和商品关系卡，以及播放进度、暂停页、结束页和专用素材接口重新下发的运营容器 |
| `首页推荐6个普通视频` | `true` | 在`广告过滤`开启时，每次首页/推荐响应只保留按原顺序出现的前 6 个明确普通 AV；同时清理横幅、广告、小游戏/应用、纪录片、影视、综艺、直播、活动和未知卡片 |
| `首页补齐6条` | `false` | 默认立即显示已有普通视频；开启后，首页不足 6 条时最多额外补取一次，可能增加约 2.45 秒等待 |
| `推荐仅普通视频` | `true` | 在`广告过滤`开启时，播放页推荐只保留明确普通 AV；移除番剧、综艺、纪录片、影视、直播、游戏、课程、活动、广告、会员购商品、必火推荐及未知类型卡片 |
| `界面精简` | `true` | 启用下面的首页/“我的”逐项设置 |
| `搜索推广` | `true` | 隐藏明确的搜索运营推广词 |
| `直播带货` | `true` | 隐藏直播间明确购物卡片、业务编号 33 的购物标签及已验证商业弹层 |
| `会员营销` | `true` | 隐藏“我的”页与大会员中心营销横幅/弹层，不改会员数据 |

`首页推荐6个普通视频=true` 对每一份新的 `/x/v2/feed/index` 响应独立执行，
不会只清理首次结果。判定顺序是先删除明确商业与非普通视频卡，再确认
`goto/card_goto/type`、`player_args` 或已知普通卡型给出的 AV/video 类型；AVID、
BVID、数字/BVID `param`、受支持 `/video/` URI 或嵌套播放器身份任一强证据即可，
CID 只作 fallback 辅助。已知卡型是正向证据而非硬白名单，未知新卡型只要有明确
AV 类型和视频身份也会保留。默认立即返回已有 1–6 条普通视频，不产生补取请求。
设置 `首页补齐6条=true` 后，第一份结果为 1–5 条时，Enhanced 最多使用原始完整
GET 请求 URL 和原请求身份补取 **1 次**；超时保护为 2.45 秒。补取响应经过相同
判定，并按 AVID/BVID/`param`/视频 URI 规范化去重。若严格过滤会把服务端非空
响应变空，则依次启用“字段不完整但明显是 AV”和“中性未知卡”两级 fallback；
两层都不会放回明确商业、直播、游戏或活动。只有全广告/全非视频页才记录
`feed-all-commercial-blocked`，仅在补取开关开启时重试一次，失败保持空而不恢复广告；服务端原本为空时不补取。
普通视频不足 6 条且补取失败时保留首份结果，不伪造、不复用旧卡片，也不递归请求。普通视频标题即使含“广告”、
“闲鱼”“魔力赏”或“推广”也不会仅凭标题误删。

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
消息；即时脚本使用 JSC 与构建时打包的 gzip 解码器，不依赖 WebView、浏览器流式
API 或下载外部脚本。逐帧串行解压，合计输出最多 4 MiB，并核对 gzip CRC32/长度。
损坏帧、未知压缩格式、未知 schema 或超限响应时整份原样放行并输出有界诊断。

动态 `DynAll/DynVideo` 与个人分页不套用首页六条白名单：仅清理明确广告卡、
广告推荐模块及商品附加卡，保留普通 UP 视频、文字、投票、计数和分页游标。
UP 主分享好物在主 View 和 `AIRelateAsync` 使用相同的模块类型 55 判据；
`DmView` 的商业 CommandDm 与活动元数据一并清理，不匹配普通分段弹幕接口。

海外新版不能仅凭商店名称等同于旧白版：响应头按 moss engine 与已确认的
`bili-inter` 例外处理，保留真实 RPC 错误和 HTTP/2 trailers，不伪造刷新成功。

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
`搜索推广`。JSON `/x/v2/search`、`/x/v2/search/type` 会在固定的
`items/item/result/list/cards/sections/pages` 等搜索容器内有界遍历，删除明确
商业卡的整个父项，因此与创作推广主体绑定的 recommendation/action/download CTA
不会留下孤立操作条；普通标题、简介或评论中的“推广”“下载”等文字不参与判定。
gRPC
`SearchAll`/`SearchByType` 会删除明确 `cm`、游戏、购买、横幅、top-game
商业 oneof，以及普通 AV 外壳内的 `CardBusinessBadge`；普通视频、用户和未知
schema 原样保留。精确的 gRPC `Search/DefaultWords` 和旧版
`api.vc.bilibili.com/.../Search/recommend_words` 会在两个相关开关均开启时返回
合法空结果。字段缺失或无法确认商业语义时不依据标题猜测。漫画
`Comic/Flash` 与 `Comic/ListFlash` 是独立的专用闪屏接口，只在
`广告过滤=true` 时返回空对象。

`/pgc/page/channel` 在 `data.modules[]` 的 `BANNER.module_data.items` 中删除
明确广告、商业链接和 `www.bilibili.com/blackboard/era/` 运营横幅；过滤后为空的
横幅模块一并移除。普通番剧推荐、剧集、字幕说明 TIP 与分页字段保留。所有已匹配
JSON API 的非零 `code` 响应保持原正文，不把登录或业务错误改写成空成功页面。

`/x/v2/feed/index/story`、其 `/cart` 异步购物响应与 9.5.0 新增的
`/x/v2/feed/index/relate/story` 使用同一个
“先过滤、后处理 CDN”的响应脚本，避免多个脚本分别写回同一响应。严格 Story
模式只保留具有真实视频身份、状态可用且无商业角标的 `vertical_av`；同一响应
里的媒体 URL 仍只允许使用当前对象自己的服务端主/备候选。

首页/推荐页和“我的”页的易变请求另有精确请求侧缓存保护：只对四个 splash
接口、`/x/v2/feed/index`、`/x/v2/feed/index/story(/cart)`、
`/x/v2/feed/index/relate/story`、`/x/v2/view`、
`/x/v2/account/mine(/ipad)`、`/x/v2/account/myinfo`、搜索运营词、漫画闪屏以及
两个 VIP 广告素材/上报接口移除条件缓存校验头，并设置
`no-cache, no-store, max-age=0`；响应侧在
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
| `测速间隔` | `2` | 稳定学习后的 2–72 小时间隔；cron 每十分钟检查，首次最多六轮加快学习，近期播放会延后 |
| `切换阈值` | `20` | 当前线路健康时，挑战者综合分至少领先该百分比才切换；当前线路不健康时立即回退/切换 |
| `调试日志` | `false` | 排错时临时开启；不输出完整 URL、签名或正文 |

`网络档案=auto` 会在 Shadowrocket 暴露网络信息时区分 Wi‑Fi、蜂窝与未知网络；
稳定网络名只以 16 位 hash 保存。运行时没有此能力时回落共享 `auto`，也可手动填写
`home_wifi`、`cellular` 等档案名。

### v3.13 响应侧选路与后台学习

`CDN=auto` 把测速彻底移出播放响应热路径。打开视频、跳着看、切倍速、切清晰度或
从后台恢复时，脚本只读取学习结果、记录脱敏活动时间并重排候选，调用 Range probe
的次数恒为零；所有媒体 GET/HEAD、Range/If-Range 和播放器重试请求均不被改写：

1. Shadowrocket cron 每十分钟检查一次。每个网络档案首次最多六轮学习；正常完成时
   前五轮间隔十分钟，之后按“测速间隔”运行；失败采用原有退避，不无限加快重试。
   收到播放信息后的三分钟暂停测速。它轮换三个
   公共、未登录样本，不读取 App Cookie、`access_key`、`buvid`、设备 ID 或用户日志；
2. 第一阶段对本次匿名响应的完整参考 URL、原主地址和实际备用候选（最多五个）逐个执行
   64 KiB Range，校验前缀内容并记录启动 TTFB/短段吞吐；第二阶段只让参考与第一
   阶段最优的两个挑战者在 1/4、1/2、3/4 位置轮换同一个 1 MiB 内部 Range；候选
   串行执行，每请求硬截止 5 秒，整轮按 45 秒预算控制；参考 CDN 失败时最多切换一次
   到服务端原主地址，重新校验前缀与内部数据段，仍计入原预算；
3. 候选必须同时满足 `206`、Range 起止、总长、实长、内容 hash、类型、无压缩及
   无跨对象重定向；HTML/JSON 错误页直接失败；
4. 成对轮换 normal-video、audio、high-bitrate-video 的实际轨道样本（缺少目标类型时
   使用可取得的轨道），各自最多保存 8 个摘要和 4 个对象 hash；不把视频测速冒充音频。
   评分只使用最近 6 小时内的样本，启动与持续阶段分别至少覆盖两个不同对象，
   失败率不高于 25%、抖动比不高于 0.65、未熔断，并满足当前表示的 1 MiB 持续吞吐
   余量。64 KiB 小包包含连接延迟，只参与启动评分，不再作为视频带宽硬门槛；
5. 先判定能否满足当前表示带宽，再按启动 TTFB、短段吞吐、持续吞吐、失败率和抖动
   评分。当前服务端原主线路健康时，候选必须领先“切换阈值”才提升，减少不必要改写。
   连续两次失败或最近四次中两次失败会熔断两小时；
6. 排名只考虑该媒体对象由服务端提供、路径相同的完整候选 URL。无合格证据时保留
   原主地址；提升候选后原主地址进入备用列表，其他独立备用地址仍可用；
7. 对所有 CDN 一致执行不拼接主机规则。公开视频测速证明的是该网络中的性能，
   不能证明某个新视频的签名和文件也能裸换主机。JSON 和 gRPC 均保留码率、编码器、
   SegmentBase 初始化范围、索引、时长和未知字段；
8. v10 键为 `BiliCDN.hostAuto.v10`，最多 4 个网络档案、每档 16 主机。持久化只含
   主机名、对象 hash、统计和时间戳，不含完整 URL、path、query、token 或正文；
9. 样本 6 小时后失效，状态 24 小时后回到服务端原地址。v8 主机状态不迁移；
   旧 `nonblocking` 参数会映射为 `cron`，不再依赖 `$done()` 后回调。

v3.13 新模块删除 `Bilibili CDN Cached Media Route`；旧安装若仍引用该 JS，其入口
也只原样放行。历史 v9 状态工具保留用于兼容诊断，默认播放路径不再读取或写入完整
签名媒体 URL，旧路由表不会重新接管快进或重试。活动记录只有时间与网络档案（自动档案为 hash），
30 秒内最多写一次，不记录视频身份。脚本无法观测没有播放 API 请求时的持续播放，
三分钟保护不是“知道播放器是否正在播放”的承诺。

初期最多六轮的 Range 数据会增加流量；成功按 Range 返回且不含 API/协议开销及失败重试时，每轮通常
不超过约 3.4 MiB。流量紧张时可设 `测速方式=off`。此设置停止学习但仍使用有效既有
证据；`CDN=off` 完全停止 CDN 改写。首次无样本时直接沿用服务器地址，不等待测速。

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
BiliFlow 生成的固定 URL，升级到 3.11.0 **不需要重新订阅**，只需执行上述“更新
模块”。更新后模块详情应显示 `3.11.0`，脚本 URL 应含 `?v=3.11.0`。只有把 Release
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
npm ci --ignore-scripts --no-audit --no-fund
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
