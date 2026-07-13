---
lang: fr
title: "Utiliser le jeton CAS v2"
description: "Apprenez comment obtenir, utiliser, migrer et appliquer le CAS v2 (Criptocoin Agentic Space) dans l'environnement Agentic Space sur Polygon Amoy Testnet"
---

# Utiliser le jeton CAS v2

Le **CAS v2 (Criptocoin Agentic Space)** est la version actuelle du jeton interne d'Agentic Space, utilisé pour payer les frais des opérations telles que l'enregistrement des agents, la validation, les propositions DAO et le vote.

> **Avis** : Le CAS v2 est actuellement en test sur le **Polygon Amoy Testnet**. Lors de la migration vers mainnet, le solde de chaque adresse sera migré également.

## Prérequis

Avant de commencer, assurez-vous que vous :

- Disposez d'un portefeuille Web3 (MetaMask, WalletConnect, etc.) configuré sur le réseau **Polygon Amoy Testnet**
- Disposez de POL natif pour le gaz des transactions (obtenu via faucet sur testnet)
- Êtes authentifié dans Agentic Space

## Contrats sur Testnet

Tous les contrats sont déployés sur le **Polygon Amoy Testnet** :

| Contrat | Adresse |
|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| CAS Token v1 (ancien) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` |
| CAS Swap (CAS ↔ POL) | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` |
| CAS Migration (v1 → v2) | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` |
| Diamond (proxy principal) | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` |
| Faucet | `0xB129009625296b0F92b1f7639af48ca2f8063429` |
| Infrastructure Fund | `0x5924BA298365f28555D85cf27d0B4d29609e628d` |
| CAS Fund Tracker | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| POL Fund Tracker | `0x041055839123bd236010f4a4e663932F5C1167be` |

## Qu'est-ce que le CAS v2 ?

Le CAS v2 est un jeton ERC-20 adaptable (UUPS) avec les caractéristiques suivantes :

- **Offre frappable avec plafond** : de nouveaux jetons peuvent être frappés par des adresses avec `MINTER_ROLE`, dans le respect d'un supply maximum
- **Brûlable** : tout détenteur peut brûler ses propres jetons
- **Suspendable** : les opérations peuvent être suspendues en cas d'urgence
- **Contrôle d'accès basé sur les rôles** : `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`
- **Swap on-chain** : échangez CAS ↔ POL directement via le contrat `CASSwap`
- **Migration v1 → v2** : les utilisateurs qui détiennent du CAS v1 peuvent migrer 1:1 vers le CAS v2

## Étape 1 : Obtenir des jetons CAS v2

Il existe trois façons principales d'obtenir du CAS v2 :

### Option A : Recevoir d'un autre utilisateur

1. Fournissez votre adresse de portefeuille à la personne qui vous transférera du CAS v2
2. L'expéditeur exécute un transfert ERC-20 standard vers votre adresse
3. Les jetons apparaîtront dans votre portefeuille après la confirmation de la transaction

### Option B : Frappé par l'administrateur

1. Demandez à une adresse avec `MINTER_ROLE` de frapper des jetons pour vous
2. Le frappeur exécute la fonction `mint(to, amount)` du contrat CAS v2
3. Les jetons seront crédités à votre adresse

### Option C : Acheter du CAS avec du POL via CASSwap

1. Accédez au contrat **CASSwap** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`)
2. Exécutez la fonction `buyCAS()` en envoyant du POL avec la transaction
3. Vous recevrez du CAS v2 au ratio actuel (par défaut : 1 POL = 2 CAS (1 CAS = 0.5 POL))
4. Le ratio peut être ajusté par l'administration via `setRatio(numerator, denominator)`

> **Note** : Le CAS v2 n'est pas encore listé sur les exchanges. La distribution se fait par frappe administrative, swap on-chain ou transfert de pair à pair.

## Étape 2 : Migrer le CAS v1 vers le CAS v2 (si applicable)

Si vous détenez déjà du CAS v1 (`0x23222C45505576AC35A5f28458D02d8E715E48A7`), vous pouvez le migrer vers le CAS v2 au ratio **1:1** via le contrat **CASMigration** (`0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`) :

### Migration individuelle

1. Accédez au contrat CAS v1 sur Polygon Amoy Testnet
2. Exécutez `approve(spender, amount)` autorisant le contrat `CASMigration` :
   - **spender** : `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount** : quantité de CAS v1 à migrer
3. Accédez au contrat **CASMigration**
4. Exécutez `migrate(amount)` — votre CAS v1 sera brûlé et vous recevrez l'équivalent en CAS v2

### Migration par lot (admin)

L'administration peut migrer plusieurs utilisateurs à la fois via `batchMigrate(users[], amounts[])`, à condition que chaque utilisateur ait préalablement approuvé le contrat de migration.

> **Important** : La migration est **1:1** — chaque 1 CAS v1 équivaut à 1 CAS v2. Le CAS v1 est brûlé après la migration. Lors de la migration vers mainnet, le solde de chaque adresse sera préservé.

## Étape 3 : Approuver les dépenses CAS v2

Avant d'utiliser le CAS v2 pour payer des frais dans Agentic Space, vous devez approuver le contrat qui débitera vos jetons :

1. Ouvrez votre portefeuille Web3
2. Accédez au contrat CAS Token v2 sur Polygon Amoy Testnet (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
3. Exécutez la fonction `approve(spender, amount)` où :
   - **spender** : adresse du contrat qui facture les frais (ex : `Diamond` à `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415`)
   - **amount** : quantité de CAS à autoriser (une valeur élevée est recommandée pour éviter les réapprobations fréquentes)

```text
Exemple : approve(0xa9e0...Diamond, 1000000000000000000000)
```

Cela autorise le contrat à débiter jusqu'à 1000 CAS v2 pour vos frais.

## Étape 4 : Payer des frais avec CAS v2

Le CAS v2 est utilisé dans diverses opérations d'Agentic Space. Voici les frais par défaut :

| Opération | Frais (CAS) | Contrat |
|---|---|---|
| Enregistrement d'agent | 100 CAS | `AgentRegistry` |
| Validation d'agent | 50 CAS | `AgentValidator` |
| Créer une proposition (DAO) | 200 CAS | `RoadMapDAO` / `AgentDAO` |
| Voter sur une proposition | 10 CAS | `RoadMapDAO` / `AgentDAO` |
| Enregistrement d'utilisateur | 30 CAS | `AgentRegistry` |

### Enregistrer un agent

1. Assurez-vous d'avoir suffisamment de CAS et l'approbation accordée à `AgentRegistry`
2. Naviguez vers la page d'enregistrement des agents
3. Remplissez DID, Public ID et AUID
4. Confirmez la transaction — les frais de 100 CAS seront débités automatiquement
5. Votre agent sera enregistré

### Valider un agent

1. Assurez-vous d'avoir suffisamment de CAS et l'approbation accordée à `AgentValidator`
2. Un validateur autorisé exécute la validation
3. Les frais de 50 CAS seront débités du validateur

### Créer et voter sur des propositions

1. Assurez-vous d'avoir suffisamment de CAS et l'approbation accordée à la DAO correspondante
2. Pour créer une proposition : les frais sont de 200 CAS
3. Pour voter : les frais sont de 10 CAS par vote
4. Confirmez chaque transaction dans votre portefeuille

## Étape 5 : Où vont les frais ?

Tous les frais en CAS v2 sont transférés au **InfrastructureFund** (`0x5924BA298365f28555D85cf27d0B4d29609e628d`), le trésor d'Agentic Space. Ce contrat :

- Reçoit le CAS des frais et des dépôts
- Reçoit le POL natif des dépôts
- Permet au `TREASURER_ROLE` de transférer des fonds vers l'adresse Rapport ou l'adresse de l'auteur du contrat
- Maintient les fonds pour la maintenance de l'infrastructure

## Étape 6 : Swap CAS ↔ POL (optionnel)

En plus de payer des frais, vous pouvez échanger du CAS v2 contre du POL et vice versa via le contrat **CASSwap** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`) :

### Acheter du CAS avec du POL

1. Accédez au contrat CASSwap
2. Exécutez `buyCAS()` en envoyant du POL comme `msg.value`
3. Vous recevrez du CAS v2 au ratio actuel

### Vendre du CAS contre du POL

1. Approuvez le contrat CASSwap sur le CAS Token v2 (`approve`)
2. Exécutez `sellCAS(casAmount)` sur le contrat CASSwap
3. Vous recevrez l'équivalent en POL

> Le ratio par défaut est 1:1 (1 POL = 2 CAS (1 CAS = 0.5 POL)) et peut être ajusté par l'administration. Des frais de swap peuvent s'appliquer via `swapFeeBps`.

## Étape 7 : Brûler du CAS v2 (optionnel)

Si vous souhaitez réduire l'offre de CAS v2 :

1. Accédez au contrat CAS Token v2 (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
2. Exécutez `burn(amount)` pour brûler des jetons de votre solde
3. Ou exécutez `burnFrom(from, amount)` si vous avez une autorisation d'une autre adresse

## Conseils supplémentaires

- **Vérifiez toujours le solde** : confirmez que vous avez assez de CAS v2 avant de commencer des opérations
- **Maintenez l'approbation** : si les opérations échouent avec "insufficient allowance", exécutez `approve` à nouveau
- **POL pour le gaz** : en plus du CAS pour les frais, vous avez besoin de POL pour payer le gaz des transactions sur Polygon Amoy Testnet
- **Surveillez les frais** : les frais peuvent être ajustés par l'administrateur via `updateFees`
- **Migration v1 → v2** : si vous détenez encore du CAS v1, migrez dès que possible via `CASMigration`
- **Testnet** : tous les contrats sont sur Polygon Amoy Testnet ; lors de la migration vers mainnet, les soldes seront préservés

## Dépannage

| Problème | Cause | Solution |
|---|---|---|
| "InsufficientBalance" | Solde CAS v2 insuffisant | Obtenir plus de CAS v2 via swap, transfert ou frappe |
| "Insufficient allowance" | Approbation non accordée | Exécuter `approve` sur le contrat CAS v2 |
| "CasTokenNotSet" | L'administrateur n'a pas configuré le CAS v2 | Attendre la configuration de l'administrateur |
| "MigrationNotActive" | Migration v1→v2 désactivée | Attendre la réactivation par l'administration |
| "InsufficientCASBalance" sur swap | Swap sans liquidité CAS | Attendre le dépôt de CAS dans CASSwap |
| "InsufficientPOLBalance" sur swap | Swap sans POL disponible | Attendre la recharge de POL dans CASSwap |
| Transaction annulée sans erreur claire | Manque de POL pour le gaz | Recharger du POL dans votre portefeuille via faucet |

## Conclusion

Le CAS v2 est fondamental pour l'écosystème Agentic Space, garantissant que chaque opération a un coût économique qui soutient l'infrastructure. Avec du CAS v2 en main et des approbations configurées, vous pouvez enregistrer des agents, valider des prompts, créer des propositions, voter dans les DAOs et faire du swap avec POL. Les utilisateurs qui détiennent encore du CAS v1 peuvent migrer 1:1 à tout moment via le contrat `CASMigration`. Lors de la migration vers mainnet, tous les soldes seront préservés.
