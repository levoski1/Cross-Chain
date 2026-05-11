import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployAllContractsFixture, getSigners } from "../helpers/fixtures";

describe("WaveReputation", function () {
  const IDENTITY_HASH = ethers.keccak256(ethers.toUtf8Bytes("contributor-identity"));
  const BADGE_ID = ethers.keccak256(ethers.toUtf8Bytes("top-contributor"));

  it("should verify a contributor", async function () {
    const { reputation } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();
    const addr = await contributor.getAddress();

    await reputation.verifyContributor(addr, IDENTITY_HASH);
    const profile = await reputation.getContributorProfile(addr);

    expect(profile.identityHash).to.equal(IDENTITY_HASH);
    expect(profile.totalPoints).to.equal(0);
    expect(profile.contributionCount).to.equal(0);
  });

  it("should reject duplicate verification", async function () {
    const { reputation } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();
    const addr = await contributor.getAddress();

    await reputation.verifyContributor(addr, IDENTITY_HASH);
    await expect(
      reputation.verifyContributor(addr, IDENTITY_HASH)
    ).to.be.reverted;
  });

  it("should award points to verified contributor", async function () {
    const { reputation } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();
    const addr = await contributor.getAddress();

    await reputation.verifyContributor(addr, IDENTITY_HASH);
    await reputation.awardPoints(addr, 100, "completed bounties");

    expect(await reputation.getTotalPoints(addr)).to.equal(100);
    expect(await reputation.getContributionCount(addr)).to.equal(1);
  });

  it("should reject awarding points to unverified contributor", async function () {
    const { reputation } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();

    await expect(
      reputation.awardPoints(await contributor.getAddress(), 100, "test")
    ).to.be.reverted;
  });

  it("should issue a badge with expiry", async function () {
    const { reputation } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();
    const addr = await contributor.getAddress();

    await reputation.verifyContributor(addr, IDENTITY_HASH);

    const futureExpiry = Math.floor(Date.now() / 1000) + 365 * 86400;
    await reputation.issueBadge(addr, BADGE_ID, futureExpiry);

    expect(await reputation.hasBadge(addr, BADGE_ID)).to.be.true;
  });

  it("should report expired badge correctly", async function () {
    const { reputation } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();
    const addr = await contributor.getAddress();

    await reputation.verifyContributor(addr, IDENTITY_HASH);
    await reputation.issueBadge(addr, BADGE_ID, 1);

    expect(await reputation.hasBadge(addr, BADGE_ID)).to.be.false;
  });

  it("should reject non-owner operations", async function () {
    const { reputation } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();

    await expect(
      reputation.connect(contributor).verifyContributor(
        await contributor.getAddress(),
        IDENTITY_HASH
      )
    ).to.be.reverted;
  });
});
