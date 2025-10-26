# 🚀 GaiaL3 - Local Blockchain for Gaia Protocol

GaiaL3 is a local L3 blockchain powered by Foundry Anvil. It provides a complete development environment for testing the Gaia Protocol with all contracts pre-deployed and your account pre-funded.

## Quick Start

### Start GaiaL3 with Live Monitor

```bash
bash /Users/arkoroy/Desktop/GaiaProtocol/gaial3-quick.sh
```

This command will:
1. ✅ Start the GaiaL3 blockchain node instantly
2. ✅ Deploy all 12 Gaia Protocol contracts in background
3. ✅ Mint 10,000 cUSD tokens to your account
4. ✅ Display a live blockchain state monitor

### Start Only the Monitor (Blockchain Already Running)

```bash
bash /Users/arkoroy/Desktop/GaiaProtocol/monitor-gaial3.sh
```

## Network Details

| Property | Value |
|----------|-------|
| **RPC URL** | http://localhost:8546 |
| **Chain ID** | 424242 |
| **Block Time** | 1 second |
| **Gas Limit** | 30,000,000 |
| **Network Name** | GaiaL3 |

## Your Account

| Property | Value |
|----------|-------|
| **Address** | 0xABaF59180e0209bdB8b3048bFbe64e855074C0c4 |
| **Private Key** | 9ef01f9bd02e2ee682be5c50c189720a37773ab58b5b031ebdb8489940cd01ad |
| **ETH Balance** | 100 ETH |
| **cUSD Balance** | 9,999 cUSD |

## Deployed Contracts

All contracts are automatically deployed when you start GaiaL3:

| Contract | Address |
|----------|---------|
| **cUSD Token** | 0x5FbDB2315678afecb367f032d93F642f64180aa3 |
| **TaskRegistry** | 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 |
| **FundingPool** | 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 |
| **CollateralManager** | 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 |
| **VerificationManager** | 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 |
| **CarbonCreditMinter** | 0x0165878A594ca255338adfa4d48449f69242Eb8F |
| **CarbonMarketplace** | 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 |
| **PredictionMarket** | 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 |
| **GovernanceDAO** | 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318 |
| **DataRegistry** | 0x610178dA211FEF7D417bC0e6FeD39F05609AD788 |
| **ModelRegistry** | 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e |
| **Treasury** | 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 |

## Live Monitor Dashboard

The monitor displays real-time blockchain state:

```
╔════════════════════════════════════════════════════════════════════╗
║                     🚀 GAIA L3 BLOCKCHAIN STATE                    ║
╚════════════════════════════════════════════════════════════════════╝

📊 NETWORK STATUS
  ● RPC URL:        http://localhost:8545
  ● Chain ID:       424242 (GaiaL3)
  ● Block Time:     1 second

⛓️  BLOCKCHAIN METRICS
  ● Current Block:  #12345
  ● Gas Price:      1.0 Gwei
  ● Latest Block:   2025-10-25 12:05:15

💰 ACCOUNT BALANCES
  ● Deployer (0xf39F...)
      ETH:  9899.98 ETH

  ● Your Account (0xABaF...)
      ETH:  100.00 ETH
      cUSD: 9999.00 cUSD

📦 DEPLOYED CONTRACTS
  ● cUSD Token:           0x5FbDB2315678afecb367f032d93F642f64180aa3
  ● TaskRegistry:         0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
  ... (all contracts listed)

⚡ QUICK COMMANDS
  cast block-number --rpc-url http://localhost:8545
  cast balance 0xABaF59180e0209bdB8b3048bFbe64e855074C0c4 --rpc-url http://localhost:8545
  cast send <to> --value 1ether --rpc-url http://localhost:8545 --private-key <pk>
```

The monitor refreshes every 2 seconds and shows:
- Current block number
- Gas price
- Latest block timestamp
- Your ETH and cUSD balances
- All deployed contract addresses
- Quick command examples

## Common Commands

### Check Block Number
```bash
cast block-number --rpc-url http://localhost:8546
```

### Check Your Balance
```bash
cast balance 0xABaF59180e0209bdB8b3048bFbe64e855074C0c4 --rpc-url http://localhost:8546
```

### Check cUSD Balance
```bash
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "balanceOf(address)" 0xABaF59180e0209bdB8b3048bFbe64e855074C0c4 --rpc-url http://localhost:8546
```

### Send a Transaction
```bash
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 "transfer(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 1000000000000000000 --rpc-url http://localhost:8546 --private-key 9ef01f9bd02e2ee682be5c50c189720a37773ab58b5b031ebdb8489940cd01ad
```

### Call a Contract Function
```bash
cast call 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 "getTotalTasks()" --rpc-url http://localhost:8546
```

## Frontend Integration

GaiaL3 is already configured in your frontend:

- **RPC URL**: http://localhost:8546
- **Chain ID**: 424242
- **All contract addresses**: Updated in `/client/hooks/`
- **Config file**: `/client/app/config.ts` (uses gaiaL3 chain)

Just connect your wallet to GaiaL3 and start testing!

## Stopping GaiaL3

### Stop the Monitor
Press `Ctrl+C` in the monitor terminal

### Stop the Blockchain
```bash
pkill -f "anvil"
```

### Stop Everything
```bash
pkill -f "anvil"
pkill -f "monitor-gaial3.sh"
```

## Troubleshooting

### Monitor shows "N/A" for values
- Wait a few seconds for the blockchain to fully initialize
- Check that GaiaL3 is running: `cast block-number --rpc-url http://localhost:8546`

### Contracts not deployed
- Check the deployment logs: `tail -f /tmp/gaial3.log`
- Restart GaiaL3: `bash /Users/arkoroy/Desktop/GaiaProtocol/gaial3-quick.sh`

### Port 8546 already in use
- Kill existing process: `pkill -f "anvil"`
- Or use a different port by editing the scripts

## Architecture

```
GaiaL3 (Foundry Anvil)
├── Execution Layer (op-geth compatible)
├── 12 Deployed Contracts
├── 20 Pre-funded Test Accounts
├── Your Account (100 ETH + 9,999 cUSD)
└── Live Monitor Dashboard
```

## Files

- **`gaial3.sh`** - Master control script (starts blockchain + monitor)
- **`start-gaial3.sh`** - Start only the blockchain
- **`monitor-gaial3.sh`** - Start only the monitor
- **`GAIAL3_README.md`** - This file

## Next Steps

1. ✅ Start GaiaL3: `bash gaial3.sh`
2. ✅ Connect your wallet to http://localhost:8545
3. ✅ Test Gaia Protocol features on the frontend
4. ✅ Monitor blockchain state in real-time

Happy building! 🚀
