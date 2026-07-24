# Bilibili CDN Switcher for Shadowrocket

面向 iPhone / iPad 的哔哩哔哩分流与点播 CDN 改写模块，目标系统为
iOS 26 与 iOS 27。模块覆盖视频、直播、API、图片与静态资源域名，并同时
处理网页接口的 JSON 播放响应和当前哔哩哔哩 App 使用的 gRPC / Protobuf
播放响应。

> [!IMPORTANT]
> iOS 27 在本项目发布时仍处于测试阶段。请使用最新版 Shadowrocket 与
> 哔哩哔哩客户端；系统或客户端协议变化后，仍可能需要更新本模块。

## 下载与安装

- [一键安装到 Shadowrocket][install]
- [下载最新版 `Bilibili.CDN.sgmodule`][latest-module]
- [查看全部发行版与更新日志][releases]
- [获取 main 分支直接安装版][raw-module]

[install]: https://lowertop.github.io/Shadowrocket-First/redirect.html?url=shadowrocket%3A%2F%2Finstall%3Fmodule%3Dhttps%3A%2F%2Fgithub.com%2FSTERILITZIA02%2FIOS_Bilibiliu_CDN_rewrite%2Freleases%2Flatest%2Fdownload%2FBilibili.CDN.sgmodule
[latest-module]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/latest/download/Bilibili.CDN.sgmodule
[releases]: https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases
[raw-module]: https://raw.githubusercontent.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/main/dist/Bilibili.CDN.sgmodule

如果一键链接没有自动唤起 Shadowrocket，请复制下面的地址，在
`Shadowrocket → 配置 → 模块 → ＋` 中粘贴并下载：

```text
https://github.com/STERILITZIA02/IOS_Bilibiliu_CDN_rewrite/releases/latest/download/Bilibili.CDN.sgmodule
```

### 首次启用

1. 安装模块，并在 `配置 → 模块` 中启用它。
2. 打开当前使用配置的 `ⓘ → HTTPS 解密`，生成 CA 证书并按提示安装描述文件。
3. 进入 iOS 的 `设置 → 通用 → 关于本机 → 证书信任设置`，完全信任刚生成的
   Shadowrocket CA。
4. 将 Shadowrocket 的“全局路由”设为“配置”，重新编译/使用当前配置。
5. 完全退出并重新打开哔哩哔哩 App，分别测试普通视频、番剧和直播。

HTTPS 解密是改写播放响应的必要条件；只需要域名分流时，可把模块参数
`CDN` 改为 `off`，并不启用 HTTPS 解密。

## 模块参数

在 `配置 → 模块 → Bilibili CDN Switcher → 编辑参数` 中修改：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `CDN` | `upos-sz-mirrorali.bilivideo.com` | 点播视频目标主机。可填写纯主机名或 `https://主机名/`；填写 `off` 关闭改写。 |
| `分流策略` | `DIRECT` | 所有哔哩哔哩规则使用的策略。境外用户可填写现有的中国大陆节点策略组名。 |
| `调试日志` | `false` | 排错时临时改为 `true`；正常使用建议关闭。 |

目标 CDN 的可用性会受地区、运营商和视频资源影响。默认线路不可用时，可在
编辑参数中尝试其他哔哩哔哩点播主机；若要快速确认是否由改写造成问题，先将
`CDN` 设为 `off`。

## 工作原理

- **完整分流**：规则集覆盖哔哩哔哩主站、API、图片、静态资源、点播 CDN
  与直播 CDN。默认直连，也可整体指向已有策略组。
- **网页与 App 点播**：脚本识别 UGC、PGC、PUGV、DASH 与 DURL 播放响应。
  JSON 与 gRPC / Protobuf 两条链路均只改写受支持的哔哩哔哩点播 URL。
- **保留回退线路**：只替换主播放 URL，不修改服务端返回的备用 URL；目标
  CDN 失败时，客户端仍有机会自动回退。
- **直播安全处理**：直播地址的 host、path 与签名参数由服务端配套下发。
  模块不会强行替换直播 CDN，而是通过规则将直播流量正确送到所选策略。
- **故障开放**：无效参数、未知响应、压缩帧或解析异常都会原样放行，避免
  因脚本错误破坏播放。

脚本不发送遥测，不读取账号信息，也不会发起额外网络请求。MITM 主机严格
限定为播放接口所需的 API 主机，不包含直播 API 或大流量媒体 CDN。

## 排错

如果模块已启用但没有效果，请依次检查：

1. 全局路由是否为“配置”，当前配置是否已重新编译/使用。
2. HTTPS 解密是否开启，Shadowrocket CA 是否已安装并在系统中完全信任。
3. 模块的 `分流策略` 是否为 `DIRECT` 或配置中真实存在的策略组名称。
4. 将 `调试日志` 设为 `true`，在 Shadowrocket 的脚本日志中查找
   `[BiliCDN]`。
5. 将 `CDN` 设为 `off` 后重试。若恢复播放，说明目标 CDN 对当前网络或资源
   不可用；若仍失败，问题通常在节点、DNS、证书或上游服务。

不同模块可能同时修改同一播放响应。排错时建议暂时关闭其他哔哩哔哩重写
模块，避免执行顺序冲突。

## 开发与验证

项目无运行时或构建依赖，只需要 Node.js 22 或更高版本：

```bash
npm run build
npm run check
```

`npm run check` 会验证生成文件未过期，并运行 JSON、DASH、DURL、直播保护、
gRPC 多帧、Protobuf 长度更新、备用线路保留、异常放行和模块结构测试。
发行版同时提供 `SHA256SUMS.txt`，可用于核对下载文件。

生成物：

- `dist/Bilibili.CDN.sgmodule`：可直接安装的完整模块
- `dist/Bilibili.list`：可单独引用的 Shadowrocket 规则集
- `dist/bilibili-cdn.js`：响应改写脚本
- `dist/SHA256SUMS.txt`：SHA-256 校验值

推送 `v*` 标签会在全部检查通过后自动创建 GitHub Release，并附带上述文件。

## 安全说明

HTTPS 解密会让 Shadowrocket 在设备本地查看指定主机的明文响应。只应安装
自己信任的模块与 CA；不要分享导出的私有证书。停用本模块后，可在 iOS
`设置 → 通用 → VPN 与设备管理` 删除相应描述文件，并在“证书信任设置”中
撤销信任。

本项目只改变网络路由和服务端返回的点播 CDN 主机，不解锁付费、会员或
地区受限内容。请遵守所在地法律法规及哔哩哔哩服务条款。

## 参考与许可

实现参考了用户提供的 Tampermonkey 脚本所采用的“保留 URL 路径和签名、仅
替换点播主机”思路，并针对 iOS App 的 gRPC / Protobuf 链路从头实现。
协议和配置格式交叉核对了
[BiliUniverse Redirect](https://github.com/BiliUniverse/Redirect)、
[Shadowrocket 使用手册](https://github.com/LOWERTOP/Shadowrocket) 与
[社区维护的 Bilibili 分流规则](https://github.com/blackmatrix7/ios_rule_script/tree/master/rule/Shadowrocket/BiliBili)。

本项目以 [MIT License](LICENSE) 发布。
