import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

const assets = [
  { name: "Green Earth Project", balance: "320", type: "GCP", updated: "2025-10-10" },
  { name: "EcoTree Foundation", balance: "150", type: "GCP", updated: "2025-10-14" },
  { name: "PureAir Initiative", balance: "210", type: "GCP", updated: "2025-10-18" },
]

export default function MyAssets() {
  return (
    <Card className="gaia-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">My Carbon Assets</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button className="gaia-button-primary gap-2" size="sm">
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-semibold text-foreground/70">Project Name</th>
              <th className="text-right py-3 px-2 font-semibold text-foreground/70">Balance (CO₂ Tokens)</th>
              <th className="text-center py-3 px-2 font-semibold text-foreground/70">Token Type</th>
              <th className="text-right py-3 px-2 font-semibold text-foreground/70">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr key={index} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                <td className="py-3 px-2 font-medium">{asset.name}</td>
                <td className="text-right py-3 px-2 text-foreground/70">{asset.balance}</td>
                <td className="text-center py-3 px-2">
                  <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">
                    {asset.type}
                  </span>
                </td>
                <td className="text-right py-3 px-2 text-foreground/70">{asset.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
