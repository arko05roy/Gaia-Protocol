"use client"

import React, { useState, useMemo } from "react"
import { useAccount } from "wagmi"
import { formatUnits, parseEther } from "viem"
import { motion, AnimatePresence } from "framer-motion"
import {
  useGetTotalProposals,
  useGetProposal,
  useGetProposalState,
  useGetVotingResults,
  useCheckQuorum,
  useGetTimeRemaining,
  useCanExecute,
  useCreateProposal,
  useVote,
  useExecuteProposal,
  useCancelProposal,
  ProposalState,
} from "@/hooks/useGovernanceDAO"
import { useGetBalanceOfBatch } from "@/hooks/useCarbonCreditMinter"
import { useGetAllowance, useApproveToken } from "@/hooks/useERC20Approval"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Zap,
  X,
  TrendingUp,
  Users,
} from "lucide-react"

// Proposal state labels
const PROPOSAL_STATE_LABELS: Record<ProposalState, string> = {
  [ProposalState.Active]: "Active",
  [ProposalState.Defeated]: "Defeated",
  [ProposalState.Succeeded]: "Succeeded",
  [ProposalState.Executed]: "Executed",
  [ProposalState.Cancelled]: "Cancelled",
}

const PROPOSAL_STATE_COLORS: Record<ProposalState, string> = {
  [ProposalState.Active]: "bg-blue-100 text-blue-800",
  [ProposalState.Defeated]: "bg-red-100 text-red-800",
  [ProposalState.Succeeded]: "bg-green-100 text-green-800",
  [ProposalState.Executed]: "bg-emerald-100 text-emerald-800",
  [ProposalState.Cancelled]: "bg-gray-100 text-gray-800",
}

interface ProposalWithState {
  id: bigint
  description: string
  proposer: string
  forVotes: bigint
  againstVotes: bigint
  state: ProposalState
  executed: boolean
  cancelled: boolean
  startBlock: bigint
  endBlock: bigint
}

export default function GovernancePage() {
  const { address } = useAccount()
  const { totalProposals, isLoading: loadingTotal } = useGetTotalProposals()

  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedProposalId, setSelectedProposalId] = useState<bigint | null>(null)
  const [voteSupport, setVoteSupport] = useState<boolean | null>(null)

  // Form state
  const [proposalDescription, setProposalDescription] = useState("")
  const [targetContract, setTargetContract] = useState("")
  const [callData, setCallData] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [approvalStep, setApprovalStep] = useState<"idle" | "checking" | "approving" | "approved">("idle")

  // Hooks for creating proposals
  const { createProposal, isPending: isCreatingProposal, isSuccess: proposalSuccess } = useCreateProposal()
  const { vote, isPending: isVoting, isSuccess: voteSuccess } = useVote()
  const { executeProposal, isPending: isExecuting, isSuccess: executeSuccess } = useExecuteProposal()
  const { cancelProposal, isPending: isCancelling, isSuccess: cancelSuccess } = useCancelProposal()

  // Approval hooks
  const GOVERNANCE_DAO_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318" as const
  const CUSD_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const
  const { allowance, isLoading: loadingAllowance } = useGetAllowance(
    CUSD_TOKEN_ADDRESS,
    address,
    approvalStep === "checking" ? GOVERNANCE_DAO_ADDRESS : undefined
  )
  const { approveToken, isPending: isApproving, isSuccess: approvalSuccess } = useApproveToken()

  // Get user's voting power (carbon credits)
  const { balances: userBalances, isLoading: loadingBalances } = useGetBalanceOfBatch(
    address,
    address ? [BigInt(1)] : undefined
  )
  const votingPower = userBalances && userBalances.length > 0 ? Number(formatUnits(userBalances[0] || 0n, 18)) : 0

  // Generate proposal IDs
  const proposalIds = useMemo(() => {
    if (!totalProposals) return []
    return Array.from({ length: Math.min(Number(totalProposals), 10) }, (_, i) =>
      BigInt(Number(totalProposals) - i)
    )
  }, [totalProposals])

  // Fetch proposal details for each ID using hooks (called at top level, not in map)
  // We need to call hooks for a fixed number of proposals to maintain hook order
  const maxProposals = 10
  const proposalHooks = Array.from({ length: maxProposals }, (_, i) => {
    const id = proposalIds[i]
    return {
      id,
      proposal: useGetProposal(id),
      state: useGetProposalState(id),
      votingResults: useGetVotingResults(id),
      quorum: useCheckQuorum(id),
      timeRemaining: useGetTimeRemaining(id),
      canExecute: useCanExecute(id),
    }
  })

  // Build proposals list from hook results
  const proposals: ProposalWithState[] = useMemo(() => {
    return proposalHooks
      .filter((q) => q.id && q.proposal.proposal)
      .map((q) => ({
        id: q.id!,
        description: q.proposal.proposal?.description || "",
        proposer: q.proposal.proposal?.proposer || "",
        forVotes: q.votingResults.forVotes || 0n,
        againstVotes: q.votingResults.againstVotes || 0n,
        state: q.state.state || ProposalState.Active,
        executed: q.proposal.proposal?.executed || false,
        cancelled: q.proposal.proposal?.cancelled || false,
        startBlock: q.proposal.proposal?.startBlock || 0n,
        endBlock: q.proposal.proposal?.endBlock || 0n,
      }))
  }, [proposalHooks])

  const handleCreateProposal = async () => {
    if (!proposalDescription.trim() || !targetContract.trim() || !callData.trim()) {
      setError("All fields are required")
      return
    }

    if (!targetContract.startsWith("0x") || targetContract.length !== 42) {
      setError("Invalid contract address")
      return
    }

    if (!callData.startsWith("0x")) {
      setError("Call data must start with 0x")
      return
    }

    try {
      setError(null)
      
      // Check allowance first
      if (approvalStep === "idle") {
        setApprovalStep("checking")
        // If allowance is 0, need to approve
        if (!allowance || allowance === 0n) {
          setApprovalStep("approving")
          // Approve a large amount for governance operations
          approveToken(CUSD_TOKEN_ADDRESS, GOVERNANCE_DAO_ADDRESS, parseEther("1000000"))
          return
        }
        setApprovalStep("approved")
      }

      // Proceed with proposal creation
      if (approvalStep === "approved" || (allowance && allowance > 0n)) {
        createProposal(proposalDescription, targetContract as `0x${string}`, callData as `0x${string}`)
        setApprovalStep("idle")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create proposal")
      setApprovalStep("idle")
    }
  }

  const handleVote = (proposalId: bigint, support: boolean) => {
    if (votingPower <= 0) {
      setError("You need voting power (carbon credits) to vote")
      return
    }

    try {
      setError(null)
      const votePower = BigInt(Math.floor(votingPower))
      vote(proposalId, support, votePower)
      setShowVoteModal(false)
      setVoteSupport(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote")
    }
  }

  const handleExecute = (proposalId: bigint) => {
    try {
      setError(null)
      executeProposal(proposalId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute proposal")
    }
  }

  const handleCancel = (proposalId: bigint) => {
    try {
      setError(null)
      cancelProposal(proposalId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel proposal")
    }
  }

  // Handle approval success - auto-proceed with proposal creation
  React.useEffect(() => {
    if (approvalSuccess && approvalStep === "approving") {
      setApprovalStep("approved")
      // Auto-retry proposal creation after approval
      setTimeout(() => {
        if (proposalDescription && targetContract && callData) {
          createProposal(proposalDescription, targetContract as `0x${string}`, callData as `0x${string}`)
          setApprovalStep("idle")
        }
      }, 1000)
    }
  }, [approvalSuccess, approvalStep, proposalDescription, targetContract, callData, createProposal])

  // Handle modal close on success
  React.useEffect(() => {
    if (proposalSuccess || voteSuccess || executeSuccess || cancelSuccess) {
      setSuccessMessage("Transaction submitted successfully!")
      setShowCreateModal(false)
      setShowVoteModal(false)
      setProposalDescription("")
      setTargetContract("")
      setCallData("")
      setApprovalStep("idle")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [proposalSuccess, voteSuccess, executeSuccess, cancelSuccess])

  const isLoading = loadingTotal || loadingBalances

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Governance</h1>
              <p className="text-muted-foreground">Participate in protocol decisions and vote on proposals</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Plus size={20} />
              Create Proposal
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Proposals</p>
                  <p className="text-3xl font-bold text-primary">
                    {isLoading ? <Loader className="animate-spin" size={24} /> : totalProposals?.toString() || "0"}
                  </p>
                </div>
                <FileText className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Your Voting Power</p>
                  <p className="text-3xl font-bold text-primary">{votingPower.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Carbon Credits</p>
                </div>
                <Users className="text-primary" size={32} />
              </div>
            </Card>

            <Card className="gaia-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Active Proposals</p>
                  <p className="text-3xl font-bold text-primary">
                    {proposals.filter((p) => p.state === ProposalState.Active).length}
                  </p>
                </div>
                <TrendingUp className="text-primary" size={32} />
              </div>
            </Card>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
              >
                <CheckCircle className="text-green-500" size={20} />
                <p className="text-green-700">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proposals List */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Proposals</h2>

            {proposals.length === 0 ? (
              <Card className="gaia-card p-12 text-center">
                <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">No proposals yet. Create one to get started!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id.toString()}
                    proposal={proposal}
                    onVote={() => {
                      setSelectedProposalId(proposal.id)
                      setShowVoteModal(true)
                    }}
                    onExecute={() => handleExecute(proposal.id)}
                    onCancel={() => handleCancel(proposal.id)}
                    votingPower={votingPower}
                    isVoting={isVoting}
                    isExecuting={isExecuting}
                    isCancelling={isCancelling}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Proposal Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProposalModal
            onClose={() => {
              setShowCreateModal(false)
              setApprovalStep("idle")
              setError(null)
            }}
            onSubmit={handleCreateProposal}
            description={proposalDescription}
            setDescription={setProposalDescription}
            targetContract={targetContract}
            setTargetContract={setTargetContract}
            callData={callData}
            setCallData={setCallData}
            isLoading={isCreatingProposal || isApproving}
            approvalStep={approvalStep}
          />
        )}
      </AnimatePresence>

      {/* Vote Modal */}
      <AnimatePresence>
        {showVoteModal && selectedProposalId && (
          <VoteModal
            proposalId={selectedProposalId}
            onClose={() => {
              setShowVoteModal(false)
              setVoteSupport(null)
              setError(null)
            }}
            onVoteFor={() => handleVote(selectedProposalId, true)}
            onVoteAgainst={() => handleVote(selectedProposalId, false)}
            votingPower={votingPower}
            isLoading={isVoting}
            voteSupport={voteSupport}
            setVoteSupport={setVoteSupport}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Proposal Card Component
function ProposalCard({
  proposal,
  onVote,
  onExecute,
  onCancel,
  votingPower,
  isVoting,
  isExecuting,
  isCancelling,
}: {
  proposal: ProposalWithState
  onVote: () => void
  onExecute: () => void
  onCancel: () => void
  votingPower: number
  isVoting: boolean
  isExecuting: boolean
  isCancelling: boolean
}) {
  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPercentage = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0
  const againstPercentage = totalVotes > 0n ? Number((proposal.againstVotes * 100n) / totalVotes) : 0

  const stateLabel = PROPOSAL_STATE_LABELS[proposal.state]
  const stateColor = PROPOSAL_STATE_COLORS[proposal.state]

  const isActive = proposal.state === ProposalState.Active
  const canVote = isActive && votingPower > 0
  const canExecute = proposal.state === ProposalState.Succeeded && !proposal.executed
  const canCancel = isActive && !proposal.cancelled

  return (
    <Card className="gaia-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{proposal.description}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${stateColor}`}>{stateLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Proposed by: <span className="text-foreground font-mono">{proposal.proposer.slice(0, 10)}...</span>
          </p>
        </div>
      </div>

      {/* Voting Results */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Voting Results</p>
          <p className="text-sm text-muted-foreground">{Number(totalVotes)} votes</p>
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${forPercentage}%` }}
            />
          </div>
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${againstPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-green-600">For: {Number(formatUnits(proposal.forVotes, 18)).toFixed(2)}</span>
          <span className="text-red-600">Against: {Number(formatUnits(proposal.againstVotes, 18)).toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canVote && (
          <Button
            onClick={onVote}
            disabled={isVoting}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {isVoting ? <Loader className="animate-spin" size={16} /> : <ThumbsUp size={16} />}
            {isVoting ? "Voting..." : "Vote"}
          </Button>
        )}

        {canExecute && (
          <Button
            onClick={onExecute}
            disabled={isExecuting}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            {isExecuting ? <Loader className="animate-spin" size={16} /> : <Zap size={16} />}
            {isExecuting ? "Executing..." : "Execute"}
          </Button>
        )}

        {canCancel && (
          <Button
            onClick={onCancel}
            disabled={isCancelling}
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-muted gap-2"
          >
            {isCancelling ? <Loader className="animate-spin" size={16} /> : <X size={16} />}
            {isCancelling ? "Cancelling..." : "Cancel"}
          </Button>
        )}

        {!canVote && !canExecute && !canCancel && (
          <div className="w-full text-center py-2 text-muted-foreground text-sm">
            {proposal.state === ProposalState.Executed && "Proposal executed"}
            {proposal.state === ProposalState.Defeated && "Proposal defeated"}
            {proposal.state === ProposalState.Cancelled && "Proposal cancelled"}
          </div>
        )}
      </div>
    </Card>
  )
}

// Create Proposal Modal Component
function CreateProposalModal({
  onClose,
  onSubmit,
  description,
  setDescription,
  targetContract,
  setTargetContract,
  callData,
  setCallData,
  isLoading,
  approvalStep,
}: {
  onClose: () => void
  onSubmit: () => void
  description: string
  setDescription: (value: string) => void
  targetContract: string
  setTargetContract: (value: string) => void
  callData: string
  setCallData: (value: string) => void
  isLoading: boolean
  approvalStep: "idle" | "checking" | "approving" | "approved"
}) {
  const getButtonText = () => {
    if (approvalStep === "checking") return "Checking allowance..."
    if (approvalStep === "approving") return "Approving tokens..."
    if (approvalStep === "approved") return "Creating proposal..."
    return "Create"
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Create Proposal</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Target Contract Address</label>
            <Input
              value={targetContract}
              onChange={(e) => setTargetContract(e.target.value)}
              placeholder="0x..."
              className="bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Call Data (hex)</label>
            <textarea
              value={callData}
              onChange={(e) => setCallData(e.target.value)}
              placeholder="0x..."
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono text-xs"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {isLoading ? <Loader className="animate-spin" size={16} /> : <Plus size={16} />}
              {isLoading ? getButtonText() : "Create"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Vote Modal Component
function VoteModal({
  proposalId,
  onClose,
  onVoteFor,
  onVoteAgainst,
  votingPower,
  isLoading,
  voteSupport,
  setVoteSupport,
}: {
  proposalId: bigint
  onClose: () => void
  onVoteFor: () => void
  onVoteAgainst: () => void
  votingPower: number
  isLoading: boolean
  voteSupport: boolean | null
  setVoteSupport: (value: boolean | null) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Cast Your Vote</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground text-sm mb-2">Your Voting Power</p>
          <p className="text-2xl font-bold text-primary">{votingPower.toFixed(2)} Credits</p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setVoteSupport(true)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              voteSupport === true
                ? "border-green-500 bg-green-50"
                : "border-border bg-card hover:border-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <ThumbsUp className={voteSupport === true ? "text-green-500" : "text-muted-foreground"} size={20} />
              <div className="text-left">
                <p className={`font-semibold ${voteSupport === true ? "text-green-600" : "text-foreground"}`}>Vote For</p>
                <p className="text-xs text-muted-foreground">Support this proposal</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setVoteSupport(false)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              voteSupport === false
                ? "border-red-500 bg-red-50"
                : "border-border bg-card hover:border-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              <ThumbsDown className={voteSupport === false ? "text-red-500" : "text-muted-foreground"} size={20} />
              <div className="text-left">
                <p className={`font-semibold ${voteSupport === false ? "text-red-600" : "text-foreground"}`}>
                  Vote Against
                </p>
                <p className="text-xs text-muted-foreground">Oppose this proposal</p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={voteSupport ? onVoteFor : onVoteAgainst}
            disabled={isLoading || voteSupport === null}
            className={`flex-1 text-primary-foreground gap-2 ${
              voteSupport === true
                ? "bg-green-600 hover:bg-green-700"
                : voteSupport === false
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-muted cursor-not-allowed"
            }`}
          >
            {isLoading ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            {isLoading ? "Voting..." : "Confirm Vote"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
