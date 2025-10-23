"use client"

import type React from "react"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { addTask } = useTaskContext()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fundingGoal: "",
    coTarget: "",
    location: "",
    category: "reforestation",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    addTask({
      title: formData.title,
      description: formData.description,
      fundingGoal: Number(formData.fundingGoal),
      coTarget: Number(formData.coTarget),
      location: formData.location,
      category: formData.category,
    })

    setIsSubmitting(false)
    onClose()
    setFormData({
      title: "",
      description: "",
      fundingGoal: "",
      coTarget: "",
      location: "",
      category: "reforestation",
    })
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
              <label className="block text-sm font-semibold mb-2">Funding Goal (USD)</label>
              <Input
                type="number"
                name="fundingGoal"
                placeholder="50000"
                value={formData.fundingGoal}
                onChange={handleChange}
                required
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
                className="w-full"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
