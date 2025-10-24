"use client"

import React, { useState } from "react"
import { useGetTotalTasks, useGetTasks, useAddStake, useGetOperatorStake, useGetOperatorTotalStake, useRegisterOperator, useWithdrawStake, useStakeForTask, useGetTaskStake, useGetMinimumOperatorStake, useGetMinimumStakePercentage, useIsApprovedOperator, useGetOperatorTasks, useSubmitProof, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Zap, Plus, Loader, AlertCircle, UserPlus, ArrowDownToLine, Lock, Upload, FileText, TrendingUp, Briefcase, CheckCircle, X } from "lucide-react"
import { parseEther, formatUnits, formatEther } from "viem"
import { motion, AnimatePresence } from "framer-motion"

export default function CarbonStakesPage() {
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  
  // Operator tasks
  const { taskIds: operatorTaskIds, isLoading: loadingOperatorTasks } = useGetOperatorTasks(address)
  const { tasks: operatorTasks } = useGetTasks(
    operatorTaskIds && operatorTaskIds.length > 0 ? operatorTaskIds : undefined
  )
  
  // Transaction hooks
  const { addStake, isPending: isAddingStake, isSuccess: addStakeSuccess } = useAddStake()
  const { registerOperator, isPending: isRegistering, isSuccess: registerSuccess } = useRegisterOperator()
  const { withdrawStake, isPending: isWithdrawing, isSuccess: withdrawSuccess } = useWithdrawStake()
  const { stakeForTask, isPending: isStakingForTask, isSuccess: stakeForTaskSuccess } = useStakeForTask()
  const { submitProof, isPending: isSubmittingProof, isSuccess: proofSuccess } = useSubmitProof()
  
  // Stake info
  const { stake: availableStake, isLoading: stakeLoading } = useGetOperatorStake(address)
  const { totalStake, isLoading: totalStakeLoading } = useGetOperatorTotalStake(address)
  const { isApproved: isOperator, isLoading: operatorCheckLoading } = useIsApprovedOperator(address)
  const { minimumStake, isLoading: minStakeLoading } = useGetMinimumOperatorStake()
  const { percentage: minStakePercentage } = useGetMinimumStakePercentage()
  
  // Form states
  const [stakeAmount, setStakeAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<bigint | null>(null)
  const [proofHash, setProofHash] = useState("")
  const [actualCO2, setActualCO2] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showStakeForTaskModal, setShowStakeForTaskModal] = useState(false)
  const [showProofModal, setShowProofModal] = useState(false)
  const [selectedTaskForProof, setSelectedTaskForProof] = useState<bigint | null>(null)
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

  const handleSubmitProof = async () => {
    if (!selectedTaskForProof || !proofHash.trim() || !actualCO2.trim()) {
      setError("All fields are required")
      return
    }

    try {
      setError(null)
      submitProof(selectedTaskForProof, proofHash, parseEther(actualCO2))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit proof")
    }
  }

  // Auto-close modals on success
  React.useEffect(() => {
    if (addStakeSuccess) {
      setStakeAmount("")
      setSuccessMessage("Stake added successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [addStakeSuccess])

  React.useEffect(() => {
    if (registerSuccess) {
      setShowRegisterModal(false)
      setRegisterAmount("")
      setSuccessMessage("Registered as operator successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [registerSuccess])

  React.useEffect(() => {
    if (withdrawSuccess) {
      setShowWithdrawModal(false)
      setWithdrawAmount("")
      setSuccessMessage("Stake withdrawn successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [withdrawSuccess])

  React.useEffect(() => {
    if (stakeForTaskSuccess) {
      setShowStakeForTaskModal(false)
      setSelectedTaskId(null)
      setSuccessMessage("Staked for task successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [stakeForTaskSuccess])

  React.useEffect(() => {
    if (proofSuccess) {
      setShowProofModal(false)
      setSelectedTaskForProof(null)
      setProofHash("")
      setActualCO2("")
      setSuccessMessage("Proof submitted successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [proofSuccess])

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

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <p className="text-green-700 text-sm">{successMessage}</p>
          </motion.div>
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
            <div className="space-y-4">
              {inProgressTasks.map((task) => (
                <motion.div
                  key={Number(task.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">#{task.id.toString()} - {task.description}</h3>
                      <p className="text-sm text-foreground/60 mt-1">Location: {task.location}</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                      In Progress
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Budget</p>
                      <p className="font-semibold text-primary">{formatUnits(task.estimatedCost, 18)} cUSD</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Expected CO₂</p>
                      <p className="font-semibold text-primary">{formatUnits(task.expectedCO2, 0)} tons</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Proof Required</p>
                      <p className="font-semibold text-primary">{task.proofRequirements}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedTaskForProof(task.id)
                      setShowProofModal(true)
                    }}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isSubmittingProof}
                  >
                    {isSubmittingProof ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Proof
                      </>
                    )}
                  </Button>
                </motion.div>
              ))}
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

      {/* Submit Proof Modal */}
      <AnimatePresence>
        {showProofModal && selectedTaskForProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProofModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Submit Proof</h2>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-foreground/60 hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-foreground/60 mb-1">Task ID</p>
                  <p className="font-semibold text-foreground">#{selectedTaskForProof.toString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Proof Hash (IPFS)</label>
                  <Input
                    type="text"
                    placeholder="QmXxxx..."
                    value={proofHash}
                    onChange={(e) => setProofHash(e.target.value)}
                    className="bg-background border-border font-mono text-xs"
                    disabled={isSubmittingProof}
                  />
                  <p className="text-xs text-foreground/60 mt-1">IPFS hash of proof document</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Actual CO₂ (tons)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={actualCO2}
                    onChange={(e) => setActualCO2(e.target.value)}
                    step="0.01"
                    min="0"
                    className="bg-background border-border"
                    disabled={isSubmittingProof}
                  />
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
                  onClick={() => setShowProofModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmittingProof}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitProof}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmittingProof}
                >
                  {isSubmittingProof ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Proof
                    </>
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
