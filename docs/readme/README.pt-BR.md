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

Escolha o caminho que estiver mais à mão: **enviar um link ou um QR code** que abre em qualquer dispositivo, **enviar para um dispositivo pareado uma vez** ou **enviar para um dispositivo que já está na sua rede**. Os três movem os mesmos bytes do mesmo jeito – diretamente e com criptografia de ponta a ponta.



## Recursos

- **Multiplataforma** – Desktop, Android, CLI e navegador – sem instalação na web
- **Qualquer arquivo, qualquer tamanho** – Arquivos ou pastas, verificados com BLAKE3
- **Velocidades multigigabit** – Satura conexões rápidas
- **Por perto** – Descoberta automática na LAN; Pair & Send
- **Dispositivos pareados** – Pareie uma vez com um código (remotamente) ou via Nearby; envie sem tickets
- **Dispositivos confiáveis** – Ative a aceitação automática em um dispositivo pareado; os arquivos dele chegam sem perguntar
- **Retomável e multipar** – Retome transferências interrompidas; compartilhe com vários de uma vez
- **Conexão por chave** – Conecte pela identidade do dispositivo, não pelo endereço IP
- **Roaming** – Troque de Wi-Fi, rede móvel ou de rede no meio da transferência sem derrubá-la
- **Código, link ou QR** – Quem recebe não precisa instalar nada (navegador ou app)
- **Prévia e histórico** – Veja antes de baixar; registro local de transferências
- **Modo de depuração avançado** – Diagnósticos opcionais para dar transparência ao que acontece por baixo dos panos
- **Privado** – Sem contas, rastreamento ou anúncios; direto entre dispositivos
- **Criptografado** – TLS 1.3 de ponta a ponta; tickets autenticados
- **Relays próprios** – Transferências remotas sem limitação usando seu próprio relay (**Configurações → Infra**)
- **Sempre acessível** – Serviço/bandeja em segundo plano, notificações, iniciar com o login
- **Leve e gratuito** – Instalações pequenas; código aberto, sem limites


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
    <td>🌐 <b>Web (Taxa de transferência limitada)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Mais opções em [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) ou na página [Downloads](https://www.dashbeam.net/en/downloads).

Teve problemas? Veja [Solução de problemas](../troubleshooting.md) para questões comuns e como coletar logs.



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
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## Formas de enviar
### Dispositivos próximos (recomendado)

Apps na mesma rede aparecem em **Nearby** em **Configurações → Dispositivos** e na lista **Send to a device** enquanto você compartilha. Escolha um dispositivo próximo e use **Pair & Send** para parear e iniciar a transferência em uma etapa só – você também pode parear pelas Configurações, sem compartilhar. O primeiro contato mostra um código de verificação nas duas telas. Defina quem pode encontrar você em **Configurações → Rede → Your discoverability**.

Usa [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) – muitas vezes bloqueado em Wi-Fi de visitantes e VPNs. Veja [Solução de problemas](../troubleshooting.md#the-nearby-list-is-empty) se a lista continuar vazia.

### Dispositivos pareados

Pareie em **Configurações → Dispositivos** com um código de pareamento (funciona remotamente, pela internet) ou por uma solicitação Nearby na mesma rede. Depois do pareamento, **Send** aparece ao lado do dispositivo enquanto você compartilha – sem ticket para copiar. Quem recebe vê um aviso dentro do app. No desktop, o DashBeam pode continuar rodando em segundo plano e mostrar na bandeja os dispositivos pareados online (**Configurações → Geral → Startup & background**). Tickets manuais e a [CLI sendme](https://www.iroh.computer/sendme) continuam funcionando.

### Compartilhar ticket, link ou QR code (transferência única)

Enquanto compartilha: **QR** para escanear com a câmera, **Share** para a folha do sistema, **Copy** para o ticket bruto. Os links têm o formato `https://app.dashbeam.net/receive?ticket=…` – no Android abrem o app; nos demais casos, o app web, então não há nada para instalar (para arquivos grandes, prefira o app nativo). Cole um ticket, um link ou a mensagem de compartilhamento inteira em Receber.


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

> **A versão longa:** [Under the hood](https://dashbeam.net/en/under-the-hood) percorre essa mesma arquitetura como uma narrativa – impressões digitais no lugar de nomes de arquivo, nomes no lugar de endereços, hole punching, roaming e o que cada intermediário consegue ou não enxergar.

### Os blocos de construção

| Peça | O que faz aqui |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Armazenam e transmitem dados de arquivos; cada fragmento é verificado com BLAKE3 |
| **Tickets** | Uma string que diz a um peer *quem* contatar e *o quê* buscar |
| **Endpoints** | A identidade Iroh de cada dispositivo (chave Ed25519 → id de endpoint) |
| **QUIC + TLS 1.3** | Transporte criptografado; multiplexação sem bloqueio head-of-line |
| **Relays + hole punching** | Iniciam conexões através de NATs; o relay carrega os dados enquanto um caminho direto é negociado |
| **Protocolo de controle** (pareamento) | Canal persistente para lembrar dispositivos e entregar convites de compartilhamento |
| **Local discovery** (mDNS) | Anúncio opcional na LAN para que dispositivos Nearby se encontrem sem ticket |
| **Links de recebimento** | Um ticket embrulhado em uma URL https comum – um App Link no Android e o app web em todo o resto |

### Blobs

Os arquivos não são enviados para um servidor. Eles são publicados como **blobs**: sequências opacas de bytes endereçadas por um hash BLAKE3.

- Um **link** é esse hash de 32 bytes: se o hash corresponder, o conteúdo corresponde.
- Pastas e arquivos grandes usam um **HashSeq** (um blob que aponta para outros blobs).
- O remetente é o **provider**; o destinatário é o **requester**. Qualquer lado pode ser os dois.

Como esse hash é uma árvore BLAKE3, e não um único resumo do arquivo inteiro, cada bloco se verifica sozinho contra a raiz. É isso que torna a retomada barata: quem volta depois de uma queda de conexão sabe exatamente quais blocos já tem *e já verificou*, então pede apenas o que falta. Nada do que já foi recebido é reenviado, e nada do que chega é aceito na base da confiança.

### Tickets

Um **ticket** de compartilhamento é um token único que reúne:

1. O id de endpoint do remetente (para saber que você está falando com o dispositivo certo)
2. Informações suficientes de endereço / relay para contatá-lo
3. O hash do blob a ser baixado

Você só se conecta a pessoas com quem compartilha um ticket: sem divulgar seu IP para estranhos. Esse é o modelo padrão de "cozy network" que o Iroh incentiva, em contraste com a descoberta inundada em todo o swarm.

Tickets que carregam apenas um id de endpoint dependem da descoberta por chave pública (Pkarr) para achar endereços atuais. Esses registros são assinados pela própria chave do endpoint, então um registro adulterado falha na verificação em vez de te desviar – o serviço de busca é confiado quanto à **disponibilidade, não à integridade**.

### Conectando através de redes

Quando dois dispositivos precisam se encontrar:

1. Cada um se registra em um **relay** público (ou auto-hospedado) para que os peers encontrem um caminho através de firewalls e NATs.
2. O Iroh tenta **hole punching QUIC** para migrar para um link peer-to-peer direto.
3. Se um caminho direto funcionar, o tráfego vai de dispositivo a dispositivo. Se não, o relay permanece no caminho como um salto UDP de fallback.

De qualquer forma, a carga útil é criptografada de ponta a ponta. Os relays veem ciphertext, não seus arquivos. [Saiba mais sobre relays Iroh →](https://docs.iroh.computer/about/faq)

Essas etapas se sobrepõem em vez de entrarem na fila. O relay já está carregando seus dados enquanto o hole punching negocia, então nada espera o caminho direto dar certo – a transferência apenas fica mais rápida se e quando isso acontecer. Cerca de uma transferência em cada dez nunca consegue um caminho direto (NAT simétrico, redes corporativas fechadas) e vai pelo relay do início ao fim.

### Roaming entre redes

Uma conexão é ligada à chave do par, não ao endereço IP dele, então mudar de rede não a encerra. Troque do Wi-Fi para a rede móvel no meio de uma transferência e o iroh percebe a mudança de endereço, aprende os novos candidatos e os republica para o par. O relay carrega os dados o tempo todo, e o hole punching simplesmente roda de novo no caminho novo.

Endereços são pistas descartáveis, não identidade. Esse é o ganho prático de nomear dispositivos por chave em vez de por localização.

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

Para a versão ilustrada de tudo acima – incluindo um relato completo do que o operador de um relay, seu provedor de internet e o serviço de busca aprendem de uma transferência – leia [Under the hood](https://dashbeam.net/en/under-the-hood).


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
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4

