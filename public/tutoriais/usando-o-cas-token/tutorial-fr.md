---
lang: fr
title: "Utiliser le jeton CAS"
description: "Apprenez comment obtenir, utiliser et appliquer le CAS (Criptocoin Agentic Space) dans l'environnement Agentic Space"
---

# Utiliser le jeton CAS

Le **CAS (Criptocoin Agentic Space)** est le jeton interne d'Agentic Space, utilisé pour payer les frais des opérations telles que l'enregistrement des agents, la validation, les propositions DAO et le vote.

## Prérequis

Avant de commencer, assurez-vous que vous :

- Disposez d'un portefeuille Web3 (MetaMask, WalletConnect, etc.) configuré sur le réseau **Polygon PoS**
- Disposez de POL natif pour le gaz des transactions
- Êtes authentifié dans Agentic Space

## Qu'est-ce que le CAS ?

Le CAS est un jeton ERC-20 améliorable (UUPS) avec les caractéristiques suivantes :

- **Offre frappable** : de nouveaux jetons peuvent être frappés par des adresses avec `MINTER_ROLE`
- **Brûlable** : tout détenteur peut brûler ses propres jetons
- **Suspendable** : les opérations peuvent être suspendues en cas d'urgence
- **Contrôle d'accès basé sur les rôles** : `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`

## Étape 1 : Obtenir des jetons CAS

Il existe deux façons principales d'obtenir du CAS :

### Option A : Recevoir d'un autre utilisateur

1. Fournissez votre adresse de portefeuille à la personne qui vous transférera du CAS
2. L'expéditeur exécute un transfert ERC-20 standard vers votre adresse
3. Les jetons apparaîtront dans votre portefeuille après la confirmation de la transaction

### Option B : Frappé par l'administrateur

1. Demandez à une adresse avec `MINTER_ROLE` de frapper des jetons pour vous
2. Le frappeur exécute la fonction `mint(to, amount)` du contrat CAS
3. Les jetons seront crédités à votre adresse

> **Note** : Le CAS n'est pas encore listé sur les exchanges. La distribution se fait par frappe administrative ou par transfert de pair à pair.

## Étape 2 : Approuver les dépenses CAS

Avant d'utiliser le CAS pour payer des frais dans Agentic Space, vous devez approuver le contrat qui débitera vos jetons :

1. Ouvrez votre portefeuille Web3
2. Accédez au contrat CAS Token sur Polygon
3. Exécutez la fonction `approve(spender, amount)` où :
   - **spender** : adresse du contrat qui facture les frais (ex : `AgentRegistry`)
   - **amount** : quantité de CAS à autoriser (une valeur élevée est recommandée pour éviter les réapprobations fréquentes)

```text
Exemple : approve(0x1234...Registry, 1000000000000000000000)
```

Cela autorise le contrat à débiter jusqu'à 1000 CAS pour vos frais.

## Étape 3 : Payer des frais avec CAS

Le CAS est utilisé dans diverses opérations d'Agentic Space. Voici les frais par défaut :

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

## Étape 4 : Où vont les frais ?

Tous les frais en CAS sont transférés au **InfrastructureFund**, le trésor d'Agentic Space. Ce contrat :

- Reçoit le CAS des frais et des dépôts
- Reçoit le POL natif des dépôts
- Permet au `TREASURER_ROLE` de transférer des fonds vers l'adresse Rapport ou l'adresse de l'auteur du contrat
- Maintient les fonds pour la maintenance de l'infrastructure

## Étape 5 : Brûler du CAS (optionnel)

Si vous souhaitez réduire l'offre de CAS :

1. Accédez au contrat CAS Token
2. Exécutez `burn(amount)` pour brûler des jetons de votre solde
3. Ou exécutez `burnFrom(from, amount)` si vous avez une autorisation d'une autre adresse

## Conseils supplémentaires

- **Vérifiez toujours le solde** : confirmez que vous avez assez de CAS avant de commencer des opérations
- **Maintenez l'approbation** : si les opérations échouent avec "insufficient allowance", exécutez `approve` à nouveau
- **POL pour le gaz** : en plus du CAS pour les frais, vous avez besoin de POL pour payer le gaz des transactions sur Polygon
- **Surveillez les frais** : les frais peuvent être ajustés par l'administrateur via `updateFees`

## Dépannage

| Problème | Cause | Solution |
|---|---|---|
| "InsufficientBalance" | Solde CAS insuffisant | Obtenir plus de CAS via transfert ou frappe |
| "Insufficient allowance" | Approbation non accordée | Exécuter `approve` sur le contrat CAS |
| "CasTokenNotSet" | L'administrateur n'a pas configuré le CAS | Attendre la configuration de l'administrateur |
| Transaction annulée sans erreur claire | Manque de POL pour le gaz | Recharger du POL dans votre portefeuille |

## Conclusion

Le CAS est fondamental pour l'écosystème Agentic Space, garantissant que chaque opération a un coût économique qui soutient l'infrastructure. Avec du CAS en main et des approbations configurées, vous pouvez enregistrer des agents, valider des prompts, créer des propositions et voter dans les DAOs.
