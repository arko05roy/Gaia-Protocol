"use client"

import { useState } from "react"
import React from "react"
import { useGetTotalTasks, useGetTasks, useFundTask, useGetFundingProgress, useApproveToken, useGetAllowance, useCUSDTokenAddress } from "@/hooks"
import { useAccount } from "wagmi"
import { motion } from "framer-motion"
import { Search, Leaf, Loader, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import DashboardHeader from "@/components/dashboard/header"
import { parseEther, formatUnits } from "viem"

const FUNDING_POOL_ADDRESS = '0x89a87B531E37731A77B1E40B6B8B5bCb58819059' as const

export default function FundingPage() {
  const { address } = useAccount()
  const cusdAddress = useCUSDTokenAddress()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { fundTask, isPending: isFunding, isSuccess: fundSuccess } = useFundTask()
  const { approveToken, isPending: isApproving, isSuccess: approvalSuccess } = useApproveToken()
  const { allowance, isLoading: allowanceLoading, refetch: refetchAllowance } = useGetAllowance(
    cusdAddress as `0x${string}`,
    address,
    FUNDING_POOL_ADDRESS as `0x${string}`
  )
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<bigint | null>(null)
  const [fundAmount, setFundAmount] = useState("1000")
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundError, setFundError] = useState<string | null>(null)
  const [approvalStep, setApprovalStep] = useState(false)

  const filteredTasks = (tasks || []).filter(
    (task) =>
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleFundProject = (taskId: bigint) => {
    setSelectedTaskId(taskId)
    setShowFundModal(true)
    setFundError(null)
  }

  const handleConfirmFunding = () => {
    if (!selectedTaskId || !fundAmount || !address) {
      setFundError("Missing required information")
      return
    }

    try {
      setFundError(null)
      const amount = parseEther(fundAmount)

      // Check if approval is needed
      if (!allowance || allowance < amount) {
        // Need to approve first - this will trigger wallet popup
        setApprovalStep(true)
        console.log('Requesting approval for:', amount.toString())
        approveToken(cusdAddress as `0x${string}`, FUNDING_POOL_ADDRESS as `0x${string}`, amount)
      } else {
        // Already approved, proceed with funding
        console.log('Already approved, proceeding with funding')
        fundTask(selectedTaskId, amount)
      }
    } catch (err) {
      console.error('Error:', err)
      setFundError(err instanceof Error ? err.message : "Failed to process transaction")
    }
  }

  // Auto-fund after approval succeeds
  React.useEffect(() => {
    if (approvalSuccess && approvalStep && selectedTaskId && fundAmount) {
      console.log('Approval succeeded, proceeding with funding')
      const amount = parseEther(fundAmount)
      try {
        fundTask(selectedTaskId, amount)
        setApprovalStep(false)
      } catch (err) {
        setFundError(err instanceof Error ? err.message : "Failed to fund task")
      }
    }
  }, [approvalSuccess, approvalStep, selectedTaskId, fundAmount])

  const handleModalClose = () => {
    setShowFundModal(false)
    setFundAmount("1000")
    setFundError(null)
    setApprovalStep(false)
    if (fundSuccess) {
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  const selectedTask = selectedTaskId && tasks ? tasks.find((t) => t.id === selectedTaskId) : null

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fund Projects</h1>
            <p className="text-foreground/60 mt-1">Support environmental projects and earn carbon credits</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-foreground/40" />
            <input
              type="text"
              placeholder="Search projects by description or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Loading State */}
          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-foreground/60">Loading projects...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/60">No projects available to fund</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task, index) => {
                const estimatedCost = Number(formatUnits(task.estimatedCost, 18))
                const expectedCO2 = Number(formatUnits(task.expectedCO2, 0))
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const { funded, target } = useGetFundingProgress(task.id)
                const fundingPercentage = target && target > 0n ? Number((funded * 100n) / target) : 0
                return (
                  <motion.div
                    key={Number(task.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                      <img src="/mangrove-planting-1.jpg" alt={task.description} className="w-full h-full object-cover" />
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                            Task #{Number(task.id)}
                          </span>
                          <span className="text-xs text-foreground/60">{task.location}</span>
                        </div>
                        <h3 className="font-semibold text-foreground line-clamp-2">{task.description}</h3>
                        <p className="text-sm text-foreground/60 mt-1 line-clamp-2">{task.proofRequirements}</p>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-foreground/60">Funding Progress</span>
                          <span className="font-semibold text-foreground">
                            {funded ? formatUnits(funded, 18) : "0"} / {estimatedCost.toLocaleString()} cUSD
                          </span>
                        </div>
                        <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Leaf className="h-4 w-4 text-primary" />
                        <span>{expectedCO2.toLocaleString()} CO₂ tons expected</span>
                      </div>

                      {/* Fund Button */}
                      <Button
                        onClick={() => handleFundProject(task.id)}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        disabled={isFunding}
                      >
                        {isFunding ? "Processing..." : "Fund Now"}
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fund Modal */}
      {showFundModal && selectedTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleModalClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground line-clamp-2">{selectedTask.description}</h2>
              <p className="text-foreground/60 mt-1">Task #{Number(selectedTask.id)} • {selectedTask.location}</p>
            </div>

            {fundError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{fundError}</span>
              </div>
            )}

            {approvalStep && !approvalSuccess && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-2">
                <Loader className="h-4 w-4 animate-spin flex-shrink-0" />
                <span>Waiting for token approval...</span>
              </div>
            )}

            {approvalSuccess && approvalStep && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                ✓ Token approved! Proceeding with funding...
              </div>
            )}

            {fundSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                ✓ Funding successful! Reloading...
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Funding Amount (cUSD)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isFunding || fundSuccess}
                  />
                  <span className="text-lg font-bold text-primary min-w-fit">cUSD</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-xs text-foreground/60">Expected CO₂</p>
                  <p className="font-semibold text-foreground">
                    {fundAmount && selectedTask.estimatedCost > 0n
                      ? Math.round(
                          (Number(fundAmount) / Number(formatUnits(selectedTask.estimatedCost, 18))) *
                            Number(formatUnits(selectedTask.expectedCO2, 0))
                        )
                      : 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Your Impact</p>
                  <p className="font-semibold text-foreground">
                    {fundAmount && selectedTask.estimatedCost > 0n
                      ? Math.round(
                          (Number(fundAmount) / Number(formatUnits(selectedTask.estimatedCost, 18))) * 100
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirmFunding}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                disabled={isApproving || isFunding || fundSuccess || !fundAmount || allowanceLoading}
              >
                {allowanceLoading && !approvalStep
                  ? "Checking..."
                  : isApproving
                    ? "Approving..."
                    : approvalStep && !approvalSuccess
                      ? "Waiting for Approval"
                      : approvalStep && approvalSuccess && !isFunding
                        ? "Proceeding to Funding..."
                        : isFunding
                          ? "Funding..."
                          : fundSuccess
                            ? "Success!"
                            : "Confirm Funding"}
              </Button>
              <Button
                onClick={handleModalClose}
                variant="outline"
                className="flex-1"
                disabled={isApproving || isFunding}
              >
                {fundSuccess ? "Close" : "Cancel"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
