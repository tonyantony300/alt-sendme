<img src="../../assets/rename-banner.svg" alt="Anúncio: AltSendme agora é DashBeam. O mesmo app, mais fácil de encontrar, lembrar e pronunciar." width="1200" />

**Idioma:** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | Português | [Español](README.es.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# Transferência de arquivos não precisa ser complicada

</div>


![Cabeçalho DashBeam](../../assets/header.png)

<div align="center">

![Demonstração do DashBeam em ação](../../assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
[![Version][badge-version]](https://github.com/tonyantony300/dashbeam/releases/latest)
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)



</div>

Uma ferramenta gratuita e de código aberto para transferência de arquivos que aproveita o poder da [rede peer-to-peer de ponta](https://www.iroh.computer), permitindo transferir arquivos diretamente sem armazená-los em servidores na nuvem.

Por que depender do WeTransfer, Dropbox ou Google Drive quando você pode transferir arquivos de forma confiável e fácil, diretamente, com criptografia de ponta a ponta e sem revelar informações pessoais?



## Recursos

- **Envie para qualquer lugar, de qualquer dispositivo** — Desktop, Android, terminal ou navegador — comece em uma plataforma, receba em qualquer outra.
- **Transfira qualquer coisa, de qualquer tamanho** — Arquivos ou pastas inteiras, verificados de ponta a ponta com checagens de integridade BLAKE3.
- **Rápido o suficiente para fazer diferença** — Satura conexões multi-gigabit para transferências ultrarrápidas.
- **Privado por padrão** — Sem contas, sem cadastros, sem rastreamento, sem anúncios.
- **Transferência direta entre dispositivos** — Os arquivos circulam diretamente entre seus dispositivos, sem passar pelo armazenamento em nuvem corporativo onde os dados são a moeda de troca.
- **Criptografia de ponta a ponta, sempre ativa** — Cada transferência usa QUIC com TLS 1.3; os relays veem apenas tráfego criptografado, mesmo quando estão envolvidos.
- **Autenticação criptográfica** — Cada ticket verifica se você está conectado ao remetente correto antes de qualquer transferência de arquivos.
- **Retomável e transmitível** — Transferências interrompidas retomam automaticamente; compartilhe o mesmo arquivo com quantos peers quiser ao mesmo tempo.
- **Visualize antes de baixar** — Veja o que você está recebendo antes de baixar.
- **Dispositivos pareados** — Pareie computadores e celulares Android uma vez em **Configurações → Dispositivos**, depois envie arquivos sem copiar tickets toda vez.
- **Próximos na mesma rede** — Outros dispositivos DashBeam na sua LAN aparecem automaticamente (mDNS). Pareie nas Configurações ou envie ao compartilhar — sem colar ticket.
- **Presença em segundo plano** — No desktop, continue rodando na bandeja ou barra de menus e, opcionalmente, inicie no login para que dispositivos pareados vejam você online.
- **Notificações do sistema** — Pedidos de pareamento e convites de arquivo podem exibir notificações do SO quando o app não está em primeiro plano (desktop e Android).
- **Ultraleve** — Instalações minúsculas, pegada web mínima.
- **Gratuito e de código aberto** — Sem custos de upload, sem limites de tamanho, impulsionado pela comunidade.


## Estatísticas do mundo real


| Métrica | Reportado |
|--------|--------|
| **Maior transferência** | 452 GB |
| **Transferência grande mais rápida** | 54 GB @ 123 MB/s (~1 Gbps) |
| **Transferência em massa em alta velocidade** | 328 GB @ 93 MB/s |
| **Velocidade máxima medida** | 125 MB/s (1 Gbps) |

*A taxa de transferência depende do seu dispositivo, da rede e do caminho de conexão.*



## Instalação

A forma mais fácil de começar é baixar uma das seguintes versões para o seu sistema operacional:

<table>
  <tr>
    <td><b>Plataforma</b></td>
    <td><b>Recomendado</b></td>
    <td><b>Outros formatos</b></td>
    <td><b>Tamanho</b></td>
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
    <td>🌐 <b>Web (Taxa de transferência limitada)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Mais opções em [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) ou na página [Downloads](https://www.dashbeam.net/en/downloads).



## Parceiros

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

Estamos procurando Parceiros para se juntar à nossa missão! Faça parceria conosco e apoie enquanto expandimos os limites da transferência de arquivos peer-to-peer.

[**VAMOS CONVERSAR**](https://www.dashbeam.net/en/contact)


## Idiomas suportados
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## Como funciona

1. Arraste seu arquivo ou pasta — DashBeam cria um código de compartilhamento único (chamado de "ticket").
2. Compartilhe o ticket por chat, e-mail ou mensagem de texto, **ou** envie diretamente para um dispositivo pareado ou próximo (desktop / Android).
3. Seu amigo cola o ticket no app (ou aceita um convite), e a transferência começa.

### Dispositivos pareados

No macOS, Windows, Linux e Android você pode parear dispositivos em **Configurações → Dispositivos** usando um código de pareamento, ou aceitando um pedido de pareamento Nearby na mesma rede local. Após o pareamento:

- Remetentes podem tocar em **Enviar** ao lado de um dispositivo pareado durante o compartilhamento: sem copiar ticket manualmente.
- Destinatários recebem um prompt no app quando um remetente pareado os convida; com notificações do sistema ativadas, também podem receber um banner do SO quando a janela não está em foco.
- No desktop, a bandeja / barra de menus pode mostrar quais dispositivos pareados estão online, e o DashBeam pode continuar rodando depois que você fecha a janela (**Configurações → Geral → Startup & background**).
- Tickets manuais e o [sendme CLI](https://www.iroh.computer/sendme) ainda funcionam exatamente como antes.

### Dispositivos próximos

Quando outros apps DashBeam estão na mesma Wi-Fi ou LAN, eles podem aparecer em **Nearby** em **Configurações → Dispositivos** e na folha **Send to a device** ao compartilhar:

- **Pareie** nas Configurações para adicionar um dispositivo sem trocar um código de pareamento.
- **Envie** pela folha de compartilhamento para convidar um dispositivo Nearby com o ticket atual; os destinatários confirmam um código de verificação curto antes de aceitar.
- Controle se outros podem encontrá-lo em **Configurações → Rede → Your discoverability** (Everyone / Paired only / Off).

Nearby depende de [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS). Se sua rede bloquear multicast (Wi-Fi de convidados, muitas VPNs), use um ticket manual ou pareie pela internet — veja [Solução de problemas](../troubleshooting.md#the-nearby-list-is-empty).


## Comparação

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Stack de rede | QUIC via Iroh | Desconhecido | HTTPS/REST sobre TCP | TCP criptografado | WebRTC/DTLS (SCTP) |
| Funciona pela internet | ✅ | ✅ | Apenas LAN | ✅ | ✅ |
| Satura conexões gigabit | ✅ | ✅ | ✅ (apenas LAN) | ✅ | ❌ (teto SCTP/navegador) |
| Código aberto | ✅ | ❌ | ✅ | ✅ | ✅ |
| Sem conta necessária | ✅ | ❌ | ✅ | ✅ | ✅ |
| Criptografia de ponta a ponta | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enviar pastas | ✅ | ✅ | ✅ | ✅ | ✅ (apenas CLI, não no navegador) |
| Transferências retomáveis | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tamanho de arquivo ilimitado | ✅ | ✅ | ✅ | ✅ | Limitado pela memória do navegador |
| Plataformas | CLI + desktop + mobile + web | Desktop + mobile (sem web/CLI) | Desktop + mobile (sem web/CLI) | Apenas CLI | Web/PWA + app Android + CLI |
| Descobrir dispositivos na LAN | ✅ | ❌ | ✅ | ❌ | ✅ |
| A ressalva | Em desenvolvimento | Código fechado; tratamento de dados não pode ser auditado | Apenas mesma rede, sem retomada | Apenas CLI; interfaces gráficas são separadas, mantidas pela comunidade | Teto de throughput WebRTC/SCTP; limites de memória do navegador |

[Saiba mais →](https://www.dashbeam.net/en/compare)

## Por baixo dos panos

DashBeam é construído sobre [Iroh](https://www.iroh.computer), uma stack de rede peer-to-peer moderna que simplifica a comunicação direta entre dispositivos. Na prática, isso significa que os dispositivos se comunicam via QUIC criptografado, os arquivos circulam com blobs endereçados por conteúdo, e os relays ajudam quando um caminho direto não está disponível.

### Os blocos de construção

| Peça | O que faz aqui |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Armazenam e transmitem dados de arquivos; cada fragmento é verificado com BLAKE3 |
| **Tickets** | Uma string que diz a um peer *quem* contatar e *o quê* buscar |
| **Endpoints** | A identidade Iroh de cada dispositivo (chave Ed25519 → id de endpoint) |
| **QUIC + TLS 1.3** | Transporte criptografado; multiplexação sem bloqueio head-of-line |
| **Relays + hole punching** | Inicializam conexões através de NATs; preferem caminho direto, recuam para relay |
| **Protocolo de controle** (pareamento) | Canal persistente para lembrar dispositivos e entregar convites de compartilhamento |
| **Local discovery** (mDNS) | Anúncio opcional na LAN para que dispositivos Nearby se encontrem sem ticket |

### Blobs

Os arquivos não são enviados para um servidor. Eles são publicados como **blobs**: sequências opacas de bytes endereçadas por um hash BLAKE3.

- Um **link** é esse hash de 32 bytes: se o hash corresponder, o conteúdo corresponde.
- Pastas e arquivos grandes usam um **HashSeq** (um blob que aponta para outros blobs).
- O remetente é o **provider**; o destinatário é o **requester**. Qualquer lado pode ser os dois.

### Tickets

Um **ticket** de compartilhamento é um token único que reúne:

1. O id de endpoint do remetente (para saber que você está falando com o dispositivo certo)
2. Informações suficientes de endereço / relay para contatá-lo
3. O hash do blob a ser baixado

Você só se conecta a pessoas com quem compartilha um ticket: sem divulgar seu IP para estranhos. Esse é o modelo padrão de "cozy network" que o Iroh incentiva, em contraste com a descoberta inundada em todo o swarm.

### Conectando através de redes

Quando dois dispositivos precisam se encontrar:

1. Cada um se registra em um **relay** público (ou auto-hospedado) para que os peers encontrem um caminho através de firewalls e NATs.
2. O Iroh tenta **hole punching QUIC** para migrar para um link peer-to-peer direto.
3. Se um caminho direto funcionar, o tráfego vai de dispositivo a dispositivo. Se não, o relay permanece no caminho como um salto UDP de fallback.

De qualquer forma, a carga útil é criptografada de ponta a ponta. Os relays veem ciphertext, não seus arquivos. [Saiba mais sobre relays Iroh →](https://docs.iroh.computer/about/faq)

### QUIC e criptografia

QUIC (baseado em UDP, mesma fundação do HTTP/3) traz TLS 1.3 para o transporte. Para o DashBeam, isso traz criptografia e autenticação, múltiplos streams com controle de congestionamento compartilhado, e reconexões rápidas quando você já conversou com um peer antes.

### Dispositivos pareados

O pareamento não substitui tickets; ele os entrega para você.

1. Os dispositivos trocam um curto **código de pareamento** (o id de endpoint do host) por um ALPN de controle dedicado.
2. Cada lado prova identidade assinando material de chave vinculado à conexão com seu segredo de dispositivo, depois lembra o peer localmente.
3. Uma conexão de controle persistente mantém presença (online/offline).
4. Quando você compartilha, o DashBeam ainda cria um ticket blob único normal; escolher um dispositivo pareado envia esse ticket como um **convite** no app em vez de fazer você copiar e colar.

Tickets manuais e o [sendme CLI](https://www.iroh.computer/sendme) continuam funcionando exatamente como antes.

### Nearby (descoberta local)

Na mesma rede local, o DashBeam pode anunciar e procurar peers com mDNS (desktop e Android; não o app web).

1. Quando a descobribilidade é **Everyone**, o dispositivo publica metadados suficientes para que outros mostrem seu nome em Nearby.
2. **Paired only** ainda anuncia presença sem expor o nome de exibição a estranhos na LAN.
3. **Off** para de anunciar; você ainda pode procurar e enviar para outros que permaneçam descobertos.
4. Convites de arquivo no primeiro contato mostram um código de verificação curto derivado das chaves públicas de ambos os dispositivos, para cada lado confirmar que está falando com o peer pretendido antes de aceitar.
5. Aceitar um pedido de pareamento Nearby ou um convite de arquivo cria os mesmos registros locais de dispositivo pareado que o pareamento por código.

### Auto-hospedagem de relays e descoberta

Para saber como executar seu próprio relay e servidor de descoberta iroh, configurar o DashBeam para usá-los, e como configurações mistas públicas/auto-hospedadas se comportam, consulte [`../../infra/README.md`](../../infra/README.md) (relay: [`../../infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), descoberta: [`../../infra/dns/README.md`](../../infra/dns/README.md)).


## Desenvolvimento

Consulte [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) para pré-requisitos, configuração local, instruções de build e testes.

## Entre no nosso [Discord](https://discord.gg/xwb7z22Eve) para contribuir

A melhor forma de contribuir é entrar no nosso Discord e dizer oi. Apresente-se e compartilhe suas habilidades ou interesses — seja programação, testes, design ou outra coisa. Você também pode abrir issues, sugerir correções ou propor ideias. Os mantenedores estão lá para orientar você em cada etapa.

É o melhor lugar para obter contexto, alinhar direção e colaborar com a [comunidade](https://discord.gg/xwb7z22Eve).

## Licença

AGPL-3.0

## Política de Privacidade

Consulte [PRIVACY.md](../../PRIVACY.md) para informações sobre como o DashBeam trata seus dados e privacidade.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Contribuidores

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## Contato

Entre em contato comigo [aqui](https://www.dashbeam.net/en/contact) para sugestões, feedback ou comunicação relacionada à mídia.


Obrigado por conferir este projeto! Se achar útil, considere dar uma estrela e ajudar a divulgá-lo.




## Construído com

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

