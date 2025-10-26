#!/bin/bash

# GaiaL3 Master Control Script
# Starts the blockchain and monitoring dashboard

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Kill any existing processes
pkill -f "gaial3.*424242" || true
pkill -f "anvil.*424242" || true
pkill -f "monitor-gaial3.sh" || true
sleep 1

# Check if monitor is already running
if pgrep -f "monitor-gaial3.sh" > /dev/null; then
  echo "Monitor already running. Starting blockchain only..."
  bash "$SCRIPT_DIR/start-gaial3.sh"
  exit 0
fi

# Start blockchain in background
echo "Starting GaiaL3 blockchain..."
bash "$SCRIPT_DIR/start-gaial3.sh" > /tmp/gaial3-startup.log 2>&1 &
BLOCKCHAIN_PID=$!

# Wait for node to respond (faster check)
echo ""
echo "Waiting for GaiaL3 node to start..."
for i in {1..30}; do
  if cast block-number --rpc-url http://localhost:8546 > /dev/null 2>&1; then
    echo "✅ GaiaL3 node is running!"
    break
  fi
  sleep 1
done

echo ""
echo "✅ GaiaL3 is ready at http://localhost:8546"
echo "📊 Starting live monitor..."
echo ""

# Start monitor in foreground
bash "$SCRIPT_DIR/monitor-gaial3.sh"
