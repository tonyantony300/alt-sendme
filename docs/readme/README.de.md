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

Wählen Sie den Weg, der gerade am nächsten liegt: **einen Link oder QR-Code senden**, der sich auf jedem Gerät öffnet, **an ein einmal gepairtes Gerät senden** oder **an ein Gerät senden, das bereits in Ihrem Netzwerk ist**. Alle drei bewegen dieselben Bytes auf dieselbe Weise – direkt und Ende-zu-Ende verschlüsselt.



## Funktionen

- **Plattformübergreifend** – Desktop, Android, CLI und Browser – im Web ohne Installation
- **Jede Datei, jede Größe** – Dateien oder Ordner, BLAKE3-verifiziert
- **Multi-Gigabit-Geschwindigkeit** – Sättigt schnelle Verbindungen
- **In der Nähe** – Automatische LAN-Erkennung; Pair & Send
- **Gepairte Geräte** – Einmal per Code (aus der Ferne) oder über Nearby paaren; senden ohne Tickets
- **Vertrauenswürdige Geräte** – Ein gepairtes Gerät für die automatische Annahme freigeben; seine Dateien kommen ohne Nachfrage an
- **Fortsetzbar & Multi-Peer** – Unterbrochene Transfers fortsetzen; an viele gleichzeitig teilen
- **Verbindung per Schlüssel** – Verbindung über die Geräteidentität statt über die IP-Adresse
- **Roaming** – Mitten im Transfer zwischen WLAN, Mobilfunk oder Netzwerken wechseln, ohne die Verbindung zu verlieren
- **Code, Link oder QR** – Der Empfänger braucht keine Installation (Browser oder App)
- **Vorschau & Verlauf** – Vor dem Download sehen; lokales Transfer-Protokoll
- **Erweiterter Debug-Modus** – Optionale Diagnose für Transparenz unter der Haube
- **Privat** – Keine Konten, kein Tracking, keine Werbung; direkt von Gerät zu Gerät
- **Verschlüsselt** – TLS 1.3 Ende-zu-Ende; authentifizierte Tickets
- **Relays selbst hosten** – Ungedrosselte Remote-Transfers über Ihr eigenes Relay (**Einstellungen → Infra**)
- **Immer erreichbar** – Hintergrund-Tray/-Dienst, Benachrichtigungen, Start bei Anmeldung
- **Leichtgewichtig & kostenlos** – Kleine Installationen; Open Source, keine Limits


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
    <td>🌐 <b>Web (Begrenzter Durchsatz)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Weitere Optionen unter [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) oder auf der Seite [Downloads](https://www.dashbeam.net/en/downloads).

Probleme? Siehe [Fehlerbehebung](../troubleshooting.md) für häufige Probleme und wie Sie Logs sammeln.



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
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## Sendemöglichkeiten
### Geräte in der Nähe (empfohlen)

Apps im selben Netzwerk erscheinen unter **Nearby** in **Einstellungen → Geräte** und in der Liste **Send to a device**, während Sie teilen. Wählen Sie ein Gerät in der Nähe und **Pair & Send**, um in einem Schritt zu paaren und den Transfer zu starten – Sie können auch in den Einstellungen paaren, ohne zu teilen. Beim Erstkontakt wird auf beiden Bildschirmen ein Verifizierungscode angezeigt. Wer Sie finden kann, legen Sie unter **Einstellungen → Netzwerk → Your discoverability** fest.

Nutzt [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) – in Gast-WLANs und VPNs oft blockiert. Siehe [Fehlerbehebung](../troubleshooting.md#the-nearby-list-is-empty), wenn die Liste leer bleibt.

### Gepairte Geräte

Paaren Sie unter **Einstellungen → Geräte** mit einem Pairing-Code (funktioniert aus der Ferne über das Internet) oder über eine Nearby-Anfrage im selben Netzwerk. Nach dem Pairing erscheint beim Teilen **Send** neben dem Gerät – kein Ticket zum Kopieren. Der Empfänger erhält eine In-App-Aufforderung. Auf dem Desktop kann DashBeam im Hintergrund weiterlaufen und online befindliche gepairte Geräte im Tray anzeigen (**Einstellungen → Allgemein → Startup & background**). Manuelle Tickets und die [sendme CLI](https://www.iroh.computer/sendme) funktionieren weiterhin.

### Ticket, Link oder QR-Code teilen (einmaliger Transfer)

Während des Teilens: **QR** zum Scannen mit der Kamera, **Share** für das System-Sheet, **Copy** für das rohe Ticket. Links haben die Form `https://app.dashbeam.net/receive?ticket=…` – unter Android öffnen sie die App, sonst die Web-App, sodass nichts installiert werden muss (für große Dateien ist die native App besser). Fügen Sie ein Ticket, einen Link oder die komplette Freigabe-Nachricht in „Empfangen“ ein.


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
| Geräte im LAN entdecken | ✅ | ❌ | ✅ | ❌ | ✅ |
| Der Haken | In Arbeit | Closed Source; Datenverarbeitung nicht prüfbar | Nur im selben Netzwerk, kein Fortsetzen | Nur CLI; GUI-Frontends sind separate, von der Community gepflegte Projekte | WebRTC/SCTP-Durchsatz-Obergrenze; Browser-Speicherlimits |

[Mehr erfahren →](https://www.dashbeam.net/en/compare)

## Unter der Haube

DashBeam basiert auf [Iroh](https://www.iroh.computer), einem modernen Peer-to-Peer-Netzwerk-Stack, der die direkte Gerät-zu-Gerät-Kommunikation vereinfacht. In der Praxis bedeutet das: Geräte kommunizieren über verschlüsseltes QUIC, Dateien werden als inhaltsadressierte Blobs übertragen, und Relays helfen, wenn kein direkter Pfad verfügbar ist.

> **Die lange Fassung:** [Under the hood](https://dashbeam.net/en/under-the-hood) erzählt dieselbe Architektur als Geschichte – Fingerabdrücke statt Dateinamen, Namen statt Adressen, Hole Punching, Roaming und was jede beteiligte Instanz sehen kann und was nicht.

### Die Bausteine

| Baustein | Funktion hier |
|----------|---------------|
| **Blobs** (`iroh-blobs`) | Dateidaten speichern und streamen; jeder Chunk wird mit BLAKE3 verifiziert |
| **Tickets** | Ein String, der einem Peer mitteilt, *wen* er anwählen und *was* er abrufen soll |
| **Endpoints** | Die Iroh-Identität jedes Geräts (Ed25519-Schlüssel → Endpoint-ID) |
| **QUIC + TLS 1.3** | Verschlüsselter Transport; Multiplexing ohne Head-of-Line-Blocking |
| **Relays + Hole Punching** | Verbindungen über NATs bootstrappen; das Relay überträgt Daten, während ein direkter Pfad ausgehandelt wird |
| **Control protocol** (pairing) | Langfristiger Kanal, um Geräte zu merken und Freigabe-Einladungen zuzustellen |
| **Local discovery** (mDNS) | Optionale LAN-Werbung, damit Nearby-Geräte einander ohne Ticket finden |
| **Empfangslinks** | Ein Ticket, verpackt in eine normale https-URL – unter Android ein App Link, sonst die Web-App |

### Blobs

Dateien werden nicht auf einen Server hochgeladen. Sie werden als **Blobs** veröffentlicht: undurchsichtige Byte-Sequenzen, die über einen BLAKE3-Hash adressiert werden.

- Ein **Link** ist dieser 32-Byte-Hash: stimmt der Hash, stimmt der Inhalt.
- Ordner und große Dateien nutzen eine **HashSeq** (ein Blob, der auf andere Blobs verweist).
- Der Absender ist der **Provider**; der Empfänger ist der **Requester**. Beide Seiten können beides sein.

Da dieser Hash ein BLAKE3-Baum ist und nicht ein einzelner Digest über die gesamte Datei, verifiziert sich jeder Chunk eigenständig gegen die Wurzel. Genau das macht das Fortsetzen günstig: Ein Empfänger, der nach einem Verbindungsabbruch zurückkehrt, weiß genau, welche Chunks er bereits hat *und verifiziert hat*, und fragt nur die Lücke an. Nichts bereits Empfangenes wird erneut gesendet, und nichts Ankommendes wird auf Vertrauen hin akzeptiert.

### Tickets

Ein Freigabe-**Ticket** ist ein einzelnes Token, das enthält:

1. Die Endpoint-ID des Absenders (damit Sie wissen, dass Sie mit dem richtigen Gerät sprechen)
2. Genug Adress- / Relay-Informationen, um es anzuwählen
3. Den Blob-Hash zum Herunterladen

Sie verbinden sich nur mit Personen, mit denen Sie ein Ticket teilen – Ihre IP wird nicht an Fremde broadcastet. Das ist das standardmäßige „cozy network“-Modell, das Iroh empfiehlt, im Gegensatz zur Discovery im gesamten Swarm.

Tickets, die nur eine Endpoint-ID enthalten, stützen sich auf Public-Key-Discovery (Pkarr), um aktuelle Adressen zu finden. Diese Einträge sind mit dem Endpoint-Schlüssel selbst signiert, sodass ein manipulierter Eintrag an der Verifizierung scheitert, statt Sie fehlzuleiten – dem Lookup-Dienst wird **Verfügbarkeit anvertraut, nicht Integrität**.

### Verbindung über Netzwerke hinweg

Wenn zwei Geräte sich treffen müssen:

1. Jedes registriert sich bei einem öffentlichen (oder selbst gehosteten) **Relay**, damit Peers einen Pfad durch Firewalls und NATs finden können.
2. Iroh versucht **QUIC Hole Punching**, um auf eine direkte Peer-to-Peer-Verbindung umzusteigen.
3. Funktioniert ein direkter Pfad, läuft der Traffic Gerät-zu-Gerät. Andernfalls bleibt das Relay als Fallback-UDP-Hop im Pfad.

In beiden Fällen ist die Nutzlast Ende-zu-Ende verschlüsselt. Relays sehen Chiffretext, nicht Ihre Dateien. [Mehr zu Iroh Relays →](https://docs.iroh.computer/about/faq)

Diese Schritte überlappen sich, statt nacheinander abzulaufen. Das Relay überträgt Ihre Daten bereits, während das Hole Punching verhandelt wird – nichts wartet also darauf, dass der direkte Pfad zustande kommt; der Transfer wird lediglich schneller, wenn und sobald es soweit ist. Etwa jeder zehnte Transfer bekommt überhaupt keinen direkten Pfad (symmetrisches NAT, abgeschottete Firmennetze) und läuft von Anfang bis Ende über das Relay.

### Roaming über Netzwerke hinweg

Eine Verbindung ist an den Schlüssel des Peers gebunden, nicht an dessen IP-Adresse – ein Netzwerkwechsel beendet sie daher nicht. Wechseln Sie mitten im Transfer von WLAN zu Mobilfunk, bemerkt iroh den Adresswechsel, lernt die neuen Kandidaten und veröffentlicht sie erneut für den Peer. Das Relay überträgt die Daten durchgehend, und das Hole Punching läuft auf dem neuen Pfad einfach erneut.

Adressen sind vergängliche Hinweise, keine Identität. Das ist der praktische Gewinn davon, Geräte über Schlüssel statt über ihren Standort zu benennen.

### QUIC & Verschlüsselung

QUIC (UDP-basiert, dieselbe Grundlage wie HTTP/3) bringt TLS 1.3 in den Transport. Für DashBeam bedeutet das Verschlüsselung und Authentifizierung, mehrere Streams mit gemeinsamer Congestion Control und schnelle Wiederverbindungen, wenn Sie schon einmal mit einem Peer kommuniziert haben.

### Gepairte Geräte

Pairing ersetzt Tickets nicht; es liefert sie für Sie.

1. Geräte tauschen einen kurzen **Pairing-Code** (die Endpoint-ID des Hosts) über ein dediziertes Control-ALPN aus.
2. Jede Seite beweist ihre Identität, indem sie verbindungsgebundenes Keying-Material mit ihrem Geräte-Geheimnis signiert, und merkt sich den Peer lokal.
3. Eine persistente Control-Verbindung hält die Präsenz (online/offline) aufrecht.
4. Beim Teilen erstellt DashBeam weiterhin ein normales einmaliges Blob-Ticket; wählen Sie ein gepairtes Gerät, wird dieses Ticket als In-App-**Einladung** gesendet, statt es kopieren und einfügen zu müssen.

Manuelle Tickets und die [sendme CLI](https://www.iroh.computer/sendme) funktionieren weiterhin genau wie zuvor.

### Nearby (lokale Discovery)

Im selben lokalen Netzwerk kann DashBeam Peers per mDNS bewerben und browsen (Desktop und Android; nicht die Web-App).

1. Wenn die Auffindbarkeit **Everyone** ist, veröffentlicht das Gerät genug Metadaten, damit andere seinen Namen unter Nearby sehen.
2. **Paired only** meldet weiterhin Präsenz, ohne den Anzeigenamen Fremden im LAN preiszugeben.
3. **Off** stoppt die Werbung; Sie können weiterhin browsen und an andere senden, die auffindbar bleiben.
4. Datei-Einladungen beim Erstkontakt zeigen einen kurzen Verifizierungscode, der aus den öffentlichen Schlüsseln beider Geräte abgeleitet wird, damit jede Seite vor dem Annehmen bestätigen kann, mit dem beabsichtigten Peer zu sprechen.
5. Das Annehmen einer Nearby-Pairing-Anfrage oder Datei-Einladung erzeugt dieselben lokalen Datensätze gepairter Geräte wie das Pairing per Code.

### Selbst gehostete Relays und Discovery

Wie Sie Ihren eigenen iroh-Relay und Discovery-Server betreiben, DashBeam dafür konfigurieren und wie gemischte öffentliche/selbst gehostete Setups funktionieren, finden Sie in [`infra/README.md`](../../infra/README.md) (Relay: [`infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), Discovery: [`infra/dns/README.md`](../../infra/dns/README.md)).

Die illustrierte Fassung all dessen – einschließlich einer vollständigen Darstellung dessen, was ein Relay-Betreiber, Ihr ISP und der Lookup-Dienst jeweils aus einem Transfer erfahren – finden Sie unter [Under the hood](https://dashbeam.net/en/under-the-hood).


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
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

