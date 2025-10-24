"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  Target,
  DollarSign,
  Leaf,
  Award,
  Activity,
  Globe,
  Zap,
  Download,
  RefreshCw
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts"

// Mock data for charts
const carbonCreditsData = [
  { month: "Jan", credits: 1200, retired: 800 },
  { month: "Feb", credits: 1500, retired: 950 },
  { month: "Mar", credits: 1800, retired: 1200 },
  { month: "Apr", credits: 2100, retired: 1400 },
  { month: "May", credits: 2400, retired: 1600 },
  { month: "Jun", credits: 2800, retired: 1900 }
]

const activeProjectsData = [
  { name: "Forest Restoration", value: 35, color: "#16a34a" },
  { name: "Ocean Cleanup", value: 25, color: "#0ea5e9" },
  { name: "Renewable Energy", value: 20, color: "#f59e0b" },
  { name: "Carbon Capture", value: 15, color: "#8b5cf6" },
  { name: "Other", value: 5, color: "#6b7280" }
]

const modelAccuracyData = [
  { model: "Climate Prediction", accuracy: 94, predictions: 1250 },
  { model: "Carbon Analyzer", accuracy: 89, predictions: 890 },
  { model: "Ocean Monitor", accuracy: 91, predictions: 2100 },
  { model: "Energy Optimizer", accuracy: 87, predictions: 750 },
  { model: "Biodiversity Tracker", accuracy: 93, predictions: 1800 }
]

const topContributors = [
  { name: "Alex Chen", tasks: 24, earnings: "3,250 CUSD", reputation: 4.8 },
  { name: "Maria Rodriguez", tasks: 22, earnings: "2,980 CUSD", reputation: 4.7 },
  { name: "David Kim", tasks: 20, earnings: "2,750 CUSD", reputation: 4.6 },
  { name: "Sarah Johnson", tasks: 18, earnings: "2,500 CUSD", reputation: 4.5 },
  { name: "Ahmed Hassan", tasks: 16, earnings: "2,200 CUSD", reputation: 4.4 }
]

const topModels = [
  { name: "Climate Prediction v2.1", performance: 94, stake: "5,200 CUSD", predictions: 1250 },
  { name: "Ocean Health Monitor", performance: 91, stake: "6,500 CUSD", predictions: 2100 },
  { name: "Biodiversity Tracker", performance: 93, stake: "4,100 CUSD", predictions: 1800 },
  { name: "Carbon Footprint Analyzer", performance: 89, stake: "3,800 CUSD", predictions: 890 },
  { name: "Renewable Energy Optimizer", performance: 87, stake: "2,900 CUSD", predictions: 750 }
]

const ecosystemStats = [
  { label: "Total Carbon Credits", value: "28.5K", change: "+12.5%", trend: "up" },
  { label: "Active Projects", value: "156", change: "+8.2%", trend: "up" },
  { label: "Staked Tokens", value: "45.2K CUSD", change: "+22.1%", trend: "up" },
  { label: "Registered Users", value: "2,847", change: "+15.3%", trend: "up" }
]

export default function Analytics() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive insights into the Gaia Protocol ecosystem</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {ecosystemStats.map((stat, index) => (
              <Card key={index} className="gaia-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-primary">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="text-primary">
                    {index === 0 && <Leaf className="h-8 w-8" />}
                    {index === 1 && <Target className="h-8 w-8" />}
                    {index === 2 && <DollarSign className="h-8 w-8" />}
                    {index === 3 && <Users className="h-8 w-8" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Carbon Credits Growth Chart */}
          <Card className="gaia-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">Carbon Credits Growth</h3>
              <p className="text-sm text-muted-foreground">Monthly carbon credit generation and retirement trends</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={carbonCreditsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="credits" 
                    stackId="1"
                    stroke="#16a34a" 
                    fill="#16a34a" 
                    fillOpacity={0.6}
                    name="Generated"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="retired" 
                    stackId="1"
                    stroke="#0ea5e9" 
                    fill="#0ea5e9" 
                    fillOpacity={0.6}
                    name="Retired"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects Distribution */}
            <Card className="gaia-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Active Projects Distribution</h3>
                <p className="text-sm text-muted-foreground">Breakdown by project type</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeProjectsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {activeProjectsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Model Performance Chart */}
            <Card className="gaia-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Model Performance</h3>
                <p className="text-sm text-muted-foreground">Accuracy and prediction volume by model</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelAccuracyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" angle={-45} textAnchor="end" height={100} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="accuracy" fill="#16a34a" name="Accuracy %" />
                    <Bar yAxisId="right" dataKey="predictions" fill="#0ea5e9" name="Predictions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Contributors */}
            <Card className="gaia-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Top Contributors</h3>
                <p className="text-sm text-muted-foreground">Most active users by tasks completed</p>
              </div>
              <div className="space-y-3">
                {topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{contributor.name}</p>
                        <p className="text-sm text-muted-foreground">{contributor.tasks} tasks • {contributor.earnings}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{contributor.reputation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Models */}
            <Card className="gaia-card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Top Performing Models</h3>
                <p className="text-sm text-muted-foreground">Best performing AI models by accuracy</p>
              </div>
              <div className="space-y-3">
                {topModels.map((model, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{model.name}</p>
                        <p className="text-sm text-muted-foreground">{model.predictions.toLocaleString()} predictions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{model.performance}%</p>
                      <p className="text-xs text-muted-foreground">{model.stake}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="gaia-card">
              <div className="text-center">
                <Globe className="h-12 w-12 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Global Impact</h3>
                <p className="text-3xl font-bold text-primary mb-1">47</p>
                <p className="text-sm text-muted-foreground">Countries Active</p>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Efficiency</h3>
                <p className="text-3xl font-bold text-primary mb-1">94%</p>
                <p className="text-sm text-muted-foreground">Task Completion Rate</p>
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="text-center">
                <Activity className="h-12 w-12 text-primary mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Activity</h3>
                <p className="text-3xl font-bold text-primary mb-1">2.4K</p>
                <p className="text-sm text-muted-foreground">Daily Transactions</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}