---
lang: en
title: "Using the CAS Token v2"
description: "Learn how to obtain, use, migrate, and apply CAS v2 (Cryptocoin Agentic Space) within the Agentic Space environment on Polygon Amoy Testnet"
---

# Using the CAS Token v2

The **CAS v2 (Cryptocoin Agentic Space)** is the current version of the internal token of Agentic Space, used to pay fees for operations such as agent registration, validation, DAO proposals, and voting.

> **Notice**: CAS v2 is currently being tested on the **Polygon Amoy Testnet**. When we migrate to mainnet, each address's balance will be migrated along.

## Prerequisites

Before starting, make sure you:

- Have a Web3 wallet (MetaMask, WalletConnect, etc.) configured on the **Polygon Amoy Testnet** network
- Have native POL for transaction gas (obtain via faucet on testnet)
- Are authenticated in Agentic Space

## Contracts on Testnet

All contracts are deployed on the **Polygon Amoy Testnet**:

| Contract | Address |
|---|---|
| **CAS Token v2** | `0x86fE62cb65C036412dC100035DeacD5A9345D86F` |
| CAS Token v1 (old) | `0x23222C45505576AC35A5f28458D02d8E715E48A7` |
| CAS Swap (CAS ↔ POL) | `0xdF5Df5Eb32fa1a53749c66364B877C39b7031377` |
| CAS Migration (v1 → v2) | `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE` |
| Diamond (main proxy) | `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415` |
| Faucet | `0xB129009625296b0F92b1f7639af48ca2f8063429` |
| Infrastructure Fund | `0x5924BA298365f28555D85cf27d0B4d29609e628d` |
| CAS Fund Tracker | `0xbedA5753f950c891d79a49f7c37182F0161c187C` |
| POL Fund Tracker | `0x041055839123bd236010f4a4e663932F5C1167be` |

## What is CAS v2?

CAS v2 is an adaptable ERC-20 token (UUPS) with the following features:

- **Mintable supply with cap**: new tokens can be minted by addresses with `MINTER_ROLE`, respecting a maximum supply
- **Burnable**: any holder can burn their own tokens
- **Pausable**: operations can be paused in emergencies
- **Role-based access control**: `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`
- **On-chain swap**: exchange CAS ↔ POL directly via the `CASSwap` contract
- **Migration v1 → v2**: users who hold CAS v1 can migrate 1:1 to CAS v2

## Step 1: Obtain CAS v2 Tokens

There are three main ways to obtain CAS v2:

### Option A: Receive from another user

1. Provide your wallet address to the person who will transfer CAS v2 to you
2. The sender executes a standard ERC-20 transfer to your address
3. Tokens will appear in your wallet after the transaction is confirmed

### Option B: Minted by admin

1. Request an address with `MINTER_ROLE` to mint tokens for you
2. The minter executes the `mint(to, amount)` function on the CAS v2 contract
3. Tokens will be credited to your address

### Option C: Buy CAS with POL via CASSwap

1. Access the **CASSwap** contract (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`)
2. Execute the `buyCAS()` function sending POL along with the transaction
3. You will receive CAS v2 at the current ratio (default: 1 POL = 2 CAS (1 CAS = 0.5 POL))
4. The ratio can be adjusted by administration via `setRatio(numerator, denominator)`

> **Note**: CAS v2 is not yet listed on exchanges. Distribution is done via administrative minting, on-chain swap, or peer-to-peer transfer.

## Step 2: Migrate CAS v1 to CAS v2 (if applicable)

If you already hold CAS v1 (`0x23222C45505576AC35A5f28458D02d8E715E48A7`), you can migrate it to CAS v2 at a **1:1** ratio via the **CASMigration** contract (`0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`):

### Individual migration

1. Access the CAS v1 contract on Polygon Amoy Testnet
2. Execute `approve(spender, amount)` authorizing the `CASMigration` contract:
   - **spender**: `0x6d0c0F51b6B8d1b9ca017b5c3C422822BC5431AE`
   - **amount**: quantity of CAS v1 to migrate
3. Access the **CASMigration** contract
4. Execute `migrate(amount)` — your CAS v1 will be burned and you will receive equivalent CAS v2

### Batch migration (admin)

The administration can migrate multiple users at once via `batchMigrate(users[], amounts[])`, provided each user has previously approved the migration contract.

> **Important**: The migration is **1:1** — each 1 CAS v1 equals 1 CAS v2. CAS v1 is burned after migration. When we migrate to mainnet, each address's balance will be preserved.

## Step 3: Approve CAS v2 Spending

Before using CAS v2 to pay fees in Agentic Space, you need to approve the contract that will debit your tokens:

1. Open your Web3 wallet
2. Access the CAS Token v2 contract on Polygon Amoy Testnet (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
3. Execute the `approve(spender, amount)` function where:
   - **spender**: address of the contract that charges the fee (e.g., `Diamond` at `0xa9e0Cc843d7C2D4f2Ead780CD2F806C080392415`)
   - **amount**: quantity of CAS to authorize (a high value is recommended to avoid frequent re-approvals)

```text
Example: approve(0xa9e0...Diamond, 1000000000000000000000)
```

This authorizes the contract to debit up to 1000 CAS v2 for your fees.

## Step 4: Pay Fees with CAS v2

CAS v2 is used in various Agentic Space operations. Here are the default fees:

| Operation | Fee (CAS) | Contract |
|---|---|---|
| Agent Registration | 100 CAS | `AgentRegistry` |
| Agent Validation | 50 CAS | `AgentValidator` |
| Create Proposal (DAO) | 200 CAS | `RoadMapDAO` / `AgentDAO` |
| Vote on Proposal | 10 CAS | `RoadMapDAO` / `AgentDAO` |
| User Registration | 30 CAS | `AgentRegistry` |

### Register an Agent

1. Ensure you have sufficient CAS and approval granted to `AgentRegistry`
2. Navigate to the agent registration page
3. Fill in DID, Public ID, and AUID
4. Confirm the transaction — the 100 CAS fee will be debited automatically
5. Your agent will be registered

### Validate an Agent

1. Ensure you have sufficient CAS and approval granted to `AgentValidator`
2. An authorized validator executes the validation
3. The 50 CAS fee will be debited from the validator

### Create and Vote on Proposals

1. Ensure you have sufficient CAS and approval granted to the corresponding DAO
2. To create a proposal: the fee is 200 CAS
3. To vote: the fee is 10 CAS per vote
4. Confirm each transaction in your wallet

## Step 5: Where do fees go?

All CAS v2 fees are transferred to the **InfrastructureFund** (`0x5924BA298365f28555D85cf27d0B4d29609e628d`), the Agentic Space treasury. This contract:

- Receives CAS from fees and deposits
- Receives native POL from deposits
- Allows `TREASURER_ROLE` to transfer funds to the Rapport address or the contract author's address
- Maintains funds for infrastructure maintenance

## Step 6: Swap CAS ↔ POL (optional)

In addition to paying fees, you can exchange CAS v2 for POL and vice versa via the **CASSwap** contract (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`):

### Buy CAS with POL

1. Access the CASSwap contract
2. Execute `buyCAS()` sending POL as `msg.value`
3. You will receive CAS v2 at the current ratio

### Sell CAS for POL

1. Approve the CASSwap contract on the CAS Token v2 (`approve`)
2. Execute `sellCAS(casAmount)` on the CASSwap contract
3. You will receive equivalent POL

> The default ratio is 1:1 (1 POL = 2 CAS (1 CAS = 0.5 POL)) and can be adjusted by administration. Swap fees may apply via `swapFeeBps`.

## Step 7: Burn CAS v2 (optional)

If you wish to reduce the CAS v2 supply:

1. Access the CAS Token v2 contract (`0x86fE62cb65C036412dC100035DeacD5A9345D86F`)
2. Execute `burn(amount)` to burn tokens from your balance
3. Or execute `burnFrom(from, amount)` if you have allowance from another address

## Additional Tips

- **Always check balance**: confirm you have enough CAS v2 before starting operations
- **Maintain approval**: if operations fail with "insufficient allowance", execute `approve` again
- **POL for gas**: in addition to CAS for fees, you need POL to pay for transaction gas on Polygon Amoy Testnet
- **Monitor fees**: fees can be adjusted by the admin via `updateFees`
- **Migration v1 → v2**: if you still hold CAS v1, migrate as soon as possible via `CASMigration`
- **Testnet**: all contracts are on Polygon Amoy Testnet; when migrating to mainnet, balances will be preserved

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| "InsufficientBalance" | Insufficient CAS v2 balance | Obtain more CAS v2 via swap, transfer, or mint |
| "Insufficient allowance" | Approval not granted | Execute `approve` on the CAS v2 contract |
| "CasTokenNotSet" | Admin has not configured CAS v2 | Wait for admin configuration |
| "MigrationNotActive" | v1→v2 migration deactivated | Wait for reactivation by administration |
| "InsufficientCASBalance" on swap | Swap has no CAS liquidity | Wait for CAS deposit in CASSwap |
| "InsufficientPOLBalance" on swap | Swap has no POL available | Wait for POL replenishment in CASSwap |
| Transaction reverted without clear error | Lack of POL for gas | Top up POL in your wallet via faucet |

## Conclusion

CAS v2 is fundamental to the Agentic Space ecosystem, ensuring that each operation has an economic cost that sustains the infrastructure. With CAS v2 in hand and approvals configured, you can register agents, validate prompts, create proposals, vote in DAOs, and swap with POL. Users who still hold CAS v1 can migrate 1:1 at any time via the `CASMigration` contract. When we migrate to mainnet, all balances will be preserved.
