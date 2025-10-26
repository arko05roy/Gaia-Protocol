#!/bin/bash
set -e

echo "=========================================="
echo "Starting Gaia L2 Services"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
source "$PROJECT_ROOT/.envrc"

cd "$PROJECT_ROOT/gaia-data"

# Start op-geth
echo ""
echo "Starting op-geth..."
if [ -f "geth.pid" ] && kill -0 $(cat geth.pid) 2>/dev/null; then
    echo "⚠️  op-geth already running (PID: $(cat geth.pid))"
else
    nohup $PROJECT_ROOT/op-geth/build/bin/geth \
        --datadir ./geth-data \
        --http \
        --http.addr 0.0.0.0 \
        --http.port 8545 \
        --http.api eth,net,web3 \
        --ws \
        --ws.addr 0.0.0.0 \
        --ws.port 8546 \
        --ws.api eth,net,web3 \
        --authrpc.addr 0.0.0.0 \
        --authrpc.port 8551 \
        --authrpc.vhosts localhost \
        --authrpc.jwtsecret ./jwt.hex \
        --networkid 424242 \
        --syncmode full \
        --gcmode archive \
        > geth.log 2>&1 &
    echo $! > geth.pid
    echo "✅ op-geth started (PID: $!)"
    sleep 2
fi

# Start op-node
echo ""
echo "Starting op-node..."
if [ -f "op-node.pid" ] && kill -0 $(cat op-node.pid) 2>/dev/null; then
    echo "⚠️  op-node already running (PID: $(cat op-node.pid))"
else
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
    echo $! > op-node.pid
    echo "✅ op-node started (PID: $!)"
    sleep 2
fi

# Start op-batcher
echo ""
echo "Starting op-batcher..."
if [ -f "op-batcher.pid" ] && kill -0 $(cat op-batcher.pid) 2>/dev/null; then
    echo "⚠️  op-batcher already running (PID: $(cat op-batcher.pid))"
else
    nohup $PROJECT_ROOT/optimism/op-batcher/bin/op-batcher \
        --l1-eth-rpc=$L1_RPC_URL \
        --l2-eth-rpc=http://localhost:8545 \
        --rollup-rpc=http://localhost:8547 \
        --max-channel-duration=1 \
        --max-l1-tx-size-bytes=120000 \
        --target-num-frames=1 \
        --approx-compr-ratio=0.4 \
        --sub-safety-margin=4 \
        --poll-interval=1s \
        --mnemonic-path=./batcher-mnemonic.txt \
        --sequencer-hd-path="m/44'/60'/0'/0/0" \
        > op-batcher.log 2>&1 &
    echo $! > op-batcher.pid
    echo "✅ op-batcher started (PID: $!)"
    sleep 2
fi

# Start op-proposer
echo ""
echo "Starting op-proposer..."
if [ -f "op-proposer.pid" ] && kill -0 $(cat op-proposer.pid) 2>/dev/null; then
    echo "⚠️  op-proposer already running (PID: $(cat op-proposer.pid))"
else
    nohup $PROJECT_ROOT/optimism/op-proposer/bin/op-proposer \
        --l1-eth-rpc=$L1_RPC_URL \
        --l2-eth-rpc=http://localhost:8545 \
        --rollup-rpc=http://localhost:8547 \
        --poll-interval=12s \
        --mnemonic-path=./proposer-mnemonic.txt \
        --sequencer-hd-path="m/44'/60'/0'/0/0" \
        > op-proposer.log 2>&1 &
    echo $! > op-proposer.pid
    echo "✅ op-proposer started (PID: $!)"
    sleep 2
fi

echo ""
echo "=========================================="
echo "✅ All Services Started!"
echo "=========================================="
echo ""
echo "Service Status:"
echo "- op-geth:     http://localhost:8545"
echo "- op-node:     http://localhost:8547"
echo "- op-batcher:  Running"
echo "- op-proposer: Running"
echo ""
echo "View logs:"
echo "  tail -f geth.log"
echo "  tail -f op-node.log"
echo "  tail -f op-batcher.log"
echo "  tail -f op-proposer.log"
echo ""
