# Gaia Protocol OP Stack L2 - Quick Start Guide

This guide will help you deploy Gaia Protocol on an OP Stack L2 rollup using **Celo Sepolia** as the L1 in under 30 minutes.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js v20+** installed (`node --version`)
- [ ] **Go v1.21+** installed (`go version`)
- [ ] **Foundry** installed (`forge --version`)
- [ ] **pnpm** installed (`pnpm --version`)
- [ ] **jq** installed (`jq --version`)
- [ ] **direnv** installed and configured (`direnv --version`)
- [ ] **Docker** installed and running (`docker --version`)
- [ ] **10-20 CELO** on Celo Sepolia testnet
- [ ] **Celo Sepolia RPC URL** (public or from provider)

## Step 1: Generate Wallets (5 minutes)

```bash
cd op-stack-deployment/gaia-data

# Generate 4 wallets
cast wallet new --json > admin-wallet.json
cast wallet new --json > batcher-wallet.json
cast wallet new --json > proposer-wallet.json
cast wallet new --json > sequencer-wallet.json

# Display addresses
echo "Admin: $(jq -r '.address' admin-wallet.json)"
echo "Batcher: $(jq -r '.address' batcher-wallet.json)"
echo "Proposer: $(jq -r '.address' proposer-wallet.json)"
echo "Sequencer: $(jq -r '.address' sequencer-wallet.json)"
```

**Save these addresses!** You'll need to fund them.

## Step 2: Fund Accounts (5 minutes)

Get Celo Sepolia tokens from: https://faucet.celo.org/sepolia

Fund these amounts:
- **Admin**: 10 CELO (deploys L1 contracts)
- **Batcher**: 5 CELO (submits batches)
- **Proposer**: 5 CELO (submits state roots)
- **Sequencer**: 1 CELO (signs blocks)

Verify balances:
```bash
cast balance ADMIN_ADDRESS --rpc-url https://forno.celo-sepolia.celo-testnet.org/
```

## Step 3: Configure Environment (2 minutes)

```bash
cd op-stack-deployment

# Copy example environment file
cp .envrc.example .envrc

# Edit .envrc with your private keys and addresses
nano .envrc  # or use your preferred editor

# Allow direnv to load environment
direnv allow
```

**Important**: Replace all placeholder values in `.envrc`:
- `ADMIN_PRIVATE_KEY`, `ADMIN_ADDRESS`
- `BATCHER_PRIVATE_KEY`, `BATCHER_ADDRESS`
- `PROPOSER_PRIVATE_KEY`, `PROPOSER_ADDRESS`
- `SEQUENCER_PRIVATE_KEY`, `SEQUENCER_ADDRESS`

## Step 4: Run Automated Setup (60-90 minutes)

This single script does everything:

```bash
# Make script executable
chmod +x gaia-scripts/setup-op-stack.sh

# Run setup (grab a coffee ☕)
./gaia-scripts/setup-op-stack.sh
```

**What this does:**
1. Clones OP Stack repository
2. Installs dependencies
3. Builds op-node, op-batcher, op-proposer
4. Installs op-geth
5. Deploys L1 contracts to Celo Sepolia
6. Generates L2 genesis and rollup config
7. Initializes op-geth
8. Creates startup scripts

**Expected output:**
```
✅ Setup Complete!

Next steps:
1. Start services: ./gaia-scripts/start-all.sh
2. Check status: ./gaia-scripts/check-status.sh
```

## Step 5: Start L2 Services (2 minutes)

```bash
# Make scripts executable
chmod +x gaia-scripts/*.sh

# Start all services
./gaia-scripts/start-all.sh
```

**Services started:**
- `op-geth` (port 8545) - Execution layer
- `op-node` (port 9545) - Consensus layer
- `op-batcher` (port 8548) - Batch submitter
- `op-proposer` (port 8560) - State root proposer

## Step 6: Verify L2 is Running (1 minute)

```bash
# Check service status
./gaia-scripts/check-status.sh

# Check L2 block number
cast block-number --rpc-url http://localhost:8545

# Should return 0 or higher
```

## Step 7: Deploy Gaia Contracts to L2 (5 minutes)

```bash
# Deploy all Gaia Protocol contracts
./gaia-scripts/deploy-gaia-contracts.sh
```

**Contracts deployed:**
- TaskRegistry
- FundingPool
- CollateralManager
- VerificationManager
- CarbonCreditMinter
- CarbonMarketplace
- PredictionMarketplace
- GovernanceDAO
- DataRegistry
- ModelRegistry
- cUSD (mock token)
- Treasury

## Step 8: Update Frontend Configuration (2 minutes)

```bash
# Generate frontend config
./gaia-scripts/update-frontend-config.sh
```

This creates:
- `client/lib/l2-config.ts` - L2 network config and contract addresses
- `DEPLOY_TO_L2_INSTRUCTIONS.md` - Detailed frontend setup guide

## Step 9: Connect Frontend to L2 (5 minutes)

### Add L2 to MetaMask:

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter:
   - **Network Name**: `Gaia L2`
   - **RPC URL**: `http://localhost:8545`
   - **Chain ID**: `424242`
   - **Currency Symbol**: `ETH`

### Update Wagmi Config:

```typescript
// client/app/providers.tsx
import { GAIA_L2_CONFIG } from "@/lib/l2-config";

const gaiaL2 = {
  id: 424242,
  name: "Gaia L2",
  network: "gaia-l2",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] },
    public: { http: ["http://localhost:8545"] },
  },
};

const config = createConfig({
  chains: [gaiaL2],
  // ... rest of config
});
```

### Update Contract Hooks:

```typescript
// Example: client/hooks/useTaskRegistry.ts
import { L2_CONTRACT_ADDRESSES } from "@/lib/l2-config";

const CONTRACT_ADDRESS = L2_CONTRACT_ADDRESSES.TaskRegistry;
```

## Step 10: Start Frontend (1 minute)

```bash
cd ../client
npm run dev
```

Visit http://localhost:3000 and connect with MetaMask!

## 🎉 Success!

Your Gaia Protocol L2 is now running!

**L2 Details:**
- **RPC URL**: http://localhost:8545
- **WebSocket**: ws://localhost:8546
- **Chain ID**: 424242
- **Block Time**: 2 seconds

## Common Commands

```bash
# Check status
./gaia-scripts/check-status.sh

# View logs
tail -f gaia-data/geth.log
tail -f gaia-data/op-node.log

# Stop services
./gaia-scripts/stop-all.sh

# Restart services
./gaia-scripts/stop-all.sh && ./gaia-scripts/start-all.sh

# Send test transaction
cast send --rpc-url http://localhost:8545 \
  --private-key $ADMIN_PRIVATE_KEY \
  --value 1ether \
  RECIPIENT_ADDRESS
```

## Troubleshooting

### Services won't start
```bash
# Check if ports are in use
lsof -i:8545
lsof -i:9545

# Check logs for errors
tail -100 gaia-data/*.log
```

### L1 deployment fails
- Verify admin account has 10+ CELO
- Check L1_RPC_URL is accessible
- Ensure private key is correct (starts with 0x)

### op-node not syncing
- Verify L1_RPC_URL is working
- Check L1 contracts deployed correctly
- Review op-node.log for errors

### MetaMask connection issues
- Ensure services are running
- Verify RPC URL: http://localhost:8545
- Try clearing MetaMask cache

## Next Steps

1. **Bridge Assets**: Bridge tokens from Celo Sepolia to L2
2. **Block Explorer**: Set up Blockscout for L2
3. **Monitoring**: Configure Grafana dashboards
4. **Production**: Deploy to cloud with public RPC endpoints

## Resources

- [Full Documentation](README.md)
- [Frontend Setup Guide](DEPLOY_TO_L2_INSTRUCTIONS.md)
- [OP Stack Docs](https://docs.optimism.io/)
- [Celo Docs](https://docs.celo.org/)

## Need Help?

- Check logs: `tail -f gaia-data/*.log`
- Review status: `./gaia-scripts/check-status.sh`
- Join [Optimism Discord](https://discord.gg/optimism)
- Check [Celo Discord](https://discord.gg/celo)

---

**Total Setup Time**: ~90-120 minutes
**Difficulty**: Intermediate
**Cost**: ~10-20 CELO (testnet tokens, free from faucet)
