import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployAllContractsFixture, getSigners, WAVE_DURATION } from "../helpers/fixtures";
import { advanceToDeadline, getCurrentTimestamp } from "../helpers/time";

describe("WaveEscrow", function () {
  it("should deploy with owner set", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const { owner } = await getSigners();
    expect(await escrow.owner()).to.equal(await owner.getAddress());
  });

  it("should create a wave with valid deadline", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;

    await escrow.createWave(deadline);
    expect(await escrow.waveCount()).to.equal(1);
  });

  it("should reject wave with duration < 1 day", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const now = await getCurrentTimestamp();
    await expect(escrow.createWave(now + 3600)).to.be.reverted;
  });

  it("should accept deposits before deadline", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;

    await escrow.createWave(deadline);
    await escrow.connect(contributor).deposit(1, { value: ethers.parseEther("10") });

    expect(await escrow.getWavePool(1)).to.equal(ethers.parseEther("10"));
  });

  it("should reject deposits after deadline", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;

    await escrow.createWave(deadline);
    await advanceToDeadline(deadline + 1);

    await expect(
      escrow.deposit(1, { value: ethers.parseEther("10") })
    ).to.be.reverted;
  });

  it("should finalize wave after deadline", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;

    await escrow.createWave(deadline);
    await advanceToDeadline(deadline + 1);
    await escrow.finalizeWave(1);

    expect(await escrow.isWaveFinalized(1)).to.be.true;
  });

  it("should reject finalization before deadline", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;

    await escrow.createWave(deadline);
    await expect(escrow.finalizeWave(1)).to.be.reverted;
  });

  it("should allow emergency withdrawal by owner", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const { owner, contributor } = await getSigners();
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;

    await escrow.createWave(deadline);
    await escrow.connect(contributor).deposit(1, { value: ethers.parseEther("10") });

    const balanceBefore = await ethers.provider.getBalance(await owner.getAddress());
    await escrow.emergencyWithdraw(1, await owner.getAddress());
    const balanceAfter = await ethers.provider.getBalance(await owner.getAddress());

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("10"));
  });

  it("should reject non-owner emergency withdrawal", async function () {
    const { escrow } = await loadFixture(deployAllContractsFixture);
    const { contributor } = await getSigners();
    const now = await getCurrentTimestamp();
    const deadline = now + WAVE_DURATION;

    await escrow.createWave(deadline);
    await expect(
      escrow.connect(contributor).emergencyWithdraw(1, await contributor.getAddress())
    ).to.be.reverted;
  });
});
