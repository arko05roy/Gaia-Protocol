"use client"

import type React from "react"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Zap, Plus } from "lucide-react"

export default function CarbonStakesPage() {
  const { tasks, addStakeholder } = useTaskContext()
  const [volunteerName, setVolunteerName] = useState("")
  const [walletId, setWalletId] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [stakeAmount, setStakeAmount] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const activeProjects = tasks.filter((t) => t.status !== "completed")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (volunteerName && walletId && selectedProject && stakeAmount) {
      addStakeholder(selectedProject, {
        name: volunteerName,
        walletId,
        stakeAmount: Number.parseFloat(stakeAmount),
      })
      setVolunteerName("")
      setWalletId("")
      setSelectedProject("")
      setStakeAmount("")
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Carbon Stakes
          </h1>
          <p className="text-foreground/60 mt-2">Stake and volunteer carbon credits into active projects</p>
        </div>

        {/* Staking Form */}
        <Card className="p-6 bg-card border border-border">
          <h2 className="text-xl font-bold mb-4">Volunteer Your Stake</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Volunteer Name</label>
                <Input
                  placeholder="Your name"
                  value={volunteerName}
                  onChange={(e) => setVolunteerName(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Wallet/ID</label>
                <Input
                  placeholder="0x..."
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="">Select a project</option>
                  {activeProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stake Amount ($)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Submit Stake
            </Button>
          </form>

          {submitted && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
              ✓ Stake submitted successfully!
            </div>
          )}
        </Card>

        {/* Stakeholders Table */}
        <Card className="p-6 bg-card border border-border">
          <h2 className="text-xl font-bold mb-4">All Stakeholders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Volunteer Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Project</th>
                  <th className="text-left py-3 px-4 font-semibold">Stake Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Share %</th>
                </tr>
              </thead>
              <tbody>
                {tasks.flatMap((task) =>
                  (task.stakeholders || []).map((stakeholder) => (
                    <tr key={stakeholder.id} className="border-b border-border hover:bg-primary/5">
                      <td className="py-3 px-4">{stakeholder.name}</td>
                      <td className="py-3 px-4">{task.title}</td>
                      <td className="py-3 px-4">${stakeholder.stakeAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {stakeholder.sharePercentage.toFixed(2)}%
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
