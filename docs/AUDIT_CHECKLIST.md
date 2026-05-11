# Security Audit Checklist

## Pre-Audit Preparation

- [ ] All contracts compile without warnings
- [ ] NatSpec documentation complete on all public/external functions
- [ ] Test coverage >= 90% (statement + branch)
- [ ] Slither analysis clean (no high/medium findings)
- [ ] All custom errors defined in `Errors.sol`
- [ ] Gas report generated for regression comparison
- [ ] Deployment addresses documented

## Access Control

- [ ] `onlyOwner` (via Ownable2Step) applied to all privileged functions
- [ ] No admin functions callable by arbitrary addresses
- [ ] Ownership transfer requires 2-step process (Ownable2Step)
- [ ] Zero-address checks on all address parameters
- [ ] No selfdestruct or delegatecall

## Input Validation

- [ ] All `uint256` parameters validated (zero checks, range checks)
- [ ] Basis point values capped (`MAX_TREASURY_SHARE = 2500`)
- [ ] Share sums validated: `treasuryShare + savingsShare <= 10000`
- [ ] String lengths bounded (WaveScoping: `10-1024` chars)
- [ ] Deadline validation (Min: 1 day, Max: 365 days)
- [ ] Array bounds / overflow — Solc 0.8.x built-in

## Reentrancy

- [ ] CEI pattern confirmed in `RewardSplitter.splitPayout()`
  - State reads (`_configs[contributor]`) happen before any `call`
  - No state writes after external calls
- [ ] All other functions follow CEI or have no external calls

## ETH Handling

- [ ] Low-level `call` used instead of `transfer`/`send` (gas-safe)
- [ ] Return value checked on all ETH transfers
- [ ] Emergency withdrawal tested with actual ETH movement
- [ ] No unbounded loops in payable functions

## Pause Mechanism

- [ ] `pauseSplitter()` and `unpauseSplitter()` emit events
- [ ] `whenNotPaused` modifier applied to `splitPayout()`
- [ ] Owner-only pause (cannot be triggered by attacker)
- [ ] Pause does not affect funds already in the contract

## Event Emission

- [ ] All state-changing operations emit events
- [ ] Indexed parameters on addresses/IDs for efficient filtering
- [ ] Event data complete for off-chain reconstruction

## Upgradeability (v1 — not upgradeable)

- [ ] No proxy pattern in v1 (immutable deployment)
- [ ] `immutable` keyword used for computed values (none in v1)
- [ ] Constructor sets initial state correctly

## Formal Verification (Certora)

- [ ] Conservation of funds: total out == total in
- [ ] Treasury share limited to configured value
- [ ] Only owner can pause
- [ ] Paused blocks payouts
- [ ] Share validation enforced

## Post-Deployment

- [ ] Contracts verified on block explorer
- [ ] Ownership transferred to multisig (production) or noted (dev)
- [ ] Subgraph deployed and indexing
- [ ] Monitoring alerts configured for pause/unpause events
