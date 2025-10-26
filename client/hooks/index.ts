// Task Registry Hooks
export {
  useCreateTask,
  useGetTask,
  useGetTasks,
  useGetTasksByStatus,
  useGetProposerTasks,
  useGetOperatorTasks,
  useGetTotalTasks,
  useSubmitProof,
  useTaskExists,
  TaskStatus,
  type Task,
} from './useTaskRegistry';

// Funding Pool Hooks
export {
  useFundTask,
  useWithdrawFunding,
  useClaimRefund,
  useGetPool,
  useGetFunderShare,
  useGetFunders,
  useGetFundersWithShares,
  useGetFundingProgress,
  useGetSharePercentage,
  type Pool,
  type FundingProgress,
} from './useFundingPool';

// Carbon Credit Minter Hooks
export {
  useRetireCredits,
  useGetCreditMetadata,
  useGetCirculatingSupply,
  useGetTotalRetired,
  useGetUserRetired,
  useGetBalanceOfBatch,
  useCreditsExist,
  useGetCreditURI,
  type CreditMetadata,
} from './useCarbonCreditMinter';

// Carbon Marketplace Hooks
export {
  useCreateSellOrder,
  useCancelOrder,
  useBuyCredits,
  useGetOrder,
  useGetOrders,
  useGetOrdersByToken,
  useGetActiveOrdersByToken,
  useGetOrdersBySeller,
  useGetActiveOrdersBySeller,
  useGetAllActiveOrders,
  useGetCheapestOrder,
  useGetMarketStats,
  useCalculateBuyCost,
  useGetTotalOrders,
  type Order,
  type MarketStats,
  type BuyCost,
} from './useCarbonMarketplace';

// Collateral Manager Hooks
export {
  useRegisterOperator,
  useAddStake,
  useWithdrawStake,
  useStakeForTask,
  useIsApprovedOperator,
  useGetOperatorStake,
  useGetOperatorTotalStake,
  useGetTaskStake,
  useGetMinimumStakePercentage,
  useGetMinimumOperatorStake,
  StakeStatus,
  type StakeInfo,
} from './useCollateralManager';

// Verification Manager Hooks
export {
  useInitiateVerification,
  useAddValidator,
  useSubmitValidatorVote,
  useIsValidator,
  useGetValidatorReputation,
  useGetRequiredValidators,
  useGetConsensusThreshold,
  useGetVerificationPeriod,
  useGetVerificationStatus,
  useGetValidatorVote,
  useGetTaskValidators,
  useGetAllValidators,
  useGetVerificationManagerOwner,
  type Vote,
} from './useVerificationManager';

// Prediction Market Hooks
export {
  useBuyShares,
  useClaimWinnings,
  useGetMarket,
  useGetPosition,
  useGetMarketCreationFee,
  useGetMarketOdds,
  useCalculateShares,
  useIsMarketResolved,
  useGetResolutionDeadline,
  useGetMarketVolume,
  type Market,
  type Position,
} from './usePredictionMarket';

// Data Registry Hooks
export {
  useAuthorizeResearcher,
  useRevokeResearcher,
  usePublishTaskData,
  useUpdateDataHash,
  useSetDataPrivacy,
  useGetDataEntry,
  useGetDataEntries,
  useQueryByProjectType,
  useQueryByLocation,
  useQueryByContributor,
  useQueryByDateRange,
  useQueryByCO2Range,
  useGetAllPublicEntries,
  useGetDatasetStats,
  useGetStatsByProjectType,
  useIsAuthorizedResearcher,
  useCreateDataEntry,
  type DataEntry,
  type DatasetStats,
  type ProjectTypeStats,
} from './useDataRegistry';

// Governance DAO Hooks
export {
  useCreateProposal,
  useVote,
  useExecuteProposal,
  useCancelProposal,
  useSetVotingPeriod,
  useSetProposalBond,
  useSetQuorum,
  useSetExecutionDelay,
  useGetProposal,
  useGetProposalState,
  useGetVote,
  useGetVotingResults,
  useCheckQuorum,
  useGetTimeRemaining,
  useGetTotalProposals,
  useCanExecute,
  ProposalState,
  type Proposal,
  type Vote as GovernanceVote,
  type VotingResults,
  type QuorumInfo,
  type TimeRemaining,
  type ExecutionInfo,
} from './useGovernanceDAO';

// Model Registry Hooks
export {
  useRegisterModel,
  useUpdateModel,
  useAddModelStake,
  useWithdrawModelStake,
  useRecordPrediction,
  useDeactivateModel,
  useReactivateModel,
  useGetModel,
  useGetModels,
  useGetModelsByOwner,
  useGetPrediction,
  useGetTaskPredictions,
  useGetTopModels,
  useGetModelPerformance,
  useGetActiveModels,
  useGetConsensusPrediction,
  useGetTotalModels,
  useCalculateExpectedReward,
  type Model,
  type Prediction,
  type ModelPerformance,
  type TaskPredictions,
  type ConsensusPrediction,
} from './useModelRegistry';

// ERC20 Approval Hooks
export {
  useGetAllowance,
  useApproveToken,
  useCUSDTokenAddress,
  useGetCUSDBalance,
} from './useERC20Approval';

// ERC1155 Approval Hooks
export {
  useIsApprovedForAll,
  useSetApprovalForAll,
  useCarbonCreditMinterAddress,
} from './useERC1155Approval';
