**Idioma:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | Español | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# Transferir archivos no tiene por qué ser complicado

</div>


![Encabezado de DashBeam](../../assets/header.png)

<div align="center">

![Demostración de DashBeam en acción](../../assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
[![Version][badge-version]](https://github.com/tonyantony300/dashbeam/releases/latest)
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)



</div>

Una herramienta gratuita y de código abierto para transferir archivos que aprovecha el poder de las [redes peer-to-peer de vanguardia](https://www.iroh.computer), permitiéndote transferir archivos directamente sin almacenarlos en servidores en la nube.

¿Por qué depender de WeTransfer, Dropbox o Google Drive cuando puedes transferir archivos de forma confiable y sencilla, directamente, con cifrado de extremo a extremo y sin revelar información personal?

Elige la vía que tengas más a mano: **enviar un enlace o un código QR** que se abre en cualquier dispositivo, **enviar a un dispositivo que emparejaste una vez** o **enviar a un dispositivo que ya está en tu red**. Las tres mueven los mismos bytes de la misma forma: directamente y cifrados de extremo a extremo.



## Características

- **Multiplataforma** – Escritorio, Android, CLI y navegador – sin instalación en la web
- **Cualquier archivo, cualquier tamaño** – Archivos o carpetas, verificados con BLAKE3
- **Velocidades multigigabit** – Satura conexiones rápidas
- **Cercanos** – Detección automática en la LAN; Pair & Send
- **Dispositivos emparejados** – Empareja una vez con un código (en remoto) o por Nearby; envía sin tickets
- **Reanudable y multipar** – Reanuda transferencias interrumpidas; comparte con muchos a la vez
- **Conexión por clave** – Conecta por identidad del dispositivo, no por dirección IP
- **Roaming** – Cambia de Wi-Fi, datos móviles o red a mitad de la transferencia sin cortarla
- **Código, enlace o QR** – Quien recibe no necesita instalar nada (navegador o app)
- **Vista previa e historial** – Mira antes de descargar; registro local de transferencias
- **Modo de depuración avanzado** – Diagnósticos opcionales para ver con transparencia lo que pasa por dentro
- **Privado** – Sin cuentas, sin rastreo ni anuncios; directo entre dispositivos
- **Cifrado** – TLS 1.3 de extremo a extremo; tickets autenticados
- **Relays autoalojados** – Transferencias remotas sin limitación mediante tu propio relay (**Ajustes → Infra**)
- **Siempre localizable** – Servicio/bandeja en segundo plano, notificaciones, inicio con la sesión
- **Ligero y gratuito** – Instalaciones pequeñas; código abierto, sin límites


## Estadísticas reales


| Métrica | Reportado |
|--------|--------|
| **Transferencia más grande** | 452 GB |
| **Transferencia grande más rápida** | 54 GB @ 123 MB/s (~1 Gbps) |
| **Transferencia masiva de alta velocidad** | 328 GB @ 93 MB/s |
| **Velocidad máxima medida** | 125 MB/s (1 Gbps) |

*El rendimiento de la transferencia depende de tu dispositivo, red y ruta de conexión.*



## Instalación

La forma más sencilla de comenzar es descargar una de las siguientes versiones para tu sistema operativo:

<table>
  <tr>
    <td><b>Plataforma</b></td>
    <td><b>Recomendado</b></td>
    <td><b>Otros formatos</b></td>
    <td><b>Tamaño</b></td>
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
    <td>🌐 <b>Web (rendimiento limitado)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Más opciones en [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) o en la página de [Downloads](https://www.dashbeam.net/en/downloads).

¿Tienes problemas? Consulta [Solución de problemas](../troubleshooting.md) para ver incidencias comunes y cómo recopilar registros.



## Socios

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

¡Buscamos socios para unirse a nuestra misión! Asóciate con nosotros y apóyanos mientras ampliamos los límites de la transferencia de archivos peer-to-peer.

[**HABLEMOS**](https://www.dashbeam.net/en/contact)


## Idiomas compatibles
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## Formas de enviar
### Dispositivos cercanos (recomendado)

Las apps de la misma red aparecen en **Nearby** en **Ajustes → Dispositivos** y en la lista **Send to a device** mientras compartes. Elige un dispositivo cercano y pulsa **Pair & Send** para emparejar e iniciar la transferencia en un solo paso; también puedes emparejar desde Ajustes sin compartir. El primer contacto muestra un código de verificación en ambas pantallas. Define quién puede encontrarte en **Ajustes → Red → Your discoverability**.

Usa [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS), que suele estar bloqueado en wifis de invitados y VPN. Consulta [Solución de problemas](../troubleshooting.md#the-nearby-list-is-empty) si la lista sigue vacía.

### Dispositivos emparejados

Empareja en **Ajustes → Dispositivos** con un código de emparejamiento (funciona en remoto, por internet) o mediante una solicitud Nearby en la misma red. Tras emparejar, aparece **Send** junto a ese dispositivo mientras compartes: ningún ticket que copiar. Quien recibe obtiene un aviso dentro de la app. En escritorio, DashBeam puede seguir ejecutándose en segundo plano y mostrar en la bandeja los dispositivos emparejados conectados (**Ajustes → General → Startup & background**). Los tickets manuales y la [CLI sendme](https://www.iroh.computer/sendme) siguen funcionando.

### Compartir ticket, enlace o código QR (transferencia puntual)

Mientras compartes: **QR** para escanear con la cámara, **Share** para la hoja del sistema y **Copy** para el ticket en bruto. Los enlaces tienen la forma `https://app.dashbeam.net/receive?ticket=…`: en Android abren la app y en el resto la app web, así que no hay nada que instalar (para archivos grandes es mejor la app nativa). Pega un ticket, un enlace o el mensaje completo de compartir en Recibir.


## Comparación

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Stack de red | QUIC via Iroh | Desconocido | HTTPS/REST sobre TCP | TCP cifrado | WebRTC/DTLS (SCTP) |
| Funciona en Internet | ✅ | ✅ | Solo LAN | ✅ | ✅ |
| Satura conexiones gigabit | ✅ | ✅ | ✅ (solo LAN) | ✅ | ❌ (límite SCTP/navegador) |
| Código abierto | ✅ | ❌ | ✅ | ✅ | ✅ |
| No requiere cuenta | ✅ | ❌ | ✅ | ✅ | ✅ |
| Cifrado de extremo a extremo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enviar carpetas | ✅ | ✅ | ✅ | ✅ | ✅ (solo CLI, no en navegador) |
| Transferencias reanudables | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tamaño de archivo ilimitado | ✅ | ✅ | ✅ | ✅ | Limitado por la memoria del navegador |
| Plataformas | CLI + escritorio + móvil + web | Escritorio + móvil (sin web/CLI) | Escritorio + móvil (sin web/CLI) | Solo CLI | Web/PWA + app Android + CLI |
| Descubrir dispositivos en la LAN | ✅ | ❌ | ✅ | ❌ | ✅ |
| La pega | En desarrollo | Código cerrado; el manejo de datos no puede auditarse | Solo misma red, sin reanudación | Solo CLI; las interfaces gráficas son separadas y mantenidas por la comunidad | Límite de rendimiento WebRTC/SCTP; límites de memoria del navegador |

[Saber más →](https://www.dashbeam.net/en/compare)

## Bajo el capó

DashBeam está construido sobre [Iroh](https://www.iroh.computer), un stack de red peer-to-peer moderno que simplifica la comunicación directa de dispositivo a dispositivo. En la práctica, eso significa que los dispositivos se comunican mediante QUIC cifrado, los archivos se mueven con blobs direccionados por contenido, y los relays ayudan cuando no hay una ruta directa disponible.

> **La versión larga:** [Under the hood](https://dashbeam.net/en/under-the-hood) recorre esta misma arquitectura en forma de relato: huellas en lugar de nombres de archivo, nombres en lugar de direcciones, hole punching, roaming y qué puede y qué no puede ver cada intermediario.

### Los bloques de construcción

| Pieza | Qué hace aquí |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Almacenan y transmiten datos de archivos; cada fragmento se verifica con BLAKE3 |
| **Tickets** | Una cadena que le indica a un par *a quién* contactar y *qué* obtener |
| **Endpoints** | La identidad Iroh de cada dispositivo (clave Ed25519 → id de endpoint) |
| **QUIC + TLS 1.3** | Transporte cifrado; multiplexación sin bloqueo en la cabecera de línea |
| **Relays + hole punching** | Arrancan conexiones a través de NAT; el relay transporta los datos mientras se negocia una ruta directa |
| **Protocolo de control** (emparejamiento) | Canal persistente para recordar dispositivos y entregar invitaciones de compartición |
| **Local discovery** (mDNS) | Anuncio opcional en la LAN para que los dispositivos Nearby se encuentren sin ticket |
| **Enlaces de recepción** | Un ticket envuelto en una URL https normal: un App Link en Android y la app web en el resto |

### Blobs

Los archivos no se suben a un servidor. Se publican como **blobs**: secuencias opacas de bytes direccionadas por un hash BLAKE3.

- Un **link** es ese hash de 32 bytes: si el hash coincide, el contenido coincide.
- Las carpetas y los archivos grandes usan un **HashSeq** (un blob que apunta a otros blobs).
- El remitente es el **proveedor**; el receptor es el **solicitante**. Cualquiera de los dos puede ser ambos.

Como ese hash es un árbol BLAKE3 y no un único resumen de todo el archivo, cada fragmento se verifica por sí mismo contra la raíz. Eso es lo que abarata la reanudación: quien recibe y vuelve tras una caída sabe exactamente qué fragmentos ya tiene *y ha verificado*, así que solo pide lo que falta. Nada de lo ya recibido se reenvía, y nada de lo que llega se acepta por confianza.

### Tickets

Un **ticket** de compartición es un token único que incluye:

1. El id de endpoint del remitente (para saber que hablas con el dispositivo correcto)
2. Suficiente información de dirección / relay para contactarlo
3. El hash del blob a descargar

Solo te conectas con personas con las que compartes un ticket: no difundes tu IP a desconocidos. Ese es el modelo «cozy network» predeterminado que promueve Iroh, frente al descubrimiento masivo en todo el swarm.

Los tickets que solo llevan un identificador de endpoint se apoyan en el descubrimiento por clave pública (Pkarr) para encontrar direcciones actuales. Esos registros van firmados por la propia clave del endpoint, así que uno manipulado falla la verificación en lugar de desviarte: al servicio de búsqueda se le confía la **disponibilidad, no la integridad**.

### Conexión a través de redes

Cuando dos dispositivos necesitan conectarse:

1. Cada uno se registra en un **relay** público (o autohospedado) para que los pares puedan encontrar una ruta a través de firewalls y NAT.
2. Iroh intenta **hole punching QUIC** para establecer un enlace peer-to-peer directo.
3. Si funciona una ruta directa, el tráfico va de dispositivo a dispositivo. Si no, el relay permanece en la ruta como salto UDP de respaldo.

En cualquier caso, la carga útil está cifrada de extremo a extremo. Los relays ven texto cifrado, no tus archivos. [Más sobre los relays de Iroh →](https://docs.iroh.computer/about/faq)

Esos pasos se solapan en vez de encadenarse. El relay ya está transportando tus datos mientras se negocia el hole punching, así que nada espera a que la ruta directa funcione: la transferencia simplemente se acelera si se consigue y cuando se consigue. Aproximadamente una de cada diez transferencias nunca llega a tener ruta directa (NAT simétrico, redes corporativas restringidas) y viaja por el relay de principio a fin.

### Roaming entre redes

Una conexión está ligada a la clave del par, no a su dirección IP, así que cambiar de red no la termina. Cambia de wifi a datos móviles a mitad de una transferencia e iroh detecta el cambio de dirección, aprende las nuevas candidatas y las vuelve a publicar para el par. El relay transporta los datos mientras tanto, y el hole punching simplemente se ejecuta de nuevo sobre la nueva ruta.

Las direcciones son pistas desechables, no identidad. Ese es el beneficio práctico de nombrar los dispositivos por clave en lugar de por ubicación.

### QUIC y cifrado

QUIC (basado en UDP, la misma base que HTTP/3) integra TLS 1.3 en el transporte. Para DashBeam, eso aporta cifrado y autenticación, múltiples flujos con control de congestión compartido, y reconexiones rápidas cuando ya has hablado con un par antes.

### Dispositivos emparejados

El emparejamiento no reemplaza los tickets; los entrega por ti.

1. Los dispositivos intercambian un **código de emparejamiento** corto (el id de endpoint del host) a través de un ALPN de control dedicado.
2. Cada lado demuestra su identidad firmando material de claves vinculado a la conexión con su secreto de dispositivo, y luego recuerda al par localmente.
3. Una conexión de control persistente mantiene la presencia (en línea/fuera de línea).
4. Cuando compartes, DashBeam sigue creando un ticket blob de uso único normal; elegir un dispositivo emparejado envía ese ticket como una **invitación** en la app en lugar de hacerte copiarlo y pegarlo.

Los tickets manuales y el [sendme CLI](https://www.iroh.computer/sendme) siguen funcionando exactamente igual que antes.

### Nearby (descubrimiento local)

En la misma red local, DashBeam puede anunciar y explorar pares con mDNS (escritorio y Android; no la app web).

1. Cuando la descubribilidad es **Everyone**, el dispositivo publica suficientes metadatos para que otros muestren su nombre en Nearby.
2. **Paired only** sigue anunciando presencia sin exponer el nombre visible a desconocidos en la LAN.
3. **Off** deja de anunciar; aún puedes explorar y enviar a otros que sigan siendo descubribles.
4. Las invitaciones de archivos en el primer contacto muestran un código de verificación corto derivado de las claves públicas de ambos dispositivos, para que cada lado confirme que habla con el par previsto antes de aceptar.
5. Aceptar una solicitud de emparejamiento Nearby o una invitación de archivo crea los mismos registros locales de dispositivo emparejado que el emparejamiento por código.

### Autohospedaje de relays y descubrimiento

Para saber cómo ejecutar tu propio relay y servidor de descubrimiento iroh, configurar DashBeam para usarlos, y cómo se comportan las configuraciones mixtas públicas/autohospedadas, consulta [`../../infra/README.md`](../../infra/README.md) (relay: [`../../infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), descubrimiento: [`../../infra/dns/README.md`](../../infra/dns/README.md)).

Para la versión ilustrada de todo lo anterior – incluida una explicación completa de qué aprende de una transferencia el operador de un relay, tu ISP y el servicio de búsqueda – lee [Under the hood](https://dashbeam.net/en/under-the-hood).


## Desarrollo

Consulta [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) para requisitos previos, configuración local, instrucciones de compilación y pruebas.

## Únete a nuestro [Discord](https://discord.gg/xwb7z22Eve) para contribuir

La mejor forma de contribuir es unirte a nuestro Discord y saludar. Preséntate y comparte tus habilidades o intereses, ya sea programación, pruebas, diseño u otra cosa. También puedes reportar problemas, sugerir correcciones o proponer ideas. Los mantenedores están ahí para guiarte en cada paso.

Es el mejor lugar para obtener contexto, alinearse en la dirección y colaborar con la [comunidad](https://discord.gg/xwb7z22Eve).

## Licencia

AGPL-3.0

## Política de privacidad

Consulta [PRIVACY.md](../../PRIVACY.md) para información sobre cómo DashBeam maneja tus datos y tu privacidad.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Colaboradores

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## Contacto

Escríbeme [aquí](https://www.dashbeam.net/en/contact) para sugerencias, comentarios o comunicación relacionada con medios.


¡Gracias por revisar este proyecto! Si te resulta útil, considera darle una estrella y ayudar a difundirlo.




## Construido con

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

