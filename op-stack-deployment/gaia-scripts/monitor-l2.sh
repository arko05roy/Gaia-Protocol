#!/bin/bash

# Gaia L2 Real-Time Monitor (like Anvil)
# Shows live block production, transactions, and network status

L2_RPC="http://localhost:8545"
REFRESH_RATE=2  # seconds

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get terminal width for formatting
TERM_WIDTH=$(tput cols 2>/dev/null || echo 80)

print_header() {
    printf "${CYAN}"
    printf "%.0s=" $(seq 1 $TERM_WIDTH)
    printf "${NC}\n"
}

print_section() {
    printf "${BLUE}▶ $1${NC}\n"
}

get_json_value() {
    local json=$1
    local key=$2
    echo "$json" | jq -r "$key" 2>/dev/null || echo "N/A"
}

# Clear screen and hide cursor
clear
tput civis 2>/dev/null  # Hide cursor

# Trap to show cursor on exit
trap 'tput cnorm 2>/dev/null; exit' EXIT INT TERM

last_block=0
tx_count=0
block_time=0

while true; do
    # Get current data
    chain_info=$(curl -s -X POST $L2_RPC \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}')
    
    block_info=$(curl -s -X POST $L2_RPC \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
    
    gas_price=$(curl -s -X POST $L2_RPC \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}')
    
    peer_count=$(curl -s -X POST $L2_RPC \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}')
    
    # Parse values
    chain_id=$(get_json_value "$chain_info" '.result')
    current_block=$(get_json_value "$block_info" '.result')
    gas_price_wei=$(get_json_value "$gas_price" '.result')
    peers=$(get_json_value "$peer_count" '.result')
    
    # Convert hex to decimal
    current_block_dec=$((${current_block:-0x0}))
    gas_price_dec=$((${gas_price_wei:-0x0}))
    peers_dec=$((${peers:-0x0}))
    
    # Calculate block time
    current_time=$(date +%s)
    if [ $current_block_dec -gt $last_block ]; then
        block_time=$((current_time - last_block_time))
        tx_count=$((tx_count + 1))
        last_block=$current_block_dec
    fi
    last_block_time=$current_time
    
    # Clear screen
    clear
    
    # Print header
    print_header
    printf "${CYAN}${BOLD}Gaia L2 Monitor${NC}\n"
    print_header
    echo ""
    
    # Network Status
    print_section "Network Status"
    printf "  Chain ID:          ${GREEN}%s${NC} (Gaia L2)\n" "$chain_id"
    printf "  RPC URL:           ${GREEN}http://localhost:8545${NC}\n"
    printf "  Network Status:    ${GREEN}✓ Connected${NC}\n"
    echo ""
    
    # Block Information
    print_section "Block Information"
    printf "  Current Block:     ${YELLOW}%d${NC}\n" "$current_block_dec"
    printf "  Block Time:        ${YELLOW}%d${NC} seconds\n" "$block_time"
    printf "  Transactions:      ${YELLOW}%d${NC}\n" "$tx_count"
    echo ""
    
    # Gas Information
    print_section "Gas Information"
    printf "  Gas Price:         ${YELLOW}%d${NC} Wei\n" "$gas_price_dec"
    printf "  Gas Price (Gwei):  ${YELLOW}%.2f${NC} Gwei\n" "$(echo "scale=9; $gas_price_dec / 1000000000" | bc 2>/dev/null || echo 0)"
    echo ""
    
    # Network Peers
    print_section "Network Peers"
    printf "  Connected Peers:   ${YELLOW}%d${NC}\n" "$peers_dec"
    echo ""
    
    # Accounts
    print_section "Configured Accounts"
    
    admin_balance=$(curl -s -X POST $L2_RPC \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x89a26a33747b293430D4269A59525d5D0D5BbE65","latest"],"id":1}' | jq -r '.result')
    
    printf "  Admin:             ${CYAN}0x89a26a33747b293430D4269A59525d5D0D5BbE65${NC}\n"
    printf "  Batcher:           ${CYAN}0xd9fC5AEA3D4e8F484f618cd90DC6f7844a500f62${NC}\n"
    printf "  Proposer:          ${CYAN}0x79BF82C41a7B6Af998D47D2ea92Fe0ed0af6Ed47${NC}\n"
    printf "  Sequencer:         ${CYAN}0xB24e7987af06aF7CFB94E4021d0B3CB8f80f0E49${NC}\n"
    echo ""
    
    # System Information
    print_section "System Information"
    printf "  L2 Process:        "
    if pgrep -f "geth.*gaia-data" > /dev/null; then
        printf "${GREEN}✓ Running${NC}\n"
    else
        printf "${RED}✗ Stopped${NC}\n"
    fi
    
    uptime_seconds=$(($(date +%s) - $(stat -f%B /Users/arkoroy/Desktop/GaiaProtocol/op-stack-deployment/gaia-data/geth-data 2>/dev/null || echo $(date +%s))))
    printf "  Uptime:            ${YELLOW}%d${NC} seconds\n" "$uptime_seconds"
    echo ""
    
    # Footer
    print_header
    printf "${CYAN}Press Ctrl+C to exit | Refreshing every %d seconds${NC}\n" "$REFRESH_RATE"
    
    # Wait before refresh
    sleep $REFRESH_RATE
done
