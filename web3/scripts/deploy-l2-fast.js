const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Deploying Gaia Protocol to L2 (Fast Mode)");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const deployedAddresses = {};
  const gasConfig = { gasLimit: 5000000, gasPrice: 1000000000 };

  // Deploy cUSD mock token for L2
  console.log("1. Deploying cUSD Token...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const cUSD = await MockERC20.deploy("Celo Dollar", "cUSD", gasConfig);
  const cUSDAddress = await cUSD.getAddress();
  console.log("   cUSD deployed to:", cUSDAddress);
  deployedAddresses.cUSD = cUSDAddress;

  // Deploy Treasury
  console.log("\n2. Deploying Treasury...");
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(gasConfig);
  const treasuryAddress = await treasury.getAddress();
  console.log("   Treasury deployed to:", treasuryAddress);
  deployedAddresses.Treasury = treasuryAddress;

  // Deploy TaskRegistry
  console.log("\n3. Deploying TaskRegistry...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy(gasConfig);
  const taskRegistryAddress = await taskRegistry.getAddress();
  console.log("   TaskRegistry deployed to:", taskRegistryAddress);
  deployedAddresses.TaskRegistry = taskRegistryAddress;

  // Deploy FundingPool (cUSD, TaskRegistry, Treasury)
  console.log("\n4. Deploying FundingPool...");
  const FundingPool = await hre.ethers.getContractFactory("FundingPool");
  const fundingPool = await FundingPool.deploy(cUSDAddress, taskRegistryAddress, treasuryAddress, gasConfig);
  const fundingPoolAddress = await fundingPool.getAddress();
  console.log("   FundingPool deployed to:", fundingPoolAddress);
  deployedAddresses.FundingPool = fundingPoolAddress;

  // Deploy CollateralManager (TaskRegistry, Treasury)
  console.log("\n5. Deploying CollateralManager...");
  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(taskRegistryAddress, treasuryAddress, gasConfig);
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("   CollateralManager deployed to:", collateralManagerAddress);
  deployedAddresses.CollateralManager = collateralManagerAddress;

  // Deploy VerificationManager (TaskRegistry, CollateralManager, FundingPool)
  console.log("\n6. Deploying VerificationManager...");
  const VerificationManager = await hre.ethers.getContractFactory("VerificationManager");
  const verificationManager = await VerificationManager.deploy(taskRegistryAddress, collateralManagerAddress, fundingPoolAddress, gasConfig);
  const verificationManagerAddress = await verificationManager.getAddress();
  console.log("   VerificationManager deployed to:", verificationManagerAddress);
  deployedAddresses.VerificationManager = verificationManagerAddress;

  // Deploy CarbonCreditMinter (TaskRegistry, FundingPool, baseURI)
  console.log("\n7. Deploying CarbonCreditMinter...");
  const CarbonCreditMinter = await hre.ethers.getContractFactory("CarbonCreditMinter");
  const carbonCreditMinter = await CarbonCreditMinter.deploy(taskRegistryAddress, fundingPoolAddress, "ipfs://", gasConfig);
  const carbonCreditMinterAddress = await carbonCreditMinter.getAddress();
  console.log("   CarbonCreditMinter deployed to:", carbonCreditMinterAddress);
  deployedAddresses.CarbonCreditMinter = carbonCreditMinterAddress;

  // Deploy CarbonMarketplace (CreditToken, cUSD, Treasury)
  console.log("\n8. Deploying CarbonMarketplace...");
  const CarbonMarketplace = await hre.ethers.getContractFactory("CarbonMarketplace");
  const carbonMarketplace = await CarbonMarketplace.deploy(carbonCreditMinterAddress, cUSDAddress, treasuryAddress, gasConfig);
  const carbonMarketplaceAddress = await carbonMarketplace.getAddress();
  console.log("   CarbonMarketplace deployed to:", carbonMarketplaceAddress);
  deployedAddresses.CarbonMarketplace = carbonMarketplaceAddress;

  // Deploy PredictionMarket (cUSD)
  console.log("\n9. Deploying PredictionMarket...");
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(cUSDAddress, gasConfig);
  const predictionMarketAddress = await predictionMarket.getAddress();
  console.log("   PredictionMarket deployed to:", predictionMarketAddress);
  deployedAddresses.PredictionMarket = predictionMarketAddress;

  // Deploy GovernanceDAO (CreditToken, cUSD)
  console.log("\n10. Deploying GovernanceDAO...");
  const GovernanceDAO = await hre.ethers.getContractFactory("GovernanceDAO");
  const governanceDAO = await GovernanceDAO.deploy(carbonCreditMinterAddress, cUSDAddress, gasConfig);
  const governanceDAOAddress = await governanceDAO.getAddress();
  console.log("   GovernanceDAO deployed to:", governanceDAOAddress);
  deployedAddresses.GovernanceDAO = governanceDAOAddress;

  // Deploy DataRegistry (TaskRegistry)
  console.log("\n11. Deploying DataRegistry...");
  const DataRegistry = await hre.ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistry.deploy(taskRegistryAddress, gasConfig);
  const dataRegistryAddress = await dataRegistry.getAddress();
  console.log("   DataRegistry deployed to:", dataRegistryAddress);
  deployedAddresses.DataRegistry = dataRegistryAddress;

  // Deploy ModelRegistry
  console.log("\n12. Deploying ModelRegistry...");
  const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
  const modelRegistry = await ModelRegistry.deploy(cUSDAddress, gasConfig);
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
