# Security Model

## Threat Model

### Actors
- **Contributors**: Users who earn Wave payouts and configure splits
- **Owner**: Deployer/admin who controls privileged functions
- **Wave Contract**: External contract that calls `splitPayout()`
- **Treasury**: Receives split portion; could be a multisig
- **Savings Vault**: Receives savings portion; could be a yield-bearing contract

### Trust Assumptions

1. **Owner is trusted** — Can pause splitter, finalize waves, and emergency withdraw
2. **Wave Contract is trusted** — It calls `splitPayout()` with correct `msg.value`
3. **Contributors are untrusted** — Protocol must handle any config they set
4. **Treasury/Savings Vault are untrusted** — They only receive funds; no control flow

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Owner key compromise | Critical | Use multisig in production |
| Reentrancy in splitPayout | Medium | CEI pattern; state before call |
| Integer overflow | Low | Solc 0.8.x built-in checks |
| DOS via large splits | Low | Fixed gas cost; no loops |
| Phishing: fake splitter | High | Frontend verification; ENS |

## Audit Trail

All state-changing operations emit events for forensic analysis:

```solidity
event PayoutSplit(
    address indexed contributor,
    uint256 totalAmount,
    uint256 toContributor,
    uint256 toSavings,
    uint256 toTreasury
);
```

## Emergency Procedures

### If a vulnerability is found:

1. Pause the splitter: `splitter.pauseSplitter()`
2. Investigate and patch
3. Deploy new version
4. Unpause after verification

### If owner key is compromised:

1. This is a critical issue for v1 (single-owner)
2. v2 should implement multisig ownership via OpenZeppelin's `Ownable2Step` or a Gnosis Safe
