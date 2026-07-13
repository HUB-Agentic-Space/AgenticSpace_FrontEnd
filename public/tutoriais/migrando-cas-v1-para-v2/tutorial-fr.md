---
lang: fr
title: "Migrer CAS v1 vers CAS v2 et Utiliser les Nouveaux Contrats"
description: "Guide complet pour migrer vos tokens CAS v1 vers CAS v2, acheter via CASSwap v2 avec ratio 2:1, et utiliser tous les nouveaux contrats déployés sur Polygon Amoy Testnet"
---

# Migrer CAS v1 vers CAS v2 et Utiliser les Nouveaux Contrats

Ce tutoriel explique comment **migrer vos tokens CAS v1 vers CAS v2** au ratio 1:1, comment **acheter du CAS v2 avec du POL** via CASSwap v2 (ratio 2:1), et comment utiliser les nouveaux contrats déployés sur Polygon Amoy Testnet.

## Prérequis

- MetaMask installée et configurée sur **Polygon Amoy Testnet**
- Tokens CAS v1 (adresse `0x23222C45505576AC35A5f28458D02d8E715E48A7`)
- POL natif pour le gas des transactions

---

## Contrats Mis à Jour (Amoy Testnet)

| Contrat | Adresse | Fonction |
|---|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | Nouveau token avec MAX_SUPPLY 10M |
| **CAS Token v1** (ancien) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` | Ancien token, en cours de dépréciation |
| **CASMigration** | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` | Migration v1 → v2 (1:1) |
| **CASSwap v2** | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` | Swap CAS ↔ POL (ratio 2:1) |
| **InfrastructureFund v2** | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | Trésorerie avec `receive()` |
| **Diamond** | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` | Proxy principal (enregistre tout) |

> Tous les contrats ci-dessus sont enregistrés dans le Diamond via `ContractRegistryFacet`.

---

## Partie 1: Migrer CAS v1 vers CAS v2

La migration est **1:1** — chaque 1 CAS v1 équivaut à 1 CAS v2. Le CAS v1 est envoyé à `0xdead` (brûlé) et vous recevez du CAS v2 du contrat de migration.

### Étape 1: Approuver CASMigration sur CAS v1

Avant de migrer, vous devez autoriser le contrat CASMigration à dépenser vos CAS v1:

1. Allez sur CAS v1 sur Polygonscan: https://amoy.polygonscan.com/token/0x23222C45505576AC35A5f28458D02d8E715E48A7#writeContract
2. Connectez votre MetaMask
3. Allez dans **Write Contract** → `approve`
4. Remplissez:
   - **spender**: `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount**: quantité de CAS v1 en wei (ex: `100000000000000000000` = 100 CAS)
5. Confirmez la transaction

### Étape 2: Exécuter la migration

1. Allez sur CASMigration: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#writeContract
2. Connectez votre MetaMask
3. Allez dans **Write Contract** → `migrate`
4. Remplissez:
   - **amount**: même quantité approuvée à l'Étape 1 (ex: `100000000000000000000` = 100 CAS)
5. Confirmez la transaction

### Étape 3: Vérifier

Après confirmation:
- Votre solde CAS v1 sera **0** (tokens brûlés)
- Votre solde CAS v2 sera égal à quantité migrée
- Importez CAS v2 dans MetaMask: `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

> **Important**: La migration est **irréversible**. Une fois CAS v1 migré, cela ne peut pas être annulé.

### Migration par lot (pour les admins)

Si vous êtes propriétaire du CASMigration, vous pouvez migrer plusieurs utilisateurs à la fois:

```
batchMigrate(
  ["0xadresse1", "0xadresse2"],
  ["100000000000000000000", "50000000000000000000"]
)
```

Chaque utilisateur doit avoir approuvé CASMigration au préalable.

---

## Partie 2: Acheter du CAS v2 avec POL via CASSwap v2

CASSwap v2 permet d'acheter du CAS v2 en envoyant du POL. Le ratio actuel est **2:1** (1 POL = 2 CAS, soit 1 CAS = 0,5 POL).

### Acheter du CAS (buyCAS)

1. Allez sur CASSwap v2: https://amoy.polygonscan.com/address/0xdF5Df5Eb32fa1a53749c66364B877C39b7031377#writeContract
2. Connectez votre MetaMask
3. Allez dans **Write Contract** → `buyCAS`
4. Dans **Value (POL)**, entrez la quantité de POL (ex: `0.001` POL → vous recevez `0.002` CAS)
5. Confirmez la transaction

### Vendre du CAS pour du POL (sellCAS)

1. Approuvez CASSwap v2 sur CAS Token v2:
   - Allez sur CAS v2: https://amoy.polygonscan.com/token/0x86fE62cb65C036412dC100035DeacD5A9345D86F#writeContract
   - `approve("0xdF5Df5Eb32fa1a53749c66364B877C39b7031377", amount)`
2. Allez sur CASSwap v2 → **Write Contract** → `sellCAS`
3. Entrez la quantité de CAS à vendre (ex: `2000000000000000000` = 2 CAS → vous recevez 1 POL)
4. Confirmez la transaction

> **Note**: CASSwap a besoin de POL disponible pour vendre. S'il n'y a pas assez de POL, la transaction échouera avec `InsufficientPOLBalance`.

---

## Partie 3: Ajouter CAS v2 dans MetaMask

Si vous n'avez pas encore ajouté CAS v2:

1. Ouvrez MetaMask sur **Polygon Amoy Testnet**
2. Cliquez sur **Import tokens** > **Custom Token**
3. Remplissez:

| Champ | Valeur |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (auto) |
| **Token Decimal** | `18` (auto) |

4. Cliquez sur **Import Tokens**

---

## Partie 4: Vérifier le Statut de la Migration

Pour vérifier combien de CAS v2 est disponible pour la migration:

1. Allez sur CASMigration: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#readContract
2. Allez dans **Read Contract**
3. `availableNewCAS()` — retourne le solde CAS v2 disponible
4. `totalMigrated()` — retourne le total migré jusqu'à présent
5. `migrationActive()` — retourne `true` si la migration est active

---

## Partie 5: Interroger les Contrats via le Diamond

Tous les contrats sont enregistrés dans le Diamond. Pour interroger:

1. Allez sur le Diamond: https://amoy.polygonscan.com/address/0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415#readContract
2. Allez dans **Read Contract** → `getAddress`
3. Entrez le nom du contrat:
   - `CASToken` → retourne `0x86fE62cb65C036412dC100035DeacD5A9345D86F`
   - `InfrastructureFund` → retourne `0x5924BA298365f28555D85cf27d0B4d29609e628d`
   - `CASSwap` → retourne `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`
   - `CASMigration` → retourne `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`

---

## Dépannage

| Problème | Cause | Solution |
|---|---|---|
| `MigrationNotActive` | Migration désactivée par l'admin | Attendre la réactivation |
| `ZeroAmount` | Tentative de migrer 0 CAS | Spécifier une valeur supérieure à 0 |
| Transaction échoue silencieusement | CAS v1 non approuvé d'abord | Exécuter `approve` sur CAS v1 avant `migrate` |
| `InsufficientPOLBalance` sur sellCAS | CASSwap sans POL suffisant | Attendre le réapprovisionnement de POL |
| `InsufficientCASBalance` sur buyCAS | CASSwap sans CAS suffisant | Attendre le dépôt de CAS |
| CAS v2 n'apparaît pas dans MetaMask | Token non importé | Suivre la Partie 3 pour importer |
| Solde CAS v1 non nul après migrate | Transaction non confirmée | Vérifier le statut sur Polygonscan |

---

## Résumé

| Action | Contrat | Fonction |
|---|---|---|
| Approuver la migration | CAS v1 | `approve(migrationAddr, amount)` |
| Migrer v1 → v2 | CASMigration | `migrate(amount)` |
| Acheter CAS avec POL | CASSwap v2 | `buyCAS()` avec `msg.value` = POL |
| Vendre CAS pour POL | CASSwap v2 | `sellCAS(amount)` (requiert `approve` préalable) |
| Vérifier le solde de migration | CASMigration | `availableNewCAS()` |
| Vérifier le ratio du swap | CASSwap v2 | `getRatio()` |

## Conclusion

La migration de CAS v1 vers v2 est simple et sûre: approuvez, migrez, et vos nouveaux tokens seront disponibles. CASSwap v2 avec ratio 2:1 (1 POL = 2 CAS) rend le CAS plus accessible dans la phase initiale. Tous les contrats sont enregistrés dans le Diamond, garantissant la découverte automatique par le backend et le frontend d'Agentic Space.
