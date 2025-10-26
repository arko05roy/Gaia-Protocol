import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { OZ_IERC1155ABI } from '@/lib/abis';

const ERC1155_ABI = OZ_IERC1155ABI as any;

/**
 * Hook to check if an operator is approved for all ERC1155 tokens
 * @param tokenAddress - The ERC1155 contract address
 * @param owner - The token owner address
 * @param operator - The operator address (contract that will transfer tokens)
 * @returns Boolean indicating if operator is approved
 */
export function useIsApprovedForAll(
  tokenAddress: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  operator: `0x${string}` | undefined
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC1155_ABI,
    functionName: 'isApprovedForAll',
    args: owner && operator ? [owner, operator] : undefined,
    query: { enabled: !!tokenAddress && !!owner && !!operator },
  });

  return {
    isApproved: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to approve an operator for all ERC1155 tokens
 * @returns Object with setApprovalForAll function and transaction state
 */
export function useSetApprovalForAll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setApprovalForAll = (tokenAddress: `0x${string}`, operator: `0x${string}`, approved: boolean) => {
    try {
      writeContract({
        address: tokenAddress,
        abi: ERC1155_ABI,
        functionName: 'setApprovalForAll',
        args: [operator, approved],
      });
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  return { setApprovalForAll, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to get the Carbon Credit Minter address (ERC1155 contract)
 */
export function useCarbonCreditMinterAddress() {
  return '0x0165878A594ca255338adfa4d48449f69242Eb8F' as const;
}
