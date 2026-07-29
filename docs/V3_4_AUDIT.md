# v3.4.0 增量审计：Bilibili iOS 9.5.0

日期：2026-07-29

目标 App：Bilibili iOS 9.5.0，观察到的请求构建号 `90500100`

范围：当前仓库的 Enhanced 去广告/UI 与 CDN 自动选择，不扩展到外部规则

## 结论与证据边界

本次日志中 Enhance、Refresh 和 CDN 脚本都持续执行，长时间后台恢复后仍能看到
新的 Feed、Mine、View、ViewProgress 和 PlayViewUnite 请求，因此根因不是模块整体
卸载。确认的问题是：

1. 9.5.0 的播放页广告可由顶层 CM 之外的 JSON 容器、ViewUnite introduction
   module、ViewProgress VideoGuide/DmResource 和 PlayPause 延迟响应重新注入；
2. 请求侧已禁止条件缓存，但过滤后的响应仍可能保留上游 ETag/缓存寿命；
3. 首页严格过滤后只有四条时，旧实现不会补取合格视频；
4. Mine 的稳定 ID/URI 移入包装对象时，旧 matcher 只检查直接字段；
5. Enhance gRPC 的模块上限仍是 1 MiB，大响应会在进入脚本前被跳过；
6. CDN v3 用 64 KiB 总耗时近似线路质量，且状态键包含精确媒体路径，几乎无法
   把已经验证的线路质量复用于下一条视频。

日志只能证明网络请求与脚本生命周期，不能证明所有 UI 像素或每种账号实验分组。
本文件把“代码/fixture 验证通过”和“9.5.0 真机待验收”分开记录。

## 1. 确认问题（按严重度）

### 严重

- **播放页延迟广告重新出现**：View/ViewUnite 首次响应过滤后，ViewProgress 或
  PlayPause 可再次下发商业素材；1 MiB gRPC 上限还可能让大型 View 响应绕过脚本。
- **CDN 慢线路继续复用**：v3 的 64 KiB 样本易被 RTT 主导，并且旧状态可继续使用
  先前确认的慢主机。

### 高

- **后台恢复后的 Feed/Mine 回流**：新响应会经过脚本，但字段包装迁移和响应缓存
  元数据可使部分元素未命中或被旧副本覆盖。
- **首页只剩四条**：严格白名单正确删除非视频后没有有界补齐路径。

### 中

- **评分学习无法跨视频复用**：精确路径键使两次确认通常落在不同资源项上，
  nonblocking 模式很难建立可用缓存。

## 2. 会直接导致广告偶发漏过的入口

| 入口 | 旧行为 | 直接后果 |
| --- | --- | --- |
| JSON `/x/v2/view` | 只删少量 `cm*` 顶层键 | 新内嵌 player/under-player 容器可保留 |
| ViewUnite introduction | 只处理 18/29/55 | 9.5 模块变体可留在首次渲染结果 |
| ViewProgress | 旧版整段删、新版错误整段删 DM | 要么过度删除正常字段，要么漏掉 VideoGuide/OperationCard 素材 |
| PlayPause | 仅 9.4 build 标签 | 9.5 无适配诊断标签，难以定位暂停广告 |
| Feed/Mine 响应缓存 | 只处理请求头 | 过滤结果仍可能被带 ETag/寿命的旧副本替换 |
| Enhance gRPC 模块 | `max-size=1048576` | 超限响应在 Shadowrocket 层跳过处理 |
| Mine 包装对象 | 只看直接 `id`/URI | 后台异步模块换包装后隐藏项重新出现 |

## 3. 每个入口的修复

- JSON View 只在 `data` 与已知 UI 容器内删除经过审核的精确广告键；未知对象不递归。
- ViewUnite 保留未知 module，处理当前公开 schema 中的已识别商业/运营模块。
- ViewProgress 在旧版只进入 `VideoGuide`；ViewUnite 额外进入
  `DmResource.cards(3)`。删除活动/活动图标 Material、含明确商业证据的兼容素材，
  以及业务类型为预约活动、跳转、预约游戏的 OperationCard；保留普通弹幕、关注卡、
  关注视频/追番卡、其他字段和原始顺序。
- PlayPause 同时识别 9.4/9.5 请求，但仍执行字段级证据过滤，不返回无条件空消息。
- Feed、Story、Mine、View、Splash、VIP 素材/上报等实际过滤响应返回 no-store，
  并移除 ETag、Last-Modified、Age、Expires、Content-Length；`myinfo` 与资源
  `Module/List` 不改响应头。
- Mine 先检查 `item/module/tab` ID 别名和 action/navigation 包装，再使用标题回退；
  只进入已知 UI 容器。
- Enhance gRPC 上限提高到 4 MiB、超时 10 秒；脚本内部解压上限仍是 4 MiB。
- 首页只接受当前验证的普通 AV 卡型；不足六条时最多做一次 2.2 秒同 URL 补取，
  第二份响应独立过滤、去重并只补到六条。

## 4. 广告请求与异步重注入链路

修改前：

```text
请求侧去缓存
  -> 首份 Feed/Mine/View 过滤
  -> 上游缓存元数据仍保留
  -> 后台恢复/暂停/分页异步响应
  -> 新包装或延迟模块未命中
  -> 广告/隐藏项重新渲染
```

修改后：

```text
精确请求侧去缓存
  -> 每份响应独立分类
  -> JSON/gRPC endpoint-specific adapter
  -> 字段级过滤并保留未知数据
  -> 易变过滤响应 no-store
  -> Feed 不足六条时最多一次独立过滤补取
  -> 后台恢复、暂停、结束、分页再次走同一流程
```

## 5. CDN 修改前后流程

修改前：

```text
当前 playurl
  -> 精确媒体路径状态键
  -> 64 KiB Range 总耗时评分
  -> 两次确认难以落在同一资源
  -> 旧 v3 慢线路可能继续复用
```

修改后：

```text
当前 playurl
  -> 先应用未过期的 v4 验证缓存，否则原样返回
  -> 只探测当前响应同对象的主/备 URL
  -> 双方 256 KiB Range + 长度/hash/type/redirect 校验
  -> 吞吐中位数优先，失败率/抖动保护
  -> 两次确认
  -> 已选线路最多每 30 分钟非阻塞复核，退化即清除
  -> 只保存主机 hash 与表示级评分
  -> 下一对象仅从其当前响应映射到完整签名 URL
```

视频、音频、分段、清晰度、codec、表示、网络档案、候选集合和 CDN 家族仍隔离。
分段或缺少稳定表示身份的对象仍使用精确路径状态键。直播 URL 永不改写。

## 6. 首播等待与 probe 变化

- 默认 `nonblocking` 仍不等待 Range probe，缓存未命中时当前播放使用服务端原始 URL。
- 采样从 64 KiB 增至 256 KiB，单次最多验证一个对象的主/备两条 URL。
- 全局探测间隔仍至少 2 分钟；第二次确认间隔从 10 分钟对齐为 2 分钟。
- 第二份成功样本若已显示高抖动，不会晋升；已选线路最多每 30 分钟非阻塞复核
  一次，超时、403、样本不一致或不再更快时清除，下一份响应恢复服务端原始 URL。
- `intervalHours` 仍精确控制 6–72 小时的选择 TTL；30 分钟健康复核不会静默
  缩短 TTL，也不会触发媒体连接重连。
- v3 状态不迁移到 v4，升级后的第一次播放不会继续应用旧慢线路。
- Shadowrocket 若在 `$done()` 后终止回调，可临时使用 `blocking`，在至少间隔
  2 分钟的两次播放地址响应中完成确定性学习，再恢复 `nonblocking`。

## 7. 修改文件与关键内容

- `src/bilibili-enhance.js`：9.5 JSON/gRPC、VideoGuide/DmResource、Feed 补齐、
  Mine 包装、no-store 响应。
- `src/bilibili-cdn.js`：v4 状态、表示级主机评分、256 KiB、吞吐/抖动评分及
  30 分钟已选线路健康复核。
- `scripts/build.mjs`：Enhance gRPC 4 MiB / 10 秒。
- `config/module-options.json`：测速与 v4 学习说明。
- `test/*.test.js`：9.5 生命周期、字段保留、补齐与 CDN v4 回归。
- `site/`：3.4.0/9.5.0 文案与确定性学习提示。
- `README.md`、`CHANGELOG.md`：安装、更新、行为与回滚说明。
- `dist/`：由构建脚本确定性重新生成。

## 8. 保留的现有功能

- 去热搜和运营搜索词；
- 首页/推荐严格六条普通 AV；
- 首页横幅、游戏、应用、直播、PGC 和商业卡过滤；
- 播放页普通视频推荐白名单；
- 首页和“我的”逐项开关、会员营销过滤；
- Splash、VIP materials/report、动态、搜索、评论与直播已有过滤；
- CDN fixed/auto/off、PCDN 策略、reset token、TTL、失败退避；
- gzip、多帧、bodyBytes、uint64、未知字段与损坏输入故障开放；
- 当前响应签名 URL、alias lane、音视频与 codec/表示隔离；
- CDN-only、Enhanced 和历史兼容三个模块入口。

## 9. 回归验证

发布门禁：

```text
npm run check
npm run check:site
npm run check:all
npm run smoke:auto
```

新增 fixture 覆盖 9.5 View JSON 容器、ViewUnite module、
ViewProgress VideoGuide/DmResource 字段级保留、PlayPause build、后台 Mine 包装、
首页一次补齐/no-store、v4 跨对象当前签名映射、256 KiB 吞吐评分和生成模块上限。

2026-07-29 本地最终结果：

- `npm run check:all`：93/93 核心测试、lint、站点构建和 4/4 站点测试通过；
- `npm run smoke:auto`：最终主备均返回同 Range 的 HTTP 206、相同总长度与样本
  hash，严格在线烟测通过；
- 烟测过程中还真实捕获到一次候选 5 秒超时；验证器拒绝该次晋升。该结果直接促成
  两样本高抖动拒绝与 30 分钟已选线路健康复核，而不是把瞬时成功当作永久快线路。

GitHub Actions 结果在发布提交与标签推送后再次记录。

## 10. 证据不足而安全透传的结构

- `myinfo` 正文；
- `Mine/DeviceFeature` 未验证 action；
- 资源 `Module/List`；
- ViewProgress 中 VideoGuide/DmResource 之外的未知容器，以及未知 OperationCard
  业务类型；
- 不含明确商业证据的 PlayPause 字段；
- 未知 Protobuf oneof/module type、未知 JSON 容器；
- 未知压缩、截断、多帧损坏或超过内部上限的消息；
- 任何未由当前 playurl 响应提供的 CDN 主机或完整 URL。

这些结构不会因“可能是广告”而被清空或阻断。

## 11. 真机验收

1. 在 Shadowrocket 更新模块，确认版本 `3.4.0` 且脚本 URL 含 `?v=3.4.0`。
2. 重新应用配置，彻底划掉 Bilibili 后重开。
3. 冷启动、热启动、后台 30 分钟恢复各检查 Splash、首页、“我的”。
4. 首页连续下拉/分页 10 次：每份最多六条且仅普通 AV；若服务端可补足，应为六条。
5. 第一次进入视频，检查播放器下方；再暂停/恢复、拖动、切清晰度、播放结束和连播。
6. 检查短视频、竖屏、稍后再看、PGC/PUGV；确认音画、拖动、清晰度和后台恢复正常。
7. CDN 默认先用 `nonblocking`。若需要立即学习，临时用 `blocking` 完成两次确认后
   改回 `nonblocking`；观察是否仍出现 100–200 KB/s 持续慢速。
8. 若仍有残留，只提供脱敏 endpoint、入口、时间点和最小结构；不要提供 Cookie、
   access_key、SESSDATA、设备 ID 或完整媒体 URL。

## 12. 回滚

1. 先把 `CDN=off`，保留 Enhanced，确认卡顿是否来自选路；
2. 分别关闭广告、首页六条、播放推荐、UI 或会员营销开关定位；
3. 改回 `v3.3.0` Release 的 Enhanced/CDN-only 模块；
4. 最后停用模块恢复 Bilibili 原始网络行为。

回滚不需要清除账号或 App 数据。v4 使用新的持久化键，不会覆盖 v3 状态。

## 公开结构对照

本次只把公开实现当作结构交叉验证，不把第三方“全清空”做法直接复制：

- [Sparkle ViewUnite schema](https://github.com/kokoryh/Sparkle/blob/a26c3412a760fb8d7d4d1bcc124d126e19d630e5/proto/bilibili/app/viewunite/v1/view.proto)
- [Sparkle response handler](https://github.com/kokoryh/Sparkle/blob/a26c3412a760fb8d7d4d1bcc124d126e19d630e5/src/script/bilibili/protobuf/handler.ts)
- [BiliUniverse ADBlock response source](https://github.com/BiliUniverse/ADBlock/blob/43b07841fa55ba77e29d478cab0be44c8b49a3c2/src/process/Response.mjs)
- [Shadowrocket module/script guide](https://github.com/LOWERTOP/Shadowrocket)
