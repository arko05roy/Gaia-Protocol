import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { OZ_IERC20ABI } from '@/lib/abis';

const ERC20_ABI = OZ_IERC20ABI as any;

// Celo testnet cUSD token address
const CUSD_TOKEN_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b' as const;

/**
 * Hook to check ERC20 token allowance
 * @param tokenAddress - The token contract address
 * @param owner - The token owner address
 * @param spender - The spender address (contract that will use the tokens)
 * @returns Current allowance amount
 */
export function useGetAllowance(
  tokenAddress: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!tokenAddress && !!owner && !!spender },
  });

  return {
    allowance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to approve ERC20 token spending
 * @returns Object with approveToken function and transaction state
 */
export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approveToken = (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
    try {
      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount],
      });
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  return { approveToken, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to get cUSD token address for Celo testnet
 */
export function useCUSDTokenAddress() {
  return CUSD_TOKEN_ADDRESS;
}

/**
 * Hook to get cUSD token balance
 * @param account - The account address
 * @returns Token balance
 */
export function useGetCUSDBalance(account: `0x${string}` | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CUSD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
  };
}
