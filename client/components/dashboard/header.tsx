"use client"

import { useAccount } from "wagmi"
import { useGetCUSDBalance } from "@/hooks"
import { formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Loader, DollarSign } from "lucide-react"

export default function DashboardHeader() {
  const { address } = useAccount()
  const { balance, isLoading } = useGetCUSDBalance(address as `0x${string}` | undefined)

  const formattedBalance = balance ? Number(formatUnits(balance, 18)).toFixed(2) : "0.00"

  return (
    <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-foreground/60">Welcome back to your Gaia Protocol dashboard</p>
      </div>

      {/* cUSD Balance Display */}
      <div className="flex items-center gap-4 mr-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <DollarSign className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-xs text-foreground/60 font-medium">GAIA Balance</span>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="text-lg font-bold text-primary">{formattedBalance}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConnectButton />
    </header>
  )
}
