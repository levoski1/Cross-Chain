import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployAllContractsFixture,
  getSigners,
  BASIS_POINTS,
  calculateSplit,
} from "../helpers/fixtures";

describe("RewardSplitter", function () {
  // ── Deployment ──────────────────────────────────────────────

  it("should deploy with owner and not paused", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { owner } = await getSigners();

    expect(await splitter.owner()).to.equal(await owner.getAddress());
    expect(await splitter.isPaused()).to.be.false;
  });

  it("should support Ownable2Step ownership transfer", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { owner, contributor } = await getSigners();
    const ownerAddr = await owner.getAddress();
    const newOwnerAddr = await contributor.getAddress();

    // Start transfer
    await splitter.transferOwnership(newOwnerAddr);
    expect(await splitter.pendingOwner()).to.equal(newOwnerAddr);

    // Old owner still has control until accept
    expect(await splitter.owner()).to.equal(ownerAddr);

    // New owner accepts
    await splitter.connect(contributor).acceptOwnership();
    expect(await splitter.owner()).to.equal(newOwnerAddr);
  });

  // ── Configuration ────────────────────────────────────────────

  it("should configure split with both shares", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury } = await getSigners();

    const treasuryShare = 1000; // 10%
    const savingsShare = 2000; // 20%

    await splitter
      .connect(contributor)
      .configureSplit(
        await savingsVault.getAddress(),
        await treasury.getAddress(),
        treasuryShare,
        savingsShare,
      );

    const config = await splitter.getSplitConfig(await contributor.getAddress());
    expect(config.savingsVault).to.equal(await savingsVault.getAddress());
    expect(config.treasury).to.equal(await treasury.getAddress());
    expect(config.treasuryShare).to.equal(treasuryShare);
    expect(config.savingsShare).to.equal(savingsShare);
    expect(config.active).to.be.true;
  });

  it("should reject treasury share > 25%", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury } = await getSigners();

    await expect(
      splitter
        .connect(contributor)
        .configureSplit(
          await savingsVault.getAddress(),
          await treasury.getAddress(),
          2600, // 26% — exceeds max 25%
          1000,
        ),
    ).to.be.reverted;
  });

  it("should reject combined shares exceeding 100%", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury } = await getSigners();

    await expect(
      splitter
        .connect(contributor)
        .configureSplit(
          await savingsVault.getAddress(),
          await treasury.getAddress(),
          5000, // 50%
          6000, // 60% → total 110% > 100%
        ),
    ).to.be.reverted;
  });

  it("should reject zero addresses in config", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, treasury } = await getSigners();
    const validAddr = await treasury.getAddress();

    await expect(
      splitter
        .connect(contributor)
        .configureSplit(ethers.ZeroAddress, validAddr, 500, 1000),
    ).to.be.reverted;

    await expect(
      splitter
        .connect(contributor)
        .configureSplit(validAddr, ethers.ZeroAddress, 500, 1000),
    ).to.be.reverted;
  });

  // ── Payout Splitting ────────────────────────────────────────

  it("should split payout correctly (70/20/10 example)", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury, owner } = await getSigners();

    const treasuryShare = 1000; // 10%
    const savingsShare = 2000; // 20%
    // contributorShare = 10000 - 1000 - 2000 = 7000 (70%)
    const depositAmount = ethers.parseEther("100");

    await splitter
      .connect(contributor)
      .configureSplit(
        await savingsVault.getAddress(),
        await treasury.getAddress(),
        treasuryShare,
        savingsShare,
      );

    const { forTreasury, forSavings, forContributor } = calculateSplit(
      depositAmount,
      treasuryShare,
      savingsShare,
    );

    await splitter.connect(owner).splitPayout(await contributor.getAddress(), {
      value: depositAmount,
    });

    expect(
      await ethers.provider.getBalance(await treasury.getAddress()),
    ).to.equal(forTreasury);
    expect(
      await ethers.provider.getBalance(await savingsVault.getAddress()),
    ).to.equal(forSavings);
    expect(
      await ethers.provider.getBalance(await contributor.getAddress()),
    ).to.equal(forContributor);
  });

  it("should handle 0% treasury + 100% contributor", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury, owner } = await getSigners();
    const depositAmount = ethers.parseEther("10");

    await splitter
      .connect(contributor)
      .configureSplit(
        await savingsVault.getAddress(),
        await treasury.getAddress(),
        0, // 0% treasury
        0, // 0% savings → 100% to contributor
      );

    const balBefore = await ethers.provider.getBalance(
      await contributor.getAddress(),
    );

    await splitter.connect(owner).splitPayout(await contributor.getAddress(), {
      value: depositAmount,
    });

    const balAfter = await ethers.provider.getBalance(
      await contributor.getAddress(),
    );
    expect(balAfter - balBefore).to.equal(depositAmount);
  });

  // ── Access Control ──────────────────────────────────────────

  it("should reject split without config", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, owner } = await getSigners();

    await expect(
      splitter.connect(owner).splitPayout(await contributor.getAddress(), {
        value: ethers.parseEther("1"),
      }),
    ).to.be.reverted;
  });

  it("should pause and unpause", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { owner } = await getSigners();

    await splitter.connect(owner).pauseSplitter();
    expect(await splitter.isPaused()).to.be.true;

    await splitter.connect(owner).unpauseSplitter();
    expect(await splitter.isPaused()).to.be.false;
  });

  it("should reject payouts when paused", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury, owner } = await getSigners();

    await splitter
      .connect(contributor)
      .configureSplit(
        await savingsVault.getAddress(),
        await treasury.getAddress(),
        500,
        1000,
      );

    await splitter.connect(owner).pauseSplitter();

    await expect(
      splitter.connect(owner).splitPayout(await contributor.getAddress(), {
        value: ethers.parseEther("1"),
      }),
    ).to.be.reverted;
  });

  it("should reject non-owner pause", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();

    await expect(splitter.connect(contributor).pauseSplitter()).to.be.reverted;
  });
});
