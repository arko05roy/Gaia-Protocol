"use client"

import { useState } from "react"
import Link from "next/link"
import { Download, Plus, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const mockCredits = [
  {
    id: 1,
    projectName: "Mangrove Restoration - Indonesia",
    balance: 2500,
    tokenType: "CHAR",
    dateMinted: "2024-10-15",
    value: 12500,
  },
  {
    id: 2,
    projectName: "Coral Reef Protection - Philippines",
    balance: 1800,
    tokenType: "CHAR",
    dateMinted: "2024-10-10",
    value: 9000,
  },
  {
    id: 3,
    projectName: "Rainforest Conservation - Brazil",
    balance: 5000,
    tokenType: "CHAR",
    dateMinted: "2024-09-28",
    value: 25000,
  },
  {
    id: 4,
    projectName: "Wetland Restoration - Kenya",
    balance: 1500,
    tokenType: "CHAR",
    dateMinted: "2024-09-20",
    value: 7500,
  },
]

export default function BridgePage() {
  const [selectedAction, setSelectedAction] = useState<"bridge" | "retire" | null>(null)
  const [selectedCredit, setSelectedCredit] = useState<(typeof mockCredits)[0] | null>(null)
  const [amount, setAmount] = useState(100)

  const totalBalance = mockCredits.reduce((sum, credit) => sum + credit.balance, 0)
  const totalValue = mockCredits.reduce((sum, credit) => sum + credit.value, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/dashboard" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Carbon Bridge</h1>
          <p className="text-muted-foreground">Manage your tokenized CO₂ credits and bridge them across networks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total CO₂ Balance</div>
            <div className="text-3xl font-bold text-primary mb-1">{totalBalance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">CHAR tokens</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Total Value</div>
            <div className="text-3xl font-bold text-primary mb-1">${totalValue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">USD equivalent</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Active Projects</div>
            <div className="text-3xl font-bold text-primary mb-1">{mockCredits.length}</div>
            <div className="text-xs text-muted-foreground">Verified sources</div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setSelectedAction("bridge")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus size={18} />
            Bridge New Credits
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedAction("retire")}
            className="border-primary text-primary hover:bg-primary/10 gap-2"
          >
            <Flame size={18} />
            Retire Credits
          </Button>
        </div>

        {/* Credits Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Project Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Balance</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Token Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date Minted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Value</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockCredits.map((credit) => (
                  <tr key={credit.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{credit.projectName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{credit.balance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        {credit.tokenType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{credit.dateMinted}</td>
                    <td className="px-6 py-4 text-sm font-semibold">${credit.value.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-primary hover:underline flex items-center gap-1">
                        <Download size={16} />
                        Export
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Bridge/Retire Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedAction === "bridge" ? "Bridge New Credits" : "Retire Credits"}
                </h2>
                <button
                  onClick={() => {
                    setSelectedAction(null)
                    setSelectedCredit(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Select Credit Source */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Select Credit Source</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                    <option>Choose a project...</option>
                    {mockCredits.map((credit) => (
                      <option key={credit.id} value={credit.id}>
                        {credit.projectName} ({credit.balance} available)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Amount (CHAR)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                    className="w-full"
                  />
                </div>

                {selectedAction === "bridge" && (
                  <>
                    {/* Target Network */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Target Network</label>
                      <select className="w-full px-3 py-2 border border-border rounded-lg bg-background">
                        <option>Ethereum Mainnet</option>
                        <option>Polygon</option>
                        <option>Arbitrum</option>
                        <option>Optimism</option>
                      </select>
                    </div>

                    {/* Wallet Address */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Recipient Wallet</label>
                      <Input type="text" placeholder="0x..." className="w-full" />
                    </div>
                  </>
                )}

                {selectedAction === "retire" && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Retirement Reason</label>
                    <textarea
                      placeholder="Explain why you're retiring these credits..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {/* Summary */}
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Amount:</span>
                    <span className="font-semibold">{amount} CHAR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated Value:</span>
                    <span className="font-semibold">${(amount * 5).toLocaleString()}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAction(null)
                      setSelectedCredit(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    {selectedAction === "bridge" ? "Bridge Credits" : "Retire Credits"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
