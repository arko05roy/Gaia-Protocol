"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Leaf,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Zap,
  Coins,
  Database,
  LayoutDashboard,
  User,
  Target,
  Brain,
  PieChart,
  FileText,
  BarChart
} from "lucide-react"
import { Button } from "@/components/ui/button"

const menuItems = [
  { icon: BarChart3, label: "Overview", href: "/dashboard" },
  { icon: TrendingUp, label: "Projects", href: "/dashboard/projects" },
  { icon: TrendingUp, label: "Funding", href: "/dashboard/funding" },
  { icon: Zap, label: "Carbon Stakes", href: "/dashboard/stakes" },
  { icon: CheckCircle, label: "Verification", href: "/dashboard/verification" },
  { icon: Coins, label: "Sell Carbon Credits", href: "/dashboard/sell-credits" },
  { icon: Database, label: "Data Marketplace", href: "/dashboard/marketplace" },
  { icon: Wallet, label: "My Carbon Assets", href: "/dashboard/assets" },
]

const advancedDashboardItems = [
  { icon: User, label: "Operator Dashboard", href: "/dashboard/operator" },
  { icon: Target, label: "Prediction Market", href: "/dashboard/predictions" },
  { icon: Database, label: "Data Registry", href: "/dashboard/data" },
  { icon: Brain, label: "Model Registry", href: "/dashboard/models" },
  { icon: FileText, label: "Task Detail", href: "/dashboard/task/1" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: BarChart, label: "Analytics", href: "/dashboard/analytics" },
]

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [advancedDashboardOpen, setAdvancedDashboardOpen] = useState(false)

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-64"} border-r border-border bg-card transition-all duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <Leaf className="h-6 w-6" />
            <span className="text-sm">Gaia</span>
          </Link>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="ml-auto">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } hover:bg-primary/10 text-foreground/70 hover:text-primary`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {/* Advanced Dashboard Dropdown */}
        {!collapsed && (
          <div className="pt-2">
            <button
              onClick={() => setAdvancedDashboardOpen(!advancedDashboardOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-green-50 hover:text-green-700 w-full"
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">Advanced Dashboard</span>
              {advancedDashboardOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            
            {advancedDashboardOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {advancedDashboardItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-primary/10 text-foreground/70 hover:text-primary pl-8"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  )
}
