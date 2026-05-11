import { ethers } from "hardhat";
import { info, success, header } from "../utils/logger";

async function main(): Promise<void> {
  header("Deploying WaveReputation");

  const [deployer] = await ethers.getSigners();
  info("Deployer", { address: deployer.address });

  const balance = await ethers.provider.getBalance(deployer.address);
  info("Deployer balance", { balance: ethers.formatEther(balance) });

  const WaveReputation = await ethers.getContractFactory("WaveReputation");
  const reputation = await WaveReputation.deploy();
  await reputation.waitForDeployment();

  const repAddress = await reputation.getAddress();
  success("WaveReputation deployed", { address: repAddress });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
