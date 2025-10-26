import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CarbonMarketplaceABI } from '@/lib/abis';

const CARBON_MARKETPLACE_ABI = CarbonMarketplaceABI as any;

export const CARBON_MARKETPLACE_ADDRESS = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as const;

export interface Order {
  orderId: bigint;
  seller: string;
  tokenId: bigint;
  amount: bigint;
  pricePerCredit: bigint;
  createdAt: bigint;
  isActive: boolean;
}

export interface MarketStats {
  totalVolume: bigint;
  totalTrades: bigint;
  activeOrderCount: bigint;
}

export interface BuyCost {
  totalCost: bigint;
  fee: bigint;
  sellerReceives: bigint;
}

/**
 * Hook to create a sell order for carbon credits
 * @returns Object with createSellOrder function and transaction state
 */
export function useCreateSellOrder() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createSellOrder = (tokenId: bigint, amount: bigint, pricePerCredit: bigint) => {
    writeContract({
      address: CARBON_MARKETPLACE_ADDRESS,
      abi: CARBON_MARKETPLACE_ABI,
      functionName: 'createSellOrder',
      args: [tokenId, amount, pricePerCredit],
    });
  };

  return { createSellOrder, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to cancel a sell order
 * @returns Object with cancelOrder function and transaction state
 */
export function useCancelOrder() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelOrder = (orderId: bigint) => {
    writeContract({
      address: CARBON_MARKETPLACE_ADDRESS,
      abi: CARBON_MARKETPLACE_ABI,
      functionName: 'cancelOrder',
      args: [orderId],
    });
  };

  return { cancelOrder, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to buy carbon credits from an order
 * @returns Object with buyCredits function and transaction state
 */
export function useBuyCredits() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyCredits = (orderId: bigint, amount: bigint) => {
    writeContract({
      address: CARBON_MARKETPLACE_ADDRESS,
      abi: CARBON_MARKETPLACE_ABI,
      functionName: 'buyCredits',
      args: [orderId, amount],
    });
  };

  return { buyCredits, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to get order details
 * @param orderId - The ID of the order
 * @returns Order data and loading state
 */
export function useGetOrder(orderId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getOrder',
    args: orderId ? [orderId] : undefined,
    query: { enabled: !!orderId },
  });

  return {
    order: data as Order | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get multiple orders
 * @param orderIds - Array of order IDs
 * @returns Array of orders and loading state
 */
export function useGetOrders(orderIds: bigint[] | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getOrders',
    args: orderIds ? [orderIds] : undefined,
    query: { enabled: !!orderIds && orderIds.length > 0 },
  });

  return {
    orders: (data as Order[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get all orders for a specific token
 * @param tokenId - The token ID
 * @returns Array of order IDs
 */
export function useGetOrdersByToken(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getOrdersByToken',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    orderIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get active orders for a specific token
 * @param tokenId - The token ID
 * @returns Array of active order IDs
 */
export function useGetActiveOrdersByToken(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getActiveOrdersByToken',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    orderIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get orders by seller
 * @param seller - The seller's address
 * @returns Array of order IDs
 */
export function useGetOrdersBySeller(seller: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getOrdersBySeller',
    args: seller ? [seller] : undefined,
    query: { enabled: !!seller },
  });

  return {
    orderIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get active orders by seller
 * @param seller - The seller's address
 * @returns Array of active order IDs
 */
export function useGetActiveOrdersBySeller(seller: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getActiveOrdersBySeller',
    args: seller ? [seller] : undefined,
    query: { enabled: !!seller },
  });

  return {
    orderIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get all active orders
 * @returns Array of active order IDs
 */
export function useGetAllActiveOrders() {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getAllActiveOrders',
  });

  return {
    orderIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get the cheapest order for a token
 * @param tokenId - The token ID
 * @returns Cheapest order ID and price
 */
export function useGetCheapestOrder(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getCheapestOrder',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  const [orderId, price] = (data as [bigint, bigint] | undefined) || [0n, 0n];

  return {
    orderId,
    price,
    isLoading,
    error,
  };
}

/**
 * Hook to get market statistics for a token
 * @param tokenId - The token ID
 * @returns Market stats (volume, trades, active orders)
 */
export function useGetMarketStats(tokenId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getMarketStats',
    args: tokenId ? [tokenId] : undefined,
    query: { enabled: !!tokenId },
  });

  const [totalVolume, totalTrades, activeOrderCount] = (data as [bigint, bigint, bigint] | undefined) || [0n, 0n, 0n];

  return {
    totalVolume,
    totalTrades,
    activeOrderCount,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate cost to buy credits
 * @param orderId - The order ID
 * @param amount - Amount to buy
 * @returns Buy cost breakdown (total, fee, seller receives)
 */
export function useCalculateBuyCost(orderId: bigint | undefined, amount: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'calculateBuyCost',
    args: orderId && amount ? [orderId, amount] : undefined,
    query: { enabled: !!orderId && !!amount },
  });

  const [totalCost, fee, sellerReceives] = (data as [bigint, bigint, bigint] | undefined) || [0n, 0n, 0n];

  return {
    totalCost,
    fee,
    sellerReceives,
    isLoading,
    error,
  };
}

/**
 * Hook to get total number of orders
 * @returns Total order count
 */
export function useGetTotalOrders() {
  const { data, isLoading, error } = useReadContract({
    address: CARBON_MARKETPLACE_ADDRESS,
    abi: CARBON_MARKETPLACE_ABI,
    functionName: 'getTotalOrders',
  });

  return {
    totalOrders: data as bigint | undefined,
    isLoading,
    error,
  };
}
