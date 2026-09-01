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

Wybierz drogę, która akurat jest pod ręką: **wyślij link lub kod QR**, który otworzy się na dowolnym urządzeniu, **wyślij na raz sparowane urządzenie** albo **wyślij na urządzenie, które jest już w Twojej sieci**. Wszystkie trzy przenoszą te same bajty w ten sam sposób – bezpośrednio i z szyfrowaniem end-to-end.



## Funkcje

- **Wieloplatformowość** – Desktop, Android, CLI i przeglądarka – w wersji webowej bez instalacji
- **Dowolny plik, dowolny rozmiar** – Pliki lub foldery, weryfikowane BLAKE3
- **Prędkości wielogigabitowe** – Wysyca szybkie łącza
- **W pobliżu** – Automatyczne wykrywanie w sieci LAN; Pair & Send
- **Sparowane urządzenia** – Sparuj raz kodem (zdalnie) lub przez Nearby; wysyłaj bez ticketów
- **Zaufane urządzenia** – Włącz automatyczne przyjmowanie dla sparowanego urządzenia; jego pliki trafiają do Ciebie bez pytania
- **Wznawianie i wielu odbiorców** – Wznawiaj przerwane transfery; udostępniaj wielu osobom naraz
- **Łączenie po kluczu** – Połączenie po tożsamości urządzenia, nie po adresie IP
- **Roaming** – Zmieniaj Wi-Fi, sieć komórkową lub sieci w trakcie transferu bez zrywania go
- **Kod, link lub QR** – Odbiorca nie musi nic instalować (przeglądarka lub aplikacja)
- **Podgląd i historia** – Zobacz przed pobraniem; lokalny dziennik transferów
- **Zaawansowany tryb debugowania** – Opcjonalna diagnostyka dla przejrzystości tego, co dzieje się pod maską
- **Prywatność** – Bez kont, śledzenia i reklam; bezpośrednio między urządzeniami
- **Szyfrowanie** – TLS 1.3 end-to-end; uwierzytelniane tickety
- **Własne relaye** – Nielimitowane transfery zdalne przez własny relay (**Ustawienia → Infra**)
- **Zawsze osiągalny** – Usługa/zasobnik w tle, powiadomienia, start przy logowaniu
- **Lekki i darmowy** – Małe instalacje; open source, bez limitów


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
    <td>🌐 <b>Web (Ograniczona przepustowość)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Więcej opcji w [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) lub na stronie [Downloads](https://www.dashbeam.net/en/downloads).

Masz problemy? Zajrzyj do [Rozwiązywania problemów](../troubleshooting.md) po typowe usterki i sposób zebrania logów.



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
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## Sposoby wysyłania
### Urządzenia w pobliżu (zalecane)

Aplikacje w tej samej sieci pojawiają się w sekcji **Nearby** w **Ustawienia → Urządzenia** oraz na liście **Send to a device** podczas udostępniania. Wybierz urządzenie w pobliżu i użyj **Pair & Send**, aby sparować i rozpocząć transfer w jednym kroku – możesz też sparować z poziomu Ustawień, bez udostępniania. Przy pierwszym kontakcie na obu ekranach pojawia się kod weryfikacyjny. To, kto może Cię znaleźć, ustawisz w **Ustawienia → Sieć → Your discoverability**.

Korzysta z [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) – często blokowanego w sieciach gościnnych i na VPN-ach. Jeśli lista pozostaje pusta, zobacz [Rozwiązywanie problemów](../troubleshooting.md#the-nearby-list-is-empty).

### Sparowane urządzenia

Sparuj w **Ustawienia → Urządzenia** kodem parowania (działa zdalnie, przez internet) albo prośbą Nearby w tej samej sieci. Po sparowaniu obok tego urządzenia pojawia się **Send** podczas udostępniania – nie trzeba kopiować ticketu. Odbiorca dostaje monit w aplikacji. Na desktopie DashBeam może działać w tle i pokazywać w zasobniku sparowane urządzenia, które są online (**Ustawienia → Ogólne → Startup & background**). Ręczne tickety i [CLI sendme](https://www.iroh.computer/sendme) nadal działają.

### Udostępnianie ticketu, linku lub kodu QR (transfer jednorazowy)

Podczas udostępniania: **QR** do zeskanowania aparatem, **Share** dla systemowego arkusza udostępniania, **Copy** dla surowego ticketu. Linki mają postać `https://app.dashbeam.net/receive?ticket=…` – na Androidzie otwierają aplikację, a poza nim aplikację webową, więc nie trzeba nic instalować (przy dużych plikach lepiej sprawdzi się aplikacja natywna). W polu odbioru wklej ticket, link albo całą wiadomość z udostępnienia.


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

> **Dłuższa wersja:** [Under the hood](https://dashbeam.net/en/under-the-hood) opowiada tę samą architekturę jak historię – odciski zamiast nazw plików, nazwy zamiast adresów, hole punching, roaming oraz to, co każdy pośrednik może, a czego nie może zobaczyć.

### Elementy składowe

| Element | Co robi tutaj |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Przechowywanie i strumieniowanie danych plików; każdy fragment weryfikowany przez BLAKE3 |
| **Tickets** | Jeden ciąg znaków informujący peera, *kogo* wybrać i *co* pobrać |
| **Endpoints** | Tożsamość Iroh każdego urządzenia (klucz Ed25519 → id endpointu) |
| **QUIC + TLS 1.3** | Szyfrowany transport; multipleksowanie bez blokowania head-of-line |
| **Relays + hole punching** | Nawiązywanie połączeń przez NAT-y; relay przenosi dane, gdy negocjowana jest ścieżka bezpośrednia |
| **Control protocol** (pairing) | Długotrwały kanał do zapamiętywania urządzeń i dostarczania zaproszeń do udostępniania |
| **Local discovery** (mDNS) | Opcjonalna reklama w LAN, by urządzenia Nearby znajdowały się bez ticketu |
| **Linki odbiorcze** | Ticket opakowany w zwykły adres https – App Link na Androidzie, aplikacja webowa wszędzie indziej |

### Blobs

Pliki nie są uploadowane na serwer. Są publikowane jako **blobs**: nieprzezroczyste sekwencje bajtów adresowane przez hash BLAKE3.

- **Link** to ten 32-bajtowy hash: jeśli hash się zgadza, zawartość się zgadza.
- Foldery i duże pliki używają **HashSeq** (blob wskazujący na inne bloby).
- Nadawca to **provider**; odbiorca to **requester**. Każda strona może być obiema.

Ponieważ ten skrót jest drzewem BLAKE3, a nie pojedynczym skrótem całego pliku, każdy fragment weryfikuje się samodzielnie względem korzenia. To właśnie sprawia, że wznawianie jest tanie: odbiorca wracający po zerwaniu połączenia wie dokładnie, które fragmenty już ma *i zweryfikował*, więc prosi tylko o brakującą część. Nic, co już dotarło, nie jest wysyłane ponownie, a nic, co przychodzi, nie jest przyjmowane na wiarę.

### Tickets

Ticket udostępniania to pojedynczy token zawierający:

1. Id endpointu nadawcy (aby wiedzieć, że rozmawiasz z właściwym urządzeniem)
2. Wystarczająco informacji adresowych / relay, aby się z nim połączyć
3. Hash bloba do pobrania

Łączysz się tylko z osobami, z którymi dzielisz ticket: bez rozgłaszania swojego IP obcym. To domyślny model „cozy network”, który promuje Iroh, w przeciwieństwie do odkrywania w całym swarmie.

Tickety zawierające wyłącznie identyfikator endpointu opierają się na wykrywaniu po kluczu publicznym (Pkarr), aby odnaleźć aktualne adresy. Takie wpisy są podpisane samym kluczem endpointu, więc zmanipulowany wpis nie przejdzie weryfikacji, zamiast skierować Cię w złe miejsce – usłudze wyszukiwania ufamy w kwestii **dostępności, a nie integralności**.

### Łączenie przez sieci

Gdy dwa urządzenia muszą się spotkać:

1. Każde rejestruje się w publicznym (lub hostowanym samodzielnie) **relay**, aby peery mogły znaleźć ścieżkę przez firewalle i NAT.
2. Iroh próbuje **QUIC hole punching**, aby przejść na bezpośrednie połączenie peer-to-peer.
3. Jeśli bezpośrednia ścieżka działa, ruch idzie urządzenie-do-urządzenia. Jeśli nie, relay pozostaje na ścieżce jako zapasowy skok UDP.

W obu przypadkach payload jest szyfrowany end-to-end. Relaye widzą szyfrogram, nie Twoje pliki. [Więcej o relay Iroh →](https://docs.iroh.computer/about/faq)

Te kroki nakładają się na siebie, zamiast ustawiać się w kolejce. Relay przenosi już Twoje dane, gdy trwa negocjacja hole punchingu, więc nic nie czeka na powodzenie ścieżki bezpośredniej – transfer po prostu przyspiesza, jeśli i kiedy się ona uda. Mniej więcej jeden transfer na dziesięć w ogóle nie dostaje ścieżki bezpośredniej (symetryczny NAT, zamknięte sieci firmowe) i od początku do końca jedzie przez relay.

### Roaming między sieciami

Połączenie jest związane z kluczem drugiej strony, a nie z jej adresem IP, więc zmiana sieci go nie kończy. Przełącz się z Wi-Fi na sieć komórkową w trakcie transferu, a iroh zauważy zmianę adresu, pozna nowych kandydatów i ponownie opublikuje ich dla drugiej strony. Relay przez cały czas przenosi dane, a hole punching po prostu uruchamia się ponownie na nowej ścieżce.

Adresy są jednorazowymi wskazówkami, a nie tożsamością. To praktyczna korzyść z nazywania urządzeń kluczem zamiast lokalizacją.

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

Ilustrowaną wersję wszystkiego powyżej – wraz z pełnym opisem tego, czego z transferu dowiadują się operator relaya, Twój dostawca internetu i usługa wyszukiwania – znajdziesz w [Under the hood](https://dashbeam.net/en/under-the-hood).


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
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

