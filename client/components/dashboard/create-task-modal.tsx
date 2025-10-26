"use client"

import type React from "react"

import { useState } from "react"
import { useCreateTask } from "@/hooks"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseEther } from "viem"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { createTask, isPending, isSuccess, hash, error: hookError } = useCreateTask()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fundingGoal: "",
    coTarget: "",
    location: "",
    category: "reforestation",
    proofRequirements: "",
    ipfsHash: "",
    deadline: "",
  })

  const [error, setError] = useState<string | null>(null)
  const displayError = error || (hookError ? String(hookError) : null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Validate all required fields
      if (!formData.description.trim()) {
        throw new Error("Description is required")
      }
      if (!formData.location.trim()) {
        throw new Error("Location is required")
      }
      if (!formData.proofRequirements.trim()) {
        throw new Error("Proof requirements are required")
      }
      if (!formData.fundingGoal || Number(formData.fundingGoal) <= 0) {
        throw new Error("Funding goal must be greater than 0")
      }
      if (!formData.coTarget || Number(formData.coTarget) <= 0) {
        throw new Error("CO₂ target must be greater than 0")
      }
      if (!formData.deadline) {
        throw new Error("Deadline is required")
      }

      const deadlineDate = new Date(formData.deadline)
      if (isNaN(deadlineDate.getTime())) {
        throw new Error("Invalid deadline date format")
      }
      if (deadlineDate.getTime() <= Date.now()) {
        throw new Error("Deadline must be in the future")
      }

      const estimatedCost = parseEther(formData.fundingGoal)
      const expectedCO2 = BigInt(Math.floor(Number(formData.coTarget) * 1e18))
      const deadline = BigInt(Math.floor(deadlineDate.getTime() / 1000))

      console.log("Form validation passed. Creating task with:")
      console.log({
        description: formData.description,
        estimatedCost: estimatedCost.toString(),
        expectedCO2: expectedCO2.toString(),
        location: formData.location,
        deadline: deadline.toString(),
        proofRequirements: formData.proofRequirements,
        ipfsHash: formData.ipfsHash,
      })

      await createTask(
        formData.description,
        estimatedCost,
        expectedCO2,
        formData.location,
        deadline,
        formData.proofRequirements,
        formData.ipfsHash
      )
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create task"
      console.error("Form submission error:", errorMsg)
      setError(errorMsg)
    }
  }

  const handleSuccess = () => {
    setFormData({
      title: "",
      description: "",
      fundingGoal: "",
      coTarget: "",
      location: "",
      category: "reforestation",
      proofRequirements: "",
      ipfsHash: "",
      deadline: "",
    })
    setTimeout(() => onClose(), 1500)
  }

  if (isSuccess) {
    setTimeout(handleSuccess, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">Create New Task</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Project Title</label>
              <Input
                type="text"
                name="title"
                placeholder="e.g., Mangrove Restoration in Indonesia"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                name="description"
                placeholder="Describe your project, goals, and impact..."
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="reforestation">Reforestation</option>
                <option value="wetland">Wetland Restoration</option>
                <option value="coral">Coral Reef Protection</option>
                <option value="mangrove">Mangrove Restoration</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold mb-2">Location</label>
              <Input
                type="text"
                name="location"
                placeholder="e.g., Sumatra, Indonesia"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            {/* Funding Goal */}
            <div>
              <label className="block text-sm font-semibold mb-2">Funding Goal (GAIA)</label>
              <Input
                type="number"
                name="fundingGoal"
                placeholder="50000"
                value={formData.fundingGoal}
                onChange={handleChange}
                required
                step="0.01"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">CO₂ Target (tons)</label>
              <Input
                type="number"
                name="coTarget"
                placeholder="5000"
                value={formData.coTarget}
                onChange={handleChange}
                required
                step="0.01"
                className="w-full"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-semibold mb-2">Deadline</label>
              <Input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            {/* Proof Requirements */}
            <div>
              <label className="block text-sm font-semibold mb-2">Proof Requirements</label>
              <textarea
                name="proofRequirements"
                placeholder="Describe what proof is required to verify task completion..."
                value={formData.proofRequirements}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
              />
            </div>

            {/* IPFS Hash */}
            <div>
              <label className="block text-sm font-semibold mb-2">IPFS Hash (optional)</label>
              <Input
                type="text"
                name="ipfsHash"
                placeholder="QmXxxx..."
                value={formData.ipfsHash}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <p className="font-semibold mb-1">Error:</p>
                <p>{displayError}</p>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                Task created successfully! Hash: {hash?.slice(0, 10)}...
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || isSuccess}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPending ? "Creating..." : isSuccess ? "Created!" : "Create Task"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
