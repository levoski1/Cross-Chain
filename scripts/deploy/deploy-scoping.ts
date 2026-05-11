import { ethers } from "hardhat";
import { info, success, header } from "../utils/logger";

async function main(): Promise<void> {
  header("Deploying WaveScoping");

  const [deployer] = await ethers.getSigners();
  info("Deployer", { address: deployer.address });

  const balance = await ethers.provider.getBalance(deployer.address);
  info("Deployer balance", { balance: ethers.formatEther(balance) });

  const WaveScoping = await ethers.getContractFactory("WaveScoping");
  const scoping = await WaveScoping.deploy();
  await scoping.waitForDeployment();

  const scopingAddress = await scoping.getAddress();
  success("WaveScoping deployed", { address: scopingAddress });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
