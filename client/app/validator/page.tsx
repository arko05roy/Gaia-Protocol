"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, CheckCircle2, XCircle, MapPin, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface VerificationTask {
  id: string
  title: string
  description: string
  status: "pending" | "approved" | "rejected"
  requirements: string[]
  ipfsBundle: string
  photos: string[]
}

const mockTasks: VerificationTask[] = [
  {
    id: "1",
    title: "Task #1 – Plant 10,000 Mangroves (Pichavaram Region)",
    description: "Verification of mangrove planting initiative in Pichavaram coastal region",
    status: "pending",
    requirements: [
      "GPS coordinates verified",
      "Drone footage captured",
      "Photo documentation complete",
      "Soil quality assessment",
      "Biodiversity baseline established",
    ],
    ipfsBundle: "QmXxxx...",
    photos: ["/mangrove-planting-1.jpg", "/mangrove-planting-2.jpg", "/mangrove-planting-3.jpg"],
  },
]

export default function ValidatorDashboard() {
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

  const handleApprove = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setSelectedTask(null)
    }, 3000)
  }

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
            <h1 className="text-3xl font-bold mb-2">{selectedTask.title}</h1>
            <p className="text-foreground/70 mb-8">{selectedTask.description}</p>

            {/* Task Requirements */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Task Requirements</h2>
              <ul className="space-y-2">
                {selectedTask.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* IPFS Bundle Download */}
            <div className="mb-8 p-4 bg-secondary/50 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold">IPFS Bundle</p>
                <p className="text-sm text-foreground/70">{selectedTask.ipfsBundle}</p>
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
                {selectedTask.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo || "/placeholder.svg"}
                    alt={`Documentation ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                ))}
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

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleApprove}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button variant="outline" className="flex-1 font-semibold bg-transparent">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
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
          <div className="grid gap-4">
            {mockTasks.map((task) => (
              <Card key={task.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
                    <p className="text-foreground/70 mb-4">{task.description}</p>
                    <div className="flex items-center gap-2 text-sm text-foreground/60">
                      <MapPin className="h-4 w-4" />
                      <span>Pichavaram Region</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedTask(task)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  >
                    Open Verification Interface
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
