const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Initializing Gaia Protocol Contracts");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Initializing with account:", deployer.address);

  // Read deployed addresses
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const gasConfig = { gasLimit: 5000000, gasPrice: 1000000000 };

  // Get contract instances
  const TaskRegistry = await hre.ethers.getContractAt("TaskRegistry", addresses.TaskRegistry);
  const FundingPool = await hre.ethers.getContractAt("FundingPool", addresses.FundingPool);
  const CollateralManager = await hre.ethers.getContractAt("CollateralManager", addresses.CollateralManager);
  const VerificationManager = await hre.ethers.getContractAt("VerificationManager", addresses.VerificationManager);
  const CarbonCreditMinter = await hre.ethers.getContractAt("CarbonCreditMinter", addresses.CarbonCreditMinter);
  const cUSD = await hre.ethers.getContractAt("MockERC20", addresses.cUSD);

  // 1. Initialize TaskRegistry with dependencies
  console.log("\n1. Initializing TaskRegistry with dependencies...");
  try {
    let tx = await TaskRegistry.setFundingPool(addresses.FundingPool, gasConfig);
    await tx.wait();
    console.log("   ✓ FundingPool set on TaskRegistry");
  } catch (e) {
    console.log("   ℹ FundingPool already set or error:", e.message.split("\n")[0]);
  }

  try {
    let tx = await TaskRegistry.setCollateralManager(addresses.CollateralManager, gasConfig);
    await tx.wait();
    console.log("   ✓ CollateralManager set on TaskRegistry");
  } catch (e) {
    console.log("   ℹ CollateralManager already set or error:", e.message.split("\n")[0]);
  }

  try {
    let tx = await TaskRegistry.setVerificationManager(addresses.VerificationManager, gasConfig);
    await tx.wait();
    console.log("   ✓ VerificationManager set on TaskRegistry");
  } catch (e) {
    console.log("   ℹ VerificationManager already set or error:", e.message.split("\n")[0]);
  }

  // 2. Mint cUSD to deployer for testing
  console.log("\n2. Minting cUSD tokens for testing...");
  try {
    const mintAmount = hre.ethers.parseUnits("10000", 18);
    let tx = await cUSD.mint(deployer.address, mintAmount, gasConfig);
    await tx.wait();
    console.log("   ✓ Minted 10,000 cUSD to deployer");
  } catch (e) {
    console.log("   ℹ cUSD mint failed or already minted:", e.message.split("\n")[0]);
  }

  // 3. Approve FundingPool to spend cUSD
  console.log("\n3. Approving FundingPool to spend cUSD...");
  try {
    const approveAmount = hre.ethers.parseUnits("100000", 18);
    let tx = await cUSD.approve(addresses.FundingPool, approveAmount, gasConfig);
    await tx.wait();
    console.log("   ✓ Approved FundingPool to spend cUSD");
  } catch (e) {
    console.log("   ℹ Approval failed or already approved:", e.message.split("\n")[0]);
  }

  // 4. Approve CarbonCreditMinter to spend cUSD
  console.log("\n4. Approving CarbonCreditMinter to spend cUSD...");
  try {
    const approveAmount = hre.ethers.parseUnits("100000", 18);
    let tx = await cUSD.approve(addresses.CarbonCreditMinter, approveAmount, gasConfig);
    await tx.wait();
    console.log("   ✓ Approved CarbonCreditMinter to spend cUSD");
  } catch (e) {
    console.log("   ℹ Approval failed or already approved:", e.message.split("\n")[0]);
  }

  console.log("\n========================================");
  console.log("✅ Contract Initialization Complete!");
  console.log("========================================\n");
  console.log("Contract Addresses:");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
