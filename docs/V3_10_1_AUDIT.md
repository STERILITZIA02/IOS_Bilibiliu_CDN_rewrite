# v3.10.1：播放器延迟广告与首页 fail-open 修复审计

> 审计日期：2026-08-23
> 基线：`main` / `2574220e3dfa81972635e4632ebdbc4ba12f1daa` / package `3.10.0`
> 目标版本：`3.10.1`

## 截图与证据边界

用户截图确认了四种仍可见内容：播放器下华莱士联名横幅、MateBook 原生广告卡、
播放数秒后的红果短剧底部广告 Dialog，以及首页魔力赏/抽奖/小游戏卡。截图没有原始
HTTP/gRPC 正文，因此不能证明每张截图实际使用的 host、压缩方式或具体内容值。

公开 `bilibili.app.playerunite.v1.PlayViewUniteReply` schema 明确确认
`view_info(9)`；公开 `bilibili.playershared.ViewInfo` 又确认
`dialog_map(1)`、`prompt_bar(2)`、`toasts(3)`，其中 `PromptBar` 的协议注释即为
“视频下方广告 Banner”。因此本版可以按容器删除，无需从截图文案猜字段号。

## 根因与修复

| 现象 | 根因 | 修复 |
| --- | --- | --- |
| 播放器下横幅/小原生广告 | PlayerUnite 仅由 CDN runtime 处理媒体 URL，Enhanced gRPC matcher 为避免双 `$done()` 没有匹配该响应，`ViewInfo.prompt_bar` 从未过滤 | Enhanced 的现有 CDN gRPC runtime 单独接收 `ads`，在 URL 选路前删除 `view_info(9).prompt_bar(2)`；CDN-only 不传该开关 |
| 数秒提示后底部广告弹窗 | 同一个 ViewInfo 的 `toasts(3)` 提供提示，`dialog_map(1)` 可承载带倒计时、图片和按钮的底部 Dialog | 删除字段 1/3；保留 ViewInfo 未知字段和整个媒体/播放配置 |
| 小程序、游戏播放中弹出 | ViewProgress 只过滤 `DmResource.operation_cards(3)`，没有检查 `command_dms(1).extra(9)` 的结构化广告/小程序/游戏元数据 | 仅删除带 is_ad/commercial、ad/creative ID、mini-program/app/game ID 或已审核 scheme 的 CommandDm；普通 `#UP#` 保留 |
| 首页小游戏/直播或全广告重新出现 | 第一层宽松 AV 过滤后，第二 fallback 只删商业卡而会放回明确非视频卡；最终 `feed-empty-fail-open` 会把全广告原响应返回 | 中性 fallback 同时排除商业和非视频证据；全广告/非视频页先清空并只补取一次，失败保持空而不恢复广告 |
| 后台后 PlayerUnite 广告重现 | PlayerUnite 播放元数据没有进入 UI request guard，旧响应可带 validator/缓存元数据 | 新增精确 request-only registry row；删除条件头、协商 gzip/identity，修改响应统一 no-store |

## 写回与播放边界

- identity、gzip、多帧顺序与未知 protobuf bytes 保留；压缩帧修改后输出 flag=0。
- PlayerUnite 只进入 `view_info(9)`，不修改 `vod_info(1)`、播放配置、历史、清晰度、
  视频/音频 URL、签名、Range 或媒体请求。
- 广告清理和 CDN 选择在同一个现有 runtime 中完成，响应只调用一次 `$done()`。
- CDN-only 的参数中没有 `ads`，相同 PlayerUnite fixture 原样保留商业 UI。
- Chronos、普通 CommandDm、AttentionCard、关注视频/追番、快照与进度点保持不变。

## 自动测试

- 截图等价 PlayerUnite Dialog/PromptBar/Toast fixture。
- gzip + 两帧写回、响应头、未知字段和单次完成。
- Enhanced/CDN-only 参数隔离。
- PlayerUnite request guard 不修改正文、签名或鉴权。
- 直接 feedback-panel 首页广告、小游戏/直播 fallback、全广告零结果补取。
- 商业/小程序/游戏 CommandDm 删除和普通 `#UP#` 保留。
- `npm run check:all` 通过：核心测试 177/177、站点测试 4/4，lint 与确定性构建通过。
- `npm run smoke:auto` 通过：两条真实媒体内部 Range 均返回 206，1 MiB 正文和
  总长度一致；真机尚未执行。

## 仍需真机确认

1. 四类截图在 9.8.0 实际响应中的 host、帧大小和结构值。
2. 后台恢复时是否产生新的 PlayerUnite/ViewProgress/feed 请求并命中脚本。
3. 若完全没有网络请求，记录为 App 内存/本地状态恢复；Shadowrocket 无法回溯修改。

抓包字段见 [`BILIBILI_9_8_CAPTURE.md`](BILIBILI_9_8_CAPTURE.md)。
