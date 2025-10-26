#!/bin/bash

# Anvil account 0 (has unlimited funds)
ANVIL_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded87d1b57fb13088271142"
YOUR_ACCOUNT="0xABaF59180e0209bdB8b3048bFbe64e855074C0c4"

echo "Funding your account with 1000 ETH..."

# Use cast to send from Anvil account (GaiaL3 runs on port 8546)
cast send "$YOUR_ACCOUNT" --value 1000ether --rpc-url http://localhost:8546 --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

echo ""
echo "Checking balance..."
BALANCE=$(cast balance "$YOUR_ACCOUNT" --rpc-url http://localhost:8546)
BALANCE_ETH=$(echo "scale=4; $BALANCE / 1000000000000000000" | bc)
echo "Your account balance: $BALANCE_ETH ETH"
