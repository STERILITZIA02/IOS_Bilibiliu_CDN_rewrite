# v3.11.0：iOS 9.9.0 / 海外客户端兼容与广告处理审计

- 日期：2026-08-27。
- 起点：最新 `origin/main` / `312b2e95eff23a92142276006ed5e99ce8be1bdf` / v3.10.1。
- 本轮先 fetch 并确认工作区干净、HEAD 与 main 相同；旧基线 `check:all` 为
  177 个核心测试、4 个站点测试通过。旧测试通过不代表截图缺陷已解决。
- 新增测试先在旧实现复现失败，再修复源文件；`dist` 仅经构建生成。

## 证据等级与实际根因

截图能确认可见的商品区、底部短剧广告、播放器下活动横幅；没有提供对应的 9.9.0
HTTP/gRPC 原始响应。本轮未连接 iPhone，也没有海外版 Dynamics 失败请求的 UA、
状态码或正文。因此下表区分**可复现的代码缺陷**与**手机现场尚待确认的来源**。

| 现象 | 已确认的代码缺陷 / 修复 | 尚未确认 |
| --- | --- | --- |
| 播放中倒计时、底部广告与横幅仍出现 | v3.10.1 构建 gRPC 响应 matcher 未筛选 `responseFilter`，使 request-only PlayerUnite row 同时进入通用增强响应脚本。生成模块对同一请求命中两个响应 owner。现只允许 CDN/广告合并流水线处理它 | 截图对应响应是否确实是 PlayerUnite，还是未提供的新投放接口 |
| UP 主分享好物 | 主 View 会移除 Module.type=55，但 AIRelateAsync 未复用模块类型排除；JSON View 只看 module_type/moduleType，不看模块集合中的 type。现两条路径均删除整个商品模块 | 新版是否还有其他商品容器，截图上的实际 JSON/RPC 父路径 |
| 动态视频流推广 | registry 只有 DynAll；即使匹配，也只按顶层类型 15/18 过滤，AV 外壳内 ModuleAd、商品附加模块与广告推荐模块会保留 | 9.9.0 实际调用 DynAll、DynVideo、个人分页还是 JSON 的比例 |
| 海外版动态刷新失败 | 旧正常化函数无条件删除 grpc-status，对新/未知 UA 即使原为成功也不保留，并会把部分真实错误改成 0。现保留错误及 trailers，按 engine 补足成功状态，保留旧 bili-inter 例外 | 实际海外版名称/build/UA；此次失败是否由该问题、服务端错误或未匹配接口造成 |
| 长后台后恢复原版 | 即时 gRPC 依赖 WebView 的解压能力；不具备浏览器流/API 的模拟 JSC 会直接放行 gzip。现内置解码器并统一使用 JSC；新接口同步请求守卫，失败/无变化响应也不缓存原始 UI | 无现场证据证明 WebView 回收或 QUIC 是该手机故障根因；无请求的内存 UI 无法改写 |
| 播放中另行下发商业指令 | 旧模块未匹配 DM/DmView，它可独立承载 command 与 activity metadata。现补齐该精确 RPC，复用商业 CommandDm 判定 | 红果短剧是否来自这个 RPC，而不是其他广告 SDK/页面素材 |

美国商店与中国商店的 `id736536022` 在核对日均列出 9.9.0，但“海外版”不能自动
等同于此 App、旧 `bili-inter` 白版或东南亚 BiliBili Intl。未凭名称扩展到不同协议的
`biliintl` API，更未覆盖鉴权、签名或账号数据。

## 方案比较与选择

| 公开方案 | 核对结果 | 本轮选择 |
| --- | --- | --- |
| BiliUniverse/ADBlock main / dev | 有 DynAll/DynVideo、View/DM 及 UA 专属状态头处理；Universe 支持表将 Shadowrocket 标为部分兼容 | 交叉核对协议及旧白版例外，不叠加整套脚本 |
| kokoryh/Sparkle | 确认 AIRelateAsync 模块结构、商品类型 55、DmView command 与 engine/trailers 处理；项目明确不支持 Shadowrocket | 只采用互操作事实，独立实现 wire-preserving 过滤；不复制整个 DM 删除或网络重试流水线 |
| app2smile/rules | 公开模块确认 app / grpc 双 host，但当前模块主要覆盖 DynAll 与主 View | 不能直接覆盖全部动态分页及延迟注入 |
| Maasea/Bilibili Helper | 明确覆盖 DmView、ViewProgress 等独立来源 | 补齐精确元数据入口；不复制运营商/网络指纹改写 |
| 广泛拒绝、QUIC 全局禁用、API 代发重试 | 缺少当前设备证据，且可能影响动态刷新与播放 | 不采用；本轮无请求 body、签名、媒体 URL 或网络头伪造 |
| JSC + 本地 gzip | 无 Worker、DecompressionStream 或 $utils 时也可完成 gzip 过滤 | 固定 fflate 0.8.3 构建内嵌；CRC/长度校验，串行帧、合计 4 MiB 限制 |

上述是检索并实际核对的主要公开实现，不声称穷尽所有私有或未来模块。

## 新增 endpoint 覆盖

所有下列新增 row 均为 `volatile=true, requestGuard=true, responseFilter=true`，
runtime 为 `enhance`；CDN-only 不取得这些过滤行为。

| registry id | host | path / RPC | transport / handler |
| --- | --- | --- | --- |
| grpc-dynamic-video | app.bilibili.com / app.biliapi.net / grpc.bilibili.com / grpc.biliapi.net | /bilibili.app.dynamic.v2.Dynamic/DynVideo | grpc / grpc-dynamic-video |
| grpc-dynamic-all-personal | 同上 | /bilibili.app.dynamic.v2.Dynamic/DynAllPersonal | grpc / grpc-dynamic-personal |
| grpc-dynamic-video-personal | 同上 | /bilibili.app.dynamic.v2.Dynamic/DynVideoPersonal | grpc / grpc-dynamic-personal |
| grpc-dm-view | 同上 | /bilibili.community.service.dm.v1.DM/DmView | grpc / grpc-dm-view |
| dynamic-web-feed | api.bilibili.com / api.biliapi.net | /x/polymer/web-dynamic/v1/feed/all | json / dynamic-web-feed |

这些是**本仓库新增覆盖的已有接口**，不是声称在 9.9.0 抓包中发现了新 RPC。
DmSegMobile、DmPlayerConfig、投票/点赞/已读更新等写入接口未扩展匹配。
没有增加媒体 MITM、媒体域拒绝或 QUIC/TCP 强制回落。

## 字段路径与保留规则

| 载荷 | 确认路径 / 操作 |
| --- | --- |
| DynAll / DynVideo | dynamic_list(1).list(1) -> DynamicItem.card_type(1)=15/18，或 modules(3).module_ad(14)：移除整个广告卡 |
| Dynamic 附加商品 | DynamicItem.modules(3).module_additional(8) -> type(1)=2 / goods(3)：仅移除商品模块，保留原视频、正文及其他附加模块 |
| Dynamic 商业推荐 | modules(3).module_recommend(18).ad(6)：移除该推荐模块及绑定展示内容 |
| DynAllPersonal / DynVideoPersonal | 顶层 list(1)，不错误套用 DynAll 的双层 list；offset、has_more、read_offset、relation 按原字节保留 |
| Web Dynamic | data.items[] 的明确广告字段；data.items[].modules.module_dynamic.additional.type=ADDITIONAL_TYPE_GOODS 置 null；普通 prose、vote、major、offset、baseline 不变 |
| ViewUnite / AIRelateAsync | 主 View.tab(5).tab_module(1).introduction(2).modules(2) 与 async.module(2).modules(1) 复用 Module.type(1) 排除值，含商品 55；不猜商品载荷 oneof 编号 |
| JSON View | 已审核 modules 集合中的 type=55/MERCHANDISE；不在普通 video/basic/未知对象里遍历数值 55 |
| DmView | activity_meta(18) 移除；command(22).command_dms(1) -> command(4)、extra(9) 的明确商业/小程序/商品结构；普通命令、subtitle、mask、配置、QoE 保留 |
| PlayerUnite | 已有 view_info(9).dialog_map(1)/prompt_bar(2)/toasts(3) 清理逻辑恢复单一响应 owner；媒体字段和自己的完整签名 URL 不变 |

不以普通标题里的“广告、推广、闲鱼、魔力赏、商品”作为删除依据。首页六条普通
视频和两级非空 fallback 未改变；v3.10.1 的全商业页不恢复广告策略也未回退。

## 传输与后台恢复

1. 精确请求守卫删除大小写混合的 If-None-Match/If-Modified-Since/If-Range，设置
   `Cache-Control: no-cache, no-store, max-age=0`、`Pragma: no-cache`，gRPC 协商
   `gzip,identity`。不改 URL/query/body/Authorization/Range。
2. 响应包括 changed=0、原样放行和压缩失败的已匹配元数据，都去除可复用的旧缓存
   元数据。body 改写后才移除 HTTP Content-Encoding，原样 gzip 帧保留 grpc-encoding。
3. gRPC 错误状态和错误正文保持原样；不把非零 grpc-status 或 HTTP 503 伪装成成功。
   有 trailers 时保留 trailers。旧 bili-inter 成功头例外继续保留，其他 engine=1
   客户端不因 UA 品牌变化而丢失成功状态。
4. 解压后发生任一帧错误，返回**整份原响应**，不输出部分已过滤的混合状态。
5. 新鲜 JSC VM、冷启动/刷新/30 秒/5 分钟/30 分钟标签下的相同请求 fixture 输出
   一致；这验证的是处理函数无生命周期依赖，**不是实际 iOS 挂起实验**。
6. 没有网络请求时，模块无法访问已解码的 App 内存/本地数据库。必须靠初次响应
   过滤、no-store 和真实刷新请求减少重现；不伪造 scene hook、cache-buster 或 304 正文。

## 修改文件

- 源码：src/bilibili-endpoints.js、bilibili-enhance.js、bilibili-refresh.js、
  bilibili-cdn.js；新增 bilibili-gzip.js。
- 构建/配置：scripts/build.mjs、config/module-options.json、package.json、
  新增 package-lock.json、.github/workflows/ci.yml、release.yml。
- 测试：新增 test/bilibili-ios990.test.js 与两个 9.9.0 JSON fixture；增强 endpoint、
  refresh、headers、module/CI 回归。旧的“把错误状态 7 改成 0”测试假设修正为成功
  状态 fixture，并新增保留非零错误的反向断言；没有删除或跳过既有测试。
- 文档：README、CHANGELOG、THIRD_PARTY_NOTICES、PROTOBUF_COMPATIBILITY、
  DEVICE_ACCEPTANCE、V3_ARCHITECTURE、UPSTREAM_RESEARCH、本审计和抓包指南。
- 站点：site/package.json、锁文件、app/layout.tsx、app/Customizer.tsx、
  tests/rendered-html.test.mjs；保留设计和
  hosting project。构建自动打包更新后的配置/模块快照。
- 发行：dist 下三个模块、JS 运行时、modules.list、module-options.json、SHA256SUMS。
  mediaRoutes v9 与 benchmark 的源算法未修改，媒体路由运行时仍保持原字节。

## 验证结果

| 命令 | 实际结果 |
| --- | --- |
| npm install | 成功，新增固定 fflate 0.8.3 及根锁文件 |
| npm ci --ignore-scripts --offline --no-audit --no-fund | 成功，验证根锁文件可重装 |
| npm run build | 成功，所有发行产物经构建生成 |
| npm run check:all | 成功：核心 197/197、站点 4/4、确定性 build:check、lint 与生产构建通过；不跳过测试 |
| npm run smoke:auto | 成功：cosov 与完整 Akamai 签名样本均返回 206、1,048,576 bytes、总长度 17,828,788；elapsed 1,588/2,912 ms；策略输出 alternative-failed、descriptors=6，未强制晋升 |
| git diff --check | 成功；新增文件另查行尾空白通过 |

核心测试由 177 增至 197，新增 20 个专项用例。测试阶段发现站点断言仍固定旧
版本，已同步为 3.11.0/9.9.0 并增加 JSC、动态商品说明断言，没有删除测试。
生产构建保留原有 Node glob 实验提示，不影响成功结果。

最终模块 SHA-256（其余运行时见 dist/SHA256SUMS.txt）：

```text
9e418df981fc9715aa6177e5b0080696b5e17562e2967115c4c400418210318f  Bilibili.CDN.Enhanced.sgmodule
9e418df981fc9715aa6177e5b0080696b5e17562e2967115c4c400418210318f  Bilibili.CDN.sgmodule
514203b5fde73f33792b4dffb98a7e5735ad4cbbddb9246b1bda26ddea824dee  Bilibili.CDN.Switcher.sgmodule
```

媒体路由运行时仍为
`28cf06d90a005cc0e1e220e1d3be36a518b67126d1ff090d3e2ce6f935882cef`，与 v3.10.1 相同。

真机状态：**国内 9.9.0 / 新海外版均未验证**。本审计记录代码与自动测试结果，
发布状态以 GitHub Release 和 BiliFlow 线上版本为准；复测前请确认模块与运行时均为 3.11.0。
请按 [BILIBILI_9_9_CAPTURE.md](BILIBILI_9_9_CAPTURE.md) 补交实际请求证据。

## 主要可复核来源

- [中国 App Store](https://apps.apple.com/cn/app/id736536022)、
  [美国 App Store](https://apps.apple.com/us/app/bilibili-all-your-fav-videos/id736536022?platform=ipad)。
- [BiliUniverse 状态头实现](https://github.com/BiliUniverse/ADBlock/blob/43b07841fa55ba77e29d478cab0be44c8b49a3c2/src/function/fixHeaders.mjs)。
- [Sparkle protobuf 与 handler](https://github.com/kokoryh/Sparkle/tree/110029696d66a3f3aef8f6546de9d494513c2901/src/script/bilibili/protobuf)、
  [ViewUnite 模块定义](https://github.com/kokoryh/Sparkle/blob/110029696d66a3f3aef8f6546de9d494513c2901/proto/bilibili/app/viewunite/v1/view.proto)。
- [Dynamic v2 完整公开定义](https://github.com/yllhwa/RSSWorker/blob/b4057baefdbc8ecab951cd51d6e0f5e72109b8c9/src/lib/bilibili/bilibili/app/dynamic/v2/dynamic.proto)、
  [DmView 完整定义](https://github.com/yllhwa/RSSWorker/blob/b4057baefdbc8ecab951cd51d6e0f5e72109b8c9/src/lib/bilibili/bilibili/community/service/dm/v1/dm.proto)。
- [Web Dynamic JSON 结构](https://github.com/pskdje/bilibili-API-collect/blob/271b123a083698bf576101c21f534b3418768a43/docs/dynamic/all.md)。
- [fflate](https://github.com/101arrowz/fflate)、
  [Shadowrocket 官方商店版本记录](https://apps.apple.com/us/app/shadowrocket/id932747118)。
