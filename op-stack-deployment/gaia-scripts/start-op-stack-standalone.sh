#!/bin/bash

echo "=========================================="
echo "Starting OP Stack L2 (Standalone Mode)"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
source "$PROJECT_ROOT/.envrc"

cd "$PROJECT_ROOT/gaia-data"

# Kill existing processes
echo "Stopping existing processes..."
pkill -f "op-geth" || true
pkill -f "op-node" || true
sleep 2

# Clean and reinitialize geth
echo "Reinitializing geth data..."
rm -rf ./geth-data
$PROJECT_ROOT/op-geth/build/bin/geth init \
    --datadir ./geth-data \
    --state.scheme=hash \
    ./genesis.json 2>&1 | grep -E "Successfully|Error"

echo ""
echo "Starting op-geth..."
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
    --state.scheme=hash \
    --mine \
    --miner.etherbase=0x89a26a33747b293430D4269A59525d5D0D5BbE65 \
    > geth.log 2>&1 &

GETH_PID=$!
echo $GETH_PID > geth.pid
echo "✅ op-geth started (PID: $GETH_PID)"

sleep 3

# Check if geth is responding
if cast block-number --rpc-url http://localhost:8545 > /dev/null 2>&1; then
    echo "✅ op-geth is responding on http://localhost:8545"
else
    echo "⚠️  op-geth not responding yet, waiting..."
    sleep 3
fi

echo ""
echo "Starting op-node..."
nohup $PROJECT_ROOT/optimism/op-node/bin/op-node \
    --l1=$L1_RPC_URL \
    --l2=http://localhost:8551 \
    --l2.jwt-secret=./jwt.hex \
    --sequencer.enabled \
    --sequencer.l1-confs=5 \
    --verifier.l1-confs=4 \
    --rollup.config=./rollup.json \
    --rpc.addr=0.0.0.0 \
    --rpc.port=8547 \
    --p2p.disable \
    > op-node.log 2>&1 &

OP_NODE_PID=$!
echo $OP_NODE_PID > op-node.pid
echo "✅ op-node started (PID: $OP_NODE_PID)"

echo ""
echo "=========================================="
echo "✅ OP Stack Started!"
echo "=========================================="
echo ""
echo "RPC Endpoints:"
echo "  L2 RPC (geth):   http://localhost:8545"
echo "  L2 RPC (op-node): http://localhost:8547"
echo ""
echo "View logs:"
echo "  tail -f geth.log"
echo "  tail -f op-node.log"
echo ""
