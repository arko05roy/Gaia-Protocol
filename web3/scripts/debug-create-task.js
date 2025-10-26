const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Debugging createTask Error");
  console.log("========================================\n");

  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    console.error("❌ No signers available. Make sure L2 node is running and PRIVATE_KEY is set.");
    process.exit(1);
  }
  const signer = signers[0];
  console.log("Signer:", signer.address);

  // Read deployed addresses
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Deployed addresses file not found.");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const TASK_REGISTRY_ADDRESS = addresses.TaskRegistry;

  console.log("\nTaskRegistry Address:", TASK_REGISTRY_ADDRESS);

  // Get contract instance
  const TaskRegistry = await hre.ethers.getContractFactory("TaskRegistry");
  const taskRegistry = TaskRegistry.attach(TASK_REGISTRY_ADDRESS);

  // Step 1: Check if contract is paused
  console.log("\n1. Checking if contract is paused...");
  try {
    const isPaused = await taskRegistry.paused();
    console.log("   Paused:", isPaused);
    if (isPaused) {
      console.log("   ⚠️  CONTRACT IS PAUSED - This is likely the issue!");
      console.log("   Attempting to unpause...");
      const tx = await taskRegistry.unpause({ gasLimit: 5000000, gasPrice: 1000000000 });
      await tx.wait();
      console.log("   ✅ Contract unpaused");
    }
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Step 2: Check contract addresses
  console.log("\n2. Checking contract address settings...");
  try {
    const fundingPool = await taskRegistry.fundingPoolAddress();
    const collateralManager = await taskRegistry.collateralManagerAddress();
    const verificationManager = await taskRegistry.verificationManagerAddress();

    console.log("   FundingPool:", fundingPool);
    console.log("   CollateralManager:", collateralManager);
    console.log("   VerificationManager:", verificationManager);

    if (fundingPool === "0x0000000000000000000000000000000000000000") {
      console.log("   ⚠️  FundingPool not set!");
    }
    if (collateralManager === "0x0000000000000000000000000000000000000000") {
      console.log("   ⚠️  CollateralManager not set!");
    }
    if (verificationManager === "0x0000000000000000000000000000000000000000") {
      console.log("   ⚠️  VerificationManager not set!");
    }
  } catch (error) {
    console.error("   ❌ Error:", error.message);
  }

  // Step 3: Try to create a task with valid parameters
  console.log("\n3. Attempting to create a task...");
  try {
    const description = "Debug test task";
    const estimatedCost = hre.ethers.parseEther("50"); // 50 cUSD
    const expectedCO2 = hre.ethers.parseEther("100"); // 100 tons
    const location = "Test Location";
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days from now
    const proofRequirements = "Test proof";
    const ipfsHash = "QmTest123";

    console.log("   Parameters:");
    console.log("   - description:", description);
    console.log("   - estimatedCost:", estimatedCost.toString());
    console.log("   - expectedCO2:", expectedCO2.toString());
    console.log("   - location:", location);
    console.log("   - deadline:", deadline.toString());
    console.log("   - proofRequirements:", proofRequirements);
    console.log("   - ipfsHash:", ipfsHash);

    const tx = await taskRegistry.createTask(
      description,
      estimatedCost,
      expectedCO2,
      location,
      deadline,
      proofRequirements,
      ipfsHash,
      { gasLimit: 5000000, gasPrice: 1000000000 }
    );

    console.log("   ✅ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("   ✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("   ✅ Gas used:", receipt.gasUsed.toString());

    // Get the created task
    const totalTasks = await taskRegistry.getTotalTasks();
    console.log("   ✅ Total tasks now:", totalTasks.toString());

  } catch (error) {
    console.error("   ❌ Error:", error.message);
    if (error.data) {
      console.error("   Error data:", error.data);
    }
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
  }

  console.log("\n========================================");
  console.log("Debug Complete");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
