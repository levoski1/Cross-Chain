import { config } from "dotenv";
import { warn, error } from "./logger";

config();

interface EnvCheck {
  key: string;
  required: boolean;
  type: "address" | "key" | "number" | "any";
}

const CHECKS: Record<string, EnvCheck[]> = {
  ethereum: [
    { key: "ETHEREUM_RPC_URL", required: true, type: "any" },
  ],
  sepolia: [
    { key: "SEPOLIA_RPC_URL", required: true, type: "any" },
  ],
  polygon: [
    { key: "POLYGON_RPC_URL", required: true, type: "any" },
  ],
  arbitrum: [
    { key: "ARBITRUM_RPC_URL", required: true, type: "any" },
  ],
  deployment: [
    { key: "PRIVATE_KEY_DEPLOYER", required: true, type: "key" },
  ],
  verification: [
    { key: "ETHERSCAN_API_KEY", required: false, type: "key" },
    { key: "ARBISCAN_API_KEY", required: false, type: "key" },
    { key: "POLYGONSCAN_API_KEY", required: false, type: "key" },
  ],
};

const DEPLOY_NETWORKS = [
  "ethereum", "sepolia",
  "polygon", "amoy",
  "arbitrum", "arbitrumSepolia",
] as const;

type DeployNetwork = (typeof DEPLOY_NETWORKS)[number];

/**
 * Validate that required environment variables are set for a deployment.
 * Prints warnings for missing optional keys, throws for missing required keys.
 */
export function validateEnv(network?: string): void {
  const targetNetwork = network || process.env.DEPLOY_NETWORK || "localhost";

  if (targetNetwork !== "localhost" && targetNetwork !== "hardhat") {
    if (!DEPLOY_NETWORKS.includes(targetNetwork as DeployNetwork)) {
      warn(`Unknown network: ${targetNetwork}. Skipping specific validation.`);
    }

    const networkChecks = CHECKS[targetNetwork] || [];
    const deployChecks = CHECKS.deployment || [];
    const allChecks = [...networkChecks, ...deployChecks];

    for (const check of allChecks) {
      const value = process.env[check.key];
      if (!value) {
        if (check.required) {
          throw new Error(
            `Required env var ${check.key} is not set for network ${targetNetwork}`,
          );
        } else {
          warn(`Optional env var ${check.key} is not set`);
        }
      }
    }
  }

  // Verify private key format if set
  const pk = process.env.PRIVATE_KEY_DEPLOYER;
  if (pk && pk !== "0000000000000000000000000000000000000000000000000000000000000000") {
    if (!/^0x[0-9a-fA-F]{64}$/.test(pk) && !/^[0-9a-fA-F]{64}$/.test(pk)) {
      warn("PRIVATE_KEY_DEPLOYER does not look like a valid private key");
    }
  }
}

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
