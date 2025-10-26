"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, CheckCircle2, ChevronDown, ChevronUp, ImageIcon, FileText, MapPin, Cloud, Eye, Loader, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useGetTotalTasks,
  useGetTasks,
  useSubmitValidatorVote,
  useIsValidator,
  useGetValidatorReputation,
  useGetVerificationStatus,
  useGetTaskValidators,
  useGetValidatorVote,
  useGetRequiredValidators,
  useGetConsensusThreshold,
  useGetVerificationPeriod,
  TaskStatus,
  type Vote,
} from "@/hooks"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import DashboardHeader from "@/components/dashboard/header"

interface VerificationStep {
  id: string
  label: string
  completed: boolean
}

const mockVerificationSteps: VerificationStep[] = [
  { id: "step-1", label: "Proof documentation reviewed", completed: false },
  { id: "step-2", label: "Location verified", completed: false },
  { id: "step-3", label: "Quality assessment complete", completed: false },
  { id: "step-4", label: "CO₂ calculations validated", completed: false },
]

export default function VerificationPage() {
  const { address } = useAccount()
  
  // Task data
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  
  // Validator checks
  const { isValidator, isLoading: validatorCheckLoading } = useIsValidator(address)
  const { reputationScore } = useGetValidatorReputation(address)
  
  // Verification parameters
  const { requiredValidators } = useGetRequiredValidators()
  const { threshold } = useGetConsensusThreshold()
  const { period: verificationPeriod } = useGetVerificationPeriod()
  
  // Transaction hooks
  const { submitValidatorVote, hash, isPending: isSubmitting, isConfirming, isSuccess: voteSuccess, error: txError, isError: hasTxError } = useSubmitValidatorVote()
  
  const [selectedTask, setSelectedTask] = useState<bigint | null>(null)
  const [expandedTask, setExpandedTask] = useState<bigint | null>(null)
  const [verificationSteps, setVerificationSteps] = useState(mockVerificationSteps)
  const [confidence, setConfidence] = useState(85)
  const [justification, setJustification] = useState(
    "All evidence checks out. GPS data consistent, drone footage shows healthy plantation, local authority signature verified. CO₂ estimate aligns with scientific models for mangrove carbon sequestration.",
  )
  const [voteChoice, setVoteChoice] = useState<"approve" | "reject" | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [successSubtitle, setSuccessSubtitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  
  // Fetch verification status and validators for selected task
  const { status: verificationStatus, isLoading: statusLoading } = useGetVerificationStatus(selectedTask || undefined)
  const { validators: taskValidators, isLoading: validatorsLoading } = useGetTaskValidators(selectedTask || undefined)
  const { vote: userVote } = useGetValidatorVote(selectedTask || undefined, address)

  // Filter tasks that need verification (only UnderReview status - proof submitted by operator)
  const pendingTasks = (tasks || []).filter((t) => t.status === TaskStatus.UnderReview)

  const handleStepToggle = (stepId: string) => {
    setVerificationSteps(
      verificationSteps.map((step: VerificationStep) => (step.id === stepId ? { ...step, completed: !step.completed } : step)),
    )
  }

  const handleSubmit = async () => {
    if (!voteChoice || !selectedTask || !address) {
      setError("Please select approve/reject and connect wallet")
      return
    }

    // Only block if validator check explicitly returns false
    if (isValidator === false) {
      setError("You are not registered as a validator")
      return
    }

    if (userVote?.hasVoted) {
      setError("You have already voted on this task")
      return
    }

    // Check if verification has been initiated
    if (!verificationStatus || verificationStatus.deadline === 0n) {
      setError("Verification has not been initiated for this task. An admin must initiate verification first.")
      return
    }

    // Check if deadline has passed
    if (BigInt(Math.floor(Date.now() / 1000)) > verificationStatus.deadline) {
      setError("Verification deadline has passed")
      return
    }

    // Check if already finalized
    if (verificationStatus.isFinalized) {
      setError("Verification has already been finalized")
      return
    }

    try {
      setError(null)
      const approved = voteChoice === "approve"
      const confidenceBigInt = BigInt(Math.max(0, Math.min(100, confidence)))
      // Diagnostics to confirm hook invocation
      console.log("Submitting validator vote", {
        taskId: selectedTask.toString(),
        approved,
        justification,
        confidence: confidenceBigInt.toString(),
        verificationManagerAddress: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
      })
      submitValidatorVote(selectedTask, approved, justification, confidenceBigInt)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit vote"
      console.error("Error in handleSubmit:", errorMsg)
      setError(errorMsg)
    }
  }

  // Auto-close modal on success
  React.useEffect(() => {
    if (voteSuccess && selectedTask) {
      setSuccessMessage("Verification Submitted Successfully")
      setSuccessSubtitle(
        `Task #${selectedTask} ${voteChoice === "approve" ? "approved" : "rejected"} with ${confidence}% confidence`,
      )
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
        setSelectedTask(null)
        setVerificationSteps(mockVerificationSteps)
        setConfidence(85)
        setJustification(
          "All evidence checks out. GPS data consistent, drone footage shows healthy plantation, local authority signature verified. CO₂ estimate aligns with scientific models for mangrove carbon sequestration.",
        )
        setVoteChoice(null)
      }, 3000)
    }
  }, [voteSuccess])

  // Handle transaction errors
  React.useEffect(() => {
    if (hasTxError && txError) {
      const errorMsg = txError instanceof Error ? txError.message : String(txError)
      console.error("Vote submission error:", errorMsg)
      setError(errorMsg)
    }
  }, [hasTxError, txError])

  // Watch for transaction hash
  React.useEffect(() => {
    if (hash) {
      console.log("Vote transaction hash:", hash)
    }
  }, [hash])

  const currentTask = tasks?.find((t) => t.id === selectedTask)

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Verification Dashboard</h1>
                <p className="text-foreground/60 mt-1">Review and verify environmental projects</p>
              </div>
              {validatorCheckLoading ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                  <Loader className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground/60">Checking status...</span>
                </div>
              ) : !isValidator ? (
                <div className="px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">Not a validator</p>
                </div>
              ) : (
                <div className="space-y-2 text-right">
                  <div className="flex items-center gap-2 justify-end px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Validator</span>
                  </div>
                  {reputationScore !== undefined && (
                    <p className="text-xs text-foreground/60">Reputation: {formatUnits(reputationScore, 0)}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Validator Check */}
          {!validatorCheckLoading && !isValidator && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                You are not registered as a validator. Only approved validators can submit verification votes.
              </p>
            </motion.div>
          )}

          {/* Pending Reviews Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Pending Reviews</h2>

            {tasksLoading || validatorCheckLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-foreground/60">Loading tasks for verification...</p>
                </div>
              </div>
            ) : !isValidator ? (
              <div className="text-center py-12">
                <p className="text-foreground/60">Only validators can access this section</p>
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground/60">No pending tasks to verify</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <motion.div
                    key={Number(task.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border rounded-lg bg-card hover:bg-card/80 transition-colors"
                  >
                    <button
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      className="w-full p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 text-left flex-1">
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Task #{Number(task.id)}
                          </h3>
                          <p className="text-sm text-foreground/60">{task.description}</p>
                        </div>
                      </div>
                      {expandedTask === task.id ? (
                        <ChevronUp className="h-5 w-5 text-foreground/60" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-foreground/60" />
                      )}
                    </button>

                    {/* Expanded Task Details */}
                    <AnimatePresence>
                      {expandedTask === task.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-border px-4 py-4 space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-foreground/60">Location</p>
                              <p className="font-medium text-foreground">{task.location}</p>
                            </div>
                            <div>
                              <p className="text-sm text-foreground/60">Proof Requirements</p>
                              <p className="font-medium text-foreground">{task.proofRequirements}</p>
                            </div>
                          </div>

                          <Button
                            onClick={() => setSelectedTask(task.id)}
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                          >
                            Review Task
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Interface Modal */}
      <AnimatePresence>
        {selectedTask && currentTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Section 1: Task Information */}
                <div className="border-b border-border pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        Task #{Number(currentTask.id)}
                      </h2>
                      <p className="text-foreground/60">{currentTask.description}</p>
                    </div>
                    {userVote?.hasVoted && (
                      <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        You voted
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-foreground/60">Location</p>
                      <p className="font-semibold text-foreground">{currentTask.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground/60">Proof Requirements</p>
                      <p className="font-semibold text-foreground">{currentTask.proofRequirements}</p>
                    </div>
                  </div>

                  {/* Verification Status */}
                  {statusLoading ? (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <Loader className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-foreground/60">Loading verification status...</span>
                    </div>
                  ) : verificationStatus && (
                    <div className="p-4 bg-foreground/5 rounded-lg border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Verification Status</span>
                        <span className="text-xs text-foreground/60">
                          {verificationStatus.approveVotes || 0} approve / {verificationStatus.rejectVotes || 0} reject
                        </span>
                      </div>
                      <div className="w-full bg-foreground/10 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              ((verificationStatus.approveVotes || 0) /
                                (Number(requiredValidators) || 3)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-foreground/60">
                        {requiredValidators ? `${Number(requiredValidators)} validators required` : "Loading..."}
                      </p>
                    </div>
                  )}

                  {/* Download IPFS Bundle */}
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">IPFS Hash</p>
                      <p className="text-sm text-foreground/60 break-all">{currentTask.ipfsHash}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent flex-shrink-0">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Section 2: Operator Proof */}
                <div className="border-b border-border pb-6 space-y-4">
                  <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Operator Proof Submission
                  </h3>

                  {/* Operator Information */}
                  <div className="p-4 bg-foreground/5 rounded-lg border border-border">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-foreground/60">Operator Address</p>
                        <p className="text-sm font-mono text-foreground break-all">{currentTask.assignedOperator}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Actual CO₂ Offset (tons)</p>
                        <p className="text-lg font-bold text-primary">{formatUnits(currentTask.actualCO2, 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Proof Hash from IPFS */}
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Proof Hash (IPFS)</p>
                      <p className="text-sm text-foreground/60 break-all font-mono">{currentTask.proofHash || "No proof submitted"}</p>
                    </div>
                    {currentTask.proofHash && (
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent flex-shrink-0">
                        <Download className="h-4 w-4" />
                        View
                      </Button>
                    )}
                  </div>

                  {/* Proof Status */}
                  {currentTask.proofHash ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800">Proof submitted by operator - Ready for verification</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">No proof submitted yet</p>
                    </div>
                  )}
                </div>

                {/* Section 3: CO₂ Verification */}
                <div className="border-b border-border pb-6 space-y-4">
                  <h3 className="font-semibold text-foreground text-lg">CO₂ Offset Verification</h3>

                  {/* Expected vs Actual CO2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-foreground/5 rounded-lg border border-border">
                      <p className="text-xs text-foreground/60 mb-1">Expected CO₂ (tons)</p>
                      <p className="text-2xl font-bold text-foreground">{formatUnits(currentTask.expectedCO2, 0)}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-xs text-foreground/60 mb-1">Actual CO₂ Submitted (tons)</p>
                      <p className="text-2xl font-bold text-primary">{formatUnits(currentTask.actualCO2, 0)}</p>
                    </div>
                  </div>

                  {/* Variance Analysis */}
                  {currentTask.actualCO2 > 0n && (
                    <div className="p-4 bg-foreground/5 rounded-lg border border-border">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Variance Analysis</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground/60">Difference:</span>
                          <span className="text-sm font-semibold text-foreground">
                            {Number(currentTask.actualCO2) > Number(currentTask.expectedCO2)
                              ? `+${formatUnits(currentTask.actualCO2 - currentTask.expectedCO2, 0)} tons`
                              : `${formatUnits(currentTask.actualCO2 - currentTask.expectedCO2, 0)} tons`}
                          </span>
                        </div>
                        <div className="w-full bg-foreground/10 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              Number(currentTask.actualCO2) >= Number(currentTask.expectedCO2)
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (Number(currentTask.actualCO2) / Number(currentTask.expectedCO2)) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Task Details */}
                  <div className="p-4 bg-foreground/5 rounded-lg border border-border">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-foreground/60">Task Deadline</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(Number(currentTask.deadline) * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60">Proof Requirements</p>
                        <p className="text-sm font-medium text-foreground">{currentTask.proofRequirements}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Assessment Summary (Checklist) */}
                <div className="border-b border-border pb-6">
                  <h3 className="font-semibold text-foreground text-lg mb-4">Assessment Summary</h3>
                  <div className="space-y-2">
                    {verificationSteps.map((step: VerificationStep) => (
                      <label
                        key={step.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-foreground/5 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={step.completed}
                          onChange={() => handleStepToggle(step.id)}
                          className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                        <span
                          className={`text-sm ${
                            step.completed ? "text-foreground/60 line-through" : "text-foreground"
                          }`}
                        >
                          {step.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Section 5: Validator Votes */}
                {taskValidators && taskValidators.length > 0 && (
                  <div className="border-b border-border pb-6">
                    <h3 className="font-semibold text-foreground text-lg mb-4">Validator Votes</h3>
                    <div className="space-y-2">
                      {taskValidators.map((validator) => (
                        <div key={validator} className="p-3 bg-foreground/5 rounded-lg border border-border">
                          <p className="text-xs text-foreground/60 font-mono break-all">{validator}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 6: Decision Form */}
                <div className="space-y-6">
                  {/* Vote Choice */}
                  <div>
                    <p className="font-semibold text-foreground mb-3">Vote</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="vote"
                          value="approve"
                          checked={voteChoice === "approve"}
                          onChange={(e) => setVoteChoice(e.target.value as "approve")}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-foreground">Approve</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="vote"
                          value="reject"
                          checked={voteChoice === "reject"}
                          onChange={(e) => setVoteChoice(e.target.value as "reject")}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-foreground">Reject</span>
                      </label>
                    </div>
                  </div>

                  {/* Confidence Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-foreground">Confidence Level</label>
                      <span className="text-lg font-bold text-primary">{confidence}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                      className="w-full h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Justification */}
                  <div>
                    <label className="block font-semibold text-foreground mb-2">Justification</label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Transaction Status */}
                  {hash && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 font-mono break-all">
                        Transaction: {hash}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={!voteChoice || isSubmitting || isConfirming || userVote?.hasVoted || isValidator === false}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                    >
                      {userVote?.hasVoted ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Already Voted
                        </>
                      ) : isConfirming ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : isSubmitting ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Signing...
                        </>
                      ) : !isValidator ? (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          Not a Validator
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Sign & Submit Transaction
                        </>
                      )}
                    </Button>
                    <Button onClick={() => setSelectedTask(null)} variant="outline" className="flex-1" disabled={isSubmitting || isConfirming}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-lg p-8 max-w-sm w-full text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center"
              >
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{successMessage}</h3>
                <p className="text-sm text-foreground/60 mt-2">{successSubtitle}</p>
              </div>
              <p className="text-xs text-foreground/40">Redirecting...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
