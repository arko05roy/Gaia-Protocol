import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CollateralManagerABI } from '@/lib/abis';

const COLLATERAL_MANAGER_ABI = CollateralManagerABI as any;

export const COLLATERAL_MANAGER_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as const;

export enum StakeStatus {
  None = 0,
  Locked = 1,
  Released = 2,
  Slashed = 3,
}

export interface StakeInfo {
  operator: string;
  amount: bigint;
  lockedAt: bigint;
  status: StakeStatus;
}

/**
 * Hook to register as an operator by staking collateral
 * @returns Object with registerOperator function and transaction state
 */
export function useRegisterOperator() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerOperator = (amount: bigint) => {
    writeContract({
      address: COLLATERAL_MANAGER_ADDRESS,
      abi: COLLATERAL_MANAGER_ABI,
      functionName: 'registerOperator',
      args: [],
      value: amount,
    });
  };

  return { registerOperator, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to add more stake to operator account
 * @returns Object with addStake function and transaction state
 */
export function useAddStake() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addStake = (amount: bigint) => {
    writeContract({
      address: COLLATERAL_MANAGER_ADDRESS,
      abi: COLLATERAL_MANAGER_ABI,
      functionName: 'addStake',
      args: [],
      value: amount,
    });
  };

  return { addStake, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to withdraw available stake
 * @returns Object with withdrawStake function and transaction state
 */
export function useWithdrawStake() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdrawStake = (amount: bigint) => {
    writeContract({
      address: COLLATERAL_MANAGER_ADDRESS,
      abi: COLLATERAL_MANAGER_ABI,
      functionName: 'withdrawStake',
      args: [amount],
    });
  };

  return { withdrawStake, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to stake collateral for a specific task
 * @returns Object with stakeForTask function and transaction state
 */
export function useStakeForTask() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const stakeForTask = (taskId: bigint) => {
    writeContract({
      address: COLLATERAL_MANAGER_ADDRESS,
      abi: COLLATERAL_MANAGER_ABI,
      functionName: 'stakeForTask',
      args: [taskId],
    });
  };

  return { stakeForTask, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to check if an address is an approved operator
 * @param operator - The address to check
 * @returns Boolean indicating if operator is approved
 */
export function useIsApprovedOperator(operator: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: COLLATERAL_MANAGER_ADDRESS,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'approvedOperators',
    args: operator ? [operator] : undefined,
    query: { enabled: !!operator },
  });

  return {
    isApproved: data as boolean | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get available stake for an operator
 * @param operator - The operator's address
 * @returns Available stake amount
 */
export function useGetOperatorStake(operator: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: COLLATERAL_MANAGER_ADDRESS,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'operatorStake',
    args: operator ? [operator] : undefined,
    query: { enabled: !!operator },
  });

  return {
    stake: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get total stake for an operator (including locked)
 * @param operator - The operator's address
 * @returns Total stake amount
 */
export function useGetOperatorTotalStake(operator: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: COLLATERAL_MANAGER_ADDRESS,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'operatorTotalStake',
    args: operator ? [operator] : undefined,
    query: { enabled: !!operator },
  });

  return {
    totalStake: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get stake information for a task
 * @param taskId - The task ID
 * @returns Stake information
 */
export function useGetTaskStake(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: COLLATERAL_MANAGER_ADDRESS,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'taskStakes',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  // Normalize tuple/struct into StakeInfo
  let mapped: StakeInfo | undefined = undefined;
  if (data) {
    const s: any = data as any;
    if (Array.isArray(s)) {
      mapped = {
        operator: s[0] || '0x0000000000000000000000000000000000000000',
        amount: BigInt(s[1] ?? 0),
        lockedAt: BigInt(s[2] ?? 0),
        status: Number(s[3] ?? 0) as StakeStatus,
      };
    } else if (typeof s === 'object' && s !== null) {
      mapped = s as StakeInfo;
    }
  }

  return {
    stakeInfo: mapped,
    isLoading,
    error,
  };
}

/**
 * Hook to get minimum stake percentage
 * @returns Minimum stake percentage in basis points
 */
export function useGetMinimumStakePercentage() {
  const { data, isLoading, error } = useReadContract({
    address: COLLATERAL_MANAGER_ADDRESS,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'minimumStakePercentage',
  });

  return {
    percentage: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get minimum operator stake
 * @returns Minimum stake amount
 */
export function useGetMinimumOperatorStake() {
  const { data, isLoading, error } = useReadContract({
    address: COLLATERAL_MANAGER_ADDRESS,
    abi: COLLATERAL_MANAGER_ABI,
    functionName: 'minimumOperatorStake',
  });

  return {
    minimumStake: data as bigint | undefined,
    isLoading,
    error,
  };
}
