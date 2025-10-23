# Gaia Protocol Hooks - Usage Examples

Real-world examples showing how to use the hooks in your components.

## 1. Create Task Component

```tsx
import { useCreateTask } from '@/hooks'
import { parseEther } from 'viem'
import { useState } from 'react'

export function CreateTaskComponent() {
  const { createTask, isPending, isSuccess, hash } = useCreateTask()
  const [formData, setFormData] = useState({
    description: '',
    cost: '',
    co2: '',
    location: '',
    requirements: '',
    ipfsHash: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    createTask(
      formData.description,
      parseEther(formData.cost),
      BigInt(formData.co2),
      formData.location,
      BigInt(Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60), // 90 days
      formData.requirements,
      formData.ipfsHash
    )
  }

  return (
    <div className="create-task-form">
      <h2>Create Environmental Task</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Cost in cUSD"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Expected CO2 offset (tons)"
          value={formData.co2}
          onChange={(e) => setFormData({ ...formData, co2: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
        <textarea
          placeholder="Proof requirements"
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="IPFS hash"
          value={formData.ipfsHash}
          onChange={(e) => setFormData({ ...formData, ipfsHash: e.target.value })}
          required
        />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Task'}
        </button>
      </form>
      {isSuccess && (
        <div className="success">
          <p>Task created successfully!</p>
          <p>Transaction: {hash}</p>
        </div>
      )}
    </div>
  )
}
```

## 2. Task Detail Component

```tsx
import { useGetTask, useGetFundingProgress, TaskStatus } from '@/hooks'
import { formatEther } from 'viem'

export function TaskDetailComponent({ taskId }: { taskId: bigint }) {
  const { task, isLoading: taskLoading } = useGetTask(taskId)
  const { funded, target, percentage } = useGetFundingProgress(taskId)

  if (taskLoading) return <div>Loading task...</div>
  if (!task) return <div>Task not found</div>

  const statusNames = ['Proposed', 'Funded', 'In Progress', 'Under Review', 'Verified', 'Rejected']
  const fundingPercent = Number(percentage) / 100

  return (
    <div className="task-detail">
      <h1>{task.description}</h1>
      
      <div className="task-info">
        <p><strong>Location:</strong> {task.location}</p>
        <p><strong>Status:</strong> {statusNames[task.status]}</p>
        <p><strong>Expected CO2:</strong> {formatEther(task.expectedCO2)} tons</p>
        <p><strong>Created:</strong> {new Date(Number(task.createdAt) * 1000).toLocaleDateString()}</p>
      </div>

      <div className="funding-section">
        <h3>Funding Progress</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${fundingPercent}%` }} />
        </div>
        <p>
          {formatEther(funded)} / {formatEther(target)} cUSD ({fundingPercent.toFixed(1)}%)
        </p>
      </div>

      <p className="requirements">
        <strong>Proof Requirements:</strong> {task.proofRequirements}
      </p>
    </div>
  )
}
```

## 3. Fund Task Component

```tsx
import { useFundTask, useGetFundingProgress } from '@/hooks'
import { parseEther, formatEther } from 'viem'
import { useState } from 'react'

export function FundTaskComponent({ taskId }: { taskId: bigint }) {
  const { fundTask, isPending, isSuccess } = useFundTask()
  const { target, funded } = useGetFundingProgress(taskId)
  const [amount, setAmount] = useState('')

  const remaining = target ? target - funded : 0n

  const handleFund = () => {
    if (amount) {
      fundTask(taskId, parseEther(amount))
      setAmount('')
    }
  }

  return (
    <div className="fund-task">
      <h3>Fund This Task</h3>
      <p>Remaining: {formatEther(remaining)} cUSD</p>
      
      <div className="fund-input">
        <input
          type="number"
          placeholder="Amount in cUSD"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          max={formatEther(remaining)}
          step="0.01"
        />
        <button onClick={handleFund} disabled={isPending || !amount}>
          {isPending ? 'Funding...' : 'Fund'}
        </button>
      </div>

      {isSuccess && <p className="success">Funded successfully!</p>}
    </div>
  )
}
```

## 4. Marketplace Orders Component

```tsx
import { useGetAllActiveOrders, useGetOrder, useBuyCredits } from '@/hooks'
import { formatEther } from 'viem'
import { useState } from 'react'

export function MarketplaceComponent() {
  const { orderIds, isLoading } = useGetAllActiveOrders()
  const [selectedOrderId, setSelectedOrderId] = useState<bigint | null>(null)
  const [buyAmount, setBuyAmount] = useState('')

  const { order } = useGetOrder(selectedOrderId || undefined)
  const { buyCredits, isPending } = useBuyCredits()

  if (isLoading) return <div>Loading marketplace...</div>

  const handleBuy = () => {
    if (selectedOrderId && buyAmount) {
      buyCredits(selectedOrderId, BigInt(buyAmount))
      setBuyAmount('')
    }
  }

  return (
    <div className="marketplace">
      <h2>Carbon Credit Marketplace</h2>
      
      <div className="orders-list">
        {orderIds.map((orderId) => (
          <OrderCard
            key={orderId.toString()}
            orderId={orderId}
            isSelected={selectedOrderId === orderId}
            onSelect={() => setSelectedOrderId(orderId)}
          />
        ))}
      </div>

      {order && (
        <div className="order-detail">
          <h3>Order Details</h3>
          <p>Price: {formatEther(order.pricePerCredit)} cUSD per credit</p>
          <p>Available: {order.amount.toString()} credits</p>
          
          <div className="buy-section">
            <input
              type="number"
              placeholder="Amount to buy"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              max={order.amount.toString()}
            />
            <button onClick={handleBuy} disabled={isPending || !buyAmount}>
              {isPending ? 'Buying...' : 'Buy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({
  orderId,
  isSelected,
  onSelect,
}: {
  orderId: bigint
  isSelected: boolean
  onSelect: () => void
}) {
  const { order, isLoading } = useGetOrder(orderId)

  if (isLoading) return <div>Loading...</div>
  if (!order) return null

  return (
    <div
      className={`order-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <p>Price: {formatEther(order.pricePerCredit)} cUSD</p>
      <p>Available: {order.amount.toString()} credits</p>
      <p>Seller: {order.seller.slice(0, 6)}...{order.seller.slice(-4)}</p>
    </div>
  )
}
```

## 5. Operator Registration Component

```tsx
import { useRegisterOperator, useGetOperatorStake } from '@/hooks'
import { parseEther, formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { useState } from 'react'

export function OperatorRegistrationComponent() {
  const { address } = useAccount()
  const { registerOperator, isPending, isSuccess } = useRegisterOperator()
  const { stake } = useGetOperatorStake(address)
  const [stakeAmount, setStakeAmount] = useState('')

  const handleRegister = () => {
    if (stakeAmount) {
      registerOperator(parseEther(stakeAmount))
      setStakeAmount('')
    }
  }

  return (
    <div className="operator-registration">
      <h2>Register as Operator</h2>
      
      {stake && stake > 0n ? (
        <div className="registered">
          <p>✓ You are registered as an operator</p>
          <p>Current Stake: {formatEther(stake)} CELO</p>
        </div>
      ) : (
        <div className="registration-form">
          <p>Stake CELO to become an operator</p>
          <input
            type="number"
            placeholder="Stake amount (CELO)"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            step="0.01"
            min="1"
          />
          <button onClick={handleRegister} disabled={isPending || !stakeAmount}>
            {isPending ? 'Registering...' : 'Register'}
          </button>
        </div>
      )}

      {isSuccess && <p className="success">Registration successful!</p>}
    </div>
  )
}
```

## 6. Validator Voting Component

```tsx
import { useSubmitValidatorVote, useGetTaskValidators } from '@/hooks'
import { useState } from 'react'

export function ValidatorVotingComponent({ taskId }: { taskId: bigint }) {
  const { submitValidatorVote, isPending, isSuccess } = useSubmitValidatorVote()
  const { validators } = useGetTaskValidators(taskId)
  const [formData, setFormData] = useState({
    approve: true,
    justification: '',
    confidence: 50,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitValidatorVote(
      taskId,
      formData.approve,
      formData.justification,
      BigInt(formData.confidence)
    )
  }

  return (
    <div className="validator-voting">
      <h2>Verify Task #{taskId.toString()}</h2>
      
      <p>Assigned Validators: {validators.length}</p>

      <form onSubmit={handleSubmit}>
        <div className="vote-choice">
          <label>
            <input
              type="radio"
              checked={formData.approve}
              onChange={() => setFormData({ ...formData, approve: true })}
            />
            Approve
          </label>
          <label>
            <input
              type="radio"
              checked={!formData.approve}
              onChange={() => setFormData({ ...formData, approve: false })}
            />
            Reject
          </label>
        </div>

        <textarea
          placeholder="Justification for your vote"
          value={formData.justification}
          onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
          required
        />

        <div className="confidence">
          <label>
            Confidence: {formData.confidence}%
            <input
              type="range"
              min="0"
              max="100"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: Number(e.target.value) })}
            />
          </label>
        </div>

        <button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit Vote'}
        </button>
      </form>

      {isSuccess && <p className="success">Vote submitted!</p>}
    </div>
  )
}
```

## 7. Prediction Market Component

```tsx
import { useBuyShares, useGetMarket, useGetPosition } from '@/hooks'
import { parseEther, formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { useState } from 'react'

export function PredictionMarketComponent({ taskId }: { taskId: bigint }) {
  const { address } = useAccount()
  const { market } = useGetMarket(taskId)
  const { position } = useGetPosition(taskId, address)
  const { buyShares, isPending } = useBuyShares()
  const [amount, setAmount] = useState('')
  const [isYes, setIsYes] = useState(true)

  const totalPool = market ? market.yesPool + market.noPool : 0n
  const yesOdds = totalPool > 0n ? Number((market!.yesPool * 10000n) / totalPool) / 100 : 50
  const noOdds = totalPool > 0n ? Number((market!.noPool * 10000n) / totalPool) / 100 : 50

  const handleBuy = () => {
    if (amount) {
      buyShares(taskId, isYes, parseEther(amount))
      setAmount('')
    }
  }

  return (
    <div className="prediction-market">
      <h2>Prediction Market - Task #{taskId.toString()}</h2>

      <div className="odds">
        <div className="odds-card yes">
          <h3>YES</h3>
          <p className="odds-value">{yesOdds.toFixed(1)}%</p>
          <p>Your Shares: {position?.yesShares.toString() || '0'}</p>
        </div>
        <div className="odds-card no">
          <h3>NO</h3>
          <p className="odds-value">{noOdds.toFixed(1)}%</p>
          <p>Your Shares: {position?.noShares.toString() || '0'}</p>
        </div>
      </div>

      <div className="buy-shares">
        <div className="choice">
          <label>
            <input
              type="radio"
              checked={isYes}
              onChange={() => setIsYes(true)}
            />
            Buy YES
          </label>
          <label>
            <input
              type="radio"
              checked={!isYes}
              onChange={() => setIsYes(false)}
            />
            Buy NO
          </label>
        </div>

        <input
          type="number"
          placeholder="Amount (cUSD)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
        />

        <button onClick={handleBuy} disabled={isPending || !amount}>
          {isPending ? 'Buying...' : 'Buy Shares'}
        </button>
      </div>

      <p className="volume">Total Volume: {formatEther(market?.totalVolume || 0n)} cUSD</p>
    </div>
  )
}
```

## Integration Tips

1. **Always check for undefined** - Hooks disable queries when parameters are undefined
2. **Use formatEther/parseEther** - For converting between BigInt and decimal
3. **Handle loading states** - Show loading indicators while data fetches
4. **Handle errors** - Check error objects and display user-friendly messages
5. **Combine hooks** - Use multiple hooks together for complex UIs
6. **Memoize callbacks** - Use useCallback for event handlers in production

These examples show real-world usage patterns you can adapt for your components.
