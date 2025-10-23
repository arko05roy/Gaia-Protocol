# Gaia Protocol React Hooks

Production-ready React hooks for interacting with Gaia Protocol smart contracts on Celo blockchain using Wagmi v2+.

## 📦 What's Included

7 hook files covering all smart contracts:

1. **useTaskRegistry.ts** - Task lifecycle management (8 hooks)
2. **useFundingPool.ts** - Funding and funder management (9 hooks)
3. **useCarbonCreditMinter.ts** - Carbon credit tokens (8 hooks)
4. **useCarbonMarketplace.ts** - Trading marketplace (12 hooks)
5. **useCollateralManager.ts** - Operator staking (10 hooks)
6. **useVerificationManager.ts** - Task verification (11 hooks)
7. **usePredictionMarket.ts** - Prediction markets (10 hooks)

**Total: 68 production-ready hooks**

## 🚀 Quick Start

### Installation

Ensure you have Wagmi v2+ installed:

```bash
npm install wagmi viem @wagmi/core @tanstack/react-query
```

### Setup

```tsx
import { WagmiProvider } from 'wagmi'
import { createConfig, http } from 'wagmi'
import { celo } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig({
  chains: [celo],
  transports: { [celo.id]: http() },
})

const queryClient = new QueryClient()

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* Your app */}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### Usage Example

```tsx
import { useCreateTask, useGetTask, useFundTask } from '@/hooks'
import { parseEther } from 'viem'

function TaskComponent() {
  // Create task
  const { createTask, isPending: isCreating } = useCreateTask()
  
  // Get task details
  const { task, isLoading } = useGetTask(1n)
  
  // Fund task
  const { fundTask, isPending: isFunding } = useFundTask()

  return (
    <div>
      <button onClick={() => createTask(
        'Plant trees',
        parseEther('1000'),
        100n,
        'Amazon',
        BigInt(Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60),
        'GPS photos required',
        'QmXYZ...'
      )}>
        Create Task
      </button>
      
      {task && <p>{task.description}</p>}
      
      <button onClick={() => fundTask(1n, parseEther('100'))}>
        Fund Task
      </button>
    </div>
  )
}
```

## 📚 Documentation

- **HOOKS_GUIDE.md** - Quick reference with all hooks listed
- **index.ts** - Centralized exports for all hooks

## 🏗️ Hook Structure

Each hook follows a consistent pattern:

### Write Hooks (Transactions)
```tsx
const { 
  functionName,      // Function to call
  hash,              // Transaction hash
  isPending,         // Transaction pending
  isConfirming,      // Transaction confirming
  isSuccess          // Transaction succeeded
} = useHookName()
```

### Read Hooks (Queries)
```tsx
const { 
  data,              // Returned data
  isLoading,         // Data loading
  error              // Error object
} = useHookName(params)
```

## 🔗 Contract Addresses (Celo)

| Contract | Address |
|----------|---------|
| TaskRegistry | 0x5754C71c2474FE8F2B83C43432Faf0AC94cc24A5 |
| FundingPool | 0x89a87B531E37731A77B1E40B6B8B5bCb58819059 |
| CarbonCreditMinter | 0xC3Fd43907aFBCA63298bA076f9ED5C84DEb7BE21 |
| CarbonMarketplace | 0xAFF32cce8D5eCbB1AFD38A87f04A1b8db858eA6D |
| CollateralManager | 0x98eFA762eDa5FB0C3BA02296c583A5a542c66c8b |
| VerificationManager | 0x6C97C69854e745FA6565DDD7f2f200D823ECC7c1 |
| PredictionMarket | 0x8c7Ffc95fcD2b9Dfb48272A0cEb6f54e7CE77b14 |

## 📋 Hook Categories

### Task Management
- Create tasks
- Query task details and status
- Submit work proofs
- Filter by status/proposer/operator

### Funding
- Fund tasks
- Withdraw funding
- Claim refunds
- Track funder shares
- Monitor funding progress

### Carbon Credits
- Retire (burn) credits
- Query credit metadata
- Check circulating supply
- Track retired amounts
- Get token URIs

### Marketplace
- Create sell orders
- Cancel orders
- Buy credits
- Query orders and prices
- Calculate costs
- Get market statistics

### Collateral
- Register as operator
- Manage stake
- Stake for tasks
- Query stake amounts
- Check operator status

### Verification
- Submit validator votes
- Query verification status
- Get validator info
- Check reputation scores
- Get consensus parameters

### Prediction Markets
- Buy prediction shares
- Claim winnings
- Query market data
- Get odds and positions
- Calculate shares

## 🎯 Key Features

✅ **Full TypeScript Support** - All hooks fully typed
✅ **Wagmi v2+ Compatible** - Latest wagmi patterns
✅ **React Query Integration** - Built-in caching and refetching
✅ **Error Handling** - Comprehensive error objects
✅ **Conditional Queries** - Automatic query disabling
✅ **Transaction States** - Full lifecycle tracking
✅ **BigInt Support** - Native BigInt handling
✅ **Zero Dependencies** - Only requires wagmi/viem

## 🔄 Common Patterns

### Conditional Queries
```tsx
const { data } = useGetTask(taskId) // Disabled if taskId is undefined
```

### Transaction Handling
```tsx
const { fundTask, isPending, isSuccess, hash } = useFundTask()

const handleFund = () => {
  fundTask(taskId, amount)
}

if (isPending) return <div>Pending...</div>
if (isSuccess) return <div>Success! {hash}</div>
```

### Batch Queries
```tsx
const { tasks } = useGetTasks([1n, 2n, 3n])
const { orders } = useGetOrders([1n, 2n, 3n])
```

## 🛠️ Development

All hooks are located in `/client/hooks/`:

```
client/hooks/
├── index.ts                      # Central exports
├── useTaskRegistry.ts            # Task management
├── useFundingPool.ts             # Funding
├── useCarbonCreditMinter.ts      # Carbon credits
├── useCarbonMarketplace.ts       # Marketplace
├── useCollateralManager.ts       # Collateral
├── useVerificationManager.ts     # Verification
├── usePredictionMarket.ts        # Prediction markets
├── README.md                     # This file
└── HOOKS_GUIDE.md               # Quick reference
```

## 📝 Notes

- All amounts use BigInt (use `parseEther()` for decimal values)
- Parameters set to `undefined` automatically disable queries
- Hooks use Wagmi's built-in caching via React Query
- All contract ABIs are imported from `/lib/abis/`
- Hooks follow Wagmi v2+ patterns and best practices

## 🤝 Integration

Import hooks directly in your components:

```tsx
import { 
  useCreateTask, 
  useFundTask, 
  useGetTask 
} from '@/hooks'
```

Or import from specific files:

```tsx
import { useCreateTask } from '@/hooks/useTaskRegistry'
import { useFundTask } from '@/hooks/useFundingPool'
```

## ✨ Ready to Use

All hooks are production-ready and can be directly attached to your frontend components. No additional setup required beyond Wagmi configuration.
