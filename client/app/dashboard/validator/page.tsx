"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, CheckCircle2, XCircle, ChevronDown, ChevronUp, ImageIcon, FileText, Loader, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetTotalTasks, useGetTasks, useSubmitValidatorVote, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"

interface VerificationTask {
  id: bigint
  description: string
  location: string
  status: TaskStatus
  proofRequirements: string
  ipfsHash: string
}

interface VerificationStep {
  id: string
  label: string
  completed: boolean
}

const mockVerificationSteps: VerificationStep[] = [
  { id: "step-1", label: "GPS coordinates verified", completed: false },
  { id: "step-2", label: "Photo evidence reviewed", completed: false },
  { id: "step-3", label: "Drone footage analyzed", completed: false },
  { id: "step-4", label: "Tree count validated", completed: false },
  { id: "step-5", label: "Environmental impact assessed", completed: false },
]

const mockPhotos = [
  { id: "photo-1", url: "/mangrove-planting-1.jpg" },
  { id: "photo-2", url: "/mangrove-planting-2.jpg" },
  { id: "photo-3", url: "/mangrove-planting-3.jpg" },
]

export default function ValidatorPage() {
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { submitValidatorVote, isPending: isSubmitting, isSuccess: voteSuccess } = useSubmitValidatorVote()

  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null)
  const [expandedTask, setExpandedTask] = useState<bigint | null>(null)
  const [verificationSteps, setVerificationSteps] = useState(mockVerificationSteps)
  const [confidence, setConfidence] = useState(50)
  const [justification, setJustification] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Filter tasks that need verification (not verified or rejected)
  const pendingTasks = (tasks || []).filter((t) => t.status !== TaskStatus.Verified && t.status !== TaskStatus.Rejected)

  const handleStepToggle = (stepId: string) => {
    setVerificationSteps(
      verificationSteps.map((step: VerificationStep) => (step.id === stepId ? { ...step, completed: !step.completed } : step)),
    )
  }

  const handleApprove = async () => {
    if (!selectedTask || !address) {
      setError("Wallet not connected")
      return
    }

    try {
      setError(null)
      const approved = true
      submitValidatorVote(selectedTask.id, approved, justification, BigInt(confidence))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote")
    }
  }

  const handleReject = async () => {
    if (!selectedTask || !address) {
      setError("Wallet not connected")
      return
    }

    try {
      setError(null)
      const approved = false
      submitValidatorVote(selectedTask.id, approved, justification, BigInt(confidence))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote")
    }
  }

  // Auto-close modal on success
  React.useEffect(() => {
    if (voteSuccess) {
      setSuccessMessage("Verification submitted successfully. Task approved on-chain.")
      setShowSuccessModal(true)
      setTimeout(() => {
        setShowSuccessModal(false)
        setSelectedTask(null)
        setVerificationSteps(mockVerificationSteps)
        setConfidence(50)
        setJustification("")
      }, 3000)
    }
  }, [voteSuccess])

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Validator Dashboard</h1>
          <p className="text-foreground/60 mt-1">Review and verify environmental projects</p>
        </div>

        {/* Pending Reviews Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Pending Reviews</h2>

          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-foreground/60">Loading tasks for verification...</p>
              </div>
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="p-8 text-center border border-border rounded-lg bg-card">
              <p className="text-foreground/60">No tasks pending verification at this time</p>
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
                        <h3 className="font-semibold text-foreground">Task #{Number(task.id)}</h3>
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
                          onClick={() => setSelectedTask(task as unknown as VerificationTask)}
                          className="w-full bg-primary hover:bg-primary/90 text-white"
                        >
                          Open Verification Interface
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

      {/* Verification Interface Modal */}
      <AnimatePresence>
        {selectedTask && (
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
              className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Task Header */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Task #{Number(selectedTask.id)}</h2>
                  <p className="text-foreground/60 mt-1">{selectedTask.description}</p>
                </div>

                {/* Download IPFS Bundle */}
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">IPFS Hash</p>
                    <p className="text-sm text-foreground/60 break-all">{selectedTask.ipfsHash}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                {/* Photo Gallery */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photo Evidence & Drone Footage
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {mockPhotos.map((photo: { id: string; url: string }) => (
                      <motion.img
                        key={photo.id}
                        src={photo.url}
                        alt="Verification photo"
                        className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:border-primary transition-colors"
                        whileHover={{ scale: 1.05 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Verification Checklist */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Verification Checklist</h3>
                  <div className="space-y-2">
                    {verificationSteps.map((step) => (
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
                    placeholder="Provide your verification justification..."
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

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button onClick={handleReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button onClick={() => setSelectedTask(null)} variant="outline" className="flex-1" disabled={isSubmitting}>
                    Close
                  </Button>
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
              <h3 className="text-xl font-bold text-foreground">{successMessage}</h3>
              <p className="text-sm text-foreground/60">Redirecting...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
