#!/bin/bash

echo "=========================================="
echo "Stopping Gaia L2 Services"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/gaia-data"

# Stop op-proposer
if [ -f "proposer.pid" ]; then
    PID=$(cat proposer.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping op-proposer (PID: $PID)..."
        kill $PID
        rm proposer.pid
        echo "✅ op-proposer stopped"
    else
        echo "⚠️  op-proposer not running"
        rm proposer.pid
    fi
else
    echo "⚠️  op-proposer PID file not found"
fi

# Stop op-batcher
if [ -f "batcher.pid" ]; then
    PID=$(cat batcher.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping op-batcher (PID: $PID)..."
        kill $PID
        rm batcher.pid
        echo "✅ op-batcher stopped"
    else
        echo "⚠️  op-batcher not running"
        rm batcher.pid
    fi
else
    echo "⚠️  op-batcher PID file not found"
fi

# Stop op-node
if [ -f "op-node.pid" ]; then
    PID=$(cat op-node.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping op-node (PID: $PID)..."
        kill $PID
        rm op-node.pid
        echo "✅ op-node stopped"
    else
        echo "⚠️  op-node not running"
        rm op-node.pid
    fi
else
    echo "⚠️  op-node PID file not found"
fi

# Wait a moment for graceful shutdown
sleep 2

# Stop op-geth
if [ -f "geth.pid" ]; then
    PID=$(cat geth.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping op-geth (PID: $PID)..."
        kill $PID
        rm geth.pid
        echo "✅ op-geth stopped"
    else
        echo "⚠️  op-geth not running"
        rm geth.pid
    fi
else
    echo "⚠️  op-geth PID file not found"
fi

echo ""
echo "=========================================="
echo "✅ All Services Stopped"
echo "=========================================="
echo ""
