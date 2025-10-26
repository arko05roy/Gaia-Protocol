const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Checking TaskRegistry contract state...\n");

  // Read deployed addresses
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Deployed addresses file not found.");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const TASK_REGISTRY_ADDRESS = addresses.TaskRegistry;

  console.log("TaskRegistry Address:", TASK_REGISTRY_ADDRESS);

  // Get contract instance
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = TaskRegistry.attach(TASK_REGISTRY_ADDRESS);

  try {
    // Check if paused
    const isPaused = await taskRegistry.paused();
    console.log("Is Paused:", isPaused);

    // Check owner
    const owner = await taskRegistry.owner();
    console.log("Owner:", owner);

    // Check dependent addresses
    const fundingPool = await taskRegistry.fundingPoolAddress();
    const collateralManager = await taskRegistry.collateralManagerAddress();
    const verificationManager = await taskRegistry.verificationManagerAddress();

    console.log("\nDependent Contracts:");
    console.log("FundingPool:", fundingPool);
    console.log("CollateralManager:", collateralManager);
    console.log("VerificationManager:", verificationManager);

    // Get total tasks
    const totalTasks = await taskRegistry.getTotalTasks();
    console.log("\nTotal Tasks:", totalTasks.toString());

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
