# Access Control Matrix

## Role Definitions

| Role | Description | Typical Actor |
|------|-------------|---------------|
| **Owner** | Contract deployer / admin. Transferred via Ownable2Step. | DAO multisig (production) or deployer EOA (dev) |
| **Contributor** | Any address that registers a split config. | Individual developer earning Wave rewards |
| **Voter** | Any address that votes on an issue. | Community member |
| **Proposer** | Any address that proposes an issue. | Community member |
| **Anyone** | Unauthenticated external caller. | Public |

## RewardSplitter

| Function | Owner | Contributor | Anyone |
|----------|-------|-------------|--------|
| `configureSplit()` | — | ✅ (self) | — |
| `splitPayout()` | — | — | ✅ (payable) |
| `pauseSplitter()` | ✅ | — | — |
| `unpauseSplitter()` | ✅ | — | — |
| `transferOwnership()` | ✅ | — | — |
| `acceptOwnership()` | ✅ (pending) | — | — |
| `getSplitConfig()` | ✅ | ✅ | ✅ |
| `isPaused()` | ✅ | ✅ | ✅ |

## WaveEscrow

| Function | Owner | Contributor | Anyone |
|----------|-------|-------------|--------|
| `createWave()` | ✅ | — | — |
| `finalizeWave()` | ✅ | — | — |
| `emergencyWithdraw()` | ✅ | — | — |
| `deposit()` | ✅ | ✅ | ✅ |
| `claimPayout()` | ✅ | ✅ | ✅ |
| `getWavePool()` | ✅ | ✅ | ✅ |
| `hasClaimed()` | ✅ | ✅ | ✅ |
| `isWaveFinalized()` | ✅ | ✅ | ✅ |

## WaveReputation

| Function | Owner | Contributor | Anyone |
|----------|-------|-------------|--------|
| `verifyContributor()` | ✅ | — | — |
| `awardPoints()` | ✅ | — | — |
| `issueBadge()` | ✅ | — | — |
| `getContributorProfile()` | ✅ | ✅ | ✅ |
| `hasBadge()` | ✅ | ✅ | ✅ |
| `getTotalPoints()` | ✅ | ✅ | ✅ |
| `getContributionCount()` | ✅ | ✅ | ✅ |

## WaveScoping

| Function | Owner | Proposer | Voter | Anyone |
|----------|-------|----------|-------|--------|
| `proposeIssue()` | ✅ | ✅ | ✅ | ✅ |
| `voteOnIssue()` | ✅ | ✅ | ✅ | ✅ |
| `selectIssueForWave()` | ✅ | — | — | — |
| `finalizeIssue()` | ✅ | — | — | — |
| `getIssue()` | ✅ | ✅ | ✅ | ✅ |
| `getTotalVotes()` | ✅ | ✅ | ✅ | ✅ |
| `isIssueSelected()` | ✅ | ✅ | ✅ | ✅ |
| `hasVoted()` | ✅ | ✅ | ✅ | ✅ |

## Production Recommendations

### Ownership Transfer Checklist

1. Deploy with EOA
2. Verify contracts on block explorer
3. Transfer ownership to multisig:
   ```solidity
   // Step 1: Current owner initiates
   splitter.transferOwnership(multisigAddress);
   
   // Step 2: Multisig accepts
   splitter.acceptOwnership();
   ```
4. Confirm: `splitter.owner() == multisigAddress`
5. Consider renouncing ownership for immutable contracts (not recommended — prevents pause)

### Multisig Configuration

| Parameter | Recommendation |
|-----------|---------------|
| Signers | 3/5 or 5/9 |
| Network | Ethereum mainnet (Gnosis Safe) |
| Timelock | Optional 24h delay for non-emergency operations |
