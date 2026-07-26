# Bilibili Shadowrocket CDN 与界面增强

[![CI](https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/actions/workflows/ci.yml/badge.svg)](https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/actions/workflows/ci.yml)

面向 iPhone / iPad、iOS 26 / iOS 27 的 Bilibili Shadowrocket 项目。仓库提供
两个可以独立安装、在 Shadowrocket 内持续更新的版本：

| 版本 | 包含内容 | 适合谁 |
| --- | --- | --- |
| **CDN Switcher** | Bilibili 分流、JSON/gRPC 播放地址处理、安全 CDN 自动选择 | 只想改善链路，不改变 App 内容和界面 |
| **CDN + Enhanced** | CDN Switcher 的全部能力，以及首页六条普通视频流、播放页普通视频推荐白名单、暂停/页面广告过滤、首页/“我的”逐项精简 | 希望清理广告、非普通视频推荐和不需要的服务入口 |

旧地址 `Bilibili.CDN.sgmodule` 会继续更新，并作为 **Enhanced 兼容别名**，
因此已经安装 v1/v2 的用户不会在更新后意外失去增强功能。

> [!IMPORTANT]
> 自动化测试不能替代真实 iPhone/iPad、Shadowrocket 与 Bilibili App
> 组合的真机验收。仓库会明确区分“代码测试通过”和“真机已验证”；发布前后的
> 检查矩阵见 [真机验收清单](docs/DEVICE_ACCEPTANCE.md)。

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

Enhanced 还会加入 `api.live.bilibili.com`，用于处理直播间明确的活动/购物卡片。
点播和直播媒体 CDN 不会加入 MITM。HTTPS 解密页面中的 `google.cn`、
`googlevideo.com` 等主机来自其他模块或原配置，不是本项目添加的范围。

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
| `广告过滤` | `true` | 过滤明确广告字段、已审核类型，以及播放进度接口重新下发的暂停运营容器 |
| `首页推荐6个普通视频` | `true` | 在`广告过滤`开启时，每次首页/推荐响应只保留按原顺序出现的前 6 个明确普通 AV；同时清理横幅、广告、小游戏/应用、纪录片、影视、综艺、直播、活动和未知卡片 |
| `推荐仅普通视频` | `true` | 在`广告过滤`开启时，播放页推荐只保留明确普通 AV；移除番剧、综艺、纪录片、影视、直播、游戏、课程、活动、广告、必火推荐及未知类型卡片 |
| `界面精简` | `true` | 启用下面的首页/“我的”逐项设置 |
| `搜索推广` | `true` | 隐藏明确的搜索运营推广词 |
| `直播带货` | `true` | 隐藏明确购物卡片和业务编号 33 的购物标签 |
| `会员营销` | `true` | 隐藏“我的”页与大会员中心营销横幅/弹层，不改会员数据 |

`首页推荐6个普通视频=true` 对每一份新的 `/x/v2/feed/index` 响应独立执行，
不会只清理首次结果：卡片必须同时有 `goto/card_goto=av|video`，以及
AVID/BVID/CID、`param`、播放器参数或 `/video/` 地址中的至少一个视频身份。
如果服务端返回 6 个以上合格视频，严格保留前 6 个；若本次不足 6 个，则保留实际
数量，不伪造、不复用旧卡片，也不为了补位再次请求接口。这样能持续阻止刷新后广告
回流，同时避免递归刷新、过度重连和额外网络负载。普通视频标题即使含“广告”
或“纪录片”也不会仅凭标题误删；只有协议分类、营销字段或商业动作明确命中才删除。

`推荐仅普通视频=true` 是播放页推荐列表的有意严格边界：JSON 必须有
`goto/card_goto/type=av|video`、普通视频 `player_args` 或 `/video/` 地址，只有
AVID/BVID 而没有类型证据的卡片不会放行；旧版 View gRPC 只保留 `goto=av`；
ViewUnite 必须同时是关系卡类型 `1 (AV)` 且实际 oneof 为 `av(2)`。类型伪装、
字段缺失或载荷为纪录片/番剧、资源、游戏、CM、直播、AI、特殊内容的卡片会删除，
未知非目标字段仍按原始 wire bytes 保留。关闭该开关可恢复合法非视频推荐，但
`广告过滤=true` 时明确 CM、广告/游戏/课程推广、活动横幅、大会员横幅和 UP 主
商品分享模块仍会清理。

播放页 gRPC 脚本同时读取 Shadowrocket 的 `bodyBytes`，并在 WebView 引擎内对
首个 gzip 压缩响应做 4 MiB 解压上限处理；因此播放器下广告和关系卡会在第一次
渲染前完成过滤。损坏帧、未知压缩格式或解压能力不可用时仍原样放行，避免破坏播放。

App 从后台恢复或在暂停时还会重新请求 `ViewProgress`。Enhanced 会对旧版
`view.v1` 的 `video_guide` 和新版 `viewunite.v1` 的 `dm` 运营容器逐次处理，
但保留 Chronos、视频快照、进度点和其他未知顶层字段；这会同时隐藏这些容器中的
暂停广告与播放中运营卡片，不影响音视频流、进度保存或正常播放。

大会员中心只处理营销 `banners`/已审核横幅列表变体和具有高置信营销标记的弹层；
“我的”页还会删除协议中明确用于会员营销的 `vip_section`、`vip_section_v2`、
`modular_vip_section`，并中和专用 `/x/vip/ads/materials` 响应。以下内容属于
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
| `测速间隔` | `12` | 6–72 小时；所有资源探测仍至少间隔 2 分钟 |
| `切换阈值` | `20` | 备用路线至少快多少百分比才进入二次确认，范围 0–90 |
| `调试日志` | `false` | 排错时临时开启；不输出完整 URL、签名或正文 |

`网络档案=auto` 不声称自动识别 Wi‑Fi/SSID。需要严格隔离家庭 Wi‑Fi 与蜂窝网络
缓存时，请切换网络后手动填写不同档案名。

### 安全自动选择

项目不会用“网上所有服务器 + 全局最快主机”覆盖 Bilibili 的动态调度。`CDN=auto`
只比较**同一个媒体对象中，服务端本次实际返回的完整主 URL 与备用 URL**，并且：

1. 分离视频、音频、分段、清晰度、编码、带宽、网络档案和候选集合；
2. 不跨普通 CDN、MCDN、PCDN 家族晋升；
3. 每次播放地址响应最多验证一个对象的两条 URL；
4. 固定使用 `GET Range: bytes=0-16383`，只接受严格一致的 `206` 媒体响应；
5. 新备用路线需至少间隔 10 分钟成功两次，并达到切换阈值；
6. 探测结果只影响之后重新取得的播放地址，不中断当前播放；
7. 使用当前响应中的完整签名 URL，不复用旧 query，不删除原始备用；
8. 持久化只保存摘要、计数和时间戳，最多 64 条；任何异常都原样放行。

首次安装后，没有立即切换是正常现象。稳定性与正确性优先于“第一次就选最低延迟”。

固定主机模式只替换受支持点播 URL 的 host，保留 path/query；目标主机能否接受该
资源签名由用户承担。参考候选见
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
BiliFlow 生成的固定 URL，升级到 3.1.1 **不需要重新订阅**，只需执行上述“更新
模块”。更新后模块详情应显示 `3.1.1`，脚本 URL 应含 `?v=3.1.1`。只有把 Release
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
- 不读取或上传 Cookie、token、响应正文或完整媒体签名；
- 不对媒体 CDN 做 MITM，不处理媒体分片响应体；
- 不访问第三方测速/分析服务；探测只访问本次播放响应提供的同对象 URL；
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
```

- `npm run check` 验证确定性生成物，并覆盖 JSON、gRPC/Protobuf、首次响应
  `bodyBytes`/gzip、播放页普通视频白名单、逐项开关、双模块、严格 Range、
  缓存隔离、阈值、锁、退避、容量和故障开放。
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
- `dist/bilibili-cdn.js`、`dist/bilibili-enhance.js`：运行脚本；
- `dist/module-options.json`：模块与网站共用的选项目录；
- `dist/SHA256SUMS.txt`：发行资产 SHA-256。

设计、数据流和失败边界见
[v3 架构说明](docs/V3_ARCHITECTURE.md) 与
[Protobuf 兼容说明](docs/PROTOBUF_COMPATIBILITY.md)。

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
