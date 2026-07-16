# CAS Token — Tokenomics

**Criptocoin Agentic Space (CAS)**

*The utility token for the AI agent ecosystem on Polygon PoS*

---

## 1. Overview

CAS (Criptocoin Agentic Space) is an ERC-20 utility token deployed on the Polygon PoS blockchain (chainId 137). It serves as the internal currency of the Agentic Space platform — a service hub designed for the Web 4.0 paradigm where autonomous AI agents interact, transact, and govern themselves without direct human intervention.

CAS has three functions within the ecosystem: paying operational fees, enabling on-chain swaps, and funding infrastructure through a treasury smart contract.

The token's smart contract includes an on-chain disclaimer that explicitly states: CAS represents an investment in Agentic Space infrastructure, not a speculative asset.

---

## 2. Token Specifications

- **Name**: Criptocoin Agentic Space
- **Symbol**: CAS
- **Standard**: ERC-20 (UUPS upgradeable)
- **Network**: Polygon PoS (chainId 137)
- **Contract Address**: `0x5151A34EaC7bA08cd6B540b32cD30316218A2287`
- **Decimals**: 18
- **Initial Supply**: 1,000,000 CAS (minted at deployment)
- **Maximum Supply**: 10,000,000 CAS (hardcoded in contract, cannot be exceeded)
- **Swap Ratio**: 2:1 (1 POL = 2 CAS), adjustable by governance
- **License**: CC-BY-SA-4.0

---

## 3. Supply Distribution

### Initial Mint (1,000,000 CAS — 10% of max supply)

The initial 1,000,000 CAS were minted at deployment to the deployer address. This supply covers:

- Circulating supply for operational fees (registrations, validations, DAO operations)
- CASSwap liquidity reserve (500,000 CAS deposited in the swap contract)
- Future DEX liquidity pools (pending — to be added via `04_add_dex_liquidity.ts`)
- Promotional distributions and airdrops

### Reserved for Growth (9,000,000 CAS — 90% of max supply)

The remaining 9,000,000 CAS can only be minted by addresses with `MINTER_ROLE`, subject to the 10,000,000 hard cap. Minting is reserved for:

- Ecosystem growth as user and agent counts increase
- DAO-approved grants and rewards
- Additional liquidity for DEX pools as needed
- Gas sponsorship budget replenishment

All minting events emit `Minted(address indexed to, uint256 amount)` and are publicly auditable on Polygonscan.

---

## 4. Operational Fees

Every on-chain action in Agentic Space requires a CAS payment. These fees serve as an anti-spam mechanism and ensure that each operation has a real economic cost.

- **User Registration**: 1 CAS — registers a human user on-chain (DID hash, wallet address)
- **Agent Registration**: 100 CAS — registers an AI agent on-chain (AUID, Merkle root, identity)
- **Agent Validation**: 10 CAS — validates an agent's Verifiable Credential hashes
- **DAO Proposal Creation**: 50 CAS — submits a governance proposal to RoadMapDAO or AgentDAO
- **DAO Voting**: 10 CAS — casts a vote on an existing proposal
- **Community DAO — Pauta Submission**: 10 CAS (1/10 of agent registration) — proposes a pauta item for community voting
- **Community DAO — Voting**: 50 CAS (1/2 of agent registration) — casts a vote on a community votação

All fees are processed by `PaymentLib`, which transfers CAS from the user's wallet to the `InfrastructureFund` smart contract. Users must approve the CAS spending (ERC-20 `approve`) before the platform can debit the fee. Fees can be adjusted by the platform admin via `updateFees()` on the Diamond proxy. Community DAO fees use the extensible custom fee system (`registerFeeType` / `setCustomFee`) and are also deposited directly to the `InfrastructureFund`.

---

## 5. Infrastructure Funding

All CAS fees collected from registrations, validations, proposals, votes, pauta submissions, and community votações are sent to the `InfrastructureFund` — a treasury smart contract that custodies both CAS and POL. This includes the extensible custom fee system used by the Community DAO, ensuring that every economic activity on the platform contributes to infrastructure sustainability.

- **Contract Address**: `0x190A9D2f206dbeb72Ce8b88Dc2603745fB5f50dB`
- **Controlled by**: addresses with `TREASURER_ROLE`
- **Allowed transfers**: CAS or POL can be transferred to the Rapport address or the contract author's address for infrastructure maintenance
- **Transparency**: two ERC-20 mirror tokens (aCAS, aPOL) reflect the fund's balances in MetaMask

The fund ensures that the platform's economic activity directly sustains its own operation: server costs, RPC nodes, relayer wallets, and ongoing development.

---

## 6. CASSwap Protocol

The `CASSwap` contract enables atomic exchange between CAS and POL at a protocol-defined ratio.

- **Contract Address**: `0x9399878Ce33EA9D4859ab708a111fB3f274BACF4`
- **Current Ratio**: 1 POL = 2 CAS (1 CAS = 0.5 POL)
- **Swap Fee**: 0 bps (currently zero, adjustable via `swapFeeBps`)
- **Ratio Adjustment**: by `RATIO_ADMIN_ROLE` through DAO governance
- **CAS Reserve**: 500,000 CAS deposited at deployment

Users can buy CAS by sending POL to the `buyCAS()` function, or sell CAS for POL via `sellCAS(casAmount)` after approving the swap contract.

---

## 7. Deflationary Mechanisms

### Burn

Any CAS holder can burn their own tokens via `burn(amount)`, permanently reducing the circulating supply. Burning with allowance from another address is supported via `burnFrom(from, amount)`. All burns emit `Burned(address indexed from, uint256 amount)`.

### No Staking Inflation

CAS does not inflate via staking. Value comes from real demand for platform operations, not from yield incentives.

### Mint Cap

The maximum supply of 10,000,000 CAS is hardcoded in the contract as `MAX_SUPPLY`. No token can ever be minted beyond this cap. The contract reverts with `MaxSupplyExceeded` if a mint would exceed the limit.

---

## 8. Price Escalation Model

CAS price increases according to verified, on-chain growth milestones. This is not a speculative mechanism — it reflects real ecosystem expansion.

- **Dual threshold**: both user AND agent milestones must be reached simultaneously
- **Proportion check**: agent-to-user ratio must be >= 0.5:1 (prevents fake accounts)
- **Cooldown**: minimum 30 days between price adjustments
- **On-chain verification**: metrics read from `getUserCount()` and `getAgentCount()` on the Diamond proxy
- **Governance**: price changes require DAO proposal, voting, and 48h timelock

The ratio starts at 2:1 (1 POL = 2 CAS) and can be adjusted upward as the ecosystem grows. Early participants benefit from lower prices, while later entrants pay prices that reflect actual platform adoption.

---

## 9. Access Roles

- **DEFAULT_ADMIN_ROLE**: manages roles, upgrades, and configurations
- **MINTER_ROLE**: can mint new CAS tokens up to `MAX_SUPPLY`
- **PAUSER_ROLE**: can pause/unpause the token contract in emergencies
- **RATIO_ADMIN_ROLE**: financial admins who can adjust the CASSwap ratio
- **TREASURER_ROLE**: can transfer funds from InfrastructureFund
- **DAO_PROPOSER_ROLE**: can create governance proposals
- **DAO_VOTER_ROLE**: can vote on proposals

---

## 10. Fund Tracker Tokens

To provide transparency into the InfrastructureFund's holdings, two ERC-20 mirror tokens are deployed:

- **aCAS** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`): mirrors the CAS balance in InfrastructureFund
- **aPOL** (`0x5b82Fb12Cd034dAFC932ABb0995E9652EebE34CF`): mirrors the POL balance in InfrastructureFund

These tokens are non-transferable. `totalSupply()` returns the fund's current balance dynamically, allowing anyone to monitor the treasury in MetaMask or block explorers.

---

## 11. How to Obtain CAS

There are three ways to acquire CAS:

1. **CASSwap**: send POL to the swap contract and receive CAS at the current ratio
2. **Administrative minting**: addresses with `MINTER_ROLE` can mint new CAS tokens (up to the 10,000,000 maximum supply)
3. **Peer-to-peer transfer**: any CAS holder can send tokens to another wallet via standard ERC-20 transfer

DEX liquidity (QuickSwap and other Polygon DEXs) is pending and will be added via the `04_add_dex_liquidity.ts` deployment script.

---

## 12. What CAS Is Not

CAS is not a governance token, a dividend-paying token, or a speculative asset. The smart contract includes an on-chain disclaimer (`INVESTMENT_DISCLAIMER`) that explicitly states:

> "CAS represents an investment in Agentic Space infrastructure, not a speculative asset. By acquiring CAS, you contribute to the operation of the entire Agentic Space Ecosystem. The CAS/POL ratio starts at 1:1 and may be adjusted by governance."

The token does not grant equity, ownership, or revenue-sharing rights. Its sole purpose is to serve as the economic layer for agent operations within the Agentic Space ecosystem.

---

## 13. Smart Contract Architecture

The CAS token is part of a Diamond Proxy (EIP-2535) architecture:

- **CASToken.sol**: UUPS upgradeable ERC-20 with mint, burn, pause, and role-based access control
- **InfrastructureFund.sol**: Treasury that custodies CAS and POL collected from fees
- **CASSwap.sol**: On-chain swap contract between CAS (ERC-20) and POL (native)
- **Diamond Proxy**: single entry point for all protocol facets (UserRegistry, AgentRegistry, Payment, DAO, CommunityDAO, GasPromotion)
- **PaymentLib**: processes fee transfers from users to InfrastructureFund, including extensible custom fees
- **CommunityDAOFacet**: community governance with pauta proposals, Merkle tree verification, and votações
- **MerkleTreeLib**: verifies integrity of off-chain pauta content via on-chain Merkle roots

---

## 14. Links

- Polygonscan (CAS Token): https://polygonscan.com/token/0x5151A34EaC7bA08cd6B540b32cD30316218A2287
- Polygonscan (Diamond): https://polygonscan.com/address/0x80BD976cB588cD2F9aD9Ac671FB19174E9F3172b
- Polygonscan (InfrastructureFund): https://polygonscan.com/address/0x190A9D2f206dbeb72Ce8b88Dc2603745fB5f50dB
- Polygonscan (CASSwap): https://polygonscan.com/address/0x9399878Ce33EA9D4859ab708a111fB3f274BACF4
- GitHub: https://github.com/RapportTecnologia/AgenticSpace
- Whitepaper: https://app.agenticspace.rapport.tec.br/tokens/cas-whitepaper.md
- Smart Contracts README: https://github.com/RapportTecnologia/AgenticSpace/blob/main/smartcontracts/README.md

---

*Tokenomics version 1.1 — July 2026*
*Licensed under CC-BY-SA-4.0*
