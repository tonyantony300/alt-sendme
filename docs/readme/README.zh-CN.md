<img src="../../assets/rename-banner.svg" alt="公告：AltSendme 现已更名为 DashBeam。同一款应用，更易搜索、记忆和发音。" width="1200" />

**语言：** [English](../../README.md) | 中文 | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# 文件传输，不必如此复杂

</div>


![DashBeam Header](../../assets/header.png)

<div align="center">

![DashBeam 工作演示](../../assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
[![Version][badge-version]](https://github.com/tonyantony300/dashbeam/releases/latest)
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)



</div>

一款免费开源的文件传输工具，借助[前沿点对点网络](https://www.iroh.computer)的力量，让你直接传输文件，无需将数据存储在云端服务器上。

既然可以可靠、轻松地直接传输文件，端到端加密且不泄露任何个人信息，又何必依赖 WeTransfer、Dropbox 或 Google Drive 呢？



## 功能特性

- **随处发送，任意设备** - 桌面、Android、终端或浏览器——在一个平台发起，在任意其他平台接收。
- **传输任意内容，任意大小** - 文件或整个目录，通过 BLAKE3 完整性校验实现端到端验证。
- **快到足以改变体验** - 可跑满多千兆连接，实现闪电般的传输速度。
- **默认私密** - 无需账户、无需注册、无追踪、无广告。
- **设备直连传输** - 文件直接在您的设备之间传输，避开以数据为代价的企业云存储。
- **端到端加密，始终开启** - 每次传输均使用 QUIC 与 TLS 1.3；即使经过中继，中继也只能看到加密流量。
- **加密身份验证** - 每张 ticket 在传输任何文件之前，都会验证您已连接到预期的发送方。
- **可恢复且可广播** - 中断的传输自动恢复；同一文件可同时分享给任意数量的对等节点。
- **下载前先预览** - 在下载之前查看您即将接收的内容。
- **已配对设备** - 在 **设置 → 设备** 中将电脑与 Android 手机配对一次，之后发送文件无需每次复制 ticket。
- **同一网络上的附近设备** - 局域网内的其他 DashBeam 设备会自动出现（mDNS）。可在设置中配对，或在分享时直接发送——无需粘贴 ticket。
- **后台在线** - 在桌面端可在托盘或菜单栏保持运行，并可选择开机启动，以便已配对设备看到您在线。
- **系统通知** - 配对请求与文件邀请可在应用不在前台时弹出系统通知（桌面与 Android）。
- **轻如羽毛** - 安装包极小，Web 端占用极少。
- **免费且开源** - 无上传费用、无大小限制、由社区驱动。


## 真实使用数据


| 指标 | 报告值 |
|--------|--------|
| **最大传输量** | 452 GB |
| **最快大文件传输** | 54 GB @ 123 MB/s（约 1 Gbps） |
| **高速批量传输** | 328 GB @ 93 MB/s |
| **测得峰值速度** | 125 MB/s（1 Gbps） |

*传输吞吐量取决于您的设备、网络及连接路径。*



## 安装

最简单的入门方式是，为您的操作系统下载以下版本之一：

<table>
  <tr>
    <td><b>平台</b></td>
    <td><b>推荐</b></td>
    <td><b>其他格式</b></td>
    <td><b>大小</b></td>
  </tr>
  <tr>
    <td>💻 <b>Windows (x64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_x64-setup.exe'>Setup.exe</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_x64_en-US.msi'>MSI</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_x64-portable.zip'>Portable ZIP</a></td>
    <td>~10 MB</td>
  </tr>
  <tr>
    <td>💻 <b>macOS (Universal)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_universal.dmg'>DashBeam.dmg</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_aarch64.dmg'>Apple Silicon</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_x64.dmg'>Intel</a></td>
    <td>~15 MB</td>
  </tr>
  <tr>
    <td>💻 <b>Linux (amd64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_amd64.deb'>DashBeam.deb</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam-0.6.2-1.x86_64.rpm'>.rpm</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_amd64.AppImage'>AppImage</a></td>
    <td>~13 MB</td>
  </tr>
  <tr>
    <td>📱 <b>Android (arm64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam-v0.6.2-arm64.apk'>DashBeam.apk</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam-v0.6.2-armv7.apk'>armv7</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam-v0.6.2-universal.apk'>universal</a></td>
    <td>~50 MB</td>
  </tr>
  <tr>
    <td>⌨️ <b>CLI</b></td>
    <td><a href='https://www.dashbeam.net/en/downloads'>Downloads</a></td>
    <td>-</td>
    <td>~4-5 MB</td>
  </tr>
  <tr>
    <td>🌐 <b>Web（吞吐量受限）</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

更多选项请见 [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) 或 [Downloads](https://www.dashbeam.net/en/downloads) 页面。



## 合作伙伴

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

我们正在寻找合作伙伴，与我们一起推进使命！与我们携手合作、提供支持，共同突破点对点文件传输的边界。

[**我们聊聊**](https://www.dashbeam.net/en/contact)


## 支持的语言
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## 工作原理

1. 拖放文件或文件夹——DashBeam 会创建一个一次性分享码（称为「ticket」）。
2. 通过聊天、邮件或短信分享 ticket，**或**直接发送到已配对或附近设备（桌面 / Android）。
3. 对方在应用中粘贴 ticket（或接受邀请），传输随即开始。

### 已配对设备

在 macOS、Windows、Linux 和 Android 上，您可以使用配对码在 **设置 → 设备** 中配对设备，或在同一局域网上接受附近设备的配对请求。配对之后：

- 分享时，发送方可在已配对设备旁点击 **Send**：无需手动复制 ticket。
- 当已配对的发送方发出邀请时，接收方会收到应用内提示；若启用了系统通知，窗口未聚焦时也可收到系统横幅。
- 在桌面端，托盘 / 菜单栏可显示哪些已配对设备在线，且关闭窗口后 DashBeam 仍可保持运行（**设置 → 通用 → 启动与后台**）。
- 手动 ticket 与 [sendme CLI](https://www.iroh.computer/sendme) 仍与之前完全一致。

### 附近设备

当其他 DashBeam 应用位于同一 Wi-Fi 或局域网时，它们会出现在 **设置 → 设备** 的 **Nearby** 下，以及分享时的 **Send to a device** 面板中：

- 在设置中 **配对**，无需交换配对码即可添加设备。
- 从分享面板 **发送**，用当前 ticket 邀请附近设备；接收方在接受前会确认一段短验证码。
- 在 **设置 → 网络 → Your discoverability** 中控制他人能否发现您（Everyone / Paired only / Off）。

附近设备依赖 [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS)。若网络阻止组播（访客 Wi-Fi、许多 VPN），请改用手动 ticket 或通过互联网配对——参见 [故障排除](../troubleshooting.md#the-nearby-list-is-empty)。


## 对比

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| 网络栈 | QUIC via Iroh | 未知 | 基于 TCP 的 HTTPS/REST | 加密 TCP | WebRTC/DTLS (SCTP) |
| 支持互联网传输 | ✅ | ✅ | 仅 LAN | ✅ | ✅ |
| 可跑满千兆连接 | ✅ | ✅ | ✅（仅 LAN） | ✅ | ❌（SCTP/浏览器上限） |
| 开源 | ✅ | ❌ | ✅ | ✅ | ✅ |
| 无需账户 | ✅ | ❌ | ✅ | ✅ | ✅ |
| 端到端加密 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 发送文件夹 | ✅ | ✅ | ✅ | ✅ | ✅（仅 CLI，浏览器不支持） |
| 可恢复传输 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 无文件大小限制 | ✅ | ✅ | ✅ | ✅ | 受浏览器内存限制 |
| 平台 | CLI + 桌面 + 移动 + Web | 桌面 + 移动（无 Web/CLI） | 桌面 + 移动（无 Web/CLI） | 仅 CLI | Web/PWA + Android 应用 + CLI |
| 局域网设备发现 | ✅ | ❌ | ✅ | ❌ | ✅ |
| 不足之处 | 开发中 | 闭源；数据处理无法审计 | 仅同一网络，不可恢复 | 仅 CLI；GUI 前端为独立的第三方项目，由社区维护 | WebRTC/SCTP 吞吐量上限；浏览器内存限制 |

[了解更多 →](https://www.dashbeam.net/en/compare)

## 底层原理

DashBeam 基于 [Iroh](https://www.iroh.computer) 构建——这是一套现代的点对点网络栈，简化了设备之间的直接通信。实践中，这意味着设备通过加密的 QUIC 通信，文件以内容寻址 blob 形式传输，当直连不可用时，中继会协助建立连接。

### 核心组件

| 组件 | 在此的作用 |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | 存储与流式传输文件数据；每个分块均通过 BLAKE3 校验 |
| **Tickets** | 一个字符串，告诉对等节点该*拨号连接谁*、该*获取什么* |
| **Endpoints** | 每台设备的 Iroh 身份（Ed25519 密钥 → endpoint id） |
| **QUIC + TLS 1.3** | 加密传输；多路复用，无队头阻塞 |
| **Relays + hole punching** | 穿越 NAT 建立连接；优先直连，中继作为回退 |
| **Control protocol**（配对） | 长连接通道，用于记住设备并投递分享邀请 |
| **Local discovery**（mDNS） | 可选的局域网广播，使附近设备无需 ticket 即可互相发现 |

### Blobs

文件不会上传到服务器。它们以 **blob** 形式发布：由 BLAKE3 哈希寻址的不透明字节序列。

- **link** 即该 32 字节哈希：哈希匹配，内容即匹配。
- 文件夹与大文件使用 **HashSeq**（指向其他 blob 的 blob）。
- 发送方是 **provider**；接收方是 **requester**。任一方可同时扮演两种角色。

### Tickets

分享 **ticket** 是一个打包了以下信息的单一令牌：

1. 发送方的 endpoint id（以便确认您正在与正确的设备通信）
2. 足够的地址 / 中继信息以拨号连接
3. 待下载的 blob 哈希

您只会与分享 ticket 的对象建立连接：不会向陌生人广播您的 IP。这是 Iroh 所倡导的默认「cozy network」模型，而非向整个 swarm 泛洪发现。

### 跨网络连接

当两台设备需要建立连接时：

1. 每台设备向公共（或自托管）**relay** 注册，以便对等节点能够穿越防火墙与 NAT 找到路径。
2. Iroh 尝试 **QUIC hole punching**，以升级为直连点对点链路。
3. 若直连可用，流量在设备之间传输；否则，relay 作为回退 UDP 跳点保留在路径中。

无论哪种方式，载荷均为端到端加密。Relay 看到的是密文，而非您的文件。[了解更多 Iroh relay →](https://docs.iroh.computer/about/faq)

### QUIC 与加密

QUIC（基于 UDP，与 HTTP/3 同源）将 TLS 1.3 融入传输层。对 DashBeam 而言，这意味着加密与身份验证、共享拥塞控制下的多流并行，以及与此前通信过的对等节点快速重连。

### 已配对设备

配对不会取代 ticket；它会为您投递 ticket。

1. 设备通过专用 control ALPN 交换简短的 **pairing code**（主机的 endpoint id）。
2. 双方各自使用设备私钥对连接绑定的密钥材料签名，以此证明身份，随后在本地记住该对等节点。
3. 持久的 control 连接用于维护在线状态（在线 / 离线）。
4. 当您分享时，DashBeam 仍会创建正常的一次性 blob ticket；选择已配对设备时，该 ticket 会作为应用内 **invite** 发送，而非让您复制粘贴。

手动 ticket 与 [sendme CLI](https://www.iroh.computer/sendme) 仍与之前完全一致。

### 附近设备（本地发现）

在同一局域网上，DashBeam 可通过 mDNS 广播并浏览对等设备（桌面与 Android；不含 Web 应用）。

1. 当可发现性为 **Everyone** 时，设备会发布足够的元数据，使他人在 Nearby 中看到其名称。
2. **Paired only** 仍会宣告在线状态，但不向局域网中的陌生人暴露显示名称。
3. **Off** 停止广播；您仍可浏览并向仍可被发现的设备发送。
4. 首次接触的文件邀请会显示由双方公钥派生的短验证码，以便各方在接受前确认正在与预期对等方通信。
5. 接受附近设备的配对请求或文件邀请，会创建与基于配对码配对相同的本地已配对设备记录。

### 自托管 relay 与 discovery

关于如何运行您自己的 iroh relay 与 discovery 服务器、配置 DashBeam 使用它们，以及混合公共/自托管部署的行为，请参阅 [`infra/README.md`](../../infra/README.md)（relay：[`infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam)，discovery：[`infra/dns/README.md`](../../infra/dns/README.md)）。


## 开发

请参阅 [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) 了解前置条件、本地环境、构建说明与测试。

## 加入我们的 [Discord](https://discord.gg/xwb7z22Eve) 参与贡献

参与贡献的最佳方式是加入我们的 Discord 并打个招呼。介绍一下自己，分享您的技能或兴趣——无论是编码、测试、设计还是其他领域。您也可以提交 issue、建议修复或提出想法。维护者会在每一步为您提供指导。

这里是获取背景信息、对齐方向并与[社区](https://discord.gg/xwb7z22Eve)协作的最佳场所。

## 许可证

AGPL-3.0

## 隐私政策

请参阅 [PRIVACY.md](../../PRIVACY.md) 了解 DashBeam 如何处理您的数据与隐私。

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## 贡献者

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## 联系方式

如需建议、反馈或媒体相关沟通，请[在此联系](https://www.dashbeam.net/en/contact)。


感谢您关注本项目！若您觉得有用，欢迎点个 Star 并帮忙传播。


## 构建于

<div align="left">
  <a href="https://iroh.computer">
    <img alt="iroh" src="https://raw.githubusercontent.com/n0-computer/iroh/main/.img/iroh_wordmark.svg" width="200">
  </a>
</div>




<!-- <div align="center" style="color: gray;"></div> -->

[badge-website]: https://img.shields.io/badge/website-dashbeam.net-orange
[badge-version]: https://img.shields.io/badge/version-0.6.2-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

