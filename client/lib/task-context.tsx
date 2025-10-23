"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Stakeholder {
  id: string
  name: string
  walletId: string
  stakeAmount: number
  sharePercentage: number
  creditsSold?: number
}

export interface VerificationDetails {
  verifierId?: string
  confidence?: number
  justification?: string
  verifiedAt?: Date
}

export interface Task {
  id: string
  title: string
  description: string
  fundingGoal: number
  coTarget: number
  location: string
  category: string
  status: "pending" | "verified" | "completed"
  creator: string
  fundedAmount: number
  createdAt: Date
  stakeholders?: Stakeholder[]
  verification?: VerificationDetails
  creditsEarned?: number
}

export interface UserData {
  vaultBalance: number
  soldCredits: number
}

interface TaskContextType {
  tasks: Task[]
  userData: UserData
  addTask: (
    task: Omit<
      Task,
      "id" | "status" | "creator" | "fundedAmount" | "createdAt" | "stakeholders" | "verification" | "creditsEarned"
    >,
  ) => void
  updateTaskStatus: (id: string, status: Task["status"]) => void
  fundTask: (id: string, amount: number) => void
  addStakeholder: (taskId: string, stakeholder: Omit<Stakeholder, "id" | "sharePercentage">) => void
  updateVerification: (id: string, verification: VerificationDetails) => void
  sellCredits: (projectId: string, stakeholderId: string, amount: number, revenue: number) => void
  updateVaultBalance: (amount: number) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Plant 10,000 Mangroves",
      description: "Mangrove restoration project in Pichavaram Region",
      fundingGoal: 50000,
      coTarget: 5000,
      location: "Pichavaram Region, India",
      category: "mangrove",
      status: "pending",
      creator: "John Doe",
      fundedAmount: 0,
      createdAt: new Date(),
      stakeholders: [],
      verification: {},
      creditsEarned: 0,
    },
    {
      id: "2",
      title: "Restore 5,000 Native Trees",
      description: "Native forest restoration in Western Ghats",
      fundingGoal: 35000,
      coTarget: 3000,
      location: "Western Ghats, India",
      category: "reforestation",
      status: "pending",
      creator: "Jane Smith",
      fundedAmount: 0,
      createdAt: new Date(),
      stakeholders: [],
      verification: {},
      creditsEarned: 0,
    },
  ])

  const [userData, setUserData] = useState<UserData>({
    vaultBalance: 5000,
    soldCredits: 0,
  })

  const addTask = (
    task: Omit<
      Task,
      "id" | "status" | "creator" | "fundedAmount" | "createdAt" | "stakeholders" | "verification" | "creditsEarned"
    >,
  ) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      status: "pending",
      creator: "Current User",
      fundedAmount: 0,
      createdAt: new Date(),
      stakeholders: [],
      verification: {},
      creditsEarned: 0,
    }
    setTasks([...tasks, newTask])
  }

  const updateTaskStatus = (id: string, status: Task["status"]) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, status } : task)))
  }

  const fundTask = (id: string, amount: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, fundedAmount: task.fundedAmount + amount } : task)))
  }

  const addStakeholder = (taskId: string, stakeholder: Omit<Stakeholder, "id" | "sharePercentage">) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          const sharePercentage = (stakeholder.stakeAmount / task.fundingGoal) * 100
          const newStakeholder: Stakeholder = {
            ...stakeholder,
            id: Date.now().toString(),
            sharePercentage,
          }
          return {
            ...task,
            stakeholders: [...(task.stakeholders || []), newStakeholder],
          }
        }
        return task
      }),
    )
  }

  const updateVerification = (id: string, verification: VerificationDetails) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, verification } : task)))
  }

  const sellCredits = (projectId: string, stakeholderId: string, amount: number, revenue: number) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === projectId) {
          return {
            ...task,
            stakeholders: (task.stakeholders || []).map((stakeholder) =>
              stakeholder.id === stakeholderId
                ? { ...stakeholder, creditsSold: (stakeholder.creditsSold || 0) + amount }
                : stakeholder,
            ),
          }
        }
        return task
      }),
    )
    setUserData((prev) => ({
      ...prev,
      soldCredits: prev.soldCredits + amount,
      vaultBalance: prev.vaultBalance + revenue,
    }))
  }

  const updateVaultBalance = (amount: number) => {
    setUserData((prev) => ({
      ...prev,
      vaultBalance: prev.vaultBalance + amount,
    }))
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        userData,
        addTask,
        updateTaskStatus,
        fundTask,
        addStakeholder,
        updateVerification,
        sellCredits,
        updateVaultBalance,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider")
  }
  return context
}
