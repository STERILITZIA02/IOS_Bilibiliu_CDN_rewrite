# v3.16 HTTP 与 HTTPS 媒体支持及 BTR 自动并发修复

日期：2026-10-06。基础版本：v3.15.0。原始设备日志和详细分析保留在用户本机，
不发布媒体路径、签名、账号、设备或网络标识。

## 日志确认的生效缺口

用户实测中，可关联完整点播 URL 的 32 个连接流都使用 HTTP/80；v3.15 的 BTR
模块 matcher 和 `mediaUrl()` 仅接受 HTTPS。基础 refresh/enhance/cdn 脚本可见执行
记录，BTR 没有执行记录。因此能够确认这些可见 HTTP 媒体没有被 v3.15 接管，
不能把用户看到的速度称为 BTR 自动并发的实测速率。

日志缺少 Range 头、分块字节量和播放器缓冲数据，不能据此计算吞吐，也不能把
Socket closed 的连接生命周期或 DNS 空闲回收当成媒体超时。另有未解密的 TLS
连接，其具体 URL 与 BTR 命中情况不能推断。

## 协议和运行时修复

- 模块 matcher 由运行时的 `REQUEST_PATTERN` 生成，同时支持 HTTP/80 和 HTTPS/443。
  省略默认端口和显式默认端口均可，协议与端口不符、非标准端口及未知域名仍不接管。
- 保留原始协议、完整路径和签名查询，不强制升级、降级或改写 URL。跨 CDN 候选也
  保持本次协议。最终响应 URL 只允许默认端口等价，不允许跨协议、路径或查询漂移。
- 零长度 ArrayBuffer/Uint8Array 不再被误判为带请求体；真实非空 GET body 仍不处理。
- 原生 callback 同时存在 text 与 bodyBytes 时优先使用二进制字段；无法取得二进制
  数据时明确报告 binary-unavailable，绝不把文本编码后充当媒体字节。
- 原样保留条件请求、认证请求、开放/多范围及未知格式。小于 256 KiB 的请求跳过
  分块以减少起播/索引开销；4 MiB 默认总范围限制仍有效。

## 与原仓库的实现对应

再次读取并对照 [Bilibili-thread-ripper 固定提交](https://github.com/MrTangLuyao/Bilibili-thread-ripper/tree/bbf4d3dee502a16e424232ae6a51705f52b0e60d)。
MIT 版权与许可继续保留在发行脚本中。用户在 Chrome 上的正常效果是有效反馈；
下面区分原仓库方法与本项目在短生命周期代理脚本中的适配。

| 上游实现 | v3.16 的对应行为 |
| --- | --- |
| `Semaphore.drainQueue/acquire` 及时释放和补充下载槽位 | 取消 Promise.all 整批屏障，任一块完成立即补任务；并发下降时让在途任务完成，不重下成功块 |
| `createAutoConcurrency.throughput/saturation/judgeTrial` | 只用有效完成字节和有负载的窗口；达到实际并发、负载占比足够且样本足够才参与决策，不把重试数据或空闲当成收益 |
| `AUTO_STEP_COOLDOWN_MS=2500`、无收益回退与冷却 | 相邻升档至少 2.5 秒；无收益回退并冷却 90 秒，限流独立退让；冷却到期允许重新探索 |
| 页面内持续保存线程数和试探 | v2 有界状态在隔离脚本之间保存采样及试探基线；30 秒无法测量的试探回退，不再出现“末尾升到 3，下一次又回到 2”的空转 |
| `recordMeter`、`adaptiveMinChunk` | 48 KiB 以下短尾不更新线路速度；0.7/0.3 平滑传输测量，0.6 秒目标、64 KiB–1 MiB 范围，并结合剩余字节保留足够并发块 |
| `assignPrimaries` 平滑加权轮转 | 所有通过同一性验证的候选都得到初次测量，之后按实测速率分配；避免固定 75/25 分配及第三个候选长期没有任务 |
| CDN resolver 的地址/节点区分和成功恢复 | 签名或条件错误不扩散到其他地址；成功传输清除本请求的暂态故障计数；429 仍参考 Retry-After |

原仓库主要代码：[下载调度器](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/src/idm-downloader.js)、
[CDN resolver](https://github.com/MrTangLuyao/Bilibili-thread-ripper/blob/bbf4d3dee502a16e424232ae6a51705f52b0e60d/src/cdn-resolver.js)。

本项目仍不伪造原生 App 没有暴露的缓冲余量、播放时钟或中间字节进度。Chrome 的
MSE 接管、按播放截止时间预取和精确中途补尾没有直接移植；并发上限仍为 8，
整体大小/时间预算与资源保护仍保留。

## 诊断和性能证据

默认首次及每 30 秒至多一条 `[BiliBTR]` 脱敏摘要，包含 HTTP/HTTPS 数量、各原因
计数、完成字节和并发请求峰值。调试模式增加每次请求的 elapsedMs、deliveredMiBps、
peak、threads 和 nextThreads。后者是后续试探档位，不冒充当前已发生的并发。
摘要的存储和日志均不含 URL、路径、签名、正文、Cookie 或 SSID。

8 项针对旧缺口的用例在修改前全部失败。新增覆盖两协议/端口、空请求体、规范化端口、
慢块期间补任务、跨上下文学习、冷却恢复、原生二进制优先级和诊断隐私；继续执行原有
媒体一致性、回退、限流、取消、广告/UI 及网站测试。

最终检查：核心 **286/286**、站点 **4/4** 通过；确定性构建、站点 lint 和生产构建通过。

离线调度模型使用同一 4 MiB 数据、固定 2 路、3 轮交替顺序比较旧版与新版，全部
重组字节一致：

| 模型 | v3.15 中位耗时 | v3.16 中位耗时 | 请求数变化 |
| --- | --- | --- | --- |
| 高 RTT | 1075 ms | 866 ms | 9 → 5 |
| 一个慢块 | 790 ms | 603 ms | 9 → 5 |

这些是模型结果，不是手机或 CDN 保证。复现脚本为 `scripts/benchmark-btr.mjs`，
可用 `--baseline=/path/to/old-runtime.cjs` 指定旧版本。

本机匿名公网、相同 2 MiB Range 的最终检查：

| 协议 | 原始下载 | BTR | SHA-256 | 实际请求峰值 / 下一档 |
| --- | --- | --- | --- | --- |
| HTTP | 1893 ms | 1555 ms | 一致 | 2 / 3 |
| HTTPS | 1570 ms | 1563 ms | 一致 | 2 / 3 |

网络会波动，HTTPS 这次基本持平。不能将两次样本宣传为普遍提速，也不能将桌面
匿名检查当作手机验收。`npm run smoke:btr -- --scheme=http` 与 `--scheme=https`
分别复核两个协议，不使用用户日志里的签名或账号。

## 更新与复测

1. 在 Shadowrocket 更新 **Bilibili BTR Experimental** 本身，确认模块和脚本版本键
   为 3.16.0；仅更新 Enhanced 不会替换附加模块的旧 matcher。
2. 保持启用加速=true、并发数=auto、CDN模式=original，重新应用配置并重开 App。
3. 查看摘要是否出现 `accelerated` 与完成字节。`range-open/large`、`busy`、`backoff`
   等为原样通过原因；脚本执行或提交请求峰值不等于播放器已消费数据或独立 TCP 数量。
4. 固定视频、清晰度和网络，交替测试启停整个 BTR 模块，记录起播、缓冲、快进、
   清晰度切换及音画同步。若仍慢，开启调试后新日志能区分未覆盖请求与已加速后的瓶颈。

原始手机日志未包含新版本运行，因此真机复测尚未完成。
