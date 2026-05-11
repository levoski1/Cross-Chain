import { run } from "hardhat";
import { info, success, error } from "./logger";

interface VerifyParams {
  contractAddress: string;
  constructorArguments: unknown[];
  contract?: string;
}

async function verifyContract(params: VerifyParams): Promise<void> {
  const { contractAddress, constructorArguments, contract } = params;

  try {
    info(`Verifying contract at ${contractAddress}...`);

    await run("verify:verify", {
      address: contractAddress,
      constructorArguments,
      contract,
    });

    success(`Contract verified at ${contractAddress}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("Already Verified")) {
        info(`Contract at ${contractAddress} is already verified`);
        return;
      }
      error(`Verification failed for ${contractAddress}`, err);
    }
    throw err;
  }
}

export { verifyContract };
