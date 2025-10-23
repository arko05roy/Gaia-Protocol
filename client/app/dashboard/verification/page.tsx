"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, CheckCircle2, ChevronDown, ChevronUp, ImageIcon, FileText, MapPin, Cloud, Eye, Loader, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetTotalTasks, useGetTasks, useSubmitValidatorVote, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import DashboardHeader from "@/components/dashboard/header"

interface VerificationStep {
  id: string
  label: string
  completed: boolean
}

const mockVerificationSteps: VerificationStep[] = [
  { id: "step-1", label: "Mangroves planted (~10,000 confirmed)", completed: false },
  { id: "step-2", label: "Location correct (Pichavaram region)", completed: false },
  { id: "step-3", label: "Quality adequate (healthy, proper spacing)", completed: false },
  { id: "step-4", label: "CO₂ claim reasonable (520 tons over 10 years)", completed: false },
]

const mockPhotos = [
  { id: "photo-1", url: "/mangrove-planting-1.jpg" },
  { id: "photo-2", url: "/mangrove-planting-2.jpg" },
  { id: "photo-3", url: "/mangrove-planting-3.jpg" },
]

const mockGPSData = [
  { timestamp: "2025-10-15 09:30 AM", latitude: "11.9139", longitude: "79.7574", status: "Verified" },
  { timestamp: "2025-10-15 10:15 AM", latitude: "11.9142", longitude: "79.7580", status: "Verified" },
  { timestamp: "2025-10-15 11:00 AM", latitude: "11.9145", longitude: "79.7585", status: "Verified" },
  { timestamp: "2025-10-15 02:30 PM", latitude: "11.9148", longitude: "79.7590", status: "Verified" },
]

export default function VerificationPage() {
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { submitValidatorVote, isPending: isSubmitting, isSuccess: voteSuccess } = useSubmitValidatorVote()
  
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

  // Filter tasks that need verification (not verified or rejected)
  const pendingTasks = (tasks || []).filter((t) => t.status !== TaskStatus.Verified && t.status !== TaskStatus.Rejected)

  const handleStepToggle = (stepId: string) => {
    setVerificationSteps(
      verificationSteps.map((step: VerificationStep) => (step.id === stepId ? { ...step, completed: !step.completed } : step)),
    )
  }

  const handleSubmit = async () => {
    if (!voteChoice || !selectedTask || !address) {
      setError("Invalid submission")
      return
    }

    try {
      setError(null)
      const approved = voteChoice === "approve"
      submitValidatorVote(selectedTask, approved, justification, BigInt(confidence))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote")
    }
  }

  // Auto-close modal on success
  React.useEffect(() => {
    if (voteSuccess) {
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
  }, [voteSuccess, selectedTask, voteChoice, confidence])

  const currentTask = tasks?.find((t) => t.id === selectedTask)

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Verification Dashboard</h1>
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
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Task #{Number(currentTask.id)}
                  </h2>
                  <p className="text-foreground/60 mb-4">{currentTask.description}</p>
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

                {/* Section 2: Evidence Viewer */}
                <div className="border-b border-border pb-6 space-y-4">
                  <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Evidence Viewer
                  </h3>

                  {/* Photo Gallery */}
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-3">GPS-Tagged Images</p>
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

                  {/* Drone Footage Preview */}
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-3">Drone Footage Preview</p>
                    <div className="w-full h-48 bg-foreground/5 rounded-lg border border-border flex items-center justify-center">
                      <div className="text-center">
                        <Eye className="h-8 w-8 text-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-foreground/60">Drone footage video player</p>
                        <p className="text-xs text-foreground/40 mt-1">Duration: 5:32</p>
                      </div>
                    </div>
                  </div>

                  {/* GPS Coordinates Table */}
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-3">GPS Coordinates & Timestamps</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-foreground/60 font-medium">Timestamp</th>
                            <th className="text-left py-2 px-3 text-foreground/60 font-medium">Latitude</th>
                            <th className="text-left py-2 px-3 text-foreground/60 font-medium">Longitude</th>
                            <th className="text-left py-2 px-3 text-foreground/60 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockGPSData.map((row: { timestamp: string; latitude: string; longitude: string; status: string }, idx: number) => (
                            <tr key={idx} className="border-b border-border/50 hover:bg-foreground/5">
                              <td className="py-2 px-3 text-foreground">{row.timestamp}</td>
                              <td className="py-2 px-3 text-foreground">{row.latitude}</td>
                              <td className="py-2 px-3 text-foreground">{row.longitude}</td>
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Local Authority Attestation */}
                  <div className="flex items-center gap-3 p-4 bg-foreground/5 rounded-lg border border-border">
                    <FileText className="h-5 w-5 text-foreground/60 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Local Authority Attestation</p>
                      <p className="text-sm text-foreground/60">Signed verification document</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent flex-shrink-0">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Section 3: Cross-References */}
                <div className="border-b border-border pb-6 space-y-4">
                  <h3 className="font-semibold text-foreground text-lg">Cross-References</h3>

                  {/* Satellite Imagery Comparison */}
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-3">Satellite Imagery Comparison</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-40 bg-foreground/5 rounded-lg border border-border flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-sm text-foreground/60">Before</p>
                          <p className="text-xs text-foreground/40 mt-1">2024-01-15</p>
                        </div>
                      </div>
                      <div className="h-40 bg-foreground/5 rounded-lg border border-border flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-sm text-foreground/60">After</p>
                          <p className="text-xs text-foreground/40 mt-1">2025-10-15</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weather Summary */}
                  <div className="p-4 bg-foreground/5 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Cloud className="h-5 w-5 text-foreground/60 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium text-foreground">Weather Summary</p>
                        <p className="text-sm text-foreground/60 mt-1">
                          Planting period (Oct 2024 - Mar 2025) had optimal rainfall (1,200mm) and temperature (22-28°C)
                          for mangrove establishment.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Soil & Geography Note */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium text-green-900">Soil & Geography Verification</p>
                        <p className="text-sm text-green-800 mt-1">
                          Soil and geography match mangrove habitat — verified. Salinity levels (15-30 ppt) and tidal
                          range (0.5-1.5m) are ideal for species planted.
                        </p>
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

                {/* Section 5: Decision Form */}
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

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={!voteChoice || isSubmitting}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Sign & Submit Transaction
                        </>
                      )}
                    </Button>
                    <Button onClick={() => setSelectedTask(null)} variant="outline" className="flex-1" disabled={isSubmitting}>
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
