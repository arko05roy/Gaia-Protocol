"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Eye,
  Shield,
  TrendingUp,
  FileText,
  MapPin,
  Timer,
  Loader2
} from "lucide-react"
import {
  useGetTask,
  useGetFundingProgress,
  useGetFundersWithShares,
  useGetTaskValidators,
  useGetTaskStake,
  useGetVerificationStatus,
  TaskStatus
} from "@/hooks"

export default function TaskDetail() {
  const params = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const taskId = params.id ? BigInt(params.id as string) : undefined
  
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [proofDescription, setProofDescription] = useState("")
  const [proofFiles, setProofFiles] = useState<File[]>([])

  // Fetch task data
  const { task, isLoading: taskLoading } = useGetTask(taskId)
  const { funded, target, percentage, isLoading: fundingLoading } = useGetFundingProgress(taskId)
  const { funders, shares, isLoading: fundersLoading } = useGetFundersWithShares(taskId)
  const { validators, isLoading: validatorsLoading } = useGetTaskValidators(taskId)
  const { stakeInfo, isLoading: stakeLoading } = useGetTaskStake(taskId)
  const { status: verificationStatus, isLoading: verificationLoading } = useGetVerificationStatus(taskId)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setProofFiles(Array.from(event.target.files))
    }
  }

  const handleSubmitProof = () => {
    console.log("Submitting proof:", { taskId, proofDescription, proofFiles })
    setShowSubmitModal(false)
    setProofDescription("")
    setProofFiles([])
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case TaskStatus.Proposed: return "bg-blue-100 text-blue-800"
      case TaskStatus.Funded: return "bg-purple-100 text-purple-800"
      case TaskStatus.InProgress: return "bg-yellow-100 text-yellow-800"
      case TaskStatus.UnderReview: return "bg-orange-100 text-orange-800"
      case TaskStatus.Verified: return "bg-green-100 text-green-800"
      case TaskStatus.Rejected: return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case TaskStatus.Proposed: return "Proposed"
      case TaskStatus.Funded: return "Funded"
      case TaskStatus.InProgress: return "In Progress"
      case TaskStatus.UnderReview: return "Under Review"
      case TaskStatus.Verified: return "Verified"
      case TaskStatus.Rejected: return "Rejected"
      default: return "Unknown"
    }
  }

  const getStatusIcon = (status: number) => {
    switch (status) {
      case TaskStatus.Proposed: return <AlertCircle className="h-4 w-4" />
      case TaskStatus.Funded: return <CheckCircle className="h-4 w-4" />
      case TaskStatus.InProgress: return <Clock className="h-4 w-4" />
      case TaskStatus.UnderReview: return <Shield className="h-4 w-4" />
      case TaskStatus.Verified: return <CheckCircle className="h-4 w-4" />
      case TaskStatus.Rejected: return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Process funder data
  const fundersData = useMemo(() => {
    return funders.map((funder, index) => ({
      address: funder,
      share: shares[index] || 0n
    }))
  }, [funders, shares])

  const isLoading = taskLoading || fundingLoading || fundersLoading || validatorsLoading || stakeLoading || verificationLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground/60">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-foreground/60">Task not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const fundingPercentage = target > 0n ? Number((funded * 100n) / target) : 0
  const deadlineDate = new Date(Number(task.deadline) * 1000).toLocaleDateString()
  const createdDate = new Date(Number(task.createdAt) * 1000).toLocaleDateString()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{task.description}</h1>
              <p className="text-muted-foreground mt-1">Task ID: {Number(task.id)}</p>
            </div>
            <Badge className={getStatusColor(task.status)}>
              {getStatusIcon(task.status)}
              <span className="ml-1">{getStatusLabel(task.status)}</span>
            </Badge>
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <DollarSign className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-2xl font-bold text-foreground">{task?.estimatedCost ? formatUnits(task.estimatedCost, 18) : '0'} GAIA</p>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="text-xl font-bold text-foreground">{deadlineDate}</p>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <MapPin className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-xl font-bold text-foreground">{task.location}</p>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <Users className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Funded</p>
                  <p className="text-lg font-bold text-foreground">{funded ? formatUnits(funded, 18) : '0'} GAIA</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress and Funding */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="gaia-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Expected Impact</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Expected CO₂ Offset</span>
                    <span className="text-foreground font-medium">{formatUnits(task.expectedCO2, 0)} tons</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.actualCO2 > 0n && (
                      <p>Actual: {formatUnits(task.actualCO2, 0)} tons</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Funding Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Funding</span>
                    <span className="text-foreground font-medium">{fundingPercentage}%</span>
                  </div>
                  <Progress value={fundingPercentage} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current: {formatUnits(funded, 18)} cUSD</span>
                  <span className="text-muted-foreground">Target: {formatUnits(target, 18)} cUSD</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="funding">Funding</TabsTrigger>
              <TabsTrigger value="validators">Validators</TabsTrigger>
              <TabsTrigger value="stake">Stake Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Task Details</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Proof Requirements</label>
                    <p className="text-foreground font-medium mt-1">{task.proofRequirements}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-muted-foreground">Created</label>
                      <p className="text-foreground font-medium">{createdDate}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Proposer</label>
                      <p className="text-foreground font-mono text-xs">{task.proposer.slice(0, 10)}...</p>
                    </div>
                  </div>
                  {task.ipfsHash && (
                    <div>
                      <label className="text-muted-foreground">IPFS Hash</label>
                      <p className="text-foreground font-mono text-xs break-all">{task.ipfsHash}</p>
                    </div>
                  )}
                </div>
              </Card>

              {task.proofHash && (
                <Card className="gaia-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Submitted Proof</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Proof Hash</span>
                      <a 
                        href={`https://gateway.pinata.cloud/ipfs/${task.proofHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        View on IPFS
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Actual CO₂ Offset</span>
                      <span className="text-foreground font-medium">{formatUnits(task.actualCO2, 0)} tons</span>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="funding" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Funding Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Funding</span>
                    <span className="text-foreground font-medium">{formatUnits(funded, 18)} cUSD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Target Funding</span>
                    <span className="text-foreground font-medium">{formatUnits(target, 18)} cUSD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Contributors</span>
                    <span className="text-foreground font-medium">{fundersData.length}</span>
                  </div>
                </div>
              </Card>

              {fundersData.length > 0 && (
                <Card className="gaia-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Funders</h3>
                  <div className="space-y-3">
                    {fundersData.map((funder, index) => (
                      <div key={index} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0">
                        <span className="text-foreground font-mono text-xs">{funder.address.slice(0, 10)}...</span>
                        <span className="text-muted-foreground">{formatUnits(funder.share, 18)} cUSD</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="validators" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Verification Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Validators Assigned</span>
                    <span className="text-foreground font-medium">{validators.length}</span>
                  </div>
                  {verificationStatus && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Approval Votes</span>
                        <span className="text-foreground font-medium">{Number(verificationStatus.approveVotes || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Rejection Votes</span>
                        <span className="text-foreground font-medium">{Number(verificationStatus.rejectVotes || 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {validators.length > 0 && (
                <Card className="gaia-card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Assigned Validators</h3>
                  <div className="space-y-3">
                    {validators.map((validator, index) => (
                      <div key={index} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                        <span className="text-foreground font-mono text-xs">{validator.slice(0, 10)}...</span>
                        <Badge variant="outline">Validator</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="stake" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Operator Stake Information</h3>
                {stakeInfo ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Operator</span>
                      <span className="text-foreground font-mono text-xs">{stakeInfo.operator.slice(0, 10)}...</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Staked Amount</span>
                      <span className="text-foreground font-medium">{formatUnits(stakeInfo.amount, 18)} cUSD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Locked At</span>
                      <span className="text-foreground text-sm">
                        {new Date(Number(stakeInfo.lockedAt) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline">
                        {stakeInfo.status === 1 ? "Locked" : stakeInfo.status === 2 ? "Released" : "Slashed"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No stake information available</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
