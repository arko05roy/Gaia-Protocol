#!/bin/bash

# Add validator to VerificationManager
# This script adds 0xABaF59180e0209bdB8b3048bFbe64e855074C0c4 as a validator

set -e

RPC_URL="http://localhost:8546"
VERIFICATION_MANAGER="0x59b670e9fA9D0A427751Af201D676719a970857b"
VALIDATOR_ADDRESS="0xABaF59180e0209bdB8b3048bFbe64e855074C0c4"
DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo "🔐 Adding validator to VerificationManager..."
echo "VerificationManager: $VERIFICATION_MANAGER"
echo "Validator: $VALIDATOR_ADDRESS"
echo ""

# Call addValidator function
# addValidator(address validator) -> function selector: 0x4d238c8e
cast send "$VERIFICATION_MANAGER" \
  "addValidator(address)" \
  "$VALIDATOR_ADDRESS" \
  --rpc-url "$RPC_URL" \
  --unlocked \
  --from "$DEPLOYER"

echo ""
echo "✅ Validator added successfully!"
echo ""

# Verify the validator was added
echo "🔍 Verifying validator status..."
IS_VALIDATOR=$(cast call "$VERIFICATION_MANAGER" \
  "isValidator(address)" \
  "$VALIDATOR_ADDRESS" \
  --rpc-url "$RPC_URL")

if [ "$IS_VALIDATOR" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
  echo "✅ Confirmed: $VALIDATOR_ADDRESS is now a validator!"
else
  echo "❌ Verification failed"
  exit 1
fi
