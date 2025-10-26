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

# Generate accounts
echo "1. Generating Admin account..."
cast wallet new --json > admin-wallet.json
echo "✅ Admin account generated"

echo "2. Generating Batcher account..."
cast wallet new --json > batcher-wallet.json
echo "✅ Batcher account generated"

echo "3. Generating Proposer account..."
cast wallet new --json > proposer-wallet.json
echo "✅ Proposer account generated"

echo "4. Generating Sequencer account..."
cast wallet new --json > sequencer-wallet.json
echo "✅ Sequencer account generated"

echo ""
echo "=========================================="
echo "✅ All Accounts Generated!"
echo "=========================================="
echo ""

# Extract addresses and private keys
ADMIN_ADDRESS=$(jq -r '.address' admin-wallet.json)
ADMIN_PRIVATE_KEY=$(jq -r '.private_key' admin-wallet.json)

BATCHER_ADDRESS=$(jq -r '.address' batcher-wallet.json)
BATCHER_PRIVATE_KEY=$(jq -r '.private_key' batcher-wallet.json)

PROPOSER_ADDRESS=$(jq -r '.address' proposer-wallet.json)
PROPOSER_PRIVATE_KEY=$(jq -r '.private_key' proposer-wallet.json)

SEQUENCER_ADDRESS=$(jq -r '.address' sequencer-wallet.json)
SEQUENCER_PRIVATE_KEY=$(jq -r '.private_key' sequencer-wallet.json)

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
echo "2. Verify balances:"
echo "   cast balance $ADMIN_ADDRESS --rpc-url https://forno.celo-sepolia.celo-testnet.org/"
echo ""
echo "3. Allow direnv (if not done already):"
echo "   cd .. && direnv allow"
echo ""
echo "4. Run setup script:"
echo "   ./gaia-scripts/setup-op-stack.sh"
echo ""
