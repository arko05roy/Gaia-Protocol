"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"

const poolData = [
  { name: "Evergreen Biochar", co2: "573.716", percentage: 56.2 },
  { name: "Concepcion Facility", co2: "129.385", percentage: 12.7 },
  { name: "American BioCarbon CT", co2: "122.77", percentage: 12.0 },
  { name: "Oregon Biochar Solutions", co2: "103.99", percentage: 10.1 },
  { name: "BC BioCarbon", co2: "37.85", percentage: 3.7 },
]

const colors = ["#1a4d2e", "#2d6a4f", "#40916c", "#52b788", "#74c69d"]

export default function PoolComposition() {
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
          {poolData.map((item, index) => (
            <div
              key={index}
              className="transition-all hover:opacity-80"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: colors[index],
              }}
              title={`${item.name}: ${item.percentage}%`}
            />
          ))}
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
            {poolData.map((item, index) => (
              <tr key={index} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                <td className="py-3 px-2 font-medium">{item.name}</td>
                <td className="text-right py-3 px-2 text-foreground/70">{item.co2} TCO2</td>
                <td className="text-right py-3 px-2 text-foreground/70">{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
