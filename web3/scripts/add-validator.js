const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Adding validator with account:", deployer.address);

  // Read deployment addresses
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const VERIFICATION_MANAGER_ADDRESS = addresses.VerificationManager;
  const VALIDATOR_ADDRESS = "0xABaF59180e0209bdB8b3048bFbe64e855074C0c4";

  console.log("VerificationManager:", VERIFICATION_MANAGER_ADDRESS);
  console.log("Adding validator:", VALIDATOR_ADDRESS);

  // Get the VerificationManager contract
  const verificationManager = await hre.ethers.getContractAt(
    "VerificationManager",
    VERIFICATION_MANAGER_ADDRESS
  );

  // Add the validator
  console.log("Sending addValidator transaction...");
  const tx = await verificationManager.addValidator(VALIDATOR_ADDRESS);
  console.log("Transaction hash:", tx.hash);

  // Wait for confirmation
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  console.log("✓ Validator added successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
