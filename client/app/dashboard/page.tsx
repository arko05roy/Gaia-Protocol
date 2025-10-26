"use client"

import { useState, useMemo } from "react"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import DashboardHeader from "@/components/dashboard/header"
import StatsCards from "@/components/dashboard/stats-cards"
import PoolComposition from "@/components/dashboard/pool-composition"
import FeatureCards from "@/components/dashboard/feature-cards"
import MyAssets from "@/components/dashboard/my-assets"
import CreateTaskModal from "@/components/dashboard/create-task-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  useGetTotalTasks,
  useGetTasksByStatus,
  useGetProposerTasks,
  useGetOperatorTasks,
  useGetTasks,
  useGetFundingProgress,
  useGetBalanceOfBatch,
  useGetUserRetired,
  TaskStatus,
} from "@/hooks"
import { TrendingUp, Zap, Target, Award, Loader2 } from "lucide-react"

export default function Dashboard() {
  const { address } = useAccount()
  const [showCreateTask, setShowCreateTask] = useState(false)

  // Fetch protocol-wide stats
  const { totalTasks } = useGetTotalTasks()
  const { taskIds: proposedTasks } = useGetTasksByStatus(TaskStatus.Proposed)
  const { taskIds: fundedTasks } = useGetTasksByStatus(TaskStatus.Funded)
  const { taskIds: inProgressTasks } = useGetTasksByStatus(TaskStatus.InProgress)
  const { taskIds: verifiedTasks } = useGetTasksByStatus(TaskStatus.Verified)

  // Fetch user-specific data
  const { taskIds: userProposedTasks } = useGetProposerTasks(address)
  const { taskIds: userOperatorTasks } = useGetOperatorTasks(address)

  // Get user's carbon credits balance
  const creditTokenIds = [1n, 2n, 3n, 4n, 5n]
  const { balances: creditBalances } = useGetBalanceOfBatch(address, creditTokenIds)
  
  // Get user's retired credits (use first token ID as example)
  const { userRetired: userRetiredToken1 } = useGetUserRetired(address, 1n)

  // Calculate user's total credits
  const totalCreditsOwned = useMemo(() => {
    if (!creditBalances) return 0n
    return creditBalances.reduce((sum: bigint, balance: bigint) => sum + (balance || 0n), 0n)
  }, [creditBalances])

  // Get funding progress for user's tasks
  const { funded: userFunded, target: userTarget } = useGetFundingProgress(
    userProposedTasks && userProposedTasks.length > 0 ? userProposedTasks[0] : undefined
  )

  const fundingPercentage = userTarget && userTarget > 0n 
    ? Number((userFunded * 100n) / userTarget)
    : 0

  const portfolioStats = [
    {
      label: "Tasks Created",
      value: userProposedTasks?.length || 0,
      icon: Target,
      color: "text-blue-500",
    },
    {
      label: "Tasks Operating",
      value: userOperatorTasks?.length || 0,
      icon: Zap,
      color: "text-yellow-500",
    },
    {
      label: "Carbon Credits Owned",
      value: totalCreditsOwned ? Number(formatUnits(totalCreditsOwned, 0)) : 0,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Carbon Retired",
      value: userRetiredToken1 ? Number(formatUnits(userRetiredToken1, 0)) : 0,
      icon: Award,
      color: "text-purple-500",
    },
  ]

  const protocolStats = [
    {
      label: "Total Tasks",
      value: totalTasks ? Number(totalTasks) : 0,
      subtext: "All-time",
    },
    {
      label: "Active Tasks",
      value: (inProgressTasks?.length || 0) + (fundedTasks?.length || 0),
      subtext: "In progress + Funded",
    },
    {
      label: "Verified Tasks",
      value: verifiedTasks?.length || 0,
      subtext: "Completed",
    },
    {
      label: "Proposed Tasks",
      value: proposedTasks?.length || 0,
      subtext: "Awaiting funding",
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              <p className="text-muted-foreground mt-1">Welcome back! Here's your environmental impact summary.</p>
            </div>
            <Button
              onClick={() => setShowCreateTask(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create Task
            </Button>
          </div>

          {/* Protocol-Wide Stats */}
          <StatsCards />

          {/* User Portfolio Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {portfolioStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="gaia-card">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground/60 font-medium">{stat.label}</p>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Pool Composition */}
              <PoolComposition />

              {/* Protocol Stats */}
              <Card className="gaia-card">
                <h2 className="text-xl font-bold mb-6">Protocol Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  {protocolStats.map((stat, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-foreground/60 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                      <p className="text-xs text-foreground/40 mt-1">{stat.subtext}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Feature Cards */}
              <FeatureCards />

              {/* User Funding Progress */}
              {userProposedTasks && userProposedTasks.length > 0 && (
                <Card className="gaia-card">
                  <h3 className="text-lg font-semibold mb-4">Your Funding Progress</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-foreground/60">Funded</span>
                        <span className="font-medium">{fundingPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={fundingPercentage} className="h-2" />
                    </div>
                    <div className="text-xs text-foreground/60 space-y-1">
                      <p>Current: {userFunded ? formatUnits(userFunded, 18) : "0"} cUSD</p>
                      <p>Target: {userTarget ? formatUnits(userTarget, 18) : "0"} cUSD</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* My Assets */}
          <MyAssets />
        </div>
      </div>

      <CreateTaskModal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} />
    </div>
  )
}
