"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  User,
  Edit,
  Settings,
  Award,
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
  Shield,
  Activity,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Users,
  BarChart3
} from "lucide-react"

// Mock user data
const mockUser = {
  address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  name: "Alex Chen",
  role: "Operator",
  reputation: 4.8,
  joinDate: "2023-06-15",
  avatar: "/placeholder-user.jpg",
  stats: {
    tasksCompleted: 24,
    earnings: "3,250 CUSD",
    stakes: "1,800 CUSD",
    reputation: 4.8
  }
}

// Mock activity data
const mockActivity = [
  {
    id: "1",
    type: "task_completed",
    title: "Completed Mangrove Restoration Task",
    description: "Successfully planted 1000 mangrove saplings",
    timestamp: "2024-01-20T10:30:00Z",
    reward: "150 CUSD",
    status: "completed"
  },
  {
    id: "2",
    type: "proof_submitted",
    title: "Submitted Proof for Carbon Monitoring",
    description: "Uploaded GPS coordinates and photos",
    timestamp: "2024-01-18T14:22:00Z",
    reward: null,
    status: "pending"
  },
  {
    id: "3",
    type: "task_accepted",
    title: "Accepted Ocean Cleanup Task",
    description: "Started ocean plastic collection project",
    timestamp: "2024-01-15T09:15:00Z",
    reward: null,
    status: "active"
  },
  {
    id: "4",
    type: "verification_completed",
    title: "Verified Forest Restoration",
    description: "Successfully verified 500 tree plantings",
    timestamp: "2024-01-12T16:45:00Z",
    reward: "75 CUSD",
    status: "completed"
  }
]

// Mock transaction history
const mockTransactions = [
  {
    id: "1",
    type: "reward",
    amount: "150 CUSD",
    description: "Mangrove Restoration Task",
    timestamp: "2024-01-20T10:30:00Z",
    status: "completed"
  },
  {
    id: "2",
    type: "stake",
    amount: "-50 CUSD",
    description: "Staked on Climate Model",
    timestamp: "2024-01-18T14:22:00Z",
    status: "completed"
  },
  {
    id: "3",
    type: "reward",
    amount: "75 CUSD",
    description: "Verification Bonus",
    timestamp: "2024-01-12T16:45:00Z",
    status: "completed"
  },
  {
    id: "4",
    type: "penalty",
    amount: "-25 CUSD",
    description: "Late submission penalty",
    timestamp: "2024-01-10T11:30:00Z",
    status: "completed"
  }
]

export default function Profile() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [name, setName] = useState(mockUser.name)
  const [bio, setBio] = useState("Environmental activist and blockchain enthusiast. Committed to sustainable practices and climate action.")

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_completed": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "proof_submitted": return <FileText className="h-4 w-4 text-blue-500" />
      case "task_accepted": return <Target className="h-4 w-4 text-primary" />
      case "verification_completed": return <Shield className="h-4 w-4 text-purple-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "reward": return <TrendingUp className="h-4 w-4 text-green-500" />
      case "stake": return <Target className="h-4 w-4 text-blue-500" />
      case "penalty": return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <Card className="gaia-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                  <AvatarFallback className="text-lg">
                    {mockUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{mockUser.name}</h1>
                  <p className="text-muted-foreground font-mono text-sm">{mockUser.address}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="gap-1">
                      <User className="h-3 w-3" />
                      {mockUser.role}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{mockUser.reputation}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Joined {new Date(mockUser.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowEditModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => setShowEditModal(false)}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Account Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email Notifications</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Task assignments</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Reward payments</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Market updates</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowSettingsModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => setShowSettingsModal(false)}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Save Settings
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Tasks Completed</p>
                  <p className="text-3xl font-bold text-primary">{mockUser.stats.tasksCompleted}</p>
                </div>
                <CheckCircle className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-primary">{mockUser.stats.earnings}</p>
                </div>
                <DollarSign className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Reputation</p>
                  <p className="text-3xl font-bold text-primary">{mockUser.stats.reputation}</p>
                </div>
                <Award className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Stakes</p>
                  <p className="text-3xl font-bold text-primary">{mockUser.stats.stakes}</p>
                </div>
                <Target className="text-primary" size={32} />
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {mockActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground">{activity.title}</h4>
                          <span className="text-sm text-muted-foreground">{formatDate(activity.timestamp)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        {activity.reward && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">{activity.reward}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Transaction History</h3>
                <div className="space-y-3">
                  {mockTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">GAIA Balance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.type === 'penalty' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.amount}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <Card className="gaia-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Wallet Address</label>
                    <div className="flex items-center gap-2">
                      <Input value={mockUser.address} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm">Copy</Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                    <Badge variant="outline">{mockUser.role}</Badge>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">Reset</Button>
                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
