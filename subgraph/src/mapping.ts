import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  SplitConfigUpdated as SplitConfigUpdatedEvent,
  PayoutSplit as PayoutSplitEvent,
  SplitterPaused as SplitterPausedEvent,
  SplitterUnpaused as SplitterUnpausedEvent,
} from "../generated/RewardSplitter/RewardSplitter";
import {
  WaveCreated as WaveCreatedEvent,
  EscrowDeposited as EscrowDepositedEvent,
  WaveClaimed as WaveClaimedEvent,
  EmergencyWithdrawn as EmergencyWithdrawnEvent,
} from "../generated/WaveEscrow/WaveEscrow";
import {
  ContributorVerified as ContributorVerifiedEvent,
  ReputationAwarded as ReputationAwardedEvent,
  BadgeIssued as BadgeIssuedEvent,
} from "../generated/WaveReputation/WaveReputation";
import {
  IssueProposed as IssueProposedEvent,
  IssueSelected as IssueSelectedEvent,
  VoteCast as VoteCastEvent,
  IssueFinalized as IssueFinalizedEvent,
} from "../generated/WaveScoping/WaveScoping";
import {
  SplitConfig,
  PayoutEvent,
  SplitterPauseEvent,
  SplitterUnpauseEvent,
  Wave,
  EscrowDepositEvent,
  WaveClaimEvent,
  EmergencyWithdrawEvent,
  Contributor,
  Badge,
  ReputationAwardEvent,
  Issue,
  VoteEvent,
} from "../generated/schema";

const BASIS_POINTS = BigInt.fromI32(10000);

// ═══════════════════════════════════════════════════════════════
// RewardSplitter Handlers
// ═══════════════════════════════════════════════════════════════

export function handleSplitConfigUpdated(event: SplitConfigUpdatedEvent): void {
  const config = new SplitConfig(event.params.contributor.toHexString());
  config.savingsVault = event.params.savingsVault;
  config.treasury = event.params.treasury;
  config.treasuryShare = event.params.treasuryShare;
  config.savingsShare = event.params.savingsShare;
  config.contributorShare = BASIS_POINTS
    .minus(event.params.treasuryShare)
    .minus(event.params.savingsShare);
  config.active = true;
  config.updatedAtBlock = event.block.number;
  config.updatedAt = event.block.timestamp;
  config.save();
}

export function handlePayoutSplit(event: PayoutSplitEvent): void {
  const payout = new PayoutEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  payout.contributor = event.params.contributor;
  payout.totalAmount = event.params.totalAmount;
  payout.toContributor = event.params.toContributor;
  payout.toSavings = event.params.toSavings;
  payout.toTreasury = event.params.toTreasury;
  payout.blockNumber = event.block.number;
  payout.timestamp = event.block.timestamp;
  payout.transactionHash = event.transaction.hash;
  payout.save();
}

export function handleSplitterPaused(event: SplitterPausedEvent): void {
  const pause = new SplitterPauseEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  pause.by = event.params.by;
  pause.blockNumber = event.block.number;
  pause.timestamp = event.block.timestamp;
  pause.save();
}

export function handleSplitterUnpaused(event: SplitterUnpausedEvent): void {
  const unpause = new SplitterUnpauseEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  unpause.by = event.params.by;
  unpause.blockNumber = event.block.number;
  unpause.timestamp = event.block.timestamp;
  unpause.save();
}

// ═══════════════════════════════════════════════════════════════
// WaveEscrow Handlers
// ═══════════════════════════════════════════════════════════════

export function handleWaveCreated(event: WaveCreatedEvent): void {
  const wave = new Wave(event.params.waveId.toString());
  wave.totalPool = BigInt.fromI32(0);
  wave.deadline = event.params.deadline;
  wave.finalized = false;
  wave.createdAtBlock = event.block.number;
  wave.createdAt = event.block.timestamp;
  wave.save();
}

export function handleEscrowDeposited(event: EscrowDepositedEvent): void {
  const wave = Wave.load(event.params.waveId.toString());
  if (wave) {
    wave.totalPool = wave.totalPool.plus(event.params.amount);
    wave.save();
  }

  const deposit = new EscrowDepositEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  deposit.wave = event.params.waveId.toString();
  deposit.depositor = event.params.depositor;
  deposit.amount = event.params.amount;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.save();
}

export function handleWaveClaimed(event: WaveClaimedEvent): void {
  const claim = new WaveClaimEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  claim.wave = event.params.waveId.toString();
  claim.contributor = event.params.contributor;
  claim.amount = event.params.amount;
  claim.blockNumber = event.block.number;
  claim.timestamp = event.block.timestamp;
  claim.save();
}

export function handleEmergencyWithdrawn(event: EmergencyWithdrawnEvent): void {
  const wave = Wave.load(event.params.waveId.toString());
  if (wave) {
    wave.totalPool = BigInt.fromI32(0);
    wave.save();
  }

  const ew = new EmergencyWithdrawEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  ew.wave = event.params.waveId.toString();
  ew.caller = event.params.caller;
  ew.amount = event.params.amount;
  ew.blockNumber = event.block.number;
  ew.timestamp = event.block.timestamp;
  ew.save();
}

// ═══════════════════════════════════════════════════════════════
// WaveReputation Handlers
// ═══════════════════════════════════════════════════════════════

export function handleContributorVerified(event: ContributorVerifiedEvent): void {
  const contributor = new Contributor(event.params.contributor.toHexString());
  contributor.identityHash = event.params.identityHash;
  contributor.totalPoints = BigInt.fromI32(0);
  contributor.contributionCount = BigInt.fromI32(0);
  contributor.lastActivity = event.block.timestamp;
  contributor.save();
}

export function handleReputationAwarded(event: ReputationAwardedEvent): void {
  const contributor = Contributor.load(event.params.contributor.toHexString());
  if (contributor) {
    contributor.totalPoints = contributor.totalPoints.plus(event.params.points);
    contributor.contributionCount = contributor.contributionCount.plus(BigInt.fromI32(1));
    contributor.lastActivity = event.block.timestamp;
    contributor.save();
  }

  const award = new ReputationAwardEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  award.contributor = event.params.contributor.toHexString();
  award.points = event.params.points;
  award.reason = event.params.reason;
  award.blockNumber = event.block.number;
  award.timestamp = event.block.timestamp;
  award.save();
}

export function handleBadgeIssued(event: BadgeIssuedEvent): void {
  const badge = new Badge(
    `${event.params.contributor.toHexString()}-${event.params.badgeId.toHexString()}`,
  );
  badge.contributor = event.params.contributor.toHexString();
  badge.badgeId = event.params.badgeId;
  badge.issuedAt = event.block.timestamp;
  badge.expiry = event.params.expiry;
  badge.expired = event.block.timestamp >= event.params.expiry;
  badge.save();
}

// ═══════════════════════════════════════════════════════════════
// WaveScoping Handlers
// ═══════════════════════════════════════════════════════════════

export function handleIssueProposed(event: IssueProposedEvent): void {
  const issue = new Issue(event.params.issueId.toString());
  issue.proposer = event.params.proposer;
  issue.description = event.params.description;
  issue.rewardPool = event.params.rewardPool;
  issue.approvalWeight = BigInt.fromI32(0);
  issue.rejectionWeight = BigInt.fromI32(0);
  issue.selected = false;
  issue.finalized = false;
  issue.createdAtBlock = event.block.number;
  issue.createdAt = event.block.timestamp;
  issue.save();
}

export function handleIssueSelected(event: IssueSelectedEvent): void {
  const issue = Issue.load(event.params.issueId.toString());
  if (issue) {
    issue.selected = true;
    issue.finalized = true;
    issue.approvalWeight = event.params.approvalWeight;
    issue.save();
  }
}

export function handleVoteCast(event: VoteCastEvent): void {
  const issue = Issue.load(event.params.issueId.toString());
  if (issue) {
    if (event.params.inFavor) {
      issue.approvalWeight = issue.approvalWeight.plus(event.params.weight);
    } else {
      issue.rejectionWeight = issue.rejectionWeight.plus(event.params.weight);
    }
    issue.save();
  }

  const vote = new VoteEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`,
  );
  vote.issue = event.params.issueId.toString();
  vote.voter = event.params.voter;
  vote.weight = event.params.weight;
  vote.inFavor = event.params.inFavor;
  vote.blockNumber = event.block.number;
  vote.timestamp = event.block.timestamp;
  vote.save();
}

export function handleIssueFinalized(event: IssueFinalizedEvent): void {
  const issue = Issue.load(event.params.issueId.toString());
  if (issue) {
    issue.finalized = true;
    issue.selected = event.params.selected;
    issue.save();
  }
}
