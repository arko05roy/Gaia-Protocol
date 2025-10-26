const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Initializing with:", deployer.address);

  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = TaskRegistry.attach(addresses.TaskRegistry);

  const gasConfig = { gasLimit: 5000000, gasPrice: 1000000000 };

  console.log("\nSetting contract addresses on TaskRegistry...");
  
  try {
    let tx = await taskRegistry.setFundingPool(addresses.FundingPool, gasConfig);
    await tx.wait();
    console.log("✅ FundingPool set");
  } catch (e) {
    console.log("❌ FundingPool:", e.message);
  }

  try {
    let tx = await taskRegistry.setCollateralManager(addresses.CollateralManager, gasConfig);
    await tx.wait();
    console.log("✅ CollateralManager set");
  } catch (e) {
    console.log("❌ CollateralManager:", e.message);
  }

  try {
    let tx = await taskRegistry.setVerificationManager(addresses.VerificationManager, gasConfig);
    await tx.wait();
    console.log("✅ VerificationManager set");
  } catch (e) {
    console.log("❌ VerificationManager:", e.message);
  }

  console.log("\n✅ Initialization complete!");
}

main().catch(console.error);
