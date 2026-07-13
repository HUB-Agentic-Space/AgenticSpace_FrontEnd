---
lang: pt
title: "Cadastrando o CAS v2 e Fund Trackers no MetaMask"
description: "Aprenda passo a passo como adicionar o CAS v2, o Agentic CAS Fund (aCAS) e o Agentic POL Fund (aPOL) na sua carteira MetaMask para visualizar saldos e acompanhar o fundo de infraestrutura"
---

# Cadastrando o CAS v2 e Fund Trackers no MetaMask

Este tutorial explica como adicionar o **CAS Token v2** e os **Fund Trackers** (wrappers que espelham o saldo do fundo de infraestrutura) na sua carteira **MetaMask**, permitindo visualizar seus saldos diretamente na carteira.

## Pré-requisitos

- MetaMask instalada (extensão do navegador ou app mobile)
- Rede **Polygon Amoy Testnet** configurada na MetaMask
- Seu endereço de carteira configurado como admin dos Fund Trackers (se quiser ver os saldos do fundo)

---

## Parte 1: Configurar a Polygon Amoy Testnet no MetaMask

Se você ainda não tem a rede de teste configurada:

1. Abra a MetaMask
2. Clique no seletor de rede no topo (geralmente mostra "Ethereum Mainnet")
3. Clique em **Add Network** > **Add a network manually**
4. Preencha os dados:

| Campo | Valor |
|---|---|
| **Network Name** | Polygon Amoy Testnet |
| **RPC URL** | `https://rpc-amoy.polygon.technology` |
| **Chain ID** | `80002` |
| **Currency Symbol** | `POL` |
| **Block Explorer URL** | `https://www.oklink.com/amoy` |

5. Clique em **Save**

> Pronto! Sua MetaMask agora está conectada à Polygon Amoy Testnet.

---

## Parte 2: Adicionar o CAS Token v2 no MetaMask

O CAS v2 é o token principal do Agentic Space. Para visualizá-lo na sua carteira:

1. Abra a MetaMask
2. Certifique-se de que a rede selecionada é **Polygon Amoy Testnet**
3. Na tela principal, role para baixo até a seção **Tokens**
4. Clique em **Import tokens** (ou **Add Token**)
5. Selecione a aba **Custom Token**
6. Preencha os dados:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (preenchido automaticamente) |
| **Token Decimal** | `18` (preenchido automaticamente) |

7. Clique em **Import Tokens** (ou **Add Token**)

> O CAS v2 aparecerá na sua lista de tokens com o saldo atual do seu endereço.

### Detalhes do CAS Token v2

- **Nome**: Criptocoin Agentic Space
- **Símbolo**: CAS
- **Decimais**: 18
- **Supply máximo**: 10.000.000 CAS
- **Endereço do contrato**: `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

---

## Parte 3: Adicionar o Agentic CAS Fund (aCAS) no MetaMask

O **Agentic CAS Fund (aCAS)** é um token ERC-20 especial que **espelha o saldo de CAS** custodiado pelo InfrastructureFund. Ele permite acompanhar quanto CAS existe no fundo de infraestrutura diretamente na MetaMask.

> **Importante**: Apenas o **admin** (owner) do Fund Tracker vê o saldo do fundo. Outros endereços verão saldo 0. O token aCAS **não é transferível** — ele apenas reflete o saldo do fundo.

### Passo a passo

1. Abra a MetaMask
2. Certifique-se de que a rede é **Polygon Amoy Testnet**
3. Clique em **Import tokens** > **Custom Token**
4. Preencha os dados:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| **Token Symbol** | `aCAS` (preenchido automaticamente) |
| **Token Decimal** | `18` (preenchido automaticamente) |

5. Clique em **Import Tokens**

### Como funciona o aCAS

- O `totalSupply()` do aCAS retorna o saldo de CAS no InfrastructureFund
- O `balanceOf()` do admin retorna o total do fundo; outros endereços retornam 0
- Quando CAS é depositado no InfrastructureFund, o saldo do aCAS aumenta
- Quando CAS é sacado do InfrastructureFund (pelo `TREASURER_ROLE`), o saldo do aCAS diminui
- O aCAS **não pode ser transferido, aprovado ou enviado** — é apenas um espelho de saldo

### Detalhes do Agentic CAS Fund

- **Nome**: Agentic CAS Fund
- **Símbolo**: aCAS
- **Decimais**: 18
- **Endereço do contrato**: `0xbedA5753f950c891d79a49f7c37182F0161c187C`
- **InfrastructureFund rastreado**: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Tipo de ativo**: CAS (ERC-20)

---

## Parte 4: Adicionar o Agentic POL Fund (aPOL) no MetaMask

O **Agentic POL Fund (aPOL)** é o equivalente ao aCAS, mas espelha o saldo de **POL nativo** custodiado pelo InfrastructureFund.

### Passo a passo

1. Abra a MetaMask
2. Certifique-se de que a rede é **Polygon Amoy Testnet**
3. Clique em **Import tokens** > **Custom Token**
4. Preencha os dados:

| Campo | Valor |
|---|---|
| **Token Contract Address** | `0x041055839123bd236010f4a4e663932F5C1167be` |
| **Token Symbol** | `aPOL` (preenchido automaticamente) |
| **Token Decimal** | `18` (preenchido automaticamente) |

5. Clique em **Import Tokens**

### Como funciona o aPOL

- O `totalSupply()` do aPOL retorna o saldo de POL no InfrastructureFund
- O `balanceOf()` do admin retorna o total do fundo; outros endereços retornam 0
- Quando POL é depositado no InfrastructureFund (`depositNative()`), o saldo do aPOL aumenta
- Quando POL é sacado do InfrastructureFund (pelo `TREASURER_ROLE`), o saldo do aPOL diminui
- O aPOL **não pode ser transferido, aprovado ou enviado** — é apenas um espelho de saldo

### Detalhes do Agentic POL Fund

- **Nome**: Agentic POL Fund
- **Símbolo**: aPOL
- **Decimais**: 18
- **Endereço do contrato**: `0x041055839123bd236010f4a4e663932F5C1167be`
- **InfrastructureFund rastreado**: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Tipo de ativo**: POL (nativo)

---

## Parte 5: Acompanhando o Fundo de Infraestrutura

Após adicionar os três tokens (CAS, aCAS e aPOL) na MetaMask, você pode acompanhar:

| Token | O que mostra | Quem vê |
|---|---|---|
| **CAS** | Seu saldo pessoal de CAS v2 | Qualquer endereço |
| **aCAS** | Saldo de CAS no InfrastructureFund v2 | Apenas o admin do tracker |
| **aPOL** | Saldo de POL no InfrastructureFund v2 | Apenas o admin do tracker |

### Verificar saldos via Block Explorer

Você também pode verificar os saldos diretamente no block explorer:

1. Acesse o explorer da Polygon Amoy: `https://www.oklink.com/amoy`
2. Cole o endereço do InfrastructureFund v2: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
3. Você verá:
   - **Token Holdings**: saldo de CAS v2 no fundo
   - **POL Balance**: saldo de POL nativo no fundo
4. Para verificar os Fund Trackers, busque pelos endereços:
   - aCAS: `0xbedA5753f950c891d79a49f7c37182F0161c187C`
   - aPOL: `0x041055839123bd236010f4a4e663932F5C1167be`

### Verificar saldos via contrato (Read Contract)

Se quiser consultar os saldos diretamente nos contratos:

1. Acesse o InfrastructureFund no block explorer
2. Vá em **Contract** > **Read Contract**
3. Chame `casBalance()` para ver o saldo de CAS
4. Chame `nativeBalance()` para ver o saldo de POL

Ou consulte os Fund Trackers:

1. Acesse o contrato aCAS ou aPOL no block explorer
2. Vá em **Contract** > **Read Contract**
3. Chame `totalSupply()` para ver o saldo total rastreado
4. Chame `balanceOf(seu_endereço)` para ver se você é o admin

---

## Parte 6: Transferir a propriedade do Fund Tracker

Se você é o admin atual dos Fund Trackers e deseja passar a visualização para outro endereço:

1. Acesse o contrato do Fund Tracker (aCAS ou aPOL) no block explorer
2. Vá em **Contract** > **Write Contract**
3. Conecte sua carteira (deve ser o admin atual)
4. Chame `transferOwnership(novo_endereço)`
5. Confirme a transação

> Após a transferência, o novo endereço verá o saldo do fundo na MetaMask, e o endereço anterior verá 0. Isso **não afeta** o InfrastructureFund — apenas muda quem pode visualizar o saldo.

---

## Resumo dos Endereços

| Contrato | Endereço | Símbolo |
|---|---|---|
| CAS Token v2 | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | CAS |
| Agentic CAS Fund | `0xbedA5753f950c891d79a49f7c37182F0161c187C` | aCAS |
| Agentic POL Fund | `0x041055839123bd236010f4a4e663932F5C1167be` | aPOL |
| InfrastructureFund v2 | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | — |

---

## Solução de Problemas

| Problema | Causa | Solução |
|---|---|---|
| Token não aparece após importar | Rede incorreta na MetaMask | Verifique se está em Polygon Amoy Testnet |
| Saldo aCAS/aPOL mostra 0 | Você não é o admin do tracker | Solicite `transferOwnership` do admin atual |
| "FundTracker: non-transferable" ao tentar enviar | Fund Trackers não são transferíveis | Isso é esperado — os trackers apenas espelham saldos |
| CAS não aparece após receber | Token não foi importado | Siga a Parte 2 para importar o CAS v2 |
| Saldo do CAS aparece como 0 | Endereço sem tokens | Obtenha CAS via swap, mint ou transferência |

---

## Conclusão

Com o CAS v2, aCAS e aPOL cadastrados na MetaMask, você tem visibilidade completa:

- **CAS**: seu saldo pessoal para operações no Agentic Space
- **aCAS**: quanto CAS existe no fundo de infraestrutura (se você for admin)
- **aPOL**: quanto POL existe no fundo de infraestrutura (se você for admin)

Os Fund Trackers são uma forma elegante de monitorar a saúde financeira do ecossistema Agentic Space diretamente na sua carteira, sem precisar acessar o block explorer a cada consulta.
