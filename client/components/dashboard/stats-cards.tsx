"use client"

import { Card } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"
import { useGetTotalTasks, useGetMarketStats, useGetTotalRetired } from "@/hooks"
import { formatUnits } from "viem"

export default function StatsCards() {
  const { totalTasks, isLoading: tasksLoading } = useGetTotalTasks()
  const { totalVolume, totalTrades, activeOrderCount, isLoading: statsLoading } = useGetMarketStats(1n)
  const { totalRetired, isLoading: retiredLoading } = useGetTotalRetired(1n)

  const formatNumber = (value: bigint | undefined) => {
    if (!value) return "0"
    return Number(formatUnits(value, 0)).toLocaleString()
  }

  const stats = [
    {
      label: "Total Tasks",
      value: tasksLoading ? "Loading..." : formatNumber(totalTasks),
      icon: "🌍",
    },
    {
      label: "Active Orders",
      value: statsLoading ? "Loading..." : formatNumber(activeOrderCount),
      icon: "🔒",
    },
    {
      label: "Market Volume",
      value: statsLoading ? "Loading..." : formatNumber(totalVolume),
      icon: "💧",
    },
    {
      label: "Total Carbon Retired",
      value: retiredLoading ? "Loading..." : formatNumber(totalRetired),
      icon: "✓",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="gaia-card">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground/60 font-medium">{stat.label}</p>
              <HelpCircle className="h-4 w-4 text-foreground/40" />
            </div>
            <p className="text-3xl font-bold text-primary">{stat.value}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
