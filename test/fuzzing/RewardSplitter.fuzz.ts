import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  deployAllContractsFixture,
  getSigners,
  BASIS_POINTS,
  calculateSplit,
} from "../helpers/fixtures";

describe("RewardSplitter Fuzzing", function () {
  /**
   * Property: For any combination of valid shares and amounts,
   * the sum of all three split outputs must equal the input amount.
   */
  it("should never create or destroy value (conservation property)", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury, owner } = await getSigners();

    const testCases = [
      { ts: 0, ss: 0 },
      { ts: 500, ss: 500 },
      { ts: 1000, ss: 2000 }, // 70/20/10
      { ts: 0, ss: 9000 },
      { ts: 2500, ss: 7500 },
      { ts: 100, ss: 500 },
      { ts: 2000, ss: 3000 },
    ];

    const testAmounts = [
      ethers.parseEther("0.001"),
      ethers.parseEther("1"),
      ethers.parseEther("100"),
      ethers.parseEther("10000"),
      ethers.parseEther("1234.5678"),
    ];

    for (const { ts, ss } of testCases) {
      for (const amount of testAmounts) {
        const totalBefore =
          (await ethers.provider.getBalance(await treasury.getAddress())) +
          (await ethers.provider.getBalance(await savingsVault.getAddress())) +
          (await ethers.provider.getBalance(await contributor.getAddress()));

        await splitter
          .connect(contributor)
          .configureSplit(
            await savingsVault.getAddress(),
            await treasury.getAddress(),
            ts,
            ss,
          );

        await splitter.connect(owner).splitPayout(await contributor.getAddress(), {
          value: amount,
        });

        const totalAfter =
          (await ethers.provider.getBalance(await treasury.getAddress())) +
          (await ethers.provider.getBalance(await savingsVault.getAddress())) +
          (await ethers.provider.getBalance(await contributor.getAddress()));

        expect(totalAfter - totalBefore).to.equal(amount);
      }
    }
  });

  /**
   * Property: For any valid config, the treasury should receive
   * exactly (amount * treasuryShare / 10000).
   */
  it("should distribute treasury share proportionally", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury, owner } = await getSigners();

    const testShares = [0, 100, 500, 1000, 2500];
    const savingsShare = 1000;
    const depositAmount = ethers.parseEther("100");

    for (const ts of testShares) {
      await splitter
        .connect(contributor)
        .configureSplit(
          await savingsVault.getAddress(),
          await treasury.getAddress(),
          ts,
          savingsShare,
        );

      const treasuryBefore = await ethers.provider.getBalance(
        await treasury.getAddress(),
      );

      await splitter.connect(owner).splitPayout(await contributor.getAddress(), {
        value: depositAmount,
      });

      const treasuryAfter = await ethers.provider.getBalance(
        await treasury.getAddress(),
      );

      const expected = (depositAmount * BigInt(ts)) / BigInt(BASIS_POINTS);
      expect(treasuryAfter - treasuryBefore).to.equal(expected);
    }
  });

  /**
   * Property: The contract should handle multiple consecutive payouts
   * without state corruption.
   */
  it("should handle multiple consecutive splits without state corruption", async function () {
    const { splitter } = await loadFixture(deployAllContractsFixture);
    const { contributor, savingsVault, treasury, owner } = await getSigners();

    const treasuryShare = 1000;
    const savingsShare = 2000;

    await splitter
      .connect(contributor)
      .configureSplit(
        await savingsVault.getAddress(),
        await treasury.getAddress(),
        treasuryShare,
        savingsShare,
      );

    const numSplits = 20;
    const perSplit = ethers.parseEther("10");
    const total = perSplit * BigInt(numSplits);

    const { forTreasury: expectedTreasury } = calculateSplit(
      total,
      treasuryShare,
      savingsShare,
    );

    const treasuryBefore = await ethers.provider.getBalance(
      await treasury.getAddress(),
    );

    for (let i = 0; i < numSplits; i++) {
      await splitter.connect(owner).splitPayout(await contributor.getAddress(), {
        value: perSplit,
      });
    }

    const treasuryAfter = await ethers.provider.getBalance(
      await treasury.getAddress(),
    );

    expect(treasuryAfter - treasuryBefore).to.equal(expectedTreasury);
  });
});
