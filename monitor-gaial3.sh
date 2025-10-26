#!/bin/bash

# GaiaL3 Blockchain State Monitor
# Displays live blockchain metrics

RPC_URL="http://localhost:8546"
REFRESH_INTERVAL=2

# Colors
BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
MAGENTA='\033[35m'
NC='\033[0m' # No Color

# Function to get blockchain data
get_block_number() {
  cast block-number --rpc-url $RPC_URL 2>/dev/null || echo "N/A"
}

get_gas_price() {
  cast gas-price --rpc-url $RPC_URL 2>/dev/null | xargs -I {} cast to-unit {} gwei 2>/dev/null || echo "N/A"
}

get_latest_block_time() {
  cast block latest timestamp --rpc-url $RPC_URL 2>/dev/null || echo "N/A"
}

get_account_balance() {
  local account=$1
  cast balance $account --rpc-url $RPC_URL 2>/dev/null | xargs -I {} cast to-unit {} ether 2>/dev/null || echo "N/A"
}

get_cussd_balance() {
  local account=$1
  cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "balanceOf(address)" $account --rpc-url $RPC_URL 2>/dev/null | xargs -I {} cast to-dec {} 2>/dev/null | awk '{printf "%.2f", $1/1e18}' || echo "N/A"
}

get_transaction_count() {
  cast rpc eth_blockNumber --rpc-url $RPC_URL 2>/dev/null | xargs -I {} cast to-dec {} 2>/dev/null || echo "N/A"
}

# Main monitoring loop
clear

while true; do
  clear
  
  # Get current data
  BLOCK_NUM=$(get_block_number)
  GAS_PRICE=$(get_gas_price)
  BLOCK_TIME=$(get_latest_block_time)
  DEPLOYER_ETH=$(get_account_balance "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
  YOUR_ETH=$(get_account_balance "0xABaF59180e0209bdB8b3048bFbe64e855074C0c4")
  YOUR_CUSSD=$(get_cussd_balance "0xABaF59180e0209bdB8b3048bFbe64e855074C0c4")
  
  # Display header
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║                     🚀 GAIA L3 BLOCKCHAIN STATE                    ║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # Network Info
  echo -e "${BOLD}${BLUE}📊 NETWORK STATUS${NC}"
  echo -e "  ${GREEN}●${NC} RPC URL:        ${YELLOW}http://localhost:8546${NC}"
  echo -e "  ${GREEN}●${NC} Chain ID:       ${YELLOW}424242 (GaiaL3)${NC}"
  echo -e "  ${GREEN}●${NC} Block Time:     ${YELLOW}1 second${NC}"
  echo ""
  
  # Blockchain Metrics
  echo -e "${BOLD}${BLUE}⛓️  BLOCKCHAIN METRICS${NC}"
  echo -e "  ${GREEN}●${NC} Current Block:  ${YELLOW}#${BLOCK_NUM}${NC}"
  echo -e "  ${GREEN}●${NC} Gas Price:      ${YELLOW}${GAS_PRICE} Gwei${NC}"
  echo -e "  ${GREEN}●${NC} Latest Block:   ${YELLOW}$(date -d @$BLOCK_TIME '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'N/A')${NC}"
  echo ""
  
  # Account Balances
  echo -e "${BOLD}${BLUE}💰 ACCOUNT BALANCES${NC}"
  echo -e "  ${GREEN}●${NC} Deployer (0xf39F...)"
  echo -e "      ETH:  ${YELLOW}${DEPLOYER_ETH} ETH${NC}"
  echo ""
  echo -e "  ${GREEN}●${NC} Your Account (0xABaF...)"
  echo -e "      ETH:  ${YELLOW}${YOUR_ETH} ETH${NC}"
  echo -e "      cUSD: ${YELLOW}${YOUR_CUSSD} cUSD${NC}"
  echo ""
  
  # Deployed Contracts
  echo -e "${BOLD}${BLUE}📦 DEPLOYED CONTRACTS${NC}"
  echo -e "  ${GREEN}●${NC} cUSD Token:           ${MAGENTA}0x5FbDB2315678afecb367f032d93F642f64180aa3${NC}"
  echo -e "  ${GREEN}●${NC} TaskRegistry:         ${MAGENTA}0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0${NC}"
  echo -e "  ${GREEN}●${NC} FundingPool:          ${MAGENTA}0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9${NC}"
  echo -e "  ${GREEN}●${NC} CollateralManager:    ${MAGENTA}0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9${NC}"
  echo -e "  ${GREEN}●${NC} VerificationManager:  ${MAGENTA}0x5FC8d32690cc91D4c39d9d3abcBD16989F875707${NC}"
  echo -e "  ${GREEN}●${NC} CarbonCreditMinter:   ${MAGENTA}0x0165878A594ca255338adfa4d48449f69242Eb8F${NC}"
  echo -e "  ${GREEN}●${NC} CarbonMarketplace:    ${MAGENTA}0xa513E6E4b8f2a923D98304ec87F64353C4D5C853${NC}"
  echo -e "  ${GREEN}●${NC} PredictionMarket:     ${MAGENTA}0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6${NC}"
  echo -e "  ${GREEN}●${NC} GovernanceDAO:        ${MAGENTA}0x8A791620dd6260079BF849Dc5567aDC3F2FdC318${NC}"
  echo -e "  ${GREEN}●${NC} DataRegistry:         ${MAGENTA}0x610178dA211FEF7D417bC0e6FeD39F05609AD788${NC}"
  echo -e "  ${GREEN}●${NC} ModelRegistry:        ${MAGENTA}0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e${NC}"
  echo ""

  # Footer
  echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║  Refreshing every ${REFRESH_INTERVAL}s... Press Ctrl+C to stop                  ║${NC}"
  echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
  
  sleep $REFRESH_INTERVAL
done
