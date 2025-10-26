#!/bin/bash

# New contract addresses from Anvil deployment
CUSSD="0x5FbDB2315678afecb367f032d93F642f64180aa3"
TASK_REGISTRY="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
FUNDING_POOL="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
COLLATERAL_MANAGER="0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
VERIFICATION_MANAGER="0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
CARBON_CREDIT_MINTER="0x0165878A594ca255338adfa4d48449f69242Eb8F"
CARBON_MARKETPLACE="0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
PREDICTION_MARKET="0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
GOVERNANCE_DAO="0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"
DATA_REGISTRY="0x610178dA211FEF7D417bC0e6FeD39F05609AD788"
MODEL_REGISTRY="0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"

HOOKS_DIR="/Users/arkoroy/Desktop/GaiaProtocol/client/hooks"

echo "Updating contract addresses in hooks..."

# Update useTaskRegistry.ts
sed -i '' "s|export const TASK_REGISTRY_ADDRESS = '.*' as const;|export const TASK_REGISTRY_ADDRESS = '$TASK_REGISTRY' as const;|" "$HOOKS_DIR/useTaskRegistry.ts"
echo "✓ Updated useTaskRegistry.ts"

# Update useFundingPool.ts
sed -i '' "s|export const FUNDING_POOL_ADDRESS = '.*' as const;|export const FUNDING_POOL_ADDRESS = '$FUNDING_POOL' as const;|" "$HOOKS_DIR/useFundingPool.ts"
echo "✓ Updated useFundingPool.ts"

# Update useCollateralManager.ts
sed -i '' "s|export const COLLATERAL_MANAGER_ADDRESS = '.*' as const;|export const COLLATERAL_MANAGER_ADDRESS = '$COLLATERAL_MANAGER' as const;|" "$HOOKS_DIR/useCollateralManager.ts"
echo "✓ Updated useCollateralManager.ts"

# Update useVerificationManager.ts
sed -i '' "s|export const VERIFICATION_MANAGER_ADDRESS = '.*' as const;|export const VERIFICATION_MANAGER_ADDRESS = '$VERIFICATION_MANAGER' as const;|" "$HOOKS_DIR/useVerificationManager.ts"
echo "✓ Updated useVerificationManager.ts"

# Update useCarbonCreditMinter.ts
sed -i '' "s|export const CARBON_CREDIT_MINTER_ADDRESS = '.*' as const;|export const CARBON_CREDIT_MINTER_ADDRESS = '$CARBON_CREDIT_MINTER' as const;|" "$HOOKS_DIR/useCarbonCreditMinter.ts"
echo "✓ Updated useCarbonCreditMinter.ts"

# Update useCarbonMarketplace.ts
sed -i '' "s|export const CARBON_MARKETPLACE_ADDRESS = '.*' as const;|export const CARBON_MARKETPLACE_ADDRESS = '$CARBON_MARKETPLACE' as const;|" "$HOOKS_DIR/useCarbonMarketplace.ts"
echo "✓ Updated useCarbonMarketplace.ts"

# Update usePredictionMarket.ts
sed -i '' "s|export const PREDICTION_MARKET_ADDRESS = '.*' as const;|export const PREDICTION_MARKET_ADDRESS = '$PREDICTION_MARKET' as const;|" "$HOOKS_DIR/usePredictionMarket.ts"
echo "✓ Updated usePredictionMarket.ts"

# Update useGovernanceDAO.ts
sed -i '' "s|export const GOVERNANCE_DAO_ADDRESS = '.*' as const;|export const GOVERNANCE_DAO_ADDRESS = '$GOVERNANCE_DAO' as const;|" "$HOOKS_DIR/useGovernanceDAO.ts"
echo "✓ Updated useGovernanceDAO.ts"

# Update useDataRegistry.ts
sed -i '' "s|export const DATA_REGISTRY_ADDRESS = '.*' as const;|export const DATA_REGISTRY_ADDRESS = '$DATA_REGISTRY' as const;|" "$HOOKS_DIR/useDataRegistry.ts"
echo "✓ Updated useDataRegistry.ts"

# Update useModelRegistry.ts
sed -i '' "s|export const MODEL_REGISTRY_ADDRESS = '.*' as const;|export const MODEL_REGISTRY_ADDRESS = '$MODEL_REGISTRY' as const;|" "$HOOKS_DIR/useModelRegistry.ts"
echo "✓ Updated useModelRegistry.ts"

# Update useERC20Approval.ts (cUSD)
sed -i '' "s|export const CUSSD_ADDRESS = '.*' as const;|export const CUSSD_ADDRESS = '$CUSSD' as const;|" "$HOOKS_DIR/useERC20Approval.ts"
echo "✓ Updated useERC20Approval.ts"

echo ""
echo "✅ All hook addresses updated!"
