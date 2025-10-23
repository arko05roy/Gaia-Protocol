const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const GaiaModule = buildModule("GaiaModule", (m) => {
  // Configuration
  const CUSD_ADDRESS = "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b"; // Celo Alfajores testnet
  const BASE_URI = "https://rose-mad-leopon-618.mypinata.cloud/ipfs/";

  // Get deployer as treasury
  const deployer = m.getAccount(0);

  // ============================================================
  // PHASE 1: Deploy Core Contracts
  // ============================================================

  const taskRegistry = m.contract("TaskRegistry", []);
  
  const fundingPool = m.contract("FundingPool", [
    CUSD_ADDRESS,
    taskRegistry,
    deployer,
  ]);

  const collateralManager = m.contract("CollateralManager", [
    taskRegistry,
    deployer,
  ]);

  const verificationManager = m.contract("VerificationManager", [
    taskRegistry,
    collateralManager,
    fundingPool,
  ]);

  // ============================================================
  // PHASE 2: Deploy Token & Marketplace Contracts
  // ============================================================

  const carbonCreditMinter = m.contract("CarbonCreditMinter", [
    taskRegistry,
    fundingPool,
    BASE_URI,
  ]);

  const carbonMarketplace = m.contract("CarbonMarketplace", [
    carbonCreditMinter,
    CUSD_ADDRESS,
    deployer,
  ]);

  // ============================================================
  // PHASE 3: Deploy Prediction & Governance Contracts
  // ============================================================

  const predictionMarket = m.contract("PredictionMarket", [CUSD_ADDRESS]);

  const governanceDAO = m.contract("GovernanceDAO", [
    carbonCreditMinter,
    CUSD_ADDRESS,
  ]);

  // ============================================================
  // PHASE 4: Deploy DeSci Contracts
  // ============================================================

  const modelRegistry = m.contract("ModelRegistry", [CUSD_ADDRESS]);

  const dataRegistry = m.contract("DataRegistry", [taskRegistry]);

  // ============================================================
  // PHASE 5: Setup Contract Connections
  // ============================================================

  // TaskRegistry connections
  m.call(taskRegistry, "setFundingPool", [fundingPool]);
  m.call(taskRegistry, "setCollateralManager", [collateralManager]);
  m.call(taskRegistry, "setVerificationManager", [verificationManager]);

  // CollateralManager connections
  m.call(collateralManager, "setVerificationManager", [verificationManager]);

  // VerificationManager connections
  m.call(verificationManager, "setCarbonCreditMinter", [carbonCreditMinter]);

  // CarbonCreditMinter connections
  m.call(carbonCreditMinter, "setVerificationManager", [verificationManager]);

  // PredictionMarket connections
  m.call(predictionMarket, "setVerificationManager", [verificationManager]);

  // DataRegistry connections
  m.call(dataRegistry, "setVerificationManager", [verificationManager]);

  // ModelRegistry connections
  m.call(modelRegistry, "setVerificationManager", [verificationManager]);

  // ============================================================
  // PHASE 6: Initial Configuration
  // ============================================================

  // Add deployer as initial validator
  m.call(verificationManager, "addValidator", [deployer]);

  return {
    taskRegistry,
    fundingPool,
    collateralManager,
    verificationManager,
    carbonCreditMinter,
    carbonMarketplace,
    predictionMarket,
    governanceDAO,
    dataRegistry,
    modelRegistry,
  };
});

module.exports = GaiaModule;
