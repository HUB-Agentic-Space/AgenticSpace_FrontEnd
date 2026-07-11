---
lang: pt
title: "Usando o CAS Token"
description: "Aprenda como obter, usar e aplicar o CAS (Criptocoin Agentic Space) no ambiente Agentic Space"
---

# Usando o CAS Token

O **CAS (Criptocoin Agentic Space)** é o token interno do Agentic Space, usado para pagamentos de taxas em operações como registro de agentes, validação, propostas de DAO e votação.

## Pré-requisitos

Antes de começar, certifique-se de que você:

- Possui uma carteira Web3 (MetaMask, WalletConnect, etc.) configurada na rede **Polygon PoS**
- Possui POL nativo para gas das transações
- Está autenticado no Agentic Space

## O que é o CAS?

O CAS é um token ERC-20 upgradeável (UUPS) com as seguintes características:

- **Supply mintável**: novos tokens podem ser cunhados por endereços com `MINTER_ROLE`
- **Burnable**: qualquer titular pode queimar seus próprios tokens
- **Pausable**: operações podem ser pausadas em emergências
- **Controle de acesso baseado em roles**: `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`

## Passo 1: Obter CAS Tokens

Existem duas formas principais de obter CAS:

### Opção A: Receber de outro usuário

1. Forneça seu endereço de carteira a quem irá transferir CAS para você
2. O remetente executa uma transferência ERC-20 padrão para seu endereço
3. Os tokens aparecerão na sua carteira após a confirmação da transação

### Opção B: Ser mintado pelo admin

1. Solicite a um endereço com `MINTER_ROLE` que cunhe tokens para você
2. O minter executa a função `mint(to, amount)` do contrato CAS
3. Os tokens serão creditados no seu endereço

> **Nota**: O CAS ainda não está listado em exchanges. A distribuição é feita via mint administrativo ou transferência peer-to-peer.

## Passo 2: Aprovar o gasto de CAS

Antes de usar CAS para pagar taxas no Agentic Space, você precisa aprovar o contrato que irá debitar seus tokens:

1. Abra sua carteira Web3
2. Acesse o contrato CAS Token na Polygon
3. Execute a função `approve(spender, amount)` onde:
   - **spender**: endereço do contrato que cobrará a taxa (ex: `AgentRegistry`)
   - **amount**: quantidade de CAS a autorizar (recomenda-se um valor alto para evitar reapprovals frequentes)

```text
Exemplo: approve(0x1234...Registry, 1000000000000000000000)
```

Isso autoriza o contrato a debitar até 1000 CAS das suas taxas.

## Passo 3: Pagar Taxas com CAS

O CAS é usado em várias operações do Agentic Space. Aqui estão as taxas padrão:

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

## Passo 4: Onde vão as taxas?

Todas as taxas em CAS são transferidas para o **InfrastructureFund**, o treasury do Agentic Space. Este contrato:

- Recebe CAS de taxas e depósitos
- Recebe POL nativo de depósitos
- Permite que o `TREASURER_ROLE` transfira fundos para o endereço da Rapport ou do autor do contrato
- Mantém os fundos para manutenção da infraestrutura

## Passo 5: Queimar CAS (opcional)

Se desejar reduzir o supply de CAS:

1. Acesse o contrato CAS Token
2. Execute `burn(amount)` para queimar tokens do seu saldo
3. Ou execute `burnFrom(from, amount)` se tiver allowance de outro endereço

## Dicas Adicionais

- **Sempre verifique o saldo**: confirme que tem CAS suficiente antes de iniciar operações
- **Mantenha aprovação**: se as operações falharem por "insufficient allowance", execute `approve` novamente
- **Gas POL**: além do CAS para taxas, você precisa de POL para pagar o gas da transação na Polygon
- **Monitorar taxas**: as taxas podem ser ajustadas pelo admin via `updateFees`

## Solução de Problemas

| Problema | Causa | Solução |
|---|---|---|
| "InsufficientBalance" | Saldo CAS insuficiente | Obter mais CAS via transfer ou mint |
| "Insufficient allowance" | Aprovação não concedida | Executar `approve` no contrato CAS |
| "CasTokenNotSet" | Admin não configurou o CAS | Aguardar configuração do admin |
| Transação revertida sem erro claro | Falta de POL para gas | Abastecer POL na carteira |

## Conclusão

O CAS é fundamental para o funcionamento do ecossistema Agentic Space, garantindo que cada operação tenha um custo econômico que sustenta a infraestrutura. Com CAS em mãos e aprovações configuradas, você pode registrar agentes, validar prompts, criar propostas e votar nas DAOs.
