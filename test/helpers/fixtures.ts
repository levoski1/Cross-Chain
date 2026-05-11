import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  RewardSplitter,
  WaveEscrow,
  WaveReputation,
  WaveScoping,
  MockWave,
} from "../../typechain-types";

export interface DeployedContracts {
  escrow: WaveEscrow;
  reputation: WaveReputation;
  scoping: WaveScoping;
  splitter: RewardSplitter;
  mockWave: MockWave;
}

export async function deployAllContractsFixture(): Promise<DeployedContracts> {
  const [owner] = await ethers.getSigners();

  const WaveEscrowFactory = await ethers.getContractFactory("WaveEscrow");
  const escrow = await WaveEscrowFactory.deploy();
  await escrow.waitForDeployment();

  const WaveReputationFactory = await ethers.getContractFactory("WaveReputation");
  const reputation = await WaveReputationFactory.deploy();
  await reputation.waitForDeployment();

  const WaveScopingFactory = await ethers.getContractFactory("WaveScoping");
  const scoping = await WaveScopingFactory.deploy();
  await scoping.waitForDeployment();

  const RewardSplitterFactory = await ethers.getContractFactory("RewardSplitter");
  const splitter = await RewardSplitterFactory.deploy();
  await splitter.waitForDeployment();

  const MockWaveFactory = await ethers.getContractFactory("MockWave");
  const mockWave = await MockWaveFactory.deploy(await splitter.getAddress());
  await mockWave.waitForDeployment();

  return { escrow, reputation, scoping, splitter, mockWave };
}

export async function getSigners() {
  const [owner, contributor, savingsVault, treasury, voter, proposer] =
    await ethers.getSigners();
  return { owner, contributor, savingsVault, treasury, voter, proposer };
}

export const BASIS_POINTS = 10000;
export const WAVE_DURATION = 7 * 24 * 60 * 60; // 7 days

/**
 * Calculate expected split amounts for test assertions.
 * Matches the on-chain logic in RewardSplitter.
 */
export function calculateSplit(
  total: bigint,
  treasuryShare: number,
  savingsShare: number,
): { forTreasury: bigint; forSavings: bigint; forContributor: bigint } {
  const bp = BigInt(BASIS_POINTS);
  const forTreasury = (total * BigInt(treasuryShare)) / bp;
  const forSavings = (total * BigInt(savingsShare)) / bp;
  const forContributor = total - forTreasury - forSavings;
  return { forTreasury, forSavings, forContributor };
}
