import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployAllContractsFixture,
  getSigners,
  WAVE_DURATION,
  calculateSplit,
} from "../helpers/fixtures";
import { advanceToDeadline, getCurrentTimestamp } from "../helpers/time";

describe("Full Flow: Wave → Reputation → Scoping → Split", function () {
  it("should complete end-to-end payout cycle", async function () {
    const { escrow, reputation, scoping, splitter, mockWave } =
      await loadFixture(deployAllContractsFixture);
    const { owner, contributor, savingsVault, treasury, voter, proposer } =
      await getSigners();

    const contributorAddr = await contributor.getAddress();
    const savingsAddr = await savingsVault.getAddress();
    const treasuryAddr = await treasury.getAddress();
    const ownerAddr = await owner.getAddress();

    // ── Phase 1: Verify contributor identity ──
    const identityHash = ethers.keccak256(
      ethers.toUtf8Bytes("contributor-identity"),
    );
    await reputation.verifyContributor(contributorAddr, identityHash);
    const profile = await reputation.getContributorProfile(contributorAddr);
    expect(profile.identityHash).to.equal(identityHash);

    // ── Phase 2: Propose and vote on an issue ──
    const description = "Build cross-chain payout integration for Wave Drips";
    await scoping
      .connect(proposer)
      .proposeIssue(description, ethers.parseEther("50"));

    await scoping.connect(voter).voteOnIssue(1, true, 100);
    await scoping.selectIssueForWave(1, 1);

    const issue = await scoping.getIssue(1);
    expect(issue.selected).to.be.true;

    // ── Phase 3: Contributor sets up 70/20/10 split config ──
    const treasuryShare = 1000; // 10%
    const savingsShare = 2000; // 20%
    // contributorShare = 7000 (70%)

    await splitter
      .connect(contributor)
      .configureSplit(savingsAddr, treasuryAddr, treasuryShare, savingsShare);

    const config = await splitter.getSplitConfig(contributorAddr);
    expect(config.active).to.be.true;
    expect(config.treasuryShare).to.equal(treasuryShare);
    expect(config.savingsShare).to.equal(savingsShare);

    // ── Phase 4: Create wave and deposit funds ──
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;
    await escrow.createWave(deadline);

    const poolAmount = ethers.parseEther("100");
    await escrow.connect(contributor).deposit(1, { value: poolAmount });

    expect(await escrow.getWavePool(1)).to.equal(poolAmount);

    // ── Phase 5: Finalize wave ──
    await advanceToDeadline(deadline + 1);
    await escrow.finalizeWave(1);
    expect(await escrow.isWaveFinalized(1)).to.be.true;

    // ── Phase 6: Execute payout through splitter ──
    const payoutAmount = ethers.parseEther("10");

    const { forTreasury, forSavings, forContributor } = calculateSplit(
      payoutAmount,
      treasuryShare,
      savingsShare,
    );

    const treasuryBefore = await ethers.provider.getBalance(treasuryAddr);
    const savingsBefore = await ethers.provider.getBalance(savingsAddr);
    const contributorBefore = await ethers.provider.getBalance(contributorAddr);

    await mockWave.connect(owner).distributePayout(contributorAddr, {
      value: payoutAmount,
    });

    // ── Phase 7: Verify split amounts ──
    const treasuryAfter = await ethers.provider.getBalance(treasuryAddr);
    const savingsAfter = await ethers.provider.getBalance(savingsAddr);
    const contributorAfter = await ethers.provider.getBalance(contributorAddr);

    expect(treasuryAfter - treasuryBefore).to.equal(forTreasury);
    expect(savingsAfter - savingsBefore).to.equal(forSavings);
    expect(contributorAfter - contributorBefore).to.equal(forContributor);

    // ── Phase 8: Award reputation points ──
    await reputation.awardPoints(contributorAddr, 500, "completed wave contribution");
    expect(await reputation.getTotalPoints(contributorAddr)).to.equal(500);
  });
});
