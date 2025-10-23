"use client"

import { useState } from "react"
import { useTaskContext } from "@/lib/task-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Coins, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SellModalData {
  projectId: string
  stakeholderId: string
  taskTitle: string
  creditsAvailable: number
  revenue: number
}

export default function SellCarbonCreditsPage() {
  const { tasks, userData, sellCredits } = useTaskContext()
  const [showSellModal, setShowSellModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedModal, setSelectedModal] = useState<SellModalData | null>(null)
  const [sellAmount, setSellAmount] = useState("")
  const [destinationWallet, setDestinationWallet] = useState("vault")

  const verifiedTasks = tasks.filter((t) => t.status === "verified")
  const mockMarketPrice = 25 // $ per CO2 credit

  const handleOpenSellModal = (
    projectId: string,
    stakeholderId: string,
    taskTitle: string,
    creditsAvailable: number,
    revenue: number,
  ) => {
    setSelectedModal({ projectId, stakeholderId, taskTitle, creditsAvailable, revenue })
    setSellAmount(creditsAvailable.toFixed(2))
    setDestinationWallet("vault")
    setShowSellModal(true)
  }

  const handleConfirmSell = () => {
    if (!selectedModal) return
    const amount = Number.parseFloat(sellAmount || "0")
    const revenue = amount * mockMarketPrice
    sellCredits(selectedModal.projectId, selectedModal.stakeholderId, amount, revenue)
    setShowSellModal(false)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setSelectedModal(null)
      setSellAmount("")
    }, 3000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            Sell Carbon Credits
          </h1>
          <p className="text-foreground/60 mt-2">Sell your earned carbon credits from verified projects</p>
        </div>

        {verifiedTasks.length === 0 ? (
          <Card className="p-8 bg-card border border-border text-center">
            <p className="text-foreground/60">
              No verified projects available yet. Complete and verify projects to earn credits.
            </p>
          </Card>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Project Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Holder Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Share %</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Credits Available</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Market Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedTasks.flatMap((task) =>
                    (task.stakeholders || []).map((stakeholder, index) => {
                      const creditsEarned = (task.coTarget * stakeholder.sharePercentage) / 100
                      const remainingCredits = creditsEarned - (stakeholder.creditsSold || 0)
                      const creditId = `${task.id}-${stakeholder.id}`

                      return (
                        <motion.tr
                          key={creditId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border hover:bg-foreground/5 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-foreground">{task.title}</td>
                          <td className="px-6 py-4 text-foreground">{stakeholder.name}</td>
                          <td className="px-6 py-4 text-foreground">{stakeholder.sharePercentage.toFixed(2)}%</td>
                          <td className="px-6 py-4 font-semibold text-primary">{remainingCredits.toFixed(2)} CO₂</td>
                          <td className="px-6 py-4 text-foreground">${mockMarketPrice}/credit</td>
                          <td className="px-6 py-4">
                            <Button
                              onClick={() =>
                                handleOpenSellModal(
                                  task.id,
                                  stakeholder.id,
                                  task.title,
                                  remainingCredits,
                                  remainingCredits * mockMarketPrice,
                                )
                              }
                              size="sm"
                              disabled={remainingCredits <= 0}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Sell
                            </Button>
                          </td>
                        </motion.tr>
                      )
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSellModal && selectedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSellModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Sell Carbon Credits</h2>
                <button
                  onClick={() => setShowSellModal(false)}
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground/60 mb-2">Project</p>
                  <p className="font-semibold">{selectedModal.taskTitle}</p>
                </div>

                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">Amount of Credits to Sell</label>
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    max={selectedModal.creditsAvailable}
                    step="0.01"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Available: {selectedModal.creditsAvailable.toFixed(2)} CO₂
                  </p>
                </div>

                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">Destination Wallet/Account</label>
                  <select
                    value={destinationWallet}
                    onChange={(e) => setDestinationWallet(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="vault">Gaia Vault (Default)</option>
                    <option value="metamask">MetaMask Wallet</option>
                    <option value="coinbase">Coinbase Wallet</option>
                    <option value="ledger">Ledger Hardware Wallet</option>
                    <option value="bank">Bank Account</option>
                  </select>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-foreground/60 mb-1">Estimated Revenue</p>
                  <p className="text-2xl font-bold text-primary">
                    ${(Number.parseFloat(sellAmount || "0") * 25).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setShowSellModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSell}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirm Sale
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && selectedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6 text-center"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Credits Sold Successfully</h2>
                <p className="text-foreground/60">
                  {sellAmount} CO₂ credits sold for ${(Number.parseFloat(sellAmount || "0") * 25).toFixed(2)}
                </p>
                <p className="text-sm text-primary font-semibold mt-2">Remaining credits and Vault updated.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
