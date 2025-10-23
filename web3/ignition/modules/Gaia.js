// scripts/deploy.js
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Starting deployment to Celo network...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Configuration
  const CUSD_ADDRESS = "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b"; // Celo Alfajores testnet
  const TREASURY_ADDRESS = deployer.address; // Use deployer as treasury for now
  const BASE_URI = "https://rose-mad-leopon-618.mypinata.cloud/ipfs/"; // Update with your IPFS gateway

  const contracts = {};

  // ============================================================
  // PHASE 1: Deploy Core Contracts
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("PHASE 1: Deploying Core Contracts");
  console.log("=" .repeat(60) + "\n");

  console.log("📝 Deploying TaskRegistry...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy();
  await taskRegistry.waitForDeployment();
  contracts.TaskRegistry = await taskRegistry.getAddress();
  console.log("✅ TaskRegistry deployed to:", contracts.TaskRegistry, "\n");

  console.log("📝 Deploying FundingPool...");
  const FundingPool = await hre.ethers.getContractFactory("FundingPool");
  const fundingPool = await FundingPool.deploy(
    CUSD_ADDRESS,
    contracts.TaskRegistry,
    TREASURY_ADDRESS
  );
  await fundingPool.waitForDeployment();
  contracts.FundingPool = await fundingPool.getAddress();
  console.log("✅ FundingPool deployed to:", contracts.FundingPool, "\n");

  console.log("📝 Deploying CollateralManager...");
  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(
    contracts.TaskRegistry,
    TREASURY_ADDRESS
  );
  await collateralManager.waitForDeployment();
  contracts.CollateralManager = await collateralManager.getAddress();
  console.log("✅ CollateralManager deployed to:", contracts.CollateralManager, "\n");

  console.log("📝 Deploying VerificationManager...");
  const VerificationManager = await hre.ethers.getContractFactory("VerificationManager");
  const verificationManager = await VerificationManager.deploy(
    contracts.TaskRegistry,
    contracts.CollateralManager,
    contracts.FundingPool
  );
  await verificationManager.waitForDeployment();
  contracts.VerificationManager = await verificationManager.getAddress();
  console.log("✅ VerificationManager deployed to:", contracts.VerificationManager, "\n");

  // ============================================================
  // PHASE 2: Deploy Token & Marketplace Contracts
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("PHASE 2: Deploying Token & Marketplace Contracts");
  console.log("=" .repeat(60) + "\n");

  console.log("📝 Deploying CarbonCreditMinter...");
  const CarbonCreditMinter = await hre.ethers.getContractFactory("CarbonCreditMinter");
  const carbonCreditMinter = await CarbonCreditMinter.deploy(
    contracts.TaskRegistry,
    contracts.FundingPool,
    BASE_URI
  );
  await carbonCreditMinter.waitForDeployment();
  contracts.CarbonCreditMinter = await carbonCreditMinter.getAddress();
  console.log("✅ CarbonCreditMinter deployed to:", contracts.CarbonCreditMinter, "\n");

  console.log("📝 Deploying CarbonMarketplace...");
  const CarbonMarketplace = await hre.ethers.getContractFactory("CarbonMarketplace");
  const carbonMarketplace = await CarbonMarketplace.deploy(
    contracts.CarbonCreditMinter,
    CUSD_ADDRESS,
    TREASURY_ADDRESS
  );
  await carbonMarketplace.waitForDeployment();
  contracts.CarbonMarketplace = await carbonMarketplace.getAddress();
  console.log("✅ CarbonMarketplace deployed to:", contracts.CarbonMarketplace, "\n");

  // ============================================================
  // PHASE 3: Deploy Prediction & Governance Contracts
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("PHASE 3: Deploying Prediction & Governance Contracts");
  console.log("=" .repeat(60) + "\n");

  console.log("📝 Deploying PredictionMarket...");
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(CUSD_ADDRESS);
  await predictionMarket.waitForDeployment();
  contracts.PredictionMarket = await predictionMarket.getAddress();
  console.log("✅ PredictionMarket deployed to:", contracts.PredictionMarket, "\n");

  console.log("📝 Deploying GovernanceDAO...");
  const GovernanceDAO = await hre.ethers.getContractFactory("GovernanceDAO");
  const governanceDAO = await GovernanceDAO.deploy(
    contracts.CarbonCreditMinter,
    CUSD_ADDRESS
  );
  await governanceDAO.waitForDeployment();
  contracts.GovernanceDAO = await governanceDAO.getAddress();
  console.log("✅ GovernanceDAO deployed to:", contracts.GovernanceDAO, "\n");

  // ============================================================
  // PHASE 4: Deploy DeSci Contracts
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("PHASE 4: Deploying DeSci Contracts");
  console.log("=" .repeat(60) + "\n");

  console.log("📝 Deploying ModelRegistry...");
  const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
  const modelRegistry = await ModelRegistry.deploy(CUSD_ADDRESS);
  await modelRegistry.waitForDeployment();
  contracts.ModelRegistry = await modelRegistry.getAddress();
  console.log("✅ ModelRegistry deployed to:", contracts.ModelRegistry, "\n");


  console.log("📝 Deploying DataRegistry...");
  const DataRegistry = await hre.ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistry.deploy(contracts.TaskRegistry);
  await dataRegistry.waitForDeployment();
  contracts.DataRegistry = await dataRegistry.getAddress();
  console.log("✅ DataRegistry deployed to:", contracts.DataRegistry, "\n");

  // ============================================================
  // PHASE 5: Setup Contract Connections
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("PHASE 5: Setting up Contract Connections");
  console.log("=" .repeat(60) + "\n");

  console.log("🔗 Connecting TaskRegistry...");
  let tx = await taskRegistry.setFundingPool(contracts.FundingPool);
  await tx.wait();
  console.log("  ✓ FundingPool set");
  
  tx = await taskRegistry.setCollateralManager(contracts.CollateralManager);
  await tx.wait();
  console.log("  ✓ CollateralManager set");
  
  tx = await taskRegistry.setVerificationManager(contracts.VerificationManager);
  await tx.wait();
  console.log("  ✓ VerificationManager set\n");

  console.log("🔗 Connecting CollateralManager...");
  tx = await collateralManager.setVerificationManager(contracts.VerificationManager);
  await tx.wait();
  console.log("  ✓ VerificationManager set\n");

  console.log("🔗 Connecting VerificationManager...");
  tx = await verificationManager.setCarbonCreditMinter(contracts.CarbonCreditMinter);
  await tx.wait();
  console.log("  ✓ CarbonCreditMinter set\n");

  console.log("🔗 Connecting CarbonCreditMinter...");
  tx = await carbonCreditMinter.setVerificationManager(contracts.VerificationManager);
  await tx.wait();
  console.log("  ✓ VerificationManager set\n");

  console.log("🔗 Connecting PredictionMarket...");
  tx = await predictionMarket.setVerificationManager(contracts.VerificationManager);
  await tx.wait();
  console.log("  ✓ VerificationManager set\n");

  console.log("🔗 Connecting DataRegistry...");
  tx = await dataRegistry.setVerificationManager(contracts.VerificationManager);
  await tx.wait();
  console.log("  ✓ VerificationManager set\n");

  console.log("🔗 Connecting ModelRegistry...");
  tx = await modelRegistry.setVerificationManager(contracts.VerificationManager);
  await tx.wait();
  console.log("  ✓ VerificationManager set\n");

  // ============================================================
  // PHASE 6: Initial Configuration
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("PHASE 6: Initial Configuration");
  console.log("=" .repeat(60) + "\n");

  console.log("👥 Adding initial validators...");
  const validatorAddresses = [
    deployer.address, // Add deployer as first validator
    // Add more validator addresses here if needed
  ];

  for (const validator of validatorAddresses) {
    tx = await verificationManager.addValidator(validator);
    await tx.wait();
    console.log("  ✓ Added validator:", validator);
  }
  console.log("");

  // ============================================================
  // PHASE 7: Save Deployment Info
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("PHASE 7: Saving Deployment Information");
  console.log("=" .repeat(60) + "\n");

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ...contracts,
      cUSD: CUSD_ADDRESS,
      Treasury: TREASURY_ADDRESS
    },
    configuration: {
      baseURI: BASE_URI,
      validators: validatorAddresses
    }
  };

  // Save to JSON file
  const filename = `./deployments/${hre.network.name}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }

  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", filename, "\n");

  // Also save a simple address file for frontend
  const addressesForFrontend = {
    TaskRegistry: contracts.TaskRegistry,
    FundingPool: contracts.FundingPool,
    CollateralManager: contracts.CollateralManager,
    VerificationManager: contracts.VerificationManager,
    CarbonCreditMinter: contracts.CarbonCreditMinter,
    CarbonMarketplace: contracts.CarbonMarketplace,
    PredictionMarket: contracts.PredictionMarket,
    GovernanceDAO: contracts.GovernanceDAO,
    DataRegistry: contracts.DataRegistry,
    ModelRegistry: contracts.ModelRegistry,
    cUSD: CUSD_ADDRESS
  };

  fs.writeFileSync(
    './deployed-addresses.json',
    JSON.stringify(addressesForFrontend, null, 2)
  );
  console.log("💾 Frontend addresses saved to: ./deployed-addresses.json\n");

  // ============================================================
  // Summary
  // ============================================================
  
  console.log("=" .repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60));
  console.log("\n📋 Deployed Contract Addresses:\n");
  
  console.log("Core Contracts:");
  console.log("  TaskRegistry:         ", contracts.TaskRegistry);
  console.log("  FundingPool:          ", contracts.FundingPool);
  console.log("  CollateralManager:    ", contracts.CollateralManager);
  console.log("  VerificationManager:  ", contracts.VerificationManager);
  
  console.log("\nToken & Marketplace:");
  console.log("  CarbonCreditMinter:   ", contracts.CarbonCreditMinter);
  console.log("  CarbonMarketplace:    ", contracts.CarbonMarketplace);
  
  console.log("\nPrediction & Governance:");
  console.log("  PredictionMarket:     ", contracts.PredictionMarket);
  console.log("  GovernanceDAO:        ", contracts.GovernanceDAO);
  
  console.log("\nDeSci:");
  console.log("  DataRegistry:         ", contracts.DataRegistry);
  console.log("  ModelRegistry:        ", contracts.ModelRegistry);
  
  console.log("\nExternal:");
  console.log("  cUSD Token:           ", CUSD_ADDRESS);
  console.log("  Treasury:             ", TREASURY_ADDRESS);
  
  console.log("\n⚠️  Next Steps:");
  console.log("  1. Verify contracts on Celoscan:");
  console.log("     npx hardhat verify --network alfajores <CONTRACT_ADDRESS>");
  console.log("  2. Update frontend config with addresses from deployed-addresses.json");
  console.log("  3. Add more validators if needed:");
  console.log("     await verificationManager.addValidator(ADDRESS)");
  console.log("  4. Transfer ownership to multisig for production");
  console.log("  5. Fund treasury with initial cUSD for rewards");
  
  console.log("\n" + "=" .repeat(60));
  console.log("✨ All contracts deployed and configured successfully!");
  console.log("=" .repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
