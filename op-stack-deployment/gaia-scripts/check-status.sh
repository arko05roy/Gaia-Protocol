#!/bin/bash

echo "=========================================="
echo "Gaia L2 Service Status"
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/gaia-data"

# Function to check if process is running
check_service() {
    local name=$1
    local pidfile=$2
    local port=$3
    
    if [ -f "$pidfile" ]; then
        PID=$(cat $pidfile)
        if kill -0 $PID 2>/dev/null; then
            echo "✅ $name is running (PID: $PID)"
            if [ -n "$port" ]; then
                if lsof -i:$port > /dev/null 2>&1; then
                    echo "   Port $port is listening"
                else
                    echo "   ⚠️  Port $port is not listening"
                fi
            fi
            return 0
        else
            echo "❌ $name is not running (stale PID file)"
            return 1
        fi
    else
        echo "❌ $name is not running (no PID file)"
        return 1
    fi
}

# Check each service
check_service "op-geth" "geth.pid" "8545"
check_service "op-node" "op-node.pid" "9545"
check_service "op-batcher" "batcher.pid" "8548"
check_service "op-proposer" "proposer.pid" "8560"

echo ""
echo "=========================================="
echo "L2 Chain Status"
echo "=========================================="
echo ""

# Check L2 block number
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null 2>&1; then
    
    BLOCK_HEX=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        http://localhost:8545 | jq -r '.result')
    
    BLOCK_NUM=$((16#${BLOCK_HEX#0x}))
    echo "L2 Block Number: $BLOCK_NUM"
else
    echo "❌ Cannot connect to L2 RPC"
fi

# Check op-node sync status
if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"optimism_syncStatus","params":[],"id":1}' \
    http://localhost:9545 > /dev/null 2>&1; then
    
    SYNC_STATUS=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"optimism_syncStatus","params":[],"id":1}' \
        http://localhost:9545 | jq -r '.result')
    
    echo "op-node Sync Status:"
    echo "$SYNC_STATUS" | jq '.'
else
    echo "❌ Cannot connect to op-node RPC"
fi

echo ""
echo "=========================================="
echo "Recent Logs"
echo "=========================================="
echo ""

echo "--- op-geth (last 5 lines) ---"
tail -5 geth.log 2>/dev/null || echo "No logs available"
echo ""

echo "--- op-node (last 5 lines) ---"
tail -5 op-node.log 2>/dev/null || echo "No logs available"
echo ""

echo "--- op-batcher (last 5 lines) ---"
tail -5 batcher.log 2>/dev/null || echo "No logs available"
echo ""

echo "--- op-proposer (last 5 lines) ---"
tail -5 proposer.log 2>/dev/null || echo "No logs available"
echo ""

echo "=========================================="
echo "View full logs:"
echo "  tail -f gaia-data/geth.log"
echo "  tail -f gaia-data/op-node.log"
echo "  tail -f gaia-data/batcher.log"
echo "  tail -f gaia-data/proposer.log"
echo "=========================================="
echo ""
