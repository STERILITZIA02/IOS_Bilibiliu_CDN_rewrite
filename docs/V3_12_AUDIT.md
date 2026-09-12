# v3.12.0：9.11.0 / 海外 6.5.0 网络与去广告更新

日期：2026-09-11。基线：`b9b2bc2` / v3.11.0，工作区起始干净，基线核心测试
197/197 通过。本轮不以版本号推断新的 protobuf 字段，不声称完成手机抓包。

## 版本与方案核对

| 来源 | 本次确认 | 采用方式 |
| --- | --- | --- |
| [中国 App Store](https://apps.apple.com/cn/app/id736536022) | 9.11.0 版本记录 | 明确粉版目标 |
| [海外 App Store](https://apps.apple.com/us/app/bilibili-every-video-you-love/id1517062289) | 6.3.0 → 6.4.0 → 6.5.0，原 3.20.1 白版的后继应用 | 将旧白版和 6.x 的状态头假设分开；实际 UA 待抓包 |
| [Biliverse/ADBlock](https://github.com/Biliverse/ADBlock/blob/43b07841fa55ba77e29d478cab0be44c8b49a3c2/src/process/Response.dev.mjs) | feed 补取、DynAll/DynVideo、View 与 DmView 处理；main SHA 与上轮一致 | 交叉核对现有覆盖；不采用跨请求旧卡缓存填充 |
| [Biliverse/Redirect](https://github.com/Biliverse/Redirect/blob/7e446284790953ad690fee5fa21afe78f00232f5/src/response.dev.js) | PlayerUnite 媒体结构与重定向处理 | 保持完整对象/签名边界；不叠加另一套响应重写器 |
| [Sparkle 模块](https://github.com/kokoryh/Sparkle/blob/a4e25fb8befb8e91d20b131e92b5396507fc6b7a/release/surge/module/bilibili.sgmodule) | `/pgc/page/channel` 的 BANNER / module_data.items 与 blackboard/era 运营地址 | 新增该精确 JSON endpoint，保留普通 TIP 和剧集 |
| [Sparkle handler](https://github.com/kokoryh/Sparkle/blob/a4e25fb8befb8e91d20b131e92b5396507fc6b7a/src/script/bilibili/protobuf/handler.ts) | 主/异步 View、播放器、评论、DM 分别处理 | 复核现有单 owner 流水线，不替换 Chronos 包、签名或播放器权限 |

BiliUniverse 的 GitHub 地址现重定向至 Biliverse；“仓库最近推送”不代表 main 协议
实现有更新。公开代码未提供可确认的 9.11.0/6.5.0 原始设备响应。本轮新增的是已有
公开接口的覆盖，以及可在旧代码复现的网络缺陷；不是宣称发现了新版私有协议。

## 可复现的问题与实现

1. **首页额外等待**：旧默认在 1–5 条 AV 时也等待一次补取，定时器为 2200 + 250 ms。
   新默认 `homeFeedRefill=false`，过滤后立即交付已有结果，六条仍是上限。
   `首页补齐6条=true` 可恢复补取；受广告/普通视频开关、GET、错误码和递归标记约束。
   原有两级非空 fallback、去重和全广告不放回规则保持。
2. **高 RTT 被当作带宽不足**：64 KiB / 总耗时会重复惩罚握手与跨境延迟。现在用
   内部 1 MiB 的 p25 持续吞吐控制带宽余量，短包 TTFB/吞吐仍参与评分。
   启动和持续阶段都至少需要两个不同对象的近期成功证据，保留失败率、抖动和切换阈值。
3. **旧持续样本复活**：新启动成功曾刷新整个 bucket 的 lastSuccessAt。现评分过滤
   超过六小时和未来时间戳样本，并按各阶段实际样本重算对象数，不能借旧对象计数晋升。
4. **冷启动绕过熔断**：稳定选择拒绝 Akamai 后，旧 cold fallback 又无条件提升它。
   现检查最近失败、熔断和已知吞吐不足；无可用目标时保留原主地址。
5. **最高分目标不存在**：Akamai 没有当前对象的完整 URL 时，旧代码直接放弃其他
   合格候选。现排名先检查目标是否可用于当前对象，继续选下一个合格主机。
6. **缓存覆盖新决定**：媒体请求读取最新熔断；新的播放响应回到原主地址或不能形成
   精确路由时，撤销同对象旧路由。其他对象和网络档案不受影响。
7. **测速参考单点故障**：参考前缀或内部 Range 失败后，后台最多切到服务端原主地址
   一次，重新验证两段且沿用 45 秒预算。桌面工具同步处理，并给匿名 API 请求加超时。
8. **状态头和错误载荷**：明确 `bili-inter/6.x` 或更高语义版本不再进入旧白版删除
   成功头分支；未知/build 型 UA 延续旧兼容行为。JSON 非零业务 code 原文返回。
   HTTP/gRPC 错误、trailers、未知字段、字幕与媒体签名继续受到保护。

未增加全局 QUIC 禁用、API 域名拒绝、媒体 MITM、DNS/IP 固定绑定或盲目请求重签名。
这些操作缺少当前手机证据，可能增加失败重试。默认仍为配置路由、DIRECT、后台测速；
代理出口变化无法仅由 Wi-Fi 名判断，应更换网络档案或重置学习状态。

## 去广告字段边界

新增 registry `pgc-channel`：`api.bilibili.com` / `api.biliapi.net` 上精确
`/pgc/page/channel`，同时进入 request guard 和 response no-store；CDN-only 不命中。
只在 `data.modules[].type=BANNER` 的 `module_data.items` 中检查已有高置信广告
结构、商业 URL 和 `https://www.bilibili.com/blackboard/era/` 运营路径。移除最后
一条商业卡后才移除空横幅模块。普通标题、TIP、剧集、分页与未知模块保持。

现有首页、搜索、Story、View/ViewUnite/AIRelateAsync、暂停/结束页、DmView、动态
综合/视频/个人分页、商品与直播商业容器沿用已核对的过滤器。没有把普通内容“广告”
关键词、所有 unique_id、所有 DM 或所有 TIP 当作广告证据。

## 验证记录

- 新增专项测试先在旧实现复现失败，然后修复；旧首页补取用例改为显式开启新开关，
  继续覆盖成功、失败、超时、晚回调和递归保护，没有删除用例。
- `npm run check:all` 通过：核心 213/213、站点 4/4；确定性 `build:check`、站点
  lint 与生产构建通过，无跳过测试。新增 16 个回归用例；既有 Node glob 实验提示
  不影响结果。最终发行模块和脚本由构建生成，校验值见 `dist/SHA256SUMS.txt`。
- 样本均为合成或匿名公开媒体，不是设备采集。零热路径 probe 和默认零首页补取
  通过实际发行脚本/VM 断言；无法由此断言所有手机页面加载延迟。

本机匿名网络样本：公开视频 BV1xx411c7mD，同一内部 Range
`8388608–9437183`（1 MiB），四个候选均为 HTTP 206，长度、总长度与内容 hash 一致。

| CDN | TTFB ms | 完成 ms | Mbps |
| --- | ---: | ---: | ---: |
| cosov | 746.5 | 3081.5 | 2.72 |
| Akamai | 766.3 | 1833.6 | 4.58 |
| aliov | 1267.6 | 5002.6 | 1.68 |
| ali | 1474.5 | 2530.5 | 3.31 |

该结果只证明采样时本机路径的连通性与数据一致性，不是新旧代码的速度对照，也不
直接写入手机选路状态。它说明固定某个 CDN 为“永远最快”不可靠；实际起播与卡顿
请按 [设备验收指南](BILIBILI_9_11_CAPTURE.md) 在同网络、清晰度和视频上对照。

真机验收状态：**粉版 9.11.0 / 海外版 6.5.0 均未验证**。本审计记录源码、模块和
定制器的发布前验证；实际发布状态以 GitHub Release、main 固定地址和线上站点为准。
