"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Brain, 
  Search, 
  Plus,
  Eye,
  Target,
  TrendingUp,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3
} from "lucide-react"

// Mock data for AI models
const mockModels = [
  {
    id: "1",
    name: "Climate Prediction v2.1",
    type: "Neural Network",
    performance: 0.94,
    predictions: 1250,
    stake: "5,200 CUSD",
    accuracy: 0.92,
    lastUpdated: "2024-01-15",
    status: "active",
    category: "Climate"
  },
  {
    id: "2",
    name: "Carbon Footprint Analyzer",
    type: "Random Forest",
    performance: 0.89,
    predictions: 890,
    stake: "3,800 CUSD",
    accuracy: 0.88,
    lastUpdated: "2024-01-12",
    status: "active",
    category: "Emissions"
  },
  {
    id: "3",
    name: "Ocean Health Monitor",
    type: "LSTM",
    performance: 0.91,
    predictions: 2100,
    stake: "6,500 CUSD",
    accuracy: 0.90,
    lastUpdated: "2024-01-14",
    status: "active",
    category: "Environment"
  },
  {
    id: "4",
    name: "Renewable Energy Optimizer",
    type: "Transformer",
    performance: 0.87,
    predictions: 750,
    stake: "2,900 CUSD",
    accuracy: 0.85,
    lastUpdated: "2024-01-10",
    status: "pending",
    category: "Energy"
  },
  {
    id: "5",
    name: "Biodiversity Tracker",
    type: "CNN",
    performance: 0.93,
    predictions: 1800,
    stake: "4,100 CUSD",
    accuracy: 0.91,
    lastUpdated: "2024-01-13",
    status: "active",
    category: "Environment"
  }
]

const categories = ["All", "Climate", "Emissions", "Environment", "Energy"]

export default function ModelRegistry() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedModel, setSelectedModel] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)

  const filteredModels = mockModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || model.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />
      case "pending": return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleViewDetails = (model: any) => {
    setSelectedModel(model)
    setShowDetailsModal(true)
  }

  const handleStake = (model: any) => {
    // Mock staking - in real app this would call API
    console.log("Staking on model:", model)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Model Registry</h1>
              <p className="text-muted-foreground">Register and stake on AI models for environmental predictions</p>
            </div>
            <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Plus className="h-4 w-4" />
                  Register Model
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register New Model</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Model Name</label>
                    <Input placeholder="Enter model name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Model Type</label>
                    <Input placeholder="e.g., Neural Network, Random Forest" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <Input placeholder="e.g., Climate, Environment" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Model File</label>
                    <Input type="file" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRegisterModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                      Register Model
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Models</p>
                  <p className="text-3xl font-bold text-primary">{mockModels.length}</p>
                </div>
                <Brain className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Models</p>
                  <p className="text-3xl font-bold text-primary">
                    {mockModels.filter(m => m.status === "active").length}
                  </p>
                </div>
                <Zap className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Predictions</p>
                  <p className="text-3xl font-bold text-primary">
                    {mockModels.reduce((sum, m) => sum + m.predictions, 0).toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Staked</p>
                  <p className="text-3xl font-bold text-primary">22.5K CUSD</p>
                </div>
                <TrendingUp className="text-primary" size={32} />
              </div>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="gaia-card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-primary text-primary-foreground" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Models Table */}
          <Card className="gaia-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Predictions</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{model.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {model.category} • Updated {model.lastUpdated}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-primary">
                          {Math.round(model.performance * 100)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{model.predictions.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{model.stake}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(model.status)}>
                          {getStatusIcon(model.status)}
                          <span className="ml-1 capitalize">{model.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(model)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStake(model)}
                            className="gap-1"
                          >
                            <Target className="h-4 w-4" />
                            Stake
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      {/* Model Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedModel?.name}</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-foreground">{selectedModel.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-foreground">{selectedModel.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Performance</label>
                  <p className="text-foreground font-medium text-primary">
                    {Math.round(selectedModel.performance * 100)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accuracy</label>
                  <p className="text-foreground font-medium text-primary">
                    {Math.round(selectedModel.accuracy * 100)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Predictions</label>
                  <p className="text-foreground">{selectedModel.predictions.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stake</label>
                  <p className="text-foreground">{selectedModel.stake}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Model Description</label>
                <p className="text-foreground">
                  Advanced AI model trained on environmental data to predict climate patterns and environmental changes.
                  This model has been validated through extensive testing and shows high accuracy in predictions.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Performance Metrics</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{Math.round(selectedModel.performance * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Performance</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{Math.round(selectedModel.accuracy * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{selectedModel.predictions.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Predictions</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Target className="h-4 w-4" />
                  Stake on Model
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
