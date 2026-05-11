import { ethers } from "hardhat";
import { info, success, header } from "../utils/logger";

async function main(): Promise<void> {
  header("Deploying RewardSplitter");

  const [deployer] = await ethers.getSigners();
  info("Deployer", { address: deployer.address });

  const balance = await ethers.provider.getBalance(deployer.address);
  info("Deployer balance", { balance: ethers.formatEther(balance) });

  const RewardSplitter = await ethers.getContractFactory("RewardSplitter");
  const splitter = await RewardSplitter.deploy();
  await splitter.waitForDeployment();

  const splitterAddress = await splitter.getAddress();
  success("RewardSplitter deployed", { address: splitterAddress });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
