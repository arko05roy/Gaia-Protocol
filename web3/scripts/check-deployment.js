const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Checking L2 deployment...\n");

  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ Deployed addresses file not found.");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const provider = hre.ethers.provider;

  for (const [name, address] of Object.entries(addresses)) {
    try {
      const code = await provider.getCode(address);
      const isDeployed = code !== "0x";
      console.log(`${name}: ${address}`);
      console.log(`  Deployed: ${isDeployed ? "✅ YES" : "❌ NO"}`);
      if (isDeployed) {
        console.log(`  Code size: ${code.length} bytes`);
      }
    } catch (error) {
      console.log(`${name}: ${address}`);
      console.log(`  Error: ${error.message}`);
    }
  }
}

main().catch(console.error);
