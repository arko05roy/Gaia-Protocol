/**
 * Smart Contract ABIs for Gaia Protocol
 * Extracted from web3/artifacts
 */

import TaskRegistryJSON from './TaskRegistry.json';
import FundingPoolJSON from './FundingPool.json';
import CarbonCreditMinterJSON from './CarbonCreditMinter.json';
import CarbonMarketplaceJSON from './CarbonMarketplace.json';
import CollateralManagerJSON from './CollateralManager.json';
import VerificationManagerJSON from './VerificationManager.json';
import PredictionMarketJSON from './PredictionMarket.json';
import DataRegistryJSON from './DataRegistry.json';
import GovernanceDAOJSON from './GovernanceDAO.json';
import ModelRegistryJSON from './ModelRegistry.json';

// OpenZeppelin ABIs
import OZ_IERC20JSON from './OZ_IERC20.json';
import OZ_SafeERC20JSON from './OZ_SafeERC20.json';
import OZ_OwnableJSON from './OZ_Ownable.json';
import OZ_PausableJSON from './OZ_Pausable.json';
import OZ_ReentrancyGuardJSON from './OZ_ReentrancyGuard.json';
import OZ_ERC1155JSON from './OZ_ERC1155.json';
import OZ_IERC1155JSON from './OZ_IERC1155.json';
import OZ_ERC1155HolderJSON from './OZ_ERC1155Holder.json';

function asAbi(mod: any): any[] {
  const m = (mod as any)?.default ?? mod;
  return (m?.abi ?? m) as any[];
}

export const TaskRegistryABI = asAbi(TaskRegistryJSON);
export const FundingPoolABI = asAbi(FundingPoolJSON);
export const CarbonCreditMinterABI = asAbi(CarbonCreditMinterJSON);
export const CarbonMarketplaceABI = asAbi(CarbonMarketplaceJSON);
export const CollateralManagerABI = asAbi(CollateralManagerJSON);
export const VerificationManagerABI = asAbi(VerificationManagerJSON);
export const PredictionMarketABI = asAbi(PredictionMarketJSON);
export const DataRegistryABI = asAbi(DataRegistryJSON);
export const GovernanceDAOABI = asAbi(GovernanceDAOJSON);
export const ModelRegistryABI = asAbi(ModelRegistryJSON);
export const OZ_IERC20ABI = asAbi(OZ_IERC20JSON);
export const OZ_SafeERC20ABI = asAbi(OZ_SafeERC20JSON);
export const OZ_OwnableABI = asAbi(OZ_OwnableJSON);
export const OZ_PausableABI = asAbi(OZ_PausableJSON);
export const OZ_ReentrancyGuardABI = asAbi(OZ_ReentrancyGuardJSON);
export const OZ_ERC1155ABI = asAbi(OZ_ERC1155JSON);
export const OZ_IERC1155ABI = asAbi(OZ_IERC1155JSON);
export const OZ_ERC1155HolderABI = asAbi(OZ_ERC1155HolderJSON);

export const ABIS = {
  TaskRegistry: TaskRegistryABI,
  FundingPool: FundingPoolABI,
  CarbonCreditMinter: CarbonCreditMinterABI,
  CarbonMarketplace: CarbonMarketplaceABI,
  CollateralManager: CollateralManagerABI,
  VerificationManager: VerificationManagerABI,
  PredictionMarket: PredictionMarketABI,
  DataRegistry: DataRegistryABI,
  GovernanceDAO: GovernanceDAOABI,
  ModelRegistry: ModelRegistryABI,
};

export const OZ_ABIS = {
  IERC20: OZ_IERC20ABI,
  SafeERC20: OZ_SafeERC20ABI,
  Ownable: OZ_OwnableABI,
  Pausable: OZ_PausableABI,
  ReentrancyGuard: OZ_ReentrancyGuardABI,
  ERC1155: OZ_ERC1155ABI,
  IERC1155: OZ_IERC1155ABI,
  ERC1155Holder: OZ_ERC1155HolderABI,
};
