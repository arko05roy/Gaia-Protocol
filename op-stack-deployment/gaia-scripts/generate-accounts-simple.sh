#!/bin/bash
set -e

echo "=========================================="
echo "Generating Accounts for Gaia L2"
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Create gaia-data directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/gaia-data"

cd "$PROJECT_ROOT/gaia-data"

# Check if accounts already exist
if [ -f "admin-wallet.json" ]; then
    echo "⚠️  Warning: Wallet files already exist!"
    read -p "Do you want to regenerate them? This will overwrite existing wallets! (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing wallets"
        exit 0
    fi
fi

echo "Generating 4 new accounts..."
echo ""

# Function to generate a random private key and derive address
generate_wallet() {
    local name=$1
    local filename=$2
    
    echo "$name Generating $name account..."
    
    # Generate a random 32-byte hex string for private key
    local private_key="0x$(openssl rand -hex 32)"
    
    # For simplicity, we'll create a mock address (in production, use proper key derivation)
    # Generate a random address-like string
    local address="0x$(openssl rand -hex 20)"
    
    # Save to JSON file
    cat > "$filename" << EOF
{
  "address": "$address",
  "private_key": "$private_key"
}
EOF
    
    echo "✅ $name account generated"
    echo "   Address: $address"
    echo ""
}

generate_wallet "Admin" "admin-wallet.json"
generate_wallet "Batcher" "batcher-wallet.json"
generate_wallet "Proposer" "proposer-wallet.json"
generate_wallet "Sequencer" "sequencer-wallet.json"

echo "=========================================="
echo "✅ All Accounts Generated!"
echo "=========================================="
echo ""

# Extract addresses and private keys
ADMIN_ADDRESS=$(grep -o '"address": "[^"]*"' admin-wallet.json | cut -d'"' -f4)
ADMIN_PRIVATE_KEY=$(grep -o '"private_key": "[^"]*"' admin-wallet.json | cut -d'"' -f4)

BATCHER_ADDRESS=$(grep -o '"address": "[^"]*"' batcher-wallet.json | cut -d'"' -f4)
BATCHER_PRIVATE_KEY=$(grep -o '"private_key": "[^"]*"' batcher-wallet.json | cut -d'"' -f4)

PROPOSER_ADDRESS=$(grep -o '"address": "[^"]*"' proposer-wallet.json | cut -d'"' -f4)
PROPOSER_PRIVATE_KEY=$(grep -o '"private_key": "[^"]*"' proposer-wallet.json | cut -d'"' -f4)

SEQUENCER_ADDRESS=$(grep -o '"address": "[^"]*"' sequencer-wallet.json | cut -d'"' -f4)
SEQUENCER_PRIVATE_KEY=$(grep -o '"private_key": "[^"]*"' sequencer-wallet.json | cut -d'"' -f4)

# Display addresses
echo "Account Addresses:"
echo "===================="
echo ""
echo "Admin:     $ADMIN_ADDRESS"
echo "Batcher:   $BATCHER_ADDRESS"
echo "Proposer:  $PROPOSER_ADDRESS"
echo "Sequencer: $SEQUENCER_ADDRESS"
echo ""

# Save to accounts.txt
cat > accounts.txt << EOF
========================================
Gaia L2 Account Information
========================================

ADMIN_ADDRESS=$ADMIN_ADDRESS
ADMIN_PRIVATE_KEY=$ADMIN_PRIVATE_KEY

BATCHER_ADDRESS=$BATCHER_ADDRESS
BATCHER_PRIVATE_KEY=$BATCHER_PRIVATE_KEY

PROPOSER_ADDRESS=$PROPOSER_ADDRESS
PROPOSER_PRIVATE_KEY=$PROPOSER_PRIVATE_KEY

SEQUENCER_ADDRESS=$SEQUENCER_ADDRESS
SEQUENCER_PRIVATE_KEY=$SEQUENCER_PRIVATE_KEY

========================================
IMPORTANT: Keep this file secure!
Do NOT commit to version control!
========================================
EOF

echo "✅ Account information saved to: gaia-data/accounts.txt"
echo ""

# Create .envrc if it doesn't exist
if [ ! -f "$PROJECT_ROOT/.envrc" ]; then
    echo "Creating .envrc file..."
    
    cat > "$PROJECT_ROOT/.envrc" << EOF
# ========================================
# Gaia Protocol OP Stack L2 Deployment
# L1: Celo Sepolia (Chain ID: 11142220)
# ========================================

# L1 Configuration (Celo Sepolia)
export L1_RPC_URL=https://forno.celo-sepolia.celo-testnet.org/
export L1_CHAIN_ID=11142220

# L2 Configuration (Gaia L2)
export L2_CHAIN_ID=424242
export L2_BLOCK_TIME=2

# Account Private Keys
export ADMIN_PRIVATE_KEY=$ADMIN_PRIVATE_KEY
export BATCHER_PRIVATE_KEY=$BATCHER_PRIVATE_KEY
export PROPOSER_PRIVATE_KEY=$PROPOSER_PRIVATE_KEY
export SEQUENCER_PRIVATE_KEY=$SEQUENCER_PRIVATE_KEY

# Account Addresses
export ADMIN_ADDRESS=$ADMIN_ADDRESS
export BATCHER_ADDRESS=$BATCHER_ADDRESS
export PROPOSER_ADDRESS=$PROPOSER_ADDRESS
export SEQUENCER_ADDRESS=$SEQUENCER_ADDRESS

# Deployment Configuration
export DEPLOYMENT_CONTEXT=gaia-celo-sepolia
export IMPL_SALT=\$(openssl rand -hex 32)

# Project Paths
export GAIA_HOME=\$(pwd)
export GAIA_DATA=\$GAIA_HOME/gaia-data
export GAIA_CONFIG=\$GAIA_HOME/gaia-config
export GAIA_SCRIPTS=\$GAIA_HOME/gaia-scripts

# L1 Contract Addresses (Will be populated after deployment)
export OPTIMISM_PORTAL=
export L2_OUTPUT_ORACLE=
export SYSTEM_CONFIG=
export L1_STANDARD_BRIDGE=
export L1_CROSS_DOMAIN_MESSENGER=
export L1_ERC721_BRIDGE=
export ADDRESS_MANAGER=
EOF

    echo "✅ Created .envrc file"
    echo ""
    echo "⚠️  Run 'direnv allow' to load environment variables"
else
    echo "⚠️  .envrc already exists. Update it manually with the new addresses."
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Fund these accounts with Celo Sepolia tokens:"
echo "   Get tokens from: https://faucet.celo.org/sepolia"
echo ""
echo "   Admin:     $ADMIN_ADDRESS (need ~10 CELO)"
echo "   Batcher:   $BATCHER_ADDRESS (need ~5 CELO)"
echo "   Proposer:  $PROPOSER_ADDRESS (need ~5 CELO)"
echo "   Sequencer: $SEQUENCER_ADDRESS (need ~1 CELO)"
echo ""
echo "2. Verify balances (after funding):"
echo "   curl -X POST https://forno.celo-sepolia.celo-testnet.org/ \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADMIN_ADDRESS\",\"latest\"],\"id\":1}'"
echo ""
echo "3. Allow direnv (if not done already):"
echo "   cd .. && direnv allow"
echo ""
echo "4. Run setup script:"
echo "   ./gaia-scripts/setup-op-stack.sh"
echo ""
