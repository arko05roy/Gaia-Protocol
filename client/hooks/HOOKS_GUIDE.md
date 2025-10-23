# Gaia Protocol React Hooks - Quick Start Guide

Complete React hooks for Gaia Protocol smart contracts using Wagmi v2+.

## Setup

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

## Hook Categories

### 1. Task Registry (`useTaskRegistry.ts`)
- `useCreateTask()` - Create environmental task
- `useGetTask(taskId)` - Fetch single task
- `useGetTasks(taskIds)` - Fetch multiple tasks
- `useGetTasksByStatus(status)` - Filter by status
- `useGetProposerTasks(proposer)` - Tasks by proposer
- `useGetOperatorTasks(operator)` - Tasks by operator
- `useSubmitProof()` - Submit work proof
- `useTaskExists(taskId)` - Check if task exists

### 2. Funding Pool (`useFundingPool.ts`)
- `useFundTask()` - Fund a task
- `useWithdrawFunding()` - Withdraw funding
- `useClaimRefund()` - Claim refund for failed task
- `useGetPool(taskId)` - Get pool info
- `useGetFunderShare(taskId, funder)` - Get funder's share
- `useGetFunders(taskId)` - Get all funders
- `useGetFundersWithShares(taskId)` - Get funders + amounts
- `useGetFundingProgress(taskId)` - Get progress bar data
- `useGetSharePercentage(taskId, funder)` - Get share %

### 3. Carbon Credit Minter (`useCarbonCreditMinter.ts`)
- `useRetireCredits()` - Burn carbon credits
- `useGetCreditMetadata(tokenId)` - Get token metadata
- `useGetCirculatingSupply(tokenId)` - Get supply
- `useGetTotalRetired(tokenId)` - Get retired amount
- `useGetUserRetired(account, tokenId)` - User's retired
- `useGetBalanceOfBatch(account, tokenIds)` - Multiple balances
- `useCreditsExist(taskId)` - Check if minted
- `useGetCreditURI(tokenId)` - Get metadata URI

### 4. Carbon Marketplace (`useCarbonMarketplace.ts`)
- `useCreateSellOrder()` - Create sell order
- `useCancelOrder()` - Cancel order
- `useBuyCredits()` - Buy from order
- `useGetOrder(orderId)` - Get order details
- `useGetOrders(orderIds)` - Get multiple orders
- `useGetOrdersByToken(tokenId)` - Orders for token
- `useGetActiveOrdersByToken(tokenId)` - Active orders
- `useGetOrdersBySeller(seller)` - Orders by seller
- `useGetCheapestOrder(tokenId)` - Best price
- `useGetMarketStats(tokenId)` - Volume & trades
- `useCalculateBuyCost(orderId, amount)` - Cost breakdown
- `useGetTotalOrders()` - Total count

### 5. Collateral Manager (`useCollateralManager.ts`)
- `useRegisterOperator()` - Register with stake
- `useAddStake()` - Add more stake
- `useWithdrawStake()` - Withdraw stake
- `useStakeForTask()` - Stake for specific task
- `useIsApprovedOperator(operator)` - Check approval
- `useGetOperatorStake(operator)` - Available stake
- `useGetOperatorTotalStake(operator)` - Total stake
- `useGetTaskStake(taskId)` - Task stake info
- `useGetMinimumStakePercentage()` - Min % required
- `useGetMinimumOperatorStake()` - Min amount

### 6. Verification Manager (`useVerificationManager.ts`)
- `useSubmitValidatorVote()` - Vote on task
- `useIsValidator(validator)` - Check if validator
- `useGetValidatorReputation(validator)` - Reputation score
- `useGetRequiredValidators()` - Validators needed
- `useGetConsensusThreshold()` - Threshold %
- `useGetVerificationPeriod()` - Period duration
- `useGetValidatorReward()` - Reward amount
- `useGetVerificationStatus(taskId)` - Verification state
- `useGetValidatorVote(taskId, validator)` - Get vote
- `useGetTaskValidators(taskId)` - Assigned validators
- `useGetAllValidators()` - All validators

### 7. Prediction Market (`usePredictionMarket.ts`)
- `useBuyShares()` - Buy YES/NO shares
- `useClaimWinnings()` - Claim winnings
- `useGetMarket(taskId)` - Market data
- `useGetPosition(taskId, account)` - User position
- `useGetMarketCreationFee()` - Creation fee
- `useGetMarketOdds(taskId)` - Current odds
- `useCalculateShares(taskId, isYes, amount)` - Shares calc
- `useIsMarketResolved(taskId)` - Resolution status
- `useGetResolutionDeadline(taskId)` - Deadline
- `useGetMarketVolume(taskId)` - Trading volume

## Common Patterns

### Write Operations (Transactions)

```tsx
import { useFundTask } from '@/hooks'
import { parseEther } from 'viem'

function FundForm({ taskId }: { taskId: bigint }) {
  const { fundTask, isPending, isSuccess, hash } = useFundTask()

  return (
    <>
      <button 
        onClick={() => fundTask(taskId, parseEther('100'))}
        disabled={isPending}
      >
        {isPending ? 'Funding...' : 'Fund Task'}
      </button>
      {isSuccess && <p>Success! Hash: {hash}</p>}
    </>
  )
}
```

### Read Operations (Queries)

```tsx
import { useGetTask } from '@/hooks'

function TaskDetail({ taskId }: { taskId: bigint }) {
  const { task, isLoading, error } = useGetTask(taskId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>{task?.description}</div>
}
```

### Conditional Queries

```tsx
import { useGetFunderShare } from '@/hooks'

function ShareDisplay({ taskId, funder }: { taskId: bigint | undefined; funder: string | undefined }) {
  // Hook won't execute if taskId or funder is undefined
  const { share, isLoading } = useGetFunderShare(taskId, funder)

  if (!taskId || !funder) return null
  if (isLoading) return <div>Loading...</div>
  
  return <div>Share: {share?.toString()} cUSD</div>
}
```

## Contract Addresses

- TaskRegistry: `0x5754C71c2474FE8F2B83C43432Faf0AC94cc24A5`
- FundingPool: `0x89a87B531E37731A77B1E40B6B8B5bCb58819059`
- CarbonCreditMinter: `0xC3Fd43907aFBCA63298bA076f9ED5C84DEb7BE21`
- CarbonMarketplace: `0xAFF32cce8D5eCbB1AFD38A87f04A1b8db858eA6D`
- CollateralManager: `0x98eFA762eDa5FB0C3BA02296c583A5a542c66c8b`
- VerificationManager: `0x6C97C69854e745FA6565DDD7f2f200D823ECC7c1`
- PredictionMarket: `0x8c7Ffc95fcD2b9Dfb48272A0cEb6f54e7CE77b14`

## Enums

### TaskStatus
```tsx
enum TaskStatus {
  Proposed = 0,
  Funded = 1,
  InProgress = 2,
  UnderReview = 3,
  Verified = 4,
  Rejected = 5,
}
```

### StakeStatus
```tsx
enum StakeStatus {
  None = 0,
  Locked = 1,
  Released = 2,
  Slashed = 3,
}
```

## Import Examples

```tsx
// Import all from index
import {
  useCreateTask,
  useFundTask,
  useRetireCredits,
  useCreateSellOrder,
  useRegisterOperator,
  useSubmitValidatorVote,
  useBuyShares,
  TaskStatus,
  StakeStatus,
} from '@/hooks'

// Or import specific hook file
import { useCreateTask } from '@/hooks/useTaskRegistry'
import { useFundTask } from '@/hooks/useFundingPool'
```

## Notes

- All hooks use Wagmi v2+ with React Query
- Amounts use BigInt (use `parseEther()` for decimals)
- Undefined parameters disable queries automatically
- Transaction hooks return `hash`, `isPending`, `isConfirming`, `isSuccess`
- Read hooks return `data`, `isLoading`, `error`
- All hooks are fully typed with TypeScript
