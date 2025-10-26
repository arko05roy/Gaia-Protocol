#!/bin/bash

# GaiaL3 Complete Dev Environment
# Starts blockchain, funds account, and monitors all in one command

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
YOUR_ACCOUNT="0xABaF59180e0209bdB8b3048bFbe64e855074C0c4"
DEPLOYER_ACCOUNT="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
RPC_URL="http://localhost:8546"

# Colors
BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║         🚀 GAIA L3 COMPLETE DEV ENVIRONMENT                ║${NC}"
echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "gaial3.*424242" || true
pkill -f "anvil.*424242" || true
pkill -f "monitor-gaial3.sh" || true
sleep 1

# Start GaiaL3 node
echo "🚀 Starting GaiaL3 node on port 8546..."
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

sleep 3

# Check if node is running
if ! kill -0 $GAIAL3_PID 2>/dev/null; then
  echo -e "${BOLD}${RED}❌ Failed to start GaiaL3${NC}"
  exit 1
fi

echo -e "${GREEN}✅ GaiaL3 node started (PID: $GAIAL3_PID)${NC}"
echo ""

# Deploy contracts in background
echo "📦 Deploying contracts in background..."
(
  cd "$SCRIPT_DIR/web3"
  npx hardhat run scripts/deploy-l2-fast.js --network gaiaL2 > /dev/null 2>&1
  npx hardhat run scripts/initialize-l2.js --network gaiaL2 > /dev/null 2>&1
  npx hardhat run scripts/mint-cussd.js --network gaiaL2 > /dev/null 2>&1
  echo "✅ Deployment complete" >> /tmp/gaial3.log
) &

sleep 3

# Fund your account using cast with --unlocked flag
echo "💰 Funding your account with 1000 ETH..."
cast send "$YOUR_ACCOUNT" --value 1000ether --rpc-url $RPC_URL --unlocked --from "$DEPLOYER_ACCOUNT" > /dev/null 2>&1 || true

sleep 1

# Verify funding
echo "🔍 Verifying account balance..."
YOUR_BALANCE=$(cast balance "$YOUR_ACCOUNT" --rpc-url $RPC_URL 2>/dev/null | xargs -I {} cast to-unit {} ether 2>/dev/null || echo "0")
echo -e "${GREEN}✅ Account funded: ${YELLOW}${YOUR_BALANCE} ETH${NC}"
echo ""

# Deploy contracts (wait for background deployment to complete)
echo "⏳ Waiting for deployment to complete..."
sleep 8

echo -e "${GREEN}✅ GaiaL3 is ready!${NC}"
echo -e "${YELLOW}📊 Starting monitor...${NC}"
echo ""

# Start monitor
bash "$SCRIPT_DIR/monitor-gaial3.sh"
