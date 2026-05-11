import { task, types } from "hardhat/config";
import { info, success } from "../scripts/utils/logger";

task("escrow:create", "Create a new Wave")
  .addParam("escrow", "WaveEscrow contract address")
  .addParam("deadline", "Unix timestamp deadline")
  .setAction(async (args, hre) => {
    const [signer] = await hre.ethers.getSigners();

    const escrow = await hre.ethers.getContractAt(
      "WaveEscrow",
      args.escrow,
      signer,
    );

    const tx = await escrow.createWave(args.deadline);
    await tx.wait();

    const waveId = await escrow.waveCount();
    success("Wave created", {
      waveId: waveId.toString(),
      deadline: args.deadline,
    });
  });

task("escrow:deposit", "Deposit ETH into a Wave")
  .addParam("escrow", "WaveEscrow contract address")
  .addParam("waveid", "Wave ID", 1, types.int)
  .addParam("amount", "Amount in ETH", "1", types.string)
  .setAction(async (args, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const amount = hre.ethers.parseEther(args.amount);

    const escrow = await hre.ethers.getContractAt(
      "WaveEscrow",
      args.escrow,
      signer,
    );

    const tx = await escrow.deposit(args.waveid, { value: amount });
    await tx.wait();

    success("Deposited to Wave", {
      waveId: args.waveid,
      amount: args.amount,
    });
  });

task("escrow:finalize", "Finalize a Wave after deadline")
  .addParam("escrow", "WaveEscrow contract address")
  .addParam("waveid", "Wave ID", 1, types.int)
  .setAction(async (args, hre) => {
    const [signer] = await hre.ethers.getSigners();

    const escrow = await hre.ethers.getContractAt(
      "WaveEscrow",
      args.escrow,
      signer,
    );

    const tx = await escrow.finalizeWave(args.waveid);
    await tx.wait();

    success("Wave finalized", { waveId: args.waveid });
  });

task("escrow:info", "View Wave details")
  .addParam("escrow", "WaveEscrow contract address")
  .addParam("waveid", "Wave ID", 1, types.int)
  .setAction(async (args, hre) => {
    const escrow = await hre.ethers.getContractAt("WaveEscrow", args.escrow);

    const pool = await escrow.getWavePool(args.waveid);
    const finalized = await escrow.isWaveFinalized(args.waveid);

    info("Wave info", {
      waveId: args.waveid,
      totalPool: hre.ethers.formatEther(pool),
      finalized,
    });
  });
