"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import { useGetAllActiveOrders, useGetOrders } from "@/hooks"
import { formatUnits } from "viem"

const colors = ["#1a4d2e", "#2d6a4f", "#40916c", "#52b788", "#74c69d"]

export default function PoolComposition() {
  const { orderIds, isLoading: idsLoading } = useGetAllActiveOrders()
  const { orders, isLoading: ordersLoading } = useGetOrders(orderIds && orderIds.length > 0 ? orderIds.slice(0, 5) : undefined)

  const calculatePoolData = () => {
    if (!orders || orders.length === 0) {
      return []
    }

    const totalAmount = orders.reduce((sum: bigint, order: any) => sum + order.amount, 0n)
    if (totalAmount === 0n) return []

    return orders.slice(0, 5).map((order: any, index: number) => {
      const percentage = Number((order.amount * 10000n) / totalAmount) / 100
      return {
        name: `Order #${order.orderId}`,
        co2: formatUnits(order.amount, 0),
        percentage: percentage.toFixed(1),
      }
    })
  }

  const poolData = calculatePoolData()
  const isLoading = idsLoading || ordersLoading
  return (
    <Card className="gaia-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Gaia BioCarbon Pool (GCP)</h2>
          <p className="text-sm text-foreground/60">Credits deposited into pool: 1,021 TCO2</p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Composition Bar */}
      <div className="mb-6 space-y-2">
        <p className="text-sm font-medium text-foreground/70">Pool Composition</p>
        <div className="flex h-8 rounded-lg overflow-hidden gap-0.5 bg-muted">
          {isLoading ? (
            <div className="w-full flex items-center justify-center text-xs text-foreground/60">Loading...</div>
          ) : poolData.length === 0 ? (
            <div className="w-full flex items-center justify-center text-xs text-foreground/60">No active orders</div>
          ) : (
            poolData.map((item: any, index: number) => (
            <div
              key={index}
              className="transition-all hover:opacity-80"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: colors[index],
              }}
              title={`${item.name}: ${item.percentage}%`}
            />
            ))
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-semibold text-foreground/70">Project</th>
              <th className="text-right py-3 px-2 font-semibold text-foreground/70">CO₂ Tokens</th>
              <th className="text-right py-3 px-2 font-semibold text-foreground/70">% Share</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-3 px-2 text-center text-foreground/60">Loading pool data...</td>
              </tr>
            ) : poolData.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-3 px-2 text-center text-foreground/60">No active orders available</td>
              </tr>
            ) : (
              poolData.map((item: any, index: number) => (
              <tr key={index} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                <td className="py-3 px-2 font-medium">{item.name}</td>
                <td className="text-right py-3 px-2 text-foreground/70">{item.co2} TCO2</td>
                <td className="text-right py-3 px-2 text-foreground/70">{item.percentage}%</td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
