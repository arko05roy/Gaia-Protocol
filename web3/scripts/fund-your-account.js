const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const yourAddress = "0xABaF59180e0209bdB8b3048bFbe64e855074C0c4";
  
  console.log("Funding your account...");
  console.log("From:", deployer.address);
  console.log("To:", yourAddress);
  
  const tx = await deployer.sendTransaction({
    to: yourAddress,
    value: hre.ethers.parseEther("100"),
  });
  
  await tx.wait();
  
  const balance = await hre.ethers.provider.getBalance(yourAddress);
  console.log("✓ Funded! Your balance:", hre.ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
