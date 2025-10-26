const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Deploying Gaia Protocol to L2");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  try {
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");
  } catch (e) {
    console.log("Account balance: Unable to fetch (L2 node limitation)\n");
  }

  const deployedAddresses = {};

  // Deploy cUSD mock token for L2
  console.log("1. Deploying cUSD Token...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const cUSD = await MockERC20.deploy("Celo Dollar", "cUSD", {
    gasLimit: 5000000,
    gasPrice: 1000000000
  });
  await cUSD.waitForDeployment();
  const cUSDAddress = await cUSD.getAddress();
  console.log("   cUSD deployed to:", cUSDAddress);
  deployedAddresses.cUSD = cUSDAddress;

  // Deploy Treasury
  console.log("\n2. Deploying Treasury...");
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy({ gasLimit: 5000000, gasPrice: 1000000000 });
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("   Treasury deployed to:", treasuryAddress);
  deployedAddresses.Treasury = treasuryAddress;

  // Deploy TaskRegistry
  console.log("\n3. Deploying TaskRegistry...");
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = await TaskRegistry.deploy({ gasLimit: 5000000, gasPrice: 1000000000 });
  await taskRegistry.waitForDeployment();
  const taskRegistryAddress = await taskRegistry.getAddress();
  console.log("   TaskRegistry deployed to:", taskRegistryAddress);
  deployedAddresses.TaskRegistry = taskRegistryAddress;

  // Deploy FundingPool
  console.log("\n4. Deploying FundingPool...");
  const FundingPool = await hre.ethers.getContractFactory("FundingPool");
  const fundingPool = await FundingPool.deploy(taskRegistryAddress, cUSDAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await fundingPool.waitForDeployment();
  const fundingPoolAddress = await fundingPool.getAddress();
  console.log("   FundingPool deployed to:", fundingPoolAddress);
  deployedAddresses.FundingPool = fundingPoolAddress;

  // Deploy CollateralManager
  console.log("\n5. Deploying CollateralManager...");
  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy(taskRegistryAddress, cUSDAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log("   CollateralManager deployed to:", collateralManagerAddress);
  deployedAddresses.CollateralManager = collateralManagerAddress;

  // Deploy VerificationManager
  console.log("\n6. Deploying VerificationManager...");
  const VerificationManager = await hre.ethers.getContractFactory("VerificationManager");
  const verificationManager = await VerificationManager.deploy(taskRegistryAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await verificationManager.waitForDeployment();
  const verificationManagerAddress = await verificationManager.getAddress();
  console.log("   VerificationManager deployed to:", verificationManagerAddress);
  deployedAddresses.VerificationManager = verificationManagerAddress;

  // Deploy CarbonCreditMinter
  console.log("\n7. Deploying CarbonCreditMinter...");
  const CarbonCreditMinter = await hre.ethers.getContractFactory("CarbonCreditMinter");
  const carbonCreditMinter = await CarbonCreditMinter.deploy(taskRegistryAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await carbonCreditMinter.waitForDeployment();
  const carbonCreditMinterAddress = await carbonCreditMinter.getAddress();
  console.log("   CarbonCreditMinter deployed to:", carbonCreditMinterAddress);
  deployedAddresses.CarbonCreditMinter = carbonCreditMinterAddress;

  // Deploy CarbonMarketplace
  console.log("\n8. Deploying CarbonMarketplace...");
  const CarbonMarketplace = await hre.ethers.getContractFactory("CarbonMarketplace");
  const carbonMarketplace = await CarbonMarketplace.deploy(carbonCreditMinterAddress, cUSDAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await carbonMarketplace.waitForDeployment();
  const carbonMarketplaceAddress = await carbonMarketplace.getAddress();
  console.log("   CarbonMarketplace deployed to:", carbonMarketplaceAddress);
  deployedAddresses.CarbonMarketplace = carbonMarketplaceAddress;

  // Deploy PredictionMarketplace
  console.log("\n9. Deploying PredictionMarketplace...");
  const PredictionMarketplace = await hre.ethers.getContractFactory("PredictionMarketplace");
  const predictionMarketplace = await PredictionMarketplace.deploy(taskRegistryAddress, cUSDAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await predictionMarketplace.waitForDeployment();
  const predictionMarketplaceAddress = await predictionMarketplace.getAddress();
  console.log("   PredictionMarketplace deployed to:", predictionMarketplaceAddress);
  deployedAddresses.PredictionMarketplace = predictionMarketplaceAddress;

  // Deploy GovernanceDAO
  console.log("\n10. Deploying GovernanceDAO...");
  const GovernanceDAO = await hre.ethers.getContractFactory("GovernanceDAO");
  const governanceDAO = await GovernanceDAO.deploy(cUSDAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await governanceDAO.waitForDeployment();
  const governanceDAOAddress = await governanceDAO.getAddress();
  console.log("   GovernanceDAO deployed to:", governanceDAOAddress);
  deployedAddresses.GovernanceDAO = governanceDAOAddress;

  // Deploy DataRegistry
  console.log("\n11. Deploying DataRegistry...");
  const DataRegistry = await hre.ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistry.deploy(taskRegistryAddress, cUSDAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
  await dataRegistry.waitForDeployment();
  const dataRegistryAddress = await dataRegistry.getAddress();
  console.log("   DataRegistry deployed to:", dataRegistryAddress);
  deployedAddresses.DataRegistry = dataRegistryAddress;

  // Deploy ModelRegistry
  console.log("\n12. Deploying ModelRegistry...");
  const ModelRegistry = await hre.ethers.getContractFactory("ModelRegistry");
  const modelRegistry = await ModelRegistry.deploy(cUSDAddress, { gasLimit: 5000000, gasPrice: 1000000000 });
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
