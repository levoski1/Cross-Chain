import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployAllContractsFixture, getSigners } from "../helpers/fixtures";

describe("WaveScoping", function () {
  const DESCRIPTION = "Implement cross-chain bridging for Wave payouts";

  it("should propose an issue", async function () {
    const { scoping } = await loadFixture(deployAllContractsFixture);
    const { proposer } = await getSigners();

    await scoping.connect(proposer).proposeIssue(DESCRIPTION, ethers.parseEther("10"));
    const issue = await scoping.getIssue(1);

    expect(issue.id).to.equal(1);
    expect(issue.proposer).to.equal(await proposer.getAddress());
    expect(issue.description).to.equal(DESCRIPTION);
  });

  it("should reject short description", async function () {
    const { scoping } = await loadFixture(deployAllContractsFixture);
    const { proposer } = await getSigners();

    await expect(
      scoping.connect(proposer).proposeIssue("short", ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("should cast votes on an issue", async function () {
    const { scoping } = await loadFixture(deployAllContractsFixture);
    const { proposer, voter } = await getSigners();

    await scoping.connect(proposer).proposeIssue(DESCRIPTION, ethers.parseEther("10"));

    await scoping.connect(voter).voteOnIssue(1, true, 100);
    const issue = await scoping.getIssue(1);

    expect(issue.approvalWeight).to.equal(100);
    expect(issue.rejectionWeight).to.equal(0);
  });

  it("should reject duplicate votes", async function () {
    const { scoping } = await loadFixture(deployAllContractsFixture);
    const { proposer, voter } = await getSigners();

    await scoping.connect(proposer).proposeIssue(DESCRIPTION, ethers.parseEther("10"));
    await scoping.connect(voter).voteOnIssue(1, true, 100);

    await expect(
      scoping.connect(voter).voteOnIssue(1, true, 50)
    ).to.be.reverted;
  });

  it("should select issue for wave when approved", async function () {
    const { scoping } = await loadFixture(deployAllContractsFixture);
    const { proposer, voter } = await getSigners();

    await scoping.connect(proposer).proposeIssue(DESCRIPTION, ethers.parseEther("10"));
    await scoping.connect(voter).voteOnIssue(1, true, 100);
    await scoping.selectIssueForWave(1, 42);

    const issue = await scoping.getIssue(1);
    expect(issue.selected).to.be.true;
    expect(issue.finalized).to.be.true;
  });

  it("should reject selecting issue with no votes", async function () {
    const { scoping } = await loadFixture(deployAllContractsFixture);
    const { proposer } = await getSigners();

    await scoping.connect(proposer).proposeIssue(DESCRIPTION, ethers.parseEther("10"));

    await expect(scoping.selectIssueForWave(1, 42)).to.be.reverted;
  });

  it("should track total votes correctly", async function () {
    const { scoping } = await loadFixture(deployAllContractsFixture);
    const { proposer, voter, owner } = await getSigners();

    await scoping.connect(proposer).proposeIssue(DESCRIPTION, ethers.parseEther("10"));
    await scoping.connect(voter).voteOnIssue(1, true, 100);
    await scoping.connect(owner).voteOnIssue(1, false, 50);

    const totalVotes = await scoping.getTotalVotes(1);
    expect(totalVotes).to.equal(150);
  });
});
