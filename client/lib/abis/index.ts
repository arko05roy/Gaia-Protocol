/**
 * Smart Contract ABIs for Gaia Protocol
 * Extracted from web3/artifacts
 */

import TaskRegistryABI from './TaskRegistry.json';
import FundingPoolABI from './FundingPool.json';
import CarbonCreditMinterABI from './CarbonCreditMinter.json';
import CarbonMarketplaceABI from './CarbonMarketplace.json';
import CollateralManagerABI from './CollateralManager.json';
import VerificationManagerABI from './VerificationManager.json';
import PredictionMarketABI from './PredictionMarket.json';
import DataRegistryABI from './DataRegistry.json';
import GovernanceDAOABI from './GovernanceDAO.json';
import ModelRegistryABI from './ModelRegistry.json';

// OpenZeppelin ABIs
import OZ_IERC20ABI from './OZ_IERC20.json';
import OZ_SafeERC20ABI from './OZ_SafeERC20.json';
import OZ_OwnableABI from './OZ_Ownable.json';
import OZ_PausableABI from './OZ_Pausable.json';
import OZ_ReentrancyGuardABI from './OZ_ReentrancyGuard.json';
import OZ_ERC1155ABI from './OZ_ERC1155.json';
import OZ_IERC1155ABI from './OZ_IERC1155.json';
import OZ_ERC1155HolderABI from './OZ_ERC1155Holder.json';

export {
  TaskRegistryABI,
  FundingPoolABI,
  CarbonCreditMinterABI,
  CarbonMarketplaceABI,
  CollateralManagerABI,
  VerificationManagerABI,
  PredictionMarketABI,
  DataRegistryABI,
  GovernanceDAOABI,
  ModelRegistryABI,
  OZ_IERC20ABI,
  OZ_SafeERC20ABI,
  OZ_OwnableABI,
  OZ_PausableABI,
  OZ_ReentrancyGuardABI,
  OZ_ERC1155ABI,
  OZ_IERC1155ABI,
  OZ_ERC1155HolderABI,
};

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
