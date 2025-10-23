"use client"

import { Card } from "@/components/ui/card"
import { Leaf, Lock, Zap, TrendingUp } from "lucide-react"

const features = [
  {
    icon: Leaf,
    title: "Plant trees with transparency",
    description: "Every action is tracked and verified on the blockchain for complete transparency.",
  },
  {
    icon: Lock,
    title: "Fund verified eco-projects",
    description: "Support projects that have been thoroughly vetted and proven to create real impact.",
  },
  {
    icon: Zap,
    title: "Earn carbon credit rewards",
    description: "Get rewarded with carbon credits for your contributions to environmental projects.",
  },
  {
    icon: TrendingUp,
    title: "Track your real-world impact",
    description: "Monitor your contributions and see the tangible difference you're making.",
  },
]

export default function Features() {
  return (
    <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why Choose Gaia Protocol?</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            We're building the future of environmental impact through transparency, verification, and community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="gaia-card p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-foreground/70 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
