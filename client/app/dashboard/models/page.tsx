"use client"

import { useState, useMemo, useEffect } from "react"
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
  BarChart3,
  Loader2
} from "lucide-react"
import {
  useGetActiveModels,
  useGetModel,
  useGetTotalModels,
  useGetModelPerformance,
  useRegisterModel,
  useAddModelStake,
  useApproveToken,
  useGetAllowance,
  useCUSDTokenAddress,
  type Model
} from "@/hooks"
import { useAccount } from "wagmi"

const categories = ["All", "Climate", "Emissions", "Environment", "Energy"]

interface ProcessedModel {
  id: string
  modelId: bigint
  name: string
  architecture: string
  performance: number
  predictions: number
  stake: string
  accuracy: number
  lastUpdated: string
  status: string
  category: string
  owner: string
  description: string
  ipfsHash: string
  reputationScore: bigint
  totalRewardsEarned: bigint
}

export default function ModelRegistry() {
  const { address: userAddress } = useAccount()
  const cusdTokenAddress = useCUSDTokenAddress()
  const MODEL_REGISTRY_ADDRESS = '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e' as const

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedModel, setSelectedModel] = useState<ProcessedModel | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [isApprovalStep, setIsApprovalStep] = useState(false)
  const [pendingAction, setPendingAction] = useState<"register" | "stake" | null>(null)

  // Register model form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    description: "",
    ipfsHash: "",
    architecture: "",
    stakeAmount: ""
  })

  // Stake form state
  const [stakeForm, setStakeForm] = useState({
    amount: ""
  })

  // Fetch on-chain data
  const { modelIds: activeModelIds, isLoading: isLoadingActiveModels } = useGetActiveModels()
  const { totalModels, isLoading: isLoadingTotalModels } = useGetTotalModels()
  
  // Fetch first model details for demo
  const { model: firstModel, isLoading: isLoadingFirstModel } = useGetModel(
    activeModelIds && activeModelIds.length > 0 ? activeModelIds[0] : undefined
  )
  
  // Fetch performance for first model
  const { totalPredictions, correctPredictions, accuracy, reputationScore, isLoading: isLoadingPerformance } = useGetModelPerformance(
    activeModelIds && activeModelIds.length > 0 ? activeModelIds[0] : undefined
  )

  // Transaction hooks
  const { registerModel, isPending: isRegisterPending, isSuccess: isRegisterSuccess } = useRegisterModel()
  const { addStake, isPending: isStakePending, isSuccess: isStakeSuccess } = useAddModelStake()
  
  // Approval hooks
  const { approveToken, isPending: isApprovePending, isSuccess: isApproveSuccess } = useApproveToken()
  const { allowance, refetch: refetchAllowance } = useGetAllowance(
    cusdTokenAddress as `0x${string}`,
    userAddress,
    MODEL_REGISTRY_ADDRESS as `0x${string}`
  )

  // Handle post-approval actions
  useEffect(() => {
    if (isApproveSuccess && pendingAction === "register") {
      // Refetch allowance to confirm approval
      refetchAllowance()
      
      // Execute registration
      const stakeAmount = parseFloat(registerForm.stakeAmount)
      const stakeAmountWei = BigInt(Math.floor(stakeAmount * 1e18))
      
      registerModel(
        registerForm.name,
        registerForm.description,
        registerForm.ipfsHash,
        registerForm.architecture,
        stakeAmountWei
      )
      
      setIsApprovalStep(false)
      setPendingAction(null)
    }
  }, [isApproveSuccess, pendingAction])

  // Handle post-approval staking
  useEffect(() => {
    if (isApproveSuccess && pendingAction === "stake" && selectedModel && stakeForm.amount) {
      // Refetch allowance to confirm approval
      refetchAllowance()
      
      // Execute staking
      const stakeAmount = BigInt(Math.floor(parseFloat(stakeForm.amount) * 1e18))
      addStake(selectedModel.modelId, stakeAmount)
      
      setIsApprovalStep(false)
      setPendingAction(null)
    }
  }, [isApproveSuccess, pendingAction, selectedModel, stakeForm.amount])

  // Process on-chain data into displayable models
  const processedModels = useMemo<ProcessedModel[]>(() => {
    if (!firstModel || !firstModel.id) return []
    
    const model = firstModel as Model
    return [{
      id: model.id.toString(),
      modelId: model.id,
      name: model.name,
      architecture: model.architecture,
      performance: Number(accuracy) / 100,
      predictions: Number(totalPredictions),
      stake: `${(Number(model.stake) / 1e18).toLocaleString()} GAIA`,
      accuracy: Number(accuracy) / 100,
      lastUpdated: new Date(Number(model.registeredAt) * 1000).toLocaleDateString(),
      status: model.isActive ? "active" : "inactive",
      category: model.architecture, // Use architecture as category
      owner: model.owner,
      description: model.description,
      ipfsHash: model.ipfsHash,
      reputationScore: model.reputationScore,
      totalRewardsEarned: model.totalRewardsEarned
    }]
  }, [firstModel, accuracy, totalPredictions])

  const filteredModels = useMemo(() => {
    return processedModels.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.architecture.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "All" || model.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [processedModels, searchTerm, selectedCategory])

  const isLoading = isLoadingActiveModels || isLoadingTotalModels || isLoadingFirstModel || isLoadingPerformance

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

  const handleViewDetails = (model: ProcessedModel) => {
    setSelectedModel(model)
    setShowDetailsModal(true)
  }

  const handleStake = (model: ProcessedModel) => {
    setSelectedModel(model)
    setShowStakeModal(true)
  }

  const handleStakeSubmit = () => {
    if (selectedModel && stakeForm.amount) {
      const stakeAmount = BigInt(Math.floor(parseFloat(stakeForm.amount) * 1e18))
      
      // Check if approval is needed
      if (!allowance || allowance < stakeAmount) {
        // Need approval first
        setIsApprovalStep(true)
        setPendingAction("stake")
        approveToken(
          cusdTokenAddress as `0x${string}`,
          MODEL_REGISTRY_ADDRESS as `0x${string}`,
          stakeAmount
        )
      } else {
        // Approval already granted, proceed with staking
        addStake(selectedModel.modelId, stakeAmount)
        if (isStakeSuccess) {
          setShowStakeModal(false)
          setStakeForm({amount: ""})
          setIsApprovalStep(false)
        }
      }
    }
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
                    <Input 
                      placeholder="Enter model name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <Input 
                      placeholder="Brief description of the model"
                      value={registerForm.description}
                      onChange={(e) => setRegisterForm({...registerForm, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Architecture</label>
                    <Input 
                      placeholder="e.g., Neural Network, Random Forest, LSTM"
                      value={registerForm.architecture}
                      onChange={(e) => setRegisterForm({...registerForm, architecture: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">IPFS Hash</label>
                    <Input 
                      placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={registerForm.ipfsHash}
                      onChange={(e) => setRegisterForm({...registerForm, ipfsHash: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Initial Stake (GAIA)</label>
                    <Input 
                      type="number"
                      placeholder="Minimum 10 GAIA"
                      value={registerForm.stakeAmount}
                      onChange={(e) => setRegisterForm({...registerForm, stakeAmount: e.target.value})}
                      min="10"
                      step="0.01"
                    />
                    {registerForm.stakeAmount && parseFloat(registerForm.stakeAmount) < 10 && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ Minimum stake is 10 GAIA
                      </p>
                    )}
                    {registerForm.stakeAmount && parseFloat(registerForm.stakeAmount) >= 10 && (
                      <p className="text-xs text-green-500 mt-1">
                        ✓ Valid stake amount
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRegisterModal(false)
                        setRegisterForm({name: "", description: "", ipfsHash: "", architecture: "", stakeAmount: ""})
                      }}
                      className="flex-1"
                      disabled={isRegisterPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => {
                        const stakeAmount = parseFloat(registerForm.stakeAmount)
                        const stakeAmountWei = BigInt(Math.floor(stakeAmount * 1e18))
                        
                        // Check if approval is needed
                        if (!allowance || allowance < stakeAmountWei) {
                          // Need approval first
                          setIsApprovalStep(true)
                          setPendingAction("register")
                          approveToken(
                            cusdTokenAddress as `0x${string}`,
                            MODEL_REGISTRY_ADDRESS as `0x${string}`,
                            stakeAmountWei
                          )
                        } else {
                          // Approval already granted, proceed with registration
                          if (registerForm.name && registerForm.architecture && registerForm.ipfsHash && stakeAmount >= 10) {
                            registerModel(
                              registerForm.name,
                              registerForm.description,
                              registerForm.ipfsHash,
                              registerForm.architecture,
                              stakeAmountWei
                            )
                            if (isRegisterSuccess) {
                              setShowRegisterModal(false)
                              setRegisterForm({name: "", description: "", ipfsHash: "", architecture: "", stakeAmount: ""})
                              setIsApprovalStep(false)
                            }
                          }
                        }
                      }}
                      disabled={isRegisterPending || isApprovePending || !registerForm.name || !registerForm.architecture || !registerForm.ipfsHash || parseFloat(registerForm.stakeAmount || "0") < 10}
                    >
                      {isApprovePending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Approving...
                        </>
                      ) : isRegisterPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Registering...
                        </>
                      ) : isApprovalStep ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Approval Pending...
                        </>
                      ) : (
                        "Register Model"
                      )}
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
                  <p className="text-3xl font-bold text-primary">
                    {isLoadingTotalModels ? <Loader2 className="h-8 w-8 animate-spin" /> : Number(totalModels)}
                  </p>
                </div>
                <Brain className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Models</p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoadingActiveModels ? <Loader2 className="h-8 w-8 animate-spin" /> : activeModelIds?.length || 0}
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
                    {isLoadingPerformance ? <Loader2 className="h-8 w-8 animate-spin" /> : Number(totalPredictions).toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Avg Accuracy</p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoadingPerformance ? <Loader2 className="h-8 w-8 animate-spin" /> : `${(Number(accuracy) / 100).toFixed(1)}%`}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading models...</p>
                </div>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No models found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Architecture</TableHead>
                      <TableHead>Accuracy</TableHead>
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
                              ID: {model.modelId.toString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{model.architecture}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-primary">
                            {(model.accuracy * 100).toFixed(1)}%
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
            )}
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
                  <label className="text-sm font-medium text-muted-foreground">Architecture</label>
                  <p className="text-foreground">{selectedModel.architecture}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={getStatusColor(selectedModel.status)}>
                    {getStatusIcon(selectedModel.status)}
                    <span className="ml-1 capitalize">{selectedModel.status}</span>
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accuracy</label>
                  <p className="text-foreground font-medium text-primary">
                    {(selectedModel.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reputation Score</label>
                  <p className="text-foreground font-medium text-primary">
                    {Number(selectedModel.reputationScore)}/100
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
                <label className="text-sm font-medium text-muted-foreground mb-2">Owner</label>
                <p className="text-foreground font-mono text-sm break-all">{selectedModel.owner}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Description</label>
                <p className="text-foreground">
                  {selectedModel.description || "No description provided"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">IPFS Hash</label>
                <p className="text-foreground font-mono text-sm break-all">{selectedModel.ipfsHash}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Performance Metrics</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <span className="text-lg font-bold text-primary min-w-fit">GAIA</span>
                    {(selectedModel.accuracy * 100).toFixed(1)}%
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{Number(selectedModel.reputationScore)}</div>
                    <div className="text-sm text-muted-foreground">Reputation</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{selectedModel.predictions.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Predictions</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2">Total Rewards Earned</label>
                <p className="text-foreground font-medium text-primary">
                  {(Number(selectedModel.totalRewardsEarned) / 1e18).toLocaleString()} GAIA
                </p>
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
                    setShowDetailsModal(false)
                    setShowStakeModal(true)
                  }}
                >
                  <Target className="h-4 w-4" />
                  Stake on Model
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stake Modal */}
      <Dialog open={showStakeModal} onOpenChange={setShowStakeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stake on {selectedModel?.name}</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Model Details</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-foreground">Architecture:</span>
                    <span className="font-medium">{selectedModel.architecture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground">Current Accuracy:</span>
                    <span className="font-medium text-primary">{(selectedModel.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground">Current Stake:</span>
                    <span className="font-medium">{selectedModel.stake}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Stake Amount (cUSD)</label>
                <Input 
                  type="number"
                  placeholder="Enter amount to stake"
                  value={stakeForm.amount}
                  onChange={(e) => setStakeForm({amount: e.target.value})}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You will earn rewards based on model accuracy
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStakeModal(false)
                    setStakeForm({amount: ""})
                  }}
                  className="flex-1"
                  disabled={isStakePending}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleStakeSubmit}
                  disabled={isStakePending || isApprovePending || !stakeForm.amount}
                >
                  {isApprovePending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Approving...
                    </>
                  ) : isStakePending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Staking...
                    </>
                  ) : isApprovalStep ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Approval Pending...
                    </>
                  ) : (
                    "Confirm Stake"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
