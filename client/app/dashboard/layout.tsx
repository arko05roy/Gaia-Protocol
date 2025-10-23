"use client"

import type React from "react"
import { useState } from "react"
import DashboardSidebar from "@/components/dashboard/sidebar"
import { TaskProvider } from "@/lib/task-context"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <TaskProvider>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed left-0 top-0 h-full z-50 md:hidden transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <DashboardSidebar />
        </div>

        <main className="flex-1 overflow-auto flex flex-col">
          {/* Mobile Menu Button */}
          <div className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {children}
        </main>
      </div>
    </TaskProvider>
  )
}
