# Deployment Guide

## Prerequisites

1. Node.js >= 18
2. npm >= 9
3. RPC endpoint (Alchemy, Infura, or QuickNode)
4. Deployer wallet with native gas tokens
5. Block explorer API key (for verification)

## Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Private key (NEVER share this)
PRIVATE_KEY_DEPLOYER=0x...

# Block explorer API keys
ETHERSCAN_API_KEY=YOUR_KEY
```

## Network Configuration

### Supported Networks

| Network | Chain ID | Block Explorer |
|---------|----------|----------------|
| Ethereum | 1 | etherscan.io |
| Sepolia | 11155111 | sepolia.etherscan.io |
| Polygon | 137 | polygonscan.com |
| Amoy | 80002 | amoy.polygonscan.com |
| Arbitrum | 42161 | arbiscan.io |
| Arbitrum Sepolia | 421614 | sepolia.arbiscan.io |

### Adding a New Network

Edit `hardhat.config.ts`:

```typescript
polygon: {
  url: process.env.POLYGON_RPC_URL,
  accounts: [PRIVATE_KEY_DEPLOYER],
  chainId: 137,
},
```

## Deployment Steps

### 1. Local Testing

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy/deploy-all.ts --network localhost
```

### 2. Testnet Deployment

```bash
npm run deploy:all -- sepolia
```

### 3. Mainnet Deployment

```bash
npm run deploy:all -- ethereum
```

## Verification

After deployment, contracts are verified automatically if `DEPLOY_VERIFY=true`.

To verify manually:

```bash
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

## Deployed Contract Addresses

| Contract | Address | Network |
|----------|---------|---------|
| WaveEscrow | `0x...` | Sepolia |
| WaveReputation | `0x...` | Sepolia |
| WaveScoping | `0x...` | Sepolia |
| RewardSplitter | `0x...` | Sepolia |
