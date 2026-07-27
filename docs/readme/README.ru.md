<img src="../../assets/rename-banner.svg" alt="Объявление: AltSendme теперь DashBeam. То же приложение, проще найти, запомнить и произнести." width="1200" />

**Язык:** [English](../../README.md) | [中文](README.zh-CN.md) | Русский | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# Передача файлов не должна быть сложной

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

Бесплатный инструмент с открытым исходным кодом для передачи файлов, использующий [передовую одноранговую сеть](https://www.iroh.computer), позволяющий передавать файлы напрямую без хранения на облачных серверах.

Зачем полагаться на WeTransfer, Dropbox или Google Drive, когда можно надёжно и просто передавать файлы напрямую, с сквозным шифрованием и без раскрытия личной информации?



## Возможности

- **Отправляйте откуда угодно, с чего угодно** — настольный компьютер, Android, терминал или браузер — начните на одной платформе, получите на любой другой.
- **Передавайте что угодно, любого размера** — файлы или целые каталоги, проверяемые end-to-end с помощью BLAKE3.
- **Достаточно быстро, чтобы это имело значение** — насыщает многогигабитные соединения для молниеносной передачи.
- **Приватность по умолчанию** — без аккаунтов, регистрации, отслеживания и рекламы.
- **Прямая передача устройство-устройство** — файлы перемещаются напрямую между вашими устройствами, минуя корпоративное облачное хранилище, где данные — это плата.
- **Сквозное шифрование, всегда включено** — каждая передача использует QUIC с TLS 1.3; реле видят только зашифрованный трафик, даже если участвуют в соединении.
- **Криптографическая аутентификация** — каждый ticket подтверждает, что вы подключены к нужному отправителю, прежде чем начнётся передача файлов.
- **Возобновляемая и широковещательная** — прерванные передачи возобновляются автоматически; делитесь одним файлом с любым числом получателей одновременно.
- **Предпросмотр перед загрузкой** — посмотрите, что вы получаете, прежде чем скачивать.
- **Сопряжённые устройства** — один раз сопрягите компьютеры и телефоны Android в **Настройки → Устройства**, затем отправляйте файлы без копирования ticket каждый раз.
- **Лёгкий как перышко** — крошечные установщики, минимальный веб-след.
- **Бесплатный и с открытым кодом** — без платы за загрузку, без ограничений размера, развивается сообществом.


## Статистика из реального использования


| Показатель | Зарегистрировано |
|--------|--------|
| **Самая крупная передача** | 452 GB |
| **Самая быстрая крупная передача** | 54 GB @ 123 MB/s (~1 Gbps) |
| **Массовая передача на высокой скорости** | 328 GB @ 93 MB/s |
| **Измеренная пиковая скорость** | 125 MB/s (1 Gbps) |

*Пропускная способность зависит от вашего устройства, сети и пути соединения.*



## Установка

Самый простой способ начать — скачать одну из следующих версий для вашей операционной системы:

<table>
  <tr>
    <td><b>Платформа</b></td>
    <td><b>Рекомендуется</b></td>
    <td><b>Другие форматы</b></td>
    <td><b>Размер</b></td>
  </tr>
  <tr>
    <td>💻 <b>Windows (x64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64-setup.exe'>Setup.exe</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64_en-US.msi'>MSI</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64-portable.zip'>Portable ZIP</a></td>
    <td>~10 MB</td>
  </tr>
  <tr>
    <td>💻 <b>macOS (Universal)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_universal.dmg'>DashBeam.dmg</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_aarch64.dmg'>Apple Silicon</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64.dmg'>Intel</a></td>
    <td>~15 MB</td>
  </tr>
  <tr>
    <td>💻 <b>Linux (amd64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_amd64.deb'>DashBeam.deb</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-0.6.0-1.x86_64.rpm'>.rpm</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_amd64.AppImage'>AppImage</a></td>
    <td>~13 MB</td>
  </tr>
  <tr>
    <td>📱 <b>Android (arm64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-v0.6.0-arm64.apk'>DashBeam.apk</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-v0.6.0-armv7.apk'>armv7</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-v0.6.0-universal.apk'>universal</a></td>
    <td>~50 MB</td>
  </tr>
  <tr>
    <td>⌨️ <b>CLI</b></td>
    <td><a href='https://www.dashbeam.net/en/downloads'>Downloads</a></td>
    <td>-</td>
    <td>~4-5 MB</td>
  </tr>
  <tr>
    <td>🌐 <b>Web (Ограниченная пропускная способность)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Другие варианты на странице [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) или [Downloads](https://www.dashbeam.net/en/downloads).



## Партнёры

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

Мы ищем партнёров для нашей миссии! Станьте партнёром и поддержите нас, пока мы расширяем границы одноранговой передачи файлов.

[**ДАВАЙТЕ ПОГОВОРИМ**](https://www.dashbeam.net/en/contact)


## Поддерживаемые языки
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## Как это работает

1. Перетащите файл или папку — DashBeam создаст одноразовый код для обмена (называемый «ticket»).
2. Отправьте ticket через чат, email или SMS, **или** отправьте напрямую на сопряжённое устройство (настольный компьютер / Android).
3. Ваш друг вставляет ticket в приложение (или принимает приглашение с сопряжённого устройства), и передача начинается.

### Сопряжённые устройства

На macOS, Windows, Linux и Android вы можете сопрягать устройства в **Настройки → Устройства** с помощью кода сопряжения. После сопряжения:

- Отправители могут нажать **Отправить** рядом с сопряжённым устройством при обмене: без ручного копирования ticket.
- Получатели получают запрос в приложении, когда сопряжённый отправитель приглашает их (приложение должно быть открыто).
- Ручные ticket и [sendme CLI](https://www.iroh.computer/sendme) работают точно так же, как и раньше.


## Сравнение

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Сетевой стек | QUIC via Iroh | Неизвестно | HTTPS/REST поверх TCP | шифрованный TCP | WebRTC/DTLS (SCTP) |
| Работает через интернет | ✅ | ✅ | только LAN | ✅ | ✅ |
| Насыщает гигабитные соединения | ✅ | ✅ | ✅ (только LAN) | ✅ | ❌ (потолок SCTP/браузера) |
| Открытый исходный код | ✅ | ❌ | ✅ | ✅ | ✅ |
| Без аккаунта | ✅ | ❌ | ✅ | ✅ | ✅ |
| Сквозное шифрование | ✅ | ✅ | ✅ | ✅ | ✅ |
| Отправка папок | ✅ | ✅ | ✅ | ✅ | ✅ (только CLI, не в браузере) |
| Возобновляемые передачи | ✅ | ✅ | ❌ | ❌ | ❌ |
| Неограниченный размер файла | ✅ | ✅ | ✅ | ✅ | Ограничено памятью браузера |
| Платформы | CLI + десктоп + мобильные + веб | Десктоп + мобильные (без веб/CLI) | Десктоп + мобильные (без веб/CLI) | Только CLI | Web/PWA + приложение Android + CLI |
| Подводный камень | В разработке | Закрытый исходный код; обработку данных нельзя проверить | Только в одной сети, без возобновления | Только CLI; GUI-оболочки отдельные, поддерживаются сообществом | Потолок пропускной способности WebRTC/SCTP; ограничения памяти браузера |

[Подробнее →](https://www.dashbeam.net/en/compare)

## Под капотом

DashBeam построен на [Iroh](https://www.iroh.computer) — современном одноранговом сетевом стеке, упрощающем прямое общение устройство-устройство. На практике это означает, что устройства общаются через зашифрованный QUIC, файлы передаются с помощью content-addressed blobs, а реле помогают, когда прямой путь недоступен.

### Строительные блоки

| Компонент | Что делает здесь |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Хранение и потоковая передача данных файлов; каждый фрагмент проверяется с помощью BLAKE3 |
| **Tickets** | Одна строка, которая сообщает одноранговому узлу, *кому* звонить и *что* загружать |
| **Endpoints** | Iroh-идентичность каждого устройства (ключ Ed25519 → endpoint id) |
| **QUIC + TLS 1.3** | Зашифрованный транспорт; мультиплексирование без блокировки head-of-line |
| **Relays + hole punching** | Инициализация соединений через NAT; предпочтение прямого пути, резерв — реле |
| **Control protocol** (pairing) | Долгоживущий канал для запоминания устройств и доставки приглашений к обмену |

### Blobs

Файлы не загружаются на сервер. Они публикуются как **blobs**: непрозрачные последовательности байтов, адресуемые хешем BLAKE3.

- **Link** — это 32-байтовый хеш: если хеш совпадает, совпадает и содержимое.
- Папки и большие файлы используют **HashSeq** (blob, указывающий на другие blobs).
- Отправитель — **provider**; получатель — **requester**. Любая сторона может быть и тем, и другим.

### Tickets

**Ticket** для обмена — это один токен, который содержит:

1. Endpoint id отправителя (чтобы вы знали, что общаетесь с нужным устройством)
2. Достаточно адресной информации / информации о реле для подключения
3. Хеш blob для загрузки

Вы подключаетесь только к людям, с которыми делитесь ticket: без трансляции вашего IP незнакомцам. Это модель «cozy network» по умолчанию, которую продвигает Iroh, в отличие от flooding discovery по всему swarm.

### Подключение через сети

Когда двум устройствам нужно соединиться:

1. Каждое регистрируется на публичном (или self-hosted) **relay**, чтобы одноранговые узлы могли найти путь через брандмауэры и NAT.
2. Iroh пытается выполнить **QUIC hole punching** для перехода на прямое одноранговое соединение.
3. Если прямой путь работает, трафик идёт устройство-устройство. Если нет, relay остаётся на пути как резервный UDP-hop.

В любом случае полезная нагрузка зашифрована end-to-end. Реле видят шифротекст, а не ваши файлы. [Подробнее о реле Iroh →](https://docs.iroh.computer/about/faq)

### QUIC и шифрование

QUIC (на базе UDP, та же основа, что у HTTP/3) встраивает TLS 1.3 в транспорт. Для DashBeam это даёт шифрование и аутентификацию, несколько потоков с общим управлением перегрузкой и быстрое переподключение, если вы уже общались с одноранговым узлом раньше.

### Сопряжённые устройства

Сопряжение не заменяет tickets; оно доставляет их за вас.

1. Устройства обмениваются коротким **кодом сопряжения** (endpoint id хоста) через выделенный control ALPN.
2. Каждая сторона подтверждает личность, подписывая connection-bound keying material своим device secret, затем запоминает одноранговый узел локально.
3. Постоянное control-соединение поддерживает присутствие (online/offline).
4. Когда вы делитесь файлом, DashBeam по-прежнему создаёт обычный одноразовый blob ticket; выбор сопряжённого устройства отправляет этот ticket как **приглашение** в приложении вместо копирования и вставки.

Ручные tickets и [sendme CLI](https://www.iroh.computer/sendme) работают точно так же, как и раньше.

### Self-hosting реле и discovery

Инструкции по запуску собственного iroh relay и discovery server, настройке DashBeam для их использования и поведению смешанных public/self-hosted конфигураций см. в [`../../infra/README.md`](../../infra/README.md) (relay: [`../../infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), discovery: [`../../infra/dns/README.md`](../../infra/dns/README.md)).


## Разработка

См. [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) для требований, локальной настройки, инструкций по сборке и тестированию.

## Присоединяйтесь к нашему [Discord](https://discord.gg/xwb7z22Eve), чтобы внести вклад

Лучший способ помочь — присоединиться к нашему Discord и поздороваться. Представьтесь и расскажите о своих навыках или интересах — будь то программирование, тестирование, дизайн или что-то ещё. Вы также можете создавать issues, предлагать исправления или делиться идеями. Мейнтейнеры помогут вам на каждом шаге.

Это лучшее место, чтобы получить контекст, согласовать направление и сотрудничать с [сообществом](https://discord.gg/xwb7z22Eve).

## Лицензия

AGPL-3.0

## Политика конфиденциальности

См. [PRIVACY.md](../../PRIVACY.md) для информации о том, как DashBeam обрабатывает ваши данные и обеспечивает конфиденциальность.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Участники

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## Контакты

Свяжитесь со мной [здесь](https://www.dashbeam.net/en/contact) для предложений, отзывов или медиа-запросов.


Спасибо, что заглянули в этот проект! Если он вам полезен, поставьте звезду и помогите распространить информацию о нём.




## Создано на базе

<div align="left">
  <a href="https://iroh.computer">
    <img alt="iroh" src="https://raw.githubusercontent.com/n0-computer/iroh/main/.img/iroh_wordmark.svg" width="200">
  </a>
</div>




<!-- <div align="center" style="color: gray;"></div> -->

[badge-website]: https://img.shields.io/badge/website-dashbeam.net-orange
[badge-version]: https://img.shields.io/badge/version-0.6.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

