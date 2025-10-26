import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { DataRegistryABI } from '@/lib/abis';

const DATA_REGISTRY_ABI = DataRegistryABI as any;

export const DATA_REGISTRY_ADDRESS = '0x610178dA211FEF7D417bC0e6FeD39F05609AD788' as const;

export interface DataEntry {
  taskId: bigint;
  projectType: string;
  location: string;
  cost: bigint;
  co2Offset: bigint;
  timestamp: bigint;
  ipfsHash: string;
  isPublic: boolean;
  contributor: string;
  qualityScore: bigint;
}

export interface DatasetStats {
  totalEntries: bigint;
  totalCO2: bigint;
  totalCost: bigint;
  avgCostPerTon: bigint;
}

export interface ProjectTypeStats {
  entryCount: bigint;
  totalCO2: bigint;
  avgCO2: bigint;
}

/**
 * Hook to authorize a researcher for data access
 * @returns Object with authorizeResearcher function and transaction state
 */
export function useAuthorizeResearcher() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const authorizeResearcher = (researcher: string) => {
    writeContract({
      address: DATA_REGISTRY_ADDRESS,
      abi: DATA_REGISTRY_ABI,
      functionName: 'authorizeResearcher',
      args: [researcher],
    });
  };

  return { authorizeResearcher, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to revoke researcher authorization
 * @returns Object with revokeResearcher function and transaction state
 */
export function useRevokeResearcher() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revokeResearcher = (researcher: string) => {
    writeContract({
      address: DATA_REGISTRY_ADDRESS,
      abi: DATA_REGISTRY_ABI,
      functionName: 'revokeResearcher',
      args: [researcher],
    });
  };

  return { revokeResearcher, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to publish verified task data
 * @returns Object with publishTaskData function and transaction state
 */
export function usePublishTaskData() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const publishTaskData = (taskId: bigint, qualityScore: bigint) => {
    writeContract({
      address: DATA_REGISTRY_ADDRESS,
      abi: DATA_REGISTRY_ABI,
      functionName: 'publishTaskData',
      args: [taskId, qualityScore],
    });
  };

  return { publishTaskData, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to update data IPFS hash
 * @returns Object with updateDataHash function and transaction state
 */
export function useUpdateDataHash() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateDataHash = (taskId: bigint, newIpfsHash: string) => {
    writeContract({
      address: DATA_REGISTRY_ADDRESS,
      abi: DATA_REGISTRY_ABI,
      functionName: 'updateDataHash',
      args: [taskId, newIpfsHash],
    });
  };

  return { updateDataHash, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to set data privacy
 * @returns Object with setDataPrivacy function and transaction state
 */
export function useSetDataPrivacy() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setDataPrivacy = (taskId: bigint, isPublic: boolean) => {
    writeContract({
      address: DATA_REGISTRY_ADDRESS,
      abi: DATA_REGISTRY_ABI,
      functionName: 'setDataPrivacy',
      args: [taskId, isPublic],
    });
  };

  return { setDataPrivacy, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to get a single data entry
 * @param taskId - The task ID
 * @returns Data entry and loading state
 */
export function useGetDataEntry(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'getDataEntry',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    dataEntry: data as DataEntry | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get multiple data entries
 * @param taskIds - Array of task IDs
 * @returns Array of data entries and loading state
 */
export function useGetDataEntries(taskIds: bigint[] | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'getDataEntries',
    args: taskIds ? [taskIds] : undefined,
    query: { enabled: !!taskIds && taskIds.length > 0 },
  });

  return {
    dataEntries: (data as DataEntry[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to query entries by project type
 * @param projectType - Project type to filter by
 * @returns Array of task IDs
 */
export function useQueryByProjectType(projectType: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'queryByProjectType',
    args: projectType ? [projectType] : undefined,
    query: { enabled: !!projectType },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to query entries by location
 * @param location - Location to filter by
 * @returns Array of task IDs
 */
export function useQueryByLocation(location: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'queryByLocation',
    args: location ? [location] : undefined,
    query: { enabled: !!location },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to query entries by contributor
 * @param contributor - Contributor address
 * @returns Array of task IDs
 */
export function useQueryByContributor(contributor: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'queryByContributor',
    args: contributor ? [contributor] : undefined,
    query: { enabled: !!contributor },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to query entries by date range
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @returns Array of task IDs
 */
export function useQueryByDateRange(startTime: bigint | undefined, endTime: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'queryByDateRange',
    args: startTime && endTime ? [startTime, endTime] : undefined,
    query: { enabled: !!startTime && !!endTime },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to query entries by CO2 range
 * @param minCO2 - Minimum CO2 offset
 * @param maxCO2 - Maximum CO2 offset
 * @returns Array of task IDs
 */
export function useQueryByCO2Range(minCO2: bigint | undefined, maxCO2: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'queryByCO2Range',
    args: minCO2 && maxCO2 ? [minCO2, maxCO2] : undefined,
    query: { enabled: !!minCO2 && !!maxCO2 },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get all public entries
 * @returns Array of task IDs
 */
export function useGetAllPublicEntries() {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'getAllPublicEntries',
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get dataset statistics
 * @returns Dataset stats (total entries, CO2, cost, average)
 */
export function useGetDatasetStats() {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'getDatasetStats',
  });

  const [totalEntries, totalCO2, totalCost, avgCostPerTon] = (data as [bigint, bigint, bigint, bigint] | undefined) || [0n, 0n, 0n, 0n];

  return {
    totalEntries,
    totalCO2,
    totalCost,
    avgCostPerTon,
    isLoading,
    error,
  };
}

/**
 * Hook to get statistics by project type
 * @param projectType - Project type
 * @returns Project type stats
 */
export function useGetStatsByProjectType(projectType: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'getStatsByProjectType',
    args: projectType ? [projectType] : undefined,
    query: { enabled: !!projectType },
  });

  const [entryCount, totalCO2, avgCO2] = (data as [bigint, bigint, bigint] | undefined) || [0n, 0n, 0n];

  return {
    entryCount,
    totalCO2,
    avgCO2,
    isLoading,
    error,
  };
}

/**
 * Hook to check if address is authorized researcher
 * @param researcher - Researcher address
 * @returns Whether researcher is authorized
 */
export function useIsAuthorizedResearcher(researcher: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: DATA_REGISTRY_ADDRESS,
    abi: DATA_REGISTRY_ABI,
    functionName: 'isAuthorizedResearcher',
    args: researcher ? [researcher] : undefined,
    query: { enabled: !!researcher },
  });

  return {
    isAuthorized: data as boolean | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to update data hash for an existing entry
 * @returns Object with updateDataHash function and transaction state
 */
export function useCreateDataEntry() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createDataEntry = (
    taskId: bigint,
    newIpfsHash: string
  ) => {
    writeContract({
      address: DATA_REGISTRY_ADDRESS,
      abi: DATA_REGISTRY_ABI,
      functionName: 'updateDataHash',
      args: [taskId, newIpfsHash],
    });
  };

  return { createDataEntry, hash, isPending, isConfirming, isSuccess };
}
