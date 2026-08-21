**اللغة:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Polski](README.pl.md) | العربية

<div dir="rtl">

<div align="center">

# نقل الملفات لا يحتاج أن يكون معقدًا

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

أداة مجانية ومفتوحة المصدر لنقل الملفات تستفيد من قوة [شبكات الند للند المتطورة](https://www.iroh.computer)، لتنقل الملفات مباشرة دون تخزينها على خوادم سحابية.

لماذا الاعتماد على WeTransfer أو Dropbox أو Google Drive بينما يمكنك نقل الملفات بشكل موثوق وسهل، مع تشفير من طرف إلى طرف دون الكشف عن أي معلومات شخصية؟

اختر الطريقة الأقرب إليك: **أرسل رابطًا أو رمز QR** يُفتح على أي جهاز، أو **أرسل إلى جهاز اقترنت به مرة واحدة**، أو **أرسل إلى جهاز موجود بالفعل على شبكتك**. الطرق الثلاث تنقل البايتات نفسها بالطريقة نفسها — مباشرةً ومشفّرة من طرف إلى طرف.



## الميزات

- **متعدد المنصات** — سطح المكتب وAndroid وسطر الأوامر والمتصفح — بلا تثبيت على الويب
- **أي ملف وأي حجم** — ملفات أو مجلدات، موثّقة بـ BLAKE3
- **سرعات بجيجابت متعددة** — يستغل الاتصالات السريعة بالكامل
- **الأجهزة القريبة** — اكتشاف تلقائي على الشبكة المحلية؛ Pair & Send
- **الأجهزة المقترنة** — اقترن مرة واحدة برمز (عن بُعد) أو عبر Nearby، ثم أرسل بلا تذاكر
- **قابل للاستئناف ومتعدد الأقران** — استأنف عمليات النقل المتوقفة، وشارك مع عدة أشخاص في آن واحد
- **الاتصال بالمفتاح** — اتصال بهوية الجهاز لا بعنوان IP
- **التجوال** — بدّل بين Wi-Fi وبيانات الهاتف والشبكات أثناء النقل دون انقطاعه
- **رمز أو رابط أو QR** — لا يحتاج المستقبِل إلى أي تثبيت (متصفح أو تطبيق)
- **معاينة وسجل** — شاهد قبل التنزيل، مع سجل محلي لعمليات النقل
- **وضع تصحيح متقدم** — تشخيصات اختيارية لشفافية ما يجري خلف الكواليس
- **خصوصية** — بلا حسابات ولا تتبّع ولا إعلانات؛ مباشرة بين الأجهزة
- **تشفير** — TLS 1.3 من طرف إلى طرف، وتذاكر موثّقة
- **استضافة ذاتية للمرحّلات** — عمليات نقل عن بُعد بلا تقييد للسرعة عبر مرحّلك الخاص (**الإعدادات → Infra**)
- **متاح دائمًا** — خدمة/أيقونة في الخلفية، وإشعارات، وبدء التشغيل عند تسجيل الدخول
- **خفيف ومجاني** — حجم تثبيت صغير، مفتوح المصدر وبلا حدود


## إحصائيات من الواقع


| المقياس | المُبلَّغ |
|--------|--------|
| **أكبر نقل** | 452 GB |
| **أسرع نقل كبير** | 54 GB @ 123 MB/s (~1 Gbps) |
| **نقل جماعي عالي السرعة** | 328 GB @ 93 MB/s |
| **أقصى سرعة مُقاسة** | 125 MB/s (1 Gbps) |

*يعتمد معدل النقل على جهازك وشبكتك ومسار الاتصال.*



## التثبيت

أسهل طريقة للبدء هي تنزيل أحد الإصدارات التالية لنظام التشغيل الخاص بك:

<table dir="ltr">
  <tr>
    <td><b>Platform</b></td>
    <td><b>Recommended</b></td>
    <td><b>Other formats</b></td>
    <td><b>Size</b></td>
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
    <td>🌐 <b>Web (Limited throughput)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

خيارات إضافية في [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) أو في صفحة [Downloads](https://www.dashbeam.net/en/downloads).

تواجه مشكلات؟ راجع [استكشاف الأخطاء](../troubleshooting.md) للمشكلات الشائعة وكيفية جمع السجلات.



## الشركاء

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

نبحث عن شركاء ينضمون إلى مهمتنا! شاركنا الدعم بينما ندفع حدود نقل الملفات من نظير إلى نظير.

[**لنتحدث**](https://www.dashbeam.net/en/contact)


## اللغات المدعومة
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## طرق الإرسال
### الأجهزة القريبة (موصى به)

تظهر التطبيقات الموجودة على الشبكة نفسها ضمن **Nearby** في **الإعدادات → الأجهزة**، وفي قائمة **Send to a device** أثناء المشاركة. اختر جهازًا قريبًا ثم **Pair & Send** لتقترن به وتبدأ النقل في خطوة واحدة — ويمكنك أيضًا الاقتران من الإعدادات دون مشاركة. يعرض الاتصال الأول رمز تحقق على كلتا الشاشتين. حدّد من يمكنه العثور عليك من **الإعدادات → الشبكة → Your discoverability**.

يعتمد على [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) — وكثيرًا ما يُحجب على شبكات Wi-Fi للضيوف وعلى شبكات VPN. راجع [استكشاف الأخطاء](../troubleshooting.md#the-nearby-list-is-empty) إذا بقيت القائمة فارغة.

### الأجهزة المقترنة

اقترن من **الإعدادات → الأجهزة** برمز اقتران (يعمل عن بُعد عبر الإنترنت) أو عبر طلب Nearby على الشبكة نفسها. بعد الاقتران يظهر **Send** بجوار ذلك الجهاز أثناء المشاركة — دون نسخ أي تذكرة. ويصل المستقبِل إشعار داخل التطبيق. على سطح المكتب يمكن للتطبيق أن يستمر في العمل في الخلفية وأن يعرض الأجهزة المقترنة المتصلة في شريط النظام (**الإعدادات → عام → Startup & background**). ولا تزال التذاكر اليدوية و[سطر أوامر sendme](https://www.iroh.computer/sendme) تعمل كما هي.

### مشاركة تذكرة أو رابط أو رمز QR (نقل لمرة واحدة)

أثناء المشاركة: **QR** للمسح بالكاميرا، و**Share** لفتح ورقة المشاركة في النظام، و**Copy** لنسخ التذكرة نفسها. تأخذ الروابط الشكل `https://app.dashbeam.net/receive?ticket=…` — على Android تفتح التطبيق، وفي غيره تفتح تطبيق الويب، فلا حاجة إلى تثبيت أي شيء (الملفات الكبيرة أفضل عبر التطبيق الأصلي). ويمكنك لصق تذكرة أو رابط أو رسالة المشاركة كاملة في خانة الاستقبال.


## المقارنة

<div dir="ltr">

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| حزمة الشبكات | QUIC via Iroh | غير معروف | HTTPS/REST فوق TCP | TCP مشفّر | WebRTC/DTLS (SCTP) |
| يعمل عبر الإنترنت | ✅ | ✅ | LAN فقط | ✅ | ✅ |
| يشبع اتصالات الجيجابت | ✅ | ✅ | ✅ (LAN فقط) | ✅ | ❌ (سقف SCTP/المتصفح) |
| مفتوح المصدر | ✅ | ❌ | ✅ | ✅ | ✅ |
| لا حاجة إلى حساب | ✅ | ❌ | ✅ | ✅ | ✅ |
| تشفير من طرف إلى طرف | ✅ | ✅ | ✅ | ✅ | ✅ |
| إرسال المجلدات | ✅ | ✅ | ✅ | ✅ | ✅ (CLI فقط، غير متاح في المتصفح) |
| عمليات نقل قابلة للاستئناف | ✅ | ✅ | ❌ | ❌ | ❌ |
| حجم ملف غير محدود | ✅ | ✅ | ✅ | ✅ | محدود بذاكرة المتصفح |
| المنصات | CLI + سطح المكتب + الهاتف + الويب | سطح المكتب + الهاتف (بدون ويب/CLI) | سطح المكتب + الهاتف (بدون ويب/CLI) | CLI فقط | Web/PWA + تطبيق Android + CLI |
| اكتشاف الأجهزة على LAN | ✅ | ❌ | ✅ | ❌ | ✅ |
| المأخذ | قيد التطوير | مغلق المصدر؛ لا يمكن تدقيق معالجة البيانات | نفس الشبكة فقط، دون استئناف | CLI فقط؛ الواجهات الرسومية مشاريع منفصلة يصونها المجتمع | سقف إنتاجية WebRTC/SCTP؛ حدود ذاكرة المتصفح |

</div>

[اعرف المزيد ←](https://www.dashbeam.net/en/compare)

## تحت الغطاء

يُبنى DashBeam على [Iroh](https://www.iroh.computer)، وهي حزمة شبكات حديثة من نظير إلى نظير تُبسّط التواصل المباشر بين الأجهزة. عمليًا، يعني ذلك أن الأجهزة تتواصل عبر QUIC المشفّر، وتنتقل الملفات كـ blobs معنونة بالمحتوى، وتساعد المرحّلات عندما لا يتوفر مسار مباشر.

> **النسخة المطوّلة:** يستعرض [Under the hood](https://dashbeam.net/en/under-the-hood) البنية نفسها في شكل سردي — بصمات بدل أسماء الملفات، وأسماء بدل العناوين، وثقب الجدران (hole punching)، والتجوال، وما الذي يمكن لكل وسيط أن يراه وما لا يمكنه.

### لبنات البناء

| المكوّن | دوره هنا |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | تخزين وبث بيانات الملفات؛ يُتحقق من كل جزء عبر BLAKE3 |
| **Tickets** | سلسلة واحدة تخبر النظير *من* يتصل به و*ماذا* يجلب |
| **Endpoints** | هوية Iroh لكل جهاز (مفتاح Ed25519 → endpoint id) |
| **QUIC + TLS 1.3** | نقل مشفّر؛ تعدد القنوات دون حظر head-of-line |
| **Relays + hole punching** | تؤسس الاتصالات عبر NAT؛ ويحمل المرحّل البيانات ريثما يُتفاوض على مسار مباشر |
| **Control protocol** (pairing) | قناة طويلة الأمد لتذكّر الأجهزة وتوصيل دعوات المشاركة |
| **Local discovery** (mDNS) | إعلان اختياري على الشبكة المحلية حتى تجد أجهزة Nearby بعضها دون تذكرة |
| **روابط الاستقبال** | تذكرة مغلّفة داخل رابط https عادي — App Link على Android، وتطبيق الويب في ما عداه |

### Blobs

لا تُرفع الملفات إلى خادم. تُنشر كـ **blobs**: تسلسلات بايتات غير شفافة معنونة بـ hash BLAKE3.

- **link** هو ذلك الـ hash البالغ 32 بايت: إذا تطابق الـ hash، تطابق المحتوى.
- تستخدم المجلدات والملفات الكبيرة **HashSeq** (blob يشير إلى blobs أخرى).
- المرسل هو **provider**؛ والمستقبل هو **requester**. يمكن لأي طرف القيام بالدورين.

ولأن هذا التجزيء شجرة BLAKE3 لا بصمة واحدة للملف كله، فإن كل جزء يتحقق بنفسه في مقابل الجذر. وهذا ما يجعل الاستئناف رخيصًا: فالمستقبِل العائد بعد انقطاع الاتصال يعرف تمامًا أي الأجزاء لديه *وتحقق منها*، فيطلب الناقص وحده. فلا يُعاد إرسال ما وصل، ولا يُقبل ما يصل بناءً على الثقة.

### Tickets

**ticket** المشاركة هو رمز واحد يضم:

1. endpoint id للمرسل (لتعرف أنك تتحدث إلى الجهاز الصحيح)
2. معلومات عنوان / مرحّل كافية للاتصال به
3. hash الـ blob للتنزيل

لا تتصل إلا بمن تشارك معهم تذكرة: دون بث عنوان IP الخاص بك للغرباء. هذا هو نموذج «cozy network» الافتراضي الذي يشجعه Iroh، مقابل اكتشاف يغمر السرب بأكمله.

التذاكر التي لا تحمل سوى معرّف endpoint تعتمد على الاكتشاف بالمفتاح العام (Pkarr) للعثور على العناوين الحالية. وهذه السجلات موقّعة بمفتاح الـ endpoint نفسه، فالسجل المتلاعب به يفشل في التحقق بدل أن يضللك — فخدمة البحث مؤتمنة على **التوافر لا على السلامة**.

### الاتصال عبر الشبكات

عندما يحتاج جهازان للالتقاء:

1. يسجل كل منهما لدى **relay** عام (أو مستضاف ذاتيًا) حتى يجد الأقران مسارًا عبر جدران الحماية وNAT.
2. يحاول Iroh **QUIC hole punching** للترقية إلى رابط مباشر من نظير إلى نظير.
3. إذا نجح مسار مباشر، تمر الحركة من جهاز إلى جهاز. وإلا، يبقى المرحّل في المسار كقفزة UDP احتياطية.

في كلتا الحالتين، الحمولة مشفّرة من طرف إلى طرف. يرى المرحّلون ciphertext وليس ملفاتك. [المزيد عن مرحّلات Iroh ←](https://docs.iroh.computer/about/faq)

وهذه الخطوات تتداخل بدل أن تتتابع. فالمرحّل ينقل بياناتك بالفعل بينما يجري التفاوض على hole punching، فلا شيء ينتظر نجاح المسار المباشر — وإنما يزداد النقل سرعة إن نجح ومتى نجح. ونحو عملية نقل من كل عشر لا تحصل على مسار مباشر إطلاقًا (NAT متماثل، أو شبكات مؤسسية مقيّدة) فتمضي عبر المرحّل من أولها إلى آخرها.

### التجوال بين الشبكات

يرتبط الاتصال بمفتاح الطرف الآخر لا بعنوان IP الخاص به، فتغيير الشبكة لا ينهيه. بدّل من Wi-Fi إلى بيانات الهاتف في منتصف النقل، فيلاحظ iroh تغيّر العنوان، ويتعرّف على المرشحين الجدد، وينشرهم من جديد للطرف الآخر. ويحمل المرحّل البيانات طوال ذلك، ويُعاد تشغيل hole punching ببساطة على المسار الجديد.

فالعناوين تلميحات قابلة للاستبدال، لا هوية. وهذا هو المكسب العملي من تسمية الأجهزة بمفاتيحها بدل مواقعها.

### QUIC والتشفير

يجلب QUIC (قائم على UDP، نفس أساس HTTP/3) TLS 1.3 إلى النقل. لـ DashBeam، هذا يوفر التشفير والمصادقة، وقنوات متعددة مع تحكم مشترك في الازدحام، وإعادة اتصال سريعة عند التحدث إلى نظير سابقًا.

### الأجهزة المقترنة

الاقتران لا يحل محل التذاكر؛ بل يُسلّمها نيابةً عنك.

1. تتبادل الأجهزة **pairing code** قصيرًا (endpoint id للمضيف) عبر ALPN تحكم مخصص.
2. يثبت كل طرف هويته بتوقيع مواد مفتاحية مرتبطة بالاتصال بسر الجهاز، ثم يتذكّر النظير محليًا.
3. يحافظ اتصال تحكم دائم على الحضور (متصل / غير متصل).
4. عند المشاركة، لا يزال DashBeam ينشئ ticket blob لمرة واحدة عاديًا؛ واختيار جهاز مقترن يُرسل تلك التذكرة كـ **invite** داخل التطبيق بدلًا من إجبارك على النسخ واللصق.

تظل التذاكر اليدوية و[sendme CLI](https://www.iroh.computer/sendme) تعمل تمامًا كما كانت.

### Nearby (الاكتشاف المحلي)

على نفس الشبكة المحلية، يمكن لـ DashBeam الإعلان عن الأقران وتصفحهم عبر mDNS (سطح المكتب وAndroid؛ وليس تطبيق الويب).

1. عندما تكون قابلية الاكتشاف **Everyone**، ينشر الجهاز بيانات وصفية كافية ليعرض الآخرون اسمه في Nearby.
2. **Paired only** ما زال يعلن الحضور دون كشف الاسم المعروض للغرباء على الشبكة المحلية.
3. **Off** يوقف الإعلان؛ يمكنك مع ذلك التصفح والإرسال إلى من يظلون قابلين للاكتشاف.
4. تعرض دعوات الملفات عند أول تواصل رمز تحقق قصيرًا مشتقًا من المفاتيح العامة لكلا الجهازين حتى يؤكد كل طرف أنه يتحدث إلى النظير المقصود قبل القبول.
5. قبول طلب اقتران Nearby أو دعوة ملف ينشئ نفس سجلات الأجهزة المقترنة المحلية التي ينشئها الاقتران بالرمز.

### استضافة المرحّلات والاكتشاف ذاتيًا

لمعرفة كيفية تشغيل relay وخادم اكتشاف iroh خاص بك، وتكوين DashBeam لاستخدامهما، وكيف تتصرف الإعدادات المختلطة (عام / مستضاف ذاتيًا)، راجع [`infra/README.md`](../../infra/README.md) (relay: [`infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam)، discovery: [`infra/dns/README.md`](../../infra/dns/README.md)).

وللاطلاع على النسخة المصوّرة لكل ما سبق — بما في ذلك بيان كامل لما يعرفه كلٌّ من مشغّل المرحّل ومزوّد خدمة الإنترنت وخدمة البحث من كل عملية نقل — اقرأ [Under the hood](https://dashbeam.net/en/under-the-hood).


## التطوير

راجع [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) للمتطلبات الأساسية والإعداد المحلي وتعليمات البناء والاختبار.

## انضم إلى [Discord](https://discord.gg/xwb7z22Eve) للمساهمة

أفضل طريقة للمساهمة هي الانضمام إلى Discord والتعرّف على الفريق. عرّف عن نفسك وشارك مهاراتك أو اهتماماتك — سواء في البرمجة أو الاختبار أو التصميم أو غير ذلك. يمكنك أيضًا رفع issues أو اقتراح إصلاحات أو طرح أفكار. المشرفون هناك لإرشادك في كل خطوة.

إنه أفضل مكان للحصول على السياق، والتوافق على الاتجاه، والتعاون مع [المجتمع](https://discord.gg/xwb7z22Eve).

## الترخيص

AGPL-3.0

## سياسة الخصوصية

راجع [PRIVACY.md](../../PRIVACY.md) للاطلاع على كيفية تعامل DashBeam مع بياناتك وخصوصيتك.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## المساهمون

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## التواصل

تواصل معي [هنا](https://www.dashbeam.net/en/contact) للاقتراحات أو الملاحظات أو التواصل الإعلامي.


شكرًا لاطلاعك على هذا المشروع! إذا وجدته مفيدًا، فكّر في منحه نجمة والمساعدة في نشر الوعي به.




## مبني على

<div align="left">
  <a href="https://iroh.computer">
    <img alt="iroh" src="https://raw.githubusercontent.com/n0-computer/iroh/main/.img/iroh_wordmark.svg" width="200">
  </a>
</div>




<!-- <div align="center" style="color: gray;"></div> -->

</div>

[badge-website]: https://img.shields.io/badge/website-dashbeam.net-orange
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4
