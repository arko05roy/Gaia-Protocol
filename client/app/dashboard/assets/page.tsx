"use client"

import { motion } from "framer-motion"
import { useTaskContext } from "@/lib/task-context"
import { User, Leaf, CheckCircle, Wallet, TrendingUp } from "lucide-react"
import DashboardHeader from "@/components/dashboard/header"

export default function MyAssetsPage() {
  const { tasks, userData } = useTaskContext()

  const completedTasks = tasks.filter((t) => t.status === "verified" || t.status === "completed")

  const totalCreditsEarned = completedTasks.reduce((sum, task) => {
    const taskCredits = (task.stakeholders || []).reduce((stakeholderSum, stakeholder) => {
      const creditsEarned = (task.coTarget * stakeholder.sharePercentage) / 100
      return stakeholderSum + creditsEarned
    }, 0)
    return sum + taskCredits
  }, 0)

  const remainingCredits = totalCreditsEarned - userData.soldCredits

  const userStats = {
    name: "Aashi Kaur",
    tasksCreated: tasks.length,
    completionPercentage: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    vaultBalance: userData.vaultBalance,
    carbonCreditsReceived: remainingCredits,
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Carbon Assets</h1>
            <p className="text-foreground/60 mt-1">View your profile and carbon credits</p>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-border rounded-lg bg-card p-6 space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{userStats.name}</h2>
                <p className="text-foreground/60">Environmental Impact Contributor</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  <p className="text-sm text-foreground/60">Tasks Created</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{userStats.tasksCreated}</p>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <p className="text-sm text-foreground/60">Completion %</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{userStats.completionPercentage}%</p>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <p className="text-sm text-foreground/60">Vault Balance</p>
                </div>
                <p className="text-2xl font-bold text-foreground">${userStats.vaultBalance.toLocaleString()}</p>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-sm text-foreground/60">CO₂ Credits</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{userStats.carbonCreditsReceived.toLocaleString()}</p>
              </div>
            </div>

            {/* Completion Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-foreground">Overall Progress</p>
                <p className="text-sm text-foreground/60">{userStats.completionPercentage}% Complete</p>
              </div>
              <div className="w-full h-3 bg-foreground/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${userStats.completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </motion.div>

          {/* Completed Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">Completed & Verified Projects</h3>
            </div>

            {completedTasks.length === 0 ? (
              <div className="p-6 text-center text-foreground/60">
                <p>No completed projects yet. Create and verify projects to see them here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-foreground/5 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Project Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Progress</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">CO₂ Credits</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Vault Earned</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map((task, index) => {
                      const projectCredits = (task.stakeholders || []).reduce((sum, stakeholder) => {
                        const creditsEarned = (task.coTarget * stakeholder.sharePercentage) / 100
                        const remaining = creditsEarned - (stakeholder.creditsSold || 0)
                        return sum + remaining
                      }, 0)
                      const vaultEarned = (task.stakeholders || []).reduce((sum, stakeholder) => {
                        return sum + (stakeholder.creditsSold || 0) * 25
                      }, 0)

                      return (
                        <motion.tr
                          key={task.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border hover:bg-foreground/5 transition-colors"
                        >
                          <td className="px-6 py-4 text-foreground font-medium">{task.title}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              100%
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary">{projectCredits.toLocaleString()}</td>
                          <td className="px-6 py-4 text-foreground">${vaultEarned.toLocaleString()}</td>
                          <td className="px-6 py-4 text-foreground/60">{task.createdAt.toLocaleDateString()}</td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
