// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITaskRegistry {
    enum TaskStatus { Proposed, Funded, InProgress, UnderReview, Verified, Rejected }
    
    function getTask(uint256 taskId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        uint256 estimatedCost,
        uint256 expectedCO2,
        string memory location,
        uint256 deadline,
        string memory proofRequirements,
        string memory ipfsHash,
        TaskStatus status,
        uint256 createdAt,
        address assignedOperator,
        uint256 actualCO2,
        string memory proofHash
    );
    
    function markAsFunded(uint256 taskId) external;
}

/**
 * @title FundingPool
 * @notice Manages funding for environmental tasks
 * @dev Handles deposits, tracks funder shares, releases payments, and processes refunds
 */
contract FundingPool is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct Pool {
        uint256 totalFunded;           // Total cUSD deposited
        uint256 fundersCount;          // Number of unique funders
        bool paymentReleased;          // Has payment been sent to operator
        bool refundsEnabled;           // Can funders claim refunds
    }
    
    // ============ State Variables ============
    
    IERC20 public immutable cUSD;
    ITaskRegistry public taskRegistry;
    
    // Pool data per task
    mapping(uint256 => Pool) public pools;
    
    // Funder shares: taskId => funder => amount contributed
    mapping(uint256 => mapping(address => uint256)) public funderShares;
    
    // Funder list per task for enumeration
    mapping(uint256 => address[]) private _funders;
    
    // Platform fee (2% = 200 basis points)
    uint256 public platformFeeBps = 200;
    uint256 public constant MAX_FEE_BPS = 500; // Max 5%
    address public treasuryAddress;
    
    // Withdrawal penalty for early exit (2% = 200 basis points)
    uint256 public withdrawalPenaltyBps = 200;
    
    // ============ Events ============
    
    event FundingReceived(
        uint256 indexed taskId,
        address indexed funder,
        uint256 amount
    );
    
    event TargetReached(
        uint256 indexed taskId,
        uint256 totalFunded
    );
    
    event PaymentReleased(
        uint256 indexed taskId,
        address indexed operator,
        uint256 amount,
        uint256 platformFee
    );
    
    event RefundsEnabled(
        uint256 indexed taskId
    );
    
    event RefundClaimed(
        uint256 indexed taskId,
        address indexed funder,
        uint256 amount
    );
    
    event FundingWithdrawn(
        uint256 indexed taskId,
        address indexed funder,
        uint256 amount,
        uint256 penalty
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // ============ Constructor ============
    
    constructor(address _cUSD, address _taskRegistry, address _treasury) Ownable(msg.sender) {
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_taskRegistry != address(0), "Invalid registry address");
        require(_treasury != address(0), "Invalid treasury address");
        
        cUSD = IERC20(_cUSD);
        taskRegistry = ITaskRegistry(_taskRegistry);
        treasuryAddress = _treasury;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update platform fee
     * @param newFeeBps New fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(oldFee, newFeeBps);
    }
    
    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasuryAddress = newTreasury;
    }
    
    /**
     * @notice Update withdrawal penalty
     * @param newPenaltyBps New penalty in basis points
     */
    function setWithdrawalPenalty(uint256 newPenaltyBps) external onlyOwner {
        require(newPenaltyBps <= 1000, "Penalty too high"); // Max 10%
        withdrawalPenaltyBps = newPenaltyBps;
    }
    
    /**
     * @notice Pause funding operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause funding operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Fund a task with cUSD
     * @param taskId ID of the task to fund
     * @param amount Amount of cUSD to contribute (18 decimals)
     */
    function fundTask(uint256 taskId, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(amount > 0, "Amount must be positive");
        
        // Get task details
        (
            ,
            ,
            ,
            uint256 estimatedCost,
            ,
            ,
            ,
            ,
            ,
            ITaskRegistry.TaskStatus status,
            ,
            ,
            ,
        ) = taskRegistry.getTask(taskId);
        
        require(status == ITaskRegistry.TaskStatus.Proposed, "Task not in Proposed status");
        
        Pool storage pool = pools[taskId];
        require(pool.totalFunded + amount <= estimatedCost, "Exceeds funding target");
        
        // Transfer cUSD from funder
        cUSD.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update pool
        if (funderShares[taskId][msg.sender] == 0) {
            pool.fundersCount++;
            _funders[taskId].push(msg.sender);
        }
        
        pool.totalFunded += amount;
        funderShares[taskId][msg.sender] += amount;
        
        emit FundingReceived(taskId, msg.sender, amount);
        
        // Check if target reached
        if (pool.totalFunded >= estimatedCost) {
            taskRegistry.markAsFunded(taskId);
            emit TargetReached(taskId, pool.totalFunded);
        }
    }
    
    /**
     * @notice Withdraw funding before task is fully funded (with penalty)
     * @param taskId ID of the task
     */
    function withdrawFunding(uint256 taskId) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        // Get task status
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ITaskRegistry.TaskStatus status,
            ,
            ,
            ,
        ) = taskRegistry.getTask(taskId);
        
        require(status == ITaskRegistry.TaskStatus.Proposed, "Can only withdraw from Proposed tasks");
        
        uint256 shareAmount = funderShares[taskId][msg.sender];
        require(shareAmount > 0, "No shares to withdraw");
        
        // Calculate penalty
        uint256 penalty = (shareAmount * withdrawalPenaltyBps) / 10000;
        uint256 refundAmount = shareAmount - penalty;
        
        // Update state
        Pool storage pool = pools[taskId];
        pool.totalFunded -= shareAmount;
        pool.fundersCount--;
        funderShares[taskId][msg.sender] = 0;
        
        // Transfer funds
        cUSD.safeTransfer(msg.sender, refundAmount);
        if (penalty > 0) {
            cUSD.safeTransfer(treasuryAddress, penalty);
        }
        
        emit FundingWithdrawn(taskId, msg.sender, refundAmount, penalty);
    }
    
    /**
     * @notice Release payment to operator after verification (called by VerificationManager)
     * @param taskId ID of the verified task
     */
    function releasePayment(uint256 taskId) external nonReentrant {
        Pool storage pool = pools[taskId];
        require(!pool.paymentReleased, "Payment already released");
        require(pool.totalFunded > 0, "No funds to release");
        
        // Get task details
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ITaskRegistry.TaskStatus status,
            ,
            address operator,
            ,
        ) = taskRegistry.getTask(taskId);
        
        require(status == ITaskRegistry.TaskStatus.Verified, "Task not verified");
        require(operator != address(0), "No operator assigned");
        
        pool.paymentReleased = true;
        
        // Calculate platform fee
        uint256 platformFee = (pool.totalFunded * platformFeeBps) / 10000;
        uint256 operatorPayment = pool.totalFunded - platformFee;
        
        // Transfer funds
        cUSD.safeTransfer(operator, operatorPayment);
        if (platformFee > 0) {
            cUSD.safeTransfer(treasuryAddress, platformFee);
        }
        
        emit PaymentReleased(taskId, operator, operatorPayment, platformFee);
    }
    
    /**
     * @notice Enable refunds for a failed/rejected task (called by VerificationManager)
     * @param taskId ID of the task
     */
    function enableRefunds(uint256 taskId) external {
        Pool storage pool = pools[taskId];
        require(!pool.refundsEnabled, "Refunds already enabled");
        
        // Get task status
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ITaskRegistry.TaskStatus status,
            ,
            ,
            ,
        ) = taskRegistry.getTask(taskId);
        
        require(status == ITaskRegistry.TaskStatus.Rejected, "Task not rejected");
        
        pool.refundsEnabled = true;
        emit RefundsEnabled(taskId);
    }
    
    /**
     * @notice Claim refund for a failed task
     * @param taskId ID of the task
     */
    function claimRefund(uint256 taskId) external nonReentrant {
        Pool storage pool = pools[taskId];
        require(pool.refundsEnabled, "Refunds not enabled");
        
        uint256 shareAmount = funderShares[taskId][msg.sender];
        require(shareAmount > 0, "No shares to refund");
        
        // Update state
        funderShares[taskId][msg.sender] = 0;
        
        // Transfer refund (full amount, no penalty)
        cUSD.safeTransfer(msg.sender, shareAmount);
        
        emit RefundClaimed(taskId, msg.sender, shareAmount);
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get pool information for a task
     * @param taskId ID of the task
     * @return totalFunded Total amount funded
     * @return fundersCount Number of unique funders
     * @return paymentReleased Whether payment has been released
     * @return refundsEnabled Whether refunds are enabled
     */
    function getPool(uint256 taskId) 
        external 
        view 
        returns (
            uint256 totalFunded,
            uint256 fundersCount,
            bool paymentReleased,
            bool refundsEnabled
        ) 
    {
        Pool memory pool = pools[taskId];
        return (
            pool.totalFunded,
            pool.fundersCount,
            pool.paymentReleased,
            pool.refundsEnabled
        );
    }
    
    /**
     * @notice Get funder's contribution to a task
     * @param taskId ID of the task
     * @param funder Address of the funder
     * @return amount Amount contributed by the funder
     */
    function getFunderShare(uint256 taskId, address funder) 
        external 
        view 
        returns (uint256) 
    {
        return funderShares[taskId][funder];
    }
    
    /**
     * @notice Get all funders for a task
     * @param taskId ID of the task
     * @return Array of funder addresses
     */
    function getFunders(uint256 taskId) 
        external 
        view 
        returns (address[] memory) 
    {
        return _funders[taskId];
    }
    
    /**
     * @notice Get funders and their shares for a task
     * @param taskId ID of the task
     * @return funders Array of funder addresses
     * @return shares Array of corresponding share amounts
     */
    function getFundersWithShares(uint256 taskId) 
        external 
        view 
        returns (address[] memory funders, uint256[] memory shares) 
    {
        address[] memory fundersList = _funders[taskId];
        uint256[] memory sharesList = new uint256[](fundersList.length);
        
        for (uint256 i = 0; i < fundersList.length; i++) {
            sharesList[i] = funderShares[taskId][fundersList[i]];
        }
        
        return (fundersList, sharesList);
    }
    
    /**
     * @notice Get funding progress for a task
     * @param taskId ID of the task
     * @return funded Amount currently funded
     * @return target Target funding amount
     * @return percentage Funding percentage (basis points, 10000 = 100%)
     */
    function getFundingProgress(uint256 taskId) 
        external 
        view 
        returns (uint256 funded, uint256 target, uint256 percentage) 
    {
        (
            ,
            ,
            ,
            uint256 estimatedCost,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
        ) = taskRegistry.getTask(taskId);
        
        funded = pools[taskId].totalFunded;
        target = estimatedCost;
        percentage = target > 0 ? (funded * 10000) / target : 0;
        
        return (funded, target, percentage);
    }
    
    /**
     * @notice Calculate expected share percentage for a funder
     * @param taskId ID of the task
     * @param funder Address of the funder
     * @return Share percentage in basis points (10000 = 100%)
     */
    function getSharePercentage(uint256 taskId, address funder) 
        external 
        view 
        returns (uint256) 
    {
        uint256 totalFunded = pools[taskId].totalFunded;
        if (totalFunded == 0) return 0;
        
        uint256 funderAmount = funderShares[taskId][funder];
        return (funderAmount * 10000) / totalFunded;
    }
}