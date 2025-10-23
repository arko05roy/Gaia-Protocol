"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, CheckCircle2, XCircle, MapPin, Camera, Loader, AlertCircle } from "lucide-react"
import { useGetTotalTasks, useGetTasks, useSubmitValidatorVote, useGetTaskValidators, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatUnits } from "viem"

interface VerificationTask {
  id: bigint
  description: string
  location: string
  status: TaskStatus
  proofRequirements: string
  ipfsHash: string
}

// Mock tasks - in production these would come from useGetTasks
const mockTasks: VerificationTask[] = []

export default function ValidatorDashboard() {
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { submitValidatorVote, isPending: isSubmitting, isSuccess: voteSuccess } = useSubmitValidatorVote()
  
  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null)
  const [verificationData, setVerificationData] = useState({
    checklist: {
      gpsVerified: false,
      droneFootage: false,
      photoDoc: false,
      soilQuality: false,
      biodiversity: false,
    },
    confidence: 75,
    justification: "",
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter tasks that need verification (not verified or rejected)
  const pendingTasks = (tasks || []).filter((t) => t.status !== TaskStatus.Verified && t.status !== TaskStatus.Rejected)

  const handleApprove = async () => {
    if (!selectedTask || !address) {
      setError("Wallet not connected")
      return
    }

    try {
      setError(null)
      const approved = true // User approved the task
      submitValidatorVote(selectedTask.id, approved, verificationData.justification, BigInt(verificationData.confidence))
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
      const approved = false // User rejected the task
      submitValidatorVote(selectedTask.id, approved, verificationData.justification, BigInt(verificationData.confidence))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote")
    }
  }

  // Auto-close modal on success
  React.useEffect(() => {
    if (voteSuccess) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedTask(null)
      }, 3000)
    }
  }, [voteSuccess])

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Verification Submitted Successfully</h2>
          <p className="text-foreground/70 mb-6">Task approved on-chain. Thank you for your contribution!</p>
          <Button onClick={() => setShowSuccess(false)} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  if (selectedTask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => setSelectedTask(null)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </button>

          <Card className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold mb-2">Task #{Number(selectedTask.id)}</h1>
            <p className="text-foreground/70 mb-8">{selectedTask.description}</p>
            <div className="flex items-center gap-2 text-foreground/60 mb-8">
              <MapPin className="h-4 w-4" />
              <span>{selectedTask.location}</span>
            </div>

            {/* Proof Requirements */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Proof Requirements</h2>
              <p className="text-foreground/80">{selectedTask.proofRequirements}</p>
            </div>

            {/* IPFS Bundle Download */}
            <div className="mb-8 p-4 bg-secondary/50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">IPFS Hash</p>
                <p className="text-sm text-foreground/70">{selectedTask.ipfsHash}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            {/* Photo Gallery */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo Documentation
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="w-full h-48 bg-secondary/30 rounded-lg border border-border flex items-center justify-center">
                  <p className="text-foreground/60">Photos from IPFS</p>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Verification Checklist</h2>
              <div className="space-y-3">
                {Object.entries(verificationData.checklist).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 cursor-pointer p-3 hover:bg-secondary/30 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setVerificationData({
                          ...verificationData,
                          checklist: { ...verificationData.checklist, [key]: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confidence Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="text-lg font-semibold">Confidence Level</label>
                <span className="text-2xl font-bold text-primary">{verificationData.confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={verificationData.confidence}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, confidence: Number.parseInt(e.target.value) })
                }
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Justification */}
            <div className="mb-8">
              <label className="block text-lg font-semibold mb-2">Justification</label>
              <textarea
                value={verificationData.justification}
                onChange={(e) => setVerificationData({ ...verificationData, justification: e.target.value })}
                placeholder="Provide your detailed justification for this verification decision..."
                className="w-full h-32 p-4 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                onClick={handleReject}
                variant="outline"
                className="flex-1 font-semibold bg-transparent"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary hover:text-primary/80 font-semibold mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold">Validator Dashboard</h1>
          <p className="text-foreground/70 mt-2">Review and verify environmental project tasks</p>
        </div>

        {/* Pending Reviews Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Pending Reviews</h2>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-foreground/60">Loading tasks for verification...</p>
              </div>
            </div>
          ) : pendingTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-foreground/60">No tasks pending verification at this time</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingTasks.map((task) => (
                <Card key={Number(task.id)} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Task #{Number(task.id)}</h3>
                      <p className="text-foreground/70 mb-4 line-clamp-2">{task.description}</p>
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <MapPin className="h-4 w-4" />
                        <span>{task.location}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedTask(task as VerificationTask)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    >
                      Open Verification Interface
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
