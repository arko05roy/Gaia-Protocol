"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const mockProjects = [
  {
    id: 1,
    name: "Mangrove Restoration - Indonesia",
    location: "Sumatra, Indonesia",
    image: "/mangrove-planting-1.jpg",
    description: "Restore 500 hectares of mangrove forests",
    fundingGoal: 50000,
    fundingRaised: 32500,
    co2Credits: 2500,
    status: "Active",
  },
  {
    id: 2,
    name: "Coral Reef Protection - Philippines",
    location: "Palawan, Philippines",
    image: "/mangrove-planting-2.jpg",
    description: "Protect and restore 200 hectares of coral reefs",
    fundingGoal: 75000,
    fundingRaised: 45000,
    co2Credits: 1800,
    status: "Active",
  },
  {
    id: 3,
    name: "Rainforest Conservation - Brazil",
    location: "Amazon, Brazil",
    image: "/mangrove-planting-3.jpg",
    description: "Preserve 1000 hectares of primary rainforest",
    fundingGoal: 100000,
    fundingRaised: 78000,
    co2Credits: 5000,
    status: "Active",
  },
  {
    id: 4,
    name: "Wetland Restoration - Kenya",
    location: "Rift Valley, Kenya",
    image: "/mangrove-planting-1.jpg",
    description: "Restore critical wetland ecosystems",
    fundingGoal: 40000,
    fundingRaised: 28000,
    co2Credits: 1500,
    status: "Active",
  },
  {
    id: 5,
    name: "Forest Reforestation - Madagascar",
    location: "Eastern Madagascar",
    image: "/mangrove-planting-2.jpg",
    description: "Plant 100,000 native trees",
    fundingGoal: 60000,
    fundingRaised: 42000,
    co2Credits: 2200,
    status: "Active",
  },
  {
    id: 6,
    name: "Seagrass Meadow - Australia",
    location: "Great Barrier Reef, Australia",
    image: "/mangrove-planting-3.jpg",
    description: "Restore seagrass meadows for carbon sequestration",
    fundingGoal: 55000,
    fundingRaised: 38000,
    co2Credits: 1900,
    status: "Active",
  },
]

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<(typeof mockProjects)[0] | null>(null)
  const [fundAmount, setFundAmount] = useState(100)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProjects = mockProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const fundingPercentage = selectedProject ? (selectedProject.fundingRaised / selectedProject.fundingGoal) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/dashboard" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Fund Impact Projects</h1>
          <p className="text-muted-foreground">Support real-world environmental projects and earn carbon credits</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Input
          type="search"
          placeholder="Search projects by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <Card
              key={project.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer gaia-card"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setSelectedProject(project)}
            >
              {/* Image */}
              <div className="relative h-48 bg-muted overflow-hidden">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                  {project.status}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <MapPin size={16} />
                  {project.location}
                </div>

                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>${project.fundingRaised.toLocaleString()}</span>
                    <span>${project.fundingGoal.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((project.fundingRaised / project.fundingGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* CO2 Credits */}
                <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-4">
                  <Zap size={16} />
                  {project.co2Credits.toLocaleString()} CO₂ Credits
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProject(project)
                  }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Fund Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Fund Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Fund Project</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">{selectedProject.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{selectedProject.description}</p>

                {/* Funding Progress */}
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span>Funding Progress</span>
                    <span>{fundingPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${fundingPercentage}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>${selectedProject.fundingRaised.toLocaleString()} raised</span>
                    <span>${selectedProject.fundingGoal.toLocaleString()} goal</span>
                  </div>
                </div>
              </div>

              {/* Fund Amount */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Funding Amount (USD)</label>
                <div className="flex gap-2 mb-3">
                  {[50, 100, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setFundAmount(amount)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                        fundAmount === amount
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* CO2 Estimate */}
              <div className="bg-secondary/50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Estimated CO₂ Credits</span>
                  <span className="text-lg font-bold text-primary">
                    {Math.round((fundAmount / selectedProject.fundingGoal) * selectedProject.co2Credits)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedProject(null)} className="flex-1">
                  Cancel
                </Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  Confirm Funding
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
