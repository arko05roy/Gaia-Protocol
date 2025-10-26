const hre = require("hardhat");
const { parseEther } = require("ethers");

async function main() {
  console.log("Testing createTask function...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  // Contract details
  const TASK_REGISTRY_ADDRESS = "0x8227Be17b8041320BDce38FA780fDe739354fEEb";
  const TaskRegistryABI = require("../artifacts/contracts/TaskRegistry.sol/TaskRegistry.json").abi;

  // Connect to contract
  const taskRegistry = new hre.ethers.Contract(
    TASK_REGISTRY_ADDRESS,
    TaskRegistryABI,
    signer
  );

  try {
    // Test parameters
    const description = "Test Reforestation Project";
    const estimatedCost = parseEther("50"); // 50 cUSD
    const expectedCO2 = parseEther("100"); // 100 tons
    const location = "Amazon Rainforest, Brazil";
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days from now
    const proofRequirements = "Satellite imagery and field reports";
    const ipfsHash = "QmTest123";

    console.log("\nTest Parameters:");
    console.log({
      description,
      estimatedCost: estimatedCost.toString(),
      expectedCO2: expectedCO2.toString(),
      location,
      deadline: deadline.toString(),
      proofRequirements,
      ipfsHash,
    });

    console.log("\nCalling createTask...");
    const tx = await taskRegistry.createTask(
      description,
      estimatedCost,
      expectedCO2,
      location,
      deadline,
      proofRequirements,
      ipfsHash
    );

    console.log("✅ Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("✅ Gas used:", receipt.gasUsed.toString());
    
    // Get the created task
    const totalTasks = await taskRegistry.getTotalTasks();
    console.log("✅ Total tasks now:", totalTasks.toString());

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }
}

main().catch(console.error);
