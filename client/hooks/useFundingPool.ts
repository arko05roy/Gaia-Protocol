import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FundingPoolABI } from '@/lib/abis';

const FUNDING_POOL_ABI = FundingPoolABI as any;

export const FUNDING_POOL_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as const; // GaiaL3

export interface Pool {
  totalFunded: bigint;
  fundersCount: bigint;
  paymentReleased: boolean;
  refundsEnabled: boolean;
}

export interface FundingProgress {
  funded: bigint;
  target: bigint;
  percentage: bigint;
}

/**
 * Hook to fund a task with cUSD
 * @returns Object with fundTask function and transaction state
 */
export function useFundTask() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fundTask = (taskId: bigint, amount: bigint) => {
    writeContract({
      address: FUNDING_POOL_ADDRESS,
      abi: FUNDING_POOL_ABI,
      functionName: 'fundTask',
      args: [taskId, amount],
    });
  };

  return { fundTask, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to withdraw funding from a task before it's fully funded
 * @returns Object with withdrawFunding function and transaction state
 */
export function useWithdrawFunding() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdrawFunding = (taskId: bigint) => {
    writeContract({
      address: FUNDING_POOL_ADDRESS,
      abi: FUNDING_POOL_ABI,
      functionName: 'withdrawFunding',
      args: [taskId],
    });
  };

  return { withdrawFunding, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to claim refund for a failed/rejected task
 * @returns Object with claimRefund function and transaction state
 */
export function useClaimRefund() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRefund = (taskId: bigint) => {
    writeContract({
      address: FUNDING_POOL_ADDRESS,
      abi: FUNDING_POOL_ABI,
      functionName: 'claimRefund',
      args: [taskId],
    });
  };

  return { claimRefund, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to get pool information for a task
 * @param taskId - The ID of the task
 * @returns Pool data and loading state
 */
export function useGetPool(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: FUNDING_POOL_ADDRESS,
    abi: FUNDING_POOL_ABI,
    functionName: 'getPool',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    pool: data as Pool | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get a funder's contribution to a task
 * @param taskId - The ID of the task
 * @param funder - The address of the funder
 * @returns Funder's share amount
 */
export function useGetFunderShare(taskId: bigint | undefined, funder: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: FUNDING_POOL_ADDRESS,
    abi: FUNDING_POOL_ABI,
    functionName: 'getFunderShare',
    args: taskId && funder ? [taskId, funder] : undefined,
    query: { enabled: !!taskId && !!funder },
  });

  return {
    share: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get all funders for a task
 * @param taskId - The ID of the task
 * @returns Array of funder addresses
 */
export function useGetFunders(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: FUNDING_POOL_ADDRESS,
    abi: FUNDING_POOL_ABI,
    functionName: 'getFunders',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    funders: (data as string[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get funders and their shares for a task
 * @param taskId - The ID of the task
 * @returns Object with funders array and shares array
 */
export function useGetFundersWithShares(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: FUNDING_POOL_ADDRESS,
    abi: FUNDING_POOL_ABI,
    functionName: 'getFundersWithShares',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const [funders, shares] = (data as [string[], bigint[]] | undefined) || [[], []];

  return {
    funders,
    shares,
    isLoading,
    error,
  };
}

/**
 * Hook to get funding progress for a task
 * @param taskId - The ID of the task
 * @returns Funding progress data (funded, target, percentage)
 */
export function useGetFundingProgress(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: FUNDING_POOL_ADDRESS,
    abi: FUNDING_POOL_ABI,
    functionName: 'getFundingProgress',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const [funded, target, percentage] = (data as [bigint, bigint, bigint] | undefined) || [0n, 0n, 0n];

  return {
    funded,
    target,
    percentage,
    isLoading,
    error,
  };
}

/**
 * Hook to get a funder's share percentage for a task
 * @param taskId - The ID of the task
 * @param funder - The address of the funder
 * @returns Share percentage in basis points (10000 = 100%)
 */
export function useGetSharePercentage(taskId: bigint | undefined, funder: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: FUNDING_POOL_ADDRESS,
    abi: FUNDING_POOL_ABI,
    functionName: 'getSharePercentage',
    args: taskId && funder ? [taskId, funder] : undefined,
    query: { enabled: !!taskId && !!funder },
  });

  return {
    percentage: data as bigint | undefined,
    isLoading,
    error,
  };
}
