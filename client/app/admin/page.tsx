"use client"

import Link from "next/link"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card } from "@/components/ui/card"
import { TrendingUp, Users, CheckCircle } from "lucide-react"

const projectsData = [
  { month: "Jan", active: 12, completed: 3, pending: 5 },
  { month: "Feb", active: 15, completed: 5, pending: 4 },
  { month: "Mar", active: 18, completed: 8, pending: 3 },
  { month: "Apr", active: 22, completed: 12, pending: 2 },
  { month: "May", active: 25, completed: 15, pending: 3 },
  { month: "Jun", active: 28, completed: 18, pending: 4 },
]

const fundingData = [
  { month: "Jan", raised: 50000 },
  { month: "Feb", raised: 75000 },
  { month: "Mar", raised: 120000 },
  { month: "Apr", raised: 180000 },
  { month: "May", raised: 250000 },
  { month: "Jun", raised: 320000 },
]

const verificationData = [
  { name: "Approved", value: 145, color: "#1a4d2e" },
  { name: "Pending", value: 32, color: "#d4f1d4" },
  { name: "Rejected", value: 8, color: "#ef4444" },
]

const mockProjects = [
  {
    id: "PRJ-001",
    name: "Mangrove Restoration - Indonesia",
    creator: "Green Earth Foundation",
    status: "Active",
    funding: 32500,
    goal: 50000,
    validators: 12,
  },
  {
    id: "PRJ-002",
    name: "Coral Reef Protection - Philippines",
    creator: "Ocean Conservation",
    status: "Active",
    funding: 45000,
    goal: 75000,
    validators: 8,
  },
  {
    id: "PRJ-003",
    name: "Rainforest Conservation - Brazil",
    creator: "Amazon Alliance",
    status: "Active",
    funding: 78000,
    goal: 100000,
    validators: 15,
  },
  {
    id: "PRJ-004",
    name: "Wetland Restoration - Kenya",
    creator: "African Wildlife Fund",
    status: "Completed",
    funding: 40000,
    goal: 40000,
    validators: 10,
  },
  {
    id: "PRJ-005",
    name: "Forest Reforestation - Madagascar",
    creator: "Global Green",
    status: "Active",
    funding: 42000,
    goal: 60000,
    validators: 9,
  },
]

export default function AdminPage() {
  const totalFunded = mockProjects.reduce((sum, p) => sum + p.funding, 0)
  const totalGoal = mockProjects.reduce((sum, p) => sum + p.goal, 0)
  const activeProjects = mockProjects.filter((p) => p.status === "Active").length
  const totalValidators = mockProjects.reduce((sum, p) => sum + p.validators, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/dashboard" className="text-primary hover:underline text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Analytics</h1>
          <p className="text-muted-foreground">Overview of all projects, funding activity, and validator decisions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Active Projects</div>
                <div className="text-3xl font-bold text-primary">{activeProjects}</div>
              </div>
              <TrendingUp className="text-primary/30" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Funded</div>
                <div className="text-3xl font-bold text-primary">${(totalFunded / 1000).toFixed(0)}K</div>
              </div>
              <TrendingUp className="text-primary/30" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Validators</div>
                <div className="text-3xl font-bold text-primary">{totalValidators}</div>
              </div>
              <Users className="text-primary/30" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Funding Goal</div>
                <div className="text-3xl font-bold text-primary">${(totalGoal / 1000).toFixed(0)}K</div>
              </div>
              <CheckCircle className="text-primary/30" size={32} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Active Projects Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Legend />
                <Bar dataKey="active" fill="var(--color-primary)" name="Active" />
                <Bar dataKey="completed" fill="var(--color-chart-2)" name="Completed" />
                <Bar dataKey="pending" fill="var(--color-chart-3)" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Funding Raised Chart  */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Total Funds Raised</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fundingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="raised"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Verification Status & Projects Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Verification Pie Chart */}
          <Card className="p-6 lg:col-span-1">
            <h3 className="text-lg font-bold mb-4">Verification Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={verificationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {verificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Projects Table */}
          <Card className="p-6 lg:col-span-2 overflow-hidden">
            <h3 className="text-lg font-bold mb-4">Recent Projects</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 font-semibold">Project ID</th>
                    <th className="text-left py-2 font-semibold">Creator</th>
                    <th className="text-left py-2 font-semibold">Status</th>
                    <th className="text-left py-2 font-semibold">Funding</th>
                  </tr>
                </thead>
                <tbody>
                  {mockProjects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 font-semibold text-primary">{project.id}</td>
                      <td className="py-3">{project.creator}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            project.status === "Active"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">
                        ${project.funding.toLocaleString()} / ${project.goal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Full Projects Table */}
        <Card className="p-6 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">All Projects</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Project ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Project Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Creator</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total Funding</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Validators</th>
                </tr>
              </thead>
              <tbody>
                {mockProjects.map((project) => (
                  <tr key={project.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{project.id}</td>
                    <td className="px-6 py-4 text-sm font-medium">{project.name}</td>
                    <td className="px-6 py-4 text-sm">{project.creator}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          project.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      ${project.funding.toLocaleString()} / ${project.goal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{project.validators}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
