"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Database, Search, Check } from "lucide-react"

interface Dataset {
  id: string
  name: string
  source: string
  type: "Imagery" | "Weather" | "Soil" | "Drone Data"
  price: number
  description: string
}

const mockDatasets: Dataset[] = [
  {
    id: "1",
    name: "Sentinel-2 Satellite Imagery",
    source: "Copernicus",
    type: "Imagery",
    price: 500,
    description: "High-resolution satellite imagery for vegetation monitoring",
  },
  {
    id: "2",
    name: "Weather Patterns Dataset",
    source: "NOAA",
    type: "Weather",
    price: 300,
    description: "Historical and forecast weather data for climate analysis",
  },
  {
    id: "3",
    name: "Soil Composition Analysis",
    source: "Gaia Verified",
    type: "Soil",
    price: 400,
    description: "Detailed soil quality and composition metrics",
  },
  {
    id: "4",
    name: "Drone Footage Archive",
    source: "Gaia Verified",
    type: "Drone Data",
    price: 600,
    description: "4K drone footage of verified environmental projects",
  },
  {
    id: "5",
    name: "Carbon Sequestration Models",
    source: "Copernicus",
    type: "Imagery",
    price: 450,
    description: "AI-powered carbon sequestration prediction models",
  },
  {
    id: "6",
    name: "Biodiversity Index",
    source: "Gaia Verified",
    type: "Soil",
    price: 350,
    description: "Species diversity and ecosystem health indicators",
  },
]

export default function DataMarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [purchasedDatasets, setPurchasedDatasets] = useState<Set<string>>(new Set())

  const filteredDatasets = mockDatasets.filter((dataset) => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !selectedType || dataset.type === selectedType
    return matchesSearch && matchesType
  })

  const handlePurchase = (datasetId: string) => {
    const newPurchased = new Set(purchasedDatasets)
    newPurchased.add(datasetId)
    setPurchasedDatasets(newPurchased)
    setTimeout(() => {
      const updated = new Set(purchasedDatasets)
      updated.delete(datasetId)
      setPurchasedDatasets(updated)
    }, 2000)
  }

  const dataTypes = ["Imagery", "Weather", "Soil", "Drone Data"]

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Data Marketplace
          </h1>
          <p className="text-foreground/60 mt-2">Browse and purchase environmental datasets</p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-foreground/40" />
            <Input
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === "" ? "default" : "outline"}
              onClick={() => setSelectedType("")}
              className="text-sm"
            >
              All Types
            </Button>
            {dataTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                onClick={() => setSelectedType(type)}
                className="text-sm"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Dataset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="p-6 bg-card border border-border hover:border-primary/50 transition-colors flex flex-col"
            >
              <div className="flex-1 space-y-3 mb-4">
                <div>
                  <h3 className="font-bold text-lg">{dataset.name}</h3>
                  <p className="text-xs text-primary font-semibold mt-1">{dataset.source}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                    {dataset.type}
                  </span>
                </div>

                <p className="text-sm text-foreground/70">{dataset.description}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Price</span>
                  <span className="font-bold text-lg">${dataset.price}</span>
                </div>

                <Button
                  onClick={() => handlePurchase(dataset.id)}
                  disabled={purchasedDatasets.has(dataset.id)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {purchasedDatasets.has(dataset.id) ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Purchased
                    </>
                  ) : (
                    "Buy Dataset"
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
