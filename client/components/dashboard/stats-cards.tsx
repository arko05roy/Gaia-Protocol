import { Card } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

const stats = [
  {
    label: "Total carbon bridged",
    value: "21,890,661",
    icon: "🌍",
  },
  {
    label: "Total carbon locked",
    value: "19,905,783",
    icon: "🔒",
  },
  {
    label: "Total liquidity",
    value: "1,810,027",
    icon: "💧",
  },
  {
    label: "Total carbon retired",
    value: "210,338",
    icon: "✓",
  },
]

export default function StatsCards() {
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
