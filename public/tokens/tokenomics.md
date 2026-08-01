# CAS Token — Tokenomics v2.2

**Cryptocoin Agentic Space (CAS)**

*The utility token for the AI agent ecosystem on Polygon PoS*

---

## 1. Overview

CAS (Cryptocoin Agentic Space) is an ERC-20 utility token deployed on the Polygon PoS blockchain (chainId 137). It serves as the internal currency of the Agentic Space platform — a service hub designed for the Web 4.0 paradigm where autonomous AI agents interact, transact, and govern themselves without direct human intervention.

CAS has three functions within the ecosystem: paying operational fees, enabling on-chain swaps, and funding infrastructure through a treasury smart contract.

The token's smart contract includes an on-chain disclaimer that explicitly states: CAS represents an investment in Agentic Space infrastructure, not a speculative asset.

---

## 2. Token Specifications

- **Name**: Cryptocoin Agentic Space
- **Symbol**: CAS
- **Standard**: ERC-20 (UUPS upgradeable)
- **Network**: Polygon PoS (chainId 137)
- **Contract Address**: `0x5151A34EaC7bA08cd6B540b32cD30316218A2287`
- **Decimals**: 18
- **Initial Supply**: 1,000,000 CAS (minted at deployment)
- **Maximum Supply**: 10,000,000 CAS (hardcoded in contract, cannot be exceeded)
- **Swap Ratio**: Dynamic — read on-chain from CASSwap `getRatio()`, adjustable by governance
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
- **Arbitration Case Filing**: 0.5 CAS — files a fraud arbitration case
- **Arbitration Vote**: 0.5 CAS — casts a vote on an arbitration case

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
- **Current Ratio**: Dynamic — read on-chain via `getRatio()` (not hardcoded)
- **Swap Fee**: Dynamic — read on-chain via `swapFeeBps()` (expressed in basis points)
- **Ratio Adjustment**: by `RATIO_ADMIN_ROLE` through DAO governance
- **CAS Reserve**: 500,000 CAS deposited at deployment

Users can buy CAS by sending POL to the `buyCAS()` function, or sell CAS for POL via `sellCAS(casAmount)` after approving the swap contract.

---

## 7. Certificate NFTs (ERC-6551 TBA)

Members of Agentic Space can receive collectible certificates as NFTs (ERC-721) with Token Bound Accounts (ERC-6551 TBA). Each certificate is a smart contract account that can custody CAS tokens and other digital assets.

### Phases

- **Phase 1 — Sócio Fundador**: Founding members certificate (current phase)
- **Phase 2 — Apoiador Nível 1**: First supporter level (upcoming)
- **Future phases**: Additional supporter and contributor levels

### How It Works

1. The backend prepares an EIP-712 typed structured data authorization for the member
2. The member approves the CAS token spending for the deposit amount
3. The member calls `mintCertificate()` on the `RapportCertificate` contract with the authorization and signature
4. The contract creates an ERC-6551 Token Bound Account for the NFT
5. The CAS deposit is transferred to the TBA, which the NFT owns
6. The member can verify their certificate on-chain at any time

### Marketing Strategy

The certificate collection strategy promotes CAS by requiring a CAS deposit per certificate. As members collect new certificates across phases, CAS tokens are locked in TBAs, generating value and token movement. Each TBA can aggregate new assets over time, creating a growing on-chain portfolio tied to the member's NFT.

---

## 8. Deflationary Mechanisms

### Burn

Any CAS holder can burn their own tokens via `burn(amount)`, permanently reducing the circulating supply. Burning with allowance from another address is supported via `burnFrom(from, amount)`. All burns emit `Burned(address indexed from, uint256 amount)`.

### No Staking Inflation

CAS does not inflate via staking. Value comes from real demand for platform operations, not from yield incentives.

### Mint Cap

The maximum supply of 10,000,000 CAS is hardcoded in the contract as `MAX_SUPPLY`. No token can ever be minted beyond this cap. The contract reverts with `MaxSupplyExceeded` if a mint would exceed the limit.

---

## 9. Fraud Arbitration System

The CAS Token includes an on-chain arbitration system for resolving fraud disputes. Compliance officers file cases against suspected fraudulent addresses, and DAO members vote to determine outcomes.

### Three Voting Periods

Each arbitration case progresses through three distinct periods with specific rules for CAS token operations:

| Period | Duration | CAS Transfers | Voting | Description |
|--------|----------|---------------|--------|-------------|
| **Divulgação** (Disclosure) | 2 days (configurable, 1–7 days) | ✅ Allowed (except suspects) | ❌ Not yet | Evidence is presented; community reviews accusations; suspected addresses may be preventively frozen |
| **Votação** (Voting) | 5 days (configurable, 1–14 days) | 🔒 **Blocked globally** (except COMPLIANCE_ROLE) | ✅ Active | DAO members vote; CAS transfers locked to prevent vote buying; voting fees allowed |
| **Resultado** (Result) | Until execution | ✅ Resumed | ❌ Closed | Decision applied: guilty addresses frozen, innocent unfrozen |
| **Contestação** (Challenge) | 3 days (configurable) | ✅ Allowed | ❌ Closed | Contestation period before definitive execution |

### Weighted Voting Power

The arbitration system uses **weighted voting power** combining multiple criteria instead of token balance alone:

| Criterion | Default Weight | Description |
|-----------|---------------|-------------|
| **Token balance** | 40% | Based on CAS holdings (logarithmic scale) |
| **Staking duration** | 30% | Time tokens held without movement (up to 30 days) |
| **Reputation** | 30% | Reputation score (0–10000), based on role and participation |

- **Quadratic voting**: `sqrt(raw_power)` reduces large-holder impact (toggleable)
- **Power cap**: 1000 units max per wallet (configurable)
- **Vote delegation**: Users can delegate voting power (`delegateVote`)
- **Minimum quorum**: 20% of total power must be exercised

### Challenge Period & Technical Council

- After voting result, a 3-day challenge period allows contesting the outcome
- The **Technical Council** (designated via `setTechnicalCouncilMember`) resolves challenges
- If upheld: original result executes; if overturned: new voting round triggered
- Uncontested cases finalize automatically (`finalizeCase`)

### Appeal Mechanism

- After execution, registered users can file appeals (`fileAppeal`)
- Appeals reopen the case for a new voting round
- Maximum 2 appeals (configurable); after that, results are final

### Vote Buying Prevention

During the Votação period, a global voting lock is activated on the CAS token contract (`setVotingLock(true)`). This blocks token transfers — no user can send, receive, or swap CAS, **except transfers to addresses with `COMPLIANCE_ROLE`**, ensuring voting fee payments can be processed. The lock is automatically deactivated when no active cases remain in the Voting period.

### Case Outcomes

- **Approved (guilty)**: Accused addresses are frozen (permanently, temporarily, or for a limited time)
- **Rejected (innocent)**: Any preventive freezes on accused addresses are lifted
- **Inconclusive (no majority)**: If neither option achieves >50% of valid votes, the case returns to Disclosure for a new voting round (up to 3 revotes, configurable)
- **Expired (no quorum)**: Accused addresses receive a 6-month freeze; case can be refiled (up to 3 retries)

### Majority Rule & Registered Voters

- **Strict majority**: A definitive result requires one option (for or against) to receive **more than 50% of valid votes** (excluding abstentions). If no majority is reached, the case automatically re-enters the Disclosure period for a new voting round.
- **No anonymous votes**: Only registered users with `USER_ROLE` or `AGENT_ROLE` can cast votes. Unregistered addresses receive a `VoterNotRegistered` error.
- **Revote mechanism**: Each revote resets vote counts and deadlines. The `hasVotedRound` mapping tracks which revote round each voter participated in, allowing all eligible voters to vote again. Maximum revotes are configurable via `setMaxRevotes` (default: 3).

---

## 10. Price Escalation Model

CAS price increases according to verified, on-chain growth milestones. This is not a speculative mechanism — it reflects real ecosystem expansion.

- **Dual threshold**: both user AND agent milestones must be reached simultaneously
- **Proportion check**: agent-to-user ratio must be >= 0.5:1 (prevents fake accounts)
- **Cooldown**: minimum 30 days between price adjustments
- **On-chain verification**: metrics read from `getUserCount()` and `getAgentCount()` on the Diamond proxy
- **Governance**: price changes require DAO proposal, voting, and 48h timelock

The ratio starts at 2:1 (1 POL = 2 CAS) and can be adjusted upward as the ecosystem grows. Early participants benefit from lower prices, while later entrants pay prices that reflect actual platform adoption.

---

## 11. Market Manipulation Prevention Rules

CAS was founded on **July 14, 2026** as a utility token for the Agentic Space ecosystem — not as a speculative or trading asset. The following technical, contractual, and governance rules are designed to prevent market manipulation and protect the community.

### 11.1 Prohibited Practices

The following practices are explicitly prohibited within the CAS ecosystem and may result in preventive suspension, balance freezing, or arbitration proceedings:

| Practice | Description | Detection Method |
|----------|-------------|------------------|
| **Pump and dump** | Coordinated buying to inflate price followed by mass selling | On-chain volume analysis, wallet clustering, timed transaction patterns |
| **Short and distorce** | Deliberate sell operations followed by repurchases at artificially reduced levels to distort price formation | Sequential sell-rebuy pattern detection, price impact correlation, wallet relationship mapping |
| **Sybil attacks** | Using multiple wallets to simulate independent users, influence decisions, or manipulate ecosystem movements | Wallet clustering via gas patterns, transaction timing, funding source analysis |
| **Coordinated operations** | Groups acting in concert to manipulate price or governance outcomes | On-chain relationship graph analysis, synchronized transaction detection |
| **Deliberate price suppression** | Artificially maintaining CAS price at reduced levels through repetitive sell pressure | Sustained sell pattern analysis, impact-vs-volume ratio monitoring |
| **Atypical large-volume movements** | Movements disproportionate to ecosystem activity that may indicate market manipulation | Volume anomaly detection relative to registered user/agent counts |

### 11.2 Technical Measures

The smart contract architecture includes the following on-chain protections:

- **Pausable contracts**: `PAUSER_ROLE` can temporarily pause token transfers during incident analysis (`pause()` / `unpause()`)
- **Address freezing**: `COMPLIANCE_ROLE` can freeze suspected addresses preventively (`freezeAddress()`), restricting all token operations without prior DAO vote in urgent situations
- **Voting lock**: During arbitration voting periods, a global transfer lock prevents token repositioning (`setVotingLock(true)`)
- **Automated on-chain analysis**: Tools identify wallet relationships, movement patterns, and recurrences across the ecosystem
- **Rate limiting**: Registration rate caps prevent Sybil-style account creation at the protocol level
- **Agent-to-user ratio enforcement**: Price adjustments are suspended if the ratio falls below 0.5:1, preventing inflation of user counts

### 11.3 Contractual Measures

The CAS token contract and Diamond Proxy enforce the following contractual protections:

- **Preventive suspension**: Wallets involved in prohibited practices may be suspended preventively, without prior DAO vote, when the situation is considered urgent for ecosystem protection
- **Balance blocking**: Depending on severity, recurrence, and available smart contract features, balances may remain locked while a case is analyzed
- **Graduated enforcement**: From temporary freeze (during investigation) to permanent freeze (after arbitration approval) — proportional to the severity of the violation
- **No automatic unfreezing**: Frozen addresses require explicit governance or compliance action to restore functionality

### 11.4 Governance Measures

The DAO and governance system provide the following oversight mechanisms:

- **Arbitration system**: Fraud cases can be filed by compliance officers and resolved through DAO voting with weighted power (see Section 9)
- **Escalation path**: If practices continue or involve deliberate market manipulation, the case may be escalated to formal arbitration
- **External reporting**: In cases of proven recurrence, confirmed wallet connections, or continued manipulation, Rapport Tecnologia e Inovação may register and formally communicate the facts to blockchain explorers, Polygon security platforms, and competent authorities
- **Investment matching model**: Planned investment of up to R$ 20,000.00 by December 2026 will not be fully directed to liquidity without holder participation — a 1:1 matching model ensures community commitment (for each amount contributed by holders, the investor contributes the same, up to the total limit)
- **LGPD compliance**: No participant is publicly exposed; all information is handled in accordance with the LGPD and applicable regulations

---

## 12. Access Roles

- **DEFAULT_ADMIN_ROLE**: manages roles, upgrades, and configurations
- **MINTER_ROLE**: can mint new CAS tokens up to `MAX_SUPPLY`
- **PAUSER_ROLE**: can pause/unpause the token contract in emergencies
- **RATIO_ADMIN_ROLE**: financial admins who can adjust the CASSwap ratio
- **TREASURER_ROLE**: can transfer funds from InfrastructureFund
- **DAO_PROPOSER_ROLE**: can create governance proposals
- **DAO_VOTER_ROLE**: can vote on proposals
- **COMPLIANCE_ROLE**: can freeze/unfreeze addresses and activate voting lock

---

## 13. Fund Tracker Tokens

To provide transparency into the InfrastructureFund's holdings, two ERC-20 mirror tokens are deployed:

- **aCAS** (`0xdF5Df5Eb32fa1a53749c66364B877C39b7031377`): mirrors the CAS balance in InfrastructureFund
- **aPOL** (`0x5b82Fb12Cd034dAFC932ABb0995E9652EebE34CF`): mirrors the POL balance in InfrastructureFund

These tokens are non-transferable. `totalSupply()` returns the fund's current balance dynamically, allowing anyone to monitor the treasury in MetaMask or block explorers.

---

## 14. How to Obtain CAS

There are three ways to acquire CAS:

1. **CASSwap**: send POL to the swap contract and receive CAS at the current ratio
2. **Administrative minting**: addresses with `MINTER_ROLE` can mint new CAS tokens (up to the 10,000,000 maximum supply)
3. **Peer-to-peer transfer**: any CAS holder can send tokens to another wallet via standard ERC-20 transfer

DEX liquidity (QuickSwap and other Polygon DEXs) is pending and will be added via the `04_add_dex_liquidity.ts` deployment script.

---

## 15. What CAS Is Not

CAS is not a governance token, a dividend-paying token, or a speculative asset. The smart contract includes an on-chain disclaimer (`INVESTMENT_DISCLAIMER`) that explicitly states:

> "CAS represents an investment in Agentic Space infrastructure, not a speculative asset. By acquiring CAS, you contribute to the operation of the entire Agentic Space Ecosystem. The CAS/POL ratio starts at 1:1 and may be adjusted by governance."

The token does not grant equity, ownership, or revenue-sharing rights. Its sole purpose is to serve as the economic layer for agent operations within the Agentic Space ecosystem.

---

## 16. Smart Contract Architecture

The CAS token is part of a Diamond Proxy (EIP-2535) architecture:

- **CASToken.sol**: UUPS upgradeable ERC-20 with mint, burn, pause, and role-based access control
- **InfrastructureFund.sol**: Treasury that custodies CAS and POL collected from fees
- **CASSwap.sol**: On-chain swap contract between CAS (ERC-20) and POL (native)
- **Diamond Proxy**: single entry point for all protocol facets (UserRegistry, AgentRegistry, Payment, DAO, CommunityDAO, GasPromotion)
- **PaymentLib**: processes fee transfers from users to InfrastructureFund, including extensible custom fees
- **CommunityDAOFacet**: community governance with pauta proposals, Merkle tree verification, and votações
- **ArbitrationFacet**: fraud dispute resolution with 3 voting periods (Disclosure, Voting, Result) and global voting lock
- **MerkleTreeLib**: verifies integrity of off-chain pauta content via on-chain Merkle roots

---

## 17. Links

- Polygonscan (CAS Token): https://polygonscan.com/token/0x5151A34EaC7bA08cd6B540b32cD30316218A2287
- Polygonscan (Diamond): https://polygonscan.com/address/0x80BD976cB588cD2F9aD9Ac671FB19174E9F3172b
- Polygonscan (InfrastructureFund): https://polygonscan.com/address/0x190A9D2f206dbeb72Ce8b88Dc2603745fB5f50dB
- Polygonscan (CASSwap): https://polygonscan.com/address/0x9399878Ce33EA9D4859ab708a111fB3f274BACF4
- GitHub: https://github.com/RapportTecnologia/AgenticSpace
- Whitepaper: https://app.agenticspace.rapport.tec.br/tokens/cas-whitepaper.md
- Smart Contracts README: https://github.com/RapportTecnologia/AgenticSpace/blob/main/smartcontracts/README.md

---

*Tokenomics version 2.3.0 — July 2026*
*Licensed under CC-BY-SA-4.0*
