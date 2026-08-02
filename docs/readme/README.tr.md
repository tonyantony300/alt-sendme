<img src="../../assets/rename-banner.svg" alt="Duyuru: AltSendme artık DashBeam oldu. Aynı uygulama; bulması, hatırlaması ve telaffuz etmesi daha kolay." width="1200" />

**Dil:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | 한국어 | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# Dosya transferleri bu kadar karışık olmamalı

</div>


![DashBeam Header](../../assets/header.png)

<div align="center">

![DashBeam çalışan demo](../../assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
[![Version][badge-version]](https://github.com/tonyantony300/dashbeam/releases/latest)
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)



</div>
[İleri teknolojiye sahip uçtan uca ağın](https://www.iroh.computer) gücünden yararlanarak size dosyalarınızı hiçbir bulut sunucuya kaydetmeden paylaşmanıza olan sağlayan ücretsiz, açık kaynak kodlu bir araç.

Uçtan uca şifrelenmiş ve hiçbir kişisel bilgiyi dahil etmeden, kolay ve güvenli bir şekilde dosyalarımızı paylaşmak varken neden WeTransfer, Dropbox veya Google Drive kullanalım ki?



## Özellikler

- **İstediğin yerden, istediğin yere gönder** - Masaüstü, Android, uçbirim, veya tarayıcıdan - bir platformdan gönder, diğerlerinden al.
- **İstediğin şeyi, boyutu ne kadar olursa olsun aktar** - İster dosya ister klasör olsun, uçtan uca BLAKE3 bütünlük kontrolü ile doğrulanır.
- **Zamanına değecek kadar hızlı** - Işık hızında aktarımlar için çoklu gigabit bağlantılarını tam kapasiteyle kullanır.
- **Varsayılan olarak gizli** - Hesap, kaydolma, takipçiler, reklamlar hiçbiri yok. 
- **Doğrudan cihazdan cihaza aktarım** - Dosyalar cihazınızdan cihazınıza kurumsal bulut depolamalarına uğramadan giderler.
- **Hep açık uçtan uca şifreleme** - Tüm aktarımlar TLS 1.3 'lü QUIC kullanır; aktarma noktaları, sürece dahil olsalar bile yalnızca şifrelenmiş trafiği görürler.
- **Kriptografik kimlik doğrulama** - Her bilet dosya aktarımı başlamadan önce doğru göndericiye bağlantı kurduğunuzdan emin olur.
- **Devam edilebilir & yayınlanabilir** - Bölünen aktarımlar otomatik olarak devam eder; aynı dosyayı tek seferde istediğiniz kişi ile paylaşabilirsiniz.
- **İndirmeden önce önizle** - İndirmeden önce aldığınız şeyi görebilirsiniz.
- **Bağlı cihazlar** - **Ayarlar → Cihazlar** kısmından bilgisayar ve Android telefonlarınızı bir defa bağlayın, sonrasında her seferde bilet kopyalamadan dosyaları gönderin.
- **Tüy kadar hafif** - Küçük kurulumlar, minimal web ayak izi.
- **Ücretsiz ve açık kaynak kodlu** - Yükleme maliyeti, boyut sınırı yok, topluluk tarafından yönetiliyor.


## Gerçek dünya istatistikleri


| Metrik | Raporlanan Değer |
|--------|--------|
| **En büyük aktarım** | 452 GB |
| **En hızlı büyük ölçekli aktarım** | 54 GB @ 123 MB/s (~1 Gbps) |
| **Yüksek hızlı toplu veri aktarımı** | 328 GB @ 93 MB/s |
| **Ölçülen en yüksek hız** | 125 MB/s (1 Gbps) |

*Aktarım verimliliği cihazınıza, ağınıza ve bağlanma yolunuza göre değişir.*



## Kurulum

Kurmanın en kolay yolu işletim sisteminiz için olan sürümü aşağıdan indirmektir.

<table>
  <tr>
    <td><b>Platform</b></td>
    <td><b>Önerilen</b></td>
    <td><b>Diğer formatlar</b></td>
    <td><b>Boyut</b></td>
  </tr>
  <tr>
    <td>💻 <b>Windows (x64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_x64-setup.exe'>Setup.exe</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_x64_en-US.msi'>MSI</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.2/DashBeam_0.6.2_x64-portable.zip'>Portable ZIP</a></td>
    <td>~10 MB</td>
  </tr>
  <tr>
    <td>💻 <b>macOS (Evrensel)</b></td>
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
    <td><a href='https://www.dashbeam.net/en/downloads'>İndirmeler</a></td>
    <td>-</td>
    <td>~4-5 MB</td>
  </tr>
  <tr>
    <td>🌐 <b>Web (Kısıtlı verimlilik)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Daha fazla seçim [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) veya [İndirmeşer](https://www.dashbeam.net/en/downloads) sayfasında bulunabilir.

Sorunla mı karşılaştınız? Yaygın sorunlar ve log toplamak için bakınız [Sorun Giderme](docs/troubleshooting.md)



## Partnerler

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

Görevimize katılacak Partnerler arıyoruz! Bizimle Partner olun ve biz uçtan uca dosya aktarımının sınırlarını zorlarken bize destek olun.

[**KONUŞALIM**](https://www.dashbeam.net/en/contact)


## Desteklenen Diller
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## Nasıl çalışıyor

1. Dosya veya klasörünüzü bırakın - DashBeam ("bilet" denen) bir tek seferlik paylaşım kodu oluşturur
2. Bileti sohbet, email veya kısa mesaj ile paylaşın **veya** direkt olarak eşleşmiş bir cihaza gönderin (masaüstü / Android).
3. Arkadaşınız bileti uygulamalarına yapıştırır (veya eşleşmiş bir cihazın davetini kabul eder), ve aktarım başlar.

### Eşleşmiş cihazlar

Linux, macOS, Windows ve Android'de cihazları **Ayarlar → Cihazlar** içinden eşleşme kodu kullanarak eşleştirebilirsiniz. Eşleştirdikten sonra:

- Gönderenler paylaşım yaparken eşleşmiş bir cihazın yanındaki **Gönder**'e basabilirler: otomatik bilet kopyalama yok.
- Alıcılar eşleşmiş bir yollayıcı onlara davet yolladığında uygulama içi bir bildirim alırlar (uygulama açık olmalı).
- Manuel biletler ve [sendme CLI](https://www.iroh.computer/sendme) hala önceki gibi çalışır.


## Karşılaştırma

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Ağ iletişim yığını | Iroh ile QUIC | Bilinmiyor | TCP üzerinden HTTPS/REST |  Şifrelenmiş TCP | WebRTC/DTLS (SCTP) |
| İnternet üzerinde çalışması | ✅ | ✅ | Sadece LAN | ✅ | ✅ |
| Gigabit bağlantılarını tam kapasiteye ulaştırması | ✅ | ✅ | ✅ (Sadece LAN) | ✅ | ❌ (SCTP/tarayıcı sınırı) |
| Açık kaynak durumu | ✅ | ❌ | ✅ | ✅ | ✅ |
| Hesap gerektirmemesi | ✅ | ❌ | ✅ | ✅ | ✅ |
| Uçtan uca şifreleme | ✅ | ✅ | ✅ | ✅ | ✅ |
| Klasör paylaşımı | ✅ | ✅ | ✅ | ✅ | ✅ (sadece CLI, tarayıcıda çalışmıyor) |
| Devam edilebilir paylaşım | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sınırsız dosya boyutu | ✅ | ✅ | ✅ | ✅ | Tarayıcı belleğine bağlı |
| Platformlar | CLI + masaüstü + mobil + web | Masaüstü + mobil (web/CLI yok) | Masaüstü + mobil (web/CLI yok) | Sadece CLI | Web/PWA + Android uygulama + CLI |
| Olumsuz yanları | WIP | Kapalı kaynak; verilerin nasıl işlendiği denetlenemez | Sadece aynı ağ, devam etme yok | Sadece CLI; GUI ön yüzleri ayrı, topluluk tarafından geliştiriliyor | WebRTC/SCTP verimlilik kısıtlaması; tarayıcı belleği sınırlı |

[Daha fazlası için →](https://www.dashbeam.net/en/compare)

## Arka planda

DashBeam, cihazlar arası doğrudan iletişimi kolaylaştıran modern bir eşler arası ağ yığını olan [Iroh](https://www.iroh.computer) üzerine kurulmuştur. Pratikte bu, cihazların şifreli QUIC üzerinden iletişim kurduğu, dosyaların içerik adresli blob’larla aktarıldığı ve doğrudan bir yol bulunmadığında aktarıcıların devreye girdiği anlamına gelir.

### Temel bileşenler

| Parça | Burada yaptığı |
|-------|-------------------|
| **Bloblar** (`iroh-blobs`) | Dosya verisini saklar ve yayınlar; her yığın BLAKE3 ile doğrulanır |
| **Biletler** | Bir eşe *kimi* arayacağını ve *neyi* alacağını belirten bir dizedir |
| **Uç noktalar** | Her cihazin Iroh kimliğidir (Ed25519 anahtarı → uç nokta idsi) |
| **QUIC + TLS 1.3** | Şifrelenmiş taşıma; kuyruk başı engellemesi olmadan çoklama |
| **Aktarıcılar + delik açma** | NAT'lar üzerinden Bootstrap bağlantılarıdır; doğrudan bağlantıyı tercih eder, aksi takdirde aktarıcıya geçer |
| **Kontrol protokolü** (eşleştirme) | Cihazları hatırlamak ve paylaşım davetleri göndermek için uzun ömürlü bir kanaldır. |

### Bloblar

Dosyalar herhangi bir sunucuya yüklenmez. Bunlar, bir BLAKE3 hash değeri ile adreslenen, içeriği bilinmeyen bayt dizileri olan **blob**’lar olarak yayınlanır.

- Bir **link** bu 32-baytlık hash değeridir: eğer hashler uyuşursa, içerik de uyuşur.
- Klasörler ve büyük dosyalar **HashSeq** kullanır (diğer blobları işaret eden bir blob).
- Gönderici **sağlayıcıdır**; alıcı da **isteyen**dir. İki taraf da ikisini yapabilir.

### Biletler

Bir paylaşım **bileti** şunları içeren tek bir tokendir:

1. Göndericinin uç nokta id'si (doğru cihaz ile bağlandığını bilmek için)
2. Onları aramak için yeterli adres / aktarma bilgisi
3. İndirilecek blob hashi

Sadece beraber bilet paylaştığınız kişilere bağlanırsınız: IP adresiniz yabancılara yayılmaz. Bu herkese tüm herşeyi açığa çıkaran yöntemin aksine, Iroh'un teşvik ettiği "samimi ağ" modelidir.

### Ağlar arası bağlanma

İki cihazın birbiri ile bağlantı kurması gerektiğinde:

1. Her bir cihaz, eşlerin güvenlik duvarları ve NAT’lar üzerinden bir yol bulabilmesi için herkese açık (veya kendi sunucusunda barındırılan) bir **aktarıcı**ya kaydolur.
2. Iroh, doğrudan eşler arası bağlantıya geçmek için **QUIC delik açma** işlemini dener.
3. Doğrudan bir yol kurulabilirse, trafik cihazdan cihaza aktarılır. Aksi takdirde, aktarıcı yedek bir UDP atlama noktası olarak yol üzerinde kalır.

İki durumda da yük uçtan uca şifrelenir. Aktarma sunucuları dosyalarınız değil, şifreli bir metin görür. [Iroh aktarma sunucuları hakkında daha fazla bilgi →](https://docs.iroh.computer/about/faq)

### QUIC & şifreleme

QUIC (UDP-tabanlı, HTTP/3 ile aynı temelden gelen) TLS 1.3'ü aktarım katmanına getirir. DashBeam için bu, şifreleme ve kimlik doğrulama, paylaşımlı tıkanıklık kontrolüne sahip çoklu akışlar ve daha önce bir eşle iletişim kurmuşsanız hızlı yeniden bağlanma imkânı anlamına gelir.

### Eşleşmiş cihazlar

Eşleşmek biletlerin yerini almaz; aksine sizin için biletleri iletir.

1. Cihazlar  özel bir ALPN kontrolü üzerinden kısa bir **eşleşme kodu** (sunucunun uçnokta id'si) paylaşırlar.
2. İki taraf da kimliklerini bağlantı-tabanlı bir anahtar materyali ile cihaz sırrını kullanarak imzalayarak onaylarlar, sonrasında karşı tarafı yerel olarak hatırlar.
3. Kalıcı bir kontrol bağlantısı durum bilgisini saklar (çevrim içi,çevrim dışı).
4. Paylaştığınızda, DashBeam yine de tek seferlik normal bir blob bileti oluşturur; eşlemiş bir cihaz seçildiğinde o bileti siz kopyalama yapıştırmanıza gerek kalmadan uygulama içi davet olarak gönderir.

Manuel biletler ve [sendme CLI](https://www.iroh.computer/sendme) eskisi gibi çalışmaya devam eder.

### Kendi sunucunuzda barındırılan aktarma sunucuları ve keşif

Kendi iroh aktarma ve keşif sunucunuzu nasıl çalıştıracağınız, DashBeam’i bunları kullanacak şekilde nasıl yapılandıracağınız ve kamuya açık ile kendi sunucunuzda barındırılan kurulumların bir arada nasıl çalıştığı hakkında bilgi için [`infra/README.md`](infra/README.md) dosyasına bakın (aktarım: [`infra/relay/README.md`](infra/relay/README.md#using-self-hosted-relays-with-dashbeam), keşif: [`infra/dns/README.md`](infra/dns/README.md)).


## Geliştirme

Ön gereklilikler, yerel kurulum, derleme aşamaları için [CONTRIBUTING.md](CONTRIBUTING.md#development-setup) 'ye bakın.

## Katkıda bulunmak için [Discord](https://discord.gg/xwb7z22Eve) 'umuza katılın

Katkıda bulunmanın en iyi Discord kanalımıza katılıp selam vermektir. Kendinizi tanıtın ve yeteneklerinizi veya ilgilerinizi - ister kodlama, ister test etme, ister tasarım veya başka bir şey de olur, paylaşın. Soru sorabilir, çözüm önerebilir, veya fikir de üretebilirsiniz. Geliştiriciler her yolda size yardımcı olmak için oradalar.

Burası, konuyu daha iyi anlamak, yön konusunda fikir almak ve [topluluk](https://discord.gg/xwb7z22Eve) ile işbirliği içinde olmak için en iyi yerdir.

## Lisans

AGPL-3.0

## Gizlilik Politikası

DashBeam'in bilginizi nasıl işlediği hakkında bilgi almak için [PRIVACY.md](PRIVACY.md) 'ye bakabilirsiniz.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Katkıda Bulunanlar

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## İletişim

Öneriler, geri bildirim veya medya ile alakalı iletişim için [buradan](https://www.dashbeam.net/en/contact) bana ulaşabilirsiniz.


Bu projeye göz gezdirdiğiniz için teşekkürler! Eğer işinize yaradıysa, yıldızlayıp başkalarının da bulmasına yardımcı olabilirsiniz.



## Altyapısı

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


