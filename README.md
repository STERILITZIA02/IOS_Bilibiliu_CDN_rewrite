# Bilibili Shadowrocket 增强模块

面向 iPhone / iPad 的哔哩哔哩 Shadowrocket 模块，目标系统为 iOS 26 与
iOS 27。它把以下能力放在一个可直接安装、可在 Shadowrocket 内更新的模块中：

- Bilibili 主站、API、图片、点播 CDN 与直播 CDN 分流；
- JSON 与 gRPC / Protobuf 播放地址处理；
- 同一媒体对象内的安全 CDN 验证与自动选择；
- 高置信广告过滤、指定导航/营销入口精简；
- 可选的窄范围 PCDN 请求阻断。

> [!IMPORTANT]
> iOS 27、Shadowrocket 和 Bilibili App 都可能继续改变协议。仓库中的自动化
> 测试不能替代真实 iPhone/iPad 验收；发布前后的真机检查项目见
> [真机验收清单](docs/DEVICE_ACCEPTANCE.md)。

## 下载、安装与更新

- [一键安装到 Shadowrocket][install]
- [直接安装版（main 分支 raw 模块）][raw-module]
- [下载最新发行版模块][latest-module]
- [下载最新发行版校验文件][latest-checksums]
- [查看全部 Releases][releases]

[install]: https://lowertop.github.io/Shadowrocket-First/redirect.html?url=shadowrocket%3A%2F%2Finstall%3Fmodule%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2FSTERILITZIA02%2FIOS_Bilibiliu_CDN_rewrite%2Fmain%2Fdist%2FBilibili.CDN.sgmodule
[raw-module]: https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/dist/Bilibili.CDN.sgmodule
[latest-module]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/latest/download/Bilibili.CDN.sgmodule
[latest-checksums]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/latest/download/SHA256SUMS.txt
[releases]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases

推荐使用 raw 地址安装。它保持不变，后续可以直接在
`Shadowrocket → 配置 → 模块 → 更新模块` 获取新版：

```text
https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/dist/Bilibili.CDN.sgmodule
```

如果一键链接没有唤起 Shadowrocket，请复制上面的地址，在
`配置 → 模块 → ＋` 中粘贴。需要后台更新时，可在
`设置 → 自动更新 → 模块` 开启自动更新，并允许 iOS 的“后台 App 刷新”。

发行版下载适合留档或校验；希望 Shadowrocket 长期直接更新时，仍建议安装
raw 地址。模块的“编辑参数”由 Shadowrocket 单独保存，常规更新通常会保留
用户参数。跨大版本后仍应打开一次“编辑参数”，核对是否出现了新参数。

## 首次启用

1. 安装并启用模块。
2. 把首页的“全局路由”设为 **配置**。国内和海外都应选“配置”，不是“场景”。
3. 打开当前配置的 `ⓘ → HTTPS 解密`，生成 Shadowrocket CA。
4. 按 iOS 提示安装描述文件，然后进入
   `设置 → 通用 → 关于本机 → 证书信任设置`，完全信任该 CA。
5. 回到 Shadowrocket，确认 HTTPS 解密已开启并重新使用当前配置。
6. 完全退出 Bilibili App，再测试首页、普通视频、番剧、评论和直播。

模块会追加以下最小 API 主机，不会把点播或直播媒体 CDN 加入 MITM：

```text
api.bilibili.com
app.bilibili.com
interface.bilibili.com
api.biliapi.net
app.biliapi.net
grpc.bilibili.com
grpc.biliapi.net
api.live.bilibili.com
```

HTTPS 解密页面中如果还出现 `google.cn`、`googlevideo.com` 等主机，通常来自
其他已启用模块或原配置，不是本项目添加的 Bilibili 范围。

只需要域名分流、不需要 CDN/广告/UI 功能时，可以不启用 HTTPS 解密；此时
响应脚本不会生效，但 `[Rule]` 分流仍可工作。

## 国内与海外应该怎样配置

“全局路由”一律选择 **配置**。“场景”只是 Shadowrocket 的可选自动化入口，
不是本模块在国内使用的前提。

| 使用位置 | `分流策略` 建议 | 说明 |
| --- | --- | --- |
| 中国大陆 | `DIRECT` | Bilibili API、视频与直播直接连接。 |
| 海外，有中国大陆回国节点/策略组 | 填写该策略组的准确名称 | 例如配置中真实存在的 `回国`、`China`；普通新加坡/香港代理不等于大陆回国线路。 |
| 海外，没有回国线路 | 先用 `DIRECT` 做基线 | 模块不会解锁地区版权；某些仅限大陆内容仍可能不可用。 |

如果把 `分流策略` 改成非 `DIRECT`，同时又不想阻断 PCDN，请把
`PCDN策略` 设置为同一个策略。规则按顺序匹配，PCDN 的窄规则位于通用
Bilibili 规则之前。

## 模块参数

进入
`配置 → 模块 → Bilibili CDN Switcher → 编辑参数`：

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `广告过滤` | `true` | 删除明确广告字段及多特征命中的广告卡片；未知结构保留。 |
| `界面精简` | `true` | 移除指定导航和“我的”营销入口，不改账号/会员状态。 |
| `搜索推广` | `true` | 删除明确搜索推广词；可独立关闭。 |
| `直播带货` | `true` | 隐藏明确直播购物卡片；可独立关闭。 |
| `CDN` | `auto` | 安全自动模式；也可填固定点播主机，或填 `off` 关闭 CDN 改写。 |
| `分流策略` | `DIRECT` | `DIRECT`、`PROXY` 或当前配置中真实存在的策略组名称。 |
| `PCDN策略` | `DIRECT` | 只匹配 `*pcdn*.biliapi.net`；设为 `REJECT` 才阻断。 |
| `网络档案` | `auto` | 手动命名不同网络的独立缓存，如 `home_wifi`、`cellular`。 |
| `测速间隔` | `12` | 6–72 小时；`auto` 档案有效期最长 6 小时，显式档案最长 24 小时。 |
| `切换阈值` | `20` | 备用线路至少快多少百分比才进入二次确认，范围 10–80。 |
| `调试日志` | `false` | 排错时临时开启；日志不输出完整 URL、签名或响应正文。 |

模块不会读取可靠性未经 Shadowrocket 文档承诺的 SSID/蜂窝变量，因此
`网络档案=auto` 并不声称自动识别 Wi-Fi。希望严格隔离家庭 Wi-Fi 与蜂窝网络
时，请在切换网络后手动改成不同档案名。

## 广告过滤与界面精简

过滤逻辑按已审查端点和响应结构执行，不进行全局“看到 ad 字样就递归删除”。
当前覆盖开屏、首页/Story 推荐、搜索推广、视频相关推荐/评论推广、PGC/Web
推荐、直播明确广告位，以及相应的部分 gRPC 响应。

默认界面精简目标：

- 顶部：“游戏中心”“新征程”；
- 底部：“发布（＋）”“会员购”；
- “我的”：已确认的课程、免流、能量加油站等营销/服务入口，以及代码中
  明确列出的其他商业入口。

以下数据属于保护边界，不会为了“去广告”而伪造或覆盖：

- 登录、账号、实名和安全状态；
- 真实大会员状态、付费权益、课程/番剧购买结果；
- 历史、收藏、下载、消息和未读计数；
- 弹幕、评论、点赞、投币、分享与直播互动；
- 未识别的新卡片或新字段。

不同 Bilibili App 版本、账号和 A/B 实验返回的结构可能不同。未知结构原样
保留，所以“没有删掉一个新广告位”比“误删正常功能”更符合本项目策略。

## 安全 CDN 自动选择

### 为什么不再使用“网上所有服务器 + 全局最快主机”

Bilibili 会按内容、地区、运营商、清晰度、编码和时效动态下发主 URL 与
备用 URL。不存在一个可保证完整、长期有效、适合所有资源的公开服务器清单。
把静态主机强行套到整份响应，会产生签名不匹配、音视频混用、海外番剧失败、
HTML/JSON 错误体被当成媒体，以及 MCDN/PCDN 兼容问题。

因此 `CDN=auto` 只使用 **同一个媒体对象中由 Bilibili 服务端实际返回** 的
完整主/备用 URL，且不会跨普通 CDN、MCDN、PCDN 家族选择。

### 自动流程

```text
播放地址 JSON/gRPC
  → 分离视频/音频/分段与表示信息
  → 只读取该对象的主 URL + 备用 URL
  → 查找同资源、同档案、同候选集合的已验证缓存
  → 有有效缓存：把当前服务端返回的完整备用 URL 提升为主 URL
  → 无缓存：原样返回本次响应，并低频验证主 URL + 一条备用 URL
```

关键安全约束：

1. 每次播放地址响应最多验证 1 个媒体对象的 2 条 URL；所有对象之间至少
   间隔 2 分钟，不在媒体分片请求上运行脚本。
2. 验证固定使用 `GET Range: bytes=0-16383`。只接受 `206`、从 0 开始且长度
   一致的 `Content-Range`、媒体型 `Content-Type` 和 identity 编码。
3. `HEAD` 成功、忽略 Range 的 `200`、HTML/JSON 错误体、压缩体、长度不符
   或跳到另一资源都视为失败。
4. 新备用线路必须相隔至少 10 分钟连续成功两次，并达到速度阈值。
5. 探测结果只影响之后重新取得的播放地址；刚完成探测的当前响应保持原样，
   不主动断开正在播放的连接。
6. 提升备用 URL 时使用本次响应中的完整 scheme、host、path、query 和签名，
   并把原始主 URL 放回备用列表。
7. 持久化状态只含固定长度摘要、计数和时间戳，不保存完整 URL 或签名参数；
   最多保存 64 个资源条目。
8. 缓存过期后先停止应用，再重新验证。解析、存储、超时或验证异常均原样放行。

首次安装后，前两次满足间隔的播放地址请求可能只是在学习，因此没有立即切换
是正常现象。稳定性与正确性优先于“第一次就选出最低延迟”。

### 固定主机兼容模式

把 `CDN` 改成具体主机名会启用显式固定模式。该模式保留原 URL 的 path/query，
但由用户承担目标主机是否接受该资源签名的兼容风险。仓库中的
[`config/cdn-candidates.json`](config/cdn-candidates.json) 只作为手动输入参考，
默认自动模式不会把这些静态主机注入服务端候选集合。

直播地址的 host、path 与签名由服务端配套下发，模块不会强制替换直播 CDN；
直播只由规则送往 `分流策略`。

## PCDN 与网络请求拦截

模块只提供一条窄规则：

```text
DOMAIN-WILDCARD,*pcdn*.biliapi.net,{{{PCDN策略}}}
```

默认 `PCDN策略=DIRECT`，与默认直连分流等效；用户明确改为 `REJECT` 才阻断。
本项目没有加入宽泛 IP/CIDR、`mcdn.bilivideo.cn` 全域阻断或模糊
`DOMAIN-KEYWORD,bilibili` 拒绝规则，因为这些做法可能破坏点播、直播、登录
或其他正常请求。

如果启用 `REJECT` 后出现无法播放、反复缓冲或直播异常，先把 `PCDN策略`
恢复为与 `分流策略` 相同。

## 更新、重置与回滚

常规更新：

1. `配置 → 模块 → 更新模块`；
2. 打开“编辑参数”，确认新增参数有合理值；
3. 重新使用当前配置；
4. 完全退出并重开 Bilibili App。

安全自动缓存不依赖旧版 `BiliCDN.auto.v1` 状态。若希望让 v2 使用全新缓存，
可把 `网络档案` 临时改成一个新的合法名称，例如 `reset_20260726`。旧摘要
不会再命中，并会在容量回收时淘汰。

出现问题时按影响最小的顺序回滚：

1. `CDN=off`：停用 CDN 改写，保留广告/UI 与分流；
2. 将四个广告/UI 开关设为 `false`：保留分流和 CDN；
3. 将 `PCDN策略` 改回与 `分流策略` 相同；
4. 直接停用模块：恢复 Bilibili 原始网络行为；
5. 如确需旧版，可从 [v1.1.0 Release][v110] 下载；旧版 `auto` 使用全局静态
   主机选择，回滚后建议先设为 `off` 或显式固定主机。

[v110]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/tag/v1.1.0

停用/删除模块后，残留的持久化摘要不会执行网络请求或改写。若不再使用任何
HTTPS 解密功能，可在 iOS 中撤销 Shadowrocket CA 信任并删除描述文件。

## 排错

### 模块已启用但完全没有效果

1. 确认首页“全局路由”为 **配置**。
2. 确认当前使用的是包含该模块的配置，并重新使用/编译配置。
3. 确认 HTTPS 解密已开启，CA 已安装并完全信任。
4. 确认模块已启用，不是只下载到了“本地文件”列表。
5. 关闭其他会改写相同 Bilibili API 的模块，避免执行顺序冲突。

### 视频不播放或持续缓冲

1. 先设 `CDN=off`。若立刻恢复，问题在 CDN 选择/固定主机范围。
2. 把 `PCDN策略` 恢复为与 `分流策略` 相同。
3. 海外用户确认所填策略组确实是可用的大陆回国线路。
4. 检查证书错误；媒体 CDN 不应出现在 MITM hostname 列表中。
5. 固定主机模式改回 `auto`，避免目标主机不接受当前签名。

### 自动模式似乎没有切换

这是预期的保守行为：新备用需要两次成功验证，间隔至少 10 分钟；刚验证的
响应不会被改写。开启 `调试日志` 后只应看到类似：

```text
[BiliCDN] safe auto: alternative-pending, descriptors=...
[BiliCDN] safe auto: alternative-confirmed, descriptors=...
```

日志不会显示完整媒体 URL、token、Cookie 或响应正文。

### 广告/UI 仍有残留

Bilibili 可能下发未审查的新结构。请记录 App 版本、接口 URL（删除 token）、
目标入口名称和脱敏后的最小响应结构后提交 Issue。不要公开 Cookie、access_key、
SESSDATA、设备标识或完整签名 URL。

## 隐私与安全边界

- 无运行时第三方依赖，不联系第三方测速或分析服务。
- 探测只访问当前 Bilibili 播放响应已提供的同对象 URL。
- 不读取或上传账号、Cookie、token、响应正文。
- 不修改账号、会员、付费、版权或地区权益，不伪造运营商/地区请求头。
- 不对媒体 CDN 做 MITM，不处理媒体分片响应体。
- 无效参数、未知结构、压缩帧、损坏 Protobuf、存储失败和网络异常均故障开放。

HTTPS 解密会让 Shadowrocket 在设备本地读取指定 API 的明文响应。只安装自己
信任的模块与 CA，不要分享导出的私有证书。请遵守所在地法律、Bilibili 服务
条款及内容版权限制。

## 开发与验证

项目无运行时或构建依赖，需要 Node.js 22 或更高版本：

```bash
npm run build
npm run check
npm run smoke:auto
```

- `npm run build` 从源码和配置确定性生成 `dist/`。
- `npm run check` 检查生成物并运行 JSON、gRPC/Protobuf、广告/UI、候选隔离、
  严格 Range、二次确认、TTL、容量、锁、退避、故障开放和模块范围测试。
- `npm run smoke:auto` 是可选联网检查：读取当前公共播放响应，只探测该响应
  的主/备用 URL，并要求两条都通过严格 Range 验证。CI 不依赖外部 Bilibili。

生成物：

- `dist/Bilibili.CDN.sgmodule`：直接安装模块；
- `dist/Bilibili.list`：可单独引用的分流规则集；
- `dist/bilibili-cdn.js`：CDN JSON/gRPC 脚本；
- `dist/bilibili-enhance.js`：广告/UI JSON/gRPC 脚本；
- `dist/SHA256SUMS.txt`：发行资产 SHA-256。

提交 `v*` 标签后，Release 工作流会再次运行全部检查，校验标签与
`package.json` 版本一致，再创建 GitHub Release。

## 验收状态

自动化测试覆盖范围、仍需真机确认的项目和记录模板见
[docs/DEVICE_ACCEPTANCE.md](docs/DEVICE_ACCEPTANCE.md)。没有完成真实设备
矩阵时，不应把“测试通过”表述为“已在所有 iOS/Bilibili 组合中 100% 验证”。

## 参考与许可

实现为本仓库独立代码。上游项目仅用于交叉核对公开端点、字段语义、模块语法
和已知兼容风险；具体提交与许可证见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和
[上游调研基线](docs/UPSTREAM_RESEARCH.md)。

本项目以 [MIT License](LICENSE) 发布。
