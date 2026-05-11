import { ethers } from "hardhat";
import { info, success, error } from "../utils/logger";

async function createWave(escrowAddress: string, deadline: number): Promise<number> {
  try {
    const [signer] = await ethers.getSigners();
    const escrow = await ethers.getContractAt("WaveEscrow", escrowAddress, signer);

    const tx = await escrow.createWave(deadline);
    const receipt = await tx.wait();

    const waveId = await escrow.waveCount();
    success("Wave created", { waveId: waveId.toString(), deadline });

    return Number(waveId);
  } catch (err) {
    error("Failed to create wave", err);
    throw err;
  }
}

async function depositToWave(
  escrowAddress: string,
  waveId: number,
  amount: bigint
): Promise<void> {
  try {
    const [signer] = await ethers.getSigners();
    const escrow = await ethers.getContractAt("WaveEscrow", escrowAddress, signer);

    const tx = await escrow.deposit(waveId, { value: amount });
    await tx.wait();

    success("Deposited to wave", {
      waveId,
      amount: ethers.formatEther(amount),
    });
  } catch (err) {
    error("Failed to deposit", err);
    throw err;
  }
}

interface WaveInfo {
  id: number;
  totalPool: string;
  finalized: boolean;
}

async function getWaveInfo(escrowAddress: string, waveId: number): Promise<WaveInfo> {
  try {
    const [signer] = await ethers.getSigners();
    const escrow = await ethers.getContractAt("WaveEscrow", escrowAddress, signer);

    const pool = await escrow.getWavePool(waveId);
    const finalized = await escrow.isWaveFinalized(waveId);

    return {
      id: waveId,
      totalPool: ethers.formatEther(pool),
      finalized,
    };
  } catch (err) {
    error("Failed to get wave info", err);
    throw err;
  }
}

export { createWave, depositToWave, getWaveInfo };
