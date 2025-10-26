const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Checking and unpausing contracts...\n");

  // Read deployed addresses
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Deployed addresses file not found.");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  // List of pausable contracts
  const pausableContracts = [
    "TaskRegistry",
    "FundingPool",
    "VerificationManager",
    "CarbonCreditMinter",
    "CarbonMarketplace",
    "PredictionMarket",
  ];

  for (const contractName of pausableContracts) {
    const contractAddress = addresses[contractName];
    if (!contractAddress) {
      console.log(`⚠️  ${contractName} address not found`);
      continue;
    }

    try {
      const Contract = await hre.ethers.getContractFactory(contractName);
      const contract = Contract.attach(contractAddress);

      // Check if paused
      const isPaused = await contract.paused();
      console.log(`\n${contractName}:`);
      console.log(`  Address: ${contractAddress}`);
      console.log(`  Is Paused: ${isPaused}`);

      if (isPaused) {
        console.log(`  ⏳ Unpausing...`);
        const tx = await contract.unpause();
        await tx.wait();
        console.log(`  ✅ Unpaused!`);
      } else {
        console.log(`  ✅ Already unpaused`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
