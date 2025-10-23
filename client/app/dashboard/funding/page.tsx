"use client"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { motion } from "framer-motion"
import { Search, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import DashboardHeader from "@/components/dashboard/header"

export default function FundingPage() {
  const { tasks, fundTask } = useTaskContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [fundAmount, setFundAmount] = useState(1000)
  const [showFundModal, setShowFundModal] = useState(false)

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.creator.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleFundProject = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowFundModal(true)
  }

  const handleConfirmFunding = () => {
    if (selectedTaskId) {
      fundTask(selectedTaskId, fundAmount)
      alert(`Successfully funded with $${fundAmount}`)
    }
    setShowFundModal(false)
    setFundAmount(1000)
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fund Projects</h1>
            <p className="text-foreground/60 mt-1">Support environmental projects and earn carbon credits</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-foreground/40" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Projects Grid */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/60">No projects available to fund</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    <img src="/mangrove-planting-1.jpg" alt={task.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                          {task.category}
                        </span>
                        <span className="text-xs text-foreground/60">{task.creator}</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{task.title}</h3>
                      <p className="text-sm text-foreground/60 mt-1">{task.description}</p>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-foreground/60">Progress</span>
                        <span className="font-semibold text-foreground">
                          ${task.fundedAmount.toLocaleString()} / ${task.fundingGoal.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min((task.fundedAmount / task.fundingGoal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Credits */}
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Leaf className="h-4 w-4 text-primary" />
                      <span>{task.coTarget.toLocaleString()} CO₂ credits expected</span>
                    </div>

                    {/* Fund Button */}
                    <Button
                      onClick={() => handleFundProject(task.id)}
                      className="w-full bg-primary hover:bg-primary/90 text-white"
                    >
                      Fund Now
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fund Modal */}
      {showFundModal && selectedTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFundModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground">{selectedTask.title}</h2>
              <p className="text-foreground/60 mt-1">by {selectedTask.creator}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Funding Amount</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(Number(e.target.value))}
                    className="flex-1 h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-lg font-bold text-primary min-w-fit">${fundAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="text-xs text-foreground/60">Expected Credits</p>
                  <p className="font-semibold text-foreground">
                    {Math.round((fundAmount / selectedTask.fundingGoal) * selectedTask.coTarget)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60">Your Impact</p>
                  <p className="font-semibold text-foreground">
                    {Math.round((fundAmount / selectedTask.fundingGoal) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirmFunding} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                Confirm Funding
              </Button>
              <Button onClick={() => setShowFundModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
