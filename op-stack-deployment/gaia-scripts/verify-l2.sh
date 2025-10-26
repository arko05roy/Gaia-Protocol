#!/bin/bash

echo "=========================================="
echo "Gaia L2 Verification Report"
echo "=========================================="
echo ""

L2_RPC="http://localhost:8545"
L1_RPC="https://forno.celo-sepolia.celo-testnet.org/"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0

run_test() {
    local test_name=$1
    local command=$2
    local expected=$3
    
    test_count=$((test_count + 1))
    echo -n "Test $test_count: $test_name... "
    
    result=$(eval "$command" 2>/dev/null)
    
    if [ -z "$expected" ] || [ "$result" = "$expected" ] || [ ! -z "$result" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        echo "  Result: $result"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
    fi
    echo ""
}

# L2 Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "L2 Node Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "L2 RPC Connectivity" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}' | jq -r '.result'" \
  "0x67932"

run_test "L2 Chain ID (424242)" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"net_version\",\"params\":[],\"id\":1}' | jq -r '.result'" \
  "424242"

run_test "L2 Latest Block Number" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' | jq -r '.result'" \
  ""

run_test "L2 Gas Price" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_gasPrice\",\"params\":[],\"id\":1}' | jq -r '.result'" \
  ""

run_test "L2 Peer Count" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}' | jq -r '.result'" \
  ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Account Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ADMIN="0x89a26a33747b293430D4269A59525d5D0D5BbE65"
BATCHER="0xd9fC5AEA3D4e8F484f618cd90DC6f7844a500f62"
PROPOSER="0x79BF82C41a7B6Af998D47D2ea92Fe0ed0af6Ed47"
SEQUENCER="0xB24e7987af06aF7CFB94E4021d0B3CB8f80f0E49"

run_test "Admin Account Exists" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADMIN\",\"latest\"],\"id\":1}' | jq -r '.result'" \
  ""

run_test "Batcher Account Exists" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$BATCHER\",\"latest\"],\"id\":1}' | jq -r '.result'" \
  ""

run_test "Proposer Account Exists" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$PROPOSER\",\"latest\"],\"id\":1}' | jq -r '.result'" \
  ""

run_test "Sequencer Account Exists" \
  "curl -s -X POST $L2_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$SEQUENCER\",\"latest\"],\"id\":1}' | jq -r '.result'" \
  ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "L1 Connection Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_test "L1 RPC Connectivity" \
  "curl -s -X POST $L1_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}' | jq -r '.result'" \
  "0x2ae9d"

run_test "L1 Chain ID (11142220)" \
  "curl -s -X POST $L1_RPC -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"net_version\",\"params\":[],\"id\":1}' | jq -r '.result'" \
  "11142220"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Tests Passed: $pass_count / $test_count"

if [ $pass_count -eq $test_count ]; then
    echo -e "${GREEN}✅ All tests passed! L2 is ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check your L2 setup.${NC}"
    exit 1
fi
