import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { TaskRegistryABI as TaskRegistryABIImport } from '@/lib/abis';

const TASK_REGISTRY_ABI_SRC = (TaskRegistryABIImport as any)?.default || TaskRegistryABIImport || [];
const TASK_REGISTRY_ABI = ((TASK_REGISTRY_ABI_SRC as any)?.abi ?? TASK_REGISTRY_ABI_SRC) as any;

export const TASK_REGISTRY_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as const;

export enum TaskStatus {
  Proposed = 0,
  Funded = 1,
  InProgress = 2,
  UnderReview = 3,
  Verified = 4,
  Rejected = 5,
}

export interface Task {
  id: bigint;
  proposer: string;
  description: string;
  estimatedCost: bigint;
  expectedCO2: bigint;
  location: string;
  deadline: bigint;
  proofRequirements: string;
  ipfsHash: string;
  status: TaskStatus;
  createdAt: bigint;
  assignedOperator: string;
  actualCO2: bigint;
  proofHash: string;
}

/**
 * Hook to create a new environmental task
 * @returns Object with createTask function and transaction state
 */
export function useCreateTask() {
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ hash });

  const createTask = async (
    description: string,
    estimatedCost: bigint,
    expectedCO2: bigint,
    location: string,
    deadline: bigint,
    proofRequirements: string,
    ipfsHash: string
  ) => {
    try {
      // Validate inputs
      if (!description || !location || !proofRequirements) {
        throw new Error('Description, location, and proof requirements are required');
      }
      if (estimatedCost <= 0n) {
        throw new Error('Estimated cost must be greater than 0');
      }
      if (expectedCO2 <= 0n) {
        throw new Error('Expected CO2 must be greater than 0');
      }
      if (deadline <= BigInt(Math.floor(Date.now() / 1000))) {
        throw new Error('Deadline must be in the future');
      }

      console.log('Creating task with params:', {
        description,
        estimatedCost: estimatedCost.toString(),
        expectedCO2: expectedCO2.toString(),
        location,
        deadline: deadline.toString(),
        proofRequirements,
        ipfsHash,
        contractAddress: TASK_REGISTRY_ADDRESS,
      });

      const writeParams: any = {
        address: TASK_REGISTRY_ADDRESS as `0x${string}`,
        abi: TASK_REGISTRY_ABI,
        functionName: 'createTask',
        args: [description, estimatedCost, expectedCO2, location, deadline, proofRequirements, ipfsHash],
        gas: 5000000n,
      };

      writeContract(writeParams);
    } catch (err) {
      console.error('Error in createTask:', err);
      throw err;
    }
  };

  const error = writeError || receiptError;
  if (error) {
    console.error('Transaction error:', error);
  }

  return { createTask, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Hook to fetch a single task by ID
 * @param taskId - The ID of the task to fetch
 * @returns Task data and loading state
 */
export function useGetTask(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: TASK_REGISTRY_ADDRESS,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getTask',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  // The getTask function returns a tuple in some ABIs. Normalize to Task object.
  let mappedTask: Task | undefined = undefined;
  if (data) {
    const t: any = data as any;
    if (Array.isArray(t)) {
      mappedTask = {
        id: BigInt(t[0]),
        proposer: t[1],
        description: t[2],
        estimatedCost: BigInt(t[3]),
        expectedCO2: BigInt(t[4]),
        location: t[5],
        deadline: BigInt(t[6]),
        proofRequirements: t[7],
        ipfsHash: t[8],
        status: Number(t[9]) as TaskStatus,
        createdAt: BigInt(t[10]),
        assignedOperator: t[11],
        actualCO2: BigInt(t[12] ?? 0),
        proofHash: t[13] || '',
      };
    } else {
      mappedTask = t as Task;
    }
  }

  return {
    task: mappedTask,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch multiple tasks by their IDs
 * @param taskIds - Array of task IDs to fetch
 * @returns Array of tasks and loading state
 */
export function useGetTasks(taskIds: bigint[] | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: TASK_REGISTRY_ADDRESS,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getTasks',
    args: taskIds ? [taskIds] : undefined,
    query: { enabled: !!taskIds && taskIds.length > 0 },
  });

  return {
    tasks: (data as Task[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to fetch tasks by status
 * @param status - The TaskStatus to filter by
 * @returns Array of task IDs and loading state
 */
export function useGetTasksByStatus(status: TaskStatus | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: TASK_REGISTRY_ADDRESS,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getTasksByStatus',
    args: status !== undefined ? [status] : undefined,
    query: { enabled: status !== undefined },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to fetch tasks created by a specific proposer
 * @param proposer - The address of the proposer
 * @returns Array of task IDs and loading state
 */
export function useGetProposerTasks(proposer: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: TASK_REGISTRY_ADDRESS,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getProposerTasks',
    args: proposer ? [proposer] : undefined,
    query: { enabled: !!proposer },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to fetch tasks assigned to a specific operator
 * @param operator - The address of the operator
 * @returns Array of task IDs and loading state
 */
export function useGetOperatorTasks(operator: string | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: TASK_REGISTRY_ADDRESS,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getOperatorTasks',
    args: operator ? [operator] : undefined,
    query: { enabled: !!operator },
  });

  return {
    taskIds: (data as bigint[] | undefined) || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get total number of tasks
 * @returns Total task count
 */
export function useGetTotalTasks() {
  const { data, isLoading, error } = useReadContract({
    address: TASK_REGISTRY_ADDRESS,
    abi: TASK_REGISTRY_ABI,
    functionName: 'getTotalTasks',
  });

  return {
    totalTasks: data as bigint | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to submit proof of work for a task
 * @returns Object with submitProof function and transaction state
 */
export function useSubmitProof() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const submitProof = (taskId: bigint, proofHash: string, actualCO2: bigint) => {
    writeContract({
      address: TASK_REGISTRY_ADDRESS,
      abi: TASK_REGISTRY_ABI,
      functionName: 'submitProof',
      args: [taskId, proofHash, actualCO2],
    });
  };

  return { submitProof, hash, isPending, isConfirming, isSuccess };
}

/**
 * Hook to check if a task exists
 * @param taskId - The ID of the task to check
 * @returns Boolean indicating if task exists
 */
export function useTaskExists(taskId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: TASK_REGISTRY_ADDRESS,
    abi: TASK_REGISTRY_ABI,
    functionName: 'taskExists_',
    args: taskId ? [taskId] : undefined,
    query: { enabled: !!taskId },
  });

  return {
    exists: data as boolean | undefined,
    isLoading,
    error,
  };
}
