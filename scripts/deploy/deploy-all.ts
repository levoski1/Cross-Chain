import { ethers } from "hardhat";
import { info, success, header, divider } from "../utils/logger";
import { validateEnv } from "../utils/env";

async function main(): Promise<void> {
  // Validate environment before deploying
  validateEnv();

  header("Deploying All Cross-Chain Drips Contracts");

  const [deployer] = await ethers.getSigners();
  info("Deployer", { address: deployer.address });

  const balance = await ethers.provider.getBalance(deployer.address);
  info("Deployer balance", { balance: ethers.formatEther(balance) });

  divider();

  // ── Phase 1: WaveEscrow ──
  info("Phase 1: Deploying WaveEscrow");
  const WaveEscrow = await ethers.getContractFactory("WaveEscrow");
  const escrow = await WaveEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  success("WaveEscrow deployed", { address: escrowAddress });

  divider();

  // ── Phase 2: WaveReputation ──
  info("Phase 2: Deploying WaveReputation");
  const WaveReputation = await ethers.getContractFactory("WaveReputation");
  const reputation = await WaveReputation.deploy();
  await reputation.waitForDeployment();
  const repAddress = await reputation.getAddress();
  success("WaveReputation deployed", { address: repAddress });

  divider();

  // ── Phase 3: WaveScoping ──
  info("Phase 3: Deploying WaveScoping");
  const WaveScoping = await ethers.getContractFactory("WaveScoping");
  const scoping = await WaveScoping.deploy();
  await scoping.waitForDeployment();
  const scopingAddress = await scoping.getAddress();
  success("WaveScoping deployed", { address: scopingAddress });

  divider();

  // ── Phase 4: RewardSplitter ──
  info("Phase 4: Deploying RewardSplitter");
  const RewardSplitter = await ethers.getContractFactory("RewardSplitter");
  const splitter = await RewardSplitter.deploy();
  await splitter.waitForDeployment();
  const splitterAddress = await splitter.getAddress();
  success("RewardSplitter deployed", { address: splitterAddress });

  divider();

  // ── Summary ──
  header("Deployment Summary");
  info("WaveEscrow", { address: escrowAddress });
  info("WaveReputation", { address: repAddress });
  info("WaveScoping", { address: scopingAddress });
  info("RewardSplitter", { address: splitterAddress });

  const totalGas = await ethers.provider.getBalance(deployer.address);
  const spent = balance - totalGas;
  success("Deployment complete", {
    ethSpent: ethers.formatEther(spent),
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
