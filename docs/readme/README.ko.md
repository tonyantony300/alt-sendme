<img src="../../assets/rename-banner.svg" alt="공지: AltSendme가 DashBeam으로 변경되었습니다. 같은 앱이지만, 더 쉽게 찾고, 기억하고, 발음할 수 있습니다." width="1200" />

**언어:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | 한국어 | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# 파일 전송은 복잡할 필요가 없습니다

</div>


![DashBeam Header](../../assets/header.png)

<div align="center">

![DashBeam working demo](../../assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
[![Version][badge-version]](https://github.com/tonyantony300/dashbeam/releases/latest)
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)



</div>

[최첨단 피어투피어 네트워킹](https://www.iroh.computer)의 힘을 활용한 무료 오픈소스 파일 전송 도구로, 클라우드 서버에 저장하지 않고 파일을 직접 전송할 수 있습니다.

WeTransfer, Dropbox, Google Drive에 의존할 필요가 있을까요? DashBeam은 개인 정보를 노출하지 않고, 엔드투엔드 암호화로 안정적이고 쉽게 파일을 직접 전송할 수 있습니다.



## 기능

- **어디서든, 무엇으로든 전송** — 데스크톱, Android, 터미널, 브라우저 — 한 플랫폼에서 시작해 다른 어떤 플랫폼에서도 받을 수 있습니다.
- **무엇이든, 어떤 크기든 전송** — 파일이든 폴더 전체든 BLAKE3 무결성 검사로 엔드투엔드 검증됩니다.
- **체감할 만큼 빠름** — 멀티기가비트 연결을 최대한 활용해 초고속 전송을 실현합니다.
- **기본적으로 프라이빗** — 계정 없음, 가입 없음, 추적 없음, 광고 없음.
- **기기 간 직접 전송** — 파일은 기기끼리 직접 이동하며, 데이터가 대가인 기업 클라우드 저장소를 피합니다.
- **항상 켜진 엔드투엔드 암호화** — 모든 전송에 QUIC과 TLS 1.3을 사용합니다. 릴레이가 개입하더라도 암호화된 트래픽만 보입니다.
- **암호학적 인증** — 모든 ticket은 파일 전송 전에 의도한 발신자에 연결되었는지 확인합니다.
- **재개 및 브로드캐스트 가능** — 중단된 전송은 자동으로 재개됩니다. 같은 파일을 여러 peer에게 동시에 공유할 수 있습니다.
- **다운로드 전 미리보기** — 다운로드하기 전에 받을 내용을 확인할 수 있습니다.
- **페어링된 기기** — **설정 → 기기**에서 컴퓨터와 Android 휴대폰을 한 번 페어링하면, 매번 ticket을 복사하지 않고 파일을 보낼 수 있습니다.
- **초경량** — 설치 용량이 작고 웹 풋프린트도 최소입니다.
- **무료 & 오픈소스** — 업로드 비용 없음, 크기 제한 없음, 커뮤니티 주도.


## 실제 사용 통계


| 항목 | 보고된 수치 |
|--------|--------|
| **최대 전송량** | 452 GB |
| **가장 빠른 대용량 전송** | 54 GB @ 123 MB/s (~1 Gbps) |
| **고속 대량 전송** | 328 GB @ 93 MB/s |
| **측정된 최고 속도** | 125 MB/s (1 Gbps) |

*전송 처리량은 기기, 네트워크, 연결 경로에 따라 달라집니다.*



## 설치

가장 쉬운 방법은 사용 중인 운영체제에 맞는 아래 버전을 다운로드하는 것입니다:

<table>
  <tr>
    <td><b>플랫폼</b></td>
    <td><b>권장</b></td>
    <td><b>기타 형식</b></td>
    <td><b>크기</b></td>
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
    <td>🌐 <b>Web (처리량 제한)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

더 많은 옵션은 [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) 또는 [Downloads](https://www.dashbeam.net/en/downloads) 페이지에서 확인하세요.



## 파트너

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

우리의 미션에 함께할 파트너를 찾고 있습니다! 파트너로서 지원해 주시면, 피어투피어 파일 전송의 한계를 넓혀 나가겠습니다.

[**이야기 나눠요**](https://www.dashbeam.net/en/contact)


## 지원 언어
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## 작동 방식

1. 파일이나 폴더를 드롭하면 — DashBeam이 일회용 공유 코드(「ticket」이라고 부릅니다)를 생성합니다.
2. 채팅, 이메일, 문자로 ticket을 공유하거나, **또는** 페어링된 기기(데스크톱 / Android)로 직접 보냅니다.
3. 상대방이 앱에 ticket을 붙여넣거나(또는 페어링된 기기 초대를 수락하면) 전송이 시작됩니다.

### 페어링된 기기

macOS, Windows, Linux, Android에서는 **설정 → 기기**에서 페어링 코드로 기기를 페어링할 수 있습니다. 페어링 후:

- 발신자는 공유 중 페어링된 기기 옆의 **보내기**를 탭할 수 있습니다. ticket을 수동으로 복사할 필요가 없습니다.
- 수신자는 페어링된 발신자가 초대하면 앱 내 프롬프트를 받습니다(앱이 열려 있어야 합니다).
- 수동 ticket과 [sendme CLI](https://www.iroh.computer/sendme)는 이전과 동일하게 작동합니다.


## 비교

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| 네트워킹 스택 | QUIC via Iroh | 알 수 없음 | TCP 기반 HTTPS/REST | 암호화된 TCP | WebRTC/DTLS (SCTP) |
| 인터넷 경유 동작 | ✅ | ✅ | LAN 전용 | ✅ | ✅ |
| 기가비트 연결 최대 활용 | ✅ | ✅ | ✅ (LAN 전용) | ✅ | ❌ (SCTP/브라우저 상한) |
| 오픈소스 | ✅ | ❌ | ✅ | ✅ | ✅ |
| 계정 불필요 | ✅ | ❌ | ✅ | ✅ | ✅ |
| 엔드투엔드 암호화 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 폴더 전송 | ✅ | ✅ | ✅ | ✅ | ✅ (CLI 전용, 브라우저 미지원) |
| 재개 가능한 전송 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 무제한 파일 크기 | ✅ | ✅ | ✅ | ✅ | 브라우저 메모리에 의해 제한 |
| 플랫폼 | CLI + 데스크톱 + 모바일 + 웹 | 데스크톱 + 모바일 (웹/CLI 없음) | 데스크톱 + 모바일 (웹/CLI 없음) | CLI 전용 | Web/PWA + Android 앱 + CLI |
| 단점 | 개발 중 | 클로즈드 소스; 데이터 처리를 감사할 수 없음 | 동일 네트워크 전용, 재개 불가 | CLI 전용; GUI 프런트엔드는 별도의 커뮤니티 관리 프로젝트 | WebRTC/SCTP 처리량 상한; 브라우저 메모리 제한 |

[자세히 보기 →](https://www.dashbeam.net/en/compare)

## 내부 구조

DashBeam은 [Iroh](https://www.iroh.computer) 위에 구축되었습니다. Iroh는 기기 간 직접 통신을 단순화하는 최신 피어투피어 네트워킹 스택입니다. 실제로는 기기가 암호화된 QUIC으로 통신하고, 파일은 콘텐츠 주소 지정 blob으로 이동하며, 직접 경로를 사용할 수 없을 때는 relay가 돕습니다.

### 구성 요소

| 구성 요소 | DashBeam에서의 역할 |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | 파일 데이터 저장 및 스트리밍. 모든 청크는 BLAKE3로 검증 |
| **Tickets** | peer에게 *누구*에게 연결하고 *무엇*을 가져올지 알려 주는 하나의 문자열 |
| **Endpoints** | 각 기기의 Iroh ID(Ed25519 key → endpoint id) |
| **QUIC + TLS 1.3** | 암호화된 전송. head-of-line blocking 없는 멀티플렉싱 |
| **Relays + hole punching** | NAT를 넘는 연결 부트스트랩. 직접 연결 우선, relay로 폴백 |
| **Control protocol** (pairing) | 기기를 기억하고 공유 초대를 전달하는 장수명 채널 |

### Blobs

파일은 서버에 업로드되지 않습니다. **blob**으로 게시됩니다. BLAKE3 해시로 주소가 지정된 불투명한 바이트 시퀀스입니다.

- **link**는 그 32바이트 해시입니다. 해시가 일치하면 콘텐츠도 일치합니다.
- 폴더와 대용량 파일은 **HashSeq**(다른 blob을 가리키는 blob)를 사용합니다.
- 발신자가 **provider**, 수신자가 **requester**입니다. 어느 쪽이든 둘 다 할 수 있습니다.

### Tickets

공유 **ticket**은 다음을 하나의 토큰에 담습니다:

1. 발신자의 endpoint id(올바른 기기와 통신 중인지 확인)
2. 연결에 필요한 주소 / relay 정보
3. 다운로드할 blob 해시

ticket을 공유한 상대에게만 연결합니다. 낯선 사람에게 IP를 브로드캐스트하지 않습니다. 이것이 Iroh가 권장하는 기본 「cozy network」 모델이며, swarm 전체로의 flooding discovery와는 다릅니다.

### 네트워크를 넘는 연결

두 기기가 만나야 할 때:

1. 각각 공개(또는 셀프호스트) **relay**에 등록해 방화벽과 NAT를 넘는 경로를 찾을 수 있게 합니다.
2. Iroh가 **QUIC hole punching**을 시도해 직접 피어투피어 링크로 업그레이드합니다.
3. 직접 경로가 되면 트래픽은 기기 간으로 흐릅니다. 안 되면 relay가 폴백 UDP hop으로 경로에 남습니다.

어느 경우든 페이로드는 엔드투엔드 암호화됩니다. relay가 보는 것은 암호문이지 파일이 아닙니다. [Iroh relay 자세히 →](https://docs.iroh.computer/about/faq)

### QUIC & 암호화

QUIC(UDP 기반, HTTP/3과 같은 기반)는 TLS 1.3을 전송 계층에 통합합니다. DashBeam에게 이는 암호화와 인증, 공유 혼잡 제어를 통한 다중 스트림, 이전에 연결한 peer에 대한 빠른 재연결을 제공합니다.

### 페어링된 기기

페어링은 ticket을 대체하지 않고, 대신 ticket을 전달해 줍니다.

1. 기기는 전용 제어 ALPN에서 짧은 **pairing code**(호스트의 endpoint id)를 교환합니다.
2. 각 쪽은 연결에 묶인 키 재료에 기기 secret으로 서명해 ID를 증명한 뒤 peer를 로컬에 기억합니다.
3. 지속적인 제어 연결이 presence(온라인/오프라인)를 유지합니다.
4. 공유할 때 DashBeam은 여전히 일반적인 일회용 blob ticket을 생성합니다. 페어링된 기기를 선택하면 그 ticket이 복사·붙여넣기 대신 앱 내 **invite**로 전송됩니다.

수동 ticket과 [sendme CLI](https://www.iroh.computer/sendme)는 이전과 동일하게 작동합니다.

### relay 및 discovery 셀프호스팅

자체 iroh relay와 discovery 서버를 운영하는 방법, DashBeam에서 이를 사용하도록 설정하는 방법, 공개/셀프호스트 혼합 구성의 동작은 [`infra/README.md`](../../infra/README.md)를 참고하세요(relay: [`../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), discovery: [`../../infra/dns/README.md`](../../infra/dns/README.md)).


## 개발

전제 조건, 로컬 설정, 빌드 방법, 테스트는 [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup)를 참고하세요.

## [Discord](https://discord.gg/xwb7z22Eve)에 참여해 기여하기

기여하는 가장 좋은 방법은 Discord에 참여해 인사하는 것입니다. 자기소개를 하고 코딩, 테스트, 디자인 등 어떤 기술이나 관심사가 있는지 공유해 주세요. 이슈 제기, 수정 제안, 아이디어 제안도 환영합니다. 메인테이너가 각 단계를 안내합니다.

맥락을 파악하고 방향을 맞추며 [커뮤니티](https://discord.gg/xwb7z22Eve)와 협업하기에 최적의 장소입니다.

## 라이선스

AGPL-3.0

## 개인정보 처리방침

DashBeam이 데이터와 개인정보를 어떻게 처리하는지는 [PRIVACY.md](../../PRIVACY.md)를 참고하세요.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## 기여자

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## 문의

제안, 피드백, 미디어 관련 문의는 [여기](https://www.dashbeam.net/en/contact)로 연락해 주세요.


이 프로젝트를 봐 주셔서 감사합니다! 유용하다고 느끼셨다면 star를 주시고 주변에 알려 주세요.




## 기반 기술

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

