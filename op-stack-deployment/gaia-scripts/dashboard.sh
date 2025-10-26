#!/bin/bash

# Simple Gaia L2 Dashboard (like Anvil)
# Run with: ./dashboard.sh

L2_RPC="http://localhost:8545"

while true; do
    clear
    
    # Get data
    chain_id=$(curl -s -X POST $L2_RPC -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq -r '.result' 2>/dev/null)
    block=$(curl -s -X POST $L2_RPC -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result' 2>/dev/null)
    gas=$(curl -s -X POST $L2_RPC -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' | jq -r '.result' 2>/dev/null)
    
    block_dec=$((${block:-0x0}))
    gas_dec=$((${gas:-0x0}))
    gas_gwei=$(echo "scale=2; $gas_dec / 1000000000" | bc 2>/dev/null || echo "0")
    
    # Check if L2 is running
    if [ -z "$chain_id" ] || [ "$chain_id" = "null" ]; then
        status="❌ OFFLINE"
        status_color="\033[0;31m"
    else
        status="✅ ONLINE"
        status_color="\033[0;32m"
    fi
    
    # Print dashboard
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    GAIA L2 DASHBOARD                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Status:              $status_color$status\033[0m"
    echo "Chain ID:            $chain_id (424242)"
    echo "RPC URL:             http://localhost:8545"
    echo ""
    echo "Current Block:       $block_dec"
    echo "Gas Price:           $gas_gwei Gwei ($gas_dec Wei)"
    echo ""
    echo "Accounts:"
    echo "  • Admin:           0x89a26a33747b293430D4269A59525d5D0D5BbE65"
    echo "  • Batcher:         0xd9fC5AEA3D4e8F484f618cd90DC6f7844a500f62"
    echo "  • Proposer:        0x79BF82C41a7B6Af998D47D2ea92Fe0ed0af6Ed47"
    echo "  • Sequencer:       0xB24e7987af06aF7CFB94E4021d0B3CB8f80f0E49"
    echo ""
    echo "Commands:"
    echo "  • Verify:          ./gaia-scripts/verify-l2.sh"
    echo "  • View Logs:       tail -f gaia-data/geth.log"
    echo "  • Deploy:          ./gaia-scripts/deploy-gaia-contracts.sh"
    echo ""
    echo "Press Ctrl+C to exit (refreshing every 3 seconds)"
    echo ""
    
    sleep 3
done
