"use client"

import { useState } from "react"
import DashboardHeader from "@/components/dashboard/header"
import StatsCards from "@/components/dashboard/stats-cards"
import PoolComposition from "@/components/dashboard/pool-composition"
import FeatureCards from "@/components/dashboard/feature-cards"
import MyAssets from "@/components/dashboard/my-assets"
import CreateTaskModal from "@/components/dashboard/create-task-modal"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const [showCreateTask, setShowCreateTask] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <Button
              onClick={() => setShowCreateTask(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create Task
            </Button>
          </div>

          <StatsCards />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PoolComposition />
            </div>
            <div>
              <FeatureCards />
            </div>
          </div>
          <MyAssets />
        </div>
      </div>

      <CreateTaskModal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} />
    </div>
  )
}
