import { task, types } from "hardhat/config";
import { info, success, error } from "../scripts/utils/logger";

task("splitter:configure", "Configure payout split for the caller")
  .addParam("splitter", "RewardSplitter contract address")
  .addParam("savings", "Savings vault address")
  .addParam("treasury", "Treasury address")
  .addParam("treasuryShare", "Treasury share in basis points", 500, types.int)
  .addParam("savingsShare", "Savings share in basis points", 2000, types.int)
  .setAction(async (args, hre) => {
    const [signer] = await hre.ethers.getSigners();
    info("Configuring split", {
      signer: await signer.getAddress(),
      splitter: args.splitter,
    });

    const splitter = await hre.ethers.getContractAt(
      "RewardSplitter",
      args.splitter,
      signer,
    );

    const tx = await splitter.configureSplit(
      args.savings,
      args.treasury,
      args.treasuryShare,
      args.savingsShare,
    );
    await tx.wait();

    success("Split configured", { txHash: tx.hash });
  });

task("splitter:payout", "Execute a payout split for a contributor")
  .addParam("splitter", "RewardSplitter contract address")
  .addParam("contributor", "Contributor address")
  .addParam("amount", "Amount in ETH (will be converted to wei)", "1", types.string)
  .setAction(async (args, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const amount = hre.ethers.parseEther(args.amount);

    info("Executing payout split", {
      from: await signer.getAddress(),
      contributor: args.contributor,
      amount: args.amount,
    });

    const splitter = await hre.ethers.getContractAt(
      "RewardSplitter",
      args.splitter,
      signer,
    );

    const tx = await splitter.splitPayout(args.contributor, { value: amount });
    await tx.wait();

    // Log the config to verify
    const config = await splitter.getSplitConfig(args.contributor);
    success("Payout split executed", {
      txHash: tx.hash,
      savingsVault: config.savingsVault,
      treasury: config.treasury,
      treasuryShare: config.treasuryShare.toString(),
      savingsShare: config.savingsShare.toString(),
    });
  });

task("splitter:pause", "Pause the RewardSplitter (emergency stop)")
  .addParam("splitter", "RewardSplitter contract address")
  .setAction(async (args, hre) => {
    const [signer] = await hre.ethers.getSigners();

    const splitter = await hre.ethers.getContractAt(
      "RewardSplitter",
      args.splitter,
      signer,
    );

    const tx = await splitter.pauseSplitter();
    await tx.wait();

    success("Splitter paused", { txHash: tx.hash });
  });

task("splitter:unpause", "Unpause the RewardSplitter")
  .addParam("splitter", "RewardSplitter contract address")
  .setAction(async (args, hre) => {
    const [signer] = await hre.ethers.getSigners();

    const splitter = await hre.ethers.getContractAt(
      "RewardSplitter",
      args.splitter,
      signer,
    );

    const tx = await splitter.unpauseSplitter();
    await tx.wait();

    success("Splitter unpaused", { txHash: tx.hash });
  });

task("splitter:config", "View a contributor's split config")
  .addParam("splitter", "RewardSplitter contract address")
  .addParam("contributor", "Contributor address")
  .setAction(async (args, hre) => {
    const splitter = await hre.ethers.getContractAt(
      "RewardSplitter",
      args.splitter,
    );

    const config = await splitter.getSplitConfig(args.contributor);
    const BASIS_POINTS = 10000;

    info("Split config", {
      contributor: args.contributor,
      savingsVault: config.savingsVault,
      treasury: config.treasury,
      treasuryShare: `${config.treasuryShare} bp (${Number(config.treasuryShare) / 100}%)`,
      savingsShare: `${config.savingsShare} bp (${Number(config.savingsShare) / 100}%)`,
      contributorShare: `${BASIS_POINTS - Number(config.treasuryShare) - Number(config.savingsShare)} bp`,
      active: config.active,
    });
  });
