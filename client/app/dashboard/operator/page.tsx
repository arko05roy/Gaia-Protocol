"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Upload, 
  AlertCircle,
  Calendar,
  DollarSign,
  Target,
  Users,
  TrendingUp
} from "lucide-react"

// Mock data for tasks
const mockTasks = {
  active: [
    {
      id: "1",
      title: "Mangrove Restoration - Phase 1",
      reward: "150 CUSD",
      deadline: "2024-02-15",
      status: "in_progress",
      description: "Plant 1000 mangrove saplings in designated coastal area",
      progress: 65,
      verificationRequired: true
    },
    {
      id: "2", 
      title: "Carbon Sequestration Monitoring",
      reward: "200 CUSD",
      deadline: "2024-02-20",
      status: "in_progress",
      description: "Monitor and document carbon sequestration rates in forest area",
      progress: 30,
      verificationRequired: true
    }
  ],
  pending: [
    {
      id: "3",
      title: "Soil Quality Assessment",
      reward: "100 CUSD", 
      deadline: "2024-02-25",
      status: "pending_verification",
      description: "Complete soil quality tests and submit results",
      progress: 100,
      verificationRequired: true
    }
  ],
  completed: [
    {
      id: "4",
      title: "Tree Planting Initiative",
      reward: "120 CUSD",
      deadline: "2024-01-30",
      status: "completed",
      description: "Plant 500 trees in urban area",
      progress: 100,
      verificationRequired: false
    }
  ]
}

export default function OperatorDashboard() {
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [proofDescription, setProofDescription] = useState("")
  const [proofFiles, setProofFiles] = useState<File[]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setProofFiles(Array.from(event.target.files))
    }
  }

  const handleSubmitProof = () => {
    // Mock submission - in real app this would call API
    console.log("Submitting proof:", { selectedTask, proofDescription, proofFiles })
    setShowSubmitModal(false)
    setProofDescription("")
    setProofFiles([])
    setSelectedTask(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-blue-100 text-blue-800"
      case "pending_verification": return "bg-yellow-100 text-yellow-800"
      case "completed": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress": return <Clock className="h-4 w-4" />
      case "pending_verification": return <AlertCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="gaia-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
            <Badge className={getStatusColor(task.status)}>
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{task.reward}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{task.deadline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-medium">{task.progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {task.status === "in_progress" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={() => setSelectedTask(task)}
              >
                <Upload className="h-4 w-4" />
                Submit Proof
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Proof for {task.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Proof Description
                  </label>
                  <Textarea
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    placeholder="Describe the work completed and provide evidence..."
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
        )}
        
        {task.status === "pending_verification" && (
          <div className="w-full text-center py-2 text-muted-foreground text-sm">
            Awaiting verification from validators
          </div>
        )}
        
        {task.status === "completed" && (
          <div className="w-full text-center py-2 text-green-600 text-sm font-medium">
            Task completed and verified
          </div>
        )}
      </div>
    </Card>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Operator Dashboard</h1>
              <p className="text-muted-foreground">Manage your assigned tasks and submit proof of work</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Tasks</p>
                  <p className="text-3xl font-bold text-primary">{mockTasks.active.length}</p>
                </div>
                <Target className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Pending Verification</p>
                  <p className="text-3xl font-bold text-primary">{mockTasks.pending.length}</p>
                </div>
                <AlertCircle className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Completed Tasks</p>
                  <p className="text-3xl font-bold text-primary">{mockTasks.completed.length}</p>
                </div>
                <CheckCircle className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-primary">470 CUSD</p>
                </div>
                <TrendingUp className="text-primary" size={32} />
              </div>
            </Card>
          </div>

          {/* Tasks Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending Verification</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {mockTasks.active.length === 0 ? (
                <Card className="gaia-card p-12 text-center">
                  <Target className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground">No active tasks assigned</p>
                </Card>
              ) : (
                mockTasks.active.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              {mockTasks.pending.length === 0 ? (
                <Card className="gaia-card p-12 text-center">
                  <AlertCircle className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground">No tasks pending verification</p>
                </Card>
              ) : (
                mockTasks.pending.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {mockTasks.completed.length === 0 ? (
                <Card className="gaia-card p-12 text-center">
                  <CheckCircle className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground">No completed tasks yet</p>
                </Card>
              ) : (
                mockTasks.completed.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
