#!/bin/bash

echo "=========================================="
echo "Starting op-geth in Dev Mode (Mining Enabled)"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
source "$PROJECT_ROOT/.envrc"

cd "$PROJECT_ROOT/gaia-data"

# Kill existing geth process
pkill -f "op-geth" || true
sleep 1

# Start op-geth with mining enabled
echo "Starting op-geth with mining enabled..."
nohup $PROJECT_ROOT/op-geth/build/bin/geth \
    --datadir ./geth-data \
    --http \
    --http.addr 0.0.0.0 \
    --http.port 8545 \
    --http.api eth,net,web3,debug \
    --ws \
    --ws.addr 0.0.0.0 \
    --ws.port 8546 \
    --ws.api eth,net,web3 \
    --networkid 424242 \
    --syncmode full \
    --gcmode archive \
    > geth.log 2>&1 &

echo $! > geth.pid
echo "✅ op-geth started in dev mode (PID: $!)"
echo ""
echo "RPC URL: http://localhost:8545"
echo "Chain ID: 424242"
echo "Mining: Enabled"
echo ""
echo "View logs: tail -f geth.log"
