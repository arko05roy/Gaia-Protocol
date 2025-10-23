import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const features = [
  { title: "Active Projects", count: 24, color: "bg-blue-100 text-blue-700" },
  { title: "Prediction Markets", count: 8, color: "bg-purple-100 text-purple-700" },
  { title: "Verification", count: 156, color: "bg-green-100 text-green-700" },
  { title: "Carbon Bridge", count: 42, color: "bg-amber-100 text-amber-700" },
]

export default function FeatureCards() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
        <h3 className="font-bold text-lg mb-2">Available now:</h3>
        <p className="text-sm font-semibold mb-4">The World's First Liquid Market for Biochar</p>
        <div className="flex gap-2">
          <Button className="gaia-button-primary text-sm h-9">Buy Credits</Button>
          <Button className="gaia-button-secondary text-sm h-9">Contact us</Button>
        </div>
      </div>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <Card key={index} className="gaia-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">{feature.title}</p>
                <p className="text-2xl font-bold text-primary">{feature.count}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-foreground/40" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
