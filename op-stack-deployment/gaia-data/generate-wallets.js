const ethers = require('ethers');
const fs = require('fs');

async function generateWallets() {
  console.log('1. Generating Admin account...');
  const adminWallet = ethers.Wallet.createRandom();
  fs.writeFileSync('admin-wallet.json', JSON.stringify({
    address: adminWallet.address,
    private_key: adminWallet.privateKey
  }, null, 2));
  console.log('✅ Admin account generated');

  console.log('2. Generating Batcher account...');
  const batcherWallet = ethers.Wallet.createRandom();
  fs.writeFileSync('batcher-wallet.json', JSON.stringify({
    address: batcherWallet.address,
    private_key: batcherWallet.privateKey
  }, null, 2));
  console.log('✅ Batcher account generated');

  console.log('3. Generating Proposer account...');
  const proposerWallet = ethers.Wallet.createRandom();
  fs.writeFileSync('proposer-wallet.json', JSON.stringify({
    address: proposerWallet.address,
    private_key: proposerWallet.privateKey
  }, null, 2));
  console.log('✅ Proposer account generated');

  console.log('4. Generating Sequencer account...');
  const sequencerWallet = ethers.Wallet.createRandom();
  fs.writeFileSync('sequencer-wallet.json', JSON.stringify({
    address: sequencerWallet.address,
    private_key: sequencerWallet.privateKey
  }, null, 2));
  console.log('✅ Sequencer account generated');

  return {
    admin: adminWallet,
    batcher: batcherWallet,
    proposer: proposerWallet,
    sequencer: sequencerWallet
  };
}

generateWallets().catch(console.error);
