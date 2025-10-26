"use client"

import { useState, useEffect } from "react"
import React from "react"
import { useGetTotalTasks, useGetTasks, useCreateSellOrder, useGetMarketStats, useGetBalanceOfBatch, useGetOrdersBySeller, useGetOrders, useCancelOrder, useIsApprovedForAll, useSetApprovalForAll, useCarbonCreditMinterAddress, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Coins, Check, X, Loader, AlertCircle, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { parseEther, formatUnits } from "viem"

interface SellModalData {
  taskId: bigint
  tokenId: bigint
  taskDescription: string
  creditsAvailable: bigint
  pricePerCredit: bigint
}

const CARBON_MARKETPLACE_ADDRESS = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as const;

export default function SellCarbonCreditsPage() {
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { createSellOrder, isPending: isCreatingSellOrder, isSuccess: sellOrderSuccess } = useCreateSellOrder()
  const { totalVolume, isLoading: statsLoading } = useGetMarketStats(1n)
  const creditMinterAddress = useCarbonCreditMinterAddress()
  const { balances, isLoading: balancesLoading } = useGetBalanceOfBatch(address, taskIds.length > 0 ? taskIds : undefined)
  const { orderIds: userOrderIds, isLoading: userOrdersLoading } = useGetOrdersBySeller(address)
  const { orders: userOrders, isLoading: userOrdersDataLoading } = useGetOrders(userOrderIds && userOrderIds.length > 0 ? userOrderIds : undefined)
  const { cancelOrder, isPending: isCancelling, isSuccess: cancelSuccess } = useCancelOrder()
  const { isApproved, refetch: refetchApproval } = useIsApprovedForAll(creditMinterAddress as `0x${string}`, address, CARBON_MARKETPLACE_ADDRESS)
  const { setApprovalForAll, isPending: isApproving, isSuccess: approvalSuccess } = useSetApprovalForAll()
  
  const [showSellModal, setShowSellModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedModal, setSelectedModal] = useState<SellModalData | null>(null)
  const [sellAmount, setSellAmount] = useState("")
  const [pricePerCredit, setPricePerCredit] = useState("25")
  const [error, setError] = useState<string | null>(null)
  const [isCheckingApproval, setIsCheckingApproval] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [showMyOrders, setShowMyOrders] = useState(false)

  // Filter verified tasks and match with balances
  const verifiedTasks = (tasks || []).filter((t) => t.status === TaskStatus.Verified)
  const tasksWithBalances = verifiedTasks.map((task, index) => ({
    ...task,
    balance: balances && balances[index] ? balances[index] : 0n,
  })).filter(t => t.balance > 0n) // Only show tasks with credits
  
  const marketPrice = Number(pricePerCredit) // Market price in cUSD
  const activeUserOrders = (userOrders || []).filter(o => o.isActive)

  const handleOpenSellModal = (
    taskId: bigint,
    tokenId: bigint,
    taskDescription: string,
    creditsAvailable: bigint,
    pricePerCredit: bigint,
  ) => {
    setSelectedModal({ taskId, tokenId, taskDescription, creditsAvailable, pricePerCredit })
    setSellAmount(formatUnits(creditsAvailable, 0))
    setPricePerCredit(formatUnits(pricePerCredit, 18))
    setError(null)
    setShowSellModal(true)
  }

  const handleConfirmSell = async () => {
    if (!selectedModal || !address) {
      setError("Wallet not connected")
      return
    }

    try {
      setError(null)
      setIsCheckingApproval(true)
      
      const amount = BigInt(Math.floor(Number(sellAmount)))
      const price = parseEther(pricePerCredit || "0")

      if (amount <= 0n) {
        setError("Amount must be greater than 0")
        setIsCheckingApproval(false)
        return
      }

      // Check if marketplace is approved
      await refetchApproval()
      const approved = isApproved || false
      
      setIsCheckingApproval(false)

      if (!approved) {
        // Need approval
        setNeedsApproval(true)
        setApprovalForAll(creditMinterAddress as `0x${string}`, CARBON_MARKETPLACE_ADDRESS, true)
      } else {
        // Already approved, create order directly
        createSellOrder(selectedModal.tokenId, amount, price)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sell order")
      setIsCheckingApproval(false)
    }
  }

  const handleCancelOrder = (orderId: bigint) => {
    try {
      setError(null)
      cancelOrder(orderId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel order")
    }
  }

  // Auto-execute sell order after approval
  useEffect(() => {
    if (approvalSuccess && needsApproval && selectedModal) {
      setNeedsApproval(false)
      const amount = BigInt(Math.floor(Number(sellAmount)))
      const price = parseEther(pricePerCredit || "0")
      createSellOrder(selectedModal.tokenId, amount, price)
    }
  }, [approvalSuccess, needsApproval, selectedModal, sellAmount, pricePerCredit])

  // Auto-close modal on success
  React.useEffect(() => {
    if (sellOrderSuccess) {
      setShowSellModal(false)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedModal(null)
        setSellAmount("")
        setPricePerCredit("25")
      }, 3000)
    }
  }, [sellOrderSuccess])

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="h-8 w-8 text-primary" />
            Sell Carbon Credits
          </h1>
          <p className="text-foreground/60 mt-2">Sell your earned carbon credits from verified projects on the marketplace</p>
        </div>

        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-foreground/60">Loading verified projects...</p>
            </div>
          </div>
        ) : tasksWithBalances.length === 0 ? (
          <Card className="p-8 bg-card border border-border text-center">
            <p className="text-foreground/60">
              {verifiedTasks.length === 0 
                ? "No verified projects available yet. Complete and verify projects to earn credits."
                : "You don't have any carbon credits yet. Credits are distributed after task verification."}
            </p>
          </Card>
        ) : (
          <>
            {/* Toggle between My Credits and My Orders */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={!showMyOrders ? "default" : "outline"}
                onClick={() => setShowMyOrders(false)}
              >
                My Credits ({tasksWithBalances.length})
              </Button>
              <Button
                variant={showMyOrders ? "default" : "outline"}
                onClick={() => setShowMyOrders(true)}
              >
                My Active Orders ({activeUserOrders.length})
              </Button>
            </div>

            {!showMyOrders ? (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Task Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Expected CO₂</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasksWithBalances.map((task, index) => {
                    const balance = Number(formatUnits(task.balance, 0))
                    const tokenId = task.id // Token ID is same as task ID

                    return (
                      <motion.tr
                        key={Number(task.id)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border hover:bg-foreground/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-foreground line-clamp-2">{task.description}</td>
                        <td className="px-6 py-4 text-foreground">{task.location}</td>
                        <td className="px-6 py-4 font-semibold text-primary">{balance.toLocaleString()} CO₂</td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">
                            Verified
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() =>
                              handleOpenSellModal(
                                task.id,
                                tokenId,
                                task.description,
                                task.balance,
                                parseEther(marketPrice.toString()),
                              )
                            }
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Create Order
                          </Button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
            ) : (
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-foreground/5 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Order ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Token ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Price/Credit</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total Value</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeUserOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-foreground/60">
                            No active orders. Create a sell order to list your credits.
                          </td>
                        </tr>
                      ) : (
                        activeUserOrders.map((order, index) => {
                          const amount = Number(formatUnits(order.amount, 0))
                          const price = Number(formatUnits(order.pricePerCredit, 18))
                          const totalValue = amount * price
                          return (
                            <motion.tr
                              key={Number(order.orderId)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="border-b border-border hover:bg-foreground/5 transition-colors"
                            >
                              <td className="px-6 py-4 font-medium text-foreground">#{order.orderId.toString()}</td>
                              <td className="px-6 py-4 text-foreground">#{order.tokenId.toString()}</td>
                              <td className="px-6 py-4 font-semibold text-primary">{amount.toLocaleString()} CO₂</td>
                              <td className="px-6 py-4 text-foreground">{price.toFixed(2)} cUSD</td>
                              <td className="px-6 py-4 font-semibold text-primary">{totalValue.toFixed(2)} cUSD</td>
                              <td className="px-6 py-4">
                                <Button
                                  onClick={() => handleCancelOrder(order.orderId)}
                                  size="sm"
                                  variant="destructive"
                                  disabled={isCancelling}
                                >
                                  {isCancelling ? (
                                    <>
                                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Cancel
                                    </>
                                  )}
                                </Button>
                              </td>
                            </motion.tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
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
                  <p className="font-semibold line-clamp-2">{selectedModal.taskDescription}</p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {isCheckingApproval && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-2">
                    <Loader className="h-4 w-4 flex-shrink-0 mt-0.5 animate-spin" />
                    <span>Checking marketplace approval...</span>
                  </div>
                )}

                {isApproving && (
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex gap-2">
                    <Loader className="h-4 w-4 flex-shrink-0 mt-0.5 animate-spin" />
                    <span>Approving marketplace to transfer credits...</span>
                  </div>
                )}

                {approvalSuccess && needsApproval && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>✓ Marketplace approved! Creating order...</span>
                  </div>
                )}

                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">Amount of Credits to Sell (CO₂)</label>
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    max={formatUnits(selectedModal.creditsAvailable, 0)}
                    step="1"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isCreatingSellOrder || isApproving || isCheckingApproval}
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Available: {formatUnits(selectedModal.creditsAvailable, 0)} CO₂
                  </p>
                </div>

                <div>
                  <label className="text-sm text-foreground/60 mb-2 block">Price per credit (GAIA)</label>
                  <input
                    type="number"
                    value={pricePerCredit}
                    onChange={(e) => setPricePerCredit(e.target.value)}
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isCreatingSellOrder || isApproving || isCheckingApproval}
                  />
                  <p className="text-xs text-foreground/60 mt-1">Set your selling price per credit</p>
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-foreground/60 mb-1">Estimated Revenue</p>
                  <p className="text-2xl font-bold text-primary">
                    <span className="text-lg font-bold text-primary min-w-fit">GAIA</span>
                    {(Number.parseFloat(sellAmount || "0") * Number.parseFloat(pricePerCredit || "0")).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSellModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isCreatingSellOrder || isApproving || isCheckingApproval}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSell}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isCreatingSellOrder || isApproving || isCheckingApproval}
                >
                  {isCheckingApproval ? (
                    "Checking..."
                  ) : isApproving ? (
                    "Approving..."
                  ) : isCreatingSellOrder ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    "Create Sell Order"
                  )}
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
