import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VerificationManagerABI } from '@/lib/abis';

const VERIFICATION_MANAGER_ABI = VerificationManagerABI as any;

const VERIFICATION_MANAGER_ADDRESS = '0x0443963AA05cE99Ef5C587BBe03DBb7D47340a87' as const;

export interface Vote {
  hasVoted: boolean;
  approve: boolean;
  confidenceScore: bigint;
  justification: string;
  timestamp: bigint;
}

/**
 * Hook to submit a validator vote for task verification
 * @returns Object with submitValidatorVote function and transaction state
 */
export function useSubmitValidatorVote() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitValidatorVote = (
    taskId: bigint,
    approve: boolean,
    justification: string,
    confidenceScore: bigint
  ) => {
    writeContract({
      address: VERIFICATION_MANAGER_ADDRESS,
      abi: VERIFICATION_MANAGER_ABI,
      functionName: 'submitValidatorVote',
      args: [taskId, approve, justification, confidenceScore],
    });
  };

  return { submitValidatorVote, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to check if an address is an approved validator
 * @param validator - The address to check
 * @returns Boolean indicating if validator is approved
 */
export function useIsValidator(validator: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'isValidator',
    args: validator ? [validator] : undefined,
    query: { enabled: !!validator },
  });

  return {
    isValidator: data as boolean | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get validator reputation score
 * @param validator - The validator's address
 * @returns Reputation score
 */
export function useGetValidatorReputation(validator: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'validatorReputationScore',
    args: validator ? [validator] : undefined,
    query: { enabled: !!validator },
  });

  return {
    reputationScore: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get required number of validators
 * @returns Number of validators required
 */
export function useGetRequiredValidators() {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'requiredValidators',
  });

  return {
    requiredValidators: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get consensus threshold
 * @returns Consensus threshold in basis points
 */
export function useGetConsensusThreshold() {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'consensusThresholdBps',
  });

  return {
    threshold: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get verification period
 * @returns Verification period in seconds
 */
export function useGetVerificationPeriod() {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'verificationPeriod',
  });

  return {
    period: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get validator reward per task
 * @returns Reward amount in cUSD
 */
export function useGetValidatorReward() {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'validatorRewardPerTask',
  });

  return {
    reward: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get verification status for a task
 * @param taskId - The task ID
 * @returns Verification status data
 */
export function useGetVerificationStatus(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'getVerificationStatus',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    status: data as any | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get vote for a validator on a task
 * @param taskId - The task ID
 * @param validator - The validator's address
 * @returns Vote information
 */
export function useGetValidatorVote(taskId: bigint | undefined, validator: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'getValidatorVote',
    args: taskId && validator ? [taskId, validator] : undefined,
    query: { enabled: !!taskId && !!validator },
  });

  return {
    vote: data as Vote | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get all validators assigned to a task
 * @param taskId - The task ID
 * @returns Array of validator addresses
 */
export function useGetTaskValidators(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'getTaskValidators',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    validators: (data as string[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get all approved validators
 * @returns Array of validator addresses
 */
export function useGetAllValidators() {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'getApprovedValidators',
  });

  return {
    validators: (data as string[] | undefined) || [],
    isLoading,
    error,
  };
}
