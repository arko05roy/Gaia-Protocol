"use client"

import { Button } from "@/components/ui/button"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-foreground/60">Welcome back to your Gaia Protocol dashboard</p>
      </div>
      <ConnectButton />
    </header>
  )
}
