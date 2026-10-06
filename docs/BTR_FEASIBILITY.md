# BTR 在官方 iOS App 和 Shadowrocket 中的接入可行性

> 后续进展：用户随后要求尽可能实现移植。v3.15.0 已增加独立 BTR 实验模块，
> 支持有界并发与动态线程数；当前实现、测试及未能移植的能力见 [BTR 移植说明](BTR_PORT.md)。
> 下文保留实现前的可行性核对记录。

## 2026-10-06 真机证据后的状态

- 已验证：v3.16.2 能在手机运行，自检参数与存储正常；实际媒体请求能够被处理。
- 已观察：原生 App 的开放式 Range 被以 `range-open` 放行，没有启动并发。
- 尚未完成：开放式 Range 的完整、持续交付；可靠取消；真机成功分块回包与播放收益。
- 这次证据不支持继续把“未启用/脚本未安装”作为该请求的解释，也不足以宣称所有
  请求都有相同的放行原因。当前一次性回包适配无法直接替代浏览器的 MSE 分段交付。
- 后续实现必须先验证原生流式写回能力，或证明其他方式完整保留请求语义和播放器
  连续读取；单纯提高线程数、截短开放范围或放宽内存上限不构成完成移植。

以下是 v3.14.0 时的原始核对记录，涉及“尚未注册媒体脚本”等描述属于当时状态。

核对日期：2026-10-06。使用约束：官方 Bilibili iOS App + Shadowrocket，不增加设备、
辅助服务器或第三方播放器。当前项目基线为 v3.14.0 / `b687f104e8b92b3bad0629f8f1f6f027bd66a97c`。

**结论：BTR 不能作为现有 CDN 脚本的直接替换文件。它的核心收益来自实际媒体下载的
分块并发与调度，单独复制 CDN 列表或评分算法不能得到相同收益。** 在现有使用约束下，
可以吸收选路和失败分类方法；有界 Range 聚合是另一个需要真机验证的实验方向，尚不能
作为正式替代方案。本轮完成源码审查和离线验证，没有修改正式运行脚本或发布新版本。

## 上游快照和实现

- [Bilibili-thread-ripper](https://github.com/MrTangLuyao/Bilibili-thread-ripper/tree/bbf4d3dee502a16e424232ae6a51705f52b0e60d)
  实际读取的 main 提交为 `bbf4d3dee502a16e424232ae6a51705f52b0e60d`，
  版本 `2026.10.4.1`，提交日期 2026-10-04。
- [MIT 许可证](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/LICENSE)
  允许复用；分发源码或实质性改编时需保留原版权和许可证。本轮没有把上游源码加入发行物。
- [README 的手机说明](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/README.md)
  明确表示暂不开发手机版，并说明通过移动代理重写能做的优化有限。
- [Windows 桌面版的差异说明](https://github.com/MrTangLuyao/Bilibili-thread-ripper-desktop/blob/main/difference.md)
  描述的是向 Electron 客户端接入下载器，不是可供 iOS 直接配置的远程加速节点。

| 上游文件 | 已核对的作用 | 对当前项目的含义 |
| --- | --- | --- |
| [range-core.js](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/src/range-core.js) | 解析闭合字节范围、拆块、按序拼接 | 纯计算部分可移植，但本身不提供下载入口 |
| [cdn-resolver.js](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/src/cdn-resolver.js) | 按实际传输更新速度；区分节点、地址和地址节点组合的失败；保留探索机会 | 失败分类值得吸收，实时评分依赖持续收到媒体传输结果 |
| [idm-downloader.js](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/src/idm-downloader.js) | 共享并发预算、自适应块大小、断点补尾、慢请求备份、取消和限流退让 | 这是主要提速能力，需要真正接管媒体请求 |
| [native-mse-player.js](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/src/native-mse-player.js) | 接触 video/MediaSource/SourceBuffer、音视频索引、播放缓冲和拖动生命周期 | Shadowrocket 脚本不能直接访问另一个原生 App 的播放器对象 |
| [native-range-transport.js](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/src/native-range-transport.js) | 兼容模式 hook fetch/XHR；完整验证并聚合一个 Range 后回包，仍依赖页面轨道和质量状态 | 证明整段聚合有实现路径，但浏览器适配层不能直接搬到代理脚本 |

BTR 对单路吞吐不足、部分节点停传的情况有针对性。若瓶颈在共同出口总带宽、API 或
DNS，分块并发不能自动消除瓶颈。浏览器上游的测速和用户口碑不能当作当前 iPhone
链路的实测结果。

## 当前插件与 BTR 的关键差异

当前 `src/bilibili-cdn.js` 只在播放 JSON/gRPC 中重排同一媒体对象的完整服务端候选。
`src/bilibili-cdn-benchmark.js` 使用匿名样本在后台测量；它看不到当前视频的持续下载
速度、缓冲余量、播放倍率或拖动事件。`scripts/build.mjs` 不注册媒体请求处理脚本，
媒体 CDN 不在默认 MITM 范围。

因此，当前模块既没有自己强制播放器只开一条连接，也不能指挥原生播放器把一个
Range 分成多路。BTR 是在下载层主动增加并行请求；“并行 HTTP 请求”也不一定等于
“多条 TCP 连接”，实际还取决于客户端连接池和 HTTP/2 复用。

现有 API 脚本配置了 8–10 秒超时和 4 MiB 正文上限，后台任务配置了 45 秒预算。
这些是本仓库的配置，**不是 Shadowrocket 全局不可调整的硬上限**。增加这些参数
仍无法让脚本访问原生播放器，也不能证明取消、内存和持续流式回包能力已经满足需要。
当前 `$httpClient` 适配器只有完成回调；本轮没有取得设备版本支持端到端流式转发、
客户端取消通知及跨脚本共享调度器的证据，不能把这些能力当作现成接口使用。

需要特别避免两个错误推论：

1. 不能因为 BTR 全接管需要 MSE，就断言所有纯代理分块方案都不可能。它的兼容模式
   本来就完整聚合单个 Range；理论上可以另写代理适配器。
2. 也不能因为 JavaScript 可以 `Promise.all`，就认为已经能在 Shadowrocket 稳定
   运行 BTR。原生 App 的媒体请求、取消、并发总量和回包协议都需要独立验证。

## 可移植能力和优先级

| 方向 | 当前约束内的判断 | 建议实现边界 |
| --- | --- | --- |
| 区分地址失效与节点故障 | 可在后台选路中实现，优先级最高 | HTTP 403、404、鉴权失效先按对象或地址隔离；需要其他地址成功等证据再归因到主机 |
| 限流和恢复策略 | 可在后台选路中实现 | 429 按限流处理并参考 Retry-After；412 保留前置条件语义，不直接照搬上游一律当限流；传输故障用独立退避 |
| 采样置信度、衰减和少量重新探索 | 可改善当前评分 | 保留多对象证据、网络隔离和活动让路；不能直接照搬 BTR 90 秒过期，因为我们没有每个媒体块的新样本 |
| 按当前视频实时缓冲自适应并发 | 现有 API 重写层不具备条件 | 不用历史匿名吞吐伪装实时 buffer/currentTime 信号 |
| 分块并发、断点补尾、慢块备份 | 需新增媒体下载接管，实验可行性待真机确认 | 先验证同一完整 URL 的少量有界请求；避免一开始就跨 CDN 拼接 |
| 全接管 MSE、按播放时间预取、拖动时清 SourceBuffer | 不能通过现有 Shadowrocket 接口直接移植 | 保留官方 App 的播放器生命周期 |
| BTR 直播 P2P hook 和 fMP4 预取 | 不是点播选路的直接替换 | 不把网页 SDK hook 改写成全局 PCDN/DNS 拒绝规则 |

已确认的具体改进点：当前 `recordHostSample()` 把失败样本计入主机级熔断；离线调用
中，同一个对象的两次 HTTP 403 可让该主机熔断两小时。这是一个可以复现的归因过宽
边界，不能据此断言它就是用户此前所有卡顿的原因。BTR 的节点/地址/组合分类能作为
改进依据，但需要适配现有匿名样本模型，不能直接使用浏览器会话里的地址状态。

## 纯 Shadowrocket 分块实验的实现方法

以下是候选设计，不是已支持的配置。按“能力验证 → 单 URL 有界下载 → 同设备 A/B”
推进；任何关键能力不能确认，就保留现有安全选路。

1. **先验证代理运行时。** 仅对一个受控媒体请求验证请求脚本合成二进制 206、准确
   回传 Content-Range/Content-Length、内部请求不递归、超时后只完成一次，以及
   客户端取消后是否能及时停止内部下载。不能只在 Node 模拟这些接口后宣布兼容。
2. **首版只拆同一完整签名 URL。** 只处理 GET 和闭合单段 `Range: bytes=a-b`；
   可从 2 路、256 KiB–1 MiB 请求窗口开始测量，具体门槛由手机数据决定。HEAD、
   开放范围、后缀范围、多范围、If-Range/其他条件请求、未知媒体均直接保留原行为。
   初始化和索引小请求先不拆；不修改 codec、质量、时间戳或音视频索引。
3. **从请求侧接管，而非响应下载完再重下。** 先确定可以承接，才发子请求。验证
   每个响应的 206、起止、总长、实长、编码和对象版本，按偏移拼回一次完整响应。
   在尚未给 App 回任何媒体字节时才能放弃并交回原请求；不能把不完整片段包装成成功。
4. **先处理并发与内存。** 单次脚本两路不等于全局两路：音频、视频和预加载会同时
   触发多个实例。普通 persistentStore 的读写不能假定是原子锁。必须验证全局限额或
   明确的并发降级机制，以及分块、拼接和跨引擎回包的峰值内存。
5. **再评估慢请求备份。** 没有中间进度时，不能准确实现 BTR 的 ETA 或只补剩余
   字节；固定时延复制请求可能增加拥堵。先证明基本并发有收益，再加入有流量上限的
   备份，并保证取消不计作节点故障。
6. **跨 CDN 最后考虑。** 只选当前响应已有的同一表示完整候选，验证对象一致性和
   条件请求语义。总长度相同、路径相同或几个样本相同，都不能单独证明整个文件逐字节
   等价。不能拿 BTR 的主机拼接函数直接恢复 v3.13 已移除的裸换 host 行为。

此方案需要把明确的媒体主机加入 MITM，会改变当前模块“媒体字节不经过脚本”的
边界。完整聚合还会增加向 App 交付首字节前的等待；若真实瓶颈是连接总带宽，额外
请求可能更慢。是否值得启用，必须由同一部手机上的播放和资源占用结果决定。

## 离线验证和未完成的验证

在上游固定提交运行：

```sh
node --test dev/shared-core-test.js dev/auto-concurrency-test.js dev/optimization-test.js
```

结果：**53 项通过，0 失败**。这是下载核心、自动并发、重试和调度的 Node/模拟传输
测试；没有运行完整浏览器测试，也没有宣称 Shadowrocket 或 iOS App 已通过验收。

额外三项合成检查均得到预期结果：

| 检查 | 观察 | 解释边界 |
| --- | --- | --- |
| 只提供一个 Akamai URL，调用 BTR 大陆候选生成 | 生成 8 个大陆 CDN URL | BTR 确实会派生主机；不能推导这些 URL 对真实手机上的每个签名都有效 |
| 当前项目对同对象记录两次 403 | 主机熔断 7,200,000 ms | 支持改进失败归因；不是对用户真实卡顿的归因 |
| 两个模拟主机给出相同总长和合法 Range，但不同字节内容 | BTR 聚合 4 块、共 524,288 字节并返回 | Range 位置与长度校验不是跨主机字节同一性证明；没有观察到真实 CDN 损坏 |

上面三项没有访问真实媒体或用户账号。临时验证脚本和日志存放于本机临时目录，
不是新的模块功能。正式脚本未变化，因此本轮没有重跑与此次检查无关的全部去广告测试。

真机实验至少应对比：原始 CDN、当前 auto、实验分块；使用相同网络、视频、编码和
清晰度，交替次序测试热门/冷门 UGC、音频和高码率轨道。记录首帧等待、缓冲总时间、
前后拖动后的恢复时间、异常解码/音画偏移、总请求数和流量、VPN/脚本内存及取消回收。
包含长暂停恢复、Wi-Fi/蜂窝切换、后台恢复、切清晰度/倍速，以及服务端 403/429。

[上游更新记录](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/CHANGELOG.md)
仍有近期播放器适配修复；[Issue 33](https://github.com/MrTangLuyao/Bilibili-thread-ripper/issues/33)
报告音视频短暂重复，[Issue 35](https://github.com/MrTangLuyao/Bilibili-thread-ripper/issues/35)
涉及番剧覆盖。这些是上游个别报告，不能外推为全部用户都会出现，也不构成 iOS 已兼容
的证据。HTTP Range/If-Range 的正确处理参考
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-range-requests)。

**建议推进现有选路的失败分类和证据衰减；把有界分块列为独立实验。** 在用户限定的
官方 App + Shadowrocket 组合下，目前没有证据支持完整 BTR 能直接替换正式 CDN 模块。
