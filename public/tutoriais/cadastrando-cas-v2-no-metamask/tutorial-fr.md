---
lang: fr
title: "Enregistrer le CAS v2 et les Fund Trackers dans MetaMask"
description: "Apprenez étape par étape comment ajouter le CAS v2, l'Agentic CAS Fund (aCAS) et l'Agentic POL Fund (aPOL) à votre portefeuille MetaMask pour visualiser les soldes et suivre le fonds d'infrastructure"
---

# Enregistrer le CAS v2 et les Fund Trackers dans MetaMask

Ce tutoriel explique comment ajouter le **CAS Token v2** et les **Fund Trackers** (wrappers qui reflètent le solde du fonds d'infrastructure) à votre portefeuille **MetaMask**, vous permettant de visualiser les soldes directement dans le portefeuille.

## Prérequis

- MetaMask installé (extension de navigateur ou application mobile)
- Réseau **Polygon Amoy Testnet** configuré dans MetaMask
- Votre adresse de portefeuille configurée comme admin des Fund Trackers (si vous souhaitez voir les soldes du fonds)

---

## Partie 1 : Configurer Polygon Amoy Testnet dans MetaMask

Si vous n'avez pas encore configuré le réseau de test :

1. Ouvrez MetaMask
2. Cliquez sur le sélecteur de réseau en haut (généralement "Ethereum Mainnet")
3. Cliquez sur **Add Network** > **Add a network manually**
4. Remplissez les informations :

| Champ | Valeur |
|---|---|
| **Network Name** | Polygon Amoy Testnet |
| **RPC URL** | `https://rpc-amoy.polygon.technology` |
| **Chain ID** | `80002` |
| **Currency Symbol** | `POL` |
| **Block Explorer URL** | `https://www.oklink.com/amoy` |

5. Cliquez sur **Save**

> C'est fait ! Votre MetaMask est maintenant connecté au Polygon Amoy Testnet.

---

## Partie 2 : Ajouter le CAS Token v2 dans MetaMask

Le CAS v2 est le jeton principal d'Agentic Space. Pour le visualiser dans votre portefeuille :

1. Ouvrez MetaMask
2. Assurez-vous que le réseau sélectionné est **Polygon Amoy Testnet**
3. Sur l'écran principal, descendez jusqu'à la section **Tokens**
4. Cliquez sur **Import tokens** (ou **Add Token**)
5. Sélectionnez l'onglet **Custom Token**
6. Remplissez les informations :

| Champ | Valeur |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (rempli automatiquement) |
| **Token Decimal** | `18` (rempli automatiquement) |

7. Cliquez sur **Import Tokens** (ou **Add Token**)

> Le CAS v2 apparaîtra dans votre liste de jetons avec le solde actuel de votre adresse.

### Détails du CAS Token v2

- **Nom** : Criptocoin Agentic Space
- **Symbole** : CAS
- **Décimales** : 18
- **Supply maximum** : 10 000 000 CAS
- **Adresse du contrat** : `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

---

## Partie 3 : Ajouter l'Agentic CAS Fund (aCAS) dans MetaMask

L'**Agentic CAS Fund (aCAS)** est un jeton ERC-20 spécial qui **reflète le solde de CAS** détenu par l'InfrastructureFund. Il permet de suivre la quantité de CAS dans le fonds d'infrastructure directement dans MetaMask.

> **Important** : Seul l'**admin** (owner) du Fund Tracker voit le solde du fonds. Les autres adresses verront 0. Le jeton aCAS **n'est pas transférable** — il ne fait que refléter le solde du fonds.

### Étape par étape

1. Ouvrez MetaMask
2. Assurez-vous que le réseau est **Polygon Amoy Testnet**
3. Cliquez sur **Import tokens** > **Custom Token**
4. Remplissez les informations :

| Champ | Valeur |
|---|---|
| **Token Contract Address** | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| **Token Symbol** | `aCAS` (rempli automatiquement) |
| **Token Decimal** | `18` (rempli automatiquement) |

5. Cliquez sur **Import Tokens**

### Comment fonctionne l'aCAS

- Le `totalSupply()` de l'aCAS retourne le solde de CAS dans l'InfrastructureFund
- Le `balanceOf()` de l'admin retourne le montant total du fonds ; les autres adresses retournent 0
- Lorsque du CAS est déposé dans l'InfrastructureFund, le solde de l'aCAS augmente
- Lorsque du CAS est retiré de l'InfrastructureFund (par le `TREASURER_ROLE`), le solde de l'aCAS diminue
- L'aCAS **ne peut pas être transféré, approuvé ou envoyé** — c'est uniquement un miroir de solde

### Détails de l'Agentic CAS Fund

- **Nom** : Agentic CAS Fund
- **Symbole** : aCAS
- **Décimales** : 18
- **Adresse du contrat** : `0xbedA5753f950c891d79a49f7c37182F0161c187C`
- **InfrastructureFund suivi** : `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Type d'actif** : CAS (ERC-20)

---

## Partie 4 : Ajouter l'Agentic POL Fund (aPOL) dans MetaMask

L'**Agentic POL Fund (aPOL)** est l'équivalent de l'aCAS, mais reflète le solde de **POL natif** détenu par l'InfrastructureFund.

### Étape par étape

1. Ouvrez MetaMask
2. Assurez-vous que le réseau est **Polygon Amoy Testnet**
3. Cliquez sur **Import tokens** > **Custom Token**
4. Remplissez les informations :

| Champ | Valeur |
|---|---|
| **Token Contract Address** | `0x041055839123bd236010f4a4e663932F5C1167be` |
| **Token Symbol** | `aPOL` (rempli automatiquement) |
| **Token Decimal** | `18` (rempli automatiquement) |

5. Cliquez sur **Import Tokens**

### Comment fonctionne l'aPOL

- Le `totalSupply()` de l'aPOL retourne le solde de POL dans l'InfrastructureFund
- Le `balanceOf()` de l'admin retourne le montant total du fonds ; les autres adresses retournent 0
- Lorsque du POL est déposé dans l'InfrastructureFund (`depositNative()`), le solde de l'aPOL augmente
- Lorsque du POL est retiré de l'InfrastructureFund (par le `TREASURER_ROLE`), le solde de l'aPOL diminue
- L'aPOL **ne peut pas être transféré, approuvé ou envoyé** — c'est uniquement un miroir de solde

### Détails de l'Agentic POL Fund

- **Nom** : Agentic POL Fund
- **Symbole** : aPOL
- **Décimales** : 18
- **Adresse du contrat** : `0x041055839123bd236010f4a4e663932F5C1167be`
- **InfrastructureFund suivi** : `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Type d'actif** : POL (natif)

---

## Partie 5 : Suivre le fonds d'infrastructure

Après avoir ajouté les trois jetons (CAS, aCAS et aPOL) dans MetaMask, vous pouvez suivre :

| Jeton | Ce qu'il affiche | Qui le voit |
|---|---|---|
| **CAS** | Votre solde personnel de CAS v2 | Toute adresse |
| **aCAS** | Solde de CAS dans l'InfrastructureFund | Uniquement l'admin du tracker |
| **aPOL** | Solde de POL dans l'InfrastructureFund | Uniquement l'admin du tracker |

### Vérifier les soldes via l'explorateur de blocs

Vous pouvez également vérifier les soldes directement sur l'explorateur :

1. Accédez à l'explorateur Polygon Amoy : `https://www.oklink.com/amoy`
2. Collez l'adresse de l'InfrastructureFund : `0x5924BA298365f28555D85cf27d0B4d29609e628d`
3. Vous verrez :
   - **Token Holdings** : solde de CAS v2 dans le fonds
   - **POL Balance** : solde de POL natif dans le fonds
4. Pour vérifier les Fund Trackers, recherchez leurs adresses :
   - aCAS : `0xbedA5753f950c891d79a49f7c37182F0161c187C`
   - aPOL : `0x041055839123bd236010f4a4e663932F5C1167be`

### Vérifier les soldes via le contrat (Read Contract)

Si vous souhaitez interroger les soldes directement depuis les contrats :

1. Accédez à l'InfrastructureFund sur l'explorateur de blocs
2. Allez dans **Contract** > **Read Contract**
3. Appelez `casBalance()` pour voir le solde de CAS
4. Appelez `nativeBalance()` pour voir le solde de POL

Ou interrogez les Fund Trackers :

1. Accédez au contrat aCAS ou aPOL sur l'explorateur de blocs
2. Allez dans **Contract** > **Read Contract**
3. Appelez `totalSupply()` pour voir le solde total suivi
4. Appelez `balanceOf(votre_adresse)` pour vérifier si vous êtes l'admin

---

## Partie 6 : Transférer la propriété du Fund Tracker

Si vous êtes l'admin actuel des Fund Trackers et souhaitez passer la visualisation à une autre adresse :

1. Accédez au contrat du Fund Tracker (aCAS ou aPOL) sur l'explorateur de blocs
2. Allez dans **Contract** > **Write Contract**
3. Connectez votre portefeuille (vous devez être l'admin actuel)
4. Appelez `transferOwnership(nouvelle_adresse)`
5. Confirmez la transaction

> Après le transfert, la nouvelle adresse verra le solde du fonds dans MetaMask, et l'adresse précédente verra 0. Cela **n'affecte pas** l'InfrastructureFund — cela change seulement qui peut visualiser le solde.

---

## Résumé des adresses

| Contrat | Adresse | Symbole |
|---|---|---|
| CAS Token v2 | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | CAS |
| Agentic CAS Fund | `0xbedA5753f950c891d79a49f7c37182F0161c187C` | aCAS |
| Agentic POL Fund | `0x041055839123bd236010f4a4e663932F5C1167be` | aPOL |
| InfrastructureFund | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | — |

---

## Dépannage

| Problème | Cause | Solution |
|---|---|---|
| Le jeton n'apparaît pas après l'import | Mauvais réseau dans MetaMask | Vérifiez que vous êtes sur Polygon Amoy Testnet |
| Le solde aCAS/aPOL affiche 0 | Vous n'êtes pas l'admin du tracker | Demandez `transferOwnership` à l'admin actuel |
| "FundTracker: non-transferable" lors de l'envoi | Les Fund Trackers ne sont pas transférables | C'est normal — les trackers ne font que refléter les soldes |
| Le CAS n'apparaît pas après réception | Jeton non importé | Suivez la Partie 2 pour importer le CAS v2 |
| Le solde CAS affiche 0 | L'adresse n'a pas de jetons | Obtenez du CAS via swap, frappe ou transfert |

---

## Conclusion

Avec le CAS v2, l'aCAS et l'aPOL enregistrés dans MetaMask, vous avez une visibilité complète :

- **CAS** : votre solde personnel pour les opérations Agentic Space
- **aCAS** : quantité de CAS dans le fonds d'infrastructure (si vous êtes admin)
- **aPOL** : quantité de POL dans le fonds d'infrastructure (si vous êtes admin)

Les Fund Trackers sont un moyen élégant de surveiller la santé financière de l'écosystème Agentic Space directement dans votre portefeuille, sans avoir besoin d'accéder à l'explorateur de blocs à chaque requête.
