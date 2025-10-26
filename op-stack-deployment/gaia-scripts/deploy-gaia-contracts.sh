#!/bin/bash
set -e

echo "=========================================="
echo "Deploying Gaia Protocol Contracts to L2"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GAIA_ROOT="$(dirname "$PROJECT_ROOT")"

# Load environment variables
source "$PROJECT_ROOT/.envrc"

# Check if L2 is running
if ! curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 > /dev/null 2>&1; then
    echo "❌ Error: L2 RPC not responding at http://localhost:8545"
    echo "Please start L2 services first: ./gaia-scripts/start-all.sh"
    exit 1
fi

echo "✅ L2 RPC is responding"
echo ""

# Navigate to web3 directory
cd "$GAIA_ROOT/web3"

# Update hardhat.config.js to add L2 network
echo "Updating Hardhat configuration for L2..."

# Check if gaiaL2 network already exists
if grep -q "gaiaL2:" hardhat.config.js; then
    echo "✅ L2 network already configured in hardhat.config.js"
else
    # Backup original config
    cp hardhat.config.js hardhat.config.js.backup
    
    # Add L2 network configuration
    cat > hardhat.config.js << 'EOF'
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220,
    },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
    },
    gaiaL2: {
      url: "http://localhost:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 424242,
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      celoSepolia: process.env.CELOSCAN_API_KEY || "",
      alfajores: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
    ],
  },
};
EOF
    echo "✅ Added gaiaL2 network to hardhat.config.js"
fi

# Create deployment script for L2
echo ""
echo "Creating L2 deployment script..."

cat > scripts/deploy-l2.js << 'EOFSCRIPT'
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Deploying Gaia Protocol to L2");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const deployedAddresses = {};

  // Deploy cUSD mock token for L2
  console.log("1. Deploying cUSD Token...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const cUSD = await MockERC20.deploy("Celo Dollar", "cUSD");
  await cUSD.waitForDeployment();
  const cUSDAddress = await cUSD.getAddress();
  console.log("   cUSD deployed to:", cUSDAddress);
  deployedAddresses.cUSD = cUSDAddress;

  // Deploy Treasury
  console.log("\n2. Deploying Treasury...");
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   Treasury deployed to:", treasuryAddress);
  deployedAddresses.Treasury = treasuryAddress;

  // Deploy TaskRegistry
  console.log("\n3. Deploying TaskRegistry...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy();
  await taskRegistry.waitForDeployment();
  const taskRegistryAddress = await taskRegistry.getAddress();
  console.log("   TaskRegistry deployed to:", taskRegistryAddress);
  deployedAddresses.TaskRegistry = taskRegistryAddress;

  // Deploy FundingPool
  console.log("\n4. Deploying FundingPool...");
  const FundingPool = await hre.ethers.getContractFactory("FundingPool");
  const fundingPool = await FundingPool.deploy(taskRegistryAddress, cUSDAddress);
  await fundingPool.waitForDeployment();
  const fundingPoolAddress = await fundingPool.getAddress();
  console.log("   FundingPool deployed to:", fundingPoolAddress);
  deployedAddresses.FundingPool = fundingPoolAddress;

  // Deploy CollateralManager
  console.log("\n5. Deploying CollateralManager...");
  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(taskRegistryAddress, cUSDAddress);
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("   CollateralManager deployed to:", collateralManagerAddress);
  deployedAddresses.CollateralManager = collateralManagerAddress;

  // Deploy VerificationManager
  console.log("\n6. Deploying VerificationManager...");
  const VerificationManager = await hre.ethers.getContractFactory("VerificationManager");
  const verificationManager = await VerificationManager.deploy(taskRegistryAddress);
  await verificationManager.waitForDeployment();
  const verificationManagerAddress = await verificationManager.getAddress();
  console.log("   VerificationManager deployed to:", verificationManagerAddress);
  deployedAddresses.VerificationManager = verificationManagerAddress;

  // Deploy CarbonCreditMinter
  console.log("\n7. Deploying CarbonCreditMinter...");
  const CarbonCreditMinter = await hre.ethers.getContractFactory("CarbonCreditMinter");
  const carbonCreditMinter = await CarbonCreditMinter.deploy(taskRegistryAddress);
  await carbonCreditMinter.waitForDeployment();
  const carbonCreditMinterAddress = await carbonCreditMinter.getAddress();
  console.log("   CarbonCreditMinter deployed to:", carbonCreditMinterAddress);
  deployedAddresses.CarbonCreditMinter = carbonCreditMinterAddress;

  // Deploy CarbonMarketplace
  console.log("\n8. Deploying CarbonMarketplace...");
  const CarbonMarketplace = await hre.ethers.getContractFactory("CarbonMarketplace");
  const carbonMarketplace = await CarbonMarketplace.deploy(carbonCreditMinterAddress, cUSDAddress);
  await carbonMarketplace.waitForDeployment();
  const carbonMarketplaceAddress = await carbonMarketplace.getAddress();
  console.log("   CarbonMarketplace deployed to:", carbonMarketplaceAddress);
  deployedAddresses.CarbonMarketplace = carbonMarketplaceAddress;

  // Deploy PredictionMarketplace
  console.log("\n9. Deploying PredictionMarketplace...");
  const PredictionMarketplace = await hre.ethers.getContractFactory("PredictionMarketplace");
  const predictionMarketplace = await PredictionMarketplace.deploy(taskRegistryAddress, cUSDAddress);
  await predictionMarketplace.waitForDeployment();
  const predictionMarketplaceAddress = await predictionMarketplace.getAddress();
  console.log("   PredictionMarketplace deployed to:", predictionMarketplaceAddress);
  deployedAddresses.PredictionMarketplace = predictionMarketplaceAddress;

  // Deploy GovernanceDAO
  console.log("\n10. Deploying GovernanceDAO...");
  const GovernanceDAO = await hre.ethers.getContractFactory("GovernanceDAO");
  const governanceDAO = await GovernanceDAO.deploy(cUSDAddress);
  await governanceDAO.waitForDeployment();
  const governanceDAOAddress = await governanceDAO.getAddress();
  console.log("   GovernanceDAO deployed to:", governanceDAOAddress);
  deployedAddresses.GovernanceDAO = governanceDAOAddress;

  // Deploy DataRegistry
  console.log("\n11. Deploying DataRegistry...");
  const DataRegistry = await hre.ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistry.deploy(taskRegistryAddress, cUSDAddress);
  await dataRegistry.waitForDeployment();
  const dataRegistryAddress = await dataRegistry.getAddress();
  console.log("   DataRegistry deployed to:", dataRegistryAddress);
  deployedAddresses.DataRegistry = dataRegistryAddress;

  // Deploy ModelRegistry
  console.log("\n12. Deploying ModelRegistry...");
  const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
  const modelRegistry = await ModelRegistry.deploy(cUSDAddress);
  await modelRegistry.waitForDeployment();
  const modelRegistryAddress = await modelRegistry.getAddress();
  console.log("   ModelRegistry deployed to:", modelRegistryAddress);
  deployedAddresses.ModelRegistry = modelRegistryAddress;

  // Save deployed addresses
  const outputPath = path.join(__dirname, "../deployments/l2-addresses.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));

  console.log("\n========================================");
  console.log("✅ All Contracts Deployed Successfully!");
  console.log("========================================\n");
  console.log("Deployed addresses saved to:", outputPath);
  console.log("\nContract Addresses:");
  console.log(JSON.stringify(deployedAddresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
EOFSCRIPT

echo "✅ L2 deployment script created"

# Deploy contracts
echo ""
echo "=========================================="
echo "Deploying Gaia Contracts to L2..."
echo "=========================================="
echo ""

# Set PRIVATE_KEY environment variable
export PRIVATE_KEY=$ADMIN_PRIVATE_KEY

npx hardhat run scripts/deploy-l2.js --network gaiaL2

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Deployment Successful!"
    echo "=========================================="
    echo ""
    echo "Deployed addresses saved to: web3/deployments/l2-addresses.json"
    echo ""
    
    if [ -f "deployments/l2-addresses.json" ]; then
        echo "Contract Addresses:"
        cat deployments/l2-addresses.json
        echo ""
        
        # Copy to op-stack-deployment directory
        cp deployments/l2-addresses.json "$PROJECT_ROOT/gaia-config/l2-contract-addresses.json"
        echo "✅ Addresses also saved to: $PROJECT_ROOT/gaia-config/l2-contract-addresses.json"
    fi
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error messages above"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Update frontend hooks with new L2 contract addresses"
echo "2. Configure frontend to use L2 RPC: http://localhost:8545"
echo "3. Update chainId to 424242 in frontend"
echo ""
