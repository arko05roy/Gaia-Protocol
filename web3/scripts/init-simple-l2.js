const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Simple L2 Contract Initialization");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);

  // Read deployed addresses
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  console.log("\nDeployed Contracts:");
  console.log(JSON.stringify(addresses, null, 2));

  // Verify contracts are on chain
  console.log("\n\nVerifying contracts on L2...");
  for (const [name, address] of Object.entries(addresses)) {
    const code = await hre.ethers.provider.getCode(address);
    const isDeployed = code !== "0x";
    console.log(`${name}: ${isDeployed ? "✓ Deployed" : "✗ NOT DEPLOYED"}`);
  }

  console.log("\n========================================");
  console.log("✅ Verification Complete!");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
