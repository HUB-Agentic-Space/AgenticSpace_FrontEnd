---
lang: pt
title: "Usando o CAS Token v2"
description: "Aprenda como obter, usar, migrar e aplicar o CAS v2 (Criptocoin Agentic Space) no ambiente Agentic Space na Polygon Amoy Testnet"
---

# Usando o CAS Token v2

O **CAS v2 (Criptocoin Agentic Space)** é a versão atual do token interno do Agentic Space, usado para pagamentos de taxas em operações como registro de agentes, validação, propostas de DAO e votação.

> **Aviso**: O CAS v2 está atualmente em teste na **Polygon Amoy Testnet**. Quando migrarmos para a mainnet, o saldo de cada endereço será migrado juntamente.

## Pré-requisitos

Antes de começar, certifique-se de que você:

- Possui uma carteira Web3 (MetaMask, WalletConnect, etc.) configurada na rede **Polygon Amoy Testnet**
- Possui POL nativo para gas das transações (obtenha via faucet em testnet)
- Está autenticado no Agentic Space

## Contratos na Testnet

Todos os contratos estão implantados na **Polygon Amoy Testnet**:

| Contrato | Endereço |
|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| CAS Token v1 (antigo) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` |
| CAS Swap v2 (CAS ↔ POL) | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` |
| CAS Migration (v1 → v2) | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` |
| Diamond (proxy principal) | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` |
| Faucet | `0xB129009625296b0F92b1f7639af48ca2f8063429` |
| Infrastructure Fund v2 | `0x5924BA298365f28555D85cf27d0B4d29609e628d` |
| CAS Fund Tracker | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| POL Fund Tracker | `0x041055839123bd236010f4a4e663932F5C1167be` |

## O que é o CAS v2?

O CAS v2 é um token ERC-20 adaptável (UUPS) com as seguintes características:

- **Supply mintável com teto**: novos tokens podem ser cunhados por endereços com `MINTER_ROLE`, respeitando um supply máximo
- **Burnable**: qualquer titular pode queimar seus próprios tokens
- **Pausable**: operações podem ser pausadas em emergências
- **Controle de acesso baseado em roles**: `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`
- **Swap on-chain**: troque CAS ↔ POL diretamente via contrato `CASSwap`
- **Migração v1 → v2**: usuários que possuem CAS v1 podem migrar 1:1 para CAS v2

## Passo 1: Obter CAS v2 Tokens

Existem três formas principais de obter CAS v2:

### Opção A: Receber de outro usuário

1. Forneça seu endereço de carteira a quem irá transferir CAS v2 para você
2. O remetente executa uma transferência ERC-20 padrão para seu endereço
3. Os tokens aparecerão na sua carteira após a confirmação da transação

### Opção B: Ser mintado pelo admin

1. Solicite a um endereço com `MINTER_ROLE` que cunhe tokens para você
2. O minter executa a função `mint(to, amount)` do contrato CAS v2
3. Os tokens serão creditados no seu endereço

### Opção C: Comprar CAS com POL via CASSwap

1. Acesse o contrato **CASSwap v2** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`)
2. Execute a função `buyCAS()` enviando POL junto com a transação
3. Você receberá CAS v2 no ratio atual (1 POL = 2 CAS, ou seja, 1 CAS = 0,5 POL)
4. O ratio pode ser ajustado pela administração via `setRatio(numerator, denominator)`

> **Nota**: O CAS v2 ainda não está listado em exchanges. A distribuição é feita via mint administrativo, swap on-chain ou transferência peer-to-peer.

## Passo 2: Migrar CAS v1 para CAS v2 (se aplicável)

Se você já possui CAS v1 (`0x23222C45505576AC35A5f28458D02d8E715E48A7`), pode migrá-lo para CAS v2 na ratio **1:1** via contrato **CASMigration** (`0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`):

### Migração individual

1. Acesse o contrato CAS v1 na Polygon Amoy Testnet
2. Execute `approve(spender, amount)` autorizando o contrato `CASMigration`:
   - **spender**: `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount**: quantidade de CAS v1 a migrar
3. Acesse o contrato **CASMigration**
4. Execute `migrate(amount)` — seus CAS v1 serão queimados e você receberá CAS v2 equivalente

### Migração em lote (admin)

A administração pode migrar múltiplos usuários de uma vez via `batchMigrate(users[], amounts[])`, desde que cada usuário tenha aprovado o contrato de migração previamente.

> **Importante**: A migração é **1:1** — cada 1 CAS v1 equivale a 1 CAS v2. O CAS v1 é queimado após a migração. Quando migrarmos para a mainnet, o saldo de cada endereço será preservado.

## Passo 3: Aprovar o gasto de CAS v2

Antes de usar CAS v2 para pagar taxas no Agentic Space, você precisa aprovar o contrato que irá debitar seus tokens:

1. Abra sua carteira Web3
2. Acesse o contrato CAS Token v2 na Polygon Amoy Testnet (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
3. Execute a função `approve(spender, amount)` onde:
   - **spender**: endereço do contrato que cobrará a taxa (ex: `Diamond` em `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415`)
   - **amount**: quantidade de CAS a autorizar (recomenda-se um valor alto para evitar reapprovals frequentes)

```text
Exemplo: approve(0xa9e0...Diamond, 1000000000000000000000)
```

Isso autoriza o contrato a debitar até 1000 CAS v2 das suas taxas.

## Passo 4: Pagar Taxas com CAS v2

O CAS v2 é usado em várias operações do Agentic Space. Aqui estão as taxas padrão:

| Operação | Taxa (CAS) | Contrato |
|---|---|---|
| Registro de Agente | 100 CAS | `AgentRegistry` |
| Validação de Agente | 50 CAS | `AgentValidator` |
| Criar Proposta (DAO) | 200 CAS | `RoadMapDAO` / `AgentDAO` |
| Votar em Proposta | 10 CAS | `RoadMapDAO` / `AgentDAO` |
| Registro de Usuário | 30 CAS | `AgentRegistry` |

### Registrar um Agente

1. Certifique-se de ter CAS suficiente e aprovação concedida ao `AgentRegistry`
2. Navegue até a página de registro de agentes
3. Preencha DID, Public ID e AUID
4. Confirme a transação — a taxa de 100 CAS será debitada automaticamente
5. Seu agente estará registrado

### Validar um Agente

1. Certifique-se de ter CAS suficiente e aprovação concedida ao `AgentValidator`
2. Um validador autorizado executa a validação
3. A taxa de 50 CAS será debitada do validador

### Criar e Votar em Propostas

1. Certifique-se de ter CAS suficiente e aprovação concedida à DAO correspondente
2. Para criar uma proposta: a taxa é de 200 CAS
3. Para votar: a taxa é de 10 CAS por voto
4. Confirme cada transação na sua carteira

## Passo 5: Onde vão as taxas?

Todas as taxas em CAS v2 são transferidas para o **InfrastructureFund v2** (`0x5924BA298365f28555D85cf27d0B4d29609e628d`), o treasury do Agentic Space. Este contrato:

- Recebe CAS de taxas e depósitos
- Recebe POL nativo de depósitos
- Permite que o `TREASURER_ROLE` transfira fundos para o endereço da Rapport ou do autor do contrato
- Mantém os fundos para manutenção da infraestrutura

## Passo 6: Swap CAS ↔ POL (opcional)

Além de pagar taxas, você pode trocar CAS v2 por POL e vice-versa via contrato **CASSwap v2** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`):

### Comprar CAS com POL

1. Acesse o contrato CASSwap
2. Execute `buyCAS()` enviando POL como `msg.value`
3. Você receberá CAS v2 no ratio atual

### Vender CAS por POL

1. Aprove o contrato CASSwap no CAS Token v2 (`approve`)
2. Execute `sellCAS(casAmount)` no contrato CASSwap
3. Você receberá POL equivalente

> O ratio atual é **2:1** (1 POL = 2 CAS, ou seja, 1 CAS = 0,5 POL) e pode ser ajustado pela administração. Taxas de swap podem ser aplicadas via `swapFeeBps`.

## Passo 7: Queimar CAS v2 (opcional)

Se desejar reduzir o supply de CAS v2:

1. Acesse o contrato CAS Token v2 (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
2. Execute `burn(amount)` para queimar tokens do seu saldo
3. Ou execute `burnFrom(from, amount)` se tiver allowance de outro endereço

## Dicas Adicionais

- **Sempre verifique o saldo**: confirme que tem CAS v2 suficiente antes de iniciar operações
- **Mantenha aprovação**: se as operações falharem por "insufficient allowance", execute `approve` novamente
- **Gas POL**: além do CAS para taxas, você precisa de POL para pagar o gas da transação na Polygon Amoy Testnet
- **Monitorar taxas**: as taxas podem ser ajustadas pelo admin via `updateFees`
- **Migração v1 → v2**: se ainda possui CAS v1, migre o quanto antes via `CASMigration`
- **Testnet**: todos os contratos estão na Polygon Amoy Testnet; ao migrar para mainnet, os saldos serão preservados

## Solução de Problemas

| Problema | Causa | Solução |
|---|---|---|
| "InsufficientBalance" | Saldo CAS v2 insuficiente | Obter mais CAS v2 via swap, transfer ou mint |
| "Insufficient allowance" | Aprovação não concedida | Executar `approve` no contrato CAS v2 |
| "CasTokenNotSet" | Admin não configurou o CAS v2 | Aguardar configuração do admin |
| "MigrationNotActive" | Migração v1→v2 desativada | Aguardar reativação pela administração |
| "InsufficientCASBalance" no swap | Swap sem liquidez de CAS | Aguardar depósito de CAS no CASSwap |
| "InsufficientPOLBalance" no swap | Swap sem POL disponível | Aguardar reposição de POL no CASSwap |
| Transação revertida sem erro claro | Falta de POL para gas | Abastecer POL na carteira via faucet |

## Conclusão

O CAS v2 é fundamental para o funcionamento do ecossistema Agentic Space, garantindo que cada operação tenha um custo econômico que sustenta a infraestrutura. Com CAS v2 em mãos e aprovações configuradas, você pode registrar agentes, validar prompts, criar propostas, votar nas DAOs e realizar swap com POL. Usuários que ainda possuem CAS v1 podem migrar 1:1 a qualquer momento via contrato `CASMigration`. Ao migrarmos para a mainnet, todos os saldos serão preservados.
