#!/bin/bash

# GaiaL3 Quick Start - Just start the node, deploy in background

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes
pkill -f "gaial3.*424242" || true
pkill -f "anvil.*424242" || true
pkill -f "monitor-gaial3.sh" || true
sleep 1

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    🚀 GAIA L3 STARTING                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Start GaiaL3 node directly (no wrapper script)
echo "Starting GaiaL3 node..."
/Users/arkoroy/.foundry/bin/anvil \
  --port 8546 \
  --chain-id 424242 \
  --block-time 1 \
  --gas-limit 30000000 \
  --accounts 20 \
  --mnemonic "test test test test test test test test test test test junk" \
  > /tmp/gaial3.log 2>&1 &

GAIAL3_PID=$!
echo $GAIAL3_PID > /tmp/gaial3.pid

sleep 2

# Check if node is running
if ! kill -0 $GAIAL3_PID 2>/dev/null; then
  echo "❌ Failed to start GaiaL3"
  exit 1
fi

echo "✅ GaiaL3 node started (PID: $GAIAL3_PID)"
echo ""
echo "🔗 RPC: http://localhost:8546"
echo "⛓️  Chain ID: 424242"
echo ""

# Deploy contracts in background
echo "📦 Deploying contracts in background..."
(
  cd "$SCRIPT_DIR/web3"
  npx hardhat run scripts/deploy-l2-fast.js --network gaiaL2 > /dev/null 2>&1
  npx hardhat run scripts/mint-cussd.js --network gaiaL2 > /dev/null 2>&1
  echo "✅ Deployment complete" >> /tmp/gaial3.log
) &

echo ""
echo "✅ GaiaL3 is ready!"
echo "📊 Starting monitor..."
echo ""

# Start monitor
bash "$SCRIPT_DIR/monitor-gaial3.sh"
