import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GovernanceDAOABI } from '@/lib/abis';

const GOVERNANCE_DAO_ABI = GovernanceDAOABI as any;

export const GOVERNANCE_DAO_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318' as const;

export enum ProposalState {
  Active = 0,
  Defeated = 1,
  Succeeded = 2,
  Executed = 3,
  Cancelled = 4,
}

export interface Proposal {
  id: bigint;
  proposer: string;
  description: string;
  targetContract: string;
  callData: string;
  forVotes: bigint;
  againstVotes: bigint;
  startBlock: bigint;
  endBlock: bigint;
  executed: boolean;
  cancelled: boolean;
  bond: bigint;
}

export interface Vote {
  hasVoted: boolean;
  support: boolean;
  votes: bigint;
}

export interface VotingResults {
  forVotes: bigint;
  againstVotes: bigint;
  totalVotes: bigint;
  forPercentage: bigint;
}

export interface QuorumInfo {
  meetsQuorum: boolean;
  votesReceived: bigint;
  votesRequired: bigint;
}

export interface TimeRemaining {
  blocksRemaining: bigint;
  hasEnded: boolean;
}

export interface ExecutionInfo {
  executable: boolean;
  reason: string;
}

/**
 * Hook to create a governance proposal
 * @returns Object with createProposal function and transaction state
 */
export function useCreateProposal() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createProposal = (description: string, targetContract: string, callData: string) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'createProposal',
      args: [description, targetContract, callData],
    });
  };

  return { createProposal, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to vote on a proposal
 * @returns Object with vote function and transaction state
 */
export function useVote() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const vote = (proposalId: bigint, support: boolean, tokenId: bigint) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'vote',
      args: [proposalId, support, tokenId],
    });
  };

  return { vote, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to execute a proposal
 * @returns Object with executeProposal function and transaction state
 */
export function useExecuteProposal() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeProposal = (proposalId: bigint) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'executeProposal',
      args: [proposalId],
    });
  };

  return { executeProposal, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to cancel a proposal
 * @returns Object with cancelProposal function and transaction state
 */
export function useCancelProposal() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelProposal = (proposalId: bigint) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'cancelProposal',
      args: [proposalId],
    });
  };

  return { cancelProposal, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to set voting period (admin only)
 * @returns Object with setVotingPeriod function and transaction state
 */
export function useSetVotingPeriod() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setVotingPeriod = (newPeriod: bigint) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'setVotingPeriod',
      args: [newPeriod],
    });
  };

  return { setVotingPeriod, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to set proposal bond (admin only)
 * @returns Object with setProposalBond function and transaction state
 */
export function useSetProposalBond() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setProposalBond = (newBond: bigint) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'setProposalBond',
      args: [newBond],
    });
  };

  return { setProposalBond, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to set quorum percentage (admin only)
 * @returns Object with setQuorum function and transaction state
 */
export function useSetQuorum() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setQuorum = (newQuorumBps: bigint) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'setQuorum',
      args: [newQuorumBps],
    });
  };

  return { setQuorum, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to set execution delay (admin only)
 * @returns Object with setExecutionDelay function and transaction state
 */
export function useSetExecutionDelay() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setExecutionDelay = (newDelay: bigint) => {
    writeContract({
      address: GOVERNANCE_DAO_ADDRESS,
      abi: GOVERNANCE_DAO_ABI,
      functionName: 'setExecutionDelay',
      args: [newDelay],
    });
  };

  return { setExecutionDelay, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to get proposal details
 * @param proposalId - Proposal ID
 * @returns Proposal data and loading state
 */
export function useGetProposal(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'getProposal',
    args: proposalId ? [proposalId] : undefined,
    query: { enabled: !!proposalId },
  });

  return {
    proposal: data as Proposal | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get proposal state
 * @param proposalId - Proposal ID
 * @returns Proposal state enum
 */
export function useGetProposalState(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'getProposalState',
    args: proposalId ? [proposalId] : undefined,
    query: { enabled: !!proposalId },
  });

  return {
    state: data as ProposalState | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get user's vote on a proposal
 * @param proposalId - Proposal ID
 * @param voter - Voter address
 * @returns Vote data
 */
export function useGetVote(proposalId: bigint | undefined, voter: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'getVote',
    args: proposalId && voter ? [proposalId, voter] : undefined,
    query: { enabled: !!proposalId && !!voter },
  });

  const [hasVoted, support, votesCount] = (data as [boolean, boolean, bigint] | undefined) || [false, false, 0n];

  return {
    hasVoted,
    support,
    votesCount,
    isLoading,
    error,
  };
}

/**
 * Hook to get voting results for a proposal
 * @param proposalId - Proposal ID
 * @returns Voting results
 */
export function useGetVotingResults(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'getVotingResults',
    args: proposalId ? [proposalId] : undefined,
    query: { enabled: !!proposalId },
  });

  const [forVotes, againstVotes, totalVotes, forPercentage] = (data as [bigint, bigint, bigint, bigint] | undefined) || [0n, 0n, 0n, 0n];

  return {
    forVotes,
    againstVotes,
    totalVotes,
    forPercentage,
    isLoading,
    error,
  };
}

/**
 * Hook to check if proposal meets quorum
 * @param proposalId - Proposal ID
 * @returns Quorum information
 */
export function useCheckQuorum(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'checkQuorum',
    args: proposalId ? [proposalId] : undefined,
    query: { enabled: !!proposalId },
  });

  const [meetsQuorum, votesReceived, votesRequired] = (data as [boolean, bigint, bigint] | undefined) || [false, 0n, 0n];

  return {
    meetsQuorum,
    votesReceived,
    votesRequired,
    isLoading,
    error,
  };
}

/**
 * Hook to get time remaining for voting
 * @param proposalId - Proposal ID
 * @returns Time remaining information
 */
export function useGetTimeRemaining(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'getTimeRemaining',
    args: proposalId ? [proposalId] : undefined,
    query: { enabled: !!proposalId },
  });

  const [blocksRemaining, hasEnded] = (data as [bigint, boolean] | undefined) || [0n, false];

  return {
    blocksRemaining,
    hasEnded,
    isLoading,
    error,
  };
}

/**
 * Hook to get total proposals created
 * @returns Total proposal count
 */
export function useGetTotalProposals() {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'getTotalProposals',
  });

  return {
    totalProposals: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to check if proposal can be executed
 * @param proposalId - Proposal ID
 * @returns Execution information
 */
export function useCanExecute(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: GOVERNANCE_DAO_ADDRESS,
    abi: GOVERNANCE_DAO_ABI,
    functionName: 'canExecute',
    args: proposalId ? [proposalId] : undefined,
    query: { enabled: !!proposalId },
  });

  const [executable, reason] = (data as [boolean, string] | undefined) || [false, ''];

  return {
    executable,
    reason,
    isLoading,
    error,
  };
}
