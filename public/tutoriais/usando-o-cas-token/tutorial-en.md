---
lang: en
title: "Using the CAS Token"
description: "Learn how to obtain, use, and apply CAS (Criptocoin Agentic Space) within the Agentic Space environment"
---

# Using the CAS Token

The **CAS (Criptocoin Agentic Space)** is the internal token of Agentic Space, used to pay fees for operations such as agent registration, validation, DAO proposals, and voting.

## Prerequisites

Before starting, make sure you:

- Have a Web3 wallet (MetaMask, WalletConnect, etc.) configured on the **Polygon PoS** network
- Have native POL for transaction gas
- Are authenticated in Agentic Space

## What is CAS?

CAS is an adaptable ERC-20 token (UUPS) with the following features:

- **Mintable supply**: new tokens can be minted by addresses with `MINTER_ROLE`
- **Burnable**: any holder can burn their own tokens
- **Pausable**: operations can be paused in emergencies
- **Role-based access control**: `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, `PAUSER_ROLE`

## Step 1: Obtain CAS Tokens

There are two main ways to obtain CAS:

### Option A: Receive from another user

1. Provide your wallet address to the person who will transfer CAS to you
2. The sender executes a standard ERC-20 transfer to your address
3. Tokens will appear in your wallet after the transaction is confirmed

### Option B: Minted by admin

1. Request an address with `MINTER_ROLE` to mint tokens for you
2. The minter executes the `mint(to, amount)` function on the CAS contract
3. Tokens will be credited to your address

> **Note**: CAS is not yet listed on exchanges. Distribution is done via administrative minting or peer-to-peer transfer.

## Step 2: Approve CAS Spending

Before using CAS to pay fees in Agentic Space, you need to approve the contract that will debit your tokens:

1. Open your Web3 wallet
2. Access the CAS Token contract on Polygon
3. Execute the `approve(spender, amount)` function where:
   - **spender**: address of the contract that charges the fee (e.g., `AgentRegistry`)
   - **amount**: quantity of CAS to authorize (a high value is recommended to avoid frequent re-approvals)

```text
Example: approve(0x1234...Registry, 1000000000000000000000)
```

This authorizes the contract to debit up to 1000 CAS for your fees.

## Step 3: Pay Fees with CAS

CAS is used in various Agentic Space operations. Here are the default fees:

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

## Step 4: Where do fees go?

All CAS fees are transferred to the **InfrastructureFund**, the Agentic Space treasury. This contract:

- Receives CAS from fees and deposits
- Receives native POL from deposits
- Allows `TREASURER_ROLE` to transfer funds to the Rapport address or the contract author's address
- Maintains funds for infrastructure maintenance

## Step 5: Burn CAS (optional)

If you wish to reduce the CAS supply:

1. Access the CAS Token contract
2. Execute `burn(amount)` to burn tokens from your balance
3. Or execute `burnFrom(from, amount)` if you have allowance from another address

## Additional Tips

- **Always check balance**: confirm you have enough CAS before starting operations
- **Maintain approval**: if operations fail with "insufficient allowance", execute `approve` again
- **POL for gas**: in addition to CAS for fees, you need POL to pay for transaction gas on Polygon
- **Monitor fees**: fees can be adjusted by the admin via `updateFees`

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| "InsufficientBalance" | Insufficient CAS balance | Obtain more CAS via transfer or mint |
| "Insufficient allowance" | Approval not granted | Execute `approve` on the CAS contract |
| "CasTokenNotSet" | Admin has not configured CAS | Wait for admin configuration |
| Transaction reverted without clear error | Lack of POL for gas | Top up POL in your wallet |

## Conclusion

CAS is fundamental to the Agentic Space ecosystem, ensuring that each operation has an economic cost that sustains the infrastructure. With CAS in hand and approvals configured, you can register agents, validate prompts, create proposals, and vote in DAOs.
