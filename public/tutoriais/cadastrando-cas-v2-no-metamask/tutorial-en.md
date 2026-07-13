---
lang: en
title: "Registering CAS v2 and Fund Trackers in MetaMask"
description: "Learn step by step how to add CAS v2, Agentic CAS Fund (aCAS), and Agentic POL Fund (aPOL) to your MetaMask wallet to visualize balances and monitor the infrastructure fund"
---

# Registering CAS v2 and Fund Trackers in MetaMask

This tutorial explains how to add the **CAS Token v2** and **Fund Trackers** (wrappers that mirror the infrastructure fund balance) to your **MetaMask** wallet, allowing you to visualize balances directly in the wallet.

## Prerequisites

- MetaMask installed (browser extension or mobile app)
- **Polygon Amoy Testnet** network configured in MetaMask
- Your wallet address set as Fund Tracker admin (if you want to see fund balances)

---

## Part 1: Configure Polygon Amoy Testnet in MetaMask

If you don't have the test network configured yet:

1. Open MetaMask
2. Click the network selector at the top (usually shows "Ethereum Mainnet")
3. Click **Add Network** > **Add a network manually**
4. Fill in the details:

| Field | Value |
|---|---|
| **Network Name** | Polygon Amoy Testnet |
| **RPC URL** | `https://rpc-amoy.polygon.technology` |
| **Chain ID** | `80002` |
| **Currency Symbol** | `POL` |
| **Block Explorer URL** | `https://www.oklink.com/amoy` |

5. Click **Save**

> Done! Your MetaMask is now connected to the Polygon Amoy Testnet.

---

## Part 2: Add the CAS Token v2 to MetaMask

CAS v2 is the main token of Agentic Space. To visualize it in your wallet:

1. Open MetaMask
2. Make sure the selected network is **Polygon Amoy Testnet**
3. On the main screen, scroll down to the **Tokens** section
4. Click **Import tokens** (or **Add Token**)
5. Select the **Custom Token** tab
6. Fill in the details:

| Field | Value |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (auto-filled) |
| **Token Decimal** | `18` (auto-filled) |

7. Click **Import Tokens** (or **Add Token**)

> CAS v2 will appear in your token list with your current address balance.

### CAS Token v2 Details

- **Name**: Criptocoin Agentic Space
- **Symbol**: CAS
- **Decimals**: 18
- **Max supply**: 10,000,000 CAS
- **Contract address**: `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

---

## Part 3: Add the Agentic CAS Fund (aCAS) to MetaMask

The **Agentic CAS Fund (aCAS)** is a special ERC-20 token that **mirrors the CAS balance** held by the InfrastructureFund. It allows you to track how much CAS is in the infrastructure fund directly in MetaMask.

> **Important**: Only the **admin** (owner) of the Fund Tracker sees the fund balance. Other addresses will see 0. The aCAS token **is not transferable** — it only reflects the fund balance.

### Step by step

1. Open MetaMask
2. Make sure the network is **Polygon Amoy Testnet**
3. Click **Import tokens** > **Custom Token**
4. Fill in the details:

| Field | Value |
|---|---|
| **Token Contract Address** | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| **Token Symbol** | `aCAS` (auto-filled) |
| **Token Decimal** | `18` (auto-filled) |

5. Click **Import Tokens**

### How aCAS works

- The `totalSupply()` of aCAS returns the CAS balance in the InfrastructureFund
- The `balanceOf()` of the admin returns the total fund amount; other addresses return 0
- When CAS is deposited into the InfrastructureFund, the aCAS balance increases
- When CAS is withdrawn from the InfrastructureFund (by `TREASURER_ROLE`), the aCAS balance decreases
- aCAS **cannot be transferred, approved, or sent** — it is only a balance mirror

### Agentic CAS Fund Details

- **Name**: Agentic CAS Fund
- **Symbol**: aCAS
- **Decimals**: 18
- **Contract address**: `0xbedA5753f950c891d79a49f7c37182F0161c187C`
- **Tracked InfrastructureFund**: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Asset type**: CAS (ERC-20)

---

## Part 4: Add the Agentic POL Fund (aPOL) to MetaMask

The **Agentic POL Fund (aPOL)** is the equivalent of aCAS, but mirrors the **native POL** balance held by the InfrastructureFund.

### Step by step

1. Open MetaMask
2. Make sure the network is **Polygon Amoy Testnet**
3. Click **Import tokens** > **Custom Token**
4. Fill in the details:

| Field | Value |
|---|---|
| **Token Contract Address** | `0x041055839123bd236010f4a4e663932F5C1167be` |
| **Token Symbol** | `aPOL` (auto-filled) |
| **Token Decimal** | `18` (auto-filled) |

5. Click **Import Tokens**

### How aPOL works

- The `totalSupply()` of aPOL returns the POL balance in the InfrastructureFund
- The `balanceOf()` of the admin returns the total fund amount; other addresses return 0
- When POL is deposited into the InfrastructureFund (`depositNative()`), the aPOL balance increases
- When POL is withdrawn from the InfrastructureFund (by `TREASURER_ROLE`), the aPOL balance decreases
- aPOL **cannot be transferred, approved, or sent** — it is only a balance mirror

### Agentic POL Fund Details

- **Name**: Agentic POL Fund
- **Symbol**: aPOL
- **Decimals**: 18
- **Contract address**: `0x041055839123bd236010f4a4e663932F5C1167be`
- **Tracked InfrastructureFund**: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
- **Asset type**: POL (native)

---

## Part 5: Monitoring the Infrastructure Fund

After adding all three tokens (CAS, aCAS, and aPOL) to MetaMask, you can monitor:

| Token | What it shows | Who sees it |
|---|---|---|
| **CAS** | Your personal CAS v2 balance | Any address |
| **aCAS** | CAS balance in the InfrastructureFund | Only the tracker admin |
| **aPOL** | POL balance in the InfrastructureFund | Only the tracker admin |

### Check balances via Block Explorer

You can also check balances directly on the block explorer:

1. Go to the Polygon Amoy explorer: `https://www.oklink.com/amoy`
2. Paste the InfrastructureFund address: `0x5924BA298365f28555D85cf27d0B4d29609e628d`
3. You will see:
   - **Token Holdings**: CAS v2 balance in the fund
   - **POL Balance**: native POL balance in the fund
4. To check the Fund Trackers, search for their addresses:
   - aCAS: `0xbedA5753f950c891d79a49f7c37182F0161c187C`
   - aPOL: `0x041055839123bd236010f4a4e663932F5C1167be`

### Check balances via contract (Read Contract)

If you want to query balances directly from the contracts:

1. Access the InfrastructureFund on the block explorer
2. Go to **Contract** > **Read Contract**
3. Call `casBalance()` to see the CAS balance
4. Call `nativeBalance()` to see the POL balance

Or query the Fund Trackers:

1. Access the aCAS or aPOL contract on the block explorer
2. Go to **Contract** > **Read Contract**
3. Call `totalSupply()` to see the total tracked balance
4. Call `balanceOf(your_address)` to check if you are the admin

---

## Part 6: Transfer Fund Tracker ownership

If you are the current admin of the Fund Trackers and want to pass visualization to another address:

1. Access the Fund Tracker contract (aCAS or aPOL) on the block explorer
2. Go to **Contract** > **Write Contract**
3. Connect your wallet (must be the current admin)
4. Call `transferOwnership(new_address)`
5. Confirm the transaction

> After the transfer, the new address will see the fund balance in MetaMask, and the previous address will see 0. This **does not affect** the InfrastructureFund — it only changes who can visualize the balance.

---

## Address Summary

| Contract | Address | Symbol |
|---|---|---|
| CAS Token v2 | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | CAS |
| Agentic CAS Fund | `0xbedA5753f950c891d79a49f7c37182F0161c187C` | aCAS |
| Agentic POL Fund | `0x041055839123bd236010f4a4e663932F5C1167be` | aPOL |
| InfrastructureFund | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | — |

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| Token doesn't appear after import | Wrong network in MetaMask | Verify you're on Polygon Amoy Testnet |
| aCAS/aPOL balance shows 0 | You are not the tracker admin | Request `transferOwnership` from current admin |
| "FundTracker: non-transferable" when trying to send | Fund Trackers are not transferable | This is expected — trackers only mirror balances |
| CAS doesn't appear after receiving | Token not imported | Follow Part 2 to import CAS v2 |
| CAS balance shows 0 | Address has no tokens | Obtain CAS via swap, mint, or transfer |

---

## Conclusion

With CAS v2, aCAS, and aPOL registered in MetaMask, you have full visibility:

- **CAS**: your personal balance for Agentic Space operations
- **aCAS**: how much CAS is in the infrastructure fund (if you're admin)
- **aPOL**: how much POL is in the infrastructure fund (if you're admin)

Fund Trackers are an elegant way to monitor the financial health of the Agentic Space ecosystem directly in your wallet, without needing to access the block explorer for every query.
