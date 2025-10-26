const hre = require("hardhat");
const { parseEther } = require("ethers");

async function main() {
  console.log("========================================");
  console.log("Minting ETH to Test Accounts on L2");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Minting from account:", deployer.address);

  // Test accounts to fund
  const testAccounts = [
    "0x89a26a33747b293430D4269A59525d5D0D5BbE65", // Admin
    "0xd9fC5AEA3D4e8F484f618cd90DC6f7844a500f62", // Batcher
    "0x79BF82C41a7B6Af998D47D2ea92Fe0ed0af6Ed47", // Proposer
    "0xB24e7987af06aF7CFB94E4021d0B3CB8f80f0E49", // Sequencer
  ];

  const ethAmount = parseEther("10"); // 10 ETH per account

  console.log(`Minting ${hre.ethers.formatEther(ethAmount)} ETH to each account...\n`);

  for (const account of testAccounts) {
    try {
      const tx = await deployer.sendTransaction({
        to: account,
        value: ethAmount,
        gasLimit: 21000,
        gasPrice: 1000000000, // 1 Gwei
      });

      console.log(`✅ Sent 10 ETH to ${account}`);
      console.log(`   TX Hash: ${tx.hash}`);

      // Wait for confirmation
      await tx.wait();
      console.log(`   Confirmed\n`);
    } catch (error) {
      console.error(`❌ Failed to send ETH to ${account}:`, error.message);
    }
  }

  console.log("========================================");
  console.log("✅ ETH Minting Complete!");
  console.log("========================================\n");

  // Verify balances
  console.log("Verifying balances:\n");
  for (const account of testAccounts) {
    const balance = await hre.ethers.provider.getBalance(account);
    console.log(`${account}: ${hre.ethers.formatEther(balance)} ETH`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
