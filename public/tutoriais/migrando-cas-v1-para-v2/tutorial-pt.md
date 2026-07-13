---
lang: pt
title: "Migrando CAS v1 para CAS v2 e Usando os Novos Contratos"
description: "Guia completo para migrar seus tokens CAS v1 para CAS v2, comprar via CASSwap v2 com ratio 2:1, e usar todos os novos contratos deployados na Polygon Amoy Testnet"
---

# Migrando CAS v1 para CAS v2 e Usando os Novos Contratos

Este tutorial explica como **migrar seus tokens CAS v1 para CAS v2** na ratio 1:1, como **comprar CAS v2 com POL** via CASSwap v2 (ratio 2:1), e como usar os novos contratos deployados na Polygon Amoy Testnet.

## Pré-requisitos

- MetaMask instalada e configurada na rede **Polygon Amoy Testnet**
- Possuir tokens CAS v1 (endereço `0x23222C45505576AC35A5f28458D02d8E715E48A7`)
- POL nativo para gas das transações

---

## Contratos Atualizados (Amoy Testnet)

| Contrato | Endereço | Função |
|---|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | Token novo com MAX_SUPPLY 10M |
| **CAS Token v1** (antigo) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` | Token antigo, será descontinuado |
| **CASMigration** | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` | Migração v1 → v2 (1:1) |
| **CASSwap v2** | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` | Swap CAS ↔ POL (ratio 2:1) |
| **InfrastructureFund v2** | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | Treasury com `receive()` |
| **Diamond** | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` | Proxy principal (registra todos) |

> Todos os contratos acima estão registrados no Diamond via `ContractRegistryFacet`.

---

## Parte 1: Migrar CAS v1 para CAS v2

A migração é **1:1** — cada 1 CAS v1 equivale a 1 CAS v2. O CAS v1 é enviado para `0xdead` (queimado) e você recebe CAS v2 do contrato de migração.

### Passo 1: Aprovar o CASMigration no CAS v1

Antes de migrar, você precisa autorizar o contrato CASMigration a gastar seus CAS v1:

1. Acesse o CAS v1 no Polygonscan: https://amoy.polygonscan.com/token/0x23222C45505576AC35A5f28458D02d8E715E48A7#writeContract
2. Conecte sua MetaMask
3. Vá em **Write Contract** → `approve`
4. Preencha:
   - **spender**: `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount**: quantidade de CAS v1 em wei (ex: `100000000000000000000` = 100 CAS)
5. Confirme a transação na MetaMask

### Passo 2: Executar a migração

1. Acesse o CASMigration no Polygonscan: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#writeContract
2. Conecte sua MetaMask
3. Vá em **Write Contract** → `migrate`
4. Preencha:
   - **amount**: mesma quantidade aprovada no Passo 1 (ex: `100000000000000000000` = 100 CAS)
5. Confirme a transação

### Passo 3: Verificar

Após a confirmação:
- Seu saldo de CAS v1 será **0** (tokens queimados)
- Seu saldo de CAS v2 será igual à quantidade migrada
- Importe o CAS v2 na MetaMask: `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

> **Importante**: A migração é **irreversível**. Uma vez que o CAS v1 é migrado, não pode ser desfeito.

### Migração em lote (para admins)

Se você é owner do CASMigration, pode migrar múltiplos usuários de uma vez:

```
batchMigrate(
  ["0xendereco1", "0xendereco2"],
  ["100000000000000000000", "50000000000000000000"]
)
```

Cada usuário deve ter aprovado o CASMigration previamente.

---

## Parte 2: Comprar CAS v2 com POL via CASSwap v2

O CASSwap v2 permite comprar CAS v2 enviando POL. O ratio atual é **2:1** (1 POL = 2 CAS, ou seja, 1 CAS = 0,5 POL).

### Comprar CAS (buyCAS)

1. Acesse o CASSwap v2: https://amoy.polygonscan.com/address/0xdF5Df5Eb32fa1a53749c66364B877C39b7031377#writeContract
2. Conecte sua MetaMask
3. Vá em **Write Contract** → `buyCAS`
4. Em **Value (POL)**, insira a quantidade de POL (ex: `0.001` POL → você receberá `0.002` CAS)
5. Confirme a transação

### Vender CAS por POL (sellCAS)

1. Aprove o CASSwap v2 no CAS Token v2:
   - Acesse o CAS v2: https://amoy.polygonscan.com/token/0x86fE62cb65C036412dC100035DeacD5A9345D86F#writeContract
   - `approve("0xdF5Df5Eb32fa1a53749c66364B877C39b7031377", amount)`
2. Acesse o CASSwap v2 → **Write Contract** → `sellCAS`
3. Preencha a quantidade de CAS a vender (ex: `2000000000000000000` = 2 CAS → você receberá 1 POL)
4. Confirme a transação

> **Nota**: O CASSwap precisa ter POL disponível para vender. Se não houver POL suficiente, a transação reverterá com `InsufficientPOLBalance`.

---

## Parte 3: Cadastrar CAS v2 na MetaMask

Se ainda não cadastrou o CAS v2:

1. Abra a MetaMask na rede **Polygon Amoy Testnet**
2. Clique em **Import tokens** > **Custom Token**
3. Preencha:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (auto) |
| **Token Decimal** | `18` (auto) |

4. Clique em **Import Tokens**

---

## Parte 4: Verificar Saldo da Migração

Para verificar quanto CAS v2 está disponível para migração:

1. Acesse o CASMigration: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#readContract
2. Vá em **Read Contract**
3. `availableNewCAS()` — retorna o saldo de CAS v2 disponível
4. `totalMigrated()` — retorna quanto já foi migrado no total
5. `migrationActive()` — retorna `true` se a migração está ativa

---

## Parte 5: Consultar Contratos no Diamond

Todos os contratos estão registrados no Diamond. Para consultar:

1. Acesse o Diamond: https://amoy.polygonscan.com/address/0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415#readContract
2. Vá em **Read Contract** → `getAddress`
3. Digite o nome do contrato:
   - `CASToken` → retorna `0x86fE62cb65C036412dC100035DeacD5A9345D86F`
   - `InfrastructureFund` → retorna `0x5924BA298365f28555D85cf27d0B4d29609e628d`
   - `CASSwap` → retorna `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`
   - `CASMigration` → retorna `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`

---

## Solução de Problemas

| Problema | Causa | Solução |
|---|---|---|
| `MigrationNotActive` | Migração desativada pelo admin | Aguardar reativação |
| `ZeroAmount` | Tentou migrar 0 CAS | Especifique um valor maior que 0 |
| Transação rever sem erro | Não aprovou o CAS v1 primeiro | Execute `approve` no CAS v1 antes de `migrate` |
| `InsufficientPOLBalance` no sellCAS | CASSwap sem POL suficiente | Aguardar reposição de POL no swap |
| `InsufficientCASBalance` no buyCAS | CASSwap sem CAS suficiente | Aguardar depósito de CAS no swap |
| CAS v2 não aparece na MetaMask | Token não importado | Siga a Parte 3 para importar |
| Saldo CAS v1 não zera após migrate | Transação não confirmou | Verifique o status no Polygonscan |

---

## Resumo

| Ação | Contrato | Função |
|---|---|---|
| Aprovar migração | CAS v1 | `approve(migrationAddr, amount)` |
| Migrar v1 → v2 | CASMigration | `migrate(amount)` |
| Comprar CAS com POL | CASSwap v2 | `buyCAS()` com `msg.value` = POL |
| Vender CAS por POL | CASSwap v2 | `sellCAS(amount)` (requer `approve` prévio) |
| Ver saldo migration | CASMigration | `availableNewCAS()` |
| Ver ratio do swap | CASSwap v2 | `getRatio()` |

## Conclusão

A migração de CAS v1 para v2 é simples e segura: aprove, migre, e seus tokens novos estarão disponíveis. O CASSwap v2 com ratio 2:1 (1 POL = 2 CAS) torna o CAS mais acessível na fase inicial. Todos os contratos estão registrados no Diamond, garantindo descoberta automática pelo backend e frontend do Agentic Space.
