# Architecture Guide

## Design Philosophy

The Cross-Chain Drips Splitter follows these principles:

1. **Composability over Monolith** — Four independent contracts that can be deployed, upgraded, and used separately
2. **Security by Default** — CEI pattern, input validation, and access control on every external function
3. **Minimal Trust** — No cross-contract dependencies at runtime; each contract is self-sufficient
4. **Gas Efficiency** — Optimized storage layouts, no redundant reads, event-based data availability

## Contract Dependencies

```
WaveEscrow ──── independent
WaveReputation ─ independent
WaveScoping ──── independent
RewardSplitter ─ independent (uses only caller's config)
```

No contract calls another contract. Coordination happens at the application layer (off-chain scripts, a unified Wave contract, or a frontend).

## Storage Layout

### RewardSplitter

```
slot 0: address owner                          (20 bytes)
slot 1: uint256 _paused                        (1 byte, packed)
slot 2+: mapping(address => SplitConfig)       (dynamic)
```

### SplitConfig (stored in mapping)

```
slot 0: address savingsVault                   (20 bytes)
slot 1: address treasury                       (20 bytes)
slot 2: uint256 treasuryShare                  (32 bytes)
slot 3: bool active                            (1 byte, packed)
```

## Event Indexing Strategy

All contracts emit events with indexed parameters for efficient off-chain querying:

```solidity
event PayoutSplit(
    address indexed contributor,   // filter by contributor
    uint256 totalAmount,
    uint256 toContributor,
    uint256 toSavings,
    uint256 toTreasury
);
```

Recommended subgraph schema:

```graphql
type SplitConfig @entity {
  id: ID!                          # contributor address
  savingsVault: Bytes!
  treasury: Bytes!
  treasuryShare: BigInt!
  active: Boolean!
}

type PayoutEvent @entity {
  id: ID!                          # tx hash + log index
  contributor: Bytes!
  totalAmount: BigInt!
  toContributor: BigInt!
  toSavings: BigInt!
  toTreasury: BigInt!
  timestamp: BigInt!
}
```
