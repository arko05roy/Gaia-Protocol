"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Database, 
  Search,
  Eye,
  Download,
  Upload,
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from "lucide-react"
import {
  useGetAllPublicEntries,
  useGetDataEntry,
  useGetDatasetStats,
  useGetStatsByProjectType,
  useCreateDataEntry,
  type DataEntry
} from "@/hooks"
import { useAccount } from "wagmi"
import { AnimatePresence, motion } from "framer-motion"
import { parseEther } from "viem"

const categories = ["All", "Mangrove Restoration", "Solar Installation", "Renewable Energy", "Forest Conservation"]

interface ProcessedDataset {
  id: string
  taskId: bigint
  name: string
  category: string
  contributors: number
  accuracy: number
  stake: string
  size: string
  lastUpdated: string
  status: string
  co2Offset: bigint
  cost: bigint
  location: string
  qualityScore: bigint
  contributor: string
  ipfsHash: string
}

export default function DataRegistry() {
  const { address } = useAccount()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDataset, setSelectedDataset] = useState<ProcessedDataset | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    taskId: "",
    ipfsHash: "",
  })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const { createDataEntry, isPending: isCreating, isSuccess: createSuccess } = useCreateDataEntry()

  // Fetch on-chain data
  const { taskIds: publicEntryIds, isLoading: isLoadingEntries } = useGetAllPublicEntries()
  const { totalEntries, totalCO2, totalCost, isLoading: isLoadingStats } = useGetDatasetStats()
  
  // Fetch individual data entries
  const { dataEntry, isLoading: isLoadingDataEntries } = useGetDataEntry(
    publicEntryIds && publicEntryIds.length > 0 ? publicEntryIds[0] : undefined
  )

  // Process on-chain data into displayable datasets
  const processedDatasets = useMemo<ProcessedDataset[]>(() => {
    if (!dataEntry || !dataEntry.taskId) return []
    
    const entry = dataEntry as DataEntry
    return [{
      id: entry.taskId.toString(),
      taskId: entry.taskId,
      name: `${entry.projectType} - ${entry.location}`,
      category: entry.projectType,
      contributors: 1, // Single contributor per entry
      accuracy: Number(entry.qualityScore) / 100,
      stake: `${(Number(entry.co2Offset) * 100).toLocaleString()} cUSD`,
      size: "Dataset",
      lastUpdated: new Date(Number(entry.timestamp) * 1000).toLocaleDateString(),
      status: "verified",
      co2Offset: entry.co2Offset,
      cost: entry.cost,
      location: entry.location,
      qualityScore: entry.qualityScore,
      contributor: entry.contributor,
      ipfsHash: entry.ipfsHash
    }]
  }, [dataEntry])

  const filteredDatasets = useMemo(() => {
    return processedDatasets.filter(dataset => {
      const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dataset.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "All" || dataset.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [processedDatasets, searchTerm, selectedCategory])

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

  const handleViewDetails = (dataset: ProcessedDataset) => {
    setSelectedDataset(dataset)
    setShowDetailsModal(true)
  }

  const handleUploadDataset = () => {
    if (!address) {
      setUploadError("Wallet not connected")
      return
    }

    if (!uploadForm.taskId || !uploadForm.ipfsHash) {
      setUploadError("Please fill in all required fields")
      return
    }

    try {
      setUploadError(null)
      const taskId = BigInt(uploadForm.taskId)
      createDataEntry(taskId, uploadForm.ipfsHash)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload dataset")
    }
  }

  useEffect(() => {
    if (createSuccess) {
      setUploadSuccess(true)
      setShowUploadModal(false)
      setUploadForm({
        taskId: "",
        ipfsHash: "",
      })
      setTimeout(() => setUploadSuccess(false), 3000)
    }
  }, [createSuccess])

  const isLoading = isLoadingEntries || isLoadingStats || isLoadingDataEntries

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
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Dataset
            </Button>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
              >
                <CheckCircle className="text-green-500" size={20} />
                <p className="text-green-700">Dataset uploaded successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Datasets</p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : Number(totalEntries)}
                  </p>
                </div>
                <Database className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total CO₂ Offset</p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : `${Number(totalCO2).toLocaleString()} tons`}
                  </p>
                </div>
                <Shield className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Cost</p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : `${Number(totalCost).toLocaleString()} cUSD`}
                  </p>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Avg Cost/Ton</p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : 
                      Number(totalCO2) > 0 ? `${(Number(totalCost) / Number(totalCO2)).toFixed(2)} cUSD` : "N/A"}
                  </p>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading datasets...</p>
                </div>
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No datasets found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dataset Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>CO₂ Offset</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Location</TableHead>
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
                              ID: {dataset.taskId.toString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{dataset.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{Number(dataset.co2Offset).toLocaleString()} tons</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-primary">
                            {Number(dataset.qualityScore)}%
                          </span>
                        </TableCell>
                        <TableCell>{dataset.location}</TableCell>
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
            )}
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
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-foreground">{selectedDataset.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CO₂ Offset</label>
                  <p className="text-foreground font-medium">{Number(selectedDataset.co2Offset).toLocaleString()} tons</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quality Score</label>
                  <p className="text-foreground font-medium text-primary">
                    {Number(selectedDataset.qualityScore)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cost</label>
                  <p className="text-foreground">{Number(selectedDataset.cost).toLocaleString()} cUSD</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-foreground">{selectedDataset.lastUpdated}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Contributor</label>
                <p className="text-foreground font-mono text-sm break-all">{selectedDataset.contributor}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Task ID</label>
                <p className="text-foreground font-mono text-sm">{selectedDataset.taskId.toString()}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">IPFS Hash</label>
                <p className="text-foreground font-mono text-sm break-all">{selectedDataset.ipfsHash}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Dataset Information</label>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong>Status:</strong> Verified and published on-chain</p>
                    <p><strong>Project Type:</strong> {selectedDataset.category}</p>
                    <p><strong>Environmental Impact:</strong> {Number(selectedDataset.co2Offset).toLocaleString()} tons of CO₂ offset</p>
                    <p><strong>Data Quality:</strong> {Number(selectedDataset.qualityScore)}% confidence score</p>
                    <p><strong>Accessibility:</strong> Public dataset available for research</p>
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
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  onClick={() => {
                    if (selectedDataset.ipfsHash) {
                      window.open(`https://ipfs.io/ipfs/${selectedDataset.ipfsHash}`, '_blank')
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  View on IPFS
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dataset Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Dataset</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Task ID</label>
                  <Input
                    type="number"
                    placeholder="e.g., 1"
                    value={uploadForm.taskId}
                    onChange={(e) => setUploadForm({...uploadForm, taskId: e.target.value})}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">ID of the verified task to update</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">IPFS Hash</label>
                  <Input
                    placeholder="QmXxxx..."
                    value={uploadForm.ipfsHash}
                    onChange={(e) => setUploadForm({...uploadForm, ipfsHash: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">IPFS hash of additional dataset files</p>
                </div>

                {uploadError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowUploadModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadDataset}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
