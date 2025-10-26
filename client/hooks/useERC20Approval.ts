import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { OZ_IERC20ABI as OZ_IERC20ABIImport } from '@/lib/abis';
import { useEffect, useState } from 'react';

const ERC20_ABI = ((OZ_IERC20ABIImport as any)?.default || OZ_IERC20ABIImport || []) as any;

// Default fallback address (will be overridden by deployment config)
const DEFAULT_CUSD_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;

// Get cUSD address from deployment config or use fallback
function getCUSDTokenAddress(): `0x${string}` {
  if (typeof window !== 'undefined') {
    try {
      const deploymentConfig = (window as any).__DEPLOYMENT_CONFIG__;
      if (deploymentConfig?.cUSD) {
        return deploymentConfig.cUSD as `0x${string}`;
      }
    } catch (e) {
      // Fallback to default
    }
  }
  return DEFAULT_CUSD_TOKEN_ADDRESS;
}

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
  const [address, setAddress] = useState<`0x${string}`>(DEFAULT_CUSD_TOKEN_ADDRESS);

  useEffect(() => {
    setAddress(getCUSDTokenAddress());
  }, []);

  return address;
}

/**
 * Hook to get cUSD token balance
 * @param account - The account address
 * @returns Token balance
 */
export function useGetCUSDBalance(account: `0x${string}` | undefined) {
  const cusdAddress = getCUSDTokenAddress();

  const { data, isLoading, error } = useReadContract({
    address: cusdAddress,
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
