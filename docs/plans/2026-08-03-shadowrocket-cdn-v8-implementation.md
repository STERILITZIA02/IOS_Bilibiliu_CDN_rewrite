# Shadowrocket CDN v8 与 Relate Story 实现计划

> 执行要求：逐任务按测试驱动完成；每个实现步骤先观察目标测试失败，再写最小实现，最后运行相关回归。

**目标：** 将 CDN 学习移出 Bilibili 播放响应热路径，使用 Shadowrocket cron 维护跨对象主机评分；冷启动稳定回退到服务端完整 Akamai URL；补齐 Bilibili 9.5.0 `/x/v2/feed/index/relate/story` 去广告和缓存守卫。

**架构：** `src/bilibili-cdn.js` 只同步读取有界的 v8 host state 并重排当前响应 URL。新 `src/bilibili-cdn-benchmark.js` 在 cron 上下文中获取匿名公开 playurl、执行严格内部 Range 测试并写入同一状态。Story combined runtime 负责新端点的一次性广告过滤与 CDN 重排。

**技术栈：** ES5-compatible Shadowrocket runtime、Node.js 22 测试、`node:test`、生成式 `.sgmodule` 构建。

---

## 任务 1：补齐 Relate Story 请求与响应链路

**文件：**

- 修改：`test/bilibili-refresh.test.js`
- 修改：`test/bilibili-enhance.test.js`
- 修改：`test/module.test.js`
- 修改：`src/bilibili-refresh.js`
- 修改：`src/bilibili-enhance.js`
- 修改：`scripts/build.mjs`

**步骤：**

1. 新增失败测试，证明 `/x/v2/feed/index/relate/story` 被分类为 Story、请求校验头被移除、响应 no-store，广告项删除而普通 `vertical_av` 保留。
2. 新增模块生成失败测试，要求 Story/Refresh matcher 精确覆盖 `story`、`story/cart`、`relate/story`，且同一响应只进入 Story Safe Pipeline。
3. 运行三个目标测试文件，记录失败。
4. 最小扩展 classifier 和两个 pattern；复用现有 Story handler，不新增宽泛递归删除。
5. 重新运行目标测试直至通过。

## 任务 2：定义 v8 主机状态与稳定评分

**文件：**

- 修改：`test/bilibili-cdn.test.js`
- 修改：`src/bilibili-cdn.js`

**步骤：**

1. 新增 v8 空状态、损坏状态恢复、容量、TTL、网络档案隔离和 v7 不迁移测试。
2. 新增主机样本记录与评分测试：p25 吞吐、失败率、抖动、不同对象数、连续失败熔断。
3. 新增资格测试：至少两个对象、6 小时新鲜度、25% 失败率上限、表示带宽余量。
4. 运行 CDN 测试并确认失败。
5. 实现有界状态解析、统计和稳定主机选择；完整 URL、query、正文不得写入状态。
6. 运行 CDN 测试直至通过。

## 任务 3：把播放响应热路径改为零测速

**文件：**

- 修改：`test/bilibili-cdn.test.js`
- 修改：`src/bilibili-cdn.js`

**步骤：**

1. 新增失败测试：`auto`/`cron` 对每份 JSON、gRPC 和 Story 响应的 probe 调用数恒为 0，且 `$done()` 后无持久写入。
2. 新增冷启动测试：当前响应含完整 Akamai 时立即重排；缺少完整 Akamai 时保持服务器主 URL；永不裸换 Akamai host。
3. 新增 host-level 跨对象测试：新鲜、双对象验证的非 Akamai alias 可复制当前主 URL并仅替换 hostname；过期、熔断、单对象 alias 不可用。
4. 新增备选顺序和去重测试，确保原主 URL 始终保留。
5. 删除/旁路 auto 热路径的 nonblocking probe 调度；把旧 `nonblocking` 参数归一化为 `cron`。
6. 保留显式 `blocking` 诊断路径和 fixed/off 行为。
7. 运行全部 CDN 测试。

## 任务 4：实现 Shadowrocket cron 后台测速

**文件：**

- 新建：`src/bilibili-cdn-benchmark.js`
- 新建：`test/bilibili-cdn-benchmark.test.js`
- 修改：`scripts/build.mjs`

**步骤：**

1. 新增 benchmark core 失败测试：匿名样本轮换、候选去重、挑战者游标、内部 Range 位置轮换、5 秒硬截止。
2. 新增严格验证失败测试：非 206、错误 Content-Range、总长/实长/hash 不一致、压缩、重定向、HTML/JSON 错误体。
3. 新增状态更新测试：单失败保留最后胜者，连续失败熔断，成功样本只保存摘要。
4. 实现可注入 services 的 core；Shadowrocket entrypoint 仅负责 `$httpClient`、`$persistentStore`、`$argument` 和一次 `$done()`。
5. 使用三个公开未登录样本；请求不读取用户 Cookie/access_key/buvid，持久状态不保存完整 URL。
6. 生成 `dist/bilibili-cdn-benchmark.js` 并增加构建一致性断言。
7. 运行 benchmark、CDN 和构建测试。

## 任务 5：生成 cron 模块与更新参数

**文件：**

- 修改：`config/module-options.json`
- 修改：`scripts/build.mjs`
- 修改：`test/module.test.js`
- 修改：`site/tests/rendered-html.test.mjs`

**步骤：**

1. 新增失败测试：所有 CDN variant 恰有一个 `type=cron` 行，带六字段 `cronexp`、`wake-system=1`、硬超时和版本化脚本 URL；无 CDN 的表面不生成。
2. 将默认测速方式改为 `cron`；旧 `nonblocking` 说明改为兼容映射。
3. Cron 每两小时被调度，脚本内部按参数间隔决定是否真正测速；将默认实际间隔调到 2 小时并保持合理上限。
4. 更新参数描述：热路径零测速、完整 Akamai cold fallback、网络档案不自动识别 SSID。
5. 生成模块并运行 module/site 测试。

## 任务 6：提供可重复的匿名桌面基准工具

**文件：**

- 新建：`scripts/benchmark-cdn.mjs`
- 新建：`test/benchmark-cdn.test.js`
- 修改：`package.json`

**步骤：**

1. 把本轮临时诊断中的匿名公开接口、严格 Range、逐主机串行测试和脱敏输出整理成可测试模块。
2. 默认只输出 hostname、状态、Range、TTFB、总耗时、吞吐和摘要；不得读取 PacketTunnel 日志。
3. 增加 `npm run benchmark:cdn`，网络错误返回非零并给出简短原因。
4. 用 mocked fetch/request 测试 URL 不含账号/设备参数、Akamai 只用服务端完整 URL。

## 任务 7：版本、文档与生成产物

**文件：**

- 修改：`package.json`
- 修改：`README.md`
- 修改：`CHANGELOG.md`
- 修改：`docs/V3_ARCHITECTURE.md`
- 新建：`docs/V3_8_AUDIT.md`
- 修改：相关 `site/*`
- 生成：`dist/*`

**步骤：**

1. 将版本提升为 `3.8.0`，同步所有版本化脚本 URL和站点展示。
2. 记录日志根因、16 候选实测、4 MiB 复测、cron 生命周期和 Relate Story 漏口。
3. 明确安装后默认行为、手动网络档案、测速流量、回滚和真机验收步骤。
4. 运行构建并确认产物与源码一致。

## 任务 8：审查与最终验证

**步骤：**

1. 运行相关单测：Refresh、Enhance、CDN、Benchmark、Module。
2. 运行 `npm run check`。
3. 运行 `npm run check:site`。
4. 运行 `npm run check:all`。
5. 获准联网时运行 `npm run smoke:auto` 与 `npm run benchmark:cdn`；记录当前时间和网络位置边界。
6. 检查 `git diff --check`、生成产物一致性和 `git status`。
7. 按 `requesting-code-review` 做独立审查清单；修复发现后重新执行受影响测试。
8. 按 `verification-before-completion` 只基于本轮新鲜输出报告结果和仍需真机验证的边界。
