"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
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
  Timer
} from "lucide-react"

// Mock data for task details
const mockTask = {
  id: "1",
  title: "Mangrove Restoration - Phase 1",
  description: "Plant 1000 mangrove saplings in designated coastal area to restore critical wetland ecosystem. This project aims to enhance carbon sequestration and protect coastal communities from storm surges.",
  reward: "150 CUSD",
  deadline: "2024-02-15",
  status: "active",
  progress: 65,
  location: "Sundarbans, Bangladesh",
  category: "Restoration",
  operator: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  verifier: "0x8ba1f109551bD432803012645Hac136c",
  fundingProgress: 85,
  totalFunding: "150 CUSD",
  currentFunding: "127.5 CUSD",
  contributors: 12,
  verificationRequired: true,
  proofs: [
    {
      id: "1",
      type: "Photo Evidence",
      description: "Before and after photos of planting area",
      submittedBy: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      submittedAt: "2024-01-20",
      status: "verified"
    },
    {
      id: "2", 
      type: "GPS Coordinates",
      description: "GPS coordinates of planted saplings",
      submittedBy: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      submittedAt: "2024-01-22",
      status: "pending"
    }
  ],
  requirements: [
    "Plant 1000 mangrove saplings",
    "Document GPS coordinates of each sapling",
    "Take before/after photos",
    "Submit weekly progress reports",
    "Ensure 80% survival rate"
  ]
}

export default function TaskDetail() {
  const params = useParams()
  const taskId = params.id
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [proofDescription, setProofDescription] = useState("")
  const [proofFiles, setProofFiles] = useState<File[]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setProofFiles(Array.from(event.target.files))
    }
  }

  const handleSubmitProof = () => {
    // Mock submission - in real app this would call API
    console.log("Submitting proof:", { taskId, proofDescription, proofFiles })
    setShowSubmitModal(false)
    setProofDescription("")
    setProofFiles([])
  }

  const handleAcceptTask = () => {
    // Mock acceptance - in real app this would call API
    console.log("Accepting task:", taskId)
    setShowAcceptModal(false)
  }

  const handleVerifyTask = () => {
    // Mock verification - in real app this would call API
    console.log("Verifying task:", taskId)
    setShowVerifyModal(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "completed": return "bg-blue-100 text-blue-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "verified": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Clock className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "pending": return <AlertCircle className="h-4 w-4" />
      case "verified": return <Shield className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{mockTask.title}</h1>
              <p className="text-muted-foreground">{mockTask.description}</p>
            </div>
            <Badge className={getStatusColor(mockTask.status)}>
              {getStatusIcon(mockTask.status)}
              <span className="ml-1 capitalize">{mockTask.status}</span>
            </Badge>
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <DollarSign className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Reward</p>
                  <p className="text-xl font-bold text-foreground">{mockTask.reward}</p>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="text-xl font-bold text-foreground">{mockTask.deadline}</p>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <MapPin className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-xl font-bold text-foreground">{mockTask.location}</p>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center gap-3">
                <Users className="text-primary" size={24} />
                <div>
                  <p className="text-sm text-muted-foreground">Contributors</p>
                  <p className="text-xl font-bold text-foreground">{mockTask.contributors}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress and Funding */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="gaia-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Task Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="text-foreground font-medium">{mockTask.progress}%</span>
                  </div>
                  <Progress value={mockTask.progress} className="h-2" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>15 days remaining</span>
                </div>
              </div>
            </Card>

            <Card className="gaia-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Funding Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Funding</span>
                    <span className="text-foreground font-medium">{mockTask.fundingProgress}%</span>
                  </div>
                  <Progress value={mockTask.fundingProgress} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current: {mockTask.currentFunding}</span>
                  <span className="text-muted-foreground">Target: {mockTask.totalFunding}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="funding">Funding</TabsTrigger>
              <TabsTrigger value="proofs">Proofs</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Task Requirements</h3>
                <ul className="space-y-2">
                  {mockTask.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-foreground">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Task Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Category</label>
                    <p className="text-foreground font-medium">{mockTask.category}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Operator</label>
                    <p className="text-foreground font-mono text-xs">{mockTask.operator.slice(0, 10)}...</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Verifier</label>
                    <p className="text-foreground font-mono text-xs">{mockTask.verifier.slice(0, 10)}...</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Verification Required</label>
                    <p className="text-foreground font-medium">{mockTask.verificationRequired ? "Yes" : "No"}</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="funding" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Funding Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Funding</span>
                    <span className="text-foreground font-medium">{mockTask.currentFunding}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Target Funding</span>
                    <span className="text-foreground font-medium">{mockTask.totalFunding}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Contributors</span>
                    <span className="text-foreground font-medium">{mockTask.contributors}</span>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="proofs" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">Submitted Proofs</h3>
                <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                      <Upload className="h-4 w-4" />
                      Submit Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Submit Proof</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Proof Description
                        </label>
                        <Textarea
                          value={proofDescription}
                          onChange={(e) => setProofDescription(e.target.value)}
                          placeholder="Describe the proof you're submitting..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Upload Evidence
                        </label>
                        <Input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowSubmitModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitProof}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Submit Proof
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {mockTask.proofs.map((proof) => (
                  <Card key={proof.id} className="gaia-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-foreground">{proof.type}</h4>
                          <Badge className={getStatusColor(proof.status)}>
                            {getStatusIcon(proof.status)}
                            <span className="ml-1 capitalize">{proof.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{proof.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By: {proof.submittedBy.slice(0, 10)}...</span>
                          <span>At: {proof.submittedAt}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="verification" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Verification Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Verification Required</span>
                    <span className="text-foreground font-medium">{mockTask.verificationRequired ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Verifier</span>
                    <span className="text-foreground font-mono text-sm">{mockTask.verifier}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={getStatusColor("pending")}>
                      <AlertCircle className="h-4 w-4" />
                      <span className="ml-1">Pending</span>
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Target className="h-4 w-4" />
                  Accept Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Accept Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-foreground">
                    Are you sure you want to accept this task? You will be responsible for completing it by the deadline.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAcceptModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAcceptTask}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Accept Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
