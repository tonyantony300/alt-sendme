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

그때그때 가장 손쉬운 방법을 고르세요. 어떤 기기에서든 열리는 **링크나 QR 코드 보내기**, **한 번 페어링해 둔 기기로 보내기**, **이미 같은 네트워크에 있는 기기로 보내기** — 세 가지 모두 같은 바이트를 같은 방식으로, 즉 직접 그리고 종단 간 암호화된 상태로 옮깁니다.



## 기능

- **크로스 플랫폼** — 데스크톱, Android, CLI, 브라우저 — 웹에서는 설치가 필요 없습니다
- **어떤 파일이든, 어떤 크기든** — 파일이든 폴더든 BLAKE3로 검증
- **멀티기가비트 속도** — 빠른 회선을 최대한 활용
- **주변 기기** — LAN 자동 검색, Pair & Send 지원
- **페어링된 기기** — 코드(원격)나 Nearby로 한 번만 페어링하면 이후에는 ticket 없이 전송
- **신뢰하는 기기** — 페어링된 기기를 자동 수신으로 설정하면, 그 기기가 보낸 파일은 확인 없이 바로 도착합니다
- **이어받기 & 다중 수신** — 중단된 전송을 이어받고, 여러 명에게 동시에 공유
- **키로 연결** — IP 주소가 아니라 기기 신원으로 연결
- **로밍** — 전송 도중에 Wi-Fi, 셀룰러, 네트워크를 바꿔도 끊기지 않습니다
- **코드, 링크 또는 QR** — 받는 사람은 아무것도 설치할 필요가 없습니다(브라우저 또는 앱)
- **미리보기 & 기록** — 내려받기 전에 확인, 전송 기록은 로컬에 저장
- **고급 디버그 모드** — 내부 동작을 투명하게 볼 수 있는 선택형 진단 기능
- **프라이버시** — 계정, 추적, 광고 없음. 기기 간 직접 연결
- **암호화** — TLS 1.3 종단 간 암호화, 인증된 ticket
- **relay 셀프호스팅** — 직접 운영하는 relay로 속도 제한 없는 원격 전송(**설정 → Infra**)
- **항상 연결 가능** — 백그라운드 트레이/서비스, 알림, 로그인 시 자동 시작
- **가볍고 무료** — 작은 설치 용량, 오픈 소스, 제한 없음


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
    <td>🌐 <b>Web (처리량 제한)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

더 많은 옵션은 [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) 또는 [Downloads](https://www.dashbeam.net/en/downloads) 페이지에서 확인하세요.

문제가 있나요? 자주 겪는 문제와 로그 수집 방법은 [문제 해결](../troubleshooting.md)을 참고하세요.



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
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## 전송 방법
### 주변 기기(권장)

같은 네트워크에 있는 앱은 **설정 → 기기**의 **Nearby**와, 공유 중에 표시되는 **Send to a device** 목록에 나타납니다. 주변 기기를 고르고 **Pair & Send**를 누르면 페어링과 전송 시작이 한 번에 이루어집니다 — 공유하지 않고 설정에서 페어링할 수도 있습니다. 처음 연결할 때는 양쪽 화면에 확인 코드가 표시됩니다. 누가 나를 찾을 수 있는지는 **설정 → 네트워크 → Your discoverability**에서 정합니다.

[mDNS](https://en.wikipedia.org/wiki/Multicast_DNS)를 사용합니다 — 게스트 Wi-Fi나 VPN에서는 차단되는 경우가 많습니다. 목록이 계속 비어 있다면 [문제 해결](../troubleshooting.md#the-nearby-list-is-empty)을 확인하세요.

### 페어링된 기기

**설정 → 기기**에서 페어링 코드로 페어링하거나(인터넷을 통한 원격 페어링도 가능), 같은 네트워크에서 Nearby 요청으로 페어링합니다. 페어링 후에는 공유할 때 해당 기기 옆에 **Send**가 나타나므로 ticket을 복사할 필요가 없습니다. 받는 쪽에는 앱 안에서 요청이 표시됩니다. 데스크톱에서는 백그라운드로 계속 실행하면서 온라인 상태인 페어링된 기기를 트레이에 표시할 수 있습니다(**설정 → 일반 → Startup & background**). 수동 ticket과 [sendme CLI](https://www.iroh.computer/sendme)도 그대로 동작합니다.

### ticket, 링크 또는 QR 코드 공유(일회성 전송)

공유 중에는 카메라로 스캔하는 **QR**, 시스템 공유 시트를 여는 **Share**, ticket 자체를 복사하는 **Copy**를 쓸 수 있습니다. 링크는 `https://app.dashbeam.net/receive?ticket=…` 형태입니다 — Android에서는 앱이 열리고 그 외에서는 웹 앱이 열리므로 상대는 아무것도 설치할 필요가 없습니다(큰 파일은 네이티브 앱이 더 낫습니다). 받기 화면에는 ticket, 링크, 공유 메시지 전체 중 무엇을 붙여넣어도 됩니다.


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
| LAN에서 기기 발견 | ✅ | ❌ | ✅ | ❌ | ✅ |
| 단점 | 개발 중 | 클로즈드 소스; 데이터 처리를 감사할 수 없음 | 동일 네트워크 전용, 재개 불가 | CLI 전용; GUI 프런트엔드는 별도의 커뮤니티 관리 프로젝트 | WebRTC/SCTP 처리량 상한; 브라우저 메모리 제한 |

[자세히 보기 →](https://www.dashbeam.net/en/compare)

## 내부 구조

DashBeam은 [Iroh](https://www.iroh.computer) 위에 구축되었습니다. Iroh는 기기 간 직접 통신을 단순화하는 최신 피어투피어 네트워킹 스택입니다. 실제로는 기기가 암호화된 QUIC으로 통신하고, 파일은 콘텐츠 주소 지정 blob으로 이동하며, 직접 경로를 사용할 수 없을 때는 relay가 돕습니다.

> **자세한 설명:** [Under the hood](https://dashbeam.net/en/under-the-hood)는 같은 구조를 이야기처럼 풀어냅니다 — 파일 이름 대신 지문, 주소 대신 이름, 홀 펀칭, 로밍, 그리고 각 중개자가 무엇을 볼 수 있고 무엇을 볼 수 없는지.

### 구성 요소

| 구성 요소 | DashBeam에서의 역할 |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | 파일 데이터 저장 및 스트리밍. 모든 청크는 BLAKE3로 검증 |
| **Tickets** | peer에게 *누구*에게 연결하고 *무엇*을 가져올지 알려 주는 하나의 문자열 |
| **Endpoints** | 각 기기의 Iroh ID(Ed25519 key → endpoint id) |
| **QUIC + TLS 1.3** | 암호화된 전송. head-of-line blocking 없는 멀티플렉싱 |
| **Relays + hole punching** | NAT를 넘어 연결을 시작합니다. 직접 경로를 협상하는 동안에도 relay가 데이터를 나릅니다 |
| **Control protocol** (pairing) | 기기를 기억하고 공유 초대를 전달하는 장수명 채널 |
| **Local discovery** (mDNS) | Nearby 기기가 ticket 없이 서로를 찾을 수 있게 하는 선택적 LAN 광고 |
| **수신 링크** | 평범한 https URL로 감싼 ticket — Android에서는 App Link, 그 외에서는 웹 앱 |

### Blobs

파일은 서버에 업로드되지 않습니다. **blob**으로 게시됩니다. BLAKE3 해시로 주소가 지정된 불투명한 바이트 시퀀스입니다.

- **link**는 그 32바이트 해시입니다. 해시가 일치하면 콘텐츠도 일치합니다.
- 폴더와 대용량 파일은 **HashSeq**(다른 blob을 가리키는 blob)를 사용합니다.
- 발신자가 **provider**, 수신자가 **requester**입니다. 어느 쪽이든 둘 다 할 수 있습니다.

이 해시는 파일 전체에 대한 하나의 다이제스트가 아니라 BLAKE3 트리이기 때문에, 각 청크가 루트에 대해 스스로 검증됩니다. 이어받기가 저렴한 이유가 바로 이것입니다. 연결이 끊긴 뒤 돌아온 수신자는 이미 가지고 있고 *검증까지 마친* 청크가 무엇인지 정확히 알기 때문에, 빠진 부분만 요청합니다. 이미 받은 것은 다시 전송되지 않고, 도착한 것은 무조건 믿고 받아들이지 않습니다.

### Tickets

공유 **ticket**은 다음을 하나의 토큰에 담습니다:

1. 발신자의 endpoint id(올바른 기기와 통신 중인지 확인)
2. 연결에 필요한 주소 / relay 정보
3. 다운로드할 blob 해시

ticket을 공유한 상대에게만 연결합니다. 낯선 사람에게 IP를 브로드캐스트하지 않습니다. 이것이 Iroh가 권장하는 기본 「cozy network」 모델이며, swarm 전체로의 flooding discovery와는 다릅니다.

endpoint id만 담은 ticket은 현재 주소를 찾기 위해 공개 키 디스커버리(Pkarr)에 의존합니다. 이 레코드는 endpoint 키 자체로 서명되어 있어서, 변조된 레코드는 엉뚱한 곳으로 유도하는 대신 검증에 실패합니다 — 조회 서비스는 **가용성에 대해서만 신뢰하며, 무결성에 대해서는 그렇지 않습니다**.

### 네트워크를 넘는 연결

두 기기가 만나야 할 때:

1. 각각 공개(또는 셀프호스트) **relay**에 등록해 방화벽과 NAT를 넘는 경로를 찾을 수 있게 합니다.
2. Iroh가 **QUIC hole punching**을 시도해 직접 피어투피어 링크로 업그레이드합니다.
3. 직접 경로가 되면 트래픽은 기기 간으로 흐릅니다. 안 되면 relay가 폴백 UDP hop으로 경로에 남습니다.

어느 경우든 페이로드는 엔드투엔드 암호화됩니다. relay가 보는 것은 암호문이지 파일이 아닙니다. [Iroh relay 자세히 →](https://docs.iroh.computer/about/faq)

이 단계들은 차례로 기다리는 것이 아니라 서로 겹쳐서 진행됩니다. 홀 펀칭을 협상하는 동안에도 relay는 이미 데이터를 나르고 있으므로, 직접 경로가 성사되기를 기다리는 것은 아무것도 없습니다 — 직접 경로가 열리면 전송이 그만큼 빨라질 뿐입니다. 대략 열 번에 한 번은 직접 경로를 전혀 얻지 못하고(대칭형 NAT, 통제가 엄격한 기업 네트워크 등) 처음부터 끝까지 relay를 거칩니다.

### 네트워크 간 로밍

연결은 상대의 IP 주소가 아니라 키에 묶여 있으므로, 네트워크가 바뀌어도 연결이 끝나지 않습니다. 전송 도중에 Wi-Fi에서 셀룰러로 전환하면 iroh가 주소 변경을 감지하고 새 후보를 파악해 상대에게 다시 게시합니다. 그동안 relay가 계속 데이터를 나르고, 홀 펀칭은 새 경로에서 다시 한 번 실행될 뿐입니다.

주소는 언제든 버릴 수 있는 힌트일 뿐 신원이 아닙니다. 기기를 위치가 아니라 키로 이름 짓는 데서 오는 실질적인 이점이 바로 이것입니다.

### QUIC & 암호화

QUIC(UDP 기반, HTTP/3과 같은 기반)는 TLS 1.3을 전송 계층에 통합합니다. DashBeam에게 이는 암호화와 인증, 공유 혼잡 제어를 통한 다중 스트림, 이전에 연결한 peer에 대한 빠른 재연결을 제공합니다.

### 페어링된 기기

페어링은 ticket을 대체하지 않고, 대신 ticket을 전달해 줍니다.

1. 기기는 전용 제어 ALPN에서 짧은 **pairing code**(호스트의 endpoint id)를 교환합니다.
2. 각 쪽은 연결에 묶인 키 재료에 기기 secret으로 서명해 ID를 증명한 뒤 peer를 로컬에 기억합니다.
3. 지속적인 제어 연결이 presence(온라인/오프라인)를 유지합니다.
4. 공유할 때 DashBeam은 여전히 일반적인 일회용 blob ticket을 생성합니다. 페어링된 기기를 선택하면 그 ticket이 복사·붙여넣기 대신 앱 내 **invite**로 전송됩니다.

수동 ticket과 [sendme CLI](https://www.iroh.computer/sendme)는 이전과 동일하게 작동합니다.

### Nearby(로컬 디스커버리)

같은 로컬 네트워크에서 DashBeam은 mDNS로 peer를 광고하고 검색할 수 있습니다(데스크톱 및 Android; 웹 앱 제외).

1. 발견 가능성이 **Everyone**일 때, 기기는 다른 기기가 Nearby에서 이름을 볼 수 있을 만큼의 메타데이터를 게시합니다.
2. **Paired only**는 LAN의 낯선 사람에게 표시 이름을 노출하지 않으면서도 프레즌스를 계속 알립니다.
3. **Off**는 광고를 중지합니다. 여전히 발견 가능한 다른 기기를 검색하고 보낼 수 있습니다.
4. 첫 접촉 파일 초대는 양쪽 기기의 공개 키에서 파생된 짧은 검증 코드를 보여, 각 쪽이 수락 전에 의도한 peer와 통신 중인지 확인할 수 있게 합니다.
5. Nearby 페어링 요청이나 파일 초대를 수락하면 코드 기반 페어링과 동일한 로컬 페어링 기기 기록이 만들어집니다.

### relay 및 discovery 셀프호스팅

자체 iroh relay와 discovery 서버를 운영하는 방법, DashBeam에서 이를 사용하도록 설정하는 방법, 공개/셀프호스트 혼합 구성의 동작은 [`infra/README.md`](../../infra/README.md)를 참고하세요(relay: [`../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), discovery: [`../../infra/dns/README.md`](../../infra/dns/README.md)).

위 내용 전체를 그림과 함께 설명한 글은 — relay 운영자, 인터넷 서비스 제공자, 조회 서비스가 각각 하나의 전송에서 무엇을 알게 되는지에 대한 전체 설명을 포함해 — [Under the hood](https://dashbeam.net/en/under-the-hood)에서 읽을 수 있습니다.


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
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

