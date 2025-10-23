"use client"

import Link from "next/link"
import React, { useState } from "react"
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
import { useGetTotalTasks, useGetTasks, useGetAllValidators, useGetMarketStats, useGetDatasetStats, useGetStatsByProjectType, useCreateProposal, useAuthorizeResearcher, useRevokeResearcher, TaskStatus } from "@/hooks"
import { useAccount } from "wagmi"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrendingUp, Users, CheckCircle, Loader, Plus, UserCheck, UserX, FileText, X, AlertCircle } from "lucide-react"
import { formatUnits } from "viem"
import { motion, AnimatePresence } from "framer-motion"

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
  const { address } = useAccount()
  const { totalTasks } = useGetTotalTasks()
  const taskIds = totalTasks ? Array.from({ length: Number(totalTasks) }, (_, i) => BigInt(i + 1)) : []
  const { tasks, isLoading: tasksLoading } = useGetTasks(taskIds.length > 0 ? taskIds : undefined)
  const { validators, isLoading: validatorsLoading } = useGetAllValidators()
  const { totalVolume, isLoading: statsLoading } = useGetMarketStats(1n)
  const { totalEntries, totalCO2, totalCost, avgCostPerTon, isLoading: dataStatsLoading } = useGetDatasetStats()
  const { createProposal, isPending: isCreatingProposal, isSuccess: proposalSuccess } = useCreateProposal()
  const { authorizeResearcher, isPending: isAuthorizing, isSuccess: authorizeSuccess } = useAuthorizeResearcher()
  const { revokeResearcher, isPending: isRevoking, isSuccess: revokeSuccess } = useRevokeResearcher()

  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showValidatorModal, setShowValidatorModal] = useState(false)
  const [proposalDescription, setProposalDescription] = useState("")
  const [targetContract, setTargetContract] = useState("")
  const [callData, setCallData] = useState("")
  const [validatorAddress, setValidatorAddress] = useState("")
  const [validatorAction, setValidatorAction] = useState<"authorize" | "revoke">("authorize")
  const [error, setError] = useState<string | null>(null)
  const [selectedProjectType, setSelectedProjectType] = useState<string>("Reforestation")
  const { entryCount, totalCO2: typeCO2, avgCO2, isLoading: typeStatsLoading } = useGetStatsByProjectType(selectedProjectType)

  // Calculate metrics from real data
  const activeProjects = (tasks || []).filter((t) => t.status === TaskStatus.Funded).length
  const totalFunded = tasks && tasks.length > 0 ? Number(formatUnits(totalVolume || 0n, 18)) : 0
  const totalValidators = validators?.length || 0
  const totalGoal = (tasks || []).reduce((sum, t) => sum + Number(formatUnits(t.estimatedCost, 18)), 0)
  const isLoading = tasksLoading || validatorsLoading || statsLoading

  const handleCreateProposal = () => {
    if (!proposalDescription || !targetContract || !callData) {
      setError("All fields are required")
      return
    }
    try {
      setError(null)
      createProposal(proposalDescription, targetContract as `0x${string}`, callData as `0x${string}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create proposal")
    }
  }

  const handleValidatorAction = () => {
    if (!validatorAddress) {
      setError("Validator address is required")
      return
    }
    try {
      setError(null)
      if (validatorAction === "authorize") {
        authorizeResearcher(validatorAddress as `0x${string}`)
      } else {
        revokeResearcher(validatorAddress as `0x${string}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to manage validator")
    }
  }

  React.useEffect(() => {
    if (proposalSuccess) {
      setShowProposalModal(false)
      setProposalDescription("")
      setTargetContract("")
      setCallData("")
    }
  }, [proposalSuccess])

  React.useEffect(() => {
    if (authorizeSuccess || revokeSuccess) {
      setShowValidatorModal(false)
      setValidatorAddress("")
    }
  }, [authorizeSuccess, revokeSuccess])

  const projectTypes = ["Reforestation", "Mangrove Restoration", "Renewable Energy", "Coral Reef Protection"]

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
                <div className="text-3xl font-bold text-primary">
                  {isLoading ? <Loader className="h-8 w-8 animate-spin" /> : totalValidators}
                </div>
              </div>
              <Users className="text-primary/30" size={32} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total CO₂ Offset</div>
                <div className="text-3xl font-bold text-primary">
                  {dataStatsLoading ? <Loader className="h-8 w-8 animate-spin" /> : `${Number(formatUnits(totalCO2 || 0n, 0)).toLocaleString()} tons`}
                </div>
              </div>
              <CheckCircle className="text-primary/30" size={32} />
            </div>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setShowProposalModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Governance Proposal
          </Button>
          <Button
            onClick={() => setShowValidatorModal(true)}
            variant="outline"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Manage Validators
          </Button>
        </div>

        {/* Data Registry Stats */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Data Registry Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Entries</p>
              <p className="text-2xl font-bold text-primary">
                {dataStatsLoading ? <Loader className="h-6 w-6 animate-spin" /> : Number(totalEntries || 0n)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total CO₂ Recorded</p>
              <p className="text-2xl font-bold text-primary">
                {dataStatsLoading ? <Loader className="h-6 w-6 animate-spin" /> : `${Number(formatUnits(totalCO2 || 0n, 0)).toLocaleString()} tons`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-primary">
                {dataStatsLoading ? <Loader className="h-6 w-6 animate-spin" /> : `$${Number(formatUnits(totalCost || 0n, 18)).toLocaleString()}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Cost/Ton</p>
              <p className="text-2xl font-bold text-primary">
                {dataStatsLoading ? <Loader className="h-6 w-6 animate-spin" /> : `$${Number(formatUnits(avgCostPerTon || 0n, 18)).toFixed(2)}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Project Type Stats */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Project Type Breakdown</h3>
          <div className="flex gap-2 mb-4">
            {projectTypes.map((type) => (
              <Button
                key={type}
                variant={selectedProjectType === type ? "default" : "outline"}
                onClick={() => setSelectedProjectType(type)}
                size="sm"
              >
                {type}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Entry Count</p>
              <p className="text-2xl font-bold text-primary">
                {typeStatsLoading ? <Loader className="h-6 w-6 animate-spin" /> : Number(entryCount || 0n)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total CO₂</p>
              <p className="text-2xl font-bold text-primary">
                {typeStatsLoading ? <Loader className="h-6 w-6 animate-spin" /> : `${Number(formatUnits(typeCO2 || 0n, 0)).toLocaleString()} tons`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average CO₂</p>
              <p className="text-2xl font-bold text-primary">
                {typeStatsLoading ? <Loader className="h-6 w-6 animate-spin" /> : `${Number(formatUnits(avgCO2 || 0n, 0)).toLocaleString()} tons`}
              </p>
            </div>
          </div>
        </Card>

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
            <h3 className="text-lg font-bold mb-4">Recent Tasks</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-2 font-semibold">Task ID</th>
                      <th className="text-left py-2 font-semibold">Description</th>
                      <th className="text-left py-2 font-semibold">Status</th>
                      <th className="text-left py-2 font-semibold">Funding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tasks || []).slice(0, 5).map((task) => (
                      <tr key={Number(task.id)} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 font-semibold text-primary">#{Number(task.id)}</td>
                        <td className="py-3 line-clamp-1">{task.description}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              task.status === TaskStatus.Funded
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {task.status === TaskStatus.Proposed ? "Proposed" : task.status === TaskStatus.Funded ? "Funded" : "Active"}
                          </span>
                        </td>
                        <td className="py-3 font-semibold">${Number(formatUnits(task.estimatedCost, 18)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Full Tasks Table */}
        <Card className="p-6 overflow-hidden">
          <h3 className="text-lg font-bold mb-4">All Tasks</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Task ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Estimated Cost</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Expected CO₂</th>
                  </tr>
                </thead>
                <tbody>
                  {(tasks || []).map((task) => (
                    <tr key={Number(task.id)} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-primary">#{Number(task.id)}</td>
                      <td className="px-6 py-4 text-sm font-medium line-clamp-2">{task.description}</td>
                      <td className="px-6 py-4 text-sm">{task.location}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.status === TaskStatus.Funded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.status === TaskStatus.Proposed ? "Proposed" : task.status === TaskStatus.Funded ? "Funded" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">${Number(formatUnits(task.estimatedCost, 18)).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-primary">{Number(formatUnits(task.expectedCO2, 0)).toLocaleString()} tons</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Proposal Modal */}
      <AnimatePresence>
        {showProposalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProposalModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Create Governance Proposal</h2>
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    placeholder="Describe the proposal..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    rows={4}
                    disabled={isCreatingProposal}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Contract Address</label>
                  <Input
                    type="text"
                    value={targetContract}
                    onChange={(e) => setTargetContract(e.target.value)}
                    placeholder="0x..."
                    disabled={isCreatingProposal}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Call Data (Hex)</label>
                  <Input
                    type="text"
                    value={callData}
                    onChange={(e) => setCallData(e.target.value)}
                    placeholder="0x..."
                    disabled={isCreatingProposal}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Encoded function call data for the proposal
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowProposalModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isCreatingProposal}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProposal}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isCreatingProposal}
                >
                  {isCreatingProposal ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Proposal
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validator Management Modal */}
      <AnimatePresence>
        {showValidatorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowValidatorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Manage Validators</h2>
                <button
                  onClick={() => setShowValidatorModal(false)}
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Action</label>
                  <div className="flex gap-2">
                    <Button
                      variant={validatorAction === "authorize" ? "default" : "outline"}
                      onClick={() => setValidatorAction("authorize")}
                      className="flex-1"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Authorize
                    </Button>
                    <Button
                      variant={validatorAction === "revoke" ? "default" : "outline"}
                      onClick={() => setValidatorAction("revoke")}
                      className="flex-1"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Validator Address</label>
                  <Input
                    type="text"
                    value={validatorAddress}
                    onChange={(e) => setValidatorAddress(e.target.value)}
                    placeholder="0x..."
                    disabled={isAuthorizing || isRevoking}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowValidatorModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isAuthorizing || isRevoking}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleValidatorAction}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isAuthorizing || isRevoking}
                >
                  {isAuthorizing || isRevoking ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : validatorAction === "authorize" ? (
                    "Authorize Validator"
                  ) : (
                    "Revoke Validator"
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
