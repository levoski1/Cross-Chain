# Cross-Chain Drips Splitter

> **Post-Wave payout distribution and ecosystem "Pay-it-Forward" protocol**

[![CI Pipeline](https://github.com/drips-protocol/cross-chain-splitter/actions/workflows/ci.yml/badge.svg)](https://github.com/drips-protocol/cross-chain-splitter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.24-blue)](https://soliditylang.org)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-FFE04B)](https://hardhat.org)
[![Coverage](https://img.shields.io/codecov/c/github/drips-protocol/cross-chain-splitter)](https://codecov.io/gh/drips-protocol/cross-chain-splitter)

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Vision & Goals](#vision--goals)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Smart Contracts](#smart-contracts)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Security](#security)
- [CI/CD](#cicd)
- [Docker](#docker)
- [Monitoring & Logging](#monitoring--logging)
- [Scalability](#scalability)
- [Formal Verification](#formal-verification)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [FAQ](#faq)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

The **Cross-Chain Drips Splitter** extends the Drips Protocol by allowing contributors to configure how their Wave rewards are distributed. Instead of receiving 100% of payouts to a single wallet, developers can automatically split earnings across multiple destinations — their wallet, a long-term savings vault, and a project treasury.

The system is built across four phases, each a deployable smart contract that composes into a complete payout ecosystem:

| Phase | Contract | Purpose |
|-------|----------|---------|
| 1 | **WaveEscrow** | Holds funds during a Wave period, handles claims |
| 2 | **WaveReputation** | Tracks contributor identity, points, and badges |
| 3 | **WaveScoping** | Community governance for issue selection |
| 4 | **RewardSplitter** | Configurable payout splitting logic |

### Example Split Configuration

```
Contributor earns 10 ETH from a Wave:

  ├─ 7.0 ETH  → Contributor wallet    (70%)
  ├─ 2.0 ETH  → Savings Vault         (20%)
  └─ 1.0 ETH  → Project Treasury      (10%)
```

---

## Problem Statement

In open-source and decentralized development ecosystems, contributors face several structural problems:

1. **No earning flexibility** — Payouts arrive as a single lump sum with no pre-configured allocation.
2. **No forced savings** — Contributors must manually manage long-term savings, which is often deprioritized.
3. **Unsustainable treasury** — Projects struggle to fund ongoing operations because contributors have no mechanism to auto-donate back.
4. **No reputation portability** — Contribution history is siloed and not recorded on-chain in a structured way.
5. **Centralized issue selection** — Community input is not captured on-chain for transparent prioritization.

The Cross-Chain Drips Splitter solves these by providing on-chain infrastructure for programmable payout distribution.

---

## Vision & Goals

### Vision
Create a self-sustaining circular economy where contributor rewards automatically feed back into the ecosystem, enabling "Pay-it-Forward" at the protocol level.

### Goals
- **Financial Sovereignty** — Contributors control their split configuration
- **Ecosystem Sustainability** — Automatic treasury funding without manual donations
- **Transparent Governance** — On-chain voting for issue prioritization
- **Reputation Portability** — Verifiable on-chain contributor history
- **Cross-Chain Ready** — Architecture supports multi-chain deployment from day one

---

## Architecture

### System Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │      Wave Contract           │
                    │     (External Caller)        │
                    └─────────────┬───────────────┘
                                  │
                                  │ msg.value + contributor
                                  ▼
                    ┌─────────────────────────────┐
                    │      RewardSplitter          │
                    │                              │
                    │  ┌──────────────────────┐   │
                    │  │  SplitConfig          │   │
                    │  │  - savingsVault       │   │
                    │  │  - treasury           │   │
                    │  │  - treasuryShare      │   │
                    │  └──────────────────────┘   │
                    └──────┬──────────┬───────────┘
                           │          │
               ┌───────────┤          ├───────────┐
               ▼           ▼          ▼           ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │Contributor│ │  Savings │ │ Treasury │ │  Event   │
        │  Wallet  │ │  Vault   │ │  Wallet  │ │  Logs    │
        └──────────┘ └──────────┘ └──────────┘ └──────────┘

    ┌──────────────────────────────────────────────────────┐
    │                    Supporting Contracts               │
    │  ┌──────────────┐  ┌───────────────┐  ┌───────────┐ │
    │  │  WaveEscrow   │  │ WaveReputation │  │ WaveScope │ │
    │  │  (Escrow)     │  │ (Identity)     │  │ (Gov)     │ │
    │  └──────────────┘  └───────────────┘  └───────────┘ │
    └──────────────────────────────────────────────────────┘
```

### Data Flow

1. **Contributor** calls `configureSplit()` on `RewardSplitter` to set their preferences
2. **Wave Contract** calls `splitPayout(contributor)` with `msg.value`
3. **RewardSplitter** loads the config and computes: `treasuryShare`, `savingsShare`, `contributorShare`
4. **RewardSplitter** executes three ETH transfers via low-level `call`
5. **Events** are emitted for off-chain indexing

### Contract Interaction Matrix

| Calling Contract | RewardSplitter | WaveEscrow | WaveReputation | WaveScoping |
|-----------------|---------------|------------|----------------|-------------|
| RewardSplitter  | —             | —          | —              | —           |
| WaveEscrow      | —             | —          | —              | —           |
| WaveReputation  | —             | —          | —              | —           |
| WaveScoping     | —             | —          | —              | —           |
| External (dApp) | configureSplit, splitPayout | deposit, claimPayout | verifyContributor, awardPoints | proposeIssue, voteOnIssue |

> **Note:** Contracts are designed to be independent composable modules. They do not call each other directly but are expected to be coordinated by off-chain infrastructure or a unified Wave contract. This keeps each contract's surface area small and auditable.

---

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Smart Contract Language** | Solidity | ^0.8.24 |
| **Development Framework** | Hardhat | ^2.20.1 |
| **Contract Libraries** | OpenZeppelin Contracts | ^5.0.2 |
| **Runtime Environment** | Node.js | >=18.0.0 |
| **Testing** | Mocha + Chai + Hardhat Chai Matchers | Latest |
| **Type Safety** | TypeScript + TypeChain | ^5.3.3 + ethers-v6 |
| **Static Analysis** | Slither | Latest |
| **Linting** | Solhint + ESLint + Prettier | Latest |
| **Gas Reporting** | hardhat-gas-reporter | Latest |
| **Coverage** | solidity-coverage | Latest |
| **Containerization** | Docker + Docker Compose | Latest |
| **CI/CD** | GitHub Actions | Latest |

---

## Smart Contracts

### WaveEscrow

The escrow vault that holds funds during a Wave's active period.

**Key Features:**
- Owner can create Waves with configurable deadlines
- Anyone can deposit ETH into an active Wave
- Owner finalizes Waves after deadline passes
- Contributors can claim their share post-finalization
- Emergency withdraw mechanism for owner (safety valve)

**Functions:**
- `createWave(uint256 deadline)` — Owner creates a new wave
- `deposit(uint256 waveId)` — Payable; adds ETH to wave pool
- `finalizeWave(uint256 waveId)` — Owner finalizes after deadline
- `claimPayout(uint256 waveId, address contributor)` — Claim distribution
- `emergencyWithdraw(uint256 waveId, address to)` — Owner safety withdrawal

### WaveReputation

On-chain identity and reputation tracking for contributors.

**Key Features:**
- Verified contributor identities (identityHash)
- Points-based reputation system
- Badge issuance with expiry
- Contribution count tracking
- Admin-only verification (prevents Sybil attacks)

**Functions:**
- `verifyContributor(address, bytes32)` — Register a contributor
- `awardPoints(address, uint256, string)` — Award reputation points
- `issueBadge(address, bytes32, uint256)` — Issue time-bound badge
- `getContributorProfile(address)` — View full profile

### WaveScoping

Community governance for selecting issues to fund.

**Key Features:**
- Permissionless issue proposals
- Weighted voting (approval/rejection)
- Owner selects approved issues for funding
- Minimum description length validation
- Vote uniqueness enforcement

**Functions:**
- `proposeIssue(string, uint256)` — Propose a new issue
- `voteOnIssue(uint256, bool, uint256)` — Cast weighted vote
- `selectIssueForWave(uint256, uint256)` — Owner selects issue
- `getIssue(uint256)` — View issue details

### RewardSplitter

The core payout splitting engine.

**Key Features:**
- Per-contributor split configurations (both treasury and savings shares)
- Configurable treasury share (0-25% max) and savings share (0-90% max)
- Automatic three-way split on payout (treasury, savings, contributor)
- Ownable2Step ownership for secure multisig transfer
- Pausable for emergency stop via OpenZeppelin Ownable2Step
- Events for all payout and ownership operations

**Constants:**
- `MAX_BASIS_POINTS = 10000` (100%)
- `MAX_TREASURY_SHARE = 2500` (25%)
- `MAX_SAVINGS_SHARE = 9000` (90%)

**Split Algorithm:**
```
forTreasury     = msg.value * treasuryShare / 10000
forSavings      = msg.value * savingsShare / 10000
forContributor  = msg.value - forTreasury - forSavings
```

**Example (70/20/10 split):**
```
treasuryShare = 1000    (10%)
savingsShare  = 2000    (20%)
contributorShare = 7000 (70%)  (implicit: 10000 - 1000 - 2000)
```

**Functions:**
- `configureSplit(address, address, uint256, uint256)` — Set up split config (both shares)
- `splitPayout(address)` — Execute payout split (payable)
- `pauseSplitter()` / `unpauseSplitter()` — Emergency controls (Owner)
- `transferOwnership(address)` / `acceptOwnership()` — Ownable2Step secure transfer
- `getSplitConfig(address)` — View config

---

## Project Structure

```
Cross-Chain/
├── contracts/
│   ├── interfaces/
│   │   ├── IWaveEscrow.sol              # Escrow interface
│   │   ├── IWaveReputation.sol          # Reputation interface
│   │   ├── IWaveScoping.sol             # Governance interface
│   │   └── IRewardSplitter.sol          # Splitter interface
│   ├── vault/
│   │   └── WaveEscrow.sol               # Phase 1: Escrow vault
│   ├── identity/
│   │   └── WaveReputation.sol           # Phase 2: Identity/Reputation
│   ├── governance/
│   │   └── WaveScoping.sol              # Phase 3: Issue governance
│   ├── split/
│   │   └── RewardSplitter.sol           # Phase 4: Payout splitter
│   ├── libraries/
│   │   ├── Errors.sol                   # Custom error definitions
│   │   └── MathLib.sol                  # Math utilities (extensible)
│   └── mocks/
│       ├── MockWave.sol                 # Test double for Wave contract
│       └── MockERC20.sol                # Test ERC20 token
│
├── scripts/
│   ├── deploy/
│   │   ├── deploy-all.ts                # Deploy all contracts
│   │   ├── deploy-escrow.ts             # Deploy WaveEscrow
│   │   ├── deploy-reputation.ts         # Deploy WaveReputation
│   │   ├── deploy-scoping.ts            # Deploy WaveScoping
│   │   └── deploy-splitter.ts           # Deploy RewardSplitter
│   ├── interactions/
│   │   ├── configure-split.ts           # CLI helper for split config
│   │   └── escrow-actions.ts            # CLI helper for escrow ops
│   └── utils/
│       ├── logger.ts                    # Structured logging utility
│       └── verify.ts                    # Contract verification helper
│
├── test/
│   ├── unit/
│   │   ├── WaveEscrow.test.ts           # Escrow unit tests
│   │   ├── WaveReputation.test.ts       # Reputation unit tests
│   │   ├── WaveScoping.test.ts          # Governance unit tests
│   │   └── RewardSplitter.test.ts       # Splitter unit tests
│   ├── integration/
│   │   └── full-flow.test.ts            # End-to-end integration test
│   ├── fuzzing/
│   │   └── RewardSplitter.fuzz.ts       # Property-based tests
│   └── helpers/
│       ├── fixtures.ts                  # Contract deployment fixtures
│       └── time.ts                      # Time manipulation helpers
│
├── tasks/
│   ├── splitter-tasks.ts                # Hardhat tasks for RewardSplitter
│   └── escrow-tasks.ts                  # Hardhat tasks for WaveEscrow
│
├── deployments/
│   └── deploy.json.example              # Deployment address registry template
│
├── subgraph/
│   ├── schema.graphql                   # The Graph schema
│   ├── subgraph.yaml                    # Subgraph manifest
│   └── src/mapping.ts                   # Event handler mappings
│
├── certora/
│   ├── RewardSplitter.spec              # Formal verification rules
│   └── conf/RewardSplitter.conf         # Certora prover config
│
├── .github/workflows/
│   ├── ci.yml                           # CI pipeline (lint, test, analyze)
│   └── deploy.yml                       # Deployment workflow
│
├── docs/
│   ├── ARCHITECTURE.md                  # Detailed architecture docs
│   ├── DEPLOYMENT.md                    # Deployment guide
│   ├── SECURITY.md                      # Security model & audit info
│   ├── ACCESS_CONTROL.md                # Role-based access matrix
│   └── AUDIT_CHECKLIST.md              # Pre-audit verification checklist
│
├── hardhat.config.ts                    # Hardhat configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json                         # Project dependencies & scripts
├── .env.example                         # Environment variable template
├── .gitignore                           # Git ignore rules
├── .solhint.json                        # Solidity linter config
├── .solcover.js                         # Coverage tool config
├── .prettierrc                          # Code formatter config
├── slither.config.json                  # Static analysis config
├── commitlint.config.js                 # Commit message conventions
├── Dockerfile                           # Container definition
└── docker-compose.yml                   # Local dev environment
```

### Directory Key

| Path | Purpose |
|------|---------|
| `contracts/interfaces/` | Solidity interface definitions for all contracts |
| `contracts/vault/` | Phase 1 escrow logic |
| `contracts/identity/` | Phase 2 reputation logic |
| `contracts/governance/` | Phase 3 scoping/governance logic |
| `contracts/split/` | Phase 4 payout splitting logic |
| `contracts/libraries/` | Shared libraries and error definitions |
| `contracts/mocks/` | Test doubles for isolated testing |
| `scripts/deploy/` | Deployment scripts per contract |
| `scripts/interactions/` | CLI interaction scripts |
| `scripts/utils/` | Shared utilities (logging, verification, env validation) |
| `test/unit/` | Per-contract unit tests |
| `test/integration/` | Cross-contract integration tests |
| `test/fuzzing/` | Property-based fuzz tests |
| `test/helpers/` | Test fixtures and utilities |
| `tasks/` | Hardhat task definitions (registered from hardhat.config.ts) |
| `deployments/` | Deployment address registry per network |
| `subgraph/` | The Graph indexing schema, manifest, and mappings |
| `certora/` | Formal verification specs and prover config |
| `.github/workflows/` | CI/CD pipeline definitions |
| `docs/` | Supplemental documentation |

---

## Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- **Docker** (optional, for containerized development)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/drips-protocol/cross-chain-splitter.git
cd cross-chain-splitter

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Compile contracts
npm run build
```

### Configure Environment

Edit `.env` with your configuration:

```bash
# Required for testnet deployment
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY_DEPLOYER=your_private_key_here

# Required for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ETHEREUM_RPC_URL` | For mainnet | — | Ethereum Mainnet RPC endpoint |
| `SEPOLIA_RPC_URL` | For Sepolia | — | Sepolia testnet RPC endpoint |
| `POLYGON_RPC_URL` | For Polygon | — | Polygon mainnet RPC endpoint |
| `AMOY_RPC_URL` | For Amoy | — | Polygon Amoy testnet RPC endpoint |
| `ARBITRUM_RPC_URL` | For Arbitrum | — | Arbitrum One RPC endpoint |
| `ARBITRUM_SEPOLIA_RPC_URL` | For Sepolia | — | Arbitrum Sepolia RPC endpoint |
| `PRIVATE_KEY_DEPLOYER` | For deployments | — | Deployer wallet private key |
| `PRIVATE_KEY_TEST` | For localhost | Hardhat #0 | Test wallet private key |
| `ETHERSCAN_API_KEY` | For verification | — | Etherscan API key |
| `ARBISCAN_API_KEY` | For Arbitrum | — | Arbiscan API key |
| `POLYGONSCAN_API_KEY` | For Polygon | — | Polygonscan API key |
| `COINMARKETCAP_API_KEY` | For gas reports | — | CoinMarketCap API key |
| `REPORT_GAS` | Optional | `false` | Enable gas reporting |
| `DEPLOY_NETWORK` | For deployments | `sepolia` | Target deployment network |
| `DEPLOY_VERIFY` | Optional | `true` | Auto-verify after deploy |

---

## Development Workflow

### Available Scripts

```bash
npm run build           # Compile all Solidity contracts
npm run build:force     # Force recompile (clears cache)
npm run clean           # Remove build artifacts

# Testing
npm run test            # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage   # Run with coverage report
npm run test:gas        # Run with gas reporter

# Linting & Formatting
npm run lint            # Run all linters
npm run lint:sol        # Lint Solidity files
npm run lint:ts         # Lint TypeScript files
npm run format          # Auto-format all files
npm run format:check    # Check formatting (CI)

# Static Analysis
npm run slither         # Run Slither security analysis

# Deployment
npm run deploy:all -- <network>        # Deploy all contracts
npm run deploy:escrow -- <network>     # Deploy WaveEscrow
npm run deploy:splitter -- <network>   # Deploy RewardSplitter
npm run verify -- <network>            # Verify contracts on explorer

# Type Generation
npm run generate:types  # Generate TypeChain type bindings

# Hardhat Tasks (interactive CLI commands)
npm run task:configure-split -- --splitter ADDR --savings ADDR --treasury ADDR --treasury-share 1000 --savings-share 2000
npm run task:split-payout -- --splitter ADDR --contributor ADDR --amount 10
npm run task:create-wave -- --escrow ADDR --deadline TIMESTAMP
npm run task:view-config -- --splitter ADDR --contributor ADDR

# Environment Validation
npm run env:check
```

### Git Workflow

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add savings vault to RewardSplitter
fix: prevent double-claim in WaveEscrow
docs: update deployment guide for Arbitrum
test: add fuzz testing for split calculations
refactor: extract error handling to Errors library
```

---

## Testing Strategy

### Test Layers

| Layer | Location | Tools | Focus |
|-------|----------|-------|-------|
| **Unit** | `test/unit/` | Mocha + Chai | Per-function correctness, edge cases, access control |
| **Integration** | `test/integration/` | Mocha + Chai | Cross-contract flows, end-to-end scenarios |
| **Fuzzing** | `test/fuzzing/` | Mocha + property checks | Invariant testing, boundary values |
| **Coverage** | `npm run test:coverage` | solidity-coverage | Statement + branch coverage |
| **Gas** | `npm run test:gas` | hardhat-gas-reporter | Gas optimization analysis |
| **Static** | `npm run slither` | Slither | Security vulnerability detection |

### Running Tests

```bash
# Full test suite
npm test

# With coverage
npm run test:coverage

# With gas report
REPORT_GAS=true npm test

# Specific test file
npx hardhat test test/unit/RewardSplitter.test.ts

# Filter by test name
npx hardhat test --grep "should split payout"
```

### Test Fixtures

The project uses Hardhat's `loadFixture` pattern for efficient test setup:

```typescript
const { escrow, reputation, scoping, splitter, mockWave } =
  await loadFixture(deployAllContractsFixture);
```

This ensures each test starts from a clean state without repeating full deployments.

### Key Test Coverage Areas

| Area | Test File | Coverage |
|------|-----------|----------|
| Split calculation correctness | `RewardSplitter.test.ts` | 70/20/10, 0/0/100, edge cases |
| Share validation (max 25%, max 90%, sum <= 100%) | `RewardSplitter.test.ts` | Reverts on invalid configs |
| Ownable2Step ownership transfer | `RewardSplitter.test.ts` | Transfer + accept flow |
| Pause/unpause access control | `RewardSplitter.test.ts` | Owner-only, paused blocks payouts |
| Conservation of funds (fuzzing) | `RewardSplitter.fuzz.ts` | Multiple share/amount combinations |
| End-to-end flow | `full-flow.test.ts` | All 4 phases in sequence |

---

## Deployment

### Local Development

```bash
# Start a local Hardhat node
npx hardhat node

# In another terminal, deploy
npm run deploy:all -- localhost
```

### Testnet Deployment

```bash
# Deploy to Sepolia
npm run deploy:all -- sepolia

# Deploy to Amoy (Polygon testnet)
npm run deploy:all -- amoy

# Deploy to Arbitrum Sepolia
npm run deploy:all -- arbitrumSepolia
```

### Mainnet Deployment

```bash
# Deploy to Ethereum mainnet
npm run deploy:all -- ethereum

# Deploy to Polygon
npm run deploy:all -- polygon

# Deploy to Arbitrum
npm run deploy:all -- arbitrum
```

### Contract Verification

After deployment, contracts are automatically verified on the appropriate block explorer. To manually verify:

```bash
npm run verify -- sepolia
```

### Deployment Checklist

1. [ ] Set environment variables in `.env`
2. [ ] Ensure deployer wallet has sufficient native gas tokens
3. [ ] Run full test suite: `npm test`
4. [ ] Run static analysis: `npm run slither`
5. [ ] Review gas report for unexpected increases
6. [ ] Deploy to testnet first
7. [ ] Verify contracts on block explorer
8. [ ] Test interactions on testnet
9. [ ] Deploy to mainnet
10. [ ] Update frontend/config with new addresses

---

## API Reference

### IRewardSplitter

#### `configureSplit`

```solidity
function configureSplit(
    address savingsVault,
    address treasury,
    uint256 treasuryShare,
    uint256 savingsShare
) external
```

Configures the caller's payout split. Both shares are specified in basis points (1/100 of 1%). The contributor's implicit share is `10000 - treasuryShare - savingsShare`.

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `savingsVault` | `address` | Long-term savings contract address |
| `treasury` | `address` | Project treasury wallet |
| `treasuryShare` | `uint256` | Treasury share in basis points (max 2500) |
| `savingsShare` | `uint256` | Savings share in basis points (max 9000) |

**Requirements:**
- `savingsVault` and `treasury` must not be zero address
- `treasuryShare` <= 2500 (25%)
- `savingsShare` <= 9000 (90%)
- `treasuryShare + savingsShare` <= 10000 (100%)

**Example (70/20/10 split):**
```typescript
// 70% contributor, 20% savings, 10% treasury
await splitter.configureSplit(
  "0xSavingsVaultAddress",
  "0xTreasuryAddress",
  1000, // 10% to treasury
  2000, // 20% to savings
);
```

#### `splitPayout`

```solidity
function splitPayout(address contributor) external payable
```

Splits `msg.value` according to contributor's config.

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `contributor` | `address` | Contributor to look up config for |

**Requirements:**
- Caller must have a split config
- Splitter must not be paused
- `msg.value` must be > 0

**Example:**
```typescript
await splitter.splitPayout(contributorAddress, {
  value: ethers.parseEther("10")
});
```

#### `getSplitConfig`

```solidity
function getSplitConfig(address contributor)
    external view returns (SplitConfig memory)
```

Returns the split configuration for a contributor.

**Returns:**
| Field | Type | Description |
|-------|------|-------------|
| `savingsVault` | `address` | Savings vault address |
| `treasury` | `address` | Treasury wallet address |
| `treasuryShare` | `uint256` | Treasury share in basis points |
| `active` | `bool` | Whether config is active |

### IWaveEscrow

#### `createWave`

```solidity
function createWave(uint256 deadline) external returns (uint256)
```

Creates a new wave with a deadline timestamp. Minimum duration: 1 day. Maximum: 365 days.

#### `deposit`

```solidity
function deposit(uint256 waveId) external payable
```

Deposits ETH into a wave pool. Reverts if wave is finalized or past deadline.

#### `claimPayout`

```solidity
function claimPayout(uint256 waveId, address contributor) external
```

Marks a contributor as having claimed their payout from a finalized wave.

#### `finalizeWave`

```solidity
function finalizeWave(uint256 waveId) external
```

Finalizes a wave after its deadline has passed. Only owner.

### IWaveReputation

#### `verifyContributor`

```solidity
function verifyContributor(address contributor, bytes32 identityHash) external
```

Registers a contributor with an on-chain identity hash.

#### `awardPoints`

```solidity
function awardPoints(address contributor, uint256 points, string calldata reason) external
```

Awards reputation points to a verified contributor.

#### `issueBadge`

```solidity
function issueBadge(address contributor, bytes32 badgeId, uint256 expiry) external
```

Issues a time-bound badge to a verified contributor.

### IWaveScoping

#### `proposeIssue`

```solidity
function proposeIssue(string calldata description, uint256 rewardPool) external returns (uint256)
```

Proposes a new issue for community voting.

#### `voteOnIssue`

```solidity
function voteOnIssue(uint256 issueId, bool inFavor, uint256 weight) external
```

Casts a weighted vote on an issue.

#### `selectIssueForWave`

```solidity
function selectIssueForWave(uint256 issueId, uint256 waveId) external
```

Selects an approved issue to associate with a wave.

---

## Security

### Security Model

| Concern | Mitigation |
|---------|------------|
| **Reentrancy** | CEI pattern followed; no external calls before state changes |
| **Overflow** | Solidity ^0.8.24 has built-in overflow protection |
| **Access Control** | Owner-only functions for critical operations; checked modifiers |
| **Pause Mechanism** | RewardSplitter has emergency pause/unpause |
| **Input Validation** | All external inputs validated; zero-address checks |
| **Gas Limits** | Split operations use `call` with no forwarded gas limit issues |
| **Treasury Cap** | `MAX_TREASURY_SHARE = 2500` (25%) prevents excessive treasury take |

### Audit Checklist

- [ ] All `require` statements tested for reverts
- [ ] All `onlyOwner` functions tested for unauthorized access
- [ ] Zero-address checks on all address parameters
- [ ] Integer overflow/underflow impossible (Solc 0.8.x)
- [ ] Reentrancy guard not needed (no external calls before state changes)
- [ ] Events emitted on all state-changing operations
- [ ] Pause mechanism tested and verified
- [ ] Emergency withdrawal tested

### Ownership Model

All contracts use **OpenZeppelin's Ownable2Step**, which provides:
- Two-step ownership transfer (propose + accept)
- Prevents accidental transfer to wrong address
- Clear event emission for audit trail
- Easy migration to multisig in production

**Production deployment flow:**
1. Deploy with EOA deployer
2. Call `transferOwnership(multisigAddress)`
3. Multisig calls `acceptOwnership()`
4. EOA deployer renounces access

### Known Considerations

- `RewardSplitter` uses low-level `call` for ETH transfers (recommended over `transfer`/`send`)
- `WaveEscrow.emergencyWithdraw` is a powerful backdoor — use multisig for owner in production
- No reentrancy guard needed: state changes (mapping reads) happen before `call` in `splitPayout`
- Cross-chain naming is forward-looking: v1 is single-chain; v2 will add LayerZero/Wormhole bridges

---

## CI/CD

### Continuous Integration

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR:

1. **Lint** — Solhint, ESLint, Prettier formatting check
2. **Test** — Unit tests, integration tests, coverage report
3. **Slither** — Static security analysis
4. **Build** — Force recompile + TypeChain type generation

### Continuous Deployment

The deploy workflow (`.github/workflows/deploy.yml`) is manual trigger:

1. Select target network from dropdown
2. Deploys all contracts via Hardhat
3. Verifies contracts on block explorer
4. Notifies on completion

### Git Hooks

```bash
# Install Husky hooks (auto-run on npm install)
npx husky

# Pre-commit: lint-staged runs on staged files
# Commit-msg: commitlint validates message format
```

---

## Docker

### Running with Docker

```bash
# Build and start a local Hardhat node with deployed contracts
docker compose up -d

# Check logs
docker compose logs -f

# Stop
docker compose down
```

### Docker Architecture

```
docker-compose.yml
├── hardhat-node    — Exposes port 8545, runs Hardhat node
└── hardhat-deploy  — One-shot container that deploys contracts
```

### Multi-stage Build

The `Dockerfile` uses a multi-stage build:
- **builder** — Installs dependencies, compiles contracts, generates types
- **runner** — Minimal runtime image with compiled artifacts only

---

## Monitoring & Logging

### On-Chain Events

All contracts emit events for off-chain indexing:

| Contract | Events |
|----------|--------|
| RewardSplitter | `SplitConfigUpdated`, `PayoutSplit`, `SplitterPaused`, `SplitterUnpaused` |
| WaveEscrow | `WaveClaimed`, `EscrowDeposited`, `EmergencyWithdrawn` |
| WaveReputation | `ReputationAwarded`, `ContributorVerified`, `BadgeIssued` |
| WaveScoping | `IssueProposed`, `IssueSelected`, `VoteCast` |

### Recommended Infrastructure

- **Indexer**: The Graph Protocol for subgraph indexing
- **Dashboard**: Dune Analytics for payout visualization
- **Alerts**: Defender Sentinels for pause/unpause events
- **Logging**: Structured logging via `scripts/utils/logger.ts` for deployment scripts

```typescript
import { info, success, error } from "./utils/logger";

info("Deploying contracts", { network: "sepolia" });
success("Contract deployed", { address: "0x..." });
error("Deployment failed", err);
```

---

## Scalability

### Current Architecture

Each contract operates independently with minimal state:

| Contract | State Growth | Mitigation |
|----------|-------------|------------|
| WaveEscrow | `O(waves * contributors)` | Reasonable for expected usage; consider pruning old waves |
| WaveReputation | `O(contributors * badges)` | Linear in participants; no significant concern |
| WaveScoping | `O(issues * voters)` | Linear in proposals; archive old issues |
| RewardSplitter | `O(contributors)` | Minimal — one struct per contributor |

### Cross-Chain Strategy

The name "Cross-Chain" anticipates future multi-chain deployment:

1. **Same code, multiple chains** — Deploy identical contracts on Ethereum, Polygon, Arbitrum
2. **Chain-specific state** — Each chain maintains its own split configs (no cross-chain state synchronization needed)
3. **Unified indexer** — A subgraph indexing across chains for a single dashboard
4. **Future: cross-chain messaging** — LayerZero/Wormhole integration for unified contributor identities

### Gas Optimization

- Solidity optimizer enabled with 200 runs
- `viaIR` code generation for improved gas efficiency
- No unnecessary storage reads in hot paths
- Events for cheap off-chain data availability

---

## Formal Verification

The project includes **Certora Formal Verification** specs (in `certora/`) to mathematically prove critical contract properties.

### Verified Properties

| Property | Spec Rule | Description |
|----------|-----------|-------------|
| Conservation of funds | `conservation_of_funds` | Sum of all transfers always equals `msg.value` |
| Treasury share limit | `treasury_max_2500` | Treasury share cannot exceed 2500 bps (25%) |
| Combined share limit | `valid_shares_enforced` | `treasuryShare + savingsShare` cannot exceed 10000 bps |
| Access control | `only_owner_can_pause` | Only owner can pause/unpause the splitter |
| Pause blocks payouts | `paused_blocks_payouts` | All `splitPayout()` calls revert when paused |

### Running Verification

```bash
# Install Certora CLI (requires Java)
pip install certora-cli

# Run all specs
certoraRun certora/conf/RewardSplitter.conf

# Specific rule
certoraRun certora/conf/RewardSplitter.conf --rule conservation_of_funds
```

> **Note:** Formal verification is in CI as a non-blocking step. The primary safety guarantees come from the comprehensive test suite (unit + integration + fuzzing) and Slither static analysis.

---

## Roadmap

### Phase 1 — The Vault ✅
- [x] WaveEscrow contract
- [x] Deposit/claim flow
- [x] Emergency withdrawal

### Phase 2 — The Identity ✅
- [x] WaveReputation contract
- [x] Contributor verification
- [x] Points and badges

### Phase 3 — The Governance ✅
- [x] WaveScoping contract
- [x] Issue proposals and voting
- [x] Issue selection for waves

### Phase 4 — The Split ✅
- [x] RewardSplitter contract
- [x] Configurable payout splits
- [x] Pause mechanism

### Future Releases

| Version | Features |
|---------|----------|
| **v1.1** | ERC-20 token support in addition to ETH |
| **v1.2** | Cross-chain identity via LayerZero / Wormhole |
| **v1.3** | UUPS upgradeable proxy pattern for all contracts |
| **v2.0** | Multi-sig governance for WaveScoping (replaces single owner) |
| **v2.1** | Delegated voting and quadratic voting for issue selection |
| **v2.2** | Time-weighted savings vault with yield (integration with Yearn/Morpho) |

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linters: `npm run lint`
6. Submit a pull request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Request review from maintainers

### Code Style

- Solidity: Follow [Solhint recommended rules](.solhint.json)
- TypeScript: Follow ESLint + Prettier configuration
- Use custom errors (not `require` with strings)
- Follow CEI (Checks-Effects-Interactions) pattern
- Prefer `call` over `transfer` for ETH transfers
- Use `uint256` explicitly (not `uint`)

---

## FAQ

### General

**Q: What fees does the protocol charge?**
A: None. The treasury share is set by each contributor — it's their choice, not a protocol fee.

**Q: Can I change my split config after setting it?**
A: Yes. Call `configureSplit()` again with new parameters to overwrite your config.

**Q: What happens if I don't set a split config?**
A: `splitPayout()` will revert with `NoSplitConfigFound`. You must configure a split before receiving payouts.

### Technical

**Q: Why use basis points instead of percentages?**
A: Basis points (1/100 of 1%) allow for precise fractional percentages without floating-point arithmetic.

**Q: Is there a reentrancy risk?**
A: No. The `splitPayout()` function follows CEI: state reads happen first, then ETH transfers via `call`.

**Q: What's the difference between the treasury share and savings share?**
A: Both are configurable in basis points. Treasury goes to the project fund (capped at 25%), savings goes to a long-term vault (capped at 90%), and the remainder goes directly to the contributor.

**Q: Can the owner steal funds?**
A: The owner can pause the splitter and has emergency withdrawal on the escrow. In production, these roles should be behind a multi-sig. Ownable2Step prevents one-step ownership transfers to wrong addresses.

**Q: Why are treasury and savings shares capped at 25% and 90% respectively?**
A: Treasury is capped at 25% to prevent contributor exploitation. Savings is capped at 90% to ensure contributors always receive at least 10% directly. Combined shares cannot exceed 100%.

### Deployment

**Q: Which chains are supported?**
A: Ethereum, Polygon, Arbitrum (mainnet and testnets). The architecture is chain-agnostic.

**Q: Do I need to deploy all four contracts?**
A: Only `RewardSplitter` is required for payout splitting. The other three are complementary modules.

---

## Troubleshooting

### Common Issues

#### Compilation Errors

```bash
# Clear cache and recompile
npm run clean && npm run build:force
```

#### Test Failures

```bash
# Run with verbose output
npx hardhat test --verbose

# Run a specific test
npx hardhat test test/unit/RewardSplitter.test.ts
```

#### Deployment Failures

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `insufficient funds` | Deployer has no native gas token | Fund deployer address |
| `nonce too low` | Stale nonce cache | Wait or reset nonce |
| `already verified` | Contract already on explorer | No action needed |
| `max fee per gas lower than block base fee` | Gas price too low | Increase in config |

#### Docker Issues

```bash
# Rebuild without cache
docker compose build --no-cache

# Reset volumes
docker compose down -v
```

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Drips Protocol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Support

- **GitHub Issues**: [Report a bug](https://github.com/drips-protocol/cross-chain-splitter/issues)
- **Security**: Email security@dripsprotocol.dev for vulnerabilities
- **Discord**: [Join our community](https://discord.gg/drips-protocol)

---

<div align="center">
  Built with ❤️ for the Drips ecosystem
</div>
# Cross-Chain
