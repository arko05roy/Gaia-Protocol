#!/bin/bash
set -e

echo "=========================================="
echo "Starting Gaia L2 Services"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/gaia-data"

# Start op-geth
if [ -f "geth.pid" ] && kill -0 $(cat geth.pid) 2>/dev/null; then
    echo "⚠️  op-geth already running (PID: $(cat geth.pid))"
else
    echo "Starting op-geth..."
    nohup ./start-geth.sh > geth.log 2>&1 &
    echo $! > geth.pid
    echo "✅ op-geth started (PID: $!)"
fi

# Wait for geth to initialize
echo "Waiting 10 seconds for op-geth to initialize..."
sleep 10

# Test geth RPC
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null 2>&1; then
    echo "✅ op-geth RPC responding"
else
    echo "⚠️  op-geth RPC not responding yet (may need more time)"
fi

# Start op-node
if [ -f "op-node.pid" ] && kill -0 $(cat op-node.pid) 2>/dev/null; then
    echo "⚠️  op-node already running (PID: $(cat op-node.pid))"
else
    echo "Starting op-node..."
    nohup ./start-op-node.sh > op-node.log 2>&1 &
    echo $! > op-node.pid
    echo "✅ op-node started (PID: $!)"
fi

# Wait for op-node to sync
echo "Waiting 15 seconds for op-node to initialize..."
sleep 15

# Test op-node RPC
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"optimism_syncStatus","params":[],"id":1}' \
    http://localhost:9545 > /dev/null 2>&1; then
    echo "✅ op-node RPC responding"
else
    echo "⚠️  op-node RPC not responding yet (may need more time)"
fi

# Start op-batcher
if [ -f "batcher.pid" ] && kill -0 $(cat batcher.pid) 2>/dev/null; then
    echo "⚠️  op-batcher already running (PID: $(cat batcher.pid))"
else
    echo "Starting op-batcher..."
    nohup ./start-batcher.sh > batcher.log 2>&1 &
    echo $! > batcher.pid
    echo "✅ op-batcher started (PID: $!)"
fi

# Wait for batcher
sleep 5

# Start op-proposer
if [ -f "proposer.pid" ] && kill -0 $(cat proposer.pid) 2>/dev/null; then
    echo "⚠️  op-proposer already running (PID: $(cat proposer.pid))"
else
    echo "Starting op-proposer..."
    nohup ./start-proposer.sh > proposer.log 2>&1 &
    echo $! > proposer.pid
    echo "✅ op-proposer started (PID: $!)"
fi

echo ""
echo "=========================================="
echo "✅ All Services Started"
echo "=========================================="
echo ""
echo "Service Status:"
echo "  op-geth:     PID $(cat geth.pid 2>/dev/null || echo 'N/A')"
echo "  op-node:     PID $(cat op-node.pid 2>/dev/null || echo 'N/A')"
echo "  op-batcher:  PID $(cat batcher.pid 2>/dev/null || echo 'N/A')"
echo "  op-proposer: PID $(cat proposer.pid 2>/dev/null || echo 'N/A')"
echo ""
echo "Endpoints:"
echo "  L2 HTTP RPC:  http://localhost:8545"
echo "  L2 WS RPC:    ws://localhost:8546"
echo "  op-node RPC:  http://localhost:9545"
echo ""
echo "View logs:"
echo "  tail -f gaia-data/geth.log"
echo "  tail -f gaia-data/op-node.log"
echo "  tail -f gaia-data/batcher.log"
echo "  tail -f gaia-data/proposer.log"
echo ""
echo "Check status: ./gaia-scripts/check-status.sh"
echo "Stop services: ./gaia-scripts/stop-all.sh"
echo ""
