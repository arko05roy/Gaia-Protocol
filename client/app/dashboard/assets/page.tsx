"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { User, Leaf, CheckCircle, Wallet, TrendingUp, Loader } from "lucide-react"
import { useGetTotalTasks, useGetTasks, useGetBalanceOfBatch, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import DashboardHeader from "@/components/dashboard/header"

export default function MyAssetsPage() {
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { balances, isLoading: balancesLoading } = useGetBalanceOfBatch(address || undefined, taskIds.length > 0 ? taskIds : undefined)

  const completedTasks = (tasks || []).filter((t) => t.status === TaskStatus.Verified)

  // Calculate total credits from verified tasks
  const totalCreditsEarned = completedTasks.reduce((sum, task, idx) => {
    const balance = balances?.[idx] ? Number(formatUnits(balances[idx], 18)) : 0
    return sum + balance
  }, 0)

  const userStats = {
    tasksCreated: tasks?.length || 0,
    completionPercentage: tasks && tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    carbonCreditsReceived: Math.round(totalCreditsEarned * 100) / 100,
  }

  const isLoading = tasksLoading || balancesLoading

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
                <h2 className="text-2xl font-bold text-foreground">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected Wallet"}</h2>
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

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-foreground/60">Loading your assets...</p>
                </div>
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="p-6 text-center text-foreground/60">
                <p>No completed projects yet. Create and verify projects to see them here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-foreground/5 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Task ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">CO₂ Credits</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Rewards</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map((task, index) => {
                      const projectCredits = balances?.[index] ? Number(formatUnits(balances[index], 18)) : 0

                      return (
                        <motion.tr
                          key={Number(task.id)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border hover:bg-foreground/5 transition-colors"
                        >
                          <td className="px-6 py-4 text-foreground font-medium">Task #{Number(task.id)}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              100%
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary">{projectCredits.toLocaleString()}</td>
                          <td className="px-6 py-4 text-foreground">-</td>
                          <td className="px-6 py-4 text-foreground/60">On-chain</td>
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
