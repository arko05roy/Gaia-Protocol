import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VerificationManagerABI } from '@/lib/abis';

const VERIFICATION_MANAGER_ABI = VerificationManagerABI as any;

export const VERIFICATION_MANAGER_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as const;

export interface Vote {
  hasVoted: boolean;
  approve: boolean;
  confidenceScore: bigint;
  justification: string;
  timestamp: bigint;
}

/**
 * Hook to initiate verification for a task (owner only)
 * @returns Object with initiateVerification function and transaction state
 */
export function useInitiateVerification() {
  const { writeContract, data: hash, isPending, error, isError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const initiateVerification = (taskId: bigint) => {
    console.log("initiateVerification called with taskId:", taskId.toString())
    writeContract({
      address: VERIFICATION_MANAGER_ADDRESS,
      abi: VERIFICATION_MANAGER_ABI,
      functionName: 'initiateVerification',
      args: [taskId],
    });
  };

  return { initiateVerification, hash, isPending, isConfirming, isSuccess, error, isError };
}

/**
 * Hook to add a validator (owner only)
 * @returns Object with addValidator function and transaction state
 */
export function useAddValidator() {
  const { writeContract, data: hash, isPending, error, isError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addValidator = (validator: `0x${string}`) => {
    console.log("useAddValidator called with:", validator)
    console.log("Using VerificationManager address:", VERIFICATION_MANAGER_ADDRESS)
    writeContract({
      address: VERIFICATION_MANAGER_ADDRESS,
      abi: VERIFICATION_MANAGER_ABI,
      functionName: 'addValidator',
      args: [validator],
    });
  };

  return { addValidator, hash, isPending, isConfirming, isSuccess, error, isError };
}

/**
 * Hook to submit a validator vote for task verification
 * @returns Object with submitValidatorVote function and transaction state
 */
export function useSubmitValidatorVote() {
  const { writeContract, data: hash, isPending, error, isError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitValidatorVote = (
    taskId: bigint,
    approve: boolean,
    justification: string,
    confidenceScore: bigint
  ) => {
    console.log("submitValidatorVote called with:", {
      taskId: taskId.toString(),
      approve,
      confidenceScore: confidenceScore.toString(),
      justification,
    })
    console.log("Calling submitVote on VerificationManager:", VERIFICATION_MANAGER_ADDRESS)
    writeContract({
      address: VERIFICATION_MANAGER_ADDRESS,
      abi: VERIFICATION_MANAGER_ABI,
      functionName: 'submitVote',
      // Contract signature: submitVote(uint256 taskId, bool approve, uint256 confidenceScore, string justification)
      args: [taskId, approve, confidenceScore, justification],
    });
  };

  return { submitValidatorVote, hash, isPending, isConfirming, isSuccess, error, isError };
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
    query: { 
      enabled: !!validator,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
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
    functionName: 'getAllValidators',
    query: {
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  return {
    validators: (data as string[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get contract owner
 * @returns Owner address
 */
export function useGetVerificationManagerOwner() {
  const { data, isLoading, error } = useReadContract({
    address: VERIFICATION_MANAGER_ADDRESS,
    abi: VERIFICATION_MANAGER_ABI,
    functionName: 'owner',
  });

  return {
    owner: data as string | undefined,
    isLoading,
    error,
  };
}
