"use client"

import { useState, useMemo, useEffect } from "react"
import { useAccount, useWatchContractEvent } from "wagmi"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { parseEther, formatEther } from "viem"
import {
  useGetTasksByStatus,
  useGetTasks,
  TaskStatus,
  type Task
} from "@/hooks/useTaskRegistry"
import { TASK_REGISTRY_ADDRESS } from "@/hooks/useTaskRegistry"
import { TaskRegistryABI as TaskRegistryABIImport } from "@/lib/abis"
import {
  useGetMarket,
  useGetMarketOdds,
  useGetPosition,
  useBuyShares,
  useClaimWinnings,
  useIsMarketResolved,
  useGetMarketVolume,
  useMarketExists,
  useCreateMarket,
  useGetMarketCreationFee,
  PREDICTION_MARKET_ADDRESS,
  type Market
} from "@/hooks/usePredictionMarket"
import { useGetAllowance, useApproveToken, useCUSDTokenAddress } from "@/hooks/useERC20Approval"

// Ensure ABI is an array (handle default export wrapper from JSON import)
const TaskRegistryABI = (TaskRegistryABIImport as any)?.default || TaskRegistryABIImport || []

export default function PredictionMarket() {
  const { address: userAddress } = useAccount()
  const [selectedMarketId, setSelectedMarketId] = useState<bigint | undefined>(undefined)
  const [betAmount, setBetAmount] = useState("")
  const [betSide, setBetSide] = useState<"yes" | "no" | null>(null)
  const [showBetModal, setShowBetModal] = useState(false)

  // listen to task-created and status-changed to hint user for market creation
  useWatchContractEvent({
    address: TASK_REGISTRY_ADDRESS,
    abi: TaskRegistryABI as any,
    eventName: 'TaskCreated',
    onLogs: (logs) => {
      console.debug('TaskCreated event', logs)
    }
  })
  useWatchContractEvent({
    address: TASK_REGISTRY_ADDRESS,
    abi: TaskRegistryABI as any,
    eventName: 'TaskStatusChanged',
    onLogs: (logs) => {
      console.debug('TaskStatusChanged event', logs)
    }
  })

  // Fetch all funded and in-progress tasks (these have prediction markets)
  const { taskIds: fundedTaskIds } = useGetTasksByStatus(TaskStatus.Funded)
  const { taskIds: inProgressTaskIds } = useGetTasksByStatus(TaskStatus.InProgress)
  const { taskIds: underReviewTaskIds } = useGetTasksByStatus(TaskStatus.UnderReview)
  
  const allTaskIds = useMemo(() => {
    return [...(fundedTaskIds || []), ...(inProgressTaskIds || []), ...(underReviewTaskIds || [])]
  }, [fundedTaskIds, inProgressTaskIds, underReviewTaskIds])

  // Fetch tasks
  const { tasks = [] } = useGetTasks(allTaskIds.length > 0 ? allTaskIds : undefined)
  
  // Buy shares hook
  const { buyShares, isPending: isBuying, isSuccess: buySuccess } = useBuyShares()
  const { claimWinnings, isPending: isClaiming, isSuccess: claimSuccess } = useClaimWinnings()
  const { fee } = useGetMarketCreationFee()
  const cUSD = useCUSDTokenAddress()
  const { approveToken, isPending: isApproving, isSuccess: isApproveSuccess } = useApproveToken()

  const handlePlaceBet = () => {
    if (!selectedMarketId || !betAmount || !betSide) return
    
    try {
      const amount = parseEther(betAmount)
      buyShares(selectedMarketId, betSide === "yes", amount)
    } catch (error) {
      console.error("Error placing bet:", error)
    }
  }

  const handleClaimWinnings = () => {
    if (!selectedMarketId) return
    claimWinnings(selectedMarketId)
  }

  // Reset modal after successful transaction
  if (buySuccess || claimSuccess) {
    setShowBetModal(false)
    setBetAmount("")
    setBetSide(null)
    setSelectedMarketId(undefined)
  }

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Funded:
      case TaskStatus.InProgress:
        return "bg-green-100 text-green-800"
      case TaskStatus.UnderReview:
        return "bg-blue-100 text-blue-800"
      case TaskStatus.Verified:
        return "bg-emerald-100 text-emerald-800"
      case TaskStatus.Rejected:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTaskStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Funded:
      case TaskStatus.InProgress:
        return <Clock className="h-4 w-4" />
      case TaskStatus.UnderReview:
        return <AlertCircle className="h-4 w-4" />
      case TaskStatus.Verified:
        return <CheckCircle className="h-4 w-4" />
      case TaskStatus.Rejected:
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTaskStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Proposed:
        return "Proposed"
      case TaskStatus.Funded:
        return "Funded"
      case TaskStatus.InProgress:
        return "In Progress"
      case TaskStatus.UnderReview:
        return "Under Review"
      case TaskStatus.Verified:
        return "Verified"
      case TaskStatus.Rejected:
        return "Rejected"
      default:
        return "Unknown"
    }
  }

  const MarketCard = ({ taskId, task }: { taskId: bigint; task: Task }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { market } = useGetMarket(taskId)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { yesOdds, noOdds } = useGetMarketOdds(taskId)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { volume } = useGetMarketVolume(taskId)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isResolved } = useIsMarketResolved(taskId)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { exists } = useMarketExists(taskId)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { allowance, refetch: refetchAllowance } = useGetAllowance(cUSD, userAddress as `0x${string}` | undefined, PREDICTION_MARKET_ADDRESS)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { createMarket, isPending: isCreating, isSuccess: created, error: createError } = useCreateMarket()

    // After successful approval, refetch allowance automatically
    useEffect(() => {
      if (isApproveSuccess) {
        refetchAllowance()
      }
    }, [isApproveSuccess])

    // If market doesn't exist yet, show CTA to create it
    if (!exists) {
      const required = fee || 0n
      const approvedEnough = allowance !== undefined && required !== undefined ? (allowance as bigint) >= (required as bigint) : false
      const now = BigInt(Math.floor(Date.now() / 1000))
      // Ensure resolutionDeadline is strictly in the future to avoid preflight simulation revert
      const base = (task.deadline as bigint) > now ? (task.deadline as bigint) : now
      const deadline = base + 7n * 24n * 60n * 60n

      return (
        <Card className="gaia-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground">{task.description.substring(0, 50)}...</h3>
                <Badge className={getTaskStatusColor(task.status)}>
                  {getTaskStatusIcon(task.status)}
                  <span className="ml-1">{getTaskStatusLabel(task.status)}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">No market exists yet for this task.</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!approvedEnough ? (
              <Button
                className="flex-1"
                disabled={!userAddress || fee === undefined || isApproving}
                onClick={async () => {
                  if (fee === undefined) return
                  approveToken(cUSD as `0x${string}`, PREDICTION_MARKET_ADDRESS, fee)
                }}
              >
                {isApproving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Approve cUSD ({fee ? `${formatEther(fee)} cUSD` : '...'} )
              </Button>
            ) : (
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!userAddress || isCreating}
                onClick={() => createMarket(taskId, deadline)}
              >
                {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
                Create Market
              </Button>
            )}
            {createError ? (
              <div className="text-xs text-red-600 mt-2">
                {(createError as any)?.shortMessage || (createError as any)?.message || 'Transaction simulation failed. Check cUSD balance and allowance.'}
              </div>
            ) : null}
          </div>
        </Card>
      )
    }

    if (!market) return null

    const yesPercent = yesOdds ? Number(yesOdds) / 100 : 50
    const noPercent = noOdds ? Number(noOdds) / 100 : 50
    const volumeFormatted = volume ? formatEther(volume) : "0"

    const deadlineDate = new Date(Number(market.resolutionDeadline) * 1000)
    const deadlineStr = deadlineDate.toLocaleDateString()

    const isActive = task.status === TaskStatus.Funded || task.status === TaskStatus.InProgress

    return (
      <Card className="gaia-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{task.description.substring(0, 50)}...</h3>
              <Badge className={getTaskStatusColor(task.status)}>
                {getTaskStatusIcon(task.status)}
                <span className="ml-1">{getTaskStatusLabel(task.status)}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{task.description.substring(0, 100)}...</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{yesPercent.toFixed(1)}%</div>
                <div className="text-sm text-green-700">YES</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{noPercent.toFixed(1)}%</div>
                <div className="text-sm text-red-700">NO</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{volumeFormatted} cUSD</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{deadlineStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isActive && !isResolved && (
            <>
              <Button
                variant="outline"
                className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => {
                  setSelectedMarketId(taskId)
                  setBetSide("yes")
                  setShowBetModal(true)
                }}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Buy YES
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => {
                  setSelectedMarketId(taskId)
                  setBetSide("no")
                  setShowBetModal(true)
                }}
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Buy NO
              </Button>
            </>
          )}
          
          {isResolved && (
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                setSelectedMarketId(taskId)
                handleClaimWinnings()
              }}
              disabled={isClaiming}
            >
              {isClaiming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
              Claim Winnings
            </Button>
          )}

          {!isActive && !isResolved && (
            <div className="w-full text-center py-2 text-muted-foreground text-sm">
              Market closed - Results pending
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Prediction Market</h1>
              <p className="text-muted-foreground">Trade on climate and environmental outcomes</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Target className="h-4 w-4" />
              Claim Winnings
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Markets</p>
                  <p className="text-3xl font-bold text-primary">{allTaskIds.length}</p>
                </div>
                <BarChart3 className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Volume</p>
                  <p className="text-3xl font-bold text-primary">
                    {allTaskIds.length > 0 ? "Loading..." : "0 cUSD"}
                  </p>
                </div>
                <DollarSign className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Your Positions</p>
                  <p className="text-3xl font-bold text-primary">{userAddress ? "View" : "Connect"}</p>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Your Portfolio</p>
                  <p className="text-3xl font-bold text-primary">
                    {userAddress ? "Loading..." : "Connect"}
                  </p>
                </div>
                <TrendingUp className="text-primary" size={32} />
              </div>
            </Card>
          </div>

          {/* Markets List */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Active Prediction Markets</h2>
            {allTaskIds.length === 0 ? (
              <Card className="gaia-card p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active prediction markets yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <MarketCard key={task.id} taskId={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bet Modal */}
      <Dialog open={showBetModal} onOpenChange={setShowBetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Place {betSide?.toUpperCase()} Bet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Market ID: {selectedMarketId?.toString()}
              </p>
              <p className="text-sm text-foreground">
                Betting on: {betSide === "yes" ? "YES" : "NO"}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount (cUSD)
              </label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {betAmount ? `You will spend ${betAmount} cUSD` : "Enter an amount"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBetModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0 || isBuying}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isBuying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing...
                  </>
                ) : (
                  "Place Bet"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
