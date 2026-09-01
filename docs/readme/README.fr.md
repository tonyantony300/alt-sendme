**Langue :** [English](../../README.md) | [中文](README.zh-CN.md) | [Русский](README.ru.md) | [Português](README.pt-BR.md) | [Español](README.es.md) | [Deutsch](README.de.md) | Français | [日本語](README.ja.md) | [한국어](README.ko.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

<div align="center">

# Le transfert de fichiers n'a pas besoin d'être compliqué

</div>


![En-tête DashBeam](../../assets/header.png)

<div align="center">

![Démonstration de DashBeam en action](../../assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
[![Version][badge-version]](https://github.com/tonyantony300/dashbeam/releases/latest)
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)



</div>

Un outil de transfert de fichiers gratuit et open source qui exploite la puissance du [réseau peer-to-peer de pointe](https://www.iroh.computer), vous permettant de transférer des fichiers directement sans les stocker sur des serveurs cloud.

Pourquoi compter sur WeTransfer, Dropbox ou Google Drive lorsque vous pouvez transférer des fichiers de manière fiable et simple, directement, avec chiffrement de bout en bout et sans divulguer d'informations personnelles ?

Choisissez la voie la plus pratique sur le moment : **envoyer un lien ou un QR code** qui s'ouvre sur n'importe quel appareil, **envoyer à un appareil appairé une fois pour toutes**, ou **envoyer à un appareil déjà présent sur votre réseau**. Les trois déplacent les mêmes octets de la même façon – directement et chiffrés de bout en bout.



## Fonctionnalités

- **Multiplateforme** – Bureau, Android, CLI et navigateur – aucune installation sur le web
- **N'importe quel fichier, n'importe quelle taille** – Fichiers ou dossiers, vérifiés par BLAKE3
- **Débits multi-gigabit** – Sature les connexions rapides
- **À proximité** – Découverte automatique sur le LAN ; Pair & Send
- **Appareils appairés** – Appairez une fois par code (à distance) ou via Nearby ; envoyez sans ticket
- **Appareils de confiance** – Activez l'acceptation automatique pour un appareil appairé ; ses fichiers arrivent sans confirmation
- **Reprise & multi-pairs** – Reprenez les transferts interrompus ; partagez avec plusieurs personnes à la fois
- **Connexion par clé** – Connexion par identité d'appareil, pas par adresse IP
- **Itinérance** – Passez du Wi-Fi à la 4G ou changez de réseau en plein transfert sans le perdre
- **Code, lien ou QR** – Le destinataire n'a rien à installer (navigateur ou application)
- **Aperçu & historique** – Voyez avant de télécharger ; journal local des transferts
- **Mode débogage avancé** – Diagnostics optionnels pour voir en toute transparence ce qui se passe sous le capot
- **Privé** – Ni comptes, ni traçage, ni publicité ; directement d'appareil à appareil
- **Chiffré** – TLS 1.3 de bout en bout ; tickets authentifiés
- **Relais auto-hébergés** – Transferts distants sans bridage via votre propre relais (**Paramètres → Infra**)
- **Toujours joignable** – Service/zone de notification en arrière-plan, notifications, démarrage à l'ouverture de session
- **Léger & gratuit** – Installations légères ; open source, sans limites


## Statistiques réelles


| Métrique | Signalé |
|--------|--------|
| **Plus gros transfert** | 452 Go |
| **Plus rapide transfert volumineux** | 54 Go @ 123 Mo/s (~1 Gbps) |
| **Transfert massif haute vitesse** | 328 Go @ 93 Mo/s |
| **Vitesse de pointe mesurée** | 125 Mo/s (1 Gbps) |

*Le débit de transfert dépend de votre appareil, de votre réseau et du chemin de connexion.*



## Installation

Le moyen le plus simple de commencer est de télécharger l'une des versions suivantes pour votre système d'exploitation :

<table>
  <tr>
    <td><b>Plateforme</b></td>
    <td><b>Recommandé</b></td>
    <td><b>Autres formats</b></td>
    <td><b>Taille</b></td>
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
    <td>🌐 <b>Web (débit limité)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

Plus d'options sur [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) ou sur la page [Downloads](https://www.dashbeam.net/en/downloads).

Un problème ? Consultez [Dépannage](../troubleshooting.md) pour les soucis courants et la marche à suivre pour collecter les journaux.



## Partenaires

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

Nous recherchons des partenaires pour rejoindre notre mission ! Associez-vous à nous et soutenez-nous tandis que nous repoussons les limites du transfert de fichiers peer-to-peer.

[**DISCUTONS**](https://www.dashbeam.net/en/contact)


## Langues prises en charge
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## Façons d'envoyer
### Appareils à proximité (recommandé)

Les applications sur le même réseau apparaissent sous **Nearby** dans **Paramètres → Appareils** et dans la liste **Send to a device** pendant que vous partagez. Choisissez un appareil à proximité et **Pair & Send** pour appairer et lancer le transfert en une seule étape – vous pouvez aussi appairer depuis les Paramètres sans partager. Le premier contact affiche un code de vérification sur les deux écrans. Définissez qui peut vous trouver dans **Paramètres → Réseau → Your discoverability**.

S'appuie sur [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS) – souvent bloqué sur les Wi-Fi invités et les VPN. Voir [Dépannage](../troubleshooting.md#the-nearby-list-is-empty) si la liste reste vide.

### Appareils appairés

Appairez dans **Paramètres → Appareils** avec un code d'appairage (fonctionne à distance, via internet) ou par une demande Nearby sur le même réseau. Une fois appairé, **Send** apparaît à côté de cet appareil pendant le partage – aucun ticket à copier. Le destinataire reçoit une invite dans l'application. Sur ordinateur, DashBeam peut continuer à tourner en arrière-plan et afficher les appareils appairés en ligne dans la zone de notification (**Paramètres → Général → Startup & background**). Les tickets manuels et la [CLI sendme](https://www.iroh.computer/sendme) fonctionnent toujours.

### Partager un ticket, un lien ou un QR code (transfert ponctuel)

Pendant le partage : **QR** pour un scan à la caméra, **Share** pour la feuille de partage du système, **Copy** pour le ticket brut. Les liens ont la forme `https://app.dashbeam.net/receive?ticket=…` – sous Android ils ouvrent l'application, ailleurs l'application web, donc rien à installer (pour les gros fichiers, préférez l'application native). Collez un ticket, un lien ou le message de partage complet dans Recevoir.


## Comparaison

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Stack réseau | QUIC via Iroh | Inconnu | HTTPS/REST sur TCP | TCP chiffré | WebRTC/DTLS (SCTP) |
| Fonctionne sur Internet | ✅ | ✅ | LAN uniquement | ✅ | ✅ |
| Sature les connexions gigabit | ✅ | ✅ | ✅ (LAN uniquement) | ✅ | ❌ (plafond SCTP/navigateur) |
| Open source | ✅ | ❌ | ✅ | ✅ | ✅ |
| Aucun compte requis | ✅ | ❌ | ✅ | ✅ | ✅ |
| Chiffrement de bout en bout | ✅ | ✅ | ✅ | ✅ | ✅ |
| Envoi de dossiers | ✅ | ✅ | ✅ | ✅ | ✅ (CLI uniquement, pas dans le navigateur) |
| Transferts reprenables | ✅ | ✅ | ❌ | ❌ | ❌ |
| Taille de fichier illimitée | ✅ | ✅ | ✅ | ✅ | Limitée par la mémoire du navigateur |
| Plateformes | CLI + bureau + mobile + web | Bureau + mobile (pas de web/CLI) | Bureau + mobile (pas de web/CLI) | CLI uniquement | Web/PWA + application Android + CLI |
| Découvrir des appareils sur le LAN | ✅ | ❌ | ✅ | ❌ | ✅ |
| Le piège | En cours | Code fermé ; le traitement des données ne peut pas être audité | Même réseau uniquement, pas de reprise | CLI uniquement ; les interfaces graphiques sont séparées, maintenues par la communauté | Plafond de débit WebRTC/SCTP ; limites de mémoire du navigateur |

[En savoir plus →](https://www.dashbeam.net/en/compare)

## Sous le capot

DashBeam est construit sur [Iroh](https://www.iroh.computer), une stack réseau peer-to-peer moderne qui simplifie la communication directe d'appareil à appareil. En pratique, cela signifie que les appareils communiquent via QUIC chiffré, que les fichiers circulent avec des blobs adressés par contenu, et que les relais interviennent lorsqu'un chemin direct n'est pas disponible.

> **La version longue :** [Under the hood](https://dashbeam.net/en/under-the-hood) raconte cette même architecture sous forme de récit – des empreintes plutôt que des noms de fichiers, des noms plutôt que des adresses, le hole punching, l'itinérance, et ce que chaque intermédiaire peut voir ou non.

### Les blocs de construction

| Élément | Rôle ici |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Stockent et diffusent les données de fichiers ; chaque fragment est vérifié avec BLAKE3 |
| **Tickets** | Une chaîne qui indique à un pair *qui* contacter et *quoi* récupérer |
| **Endpoints** | L'identité Iroh de chaque appareil (clé Ed25519 → id d'endpoint) |
| **QUIC + TLS 1.3** | Transport chiffré ; multiplexage sans blocage en tête de ligne |
| **Relais + hole punching** | Amorcent les connexions à travers les NAT ; le relais transporte les données pendant que la voie directe est négociée |
| **Protocole de contrôle** (appairage) | Canal persistant pour mémoriser les appareils et transmettre les invitations de partage |
| **Local discovery** (mDNS) | Annonce LAN optionnelle pour que les appareils Nearby se trouvent sans ticket |
| **Liens de réception** | Un ticket enveloppé dans une URL https ordinaire – un App Link sous Android, l'application web partout ailleurs |

### Blobs

Les fichiers ne sont pas téléversés sur un serveur. Ils sont publiés sous forme de **blobs** : séquences d'octets opaques adressées par un hash BLAKE3.

- Un **lien** est ce hash de 32 octets : si le hash correspond, le contenu correspond.
- Les dossiers et les gros fichiers utilisent un **HashSeq** (un blob qui pointe vers d'autres blobs).
- L'expéditeur est le **fournisseur** ; le destinataire est le **demandeur**. Chaque côté peut être les deux.

Comme ce hachage est un arbre BLAKE3 et non une empreinte unique du fichier entier, chaque bloc se vérifie tout seul par rapport à la racine. C'est ce qui rend la reprise peu coûteuse : un destinataire qui revient après une coupure sait exactement quels blocs il détient déjà *et a vérifiés*, et ne redemande donc que ce qui manque. Rien de ce qui a été reçu n'est renvoyé, et rien de ce qui arrive n'est accepté sur parole.

### Tickets

Un **ticket** de partage est un jeton unique qui regroupe :

1. L'id d'endpoint de l'expéditeur (pour savoir que vous parlez au bon appareil)
2. Assez d'informations d'adresse / relais pour le contacter
3. Le hash du blob à télécharger

Vous ne vous connectez qu'aux personnes avec lesquelles vous partagez un ticket : pas de diffusion de votre IP à des inconnus. C'est le modèle « cozy network » par défaut qu'Iroh encourage, par opposition à la découverte inondée sur l'ensemble du swarm.

Les tickets qui ne portent qu'un identifiant d'endpoint s'appuient sur la découverte par clé publique (Pkarr) pour retrouver les adresses courantes. Ces enregistrements sont signés par la clé de l'endpoint elle-même : un enregistrement falsifié échoue à la vérification au lieu de vous égarer – le service de recherche n'est de confiance que pour la **disponibilité, pas pour l'intégrité**.

### Connexion à travers les réseaux

Lorsque deux appareils doivent se rencontrer :

1. Chacun s'enregistre auprès d'un **relais** public (ou auto-hébergé) pour que les pairs puissent trouver un chemin à travers les pare-feu et les NAT.
2. Iroh tente le **hole punching QUIC** pour basculer vers une liaison peer-to-peer directe.
3. Si un chemin direct fonctionne, le trafic va d'appareil à appareil. Sinon, le relais reste dans le chemin comme saut UDP de secours.

Dans tous les cas, la charge utile est chiffrée de bout en bout. Les relais voient du chiffré, pas vos fichiers. [En savoir plus sur les relais Iroh →](https://docs.iroh.computer/about/faq)

Ces étapes se recouvrent au lieu de s'enchaîner. Le relais transporte déjà vos données pendant que le hole punching négocie : rien n'attend donc que la voie directe aboutisse, le transfert accélère simplement si et quand elle aboutit. Environ un transfert sur dix n'obtient jamais de voie directe (NAT symétrique, réseaux d'entreprise verrouillés) et passe par le relais du début à la fin.

### Itinérance entre réseaux

Une connexion est liée à la clé du pair, pas à son adresse IP : changer de réseau n'y met donc pas fin. Passez du Wi-Fi à la 4G en plein transfert et iroh remarque le changement d'adresse, apprend les nouvelles candidates et les republie auprès du pair. Le relais transporte les données pendant tout ce temps, et le hole punching se relance simplement sur la nouvelle voie.

Les adresses sont des indices jetables, pas une identité. C'est le bénéfice concret de nommer les appareils par clé plutôt que par emplacement.

### QUIC et chiffrement

QUIC (basé sur UDP, même fondation que HTTP/3) intègre TLS 1.3 au transport. Pour DashBeam, cela apporte le chiffrement et l'authentification, plusieurs flux avec contrôle de congestion partagé, et des reconnexions rapides lorsque vous avez déjà parlé à un pair.

### Appareils appairés

L'appairage ne remplace pas les tickets ; il les transmet pour vous.

1. Les appareils échangent un court **code d'appairage** (l'id d'endpoint de l'hôte) via un ALPN de contrôle dédié.
2. Chaque côté prouve son identité en signant du matériel de clé lié à la connexion avec son secret d'appareil, puis mémorise le pair localement.
3. Une connexion de contrôle persistante maintient la présence (en ligne/hors ligne).
4. Lorsque vous partagez, DashBeam crée toujours un ticket blob à usage unique normal ; choisir un appareil appairé envoie ce ticket sous forme d'**invitation** dans l'application au lieu de vous faire copier-coller.

Les tickets manuels et le [sendme CLI](https://www.iroh.computer/sendme) continuent de fonctionner exactement comme avant.

### Nearby (découverte locale)

Sur le même réseau local, DashBeam peut annoncer et parcourir les pairs via mDNS (bureau et Android ; pas l'application web).

1. Lorsque la découvrabilité est **Everyone**, l'appareil publie assez de métadonnées pour que les autres affichent son nom dans Nearby.
2. **Paired only** annonce encore la présence sans exposer le nom d'affichage aux inconnus sur le LAN.
3. **Off** arrête l'annonce ; vous pouvez toujours parcourir et envoyer aux autres qui restent découvrables.
4. Les invitations de fichiers au premier contact affichent un court code de vérification dérivé des clés publiques des deux appareils, pour que chaque côté confirme qu'il parle au pair prévu avant d'accepter.
5. Accepter une demande d'appairage Nearby ou une invitation de fichier crée les mêmes enregistrements locaux d'appareils appairés que l'appairage par code.

### Auto-hébergement des relais et de la découverte

Pour savoir comment exécuter votre propre relais et serveur de découverte iroh, configurer DashBeam pour les utiliser, et comment se comportent les configurations mixtes public/auto-hébergées, consultez [`../../infra/README.md`](../../infra/README.md) (relais : [`../../infra/relay/README.md`](../../infra/relay/README.md#using-self-hosted-relays-with-dashbeam), découverte : [`../../infra/dns/README.md`](../../infra/dns/README.md)).

Pour la version illustrée de tout ce qui précède – y compris un compte rendu complet de ce que l'opérateur d'un relais, votre FAI et le service de recherche apprennent chacun d'un transfert – lisez [Under the hood](https://dashbeam.net/en/under-the-hood).


## Développement

Consultez [CONTRIBUTING.md](../../CONTRIBUTING.md#development-setup) pour les prérequis, la configuration locale, les instructions de compilation et les tests.

## Rejoignez notre [Discord](https://discord.gg/xwb7z22Eve) pour contribuer

La meilleure façon de contribuer est de rejoindre notre Discord et de dire bonjour. Présentez-vous et partagez vos compétences ou centres d'intérêt — que ce soit le code, les tests, le design ou autre chose. Vous pouvez aussi signaler des problèmes, suggérer des corrections ou proposer des idées. Les mainteneurs sont là pour vous guider à chaque étape.

C'est le meilleur endroit pour obtenir du contexte, s'aligner sur la direction et collaborer avec la [communauté](https://discord.gg/xwb7z22Eve).

## Licence

AGPL-3.0

## Politique de confidentialité

Consultez [PRIVACY.md](../../PRIVACY.md) pour des informations sur la façon dont DashBeam gère vos données et votre vie privée.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Contributeurs

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## Contact

Contactez-moi [ici](https://www.dashbeam.net/en/contact) pour des suggestions, des retours ou une communication liée aux médias.


Merci d'avoir consulté ce projet ! Si vous le trouvez utile, pensez à lui donner une étoile et à en faire connaître autour de vous.




## Construit avec

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

