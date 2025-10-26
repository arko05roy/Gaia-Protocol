#!/bin/bash
set -e

# ========================================
# Gaia Protocol OP Stack Setup Script
# L1: Celo Sepolia (Chain ID: 11142220)
# ========================================

echo "=========================================="
echo "Gaia Protocol OP Stack Setup"
echo "L1: Celo Sepolia"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if .envrc exists
if [ ! -f "$PROJECT_ROOT/.envrc" ]; then
    echo "❌ Error: .envrc file not found!"
    echo "Please copy .envrc.example to .envrc and configure it"
    exit 1
fi

# Load environment variables
source "$PROJECT_ROOT/.envrc"

# Verify required variables
if [ -z "$ADMIN_ADDRESS" ] || [ "$ADMIN_ADDRESS" == "0x0000000000000000000000000000000000000000" ]; then
    echo "❌ Error: ADMIN_ADDRESS not configured in .envrc"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "Admin: $ADMIN_ADDRESS"
echo "Batcher: $BATCHER_ADDRESS"
echo "Proposer: $PROPOSER_ADDRESS"
echo "Sequencer: $SEQUENCER_ADDRESS"
echo ""

# Check account balances
echo "Checking account balances on Celo Sepolia..."
ADMIN_BAL=$(cast balance $ADMIN_ADDRESS --rpc-url $L1_RPC_URL 2>/dev/null || echo "0")
BATCHER_BAL=$(cast balance $BATCHER_ADDRESS --rpc-url $L1_RPC_URL 2>/dev/null || echo "0")
PROPOSER_BAL=$(cast balance $PROPOSER_ADDRESS --rpc-url $L1_RPC_URL 2>/dev/null || echo "0")
SEQUENCER_BAL=$(cast balance $SEQUENCER_ADDRESS --rpc-url $L1_RPC_URL 2>/dev/null || echo "0")

echo "Admin: $(cast to-unit $ADMIN_BAL ether 2>/dev/null || echo "0") CELO"
echo "Batcher: $(cast to-unit $BATCHER_BAL ether 2>/dev/null || echo "0") CELO"
echo "Proposer: $(cast to-unit $PROPOSER_BAL ether 2>/dev/null || echo "0") CELO"
echo "Sequencer: $(cast to-unit $SEQUENCER_BAL ether 2>/dev/null || echo "0") CELO"
echo ""

# Warn if balances are low
if [ "$ADMIN_BAL" == "0" ]; then
    echo "⚠️  Warning: Admin account has no balance!"
    echo "Please fund $ADMIN_ADDRESS with at least 10 CELO"
    read -p "Press ENTER to continue anyway or Ctrl+C to exit..."
fi

# Step 1: Clone OP Stack
echo ""
echo "=========================================="
echo "Step 1: Cloning OP Stack Repository"
echo "=========================================="

cd "$PROJECT_ROOT"
if [ ! -d "optimism" ]; then
    mkdir -p optimism
    cd optimism
    echo "Cloning Optimism monorepo..."
    git clone https://github.com/ethereum-optimism/optimism.git .
    git checkout v1.7.0
    echo "✅ OP Stack cloned"
else
    echo "✅ OP Stack already cloned"
    cd optimism
fi

# Step 2: Install Dependencies
echo ""
echo "=========================================="
echo "Step 2: Installing Dependencies"
echo "=========================================="

if [ ! -d "node_modules" ]; then
    echo "Installing pnpm dependencies (this may take 10-15 minutes)..."
    pnpm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Step 3: Build OP Stack Components
echo ""
echo "=========================================="
echo "Step 3: Building OP Stack Components"
echo "=========================================="

if [ ! -f "op-node/bin/op-node" ]; then
    echo "Building op-node, op-batcher, op-proposer (this may take 15-20 minutes)..."
    make op-node op-batcher op-proposer
    chmod +x op-node/bin/op-node
    chmod +x op-batcher/bin/op-batcher
    chmod +x op-proposer/bin/op-proposer
    echo "✅ OP Stack components built"
else
    echo "✅ OP Stack components already built"
fi

# Step 4: Install op-geth
echo ""
echo "=========================================="
echo "Step 4: Installing op-geth"
echo "=========================================="

cd "$PROJECT_ROOT"
if [ ! -d "op-geth" ]; then
    echo "Cloning op-geth..."
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

cd optimism/packages/contracts-bedrock

# Copy deployment config
mkdir -p deploy-config
cp ../../gaia-config/deploy-config.json deploy-config/gaia-celo-sepolia.json

# Create .env for deployment
cat > .env << EOF
PRIVATE_KEY=$ADMIN_PRIVATE_KEY
L1_RPC_URL=$L1_RPC_URL
DEPLOYMENT_CONTEXT=gaia-celo-sepolia
IMPL_SALT=$IMPL_SALT
EOF

echo "Deploying L1 contracts (this may take 10-15 minutes)..."
echo "This will deploy ~30 contracts to Celo Sepolia"
echo ""

forge script scripts/Deploy.s.sol:Deploy \
  --private-key $ADMIN_PRIVATE_KEY \
  --broadcast \
  --rpc-url $L1_RPC_URL \
  --slow \
  --legacy || {
    echo "❌ L1 contract deployment failed!"
    echo "Check that:"
    echo "  1. Admin account has sufficient CELO"
    echo "  2. L1_RPC_URL is accessible"
    echo "  3. Private key is correct"
    exit 1
}

echo "✅ L1 contracts deployed"

# Extract contract addresses
DEPLOYMENT_DIR="deployments/gaia-celo-sepolia"
if [ ! -f "$DEPLOYMENT_DIR/.deploy" ]; then
    echo "❌ Deployment artifacts not found!"
    exit 1
fi

export OPTIMISM_PORTAL=$(jq -r '.OptimismPortalProxy' $DEPLOYMENT_DIR/.deploy)
export L2_OUTPUT_ORACLE=$(jq -r '.L2OutputOracleProxy' $DEPLOYMENT_DIR/.deploy)
export SYSTEM_CONFIG=$(jq -r '.SystemConfigProxy' $DEPLOYMENT_DIR/.deploy)
export L1_STANDARD_BRIDGE=$(jq -r '.L1StandardBridgeProxy' $DEPLOYMENT_DIR/.deploy)
export L1_CROSS_DOMAIN_MESSENGER=$(jq -r '.L1CrossDomainMessengerProxy' $DEPLOYMENT_DIR/.deploy)
export L1_ERC721_BRIDGE=$(jq -r '.L1ERC721BridgeProxy' $DEPLOYMENT_DIR/.deploy)
export ADDRESS_MANAGER=$(jq -r '.AddressManager' $DEPLOYMENT_DIR/.deploy)

echo ""
echo "L1 Contract Addresses:"
echo "OptimismPortal: $OPTIMISM_PORTAL"
echo "L2OutputOracle: $L2_OUTPUT_ORACLE"
echo "SystemConfig: $SYSTEM_CONFIG"
echo "L1StandardBridge: $L1_STANDARD_BRIDGE"
echo ""

# Save contract addresses
cd ../../..
cat > gaia-config/contract-addresses.json << EOF
{
  "OptimismPortal": "$OPTIMISM_PORTAL",
  "L2OutputOracle": "$L2_OUTPUT_ORACLE",
  "SystemConfig": "$SYSTEM_CONFIG",
  "L1StandardBridge": "$L1_STANDARD_BRIDGE",
  "L1CrossDomainMessenger": "$L1_CROSS_DOMAIN_MESSENGER",
  "L1ERC721Bridge": "$L1_ERC721_BRIDGE",
  "AddressManager": "$ADDRESS_MANAGER"
}
EOF

echo "✅ Contract addresses saved to gaia-config/contract-addresses.json"

# Step 7: Generate L2 Genesis
echo ""
echo "=========================================="
echo "Step 7: Generating L2 Genesis & Rollup Config"
echo "=========================================="

cd optimism/op-node

go run cmd/main.go genesis l2 \
  --deploy-config ../packages/contracts-bedrock/deploy-config/gaia-celo-sepolia.json \
  --l1-deployments ../packages/contracts-bedrock/deployments/gaia-celo-sepolia/.deploy \
  --outfile.l2 ../../gaia-config/genesis-l2.json \
  --outfile.rollup ../../gaia-config/rollup.json \
  --l1-rpc $L1_RPC_URL || {
    echo "❌ Genesis generation failed!"
    exit 1
}

echo "✅ L2 genesis created"
echo "✅ Rollup config created"

# Add pre-funded accounts to genesis
cd ../..
echo "Adding pre-funded accounts to genesis..."

jq \
  --arg admin "$ADMIN_ADDRESS" \
  --arg batcher "$BATCHER_ADDRESS" \
  --arg proposer "$PROPOSER_ADDRESS" \
  --arg sequencer "$SEQUENCER_ADDRESS" \
  '.alloc += {
    ($admin): {"balance": "0x21E19E0C9BAB2400000"},
    ($batcher): {"balance": "0x21E19E0C9BAB2400000"},
    ($proposer): {"balance": "0x21E19E0C9BAB2400000"},
    ($sequencer): {"balance": "0x21E19E0C9BAB2400000"}
  }' gaia-config/genesis-l2.json > gaia-config/genesis-l2-funded.json

mv gaia-config/genesis-l2.json gaia-config/genesis-l2-original.json
mv gaia-config/genesis-l2-funded.json gaia-config/genesis-l2.json

echo "✅ Pre-funded accounts added"

# Step 8: Initialize op-geth
echo ""
echo "=========================================="
echo "Step 8: Initializing op-geth"
echo "=========================================="

mkdir -p gaia-data/geth-data

cd op-geth

./build/bin/geth init \
  --datadir=../gaia-data/geth-data \
  --state.scheme=hash \
  ../gaia-config/genesis-l2.json || {
    echo "❌ op-geth initialization failed!"
    exit 1
}

echo "✅ op-geth initialized"

# Generate JWT secret
cd ..
openssl rand -hex 32 > gaia-data/jwt-secret.txt
chmod 600 gaia-data/jwt-secret.txt

echo "✅ JWT secret created"

# Step 9: Create Startup Scripts
echo ""
echo "=========================================="
echo "Step 9: Creating Service Startup Scripts"
echo "=========================================="

# Create start-geth.sh
cat > gaia-data/start-geth.sh << 'EOFGETH'
#!/bin/bash
cd $(dirname "$0")
exec ../op-geth/build/bin/geth \
  --datadir=./geth-data \
  --http \
  --http.addr=0.0.0.0 \
  --http.port=8545 \
  --http.api=web3,eth,debug,txpool,net,engine \
  --http.corsdomain="*" \
  --http.vhosts="*" \
  --ws \
  --ws.addr=0.0.0.0 \
  --ws.port=8546 \
  --ws.api=web3,eth,debug,txpool,net,engine \
  --ws.origins="*" \
  --authrpc.addr=0.0.0.0 \
  --authrpc.port=8551 \
  --authrpc.jwtsecret=./jwt-secret.txt \
  --authrpc.vhosts="*" \
  --networkid=424242 \
  --syncmode=full \
  --gcmode=archive \
  --nodiscover \
  --maxpeers=0 \
  --rollup.disabletxpoolgossip=true \
  --port=30303 \
  --verbosity=3 \
  --metrics \
  --metrics.addr=0.0.0.0 \
  --metrics.port=6060
EOFGETH

chmod +x gaia-data/start-geth.sh
echo "✅ Created start-geth.sh"

# Create start-op-node.sh
cat > gaia-data/start-op-node.sh << EOFNODE
#!/bin/bash
cd \$(dirname "\$0")
exec ../optimism/op-node/bin/op-node \\
  --l1=$L1_RPC_URL \\
  --l2=ws://localhost:8551 \\
  --l2.jwt-secret=./jwt-secret.txt \\
  --rollup.config=../gaia-config/rollup.json \\
  --rpc.addr=0.0.0.0 \\
  --rpc.port=9545 \\
  --p2p.disable \\
  --sequencer.enabled \\
  --sequencer.l1-confs=4 \\
  --verifier.l1-confs=4 \\
  --p2p.sequencer.key=$SEQUENCER_PRIVATE_KEY \\
  --log.level=info \\
  --log.format=text
EOFNODE

chmod +x gaia-data/start-op-node.sh
echo "✅ Created start-op-node.sh"

# Create start-batcher.sh
cat > gaia-data/start-batcher.sh << EOFBATCHER
#!/bin/bash
cd \$(dirname "\$0")
exec ../optimism/op-batcher/bin/op-batcher \\
  --l1-eth-rpc=$L1_RPC_URL \\
  --l2-eth-rpc=http://localhost:8545 \\
  --rollup-rpc=http://localhost:9545 \\
  --poll-interval=1s \\
  --sub-safety-margin=6 \\
  --num-confirmations=1 \\
  --safe-abort-nonce-too-low-count=3 \\
  --resubmission-timeout=30s \\
  --rpc.addr=0.0.0.0 \\
  --rpc.port=8548 \\
  --rpc.enable-admin \\
  --max-channel-duration=1 \\
  --private-key=$BATCHER_PRIVATE_KEY \\
  --log.level=info \\
  --log.format=text
EOFBATCHER

chmod +x gaia-data/start-batcher.sh
echo "✅ Created start-batcher.sh"

# Create start-proposer.sh
cat > gaia-data/start-proposer.sh << EOFPROPOSER
#!/bin/bash
cd \$(dirname "\$0")
exec ../optimism/op-proposer/bin/op-proposer \\
  --l1-eth-rpc=$L1_RPC_URL \\
  --rollup-rpc=http://localhost:9545 \\
  --l2oo-address=$L2_OUTPUT_ORACLE \\
  --poll-interval=12s \\
  --num-confirmations=1 \\
  --safe-abort-nonce-too-low-count=3 \\
  --resubmission-timeout=30s \\
  --rpc.addr=0.0.0.0 \\
  --rpc.port=8560 \\
  --rpc.enable-admin \\
  --private-key=$PROPOSER_PRIVATE_KEY \\
  --log.level=info \\
  --log.format=text
EOFPROPOSER

chmod +x gaia-data/start-proposer.sh
echo "✅ Created start-proposer.sh"

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start services: ./gaia-scripts/start-all.sh"
echo "2. Check status: ./gaia-scripts/check-status.sh"
echo "3. View logs: tail -f gaia-data/*.log"
echo "4. Deploy Gaia contracts: ./gaia-scripts/deploy-gaia-contracts.sh"
echo ""
echo "L2 RPC URL: http://localhost:8545"
echo "L2 Chain ID: 424242"
echo ""
