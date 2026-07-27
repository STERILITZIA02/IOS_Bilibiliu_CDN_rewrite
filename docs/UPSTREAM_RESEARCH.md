# Bilibili Shadowrocket 增强升级：上游调研基线

> 调研日期：2026-07-28
> 用途：记录 v3 升级采用的来源、许可证和安全边界。本文不是功能完成声明。

## 调研结论

本项目不会直接拼接多个第三方脚本，也不会复制许可证不兼容的实现。升级代码以当前仓库为基础独立实现，只参考下列项目公开的接口覆盖范围、字段语义和已知故障。

最重要的结论如下：

1. 广告过滤通常只处理多特征一致的高置信度对象；播放页“仅普通视频”开关是
   有意例外，无法确认为普通 AV 的关系卡会删除。
2. 首页与“我的”页面只从服务端原始数组中删除明确命中的入口，不用本地白名单覆盖整个数组。
3. 自动 CDN 不能把一个主机全局套用到整份响应。视频、音频、清晰度、编码和资源版本必须隔离。
4. 自动候选只来自同一个媒体对象的 `base_url` 与 `backup_url`；静态主机只能作为显式手动模式的补充。
5. CDN 可用性必须使用小范围 `Range` 请求验证；仅成功的 `HEAD` 不足以证明返回的是可播放媒体。
6. MCDN/PCDN、海外番剧与普通点播存在兼容边界，默认模式不能跨家族、跨资源复用 URL。
7. 不修改账号、会员、付费内容、鉴权、签名或地区权益，不伪造网络环境请求头。

## 参考项目快照

| 项目 | 调研提交 | 许可证 | 本项目采用方式 |
| --- | --- | --- | --- |
| [BiliUniverse/ADBlock](https://github.com/BiliUniverse/ADBlock) | `43b07841fa55ba77e29d478cab0be44c8b49a3c2`（2026-07-26 读取 `main`） | Apache-2.0 | 参考当前 Feed/Story/View/TFInfo/ViewUnite 接口覆盖范围与高置信广告特征，重新实现 |
| [BiliUniverse/Enhanced](https://github.com/BiliUniverse/Enhanced) | `6fcb1be0fb6d` | Apache-2.0 | 参考导航字段含义；不采用其覆盖服务端数组的方式 |
| [BiliUniverse/Redirect](https://github.com/BiliUniverse/Redirect) | `7e4462847909` | Apache-2.0 | 参考 CDN 家族、海外内容和 MCDN 兼容边界 |
| [BiliUniverse/Universe](https://github.com/BiliUniverse/Universe) | `913bb91c5f4c` | Apache-2.0 | 交叉核对模块结构与许可证 |
| [Maasea/sgmodule](https://github.com/Maasea/sgmodule) | `65075cdb388f` | Apache-2.0 | 参考 Shadowrocket 模块端点和保守 PCDN 规则 |
| [app2smile/rules](https://github.com/app2smile/rules) | `df6366a7024e` | MIT | 交叉核对 JSON/Protobuf 广告卡片特征 |
| [kokoryh/Sparkle](https://github.com/kokoryh/Sparkle) | `a26c3412a760` | GPL-3.0 | 只交叉核对 9.4.0 `PlayPause`/`ViewEndPage`、`PubModule`、`Popular` 与专用素材路由；不复制代码 |
| [fmz200/wool_scripts](https://github.com/fmz200/wool_scripts) | `edbfac44522e` | GPL-3.0 | 只交叉核对当前 Shadowrocket/Surge 路由覆盖；不复制模块、脚本或 jq |
| [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) | `8f67b6419fe1` | GPL-2.0 | Bilibili 文件当前已归档；不复制代码或引用归档脚本 |
| [Shadowrocket 使用手册](https://github.com/LOWERTOP/Shadowrocket/blob/main/README.md) | 调研日默认分支 | 文档仓库声明为准 | 核对模块、脚本、MITM、规则、安装和自动更新能力 |
| [`@nsnanocat/grpc`](https://www.npmjs.com/package/@nsnanocat/grpc) | `1.1.0` npm 发行包 | Apache-2.0 | 核对 Bilibili gRPC 压缩标志 `1` 的 gzip 互操作行为；不复制其 pako 实现 |
| [gRPC HTTP/2 protocol](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md) | 调研日默认分支 | Apache-2.0 | 核对压缩标志、消息长度和 `grpc-encoding` 语义 |
| [WebKit Compression Streams](https://docs.webkit.org/Deep%20Dive/Modules/CompressionStreams.html) | 调研日文档 | WebKit 文档条款 | 核对 iOS WebView 的 gzip 流式解压能力与格式支持 |
| [`bilibili-API-collect` 公开镜像](https://gitea.s1f.ren/shiran/bilibili-API-collect) | `cfc5fddcc8a94b74d91970bb5b4eaeb349addc47` | CC BY-NC 4.0 | 只交叉核对互操作字段号与语义事实，不复制 schema 或实现 |
| [`pskdje/bilibili-API-collect`](https://github.com/pskdje/bilibili-API-collect) | `271b123a0836` | 仓库未声明标准 SPDX 许可证 | 只核对公开大会员中心 JSON 字段事实，不复制文档或实现 |

最终发行版会在 `THIRD_PARTY_NOTICES.md` 中保留实际采用来源的许可证说明。若后续复制任何上游代码片段，必须先记录文件、提交和许可证；当前设计不需要复制。

PCDN 网络规则只采用 Maasea 模块中可交叉核实的窄匹配
`DOMAIN-WILDCARD,*pcdn*.biliapi.net`，不复制其脚本实现。模块把策略暴露为参数：
默认 `DIRECT` 不改变默认直连分流，用户显式选择 `REJECT` 时才阻断。由于存在
已记录的播放兼容风险，本项目没有加入 `mcdn.bilivideo.cn` 拦截。

## 已核实的接口与字段

### 高置信广告

以下特征来自多个仍在维护的实现交叉核对，可作为“精确匹配后删除”的候选：

- 开屏响应中的明确广告容器：`account`、`event_list`、`preload`、`show`。
- 推荐流广告：广告卡片类型与 `goto`/`card_goto` 广告类型同时命中。
- 商业伪装卡：非空 `business_info`、`cm_mark`、广告/创意 ID 或明确商业动作与
  跟踪字段。
- Story 广告：存在 `ad_info`，或 `card_goto` 为明确的竖屏广告类型；
  `vertical_pgc` 是当前维护规则标记的大会员专享卡。
- Web 推荐：`goto === "ad"`。
- 直播间：`activity_banner_info`，以及业务编号明确为广告位的外部标签。

仅名字类似、仅 URL 含模糊关键词或只命中单一弱特征时不删除。

### 首页与推荐流普通视频边界

[`bilibili-API-collect` 的首页推荐接口记录](https://github.com/pskdje/bilibili-API-collect/blob/main/docs/video/recommend.md)
显示，普通 App 首页视频同时具有 `card_goto:"av"`、`goto:"av"`、视频
`param`/`player_args` 和 `bilibili://video/...`；同一响应还可能出现
`banner_v8`、`banner_ipad_v8`、直播、OGV 和广告卡。Web 首页同样用
`goto:"av"` 区分普通视频，用 `goto:"live"`/`"ogv"` 区分非普通视频，并以
`business_info` 承载商业推广信息。

BiliUniverse/ADBlock 固定提交
[`43b0784`](https://github.com/BiliUniverse/ADBlock/blob/43b07841fa55ba77e29d478cab0be44c8b49a3c2/src/process/Response.dev.mjs)
进一步确认当前首页广告组合：`cm_v1/cm_v2` 的 `ad_web_s`、`ad_av`、
`ad_web_gif`，`cm_v2` 的 `ad_player`、`ad_inline_3d`、`ad_inline_eggs`、
`ad_inline_live`，`small_cover_v10/game`，以及
`cm_double_v9/ad_inline_av`。该实现还会再次请求首页接口来补空位；本项目明确
不采用该行为，因为响应脚本内递归补位会增加额外网络请求、重入和刷新抖动风险。

本项目的严格模式因此使用正向白名单：必须有明确 AV/video 类型和具体视频身份，
按服务端顺序最多保留 6 条。每一份新响应都独立过滤；若不足 6 条则保留实际数量，
不伪造、不跨响应复用，也不修改 `auto_refresh_time`。标题文本不参与类型判定，
避免把标题含“广告”“纪录片”的普通 UP 视频误删。

### 首页导航

调研时可稳定识别的入口包括：

- 顶部“游戏中心”：`id=222`、`tab_id=游戏中心Top`、URI 为游戏中心。
- 顶部“新征程”：`id=136117`、`tab_id=165`、URI 含对应频道编号。
- 底部“发布”：`id=670`、`tab_id=publish`、URI 为投稿中心。
- 底部“会员购”：`id=242`、`tab_id=会员购Bottom`、URI 为会员购。

删除逻辑必须至少同时命中名称与稳定 ID、`tab_id` 或 URI 之一。首页、动态/关注、消息、个人中心等非目标入口必须保留。

### “我的”页面

已确认的服务项包括“我的课程”“看视频免流量”“能量加油站”。其余目标项采用“精确中文名 + 商业 URI/稳定 ID”匹配。登录、账号、设置、历史、收藏、下载、真实大会员状态与付费权益不得更改。

### 播放页与大会员中心

- [`common.proto` 的公开快照](https://github.com/pskdje/bilibili-API-collect/blob/main/grpc_api/bilibili/app/viewunite/common.proto)
  显示 ViewUnite 关系卡类型 `1` 为 AV、`2` 为番剧、`3` 为资源、`4` 为游戏、
  `5` 为广告、`6` 为直播、`7` 为 AI 推荐、`8/9` 为番剧关联、`10` 为特殊卡；
  当前上游实现还识别 `11` 为课程推广。默认严格模式因此只允许类型 `1`。
- [旧版 View schema 快照](https://github.com/pskdje/bilibili-API-collect/blob/main/grpc_api/bilibili/app/view/v1/view.proto)
  记录 `Relate.goto(7)` 中 `"av"` 为普通视频，`"special"` 为 PGC，`"cm"` 为广告，
  `"game"` 为游戏；严格模式只允许 `"av"`。
- [JSON 推荐接口样例](https://github.com/pskdje/bilibili-API-collect/blob/main/docs/video/recommend.md)
  将普通视频表示为 `goto:"av"`，直播表示为 `goto:"live"`，OGV 表示为
  `goto:"ogv"`，并给出明确广告类型；JSON 白名单据此实现，同时拒绝已审核的
  纪录片、综艺、番剧、影视和商业标签字段，不依据标题文本猜测类型。
- `cm_stock` 和非空 `unique_id` 是明确推广特征，即使外层类型为 `1` 也删除。
- `RelateCard` 的真实内容是 oneof：`av(2)`、`bangumi(3)`、`resource(4)`、
  `game(5)`、`cm(6)`、`live(7)`、`bangumi_av(8)`、`ai_card(9)`、
  `bangumi_ugc(13)`、`special(14)`。严格模式不能只相信外层类型 `1`，还必须
  要求 oneof 实际为 `av(2)`，从而拒绝被伪装类型包裹的直播、纪录片或游戏广告。
- 当前 `ViewReply` 还包含 `tf_panel_customized(34)`；独立 `TFInfo` 方法的
  `tf_toast(2)` 与 `tf_panel_customized(3)`也是播放器下运营商营销面板。
- 详情介绍模块类型 `18` 为活动横幅、`29` 为大会员横幅、
  `55` 为 UP 主分享好物；仅在精确 `ViewUnite` 结构中按类型删除。
- 大会员中心组合接口为 `/x/vip/web/vip_center/combine`。营销
  `banners`/横幅列表变体与 `user.vip`、`wallet`、`privileges` 等权益数据分离，
  因而只清空已审核横幅数组，不遍历或修改会员、支付和账户对象。
- Sparkle 固定提交中的当前模块把
  `bilibili.app.viewunite.v1.View/PlayPause` 与
  `bilibili.app.viewunite.v1.View/ViewEndPage` 作为独立广告响应中和；这与用户在
  9.4.0 后台暂停后看到的全屏应用卡入口吻合。本项目据公开方法事实独立实现空
  gRPC 响应，没有复制 GPL 实现。
- `Mine/PubModule` 的 `PubCard` 是 oneof；只删除 `pub_guide(1)`，保留
  `ugc(2)`、`opus(3)` 和未知字段，避免为修复后台回流而覆盖整个“我的”数据。
- `Popular/Index` 的普通卡 oneof 与广告卡 oneof 可精确区分；严格首页开关下仍
  要求 base 的 `goto/card_goto` 与视频身份同时成立，不能仅凭封面类型放行。
- 当前维护项目共同覆盖的专用素材路由包括 `/x/resource/top/activity`、
  `/x/resource/patch/tab(/v2)`、`/pgc/activity/deliver/material/receive`、
  `/xlive/e-commerce-interface/v1/ecommerce-user/get_shopping_info` 与
  `line3-h5-mobile-api.biligame.com/game/live/large_card_material`。本项目只在
  精确主机/路径上返回各接口约定的空安全形状。

## 已知风险证据

- [BiliUniverse/Redirect issue #6](https://github.com/BiliUniverse/Redirect/issues/6) 报告了对 MCDN 请求进行中间人处理后出现 TLS 握手失败和持续缓冲。因此本项目不对媒体数据域做 MITM，也不在媒体分片热路径执行响应体脚本。
- [BiliUniverse/Redirect pull request #8](https://github.com/BiliUniverse/Redirect/pull/8) 表明新增 CDN 在特定地区可能更快，但这只证明地区性收益，不能证明它可替代任意媒体对象的服务端候选。
- Shadowrocket 手册说明模块可远程更新，也说明复杂脚本可能增加 Network Extension 的内存压力。因此模块应限制 MITM 域名、脚本响应体大小和每次请求的测速数量。
- gRPC 规范规定压缩标志 `1` 的消息使用 `grpc-encoding` 指定的机制，而标志
  `0` 表示消息字节未压缩；当前 Bilibili iOS 生态实现对标志 `1` 使用 gzip。
  本项目只处理 gzip，按 4 MiB 限制解压，并把修改后的消息作为标志 `0` 输出。

## 明确不采用的做法

- 不使用巨型通配域名 MITM 列表。
- 不拦截或改写媒体文件响应体。
- 不依赖未公开、未承诺的 Shadowrocket `$network`/SSID 脚本变量。
- 不以 `HEAD`、TCP 连接成功或最低延迟作为唯一 CDN 判据。
- 不把静态 CDN 主机列表当作自动模式的首选来源。
- 不把视频候选用于音频，或把一个清晰度/编码的缓存用于另一个清晰度/编码。
- 除首页/推荐流与播放页两个用户可关闭的普通视频白名单外，不删除未知对象，也
  不以空数组替换无法解析的响应。
- 不通过请求头伪装运营商、网络类型、地区或会员状态。

## 实现与验收原则

每个阶段必须满足：

1. 生成产物可复现。
2. 单元测试与静态检查通过。
3. 失败路径返回原始响应或原始请求。
4. 不在日志中输出完整签名 URL、Cookie、Token 或响应正文。
5. 阶段提交推送到远程开发分支；最终验收通过后再更新 `main` 和发行版。
