"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Database, 
  Search, 
  Filter,
  Eye,
  Download,
  Upload,
  Users,
  Target,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react"

// Mock data for datasets
const mockDatasets = [
  {
    id: "1",
    name: "Global Carbon Emissions 2023",
    category: "Emissions",
    contributors: 15,
    accuracy: 0.94,
    stake: "2,500 CUSD",
    size: "2.3 GB",
    lastUpdated: "2024-01-15",
    status: "verified"
  },
  {
    id: "2",
    name: "Ocean Temperature Anomalies",
    category: "Climate",
    contributors: 8,
    accuracy: 0.89,
    stake: "1,800 CUSD",
    size: "1.7 GB",
    lastUpdated: "2024-01-10",
    status: "pending"
  },
  {
    id: "3",
    name: "Forest Cover Change Analysis",
    category: "Environment",
    contributors: 22,
    accuracy: 0.92,
    stake: "3,200 CUSD",
    size: "4.1 GB",
    lastUpdated: "2024-01-12",
    status: "verified"
  },
  {
    id: "4",
    name: "Renewable Energy Production",
    category: "Energy",
    contributors: 12,
    accuracy: 0.87,
    stake: "1,950 CUSD",
    size: "1.2 GB",
    lastUpdated: "2024-01-08",
    status: "verified"
  },
  {
    id: "5",
    name: "Air Quality Index Global",
    category: "Environment",
    contributors: 18,
    accuracy: 0.91,
    stake: "2,100 CUSD",
    size: "3.5 GB",
    lastUpdated: "2024-01-14",
    status: "pending"
  }
]

const categories = ["All", "Emissions", "Climate", "Environment", "Energy"]

export default function DataRegistry() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDataset, setSelectedDataset] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const filteredDatasets = mockDatasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dataset.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || dataset.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="h-4 w-4" />
      case "pending": return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleViewDetails = (dataset: any) => {
    setSelectedDataset(dataset)
    setShowDetailsModal(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Data Registry</h1>
              <p className="text-muted-foreground">Explore and contribute to environmental datasets</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Upload className="h-4 w-4" />
              Upload Dataset
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Datasets</p>
                  <p className="text-3xl font-bold text-primary">{mockDatasets.length}</p>
                </div>
                <Database className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Verified Datasets</p>
                  <p className="text-3xl font-bold text-primary">
                    {mockDatasets.filter(d => d.status === "verified").length}
                  </p>
                </div>
                <Shield className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Contributors</p>
                  <p className="text-3xl font-bold text-primary">
                    {mockDatasets.reduce((sum, d) => sum + d.contributors, 0)}
                  </p>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Staked</p>
                  <p className="text-3xl font-bold text-primary">11.5K CUSD</p>
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
                    placeholder="Search datasets..."
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

          {/* Datasets Table */}
          <Card className="gaia-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dataset Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contributors</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDatasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{dataset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {dataset.size} • Updated {dataset.lastUpdated}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dataset.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{dataset.contributors}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-primary">
                          {Math.round(dataset.accuracy * 100)}%
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{dataset.stake}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(dataset.status)}>
                          {getStatusIcon(dataset.status)}
                          <span className="ml-1 capitalize">{dataset.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(dataset)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
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

      {/* Dataset Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDataset?.name}</DialogTitle>
          </DialogHeader>
          {selectedDataset && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-foreground">{selectedDataset.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="text-foreground">{selectedDataset.size}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contributors</label>
                  <p className="text-foreground">{selectedDataset.contributors}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accuracy</label>
                  <p className="text-foreground font-medium text-primary">
                    {Math.round(selectedDataset.accuracy * 100)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stake</label>
                  <p className="text-foreground">{selectedDataset.stake}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-foreground">{selectedDataset.lastUpdated}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Description</label>
                <p className="text-foreground">
                  Comprehensive dataset containing detailed environmental measurements and analysis.
                  This dataset has been verified by multiple contributors and meets quality standards.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Data Preview</label>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm text-muted-foreground">
{`Date,Location,Temperature,CO2_Level,Quality_Score
2024-01-01,Location_A,22.5,415.2,0.95
2024-01-01,Location_B,23.1,418.7,0.92
2024-01-01,Location_C,21.8,412.3,0.98
...`}
                  </pre>
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
                  <Download className="h-4 w-4" />
                  Download Dataset
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
