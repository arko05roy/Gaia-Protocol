const hre = require("hardhat");

async function main() {
  console.log("Testing L2 transaction to verify balance...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("From account:", signer.address);

  try {
    // Try to send a small amount to another address
    const tx = await signer.sendTransaction({
      to: "0x0000000000000000000000000000000000000001",
      value: hre.ethers.parseEther("1"),
      gasLimit: 21000,
      gasPrice: 1000000000
    });

    console.log("✅ Transaction sent:", tx.hash);
    console.log("✅ This confirms your account has ETH balance!");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
  } catch (error) {
    console.log("❌ Transaction failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("❌ Account has no balance");
    } else {
      console.log("⚠️  Other error - account might have balance but L2 has issues");
    }
  }
}

main().catch(console.error);
