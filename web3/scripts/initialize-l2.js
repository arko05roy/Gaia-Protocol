const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Initializing L2 Contracts");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Initializing with account:", deployer.address);

  // Read deployed addresses
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Deployed addresses file not found. Run deploy-l2-fast.js first.");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  console.log("\nLoaded addresses:");
  console.log(JSON.stringify(addresses, null, 2));

  const gasConfig = { gasLimit: 5000000, gasPrice: 1000000000 };

  // Get contract instances
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = TaskRegistry.attach(addresses.TaskRegistry);

  const FundingPool = await hre.ethers.getContractFactory("FundingPool");
  const fundingPool = FundingPool.attach(addresses.FundingPool);

  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = CollateralManager.attach(addresses.CollateralManager);

  const VerificationManager = await hre.ethers.getContractFactory("VerificationManager");
  const verificationManager = VerificationManager.attach(addresses.VerificationManager);

  // Initialize TaskRegistry with dependent contracts
  console.log("\n1. Setting FundingPool address on TaskRegistry...");
  try {
    const tx1 = await taskRegistry.setFundingPool(addresses.FundingPool, gasConfig);
    await tx1.wait();
    console.log("   ✅ FundingPool set");
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  console.log("\n2. Setting CollateralManager address on TaskRegistry...");
  try {
    const tx2 = await taskRegistry.setCollateralManager(addresses.CollateralManager, gasConfig);
    await tx2.wait();
    console.log("   ✅ CollateralManager set");
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  console.log("\n3. Setting VerificationManager address on TaskRegistry...");
  try {
    const tx3 = await taskRegistry.setVerificationManager(addresses.VerificationManager, gasConfig);
    await tx3.wait();
    console.log("   ✅ VerificationManager set");
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Check if TaskRegistry is paused
  console.log("\n4. Checking if TaskRegistry is paused...");
  try {
    const isPaused = await taskRegistry.paused();
    console.log("   Paused status:", isPaused);
    if (isPaused) {
      console.log("   ⚠️  TaskRegistry is PAUSED. Attempting to unpause...");
      const tx = await taskRegistry.unpause(gasConfig);
      await tx.wait();
      console.log("   ✅ TaskRegistry unpaused");
    }
  } catch (error) {
    console.error("   ❌ Error checking pause status:", error.message);
  }

  console.log("\n========================================");
  console.log("✅ Initialization Complete!");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
