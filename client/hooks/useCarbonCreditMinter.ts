import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CarbonCreditMinterABI } from '@/lib/abis';

const CARBON_CREDIT_MINTER_ABI = CarbonCreditMinterABI as any;

export const CARBON_CREDIT_MINTER_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F' as const;

export interface CreditMetadata {
  taskId: bigint;
  totalCO2: bigint;
  projectType: string;
  location: string;
  vintage: bigint;
  mintedAt: bigint;
  totalSupply: bigint;
  exists: boolean;
}

/**
 * Hook to retire (burn) carbon credits for offsetting
 * @returns Object with retireCredits function and transaction state
 */
export function useRetireCredits() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const retireCredits = (tokenId: bigint, amount: bigint, reason: string) => {
    writeContract({
      address: CARBON_CREDIT_MINTER_ADDRESS,
      abi: CARBON_CREDIT_MINTER_ABI,
      functionName: 'retireCredits',
      args: [tokenId, amount, reason],
    });
  };

  return { retireCredits, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to get credit metadata for a token
 * @param tokenId - The token ID (same as task ID)
 * @returns Credit metadata and loading state
 */
export function useGetCreditMetadata(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_CREDIT_MINTER_ADDRESS,
    abi: CARBON_CREDIT_MINTER_ABI,
    functionName: 'getMetadata',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    metadata: data as CreditMetadata | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get circulating supply (minted - retired) for a token
 * @param tokenId - The token ID
 * @returns Circulating supply amount
 */
export function useGetCirculatingSupply(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_CREDIT_MINTER_ADDRESS,
    abi: CARBON_CREDIT_MINTER_ABI,
    functionName: 'getCirculatingSupply',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    supply: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get total retired credits for a token
 * @param tokenId - The token ID
 * @returns Total retired amount
 */
export function useGetTotalRetired(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_CREDIT_MINTER_ADDRESS,
    abi: CARBON_CREDIT_MINTER_ABI,
    functionName: 'getTotalRetired',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    totalRetired: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get user's retired credits for a token
 * @param account - The user's address
 * @param tokenId - The token ID
 * @returns Amount retired by user
 */
export function useGetUserRetired(account: string | undefined, tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_CREDIT_MINTER_ADDRESS,
    abi: CARBON_CREDIT_MINTER_ABI,
    functionName: 'getUserRetired',
    args: account && tokenId ? [account, tokenId] : undefined,
    query: { enabled: !!account && !!tokenId },
  });

  return {
    userRetired: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get balances of multiple credit tokens for an account
 * @param account - The user's address
 * @param tokenIds - Array of token IDs to check
 * @returns Array of balances
 */
export function useGetBalanceOfBatch(account: string | undefined, tokenIds: bigint[] | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_CREDIT_MINTER_ADDRESS,
    abi: CARBON_CREDIT_MINTER_ABI,
    functionName: 'balanceOfBatchForAccount',
    args: account && tokenIds ? [account, tokenIds] : undefined,
    query: { enabled: !!account && !!tokenIds && tokenIds.length > 0 },
  });

  return {
    balances: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to check if credits have been minted for a task
 * @param taskId - The task ID
 * @returns Boolean indicating if credits exist
 */
export function useCreditsExist(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_CREDIT_MINTER_ADDRESS,
    abi: CARBON_CREDIT_MINTER_ABI,
    functionName: 'creditsExist',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    exists: data as boolean | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get URI for token metadata
 * @param tokenId - The token ID
 * @returns URI string
 */
export function useGetCreditURI(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_CREDIT_MINTER_ADDRESS,
    abi: CARBON_CREDIT_MINTER_ABI,
    functionName: 'uri',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    uri: data as string | undefined,
    isLoading,
    error,
  };
}
