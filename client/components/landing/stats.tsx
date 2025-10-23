"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

const stats = [
  { label: "Trees Planted", value: 2450000, suffix: "+" },
  { label: "Funds Raised", value: 48500000, prefix: "$", suffix: "+" },
  { label: "Active Contributors", value: 125000, suffix: "+" },
]

function Counter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [target])

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function Stats() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="gaia-card text-center">
              <div className="space-y-2">
                <p className="text-foreground/70 font-medium">{stat.label}</p>
                <p className="text-4xl sm:text-5xl font-bold text-primary">
                  <Counter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
