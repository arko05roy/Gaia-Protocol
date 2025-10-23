"use client"

import React, { useState } from "react"
import { useGetTotalTasks, useGetTasks, useAddStake, useGetOperatorStake, useGetOperatorTotalStake, useRegisterOperator, useWithdrawStake, useStakeForTask, useGetTaskStake, useGetMinimumOperatorStake, useGetMinimumStakePercentage, useIsApprovedOperator, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Zap, Plus, Loader, AlertCircle, UserPlus, ArrowDownToLine, Lock } from "lucide-react"
import { parseEther, formatUnits, formatEther } from "viem"
import { motion, AnimatePresence } from "framer-motion"

export default function CarbonStakesPage() {
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { addStake, isPending: isAddingStake, isSuccess: addStakeSuccess } = useAddStake()
  const { registerOperator, isPending: isRegistering, isSuccess: registerSuccess } = useRegisterOperator()
  const { withdrawStake, isPending: isWithdrawing, isSuccess: withdrawSuccess } = useWithdrawStake()
  const { stakeForTask, isPending: isStakingForTask, isSuccess: stakeForTaskSuccess } = useStakeForTask()
  const { stake: availableStake, isLoading: stakeLoading } = useGetOperatorStake(address)
  const { totalStake, isLoading: totalStakeLoading } = useGetOperatorTotalStake(address)
  const { isApproved: isOperator, isLoading: operatorCheckLoading } = useIsApprovedOperator(address)
  const { minimumStake, isLoading: minStakeLoading } = useGetMinimumOperatorStake()
  const { percentage: minStakePercentage } = useGetMinimumStakePercentage()
  
  const [stakeAmount, setStakeAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<bigint | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showStakeForTaskModal, setShowStakeForTaskModal] = useState(false)
  const [registerAmount, setRegisterAmount] = useState("")

  // Filter tasks by status
  const fundedTasks = (tasks || []).filter((t) => t.status === TaskStatus.Funded)
  const inProgressTasks = (tasks || []).filter((t) => t.status === TaskStatus.InProgress && t.assignedOperator.toLowerCase() === address?.toLowerCase())

  const handleAddStake = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stakeAmount || !address) {
      setError("Please enter amount and connect wallet")
      return
    }

    try {
      setError(null)
      const amount = parseEther(stakeAmount)
      if (amount <= 0n) {
        setError("Amount must be greater than 0")
        return
      }
      addStake(amount)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stake")
    }
  }

  const handleRegisterOperator = async () => {
    if (!registerAmount || !address) {
      setError("Please enter amount and connect wallet")
      return
    }

    try {
      setError(null)
      const amount = parseEther(registerAmount)
      if (amount < (minimumStake || 0n)) {
        setError(`Minimum stake is ${formatEther(minimumStake || 0n)} CELO`)
        return
      }
      registerOperator(amount)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register")
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !address) {
      setError("Please enter amount and connect wallet")
      return
    }

    try {
      setError(null)
      const amount = parseEther(withdrawAmount)
      if (amount <= 0n || amount > (availableStake || 0n)) {
        setError("Invalid withdrawal amount")
        return
      }
      withdrawStake(amount)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw")
    }
  }

  const handleStakeForTask = async () => {
    if (!selectedTaskId || !address) {
      setError("Please select a task and connect wallet")
      return
    }

    try {
      setError(null)
      stakeForTask(selectedTaskId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stake for task")
    }
  }

  // Auto-close modals on success
  React.useEffect(() => {
    if (addStakeSuccess) {
      setStakeAmount("")
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }, [addStakeSuccess])

  React.useEffect(() => {
    if (registerSuccess) {
      setShowRegisterModal(false)
      setRegisterAmount("")
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }, [registerSuccess])

  React.useEffect(() => {
    if (withdrawSuccess) {
      setShowWithdrawModal(false)
      setWithdrawAmount("")
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }, [withdrawSuccess])

  React.useEffect(() => {
    if (stakeForTaskSuccess) {
      setShowStakeForTaskModal(false)
      setSelectedTaskId(null)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }, [stakeForTaskSuccess])

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Operator Stakes
          </h1>
          <p className="text-foreground/60 mt-2">Manage your operator stake and accept environmental tasks</p>
        </div>

        {/* Operator Status & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Operator Status</p>
                <p className="text-xl font-bold text-primary">
                  {operatorCheckLoading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : isOperator ? (
                    <span className="text-green-600">✓ Registered</span>
                  ) : (
                    <span className="text-yellow-600">Not Registered</span>
                  )}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Available Stake</p>
                <p className="text-2xl font-bold text-primary">
                  {stakeLoading ? (
                    <Loader className="h-6 w-6 animate-spin" />
                  ) : availableStake ? (
                    formatEther(availableStake) + " CELO"
                  ) : (
                    "0 CELO"
                  )}
                </p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4 bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Total Stake (incl. locked)</p>
                <p className="text-2xl font-bold text-primary">
                  {totalStakeLoading ? (
                    <Loader className="h-6 w-6 animate-spin" />
                  ) : totalStake ? (
                    formatEther(totalStake) + " CELO"
                  ) : (
                    "0 CELO"
                  )}
                </p>
              </div>
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
            ✓ Operation completed successfully!
          </div>
        )}

        {/* Action Buttons */}
        {!isOperator && (
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-bold mb-2">Become an Operator</h2>
            <p className="text-sm text-foreground/60 mb-4">
              Register as an operator to accept and execute environmental tasks. Minimum stake: {minStakeLoading ? "..." : formatEther(minimumStake || 0n)} CELO
            </p>
            <Button
              onClick={() => setShowRegisterModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Register as Operator
            </Button>
          </Card>
        )}

        {isOperator && (
          <>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowWithdrawModal(true)}
                variant="outline"
                disabled={!availableStake || availableStake === 0n}
              >
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Withdraw Stake
              </Button>
              <Button
                onClick={() => setShowStakeForTaskModal(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={fundedTasks.length === 0}
              >
                <Lock className="h-4 w-4 mr-2" />
                Stake for Task
              </Button>
            </div>

            {/* Add Stake Form */}
            <Card className="p-6 bg-card border border-border">
              <h2 className="text-xl font-bold mb-4">Add More Stake</h2>
              <form onSubmit={handleAddStake} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Stake Amount (CELO)</label>
                  <Input
                    type="number"
                    placeholder="1.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="bg-background border-border"
                    disabled={isAddingStake}
                    step="0.01"
                    min="0"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isAddingStake}
                >
                  {isAddingStake ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Adding Stake...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stake
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </>
        )}

        {/* My Tasks (In Progress) */}
        {isOperator && inProgressTasks.length > 0 && (
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-bold mb-4">My Tasks (In Progress)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Task ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 font-semibold">Location</th>
                    <th className="text-left py-3 px-4 font-semibold">Expected CO₂</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inProgressTasks.map((task) => (
                    <tr key={Number(task.id)} className="border-b border-border hover:bg-primary/5">
                      <td className="py-3 px-4 font-medium">#{task.id.toString()}</td>
                      <td className="py-3 px-4 line-clamp-2">{task.description}</td>
                      <td className="py-3 px-4">{task.location}</td>
                      <td className="py-3 px-4 font-semibold text-primary">{formatUnits(task.expectedCO2, 0)} tons</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                          In Progress
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Available Funded Tasks */}
        {isOperator && fundedTasks.length > 0 && (
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-bold mb-4">Available Funded Tasks</h2>
            <p className="text-sm text-foreground/60 mb-4">
              These tasks are fully funded and ready for operators. Stake collateral to accept a task.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Task ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 font-semibold">Location</th>
                    <th className="text-left py-3 px-4 font-semibold">Budget</th>
                    <th className="text-left py-3 px-4 font-semibold">Required Stake</th>
                  </tr>
                </thead>
                <tbody>
                  {fundedTasks.map((task) => {
                    const requiredStake = (task.estimatedCost * (minStakePercentage || 1000n)) / 10000n
                    return (
                      <tr key={Number(task.id)} className="border-b border-border hover:bg-primary/5">
                        <td className="py-3 px-4 font-medium">#{task.id.toString()}</td>
                        <td className="py-3 px-4 line-clamp-2">{task.description}</td>
                        <td className="py-3 px-4">{task.location}</td>
                        <td className="py-3 px-4 font-semibold text-primary">{formatUnits(task.estimatedCost, 18)} cUSD</td>
                        <td className="py-3 px-4 font-semibold text-yellow-600">{formatUnits(requiredStake, 18)} cUSD</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Register Operator Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold">Register as Operator</h2>
              <div className="space-y-4">
                <p className="text-sm text-foreground/60">
                  Register as an operator to accept and execute environmental tasks. You need to stake a minimum amount as collateral.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Initial Stake (CELO)</label>
                  <Input
                    type="number"
                    placeholder={formatEther(minimumStake || 0n)}
                    value={registerAmount}
                    onChange={(e) => setRegisterAmount(e.target.value)}
                    step="0.01"
                    min={formatEther(minimumStake || 0n)}
                    disabled={isRegistering}
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Minimum: {formatEther(minimumStake || 0n)} CELO
                  </p>
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowRegisterModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isRegistering}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegisterOperator}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Stake Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold">Withdraw Stake</h2>
              <div className="space-y-4">
                <p className="text-sm text-foreground/60">
                  Withdraw your available stake. Note: Locked stake cannot be withdrawn until tasks are completed.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Withdrawal Amount (CELO)</label>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    step="0.01"
                    max={formatEther(availableStake || 0n)}
                    disabled={isWithdrawing}
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Available: {formatEther(availableStake || 0n)} CELO
                  </p>
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowWithdrawModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isWithdrawing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    "Withdraw"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stake for Task Modal */}
      <AnimatePresence>
        {showStakeForTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowStakeForTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold">Stake for Task</h2>
              <div className="space-y-4">
                <p className="text-sm text-foreground/60">
                  Select a funded task to accept. Your stake will be locked as collateral until the task is completed and verified.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Task</label>
                  <select
                    value={selectedTaskId ? Number(selectedTaskId) : ""}
                    onChange={(e) => setSelectedTaskId(e.target.value ? BigInt(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    disabled={isStakingForTask}
                  >
                    <option value="">Select a task</option>
                    {fundedTasks.map((task) => (
                      <option key={Number(task.id)} value={Number(task.id)}>
                        #{task.id.toString()} - {task.description.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowStakeForTaskModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isStakingForTask}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStakeForTask}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isStakingForTask || !selectedTaskId}
                >
                  {isStakingForTask ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    "Stake & Accept Task"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
