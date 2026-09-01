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

选择当下最顺手的方式：**发送链接或二维码**，在任意设备上打开；**发送给配对过一次的设备**；或**发送给已经在你网络中的设备**。三种方式传输的字节和路径完全一样 - 直连、端到端加密。



## 功能特性

- **跨平台** - 桌面、Android、CLI 和浏览器 - 网页端无需安装
- **任意文件，任意大小** - 文件或文件夹，经 BLAKE3 校验
- **多千兆速度** - 可跑满高速连接
- **附近设备** - 局域网自动发现；Pair & Send
- **已配对设备** - 用配对码（远程）或通过 Nearby 配对一次；之后无需 ticket 即可发送
- **受信任的设备** - 为已配对的设备开启自动接收；来自它的文件无需确认即可送达
- **可续传、多接收方** - 续传中断的传输；同时分享给多人
- **按密钥拨号** - 按设备身份连接，而非 IP 地址
- **漫游** - 传输途中切换 Wi-Fi、蜂窝网络或其他网络也不会中断
- **配对码、链接或二维码** - 接收方无需安装（浏览器或应用均可）
- **预览与历史** - 下载前先看；本地传输记录
- **高级调试模式** - 可选的诊断信息，让底层运行一目了然
- **隐私** - 无账号、无追踪、无广告；设备到设备直连
- **加密** - TLS 1.3 端到端；ticket 经过认证
- **自托管 relay** - 通过自己的 relay 进行不限速的远程传输（**设置 → Infra**）
- **随时可达** - 后台托盘/服务、通知、开机自启
- **轻量且免费** - 安装包小；开源，无限制


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
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64-setup.exe'>Setup.exe</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64_en-US.msi'>MSI</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64-portable.zip'>Portable ZIP</a></td>
    <td>~10 MB</td>
  </tr>
  <tr>
    <td>💻 <b>macOS (Universal)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_universal.dmg'>DashBeam.dmg</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_aarch64.dmg'>Apple Silicon</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64.dmg'>Intel</a></td>
    <td>~15 MB</td>
  </tr>
  <tr>
    <td>💻 <b>Linux (amd64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_amd64.deb'>DashBeam.deb</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-0.7.0-1.x86_64.rpm'>.rpm</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_amd64.AppImage'>AppImage</a></td>
    <td>~13 MB</td>
  </tr>
  <tr>
    <td>📱 <b>Android (arm64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-v0.7.0-arm64.apk'>DashBeam.apk</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-v0.7.0-armv7.apk'>armv7</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-v0.7.0-universal.apk'>universal</a></td>
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

遇到问题？请查看[故障排查](../troubleshooting.md)，其中列出了常见问题以及如何收集日志。



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
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## 发送方式
### 附近设备（推荐）

同一网络中的应用会出现在**设置 → 设备**的 **Nearby** 下，以及分享时的 **Send to a device** 列表中。选择一台附近设备并点击 **Pair & Send**，即可一步完成配对并开始传输 - 你也可以不分享、直接在设置中配对。首次连接时两边屏幕都会显示一个验证码。可在**设置 → 网络 → Your discoverability** 中设置谁能发现你。

使用 [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) - 访客 Wi-Fi 和 VPN 常常会屏蔽它。如果列表始终为空，请参阅[故障排查](../troubleshooting.md#the-nearby-list-is-empty)。

### 已配对设备

在**设置 → 设备**中使用配对码配对（可远程、通过互联网），或在同一网络中通过 Nearby 请求配对。配对后，分享时该设备旁会出现 **Send** - 无需复制 ticket。接收方会在应用内收到提示。桌面端可以在后台持续运行，并在托盘中显示在线的已配对设备（**设置 → 通用 → Startup & background**）。手动 ticket 和 [sendme CLI](https://www.iroh.computer/sendme) 依然可用。

### 分享 ticket、链接或二维码（一次性传输）

分享过程中：**QR** 供相机扫描，**Share** 调起系统分享面板，**Copy** 复制原始 ticket。链接形如 `https://app.dashbeam.net/receive?ticket=…` - 在 Android 上会直接打开应用，其他平台则打开网页版，因此无需安装任何东西（大文件建议使用原生应用）。在接收处粘贴 ticket、链接或整条分享消息均可。


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

> **详细版本：**[Under the hood](https://dashbeam.net/en/under-the-hood) 以叙述的方式讲解同一套架构 - 用指纹代替文件名、用名字代替地址、打洞、漫游，以及每个中间环节分别能看到什么、看不到什么。

### 核心组件

| 组件 | 在此的作用 |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | 存储与流式传输文件数据；每个分块均通过 BLAKE3 校验 |
| **Tickets** | 一个字符串，告诉对等节点该*拨号连接谁*、该*获取什么* |
| **Endpoints** | 每台设备的 Iroh 身份（Ed25519 密钥 → endpoint id） |
| **QUIC + TLS 1.3** | 加密传输；多路复用，无队头阻塞 |
| **Relays + hole punching** | 跨 NAT 建立连接；在协商直连路径的同时由 relay 承载数据 |
| **Control protocol**（配对） | 长连接通道，用于记住设备并投递分享邀请 |
| **Local discovery**（mDNS） | 可选的局域网广播，使附近设备无需 ticket 即可互相发现 |
| **接收链接** | 包装在普通 https URL 中的 ticket - 在 Android 上是 App Link，其他平台则打开网页版 |

### Blobs

文件不会上传到服务器。它们以 **blob** 形式发布：由 BLAKE3 哈希寻址的不透明字节序列。

- **link** 即该 32 字节哈希：哈希匹配，内容即匹配。
- 文件夹与大文件使用 **HashSeq**（指向其他 blob 的 blob）。
- 发送方是 **provider**；接收方是 **requester**。任一方可同时扮演两种角色。

由于这个哈希是一棵 BLAKE3 树，而不是对整个文件做一次摘要，每个分块都能独立地相对根节点完成校验。这正是续传成本低廉的原因：连接断开后重新回来的接收方，清楚地知道哪些分块已经拿到*并且已经校验过*，因此只请求缺失的部分。已经收到的内容不会重传，而新到达的内容也不会未经校验就被接受。

### Tickets

分享 **ticket** 是一个打包了以下信息的单一令牌：

1. 发送方的 endpoint id（以便确认您正在与正确的设备通信）
2. 足够的地址 / 中继信息以拨号连接
3. 待下载的 blob 哈希

您只会与分享 ticket 的对象建立连接：不会向陌生人广播您的 IP。这是 Iroh 所倡导的默认「cozy network」模型，而非向整个 swarm 泛洪发现。

只携带 endpoint id 的 ticket 依赖公钥发现（Pkarr）来查找当前地址。这些记录由 endpoint 密钥本身签名，因此被篡改的记录只会校验失败，而不会把你引向错误的地方 - 查找服务只需要在**可用性上被信任，而不是完整性**。

### 跨网络连接

当两台设备需要建立连接时：

1. 每台设备向公共（或自托管）**relay** 注册，以便对等节点能够穿越防火墙与 NAT 找到路径。
2. Iroh 尝试 **QUIC hole punching**，以升级为直连点对点链路。
3. 若直连可用，流量在设备之间传输；否则，relay 作为回退 UDP 跳点保留在路径中。

无论哪种方式，载荷均为端到端加密。Relay 看到的是密文，而非您的文件。[了解更多 Iroh relay →](https://docs.iroh.computer/about/faq)

这些步骤是相互重叠的，而不是排队进行。在打洞协商的同时，relay 已经在承载你的数据，因此没有任何环节需要等待直连成功 - 直连一旦建立，传输只会变得更快。大约每十次传输就有一次始终无法建立直连（对称 NAT、管控严格的企业网络），全程通过 relay 传输。

### 跨网络漫游

连接绑定的是对端的密钥，而不是它的 IP 地址，因此切换网络不会中断连接。传输途中从 Wi-Fi 切到蜂窝网络，iroh 会察觉地址变化、获知新的候选地址，并重新发布给对端。整个过程中由 relay 承载数据，打洞则会在新路径上重新执行一次。

地址只是可随时丢弃的线索，而不是身份。这正是用密钥而非位置来标识设备所带来的实际收益。

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

以上内容的图解版本 - 包括 relay 运营方、你的网络运营商以及查找服务各自能从一次传输中获知什么的完整说明 - 请阅读 [Under the hood](https://dashbeam.net/en/under-the-hood)。


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
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

