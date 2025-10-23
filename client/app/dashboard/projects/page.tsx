"use client"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CreateTaskModal from "@/components/dashboard/create-task-modal"
import { Plus } from "lucide-react"

export default function ProjectsPage() {
  const { tasks } = useTaskContext()
  const [showCreateTask, setShowCreateTask] = useState(false)

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
        {tasks.length === 0 ? (
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
            {tasks.map((task) => (
              <Card key={task.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{task.title}</h3>
                    <p className="text-sm text-foreground/60 mt-1">{task.description}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Location:</span>
                      <span className="font-medium">{task.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Funding Goal:</span>
                      <span className="font-medium">${task.fundingGoal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">CO₂ Target:</span>
                      <span className="font-medium">{task.coTarget.toLocaleString()} tons</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          task.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : task.status === "verified"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)} Verification
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} />
    </div>
  )
}
