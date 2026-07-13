---
lang: en
title: "Migrating CAS v1 to CAS v2 and Using the New Contracts"
description: "Complete guide to migrate your CAS v1 tokens to CAS v2, buy via CASSwap v2 with 2:1 ratio, and use all new contracts deployed on Polygon Amoy Testnet"
---

# Migrating CAS v1 to CAS v2 and Using the New Contracts

This tutorial explains how to **migrate your CAS v1 tokens to CAS v2** at 1:1 ratio, how to **buy CAS v2 with POL** via CASSwap v2 (2:1 ratio), and how to use the new contracts deployed on Polygon Amoy Testnet.

## Prerequisites

- MetaMask installed and configured on **Polygon Amoy Testnet**
- CAS v1 tokens (address `0x23222C45505576AC35A5f28458D02d8E715E48A7`)
- Native POL for transaction gas

---

## Updated Contracts (Amoy Testnet)

| Contract | Address | Purpose |
|---|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` | New token with MAX_SUPPLY 10M |
| **CAS Token v1** (old) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` | Old token, being deprecated |
| **CASMigration** | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` | Migration v1 → v2 (1:1) |
| **CASSwap v2** | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` | Swap CAS ↔ POL (ratio 2:1) |
| **InfrastructureFund v2** | `0x5924BA298365f28555D85cf27d0B4d29609e628d` | Treasury with `receive()` |
| **Diamond** | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` | Main proxy (registers all) |

> All contracts above are registered in the Diamond via `ContractRegistryFacet`.

---

## Part 1: Migrate CAS v1 to CAS v2

The migration is **1:1** — each 1 CAS v1 equals 1 CAS v2. CAS v1 is sent to `0xdead` (burned) and you receive CAS v2 from the migration contract.

### Step 1: Approve CASMigration on CAS v1

Before migrating, you need to authorize the CASMigration contract to spend your CAS v1:

1. Go to CAS v1 on Polygonscan: https://amoy.polygonscan.com/token/0x23222C45505576AC35A5f28458D02d8E715E48A7#writeContract
2. Connect your MetaMask
3. Go to **Write Contract** → `approve`
4. Fill in:
   - **spender**: `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount**: amount of CAS v1 in wei (e.g., `100000000000000000000` = 100 CAS)
5. Confirm the transaction

### Step 2: Execute the migration

1. Go to CASMigration on Polygonscan: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#writeContract
2. Connect your MetaMask
3. Go to **Write Contract** → `migrate`
4. Fill in:
   - **amount**: same amount approved in Step 1 (e.g., `100000000000000000000` = 100 CAS)
5. Confirm the transaction

### Step 3: Verify

After confirmation:
- Your CAS v1 balance will be **0** (tokens burned)
- Your CAS v2 balance will equal the migrated amount
- Import CAS v2 in MetaMask: `0x86fE62cb65C036412dC100035DeacD5A9345D86F`

> **Important**: Migration is **irreversible**. Once CAS v1 is migrated, it cannot be undone.

### Batch migration (for admins)

If you are the CASMigration owner, you can migrate multiple users at once:

```
batchMigrate(
  ["0xaddress1", "0xaddress2"],
  ["100000000000000000000", "50000000000000000000"]
)
```

Each user must have approved CASMigration beforehand.

---

## Part 2: Buy CAS v2 with POL via CASSwap v2

CASSwap v2 allows buying CAS v2 by sending POL. The current ratio is **2:1** (1 POL = 2 CAS, meaning 1 CAS = 0.5 POL).

### Buy CAS (buyCAS)

1. Go to CASSwap v2: https://amoy.polygonscan.com/address/0xdF5Df5Eb32fa1a53749c66364B877C39b7031377#writeContract
2. Connect your MetaMask
3. Go to **Write Contract** → `buyCAS`
4. In **Value (POL)**, enter the POL amount (e.g., `0.001` POL → you receive `0.002` CAS)
5. Confirm the transaction

### Sell CAS for POL (sellCAS)

1. Approve CASSwap v2 on CAS Token v2:
   - Go to CAS v2: https://amoy.polygonscan.com/token/0x86fE62cb65C036412dC100035DeacD5A9345D86F#writeContract
   - `approve("0xdF5Df5Eb32fa1a53749c66364B877C39b7031377", amount)`
2. Go to CASSwap v2 → **Write Contract** → `sellCAS`
3. Enter the CAS amount to sell (e.g., `2000000000000000000` = 2 CAS → you receive 1 POL)
4. Confirm the transaction

> **Note**: CASSwap needs POL available to sell. If there is not enough POL, the transaction will revert with `InsufficientPOLBalance`.

---

## Part 3: Add CAS v2 to MetaMask

If you haven't added CAS v2 yet:

1. Open MetaMask on **Polygon Amoy Testnet**
2. Click **Import tokens** > **Custom Token**
3. Fill in:

| Field | Value |
|---|---|
| **Token Contract Address** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| **Token Symbol** | `CAS` (auto) |
| **Token Decimal** | `18` (auto) |

4. Click **Import Tokens**

---

## Part 4: Check Migration Status

To check how much CAS v2 is available for migration:

1. Go to CASMigration: https://amoy.polygonscan.com/address/0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE#readContract
2. Go to **Read Contract**
3. `availableNewCAS()` — returns available CAS v2 balance
4. `totalMigrated()` — returns total migrated so far
5. `migrationActive()` — returns `true` if migration is active

---

## Part 5: Query Contracts via Diamond

All contracts are registered in the Diamond. To query:

1. Go to Diamond: https://amoy.polygonscan.com/address/0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415#readContract
2. Go to **Read Contract** → `getAddress`
3. Enter the contract name:
   - `CASToken` → returns `0x86fE62cb65C036412dC100035DeacD5A9345D86F`
   - `InfrastructureFund` → returns `0x5924BA298365f28555D85cf27d0B4d29609e628d`
   - `CASSwap` → returns `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`
   - `CASMigration` → returns `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| `MigrationNotActive` | Migration disabled by admin | Wait for reactivation |
| `ZeroAmount` | Tried to migrate 0 CAS | Specify a value greater than 0 |
| Transaction reverts silently | Didn't approve CAS v1 first | Execute `approve` on CAS v1 before `migrate` |
| `InsufficientPOLBalance` on sellCAS | CASSwap has insufficient POL | Wait for POL replenishment |
| `InsufficientCASBalance` on buyCAS | CASSwap has insufficient CAS | Wait for CAS deposit |
| CAS v2 not showing in MetaMask | Token not imported | Follow Part 3 to import |
| CAS v1 balance not zero after migrate | Transaction not confirmed | Check status on Polygonscan |

---

## Summary

| Action | Contract | Function |
|---|---|---|
| Approve migration | CAS v1 | `approve(migrationAddr, amount)` |
| Migrate v1 → v2 | CASMigration | `migrate(amount)` |
| Buy CAS with POL | CASSwap v2 | `buyCAS()` with `msg.value` = POL |
| Sell CAS for POL | CASSwap v2 | `sellCAS(amount)` (requires prior `approve`) |
| Check migration balance | CASMigration | `availableNewCAS()` |
| Check swap ratio | CASSwap v2 | `getRatio()` |

## Conclusion

Migrating CAS v1 to v2 is simple and safe: approve, migrate, and your new tokens will be available. CASSwap v2 with 2:1 ratio (1 POL = 2 CAS) makes CAS more accessible in the initial phase. All contracts are registered in the Diamond, ensuring automatic discovery by the Agentic Space backend and frontend.
