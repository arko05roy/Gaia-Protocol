"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useGetTotalTasks, useGetTasks, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CreateTaskModal from "@/components/dashboard/create-task-modal"
import { Plus, Loader } from "lucide-react"
import { formatUnits } from "viem"

export default function ProjectsPage() {
  const router = useRouter()
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const [showCreateTask, setShowCreateTask] = useState(false)

  const getStatusBadge = (status: number) => {
    const statusMap: { [key: number]: { label: string; color: string } } = {
      [TaskStatus.Proposed]: { label: "Proposed", color: "bg-blue-100 text-blue-800" },
      [TaskStatus.Funded]: { label: "Funded", color: "bg-purple-100 text-purple-800" },
      [TaskStatus.InProgress]: { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
      [TaskStatus.UnderReview]: { label: "Under Review", color: "bg-orange-100 text-orange-800" },
      [TaskStatus.Verified]: { label: "Verified", color: "bg-green-100 text-green-800" },
      [TaskStatus.Rejected]: { label: "Rejected", color: "bg-red-100 text-red-800" },
    }
    return statusMap[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800" }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-foreground/60">Manage your environmental projects</p>
          </div>
          <Button
            onClick={() => setShowCreateTask(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-foreground/60">Loading projects...</p>
            </div>
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-foreground/60 mb-4">No projects yet. Create your first task!</p>
              <Button
                onClick={() => setShowCreateTask(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Task
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => {
              const statusInfo = getStatusBadge(task.status)
              return (
                <Card 
                  key={Number(task.id)} 
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/task/${Number(task.id)}`)}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold line-clamp-2">{task.description}</h3>
                      <p className="text-sm text-foreground/60 mt-1 line-clamp-2">{task.proofRequirements}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Location:</span>
                        <span className="font-medium">{task.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Estimated Cost:</span>
                        <span className="font-medium">{formatUnits(task.estimatedCost, 18)} cUSD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Expected CO₂:</span>
                        <span className="font-medium">{formatUnits(task.expectedCO2, 0)} tons</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-foreground/60">ID: {Number(task.id)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <CreateTaskModal isOpen={showCreateTask} onClose={() => { setShowCreateTask(false); window.location.reload(); }} />
    </div>
  )
}
