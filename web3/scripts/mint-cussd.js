const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const yourAddress = "0xABaF59180e0209bdB8b3048bFbe64e855074C0c4";
  
  // Read deployed addresses
  const fs = require("fs");
  const path = require("path");
  const addressesPath = path.join(__dirname, "../deployments/l2-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const cUSDAddress = addresses.cUSD;
  
  console.log("Minting cUSD tokens...");
  console.log("Minting to:", yourAddress);
  
  // Get cUSD contract
  const cUSD = await hre.ethers.getContractAt("MockERC20", cUSDAddress);
  
  // Mint 1,000,000 cUSD
  const mintAmount = hre.ethers.parseUnits("1000000", 18);
  const tx = await cUSD.mint(yourAddress, mintAmount);
  await tx.wait();
  
  // Check balance
  const balance = await cUSD.balanceOf(yourAddress);
  console.log("✓ Minted! Your GAIA balance:", hre.ethers.formatUnits(balance, 18), "cUSD");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
