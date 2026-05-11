import { ethers } from "hardhat";
import { info, success, header } from "../utils/logger";

async function main(): Promise<void> {
  header("Deploying WaveEscrow");

  const [deployer] = await ethers.getSigners();
  info("Deployer", { address: deployer.address });

  const balance = await ethers.provider.getBalance(deployer.address);
  info("Deployer balance", { balance: ethers.formatEther(balance) });

  const WaveEscrow = await ethers.getContractFactory("WaveEscrow");
  const escrow = await WaveEscrow.deploy();
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  success("WaveEscrow deployed", { address: escrowAddress });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
