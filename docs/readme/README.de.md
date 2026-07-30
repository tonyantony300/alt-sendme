<img src="../../assets/rename-banner.svg" alt="Ankündigung: AltSendme heißt jetzt DashBeam. Dieselbe App – leichter zu finden, zu merken und auszusprechen." width="1200" />

**Sprache:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | Deutsch | [Français](README.fr.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# Dateitransfer muss nicht kompliziert sein

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

Ein kostenloses Open-Source-Tool für Dateitransfers, das die Möglichkeiten von [modernem Peer-to-Peer-Netzwerk](https://www.iroh.computer) nutzt und Ihnen erlaubt, Dateien direkt zu übertragen – ohne sie auf Cloud-Servern zu speichern.

Warum auf WeTransfer, Dropbox oder Google Drive setzen, wenn Sie Dateien zuverlässig und einfach direkt übertragen können – Ende-zu-Ende verschlüsselt und ohne persönliche Daten preiszugeben?



## Funktionen

- **Von überall senden, von allem aus** – Desktop, Android, Terminal oder Browser – starten Sie auf einer Plattform, empfangen Sie auf jeder anderen.
- **Alles übertragen, jede Größe** – Dateien oder ganze Ordner, Ende-zu-Ende verifiziert mit BLAKE3-Integritätsprüfungen.
- **Schnell genug, um zu zählen** – Sättigt Multi-Gigabit-Verbindungen für blitzschnelle Transfers.
- **Standardmäßig privat** – Keine Konten, keine Anmeldungen, kein Tracking, keine Werbung.
- **Direkter Gerät-zu-Gerät-Transfer** – Dateien bewegen sich direkt zwischen Ihren Geräten und umgehen Cloud-Speicher von Unternehmen, bei dem Daten der Preis sind.
- **Ende-zu-Ende-Verschlüsselung, immer aktiv** – Jeder Transfer nutzt QUIC mit TLS 1.3; Relays sehen nur verschlüsselten Traffic, selbst wenn sie beteiligt sind.
- **Kryptografische Authentifizierung** – Jedes Ticket bestätigt, dass Sie mit dem beabsichtigten Absender verbunden sind, bevor Dateien übertragen werden.
- **Fortsetzbar & broadcastfähig** – Unterbrochene Transfers werden automatisch fortgesetzt; teilen Sie dieselbe Datei gleichzeitig mit beliebig vielen Peers.
- **Vorschau vor dem Download** – Sehen Sie, was Sie empfangen, bevor Sie herunterladen.
- **Gepairte Geräte** – Paaren Sie Computer und Android-Handys einmal unter **Einstellungen → Geräte**, und senden Sie Dateien ohne jedes Mal Tickets kopieren zu müssen.
- **Leichtgewichtig** – Minimale Installation, geringer Web-Footprint.
- **Kostenlos & Open Source** – Keine Upload-Kosten, keine Größenlimits, community-getrieben.


## Statistiken aus der Praxis


| Metrik | Gemeldet |
|--------|----------|
| **Größter Transfer** | 452 GB |
| **Schnellster großer Transfer** | 54 GB @ 123 MB/s (~1 Gbps) |
| **Hochgeschwindigkeits-Massentransfer** | 328 GB @ 93 MB/s |
| **Gemessene Spitzengeschwindigkeit** | 125 MB/s (1 Gbps) |

*Der Transfer-Durchsatz hängt von Ihrem Gerät, Netzwerk und Verbindungspfad ab.*



## Installation

Der einfachste Einstieg ist der Download einer der folgenden Versionen für Ihr Betriebssystem:

<table>
  <tr>
    <td><b>Plattform</b></td>
    <td><b>Empfohlen</b></td>
    <td><b>Weitere Formate</b></td>
    <td><b>Größe</b></td>
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
    <td>🌐 <b>Web (Begrenzter Durchsatz)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Weitere Optionen unter [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) oder auf der Seite [Downloads](https://www.dashbeam.net/en/downloads).



## Partner

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

Wir suchen Partner, die unsere Mission unterstützen! Werden Sie Partner und unterstützen Sie uns, während wir die Grenzen des Peer-to-Peer-Dateitransfers verschieben.

[**SPRECHEN WIR**](https://www.dashbeam.net/en/contact)


## Unterstützte Sprachen
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## So funktioniert es

1. Datei oder Ordner ablegen – DashBeam erstellt einen einmaligen Freigabe-Code (ein sogenanntes „Ticket“).
2. Teilen Sie das Ticket per Chat, E-Mail oder SMS **oder** senden Sie direkt an ein gepairtes Gerät (Desktop / Android).
3. Ihr Freund fügt das Ticket in der App ein (oder nimmt eine Einladung von einem gepairten Gerät an), und der Transfer beginnt.

### Gepairte Geräte

Unter macOS, Windows, Linux und Android können Sie Geräte unter **Einstellungen → Geräte** mit einem Pairing-Code paaren. Nach dem Pairing:

- Absender können beim Teilen neben einem gepairten Gerät auf **Send** tippen – kein manuelles Kopieren des Tickets.
- Empfänger erhalten eine In-App-Aufforderung, wenn ein gepairter Absender sie einlädt (App muss geöffnet sein).
- Manuelle Tickets und die [sendme CLI](https://www.iroh.computer/sendme) funktionieren weiterhin genau wie zuvor.


## Vergleich

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Netzwerk-Stack | QUIC via Iroh | Unbekannt | HTTPS/REST über TCP | verschlüsseltes TCP | WebRTC/DTLS (SCTP) |
| Funktioniert über das Internet | ✅ | ✅ | Nur LAN | ✅ | ✅ |
| Sättigt Gigabit-Verbindungen | ✅ | ✅ | ✅ (nur LAN) | ✅ | ❌ (SCTP/Browser-Obergrenze) |
| Open Source | ✅ | ❌ | ✅ | ✅ | ✅ |
| Kein Konto erforderlich | ✅ | ❌ | ✅ | ✅ | ✅ |
| Ende-zu-Ende-Verschlüsselung | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ordner senden | ✅ | ✅ | ✅ | ✅ | ✅ (nur CLI, nicht im Browser) |
| Fortsetzbare Transfers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Unbegrenzte Dateigröße | ✅ | ✅ | ✅ | ✅ | Begrenzt durch Browser-Speicher |
| Plattformen | CLI + Desktop + Mobile + Web | Desktop + Mobile (kein Web/CLI) | Desktop + Mobile (kein Web/CLI) | Nur CLI | Web/PWA + Android-App + CLI |
| Der Haken | In Arbeit | Closed Source; Datenverarbeitung nicht prüfbar | Nur im selben Netzwerk, kein Fortsetzen | Nur CLI; GUI-Frontends sind separate, von der Community gepflegte Projekte | WebRTC/SCTP-Durchsatz-Obergrenze; Browser-Speicherlimits |

[Mehr erfahren →](https://www.dashbeam.net/en/compare)

## Unter der Haube

DashBeam basiert auf [Iroh](https://www.iroh.computer), einem modernen Peer-to-Peer-Netzwerk-Stack, der die direkte Gerät-zu-Gerät-Kommunikation vereinfacht. In der Praxis bedeutet das: Geräte kommunizieren über verschlüsseltes QUIC, Dateien werden als inhaltsadressierte Blobs übertragen, und Relays helfen, wenn kein direkter Pfad verfügbar ist.

### Die Bausteine

| Baustein | Funktion hier |
|----------|---------------|
| **Blobs** (`iroh-blobs`) | Dateidaten speichern und streamen; jeder Chunk wird mit BLAKE3 verifiziert |
| **Tickets** | Ein String, der einem Peer mitteilt, *wen* er anwählen und *was* er abrufen soll |
| **Endpoints** | Die Iroh-Identität jedes Geräts (Ed25519-Schlüssel → Endpoint-ID) |
| **QUIC + TLS 1.3** | Verschlüsselter Transport; Multiplexing ohne Head-of-Line-Blocking |
| **Relays + Hole Punching** | Verbindungen über NATs bootstrappen; direkten Pfad bevorzugen, Relay als Fallback |
| **Control protocol** (pairing) | Langfristiger Kanal, um Geräte zu merken und Freigabe-Einladungen zuzustellen |

### Blobs

Dateien werden nicht auf einen Server hochgeladen. Sie werden als **Blobs** veröffentlicht: undurchsichtige Byte-Sequenzen, die über einen BLAKE3-Hash adressiert werden.

- Ein **Link** ist dieser 32-Byte-Hash: stimmt der Hash, stimmt der Inhalt.
- Ordner und große Dateien nutzen eine **HashSeq** (ein Blob, der auf andere Blobs verweist).
- Der Absender ist der **Provider**; der Empfänger ist der **Requester**. Beide Seiten können beides sein.

### Tickets

Ein Freigabe-**Ticket** ist ein einzelnes Token, das enthält:

1. Die Endpoint-ID des Absenders (damit Sie wissen, dass Sie mit dem richtigen Gerät sprechen)
2. Genug Adress- / Relay-Informationen, um es anzuwählen
3. Den Blob-Hash zum Herunterladen

Sie verbinden sich nur mit Personen, mit denen Sie ein Ticket teilen – Ihre IP wird nicht an Fremde broadcastet. Das ist das standardmäßige „cozy network“-Modell, das Iroh empfiehlt, im Gegensatz zur Discovery im gesamten Swarm.

### Verbindung über Netzwerke hinweg

Wenn zwei Geräte sich treffen müssen:

1. Jedes registriert sich bei einem öffentlichen (oder selbst gehosteten) **Relay**, damit Peers einen Pfad durch Firewalls und NATs finden können.
2. Iroh versucht **QUIC Hole Punching**, um auf eine direkte Peer-to-Peer-Verbindung umzusteigen.
3. Funktioniert ein direkter Pfad, läuft der Traffic Gerät-zu-Gerät. Andernfalls bleibt das Relay als Fallback-UDP-Hop im Pfad.

In beiden Fällen ist die Nutzlast Ende-zu-Ende verschlüsselt. Relays sehen Chiffretext, nicht Ihre Dateien. [Mehr zu Iroh Relays →](https://docs.iroh.computer/about/faq)

### QUIC & Verschlüsselung

QUIC (UDP-basiert, dieselbe Grundlage wie HTTP/3) bringt TLS 1.3 in den Transport. Für DashBeam bedeutet das Verschlüsselung und Authentifizierung, mehrere Streams mit gemeinsamer Congestion Control und schnelle Wiederverbindungen, wenn Sie schon einmal mit einem Peer kommuniziert haben.

### Gepairte Geräte

Pairing ersetzt Tickets nicht; es liefert sie für Sie.

1. Geräte tauschen einen kurzen **Pairing-Code** (die Endpoint-ID des Hosts) über ein dediziertes Control-ALPN aus.
2. Jede Seite beweist ihre Identität, indem sie verbindungsgebundenes Keying-Material mit ihrem Geräte-Geheimnis signiert, und merkt sich den Peer lokal.
3. Eine persistente Control-Verbindung hält die Präsenz (online/offline) aufrecht.
4. Beim Teilen erstellt DashBeam weiterhin ein normales einmaliges Blob-Ticket; wählen Sie ein gepairtes Gerät, wird dieses Ticket als In-App-**Einladung** gesendet, statt es kopieren und einfügen zu müssen.

Manuelle Tickets und die [sendme CLI](https://www.iroh.computer/sendme) funktionieren weiterhin genau wie zuvor.

### Selbst gehostete Relays und Discovery

Wie Sie Ihren eigenen iroh-Relay und Discovery-Server betreiben, DashBeam dafür konfigurieren und wie gemischte öffentliche/selbst gehostete Setups funktionieren, finden Sie in [`infra/README.md`](../../infra/README.md) (Relay: [`infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), Discovery: [`infra/dns/README.md`](../../infra/dns/README.md)).


## Entwicklung

Siehe [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) für Voraussetzungen, lokale Einrichtung, Build-Anweisungen und Tests.

## Treten Sie unserem [Discord](https://discord.gg/xwb7z22Eve) bei, um mitzuwirken

Der beste Weg zum Mitwirken ist, unserem Discord beizutreten und Hallo zu sagen. Stellen Sie sich vor und teilen Sie Ihre Fähigkeiten oder Interessen – ob Programmierung, Testing, Design oder etwas anderes. Sie können auch Issues melden, Fixes vorschlagen oder Ideen einbringen. Maintainer begleiten Sie bei jedem Schritt.

Es ist der beste Ort, um Kontext zu bekommen, die Richtung abzustimmen und mit der [Community](https://discord.gg/xwb7z22Eve) zusammenzuarbeiten.

## Lizenz

AGPL-3.0

## Datenschutzerklärung

Siehe [PRIVACY.md](../../PRIVACY.md) für Informationen darüber, wie DashBeam mit Ihren Daten und Ihrer Privatsphäre umgeht.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Mitwirkende

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## Kontakt

Erreichen Sie mich [hier](https://www.dashbeam.net/en/contact) für Vorschläge, Feedback oder medienbezogene Anfragen.


Vielen Dank, dass Sie sich dieses Projekt angesehen haben! Wenn es Ihnen nützlich ist, geben Sie ihm gerne einen Stern und helfen Sie mit, es bekannt zu machen.




## Basiert auf

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

