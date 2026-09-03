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

そのときいちばん手近な方法を選べます。どの端末でも開ける**リンクや QR コードを送る**、**一度ペアリングした端末に送る**、**すでに同じネットワークにいる端末に送る** — この 3 つはいずれも同じバイトを同じ方法で運びます。直接、エンドツーエンドで暗号化して。



## 機能

- **クロスプラットフォーム** — デスクトップ、Android、CLI、ブラウザ — ウェブ版はインストール不要
- **どんなファイルでも、どんなサイズでも** — ファイルもフォルダも、BLAKE3 で検証
- **マルチギガビットの速度** — 高速回線を使い切ります
- **Nearby（近くの端末）** — LAN 上で自動検出。Pair & Send に対応
- **ペアリング済みデバイス** — コード（リモート）または Nearby で一度ペアリングすれば、以降は ticket なしで送信
- **信頼済みデバイス** — ペアリング済みのデバイスを自動受信に設定すれば、そのデバイスからのファイルは確認なしで届きます
- **再開・複数同時** — 中断した転送を再開。複数の相手に同時に共有
- **鍵で接続** — IP アドレスではなく、デバイスの識別情報で接続
- **ローミング** — 転送中に Wi-Fi・モバイル回線・ネットワークを切り替えても切断されません
- **コード、リンク、QR** — 受け取る側はインストール不要（ブラウザでもアプリでも）
- **プレビューと履歴** — ダウンロード前に確認。転送ログはローカルに保存
- **高度なデバッグモード** — 内部の動きを見えるようにする任意の診断機能
- **プライベート** — アカウント・トラッキング・広告なし。デバイス間で直接
- **暗号化** — TLS 1.3 でエンドツーエンド。ticket は認証付き
- **relay のセルフホスト** — 自前の relay を使えば、リモート転送も速度制限なし（**設定 → Infra**）
- **常に到達可能** — バックグラウンドのトレイ/サービス、通知、ログイン時に起動
- **軽量で無料** — インストールサイズは小さく、オープンソースで制限なし


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
    <td>🌐 <b>Web（スループット制限あり）</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

その他のオプションは [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) または [Downloads](https://www.dashbeam.net/en/downloads) ページをご覧ください。

うまくいかないときは、よくある問題とログの取り方をまとめた[トラブルシューティング](../troubleshooting.md)をご覧ください。



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
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## 送信方法
### 近くのデバイス（推奨）

同じネットワーク上のアプリは、**設定 → デバイス**の **Nearby** と、共有中の **Send to a device** の一覧に表示されます。近くのデバイスを選んで **Pair & Send** を押せば、ペアリングと転送開始を一度に行えます — 共有せずに設定からペアリングすることもできます。初回の接続時には両方の画面に確認コードが表示されます。誰から見つけられるようにするかは**設定 → ネットワーク → Your discoverability** で設定します。

[mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) を使用します — ゲスト用 Wi-Fi や VPN ではブロックされていることがよくあります。一覧が空のままの場合は[トラブルシューティング](../troubleshooting.md#the-nearby-list-is-empty)をご覧ください。

### ペアリング済みデバイス

**設定 → デバイス**でペアリングコードを使ってペアリングするか（インターネット越しのリモートでも可能）、同じネットワーク上で Nearby のリクエストからペアリングします。ペアリング後は、共有中にそのデバイスの横に **Send** が表示され、ticket をコピーする必要はありません。受け取る側にはアプリ内で通知が表示されます。デスクトップではバックグラウンドで動作を続け、オンラインのペアリング済みデバイスをトレイに表示できます（**設定 → 一般 → Startup & background**）。手動の ticket と [sendme CLI](https://www.iroh.computer/sendme) も引き続き使えます。

### ticket・リンク・QR コードで共有（単発の転送）

共有中は、カメラで読み取る **QR**、システムの共有シートを開く **Share**、ticket をそのままコピーする **Copy** が使えます。リンクは `https://app.dashbeam.net/receive?ticket=…` の形式です — Android ではアプリが開き、それ以外ではウェブ版が開くので、相手は何もインストールする必要がありません（大きなファイルにはネイティブアプリのほうが適しています）。受信欄には ticket、リンク、共有メッセージ全文のいずれを貼り付けても構いません。


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
| LAN 上のデバイス検出 | ✅ | ❌ | ✅ | ❌ | ✅ |
| 注意点 | 開発中 | クローズドソース；データの取り扱いを監査できない | 同一ネットワークのみ、再開不可 | CLI のみ；GUI フロントエンドは別個のコミュニティ管理プロジェクト | WebRTC/SCTP のスループット上限；ブラウザのメモリ制限 |

[詳しく見る →](https://www.dashbeam.net/en/compare)

## 内部構造

DashBeam は [Iroh](https://www.iroh.computer) 上に構築されています。Iroh は、デバイス間の直接通信を簡素化する最新のピアツーピアネットワーキングスタックです。実際には、デバイスは暗号化された QUIC 経由で通信し、ファイルはコンテンツアドレス指定の blob として移動し、直接経路が利用できない場合はリレーが支援します。

> **詳しい解説:** [Under the hood](https://dashbeam.net/en/under-the-hood) では同じアーキテクチャを読み物として紹介しています — ファイル名ではなくフィンガープリント、アドレスではなく名前、ホールパンチング、ローミング、そして各中継者に何が見えて何が見えないのか。

### 構成要素

| 要素 | DashBeam での役割 |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | ファイルデータの保存とストリーミング。すべてのチャンクは BLAKE3 で検証 |
| **Tickets** | ピアに *誰* に接続し *何* を取得するかを伝える 1 つの文字列 |
| **Endpoints** | 各デバイスの Iroh ID（Ed25519 キー → エンドポイント ID） |
| **QUIC + TLS 1.3** | 暗号化トランスポート。ヘッドオブラインブロッキングなしの多重化 |
| **Relays + hole punching** | NAT を越えた接続のブートストラップ。直接経路を交渉している間も relay がデータを運ぶ |
| **Control protocol** (pairing) | デバイスを記憶し、共有招待を配信する長寿命チャネル |
| **Local discovery** (mDNS) | Nearby デバイスがチケットなしで互いに見つかるためのオプションの LAN 広告 |
| **受信リンク** | 通常の https URL に包まれた ticket — Android では App Link、それ以外ではウェブ版が開く |

### Blobs

ファイルはサーバーにアップロードされません。**blob** として公開されます。BLAKE3 ハッシュでアドレス指定された不透明なバイト列です。

- **link** はその 32 バイトのハッシュです。ハッシュが一致すれば、コンテンツも一致します。
- フォルダや大容量ファイルは **HashSeq**（他の blob を指す blob）を使用します。
- 送信者が **provider**、受信者が **requester** です。どちらも両方の役割を担えます。

このハッシュはファイル全体に対する 1 つのダイジェストではなく BLAKE3 のツリーなので、チャンクごとに単独でルートに対して検証できます。再開が安上がりなのはこのためです。接続が切れた後に戻ってきた受信側は、すでに保持していて*検証も済んでいる*チャンクを正確に把握しているため、欠けた部分だけを要求します。受信済みのものが再送されることはなく、届いたものが無検証で受け入れられることもありません。

### Tickets

共有 **ticket** は、以下を 1 つのトークンにまとめたものです：

1. 送信者のエンドポイント ID（正しいデバイスと通信していることを確認）
2. 接続に必要なアドレス / リレー情報
3. ダウンロードする blob のハッシュ

チケットを共有した相手にのみ接続します。見知らぬ人に IP をブロードキャストすることはありません。これが Iroh が推奨するデフォルトの「cozy network」モデルであり、スワーム全体への flooding discovery とは異なります。

endpoint id しか含まない ticket は、現在のアドレスを見つけるために公開鍵ディスカバリ（Pkarr）に頼ります。これらのレコードは endpoint の鍵自身で署名されているため、改ざんされたレコードは誤った相手に誘導するのではなく検証に失敗します — ルックアップサービスに求められる信頼は**可用性であって、完全性ではありません**。

### ネットワーク越しの接続

2 台のデバイスが接続する必要がある場合：

1. 各デバイスがパブリック（またはセルフホスト）の **relay** に登録し、ファイアウォールや NAT を越えた経路を見つけられるようにします。
2. Iroh が **QUIC hole punching** を試み、直接のピアツーピアリンクにアップグレードします。
3. 直接経路が使えれば、トラフィックはデバイス間を直接流れます。使えなければ、リレーがフォールバックの UDP ホップとして経路に残ります。

いずれの場合も、ペイロードはエンドツーエンド暗号化されます。リレーが見るのは暗号文であり、ファイルではありません。[Iroh リレーの詳細 →](https://docs.iroh.computer/about/faq)

これらのステップは順番待ちではなく、重なり合って進みます。ホールパンチングの交渉中にも relay はすでにデータを運んでいるため、直接経路の成立を待つものは何もありません — 直接経路ができれば転送が速くなるだけです。およそ 10 回に 1 回の転送は直接経路をまったく確立できず（対称型 NAT や制限の厳しい企業ネットワークなど）、最初から最後まで relay を経由します。

### ネットワークをまたぐローミング

接続は相手の IP アドレスではなく鍵に結び付いているため、ネットワークが変わっても接続は途切れません。転送中に Wi-Fi からモバイル回線に切り替えると、iroh はアドレスの変化に気付き、新しい候補を把握して相手に再度公開します。その間ずっと relay がデータを運び、ホールパンチングは新しい経路であらためて実行されるだけです。

アドレスは使い捨てのヒントであって、アイデンティティではありません。デバイスを場所ではなく鍵で名付けることの実際的な利点がここにあります。

### QUIC と暗号化

QUIC（UDP ベース、HTTP/3 と同じ基盤）は TLS 1.3 をトランスポートに組み込みます。DashBeam にとって、これは暗号化と認証、共有輻輳制御による複数ストリーム、以前接続したピアへの高速再接続をもたらします。

### ペアリング済みデバイス

ペアリングはチケットに取って代わるものではなく、チケットを代わりに配信します。

1. デバイスは専用の制御 ALPN 上で短い **pairing code**（ホストのエンドポイント ID）を交換します。
2. 各側は接続に紐づく鍵素材にデバイスシークレットで署名し、相手の ID を証明してから、ピアをローカルに記憶します。
3. 永続的な制御接続がプレゼンス（オンライン / オフライン）を維持します。
4. 共有時、DashBeam は通常のワンタイム blob チケットを作成します。ペアリング済みデバイスを選ぶと、そのチケットがコピー＆ペーストの代わりにアプリ内 **invite** として送信されます。

手動チケットと [sendme CLI](https://www.iroh.computer/sendme) は、これまでどおりそのまま動作します。

### Nearby（ローカル発見）

同じローカルネットワーク上で、DashBeam は mDNS でピアを広告・ブラウズできます（デスクトップと Android；Web アプリは対象外）。

1. 発見可能性が **Everyone** のとき、デバイスは十分なメタデータを公開し、他者が Nearby でその名前を表示できるようにします。
2. **Paired only** はプレゼンスを引き続き告知しつつ、LAN 上の見知らぬ人に表示名を公開しません。
3. **Off** は広告を停止します。発見可能なままの他者をブラウズし、送信することはできます。
4. 初回接触のファイル招待では、両デバイスの公開鍵から導出された短い検証コードが表示され、各側が承認前に意図したピアと通信していることを確認できます。
5. Nearby のペアリング要求またはファイル招待を承認すると、コードベースのペアリングと同じローカルなペアリング済みデバイス記録が作成されます。

### リレーと discovery のセルフホスト

独自の iroh リレーと discovery サーバーの運用方法、DashBeam での設定方法、パブリック / セルフホストの混在構成の挙動については、[`infra/README.md`](../../infra/README.md) を参照してください（リレー: [`../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam)、discovery: [`../../infra/dns/README.md`](../../infra/dns/README.md)）。

以上のすべてを図解したものは — relay の運営者、ISP、ルックアップサービスがそれぞれ転送から何を知り得るのかの詳細も含めて — [Under the hood](https://dashbeam.net/en/under-the-hood) をご覧ください。


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
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

