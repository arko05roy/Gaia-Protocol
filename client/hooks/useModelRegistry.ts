import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ModelRegistryABI } from '@/lib/abis';

const MODEL_REGISTRY_ABI = ModelRegistryABI as any;

export const MODEL_REGISTRY_ADDRESS = '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e' as const;

export interface Model {
  id: bigint;
  owner: string;
  name: string;
  description: string;
  ipfsHash: string;
  architecture: string;
  stake: bigint;
  registeredAt: bigint;
  isActive: boolean;
  totalPredictions: bigint;
  correctPredictions: bigint;
  accuracy: bigint;
  reputationScore: bigint;
  totalRewardsEarned: bigint;
}

export interface Prediction {
  modelId: bigint;
  taskId: bigint;
  predictedOutcome: boolean;
  confidence: bigint;
  timestamp: bigint;
  isResolved: boolean;
  wasCorrect: boolean;
}

export interface ModelPerformance {
  totalPredictions: bigint;
  correctPredictions: bigint;
  accuracy: bigint;
  reputationScore: bigint;
}

export interface TaskPredictions {
  modelIds: bigint[];
  predictionData: Prediction[];
}

export interface ConsensusPrediction {
  predictedOutcome: boolean;
  confidence: bigint;
  agreementCount: bigint;
}

/**
 * Hook to register a new AI model
 * @returns Object with registerModel function and transaction state
 */
export function useRegisterModel() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerModel = (
    name: string,
    description: string,
    ipfsHash: string,
    architecture: string,
    stakeAmount: bigint
  ) => {
    writeContract({
      address: MODEL_REGISTRY_ADDRESS,
      abi: MODEL_REGISTRY_ABI,
      functionName: 'registerModel',
      args: [name, description, ipfsHash, architecture, stakeAmount],
    });
  };

  return { registerModel, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to update model IPFS hash
 * @returns Object with updateModel function and transaction state
 */
export function useUpdateModel() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateModel = (modelId: bigint, newIpfsHash: string) => {
    writeContract({
      address: MODEL_REGISTRY_ADDRESS,
      abi: MODEL_REGISTRY_ABI,
      functionName: 'updateModel',
      args: [modelId, newIpfsHash],
    });
  };

  return { updateModel, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to add stake to a model
 * @returns Object with addStake function and transaction state
 */
export function useAddModelStake() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addStake = (modelId: bigint, amount: bigint) => {
    writeContract({
      address: MODEL_REGISTRY_ADDRESS,
      abi: MODEL_REGISTRY_ABI,
      functionName: 'addStake',
      args: [modelId, amount],
    });
  };

  return { addStake, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to withdraw stake from a model
 * @returns Object with withdrawStake function and transaction state
 */
export function useWithdrawModelStake() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdrawStake = (modelId: bigint, amount: bigint) => {
    writeContract({
      address: MODEL_REGISTRY_ADDRESS,
      abi: MODEL_REGISTRY_ABI,
      functionName: 'withdrawStake',
      args: [modelId, amount],
    });
  };

  return { withdrawStake, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to record a prediction for a task
 * @returns Object with recordPrediction function and transaction state
 */
export function useRecordPrediction() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const recordPrediction = (
    modelId: bigint,
    taskId: bigint,
    predictedOutcome: boolean,
    confidence: bigint
  ) => {
    writeContract({
      address: MODEL_REGISTRY_ADDRESS,
      abi: MODEL_REGISTRY_ABI,
      functionName: 'recordPrediction',
      args: [modelId, taskId, predictedOutcome, confidence],
    });
  };

  return { recordPrediction, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to deactivate a model
 * @returns Object with deactivateModel function and transaction state
 */
export function useDeactivateModel() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deactivateModel = (modelId: bigint, reason: string) => {
    writeContract({
      address: MODEL_REGISTRY_ADDRESS,
      abi: MODEL_REGISTRY_ABI,
      functionName: 'deactivateModel',
      args: [modelId, reason],
    });
  };

  return { deactivateModel, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to reactivate a model
 * @returns Object with reactivateModel function and transaction state
 */
export function useReactivateModel() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const reactivateModel = (modelId: bigint) => {
    writeContract({
      address: MODEL_REGISTRY_ADDRESS,
      abi: MODEL_REGISTRY_ABI,
      functionName: 'reactivateModel',
      args: [modelId],
    });
  };

  return { reactivateModel, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to get model details
 * @param modelId - Model ID
 * @returns Model data and loading state
 */
export function useGetModel(modelId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getModel',
    args: modelId ? [modelId] : undefined,
    query: { enabled: !!modelId },
  });

  return {
    model: data as Model | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get multiple models
 * @param modelIds - Array of model IDs
 * @returns Array of models and loading state
 */
export function useGetModels(modelIds: bigint[] | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getModels',
    args: modelIds ? [modelIds] : undefined,
    query: { enabled: !!modelIds && modelIds.length > 0 },
  });

  return {
    models: (data as Model[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get models by owner
 * @param owner - Owner address
 * @returns Array of model IDs
 */
export function useGetModelsByOwner(owner: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getModelsByOwner',
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  });

  return {
    modelIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get prediction details
 * @param taskId - Task ID
 * @param modelId - Model ID
 * @returns Prediction data and loading state
 */
export function useGetPrediction(taskId: bigint | undefined, modelId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getPrediction',
    args: taskId && modelId ? [taskId, modelId] : undefined,
    query: { enabled: !!taskId && !!modelId },
  });

  return {
    prediction: data as Prediction | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get all predictions for a task
 * @param taskId - Task ID
 * @returns Model IDs and prediction data
 */
export function useGetTaskPredictions(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getTaskPredictions',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const [modelIds, predictionData] = (data as [bigint[], Prediction[]] | undefined) || [[], []];

  return {
    modelIds,
    predictionData,
    isLoading,
    error,
  };
}

/**
 * Hook to get top performing models
 * @param count - Number of models to return
 * @returns Array of top model IDs
 */
export function useGetTopModels(count: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getTopModels',
    args: count ? [count] : undefined,
    query: { enabled: !!count },
  });

  return {
    modelIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get model performance metrics
 * @param modelId - Model ID
 * @returns Performance metrics
 */
export function useGetModelPerformance(modelId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getModelPerformance',
    args: modelId ? [modelId] : undefined,
    query: { enabled: !!modelId },
  });

  const [totalPredictions, correctPredictions, accuracy, reputationScore] = (data as [bigint, bigint, bigint, bigint] | undefined) || [0n, 0n, 0n, 0n];

  return {
    totalPredictions,
    correctPredictions,
    accuracy,
    reputationScore,
    isLoading,
    error,
  };
}

/**
 * Hook to get all active models
 * @returns Array of active model IDs
 */
export function useGetActiveModels() {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getActiveModels',
  });

  return {
    modelIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get consensus prediction for a task
 * @param taskId - Task ID
 * @returns Consensus prediction data
 */
export function useGetConsensusPrediction(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getConsensusPrediction',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  const [predictedOutcome, confidence, agreementCount] = (data as [boolean, bigint, bigint] | undefined) || [false, 0n, 0n];

  return {
    predictedOutcome,
    confidence,
    agreementCount,
    isLoading,
    error,
  };
}

/**
 * Hook to get total number of models
 * @returns Total model count
 */
export function useGetTotalModels() {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'getTotalModels',
  });

  return {
    totalModels: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate expected reward for a prediction
 * @param modelId - Model ID
 * @param confidence - Confidence level
 * @returns Expected reward amount
 */
export function useCalculateExpectedReward(modelId: bigint | undefined, confidence: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: MODEL_REGISTRY_ADDRESS,
    abi: MODEL_REGISTRY_ABI,
    functionName: 'calculateExpectedReward',
    args: modelId && confidence ? [modelId, confidence] : undefined,
    query: { enabled: !!modelId && !!confidence },
  });

  return {
    expectedReward: data as bigint | undefined,
    isLoading,
    error,
  };
}
