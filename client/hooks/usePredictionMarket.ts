import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PredictionMarketABI } from '@/lib/abis';

const PREDICTION_MARKET_ABI = PredictionMarketABI as any;

const PREDICTION_MARKET_ADDRESS = '0x8c7Ffc95fcD2b9Dfb48272A0cEb6f54e7CE77b14' as const;

export interface Market {
  taskId: bigint;
  yesPool: bigint;
  noPool: bigint;
  totalVolume: bigint;
  resolutionDeadline: bigint;
  isResolved: boolean;
  outcome: boolean;
  createdAt: bigint;
}

export interface Position {
  yesShares: bigint;
  noShares: bigint;
}

/**
 * Hook to buy YES or NO shares in a prediction market
 * @returns Object with buyShares function and transaction state
 */
export function useBuyShares() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyShares = (taskId: bigint, isYes: boolean, amount: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'buyShares',
      args: [taskId, isYes, amount],
    });
  };

  return { buyShares, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to claim winnings from a resolved market
 * @returns Object with claimWinnings function and transaction state
 */
export function useClaimWinnings() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimWinnings = (taskId: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PREDICTION_MARKET_ABI,
      functionName: 'claimWinnings',
      args: [taskId],
    });
  };

  return { claimWinnings, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to get market information for a task
 * @param taskId - The task ID
 * @returns Market data and loading state
 */
export function useGetMarket(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'markets',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    market: data as Market | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get user's position in a market
 * @param taskId - The task ID
 * @param account - The user's address
 * @returns Position data (YES and NO shares)
 */
export function useGetPosition(taskId: bigint | undefined, account: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'positions',
    args: taskId && account ? [taskId, account] : undefined,
    query: { enabled: !!taskId && !!account },
  });

  return {
    position: data as Position | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get market creation fee
 * @returns Market creation fee amount
 */
export function useGetMarketCreationFee() {
  const { data, isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'marketCreationFee',
  });

  return {
    fee: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get current odds for a market
 * @param taskId - The task ID
 * @returns YES and NO odds as percentages
 */
export function useGetMarketOdds(taskId: bigint | undefined) {
  const { data: market, isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'markets',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const marketData = market as Market | undefined;
  const totalPool = marketData ? marketData.yesPool + marketData.noPool : 0n;
  const yesOdds = totalPool > 0n ? (marketData!.yesPool * 10000n) / totalPool : 5000n;
  const noOdds = totalPool > 0n ? (marketData!.noPool * 10000n) / totalPool : 5000n;

  return {
    yesOdds,
    noOdds,
    totalPool,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate shares received for a purchase
 * @param taskId - The task ID
 * @param isYes - Whether buying YES or NO
 * @param amount - Amount of cUSD to spend
 * @returns Estimated shares received
 */
export function useCalculateShares(
  taskId: bigint | undefined,
  isYes: boolean | undefined,
  amount: bigint | undefined
) {
  const { isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'markets',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const shares = amount || 0n;

  return {
    estimatedShares: shares,
    isLoading,
    error,
  };
}

/**
 * Hook to check if market is resolved
 * @param taskId - The task ID
 * @returns Boolean indicating if market is resolved
 */
export function useIsMarketResolved(taskId: bigint | undefined) {
  const { data: market, isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'markets',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const marketData = market as Market | undefined;

  return {
    isResolved: marketData?.isResolved || false,
    outcome: marketData?.outcome || false,
    isLoading,
    error,
  };
}

/**
 * Hook to get market resolution deadline
 * @param taskId - The task ID
 * @returns Resolution deadline timestamp
 */
export function useGetResolutionDeadline(taskId: bigint | undefined) {
  const { data: market, isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'markets',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const marketData = market as Market | undefined;

  return {
    deadline: marketData?.resolutionDeadline,
    isLoading,
    error,
  };
}

/**
 * Hook to get total trading volume for a market
 * @param taskId - The task ID
 * @returns Total volume in cUSD
 */
export function useGetMarketVolume(taskId: bigint | undefined) {
  const { data: market, isLoading, error } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'markets',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const marketData = market as Market | undefined;

  return {
    volume: marketData?.totalVolume,
    isLoading,
    error,
  };
}
