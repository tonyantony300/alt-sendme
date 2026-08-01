<img src="../../assets/rename-banner.svg" alt="Ogłoszenie: AltSendme to teraz DashBeam. Ta sama aplikacja — łatwiejsza do znalezienia, zapamiętania i wymówienia." width="1200" />

**Język:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | Polski | [العربية](README.ar.md)

<div align="center">

# Transfer plików nie musi być skomplikowany

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

Darmowe narzędzie open source do transferu plików, które wykorzystuje możliwości [nowoczesnej sieci peer-to-peer](https://www.iroh.computer), umożliwiając bezpośredni transfer plików bez przechowywania ich na serwerach w chmurze.

Po co polegać na WeTransfer, Dropbox czy Google Drive, skoro można niezawodnie i łatwo przesyłać pliki bezpośrednio — z szyfrowaniem end-to-end i bez ujawniania danych osobowych?



## Funkcje

- **Wysyłaj stamtąd, skąd chcesz, z czegokolwiek** — Desktop, Android, terminal lub przeglądarka — zacznij na jednej platformie, odbierz na dowolnej innej.
- **Przesyłaj cokolwiek, w dowolnym rozmiarze** — Pliki lub całe katalogi, weryfikowane end-to-end za pomocą kontroli integralności BLAKE3.
- **Wystarczająco szybko, by miało znaczenie** — Nasyca połączenia wielogigabitowe dla błyskawicznych transferów.
- **Prywatność domyślnie** — Bez kont, rejestracji, śledzenia, reklam.
- **Bezpośredni transfer urządzenie-do-urządzenia** — Pliki przemieszczają się bezpośrednio między Twoimi urządzeniami, omijając korporacyjne chmury, gdzie dane są ceną.
- **Szyfrowanie end-to-end, zawsze włączone** — Każdy transfer używa QUIC z TLS 1.3; relaye widzą tylko zaszyfrowany ruch, nawet jeśli biorą udział.
- **Uwierzytelnianie kryptograficzne** — Każdy ticket weryfikuje, że jesteś połączony z zamierzonym nadawcą, zanim jakiekolwiek pliki zostaną przesłane.
- **Wznawialne i nadawalne** — Przerwane transfery wznawiają się automatycznie; udostępniaj ten sam plik dowolnej liczbie peerów jednocześnie.
- **Podgląd przed pobraniem** — Zobacz, co otrzymujesz, zanim pobierzesz.
- **Sparowane urządzenia** — Sparuj komputery i telefony Android raz w **Ustawienia → Urządzenia**, a następnie wysyłaj pliki bez kopiowania ticketów za każdym razem.
- **Urządzenia w pobliżu w tej samej sieci** — Inne urządzenia DashBeam w Twojej sieci LAN pojawiają się automatycznie (mDNS). Sparuj w Ustawieniach lub wyślij podczas udostępniania — bez wklejania ticketu.
- **Obecność w tle** — Na desktopie działaj dalej w zasobniku lub pasku menu i opcjonalnie uruchamiaj przy logowaniu, aby sparowane urządzenia widziały Cię online.
- **Powiadomienia systemowe** — Prośby o parowanie i zaproszenia do plików mogą wyświetlać powiadomienia systemu, gdy aplikacja nie jest na pierwszym planie (desktop i Android).
- **Lekki jak piórko** — Niewielkie instalacje, minimalny ślad w sieci.
- **Darmowy i open source** — Bez kosztów uploadu, bez limitów rozmiaru, napędzany przez społeczność.


## Statystyki z praktyki


| Metryka | Zgłoszone |
|--------|----------|
| **Największy transfer** | 452 GB |
| **Najszybszy duży transfer** | 54 GB @ 123 MB/s (~1 Gbps) |
| **Transfer masowy z dużą prędkością** | 328 GB @ 93 MB/s |
| **Zmierzona szczytowa prędkość** | 125 MB/s (1 Gbps) |

*Przepustowość transferu zależy od urządzenia, sieci i ścieżki połączenia.*



## Instalacja

Najłatwiejszy sposób na start to pobranie jednej z poniższych wersji dla Twojego systemu operacyjnego:

<table>
  <tr>
    <td><b>Platforma</b></td>
    <td><b>Zalecane</b></td>
    <td><b>Inne formaty</b></td>
    <td><b>Rozmiar</b></td>
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
    <td>🌐 <b>Web (Ograniczona przepustowość)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Więcej opcji w [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) lub na stronie [Downloads](https://www.dashbeam.net/en/downloads).



## Partnerzy

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

Szukamy Partnerów, którzy dołączą do naszej misji! Zostań partnerem i wspieraj nas, gdy przesuwamy granice transferu plików peer-to-peer.

[**POROZMAWIAJMY**](https://www.dashbeam.net/en/contact)


## Obsługiwane języki
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## Jak to działa

1. Upuść plik lub folder — DashBeam tworzy jednorazowy kod udostępniania (zwany „ticketem”).
2. Udostępnij ticket przez czat, e-mail lub SMS, **lub** wyślij bezpośrednio do sparowanego lub pobliskiego urządzenia (desktop / Android).
3. Twój znajomy wkleja ticket w aplikacji (lub akceptuje zaproszenie), a transfer się rozpoczyna.

### Sparowane urządzenia

Na macOS, Windows, Linux i Android możesz sparować urządzenia w **Ustawienia → Urządzenia** za pomocą kodu parowania lub akceptując prośbę o parowanie Nearby w tej samej sieci lokalnej. Po sparowaniu:

- Nadawcy mogą dotknąć **Send** obok sparowanego urządzenia podczas udostępniania: bez ręcznego kopiowania ticketu.
- Odbiorcy otrzymują monit w aplikacji, gdy sparowany nadawca ich zaprasza; przy włączonych powiadomieniach systemowych mogą też dostać baner systemu, gdy okno nie ma fokusu.
- Na desktopie zasobnik / pasek menu może pokazywać, które sparowane urządzenia są online, a DashBeam może działać dalej po zamknięciu okna (**Ustawienia → Ogólne → Startup & background**).
- Ręczne tickety i [sendme CLI](https://www.iroh.computer/sendme) nadal działają dokładnie tak samo jak wcześniej.

### Urządzenia w pobliżu

Gdy inne aplikacje DashBeam są w tej samej sieci Wi-Fi lub LAN, mogą pojawić się w **Nearby** w **Ustawienia → Urządzenia** oraz w arkuszu **Send to a device** podczas udostępniania:

- **Sparuj** z Ustawień, aby dodać urządzenie bez wymiany kodu parowania.
- **Wyślij** z arkusza udostępniania, aby zaprosić urządzenie Nearby bieżącym ticketem; odbiorcy potwierdzają krótki kod weryfikacyjny przed akceptacją.
- Kontroluj, czy inni mogą Cię znaleźć, w **Ustawienia → Sieć → Your discoverability** (Everyone / Paired only / Off).

Nearby opiera się na [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS). Jeśli sieć blokuje multicast (Wi-Fi gościnne, wiele VPN), użyj ręcznego ticketu lub sparuj przez internet — zobacz [Rozwiązywanie problemów](../troubleshooting.md#the-nearby-list-is-empty).


## Porównanie

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Stos sieciowy | QUIC via Iroh | Nieznany | HTTPS/REST przez TCP | szyfrowany TCP | WebRTC/DTLS (SCTP) |
| Działa przez internet | ✅ | ✅ | Tylko LAN | ✅ | ✅ |
| Nasyca połączenia gigabitowe | ✅ | ✅ | ✅ (tylko LAN) | ✅ | ❌ (limit SCTP/przeglądarki) |
| Open source | ✅ | ❌ | ✅ | ✅ | ✅ |
| Bez konta | ✅ | ❌ | ✅ | ✅ | ✅ |
| Szyfrowanie end-to-end | ✅ | ✅ | ✅ | ✅ | ✅ |
| Wysyłanie folderów | ✅ | ✅ | ✅ | ✅ | ✅ (tylko CLI, nie w przeglądarce) |
| Wznawialne transfery | ✅ | ✅ | ❌ | ❌ | ❌ |
| Nieograniczony rozmiar pliku | ✅ | ✅ | ✅ | ✅ | Ograniczony pamięcią przeglądarki |
| Platformy | CLI + desktop + mobile + web | Desktop + mobile (bez web/CLI) | Desktop + mobile (bez web/CLI) | Tylko CLI | Web/PWA + aplikacja Android + CLI |
| Wykrywanie urządzeń w LAN | ✅ | ❌ | ✅ | ❌ | ✅ |
| Haczyk | W trakcie prac | Zamknięty kod źródłowy; obsługa danych nie podlega audytowi | Tylko ta sama sieć, brak wznawiania | Tylko CLI; interfejsy graficzne to osobne projekty utrzymywane przez społeczność | Limit przepustowości WebRTC/SCTP; limity pamięci przeglądarki |

[Dowiedz się więcej →](https://www.dashbeam.net/en/compare)

## Pod maską

DashBeam jest zbudowany na [Iroh](https://www.iroh.computer), nowoczesnym stosie sieci peer-to-peer, który upraszcza bezpośrednią komunikację urządzenie-do-urządzenia. W praktyce oznacza to, że urządzenia komunikują się przez szyfrowany QUIC, pliki są przesyłane jako bloby adresowane przez zawartość, a relaye pomagają, gdy bezpośrednia ścieżka nie jest dostępna.

### Elementy składowe

| Element | Co robi tutaj |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Przechowywanie i strumieniowanie danych plików; każdy fragment weryfikowany przez BLAKE3 |
| **Tickets** | Jeden ciąg znaków informujący peera, *kogo* wybrać i *co* pobrać |
| **Endpoints** | Tożsamość Iroh każdego urządzenia (klucz Ed25519 → id endpointu) |
| **QUIC + TLS 1.3** | Szyfrowany transport; multipleksowanie bez blokowania head-of-line |
| **Relays + hole punching** | Inicjowanie połączeń przez NAT; preferuj bezpośrednie, w razie potrzeby relay |
| **Control protocol** (pairing) | Długotrwały kanał do zapamiętywania urządzeń i dostarczania zaproszeń do udostępniania |
| **Local discovery** (mDNS) | Opcjonalna reklama w LAN, by urządzenia Nearby znajdowały się bez ticketu |

### Blobs

Pliki nie są uploadowane na serwer. Są publikowane jako **blobs**: nieprzezroczyste sekwencje bajtów adresowane przez hash BLAKE3.

- **Link** to ten 32-bajtowy hash: jeśli hash się zgadza, zawartość się zgadza.
- Foldery i duże pliki używają **HashSeq** (blob wskazujący na inne bloby).
- Nadawca to **provider**; odbiorca to **requester**. Każda strona może być obiema.

### Tickets

Ticket udostępniania to pojedynczy token zawierający:

1. Id endpointu nadawcy (aby wiedzieć, że rozmawiasz z właściwym urządzeniem)
2. Wystarczająco informacji adresowych / relay, aby się z nim połączyć
3. Hash bloba do pobrania

Łączysz się tylko z osobami, z którymi dzielisz ticket: bez rozgłaszania swojego IP obcym. To domyślny model „cozy network”, który promuje Iroh, w przeciwieństwie do odkrywania w całym swarmie.

### Łączenie przez sieci

Gdy dwa urządzenia muszą się spotkać:

1. Każde rejestruje się w publicznym (lub hostowanym samodzielnie) **relay**, aby peery mogły znaleźć ścieżkę przez firewalle i NAT.
2. Iroh próbuje **QUIC hole punching**, aby przejść na bezpośrednie połączenie peer-to-peer.
3. Jeśli bezpośrednia ścieżka działa, ruch idzie urządzenie-do-urządzenia. Jeśli nie, relay pozostaje na ścieżce jako zapasowy skok UDP.

W obu przypadkach payload jest szyfrowany end-to-end. Relaye widzą szyfrogram, nie Twoje pliki. [Więcej o relay Iroh →](https://docs.iroh.computer/about/faq)

### QUIC i szyfrowanie

QUIC (oparty na UDP, ta sama podstawa co HTTP/3) wprowadza TLS 1.3 do transportu. Dla DashBeam oznacza to szyfrowanie i uwierzytelnianie, wiele strumieni ze wspólną kontrolą przeciążenia oraz szybkie ponowne połączenia, gdy wcześniej rozmawiałeś z peerem.

### Sparowane urządzenia

Parowanie nie zastępuje ticketów; dostarcza je za Ciebie.

1. Urządzenia wymieniają krótki **kod parowania** (id endpointu hosta) przez dedykowany control ALPN.
2. Każda strona dowodzi tożsamości, podpisując materiał kluczowy powiązany z połączeniem swoim sekretem urządzenia, a następnie zapamiętuje peera lokalnie.
3. Trwałe połączenie control utrzymuje obecność (online/offline).
4. Gdy udostępniasz, DashBeam nadal tworzy normalny jednorazowy ticket bloba; wybierając sparowane urządzenie, wysyła ten ticket jako **zaproszenie** w aplikacji zamiast kopiować-wklejać.

Ręczne tickety i [sendme CLI](https://www.iroh.computer/sendme) nadal działają dokładnie tak samo jak wcześniej.

### Nearby (lokalne wykrywanie)

W tej samej sieci lokalnej DashBeam może reklamować i przeglądać peery przez mDNS (desktop i Android; nie aplikacja webowa).

1. Gdy wykrywalność to **Everyone**, urządzenie publikuje wystarczająco dużo metadanych, by inni widzieli jego nazwę w Nearby.
2. **Paired only** nadal ogłasza obecność bez ujawniania nazwy wyświetlanej obcym w LAN.
3. **Off** zatrzymuje reklamę; nadal możesz przeglądać i wysyłać do innych, którzy pozostają wykrywalni.
4. Zaproszenia do plików przy pierwszym kontakcie pokazują krótki kod weryfikacyjny wyprowadzony z kluczy publicznych obu urządzeń, aby każda strona mogła potwierdzić, że rozmawia z zamierzonym peerem przed akceptacją.
5. Akceptacja prośby o parowanie Nearby lub zaproszenia do pliku tworzy te same lokalne rekordy sparowanych urządzeń co parowanie kodem.

### Samodzielnie hostowane relaye i discovery

Informacje o uruchamianiu własnego relay i serwera discovery iroh, konfigurowaniu DashBeam do ich używania oraz zachowaniu mieszanych konfiguracji publicznych/samodzielnie hostowanych znajdziesz w [`infra/README.md`](../../infra/README.md) (relay: [`infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), discovery: [`infra/dns/README.md`](../../infra/dns/README.md)).


## Rozwój

Zobacz [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) — wymagania wstępne, lokalna konfiguracja, instrukcje budowania i testowanie.

## Dołącz do naszego [Discord](https://discord.gg/xwb7z22Eve), aby współtworzyć

Najlepszym sposobem na współtworzenie jest dołączenie do naszego Discorda i powiedzenie cześć. Przedstaw się i podziel swoimi umiejętnościami lub zainteresowaniami — czy to programowanie, testowanie, design, czy coś innego. Możesz też zgłaszać issue, proponować poprawki lub przedstawiać pomysły. Maintainerzy poprowadzą Cię na każdym kroku.

To najlepsze miejsce, aby zdobyć kontekst, uzgodnić kierunek i współpracować ze [społecznością](https://discord.gg/xwb7z22Eve).

## Licencja

AGPL-3.0

## Polityka prywatności

Zobacz [PRIVACY.md](../../PRIVACY.md), aby dowiedzieć się, jak DashBeam obsługuje Twoje dane i prywatność.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Współtwórcy

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## Kontakt

Skontaktuj się ze mną [tutaj](https://www.dashbeam.net/en/contact) w sprawie sugestii, opinii lub komunikacji medialnej.


Dziękujemy za sprawdzenie tego projektu! Jeśli uznasz go za przydatny, rozważ nadanie gwiazdki i pomoc w rozpowszechnianiu.




## Zbudowany na

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

