"use client"

import { useState, useEffect } from "react"
import { useGetAllActiveOrders, useBuyCredits, useGetMarketStats, useGetOrders, useGetOrdersByToken, useCalculateBuyCost, useGetAllowance, useApproveToken, useCUSDTokenAddress } from "@/hooks"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Database, Search, Check, Loader, AlertCircle, ShoppingCart, X } from "lucide-react"
import { formatUnits, parseEther } from "viem"
import { motion, AnimatePresence } from "framer-motion"

interface Order {
  orderId: bigint
  seller: string
  tokenId: bigint
  amount: bigint
  pricePerCredit: bigint
  createdAt: bigint
  isActive: boolean
}

interface BuyModalData {
  order: Order
  buyAmount: string
}

const CARBON_MARKETPLACE_ADDRESS = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as const;

export default function DataMarketplacePage() {
  const { address } = useAccount()
  const { orderIds, isLoading: ordersLoading } = useGetAllActiveOrders()
  const { orders, isLoading: ordersDataLoading } = useGetOrders(orderIds && orderIds.length > 0 ? orderIds : undefined)
  const { buyCredits, isPending: isBuying, isSuccess: buySuccess } = useBuyCredits()
  const { totalVolume, isLoading: statsLoading } = useGetMarketStats(1n)
  const cUSDAddress = useCUSDTokenAddress()
  const { allowance, refetch: refetchAllowance } = useGetAllowance(cUSDAddress as `0x${string}`, address, CARBON_MARKETPLACE_ADDRESS)
  const { approveToken, isPending: isApproving, isSuccess: approvalSuccess } = useApproveToken()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [selectedModal, setSelectedModal] = useState<BuyModalData | null>(null)
  const [buyAmount, setBuyAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)

  // Filter orders by search term and token ID
  const activeOrders = (orders || []).filter((order: Order) => {
    if (!order.isActive) return false
    if (selectedTokenId && order.tokenId !== selectedTokenId) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return order.seller.toLowerCase().includes(search) || 
             order.tokenId.toString().includes(search)
    }
    return true
  })

  // Get unique token IDs for filtering
  const uniqueTokenIds = Array.from(new Set((orders || []).map(o => o.tokenId)))

  const handleOpenBuyModal = (order: Order) => {
    setSelectedModal({ order, buyAmount: formatUnits(order.amount, 0) })
    setBuyAmount(formatUnits(order.amount, 0))
    setError(null)
    setNeedsApproval(false)
    setShowBuyModal(true)
  }

  const handleConfirmBuy = async () => {
    if (!selectedModal || !address) {
      setError("Wallet not connected")
      return
    }

    try {
      setError(null)
      setIsCheckingAllowance(true)
      
      const amount = parseEther(buyAmount || "0")
      if (amount <= 0n) {
        setError("Amount must be greater than 0")
        setIsCheckingAllowance(false)
        return
      }

      // Calculate total cost
      const totalCost = (amount * selectedModal.order.pricePerCredit) / BigInt(10 ** 18)
      
      // Check allowance
      await refetchAllowance()
      const currentAllowance = allowance || 0n

      setIsCheckingAllowance(false)

      if (currentAllowance < totalCost) {
        // Need approval
        setNeedsApproval(true)
        approveToken(cUSDAddress as `0x${string}`, CARBON_MARKETPLACE_ADDRESS, totalCost * 2n) // Approve 2x for future txs
      } else {
        // Already approved, buy directly
        buyCredits(selectedModal.order.orderId, amount)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to buy credits")
      setIsCheckingAllowance(false)
    }
  }

  // Auto-execute buy after approval
  useEffect(() => {
    if (approvalSuccess && needsApproval && selectedModal) {
      setNeedsApproval(false)
      const amount = parseEther(buyAmount || "0")
      buyCredits(selectedModal.order.orderId, amount)
    }
  }, [approvalSuccess, needsApproval, selectedModal, buyAmount])

  // Close modal on success
  useEffect(() => {
    if (buySuccess) {
      setShowBuyModal(false)
      setTimeout(() => {
        setSelectedModal(null)
        setBuyAmount("")
        setError(null)
      }, 1000)
    }
  }, [buySuccess])

  const isLoading = ordersLoading || ordersDataLoading

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Carbon Credit Marketplace
          </h1>
          <p className="text-foreground/60 mt-2">Browse and purchase carbon credits</p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-foreground/40" />
            <Input
              placeholder="Search by seller address or token ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedTokenId === null ? "default" : "outline"}
              onClick={() => setSelectedTokenId(null)}
              className="text-sm"
            >
              All Tokens
            </Button>
            {uniqueTokenIds.slice(0, 5).map((tokenId) => (
              <Button
                key={tokenId.toString()}
                variant={selectedTokenId === tokenId ? "default" : "outline"}
                onClick={() => setSelectedTokenId(tokenId)}
                className="text-sm"
              >
                Token #{tokenId.toString()}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-foreground/60">Loading marketplace orders...</p>
            </div>
          </div>
        ) : activeOrders.length === 0 ? (
          <Card className="p-8 bg-card border border-border text-center">
            <p className="text-foreground/60">No active orders available in the marketplace</p>
          </Card>
        ) : (
          <>
            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-card border border-border">
                <p className="text-sm text-foreground/60">Total Market Volume</p>
                <p className="text-2xl font-bold text-primary">{totalVolume ? formatUnits(totalVolume, 0) : "0"} CO₂</p>
              </Card>
              <Card className="p-4 bg-card border border-border">
                <p className="text-sm text-foreground/60">Active Orders</p>
                <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
              </Card>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders.map((order) => {
                const amount = Number(formatUnits(order.amount, 0))
                const pricePerCredit = Number(formatUnits(order.pricePerCredit, 18))
                const totalPrice = amount * pricePerCredit
                return (
                  <Card
                    key={Number(order.orderId)}
                    className="p-6 bg-card border border-border hover:border-primary/50 transition-colors flex flex-col"
                  >
                    <div className="flex-1 space-y-3 mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Order #{Number(order.orderId)}</h3>
                        <p className="text-xs text-primary font-semibold mt-1">Seller: {order.seller.slice(0, 10)}...</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                          {amount.toLocaleString()} CO₂
                        </span>
                      </div>

                      <p className="text-sm text-foreground/70">Carbon credits available for purchase</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground mb-2">Price per credit (GAIA)</p>
                        <span className="font-bold">{pricePerCredit.toFixed(2)} GAIA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">Total Price</span>
                        <span className="font-bold text-lg text-primary">{totalPrice.toFixed(2)} GAIA</span>
                      </div>

                      <Button
                        onClick={() => handleOpenBuyModal(order)}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Credits
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Buy Modal */}
            <AnimatePresence>
              {showBuyModal && selectedModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowBuyModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Buy Carbon Credits</h2>
                      <button
                        onClick={() => setShowBuyModal(false)}
                        className="text-foreground/60 hover:text-foreground transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-foreground/60 mb-2">Order Details</p>
                        <div className="space-y-1">
                          <p className="text-sm"><span className="font-semibold">Order ID:</span> #{selectedModal.order.orderId.toString()}</p>
                          <p className="text-sm"><span className="font-semibold">Token ID:</span> #{selectedModal.order.tokenId.toString()}</p>
                          <p className="text-sm"><span className="font-semibold">Seller:</span> {selectedModal.order.seller.slice(0, 10)}...{selectedModal.order.seller.slice(-8)}</p>
                          <p className="text-sm"><span className="font-semibold">Available:</span> {formatUnits(selectedModal.order.amount, 0)} CO₂</p>
                          <p className="text-sm"><span className="font-semibold">Price:</span> {formatUnits(selectedModal.order.pricePerCredit, 18)} GAIA/credit</p>
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                      )}

                      {isCheckingAllowance && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-2">
                          <Loader className="h-4 w-4 flex-shrink-0 mt-0.5 animate-spin" />
                          <span>Checking allowance...</span>
                        </div>
                      )}

                      {isApproving && (
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex gap-2">
                          <Loader className="h-4 w-4 flex-shrink-0 mt-0.5 animate-spin" />
                          <span>Approving GAIA spend...</span>
                        </div>
                      )}

                      {approvalSuccess && needsApproval && (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex gap-2">
                          <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>✓ Token approved! Proceeding with purchase...</span>
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-foreground/60 mb-2 block">Amount to Buy (CO₂ credits)</label>
                        <input
                          type="number"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          max={formatUnits(selectedModal.order.amount, 0)}
                          step="1"
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          disabled={isBuying || isApproving || isCheckingAllowance}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Max: {formatUnits(selectedModal.order.amount, 0)} CO₂
                        </p>
                      </div>

                      <div className="bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm text-foreground/60 mb-1">Total Cost</p>
                        <p className="text-2xl font-bold text-primary">
                          {((Number.parseFloat(buyAmount || "0") * Number(formatUnits(selectedModal.order.pricePerCredit, 18)))).toFixed(2)} GAIA
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowBuyModal(false)}
                        variant="outline"
                        className="flex-1"
                        disabled={isBuying || isApproving || isCheckingAllowance}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmBuy}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={isBuying || isApproving || isCheckingAllowance}
                      >
                        {isCheckingAllowance ? (
                          <>Checking...</>
                        ) : isApproving ? (
                          <>Approving...</>
                        ) : isBuying ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Buying...
                          </>
                        ) : (
                          "Confirm Purchase"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
