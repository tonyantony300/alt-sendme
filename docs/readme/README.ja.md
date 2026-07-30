<img src="../../assets/rename-banner.svg" alt="お知らせ: AltSendme は DashBeam になりました。同じアプリで、見つけやすく、覚えやすく、発音しやすくなりました。" width="1200" />

**言語:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | 日本語 | [한국어](README.ko.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# ファイル転送は、もっとシンプルでいいはず

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

[最先端のピアツーピアネットワーキング](https://www.iroh.computer)の力を活用した、無料のオープンソースファイル転送ツールです。クラウドサーバーに保存することなく、ファイルを直接転送できます。

WeTransfer、Dropbox、Google Drive に頼る必要はありますか？DashBeam なら、個人情報を明かすことなく、エンドツーエンド暗号化で、信頼性が高く簡単にファイルを直接転送できます。



## 機能

- **どこからでも、何からでも送信** — デスクトップ、Android、ターミナル、ブラウザ — どのプラットフォームから始めても、他のどのプラットフォームでも受信できます。
- **あらゆるものを、あらゆるサイズで転送** — ファイルもフォルダ全体も、BLAKE3 による整合性チェックでエンドツーエンド検証されます。
- **体感できるほどの高速性** — マルチギガビット回線をフルに活用し、超高速転送を実現します。
- **デフォルトでプライベート** — アカウント不要、サインアップ不要、トラッキングなし、広告なし。
- **デバイス間の直接転送** — ファイルはデバイス間を直接移動し、データが代償となる企業のクラウドストレージを回避します。
- **常時オンのエンドツーエンド暗号化** — すべての転送で QUIC と TLS 1.3 を使用。リレーが介在する場合でも、暗号化されたトラフィックしか見えません。
- **暗号認証** — すべてのチケットで、ファイル転送前に意図した送信者に接続していることを検証します。
- **再開可能＆ブロードキャスト可能** — 中断された転送は自動的に再開。同じファイルを複数のピアに同時に共有可能です。
- **ダウンロード前にプレビュー** — ダウンロード前に受信内容を確認できます。
- **ペアリング済みデバイス** — **設定 → デバイス**でコンピューターと Android 端末を一度ペアリングすれば、毎回チケットをコピーせずにファイルを送信できます。
- **軽量** — インストールサイズは小さく、Web のフットプリントも最小限です。
- **無料＆オープンソース** — アップロード費用なし、サイズ制限なし、コミュニティ主導。


## 実績


| 項目 | 報告値 |
|--------|--------|
| **最大転送量** | 452 GB |
| **最速の大容量転送** | 54 GB @ 123 MB/s（約 1 Gbps） |
| **高速バルク転送** | 328 GB @ 93 MB/s |
| **計測された最高速度** | 125 MB/s（1 Gbps） |

*転送スループットは、デバイス、ネットワーク、接続経路によって異なります。*



## インストール

最も簡単な方法は、お使いのオペレーティングシステムに対応した以下のバージョンをダウンロードすることです：

<table>
  <tr>
    <td><b>プラットフォーム</b></td>
    <td><b>推奨</b></td>
    <td><b>その他の形式</b></td>
    <td><b>サイズ</b></td>
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
    <td>🌐 <b>Web（スループット制限あり）</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

その他のオプションは [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) または [Downloads](https://www.dashbeam.net/en/downloads) ページをご覧ください。



## パートナー

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

私たちのミッションに参加するパートナーを募集しています！パートナーとしてご支援いただき、ピアツーピアファイル転送の可能性を押し広げましょう。

[**お話ししましょう**](https://www.dashbeam.net/en/contact)


## 対応言語
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## 仕組み

1. ファイルまたはフォルダをドロップ — DashBeam がワンタイムの共有コード（「チケット」と呼ばれます）を生成します。
2. チャット、メール、テキストでチケットを共有するか、**または** ペアリング済みデバイス（デスクトップ / Android）に直接送信します。
3. 相手がアプリにチケットを貼り付ける（またはペアリング済みデバイスの招待を承認する）と、転送が開始されます。

### ペアリング済みデバイス

macOS、Windows、Linux、Android では、**設定 → デバイス**でペアリングコードを使ってデバイスをペアリングできます。ペアリング後：

- 送信者は共有中にペアリング済みデバイスの横の **送信** をタップできます。チケットを手動でコピーする必要はありません。
- 受信者はペアリング済み送信者から招待されると、アプリ内プロンプトが表示されます（アプリを開いている必要があります）。
- 手動チケットと [sendme CLI](https://www.iroh.computer/sendme) は、これまでどおりそのまま動作します。


## 比較

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| ネットワークスタック | QUIC via Iroh | 不明 | TCP 上の HTTPS/REST | 暗号化された TCP | WebRTC/DTLS (SCTP) |
| インターネット経由で動作 | ✅ | ✅ | LAN のみ | ✅ | ✅ |
| ギガビット回線をフル活用 | ✅ | ✅ | ✅（LAN のみ） | ✅ | ❌（SCTP/ブラウザの上限） |
| オープンソース | ✅ | ❌ | ✅ | ✅ | ✅ |
| アカウント不要 | ✅ | ❌ | ✅ | ✅ | ✅ |
| エンドツーエンド暗号化 | ✅ | ✅ | ✅ | ✅ | ✅ |
| フォルダ送信 | ✅ | ✅ | ✅ | ✅ | ✅（CLI のみ、ブラウザでは不可） |
| 再開可能な転送 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 無制限のファイルサイズ | ✅ | ✅ | ✅ | ✅ | ブラウザのメモリに制限される |
| プラットフォーム | CLI + デスクトップ + モバイル + Web | デスクトップ + モバイル（Web/CLI なし） | デスクトップ + モバイル（Web/CLI なし） | CLI のみ | Web/PWA + Android アプリ + CLI |
| 注意点 | 開発中 | クローズドソース；データの取り扱いを監査できない | 同一ネットワークのみ、再開不可 | CLI のみ；GUI フロントエンドは別個のコミュニティ管理プロジェクト | WebRTC/SCTP のスループット上限；ブラウザのメモリ制限 |

[詳しく見る →](https://www.dashbeam.net/en/compare)

## 内部構造

DashBeam は [Iroh](https://www.iroh.computer) 上に構築されています。Iroh は、デバイス間の直接通信を簡素化する最新のピアツーピアネットワーキングスタックです。実際には、デバイスは暗号化された QUIC 経由で通信し、ファイルはコンテンツアドレス指定の blob として移動し、直接経路が利用できない場合はリレーが支援します。

### 構成要素

| 要素 | DashBeam での役割 |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | ファイルデータの保存とストリーミング。すべてのチャンクは BLAKE3 で検証 |
| **Tickets** | ピアに *誰* に接続し *何* を取得するかを伝える 1 つの文字列 |
| **Endpoints** | 各デバイスの Iroh ID（Ed25519 キー → エンドポイント ID） |
| **QUIC + TLS 1.3** | 暗号化トランスポート。ヘッドオブラインブロッキングなしの多重化 |
| **Relays + hole punching** | NAT を越えた接続のブートストラップ。直接接続を優先し、リレーにフォールバック |
| **Control protocol** (pairing) | デバイスを記憶し、共有招待を配信する長寿命チャネル |

### Blobs

ファイルはサーバーにアップロードされません。**blob** として公開されます。BLAKE3 ハッシュでアドレス指定された不透明なバイト列です。

- **link** はその 32 バイトのハッシュです。ハッシュが一致すれば、コンテンツも一致します。
- フォルダや大容量ファイルは **HashSeq**（他の blob を指す blob）を使用します。
- 送信者が **provider**、受信者が **requester** です。どちらも両方の役割を担えます。

### Tickets

共有 **ticket** は、以下を 1 つのトークンにまとめたものです：

1. 送信者のエンドポイント ID（正しいデバイスと通信していることを確認）
2. 接続に必要なアドレス / リレー情報
3. ダウンロードする blob のハッシュ

チケットを共有した相手にのみ接続します。見知らぬ人に IP をブロードキャストすることはありません。これが Iroh が推奨するデフォルトの「cozy network」モデルであり、スワーム全体への flooding discovery とは異なります。

### ネットワーク越しの接続

2 台のデバイスが接続する必要がある場合：

1. 各デバイスがパブリック（またはセルフホスト）の **relay** に登録し、ファイアウォールや NAT を越えた経路を見つけられるようにします。
2. Iroh が **QUIC hole punching** を試み、直接のピアツーピアリンクにアップグレードします。
3. 直接経路が使えれば、トラフィックはデバイス間を直接流れます。使えなければ、リレーがフォールバックの UDP ホップとして経路に残ります。

いずれの場合も、ペイロードはエンドツーエンド暗号化されます。リレーが見るのは暗号文であり、ファイルではありません。[Iroh リレーの詳細 →](https://docs.iroh.computer/about/faq)

### QUIC と暗号化

QUIC（UDP ベース、HTTP/3 と同じ基盤）は TLS 1.3 をトランスポートに組み込みます。DashBeam にとって、これは暗号化と認証、共有輻輳制御による複数ストリーム、以前接続したピアへの高速再接続をもたらします。

### ペアリング済みデバイス

ペアリングはチケットに取って代わるものではなく、チケットを代わりに配信します。

1. デバイスは専用の制御 ALPN 上で短い **pairing code**（ホストのエンドポイント ID）を交換します。
2. 各側は接続に紐づく鍵素材にデバイスシークレットで署名し、相手の ID を証明してから、ピアをローカルに記憶します。
3. 永続的な制御接続がプレゼンス（オンライン / オフライン）を維持します。
4. 共有時、DashBeam は通常のワンタイム blob チケットを作成します。ペアリング済みデバイスを選ぶと、そのチケットがコピー＆ペーストの代わりにアプリ内 **invite** として送信されます。

手動チケットと [sendme CLI](https://www.iroh.computer/sendme) は、これまでどおりそのまま動作します。

### リレーと discovery のセルフホスト

独自の iroh リレーと discovery サーバーの運用方法、DashBeam での設定方法、パブリック / セルフホストの混在構成の挙動については、[`infra/README.md`](../../infra/README.md) を参照してください（リレー: [`../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam)、discovery: [`../../infra/dns/README.md`](../../infra/dns/README.md)）。


## 開発

前提条件、ローカルセットアップ、ビルド手順、テストについては [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) を参照してください。

## [Discord](https://discord.gg/xwb7z22Eve) に参加して貢献

貢献する最良の方法は、Discord に参加して挨拶することです。自己紹介をして、コーディング、テスト、デザインなど、どのようなスキルや興味があるかを共有してください。Issue の報告、修正の提案、アイデアの提案も歓迎です。メンテナーが各ステップをガイドします。

文脈を得て、方向性をすり合わせ、[コミュニティ](https://discord.gg/xwb7z22Eve)と協力するのに最適な場所です。

## ライセンス

AGPL-3.0

## プライバシーポリシー

DashBeam がデータとプライバシーをどのように扱うかについては [PRIVACY.md](../../PRIVACY.md) を参照してください。

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## コントリビューター

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## お問い合わせ

ご提案、フィードバック、メディア関連のお問い合わせは[こちら](https://www.dashbeam.net/en/contact)からどうぞ。


このプロジェクトをご覧いただきありがとうございます！役に立ったと思われたら、スターを付けて広めていただけると幸いです。




## 基盤技術

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

