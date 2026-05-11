import { ethers } from "hardhat";
import { info, success, error } from "../utils/logger";

interface SplitConfigParams {
  splitterAddress: string;
  savingsVault: string;
  treasury: string;
  treasuryShare: number;
  savingsShare: number;
  contributorPrivateKey?: string;
}

async function configureSplit(params: SplitConfigParams): Promise<void> {
  const {
    splitterAddress,
    savingsVault,
    treasury,
    treasuryShare,
    savingsShare,
  } = params;

  try {
    let signer: ethers.Signer;
    if (params.contributorPrivateKey) {
      signer = new ethers.Wallet(params.contributorPrivateKey, ethers.provider);
    } else {
      [signer] = await ethers.getSigners();
    }

    const splitter = await ethers.getContractAt(
      "RewardSplitter",
      splitterAddress,
      signer,
    );

    const tx = await splitter.configureSplit(
      savingsVault,
      treasury,
      treasuryShare,
      savingsShare,
    );
    const receipt = await tx.wait();

    info("Split configuration submitted", {
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber,
    });

    const config = await splitter.getSplitConfig(await signer.getAddress());
    success("Split configured", {
      savingsVault: config.savingsVault,
      treasury: config.treasury,
      treasuryShare: config.treasuryShare.toString(),
      savingsShare: config.savingsShare.toString(),
      contributorShare: (
        10000 -
        Number(config.treasuryShare) -
        Number(config.savingsShare)
      ).toString(),
      active: config.active,
    });
  } catch (err) {
    error("Failed to configure split", err);
    throw err;
  }
}

async function main(): Promise<void> {
  const splitterAddress = process.env.SPLITTER_ADDRESS;
  if (!splitterAddress) {
    throw new Error("SPLITTER_ADDRESS environment variable is required");
  }

  const savingsVault = process.env.SAVINGS_VAULT;
  if (!savingsVault) throw new Error("SAVINGS_VAULT is required");

  const treasury = process.env.TREASURY;
  if (!treasury) throw new Error("TREASURY is required");

  const treasuryShare = parseInt(process.env.TREASURY_SHARE || "1000", 10);
  const savingsShare = parseInt(process.env.SAVINGS_SHARE || "2000", 10);

  await configureSplit({
    splitterAddress,
    savingsVault,
    treasury,
    treasuryShare,
    savingsShare,
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

export { configureSplit };
