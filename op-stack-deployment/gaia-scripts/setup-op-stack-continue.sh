#!/bin/bash
set -e

# ========================================
# Gaia Protocol OP Stack Setup - Continuation
# ========================================

echo "=========================================="
echo "Continuing OP Stack Setup"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
source "$PROJECT_ROOT/.envrc"

# Step 4: Install op-geth
echo ""
echo "=========================================="
echo "Step 4: Installing op-geth"
echo "=========================================="

cd "$PROJECT_ROOT"
if [ ! -d "op-geth" ]; then
    echo "Cloning op-geth (this may take 5 minutes)..."
    git clone https://github.com/ethereum-optimism/op-geth.git
    cd op-geth
    git checkout v1.101308.2
    echo "Building op-geth (this may take 5-10 minutes)..."
    make geth
    echo "✅ op-geth installed"
else
    echo "✅ op-geth already installed"
    cd op-geth
fi

# Step 5: Create Deployment Configuration
echo ""
echo "=========================================="
echo "Step 5: Creating Deployment Configuration"
echo "=========================================="

cd "$PROJECT_ROOT"
mkdir -p gaia-config

# Generate deployment config from template
TIMESTAMP=$(date +%s)
sed -e "s/\${ADMIN_ADDRESS}/$ADMIN_ADDRESS/g" \
    -e "s/\${BATCHER_ADDRESS}/$BATCHER_ADDRESS/g" \
    -e "s/\${PROPOSER_ADDRESS}/$PROPOSER_ADDRESS/g" \
    -e "s/\${SEQUENCER_ADDRESS}/$SEQUENCER_ADDRESS/g" \
    -e "s/\${TIMESTAMP}/$TIMESTAMP/g" \
    "$PROJECT_ROOT/gaia-config/deploy-config-template.json" > "$PROJECT_ROOT/gaia-config/deploy-config.json"

echo "✅ Deployment configuration created"

# Step 6: Deploy L1 Contracts
echo ""
echo "=========================================="
echo "Step 6: Deploying L1 Contracts to Celo Sepolia"
echo "=========================================="

cd "$PROJECT_ROOT/optimism/packages/contracts-bedrock"

echo "Deploying contracts (this may take 10-15 minutes)..."
forge script scripts/Deploy.s.sol:Deploy \
    --rpc-url $L1_RPC_URL \
    --private-key $ADMIN_PRIVATE_KEY \
    --broadcast \
    --verify \
    --slow

echo "✅ L1 contracts deployed"

# Step 7: Generate L2 Genesis
echo ""
echo "=========================================="
echo "Step 7: Generating L2 Genesis"
echo "=========================================="

cd "$PROJECT_ROOT/optimism"

echo "Generating L2 genesis (this may take 5 minutes)..."
go run ./op-node/cmd/genesis/main.go \
    --l1-rpc $L1_RPC_URL \
    --deploy-config "$PROJECT_ROOT/gaia-config/deploy-config.json" \
    --outfile "$PROJECT_ROOT/gaia-data/genesis.json"

echo "✅ L2 genesis generated"

# Step 8: Initialize op-geth
echo ""
echo "=========================================="
echo "Step 8: Initializing op-geth"
echo "=========================================="

cd "$PROJECT_ROOT/op-geth"

echo "Initializing op-geth..."
./build/bin/geth init \
    --datadir "$PROJECT_ROOT/gaia-data/geth-data" \
    "$PROJECT_ROOT/gaia-data/genesis.json"

echo "✅ op-geth initialized"

echo ""
echo "=========================================="
echo "✅ OP Stack Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Start L2 services:"
echo "   ./gaia-scripts/start-all.sh"
echo ""
echo "2. Check service status:"
echo "   ./gaia-scripts/check-status.sh"
echo ""
echo "3. Deploy Gaia contracts to L2:"
echo "   ./gaia-scripts/deploy-gaia-contracts.sh"
echo ""
