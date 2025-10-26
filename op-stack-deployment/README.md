# Gaia Protocol OP Stack L2 Deployment Guide

This directory contains all necessary files and scripts to deploy Gaia Protocol on an OP Stack L2 rollup using **Celo Sepolia** as the L1.

## 📋 Prerequisites

### Required Software
- **git** ^2
- **go** ^1.21
- **node** ^20
- **pnpm** ^8
- **foundry** (forge, cast, anvil)
- **make** ^3
- **jq** ^1.6
- **direnv** ^2
- **Docker** ^24

### Verify Installations
```bash
git --version
go version
node --version
pnpm --version
forge --version
cast --version
make --version
jq --version
direnv --version
docker --version
```

### Required Resources
- **Celo Sepolia Testnet Tokens**: ~10-20 CELO for deployment and operations
  - Get from [Celo Faucet](https://faucet.celo.org/sepolia)
- **L1 RPC URL**: Celo Sepolia RPC endpoint
  - Public: `https://forno.celo-sepolia.celo-testnet.org/`
  - Or use providers like Alchemy, Infura

## 🚀 Quick Start

### Step 1: Generate Accounts

Generate 4 separate accounts for different roles:

```bash
cd gaia-data

# Generate accounts
cast wallet new --json > admin-wallet.json
cast wallet new --json > batcher-wallet.json
cast wallet new --json > proposer-wallet.json
cast wallet new --json > sequencer-wallet.json

# Extract addresses
export ADMIN_ADDRESS=$(jq -r '.address' admin-wallet.json)
export BATCHER_ADDRESS=$(jq -r '.address' batcher-wallet.json)
export PROPOSER_ADDRESS=$(jq -r '.address' proposer-wallet.json)
export SEQUENCER_ADDRESS=$(jq -r '.address' sequencer-wallet.json)

echo "Admin: $ADMIN_ADDRESS"
echo "Batcher: $BATCHER_ADDRESS"
echo "Proposer: $PROPOSER_ADDRESS"
echo "Sequencer: $SEQUENCER_ADDRESS"
```

### Step 2: Fund Accounts

Fund these addresses with Celo Sepolia tokens:
- **Admin**: ~10 CELO (deploys L1 contracts)
- **Batcher**: ~5 CELO (submits batches to L1)
- **Proposer**: ~5 CELO (submits state roots)
- **Sequencer**: ~1 CELO (signs blocks)

Get tokens from: https://faucet.celo.org/sepolia

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .envrc.example .envrc

# Edit .envrc with your private keys and addresses
nano .envrc

# Allow direnv to load environment
direnv allow
```

### Step 4: Run Setup Script

```bash
# Make setup script executable
chmod +x gaia-scripts/setup-op-stack.sh

# Run automated setup
./gaia-scripts/setup-op-stack.sh
```

This script will:
1. Clone and build OP Stack components
2. Deploy L1 contracts to Celo Sepolia
3. Generate L2 genesis and rollup configuration
4. Initialize op-geth
5. Create startup scripts for all services

### Step 5: Start Services

```bash
# Start all services
./gaia-scripts/start-all.sh

# Check status
./gaia-scripts/check-status.sh

# View logs
tail -f gaia-data/geth.log
tail -f gaia-data/op-node.log
tail -f gaia-data/batcher.log
tail -f gaia-data/proposer.log
```

## 📁 Directory Structure

```
op-stack-deployment/
├── .envrc.example          # Environment variables template
├── README.md               # This file
├── gaia-config/            # Configuration files
│   ├── deploy-config.json  # L1 deployment configuration
│   ├── genesis-l2.json     # L2 genesis file (generated)
│   ├── rollup.json         # Rollup configuration (generated)
│   └── contract-addresses.json # Deployed contract addresses
├── gaia-data/              # Chain data and logs
│   ├── geth-data/          # op-geth blockchain data
│   ├── jwt-secret.txt      # JWT secret for auth
│   ├── *.log               # Service logs
│   └── *.pid               # Process IDs
├── gaia-scripts/           # Deployment and management scripts
│   ├── setup-op-stack.sh   # Main setup script
│   ├── start-all.sh        # Start all services
│   ├── stop-all.sh         # Stop all services
│   ├── check-status.sh     # Check service status
│   └── deploy-gaia-contracts.sh # Deploy Gaia contracts to L2
└── optimism/               # OP Stack source code (cloned)
```

## 🔧 Manual Deployment Steps

If you prefer manual control, follow these steps:

### 1. Clone OP Stack

```bash
cd optimism
git clone https://github.com/ethereum-optimism/optimism.git .
git checkout v1.7.0
pnpm install
make op-node op-batcher op-proposer
```

### 2. Deploy L1 Contracts

```bash
cd optimism/packages/contracts-bedrock

# Create deployment config
cp ../../gaia-config/deploy-config.json deploy-config/gaia-celo-sepolia.json

# Deploy
forge script scripts/Deploy.s.sol:Deploy \
  --private-key $ADMIN_PRIVATE_KEY \
  --broadcast \
  --rpc-url $L1_RPC_URL \
  --slow \
  --legacy
```

### 3. Generate L2 Genesis

```bash
cd optimism/op-node

go run cmd/main.go genesis l2 \
  --deploy-config ../packages/contracts-bedrock/deploy-config/gaia-celo-sepolia.json \
  --l1-deployments ../packages/contracts-bedrock/deployments/gaia-celo-sepolia/.deploy \
  --outfile.l2 ../../gaia-config/genesis-l2.json \
  --outfile.rollup ../../gaia-config/rollup.json \
  --l1-rpc $L1_RPC_URL
```

### 4. Initialize op-geth

```bash
# Install op-geth
git clone https://github.com/ethereum-optimism/op-geth.git
cd op-geth
git checkout v1.101308.2
make geth

# Initialize
./build/bin/geth init \
  --datadir=../gaia-data/geth-data \
  --state.scheme=hash \
  ../gaia-config/genesis-l2.json
```

### 5. Start Services

See `gaia-scripts/start-*.sh` scripts for service startup commands.

## 🎯 Deploy Gaia Contracts to L2

Once your L2 is running:

```bash
# Deploy Gaia Protocol contracts to L2
./gaia-scripts/deploy-gaia-contracts.sh
```

This will deploy all Gaia contracts (TaskRegistry, FundingPool, etc.) to your L2.

## 📊 Monitoring

### Check Service Status
```bash
# Check if services are running
ps aux | grep -E "geth|op-node|op-batcher|op-proposer"

# Check L2 block number
cast block-number --rpc-url http://localhost:8545

# Check L1 contract
cast code $OPTIMISM_PORTAL --rpc-url $L1_RPC_URL
```

### View Logs
```bash
# Real-time logs
tail -f gaia-data/*.log

# Specific service
tail -f gaia-data/op-node.log
```

### Test L2 Functionality
```bash
# Send test transaction
cast send --rpc-url http://localhost:8545 \
  --private-key $ADMIN_PRIVATE_KEY \
  --value 0.1ether \
  $BATCHER_ADDRESS

# Check balance
cast balance $BATCHER_ADDRESS --rpc-url http://localhost:8545
```

## 🛠️ Troubleshooting

### Services won't start
- Check logs in `gaia-data/*.log`
- Verify all accounts are funded
- Ensure ports 8545, 8546, 8551, 9545, 8548, 8560 are available

### L1 deployment fails
- Verify you have enough CELO in admin account
- Check L1_RPC_URL is accessible
- Try adding `--legacy` flag for Celo compatibility

### op-node not syncing
- Check L1_RPC_URL connectivity
- Verify L1 contracts are deployed correctly
- Check rollup.json configuration

### Transactions not being batched
- Ensure op-batcher is running
- Check batcher account has CELO for L1 gas
- View batcher logs for errors

## 📚 Additional Resources

- [OP Stack Documentation](https://docs.optimism.io/)
- [Celo Documentation](https://docs.celo.org/)
- [Gaia Protocol Contracts](../web3/contracts/)
- [Optimism Discord](https://discord.gg/optimism)

## ⚠️ Important Notes

1. **Testnet Only**: This setup is for testnet deployment only
2. **Private Keys**: Never commit private keys to version control
3. **Backup**: Save your `.envrc` and wallet JSON files securely
4. **Costs**: Monitor L1 gas costs for batcher and proposer operations
5. **Celo Sepolia**: Uses chainId 11142220, not Alfajores (44787)

## 🔐 Security Checklist

- [ ] Generated unique private keys for all 4 accounts
- [ ] Backed up all wallet files securely
- [ ] Never shared private keys
- [ ] Added `.envrc` to `.gitignore`
- [ ] Using testnet only (not mainnet)
- [ ] Monitoring account balances regularly

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review logs in `gaia-data/`
3. Verify all prerequisites are installed
4. Ensure accounts are properly funded
5. Join Optimism Discord for community support
