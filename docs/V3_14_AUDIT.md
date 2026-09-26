# v3.14.0：9.13.0 / 6.6.0 启动、恢复与广告覆盖复核

日期：2026-09-26。基线：v3.13.0 / `d9b6978`，起始工作区干净。
用户报告国内版卡在开屏、切后台再回来才能打开，随后首页广告、游戏入口和底部选项
重新出现。这里记录多源核对、已修复代码缺陷、未验证事项；不把传输日志当成解密响应。

## 版本核对

| 客户端 | 用户提供的构建标识 | 日志可见请求标识 | 官方公开更新 |
| --- | --- | --- | --- |
| 国内版 9.13.0 | `870c7731`，未由公开渠道独立核实 | request build `91300100`，UA `bili-universal/91300100` | [App Store](https://apps.apple.com/cn/app/id736536022) 确认版本，说明以问题修复为主，未公开接口/字段变更 |
| 国际版 6.6.0 | `06208757`，未由公开渠道独立核实 | request build `91300300`，UA `bili-overseas/91300300` | [App Store](https://apps.apple.com/us/app/bilibili-anime-video-hd/id1517062289) 确认版本，新增 OGV 索引页和排期并修复问题 |

构建标识、request build 和营销版本不是同一字段，不互相推导。国际版仍为
`id1517062289`，不套用东南亚 `app.biliintl.com` 的 beta 路由或旧白版身份假设。
实际 UA 已用于合成回归；日志没有提供 gRPC 请求头或目标响应体。

## 多源检查

| 来源 | 核对内容 | 采用/边界 |
| --- | --- | --- |
| [Biliverse/ADBlock Response](https://github.com/Biliverse/ADBlock/blob/1dbaef14d55006fb8c13d5b29dffb2977c10fa99/src/process/Response.mjs) | app.biliapi.com、PlayerRelates、PlayerUnite 广告片段、评论编辑器 | 独立实现精确主机与字段覆盖；没有移植远程代发、旧卡补位或外部持久化 |
| [PlayerUnite schema](https://github.com/Biliverse/ADBlock/blob/1dbaef14d55006fb8c13d5b29dffb2977c10fa99/src/protobuf/bilibili/app/playerunite/v1/playerunite.proto) | fragment_video(10).videos(1).fragment_info(1).fragment_type(3)，AD=1、OGV=2 | 仅删除明确 AD；保留 OGV、未知类型、时间线与媒体字节 |
| [View schema](https://github.com/Biliverse/ADBlock/blob/1dbaef14d55006fb8c13d5b29dffb2977c10fa99/src/protobuf/bilibili/app/view/v1/view.proto) | PlayerRelatesReply.list(1) | 复用已审核的 Relate 判据 |
| [Reply editor schema](https://github.com/Biliverse/ADBlock/blob/1dbaef14d55006fb8c13d5b29dffb2977c10fa99/src/protobuf/bilibili/main/community/reply/v2/reply.proto)、[类型定义](https://github.com/Biliverse/ADBlock/blob/1dbaef14d55006fb8c13d5b29dffb2977c10fa99/src/class/ADBlock.mjs) | input(2).func_buttons(7).buttons(1).type(1)=5/8 | 清理商品工具按钮，保留输入、表情与未知按钮 |
| [Sparkle](https://github.com/kokoryh/Sparkle/blob/8152807eb095cbf22e50dbdaf3cececad54fba26/src/script/bilibili/protobuf/handler.ts) | 商品模块、主/异步推荐、播放器入口 | 最近相关修复为 merchandise；不因仓库更新就宣称已有 9.13 专项抓包 |
| [app2smile](https://github.com/app2smile/rules/blob/master/js/bilibili-json.js)、[Maasea](https://github.com/Maasea/sgmodule/blob/master/Bilibili.Helper.sgmodule) | 开屏、导航、广告、DM 等常用入口及不同网络处理方式 | 交叉检查覆盖；不采用未经本机验证的运营商/网络头替换 |
| [gRPC HTTP/2 协议](https://grpc.github.io/grpc/core/md_doc__p_r_o_t_o_c_o_l-_h_t_t_p2.html)、[HTTP 语义](https://www.rfc-editor.org/rfc/rfc9110.html) | 状态、编码、条件请求和响应表示 | 统一改写后的头部清理；错误、304 和部分响应保持原样 |

Biliverse 的 `Response.dev.mjs` 当前重导出 `Response.mjs`，本轮核对的是实际共用
实现。其源码的 app.biliapi.com 覆盖与部分发布模板并不一致；本项目已独立补齐，
但用户这次传输日志没有出现该主机，因此它是兼容缺口，不是已确认的现场原因。

## 修复与优化事项

| 事项 | 状态 | 最终行为 |
| --- | --- | --- |
| 已解码 JSON 改写后仍带旧 gzip/br、长度和校验头 | 已复现并修复 | CDN、Enhanced、两种 Story 流水线共用响应工具，只在正文变化时清理旧表示头 |
| HTTP 错误、304、206 进入正文过滤 | 已修复 | 原样交回客户端；JSON 非零业务 code 也不改写或触发补取 |
| 纯诊断接口与未知 RPC 默认拦截、禁缓存 | 已修复 | myinfo、DeviceFeature、Module/List 与未知 RPC 不进入默认 matcher；旧 matcher 误入时在读 body 前返回 |
| 关闭功能仍修改相应请求缓存头 | 已修复 | 请求和响应使用一致的功能启用判断，关闭后保持原样 |
| 清空开屏广告仍保留显示计时 | 已修复 | 清零已存在的 max_time，保留其他未知字段和请求标识；不伪造广告对象 |
| 备用 app 主机、PlayerRelates、广告视频片段、评论商品工具 | 已补齐 | 精确路径/类型过滤，不笼统删除正常媒体、输入和未知业务结构 |
| BOM JSON、inline banner 变体 | 已补齐 | 支持 UTF-8 BOM 与明确 ad_inline；普通标题不作为广告证据 |
| 启动/刷新时与后台测速争用带宽 | 已优化 | 仅记录脱敏 UI 活动时间，三分钟暂停；运行中的测速在下一请求前让路，不把让路计为主机失败 |
| 重复域名使模块 matcher 冗长 | 已优化 | 相同主机合并路径表达式，仍保持精确路径与单一响应 owner |
| 日志中的 HTTPDNS 连接超时 | 待设备/网络对照 | 未默认封锁解析服务、改 DNS 或全局禁 QUIC；响应过滤不能保证消除外部网络超时 |
| 9.13 / 6.6 真实启动、刷新和全部广告投放 | 待设备复测 | 已有合成回归与实际 UA 证据，尚无修复后的解密响应/设备验收 |

## 广告与界面覆盖清单

| 渠道 | 已处理范围 | 保留边界 |
| --- | --- | --- |
| 开屏 | list/show/event/list2/brand/list 的广告、预载、遗留创意状态与显示窗口 | 真实错误、请求标识及未知配置 |
| 首页和底栏 | feed、明确广告/游戏卡、普通视频上限、导航游戏/发布/会员购的独立开关 | 消息、头像、已知正常视频与未知导航 |
| 搜索 | JSON 搜索、SearchAll/SearchByType、商业 badge、运营词 | 普通搜索结果和标题 |
| 播放页 | View/ViewUnite、AIRelateAsync、RelatesFeed、PlayerRelates、商品与广告容器 | 视频身份、编码、索引、播放能力和未知字段 |
| 播放器与弹幕 | PlayerUnite 广告片段、已审核推广提示、ViewProgress、DmView 商业指令 | 正常 OGV、字幕、普通弹幕与未知片段 |
| 暂停/结束页 | 已审核 PlayPause/ViewEndPage 商业容器 | 无明确商业证据的内容 |
| 动态 | 综合、视频、个人分页、Web feed 广告及商品附加模块 | 正文、投票、普通视频与游标 |
| 评论 | MainList 已确认置顶商业卡、SubjectDescription 商品工具按钮 | 普通评论、表情、输入与未知按钮；不任意改写用户文字链接 |
| 直播 | 首页、房间、用户信息及专用购物/游戏素材接口 | 直播媒体、弹幕、正常互动 |
| OGV / VIP / 我的 / 漫画 | 已审核番剧频道横幅、VIP 营销、逐项界面精简、漫画闪屏 | 追番、排期、会员权益、钱包、订单、账户数据 |

“所有渠道”只能以已确认入口清单衡量。视频内硬编码广告、作者口播植入、未知投放
协议和没有网络请求的 App 内存页面不具备可靠的过滤证据；不能承诺百分之百无广告
且绝无副作用。失败时保留原响应，比猜测字段号或拒绝整个首页/播放域更可控。

## 日志与证据边界

用户已确认配置路由、HTTPS 解密及证书信任设置未改变。提供的 PacketTunnel 日志
出现了 HTTPDNS 连接超时，但未包含净化脚本执行标记或首页/底栏的解密响应路径。
这既不能证明设置关闭，也不足以证明脚本执行正常或某个新字段就是根因。
连接关闭时的 cost 是连接生命周期，不能全部算成接口响应耗时。

原始日志及含具体时刻/统计的分析仅保存在本地，未加入发布仓库；公开测试仅使用
合成数据和不含用户身份的客户端版本标识。

## 验证与设备复测

- 当前核心 **239/239**、站点 **4/4**，确定性构建、lint、生产构建通过。
- 新增 15 个专项用例；既有诊断接口测试改为验证不拦截，所有其他过滤回归保留，
  没有 skip。新用例覆盖真实 UA 前缀、压缩/普通 JSON、gzip gRPC、首启/刷新/恢复、
  备用主机单 owner、错误/部分响应、正常 OGV/输入保留与测速让路。
- 所有 HTTP/JSON/gRPC 传输回归都是合成测试，不等于设备端已确认恢复。

复测时更新到 v3.14.0，完全退出 App 后逐个打开；确认开屏无需后台切换即可通过，
首页广告/游戏入口和底栏选择保持过滤，连续刷新、后台恢复、播放及快进正常。
如仍失败，在同一 Enhanced 中只将 CDN 设为 off 对照，并临时开启调试日志，
获取 BiliRefresh/BiliEnhance 的 runtime、handler、changed/writeBack。保持现有已
确认的路由和证书设置，避免同时改多个因素。发布状态以 Release 与线上 Site 为准。
