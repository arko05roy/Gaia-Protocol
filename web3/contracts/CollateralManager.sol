// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    
    function assignOperator(uint256 taskId, address operator) external;
}

/**
 * @title CollateralManager
 * @notice Manages operator collateral staking and slashing
 * @dev Operators must stake collateral to accept tasks, which can be slashed for fraud
 */
contract CollateralManager is Ownable, Pausable, ReentrancyGuard {
    
    // ============ Enums ============
    
    enum StakeStatus {
        None,
        Locked,
        Released,
        Slashed
    }
    
    // ============ Structs ============
    
    struct StakeInfo {
        address operator;
        uint256 amount;          // Amount locked in native token (CELO/ETH)
        uint256 lockedAt;
        StakeStatus status;
    }
    
    // ============ State Variables ============
    
    ITaskRegistry public taskRegistry;
    address public treasuryAddress;
    address public verificationManagerAddress;
    
    // Operator management
    mapping(address => bool) public approvedOperators;
    mapping(address => uint256) public operatorStake;        // Available stake
    mapping(address => uint256) public operatorTotalStake;   // Total staked (including locked)
    
    // Task stakes
    mapping(uint256 => StakeInfo) public taskStakes;
    
    // Parameters
    uint256 public minimumStakePercentage = 1000;  // 10% in basis points
    uint256 public minimumOperatorStake = 1 ether; // Minimum initial stake
    
    // ============ Events ============
    
    event OperatorRegistered(address indexed operator, uint256 amount);
    
    event StakeAdded(address indexed operator, uint256 amount);
    
    event StakeWithdrawn(address indexed operator, uint256 amount);
    
    event StakedForTask(
        uint256 indexed taskId,
        address indexed operator,
        uint256 amount
    );
    
    event StakeReleased(
        uint256 indexed taskId,
        address indexed operator,
        uint256 amount
    );
    
    event StakeSlashed(
        uint256 indexed taskId,
        address indexed operator,
        uint256 amount,
        string reason
    );
    
    event OperatorBanned(address indexed operator, string reason);
    
    // ============ Constructor ============
    
    constructor(
        address _taskRegistry,
        address _treasury
    ) Ownable(msg.sender) {
        require(_taskRegistry != address(0), "Invalid registry address");
        require(_treasury != address(0), "Invalid treasury address");
        
        taskRegistry = ITaskRegistry(_taskRegistry);
        treasuryAddress = _treasury;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set verification manager address
     * @param _verificationManager Address of VerificationManager
     */
    function setVerificationManager(address _verificationManager) external onlyOwner {
        require(_verificationManager != address(0), "Invalid address");
        verificationManagerAddress = _verificationManager;
    }
    
    /**
     * @notice Update minimum stake percentage
     * @param newPercentageBps New percentage in basis points
     */
    function setMinimumStakePercentage(uint256 newPercentageBps) external onlyOwner {
        require(newPercentageBps <= 5000, "Max 50%"); // Max 50%
        minimumStakePercentage = newPercentageBps;
    }
    
    /**
     * @notice Update minimum operator stake
     * @param newMinimum New minimum stake amount
     */
    function setMinimumOperatorStake(uint256 newMinimum) external onlyOwner {
        minimumOperatorStake = newMinimum;
    }
    
    /**
     * @notice Manually ban an operator
     * @param operator Address to ban
     * @param reason Reason for ban
     */
    function banOperator(address operator, string calldata reason) external onlyOwner {
        approvedOperators[operator] = false;
        emit OperatorBanned(operator, reason);
    }
    
    /**
     * @notice Pause operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Operator Functions ============
    
    /**
     * @notice Register as an operator by staking collateral
     */
    function registerOperator() external payable whenNotPaused nonReentrant {
        require(!approvedOperators[msg.sender], "Already registered");
        require(msg.value >= minimumOperatorStake, "Insufficient stake");
        
        approvedOperators[msg.sender] = true;
        operatorStake[msg.sender] = msg.value;
        operatorTotalStake[msg.sender] = msg.value;
        
        emit OperatorRegistered(msg.sender, msg.value);
    }
    
    /**
     * @notice Add more stake to operator account
     */
    function addStake() external payable whenNotPaused nonReentrant {
        require(approvedOperators[msg.sender], "Not registered");
        require(msg.value > 0, "Amount must be positive");
        
        operatorStake[msg.sender] += msg.value;
        operatorTotalStake[msg.sender] += msg.value;
        
        emit StakeAdded(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw available stake
     * @param amount Amount to withdraw
     */
    function withdrawStake(uint256 amount) external nonReentrant {
        require(approvedOperators[msg.sender], "Not registered");
        require(amount > 0, "Amount must be positive");
        require(operatorStake[msg.sender] >= amount, "Insufficient available stake");
        
        // Ensure minimum stake remains
        uint256 remaining = operatorStake[msg.sender] - amount;
        require(remaining >= minimumOperatorStake || remaining == 0, "Below minimum stake");
        
        operatorStake[msg.sender] -= amount;
        operatorTotalStake[msg.sender] -= amount;
        
        // If withdrawing all, deregister
        if (operatorStake[msg.sender] == 0) {
            approvedOperators[msg.sender] = false;
        }
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit StakeWithdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Stake collateral for a task and assign operator
     * @param taskId ID of the task to accept
     */
    function stakeForTask(uint256 taskId) external whenNotPaused nonReentrant {
        require(approvedOperators[msg.sender], "Not registered operator");
        
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
            address assignedOperator,
            ,
        ) = taskRegistry.getTask(taskId);
        
        require(status == ITaskRegistry.TaskStatus.Funded, "Task not funded");
        require(assignedOperator == address(0), "Task already assigned");
        require(taskStakes[taskId].status == StakeStatus.None, "Stake already exists");
        
        // Calculate required stake
        uint256 requiredStake = (estimatedCost * minimumStakePercentage) / 10000;
        require(operatorStake[msg.sender] >= requiredStake, "Insufficient available stake");
        
        // Lock stake
        operatorStake[msg.sender] -= requiredStake;
        
        taskStakes[taskId] = StakeInfo({
            operator: msg.sender,
            amount: requiredStake,
            lockedAt: block.timestamp,
            status: StakeStatus.Locked
        });
        
        // Assign operator in TaskRegistry
        taskRegistry.assignOperator(taskId, msg.sender);
        
        emit StakedForTask(taskId, msg.sender, requiredStake);
    }
    
    // ============ Verification Manager Functions ============
    
    modifier onlyVerificationManager() {
        require(msg.sender == verificationManagerAddress, "Only VerificationManager");
        _;
    }
    
    /**
     * @notice Release stake after successful verification
     * @param taskId ID of the verified task
     */
    function releaseStake(uint256 taskId) external onlyVerificationManager nonReentrant {
        StakeInfo storage stake = taskStakes[taskId];
        require(stake.status == StakeStatus.Locked, "Stake not locked");
        
        stake.status = StakeStatus.Released;
        operatorStake[stake.operator] += stake.amount;
        
        emit StakeReleased(taskId, stake.operator, stake.amount);
    }
    
    /**
     * @notice Slash stake for failed verification
     * @param taskId ID of the task
     * @param slashPercentageBps Percentage to slash (10000 = 100%)
     * @param reason Reason for slashing
     */
    function slashStake(
        uint256 taskId,
        uint256 slashPercentageBps,
        string calldata reason
    ) external onlyVerificationManager nonReentrant {
        require(slashPercentageBps <= 10000, "Invalid percentage");
        
        StakeInfo storage stake = taskStakes[taskId];
        require(stake.status == StakeStatus.Locked, "Stake not locked");
        
        uint256 slashAmount = (stake.amount * slashPercentageBps) / 10000;
        uint256 returnAmount = stake.amount - slashAmount;
        
        stake.status = StakeStatus.Slashed;
        operatorTotalStake[stake.operator] -= stake.amount;
        
        // Return unslashed portion
        if (returnAmount > 0) {
            operatorStake[stake.operator] += returnAmount;
        }
        
        // Send slashed amount to treasury
        if (slashAmount > 0) {
            (bool success, ) = payable(treasuryAddress).call{value: slashAmount}("");
            require(success, "Transfer failed");
        }
        
        // Ban operator if fully slashed
        if (slashPercentageBps == 10000) {
            approvedOperators[stake.operator] = false;
            emit OperatorBanned(stake.operator, reason);
        }
        
        emit StakeSlashed(taskId, stake.operator, slashAmount, reason);
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get operator stake information
     * @param operator Address of the operator
     * @return isApproved Whether operator is approved
     * @return availableStake Amount available for new tasks
     * @return totalStake Total stake including locked amounts
     */
    function getOperatorInfo(address operator) 
        external 
        view 
        returns (
            bool isApproved,
            uint256 availableStake,
            uint256 totalStake
        ) 
    {
        return (
            approvedOperators[operator],
            operatorStake[operator],
            operatorTotalStake[operator]
        );
    }
    
    /**
     * @notice Get stake info for a task
     * @param taskId ID of the task
     * @return Stake information struct
     */
    function getTaskStake(uint256 taskId) 
        external 
        view 
        returns (StakeInfo memory) 
    {
        return taskStakes[taskId];
    }
    
    /**
     * @notice Calculate required stake for a task
     * @param taskId ID of the task
     * @return Required stake amount
     */
    function getRequiredStake(uint256 taskId) 
        external 
        view 
        returns (uint256) 
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
        
        return (estimatedCost * minimumStakePercentage) / 10000;
    }
    
    /**
     * @notice Check if operator can accept a task
     * @param operator Address of the operator
     * @param taskId ID of the task
     * @return canAccept Whether operator can accept the task
     * @return reason Reason if cannot accept
     */
    function canAcceptTask(address operator, uint256 taskId) 
        external 
        view 
        returns (bool canAccept, string memory reason) 
    {
        if (!approvedOperators[operator]) {
            return (false, "Not registered operator");
        }
        
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
            address assignedOperator,
            ,
        ) = taskRegistry.getTask(taskId);
        
        if (status != ITaskRegistry.TaskStatus.Funded) {
            return (false, "Task not funded");
        }
        
        if (assignedOperator != address(0)) {
            return (false, "Task already assigned");
        }
        
        uint256 requiredStake = (estimatedCost * minimumStakePercentage) / 10000;
        if (operatorStake[operator] < requiredStake) {
            return (false, "Insufficient available stake");
        }
        
        return (true, "");
    }
    
    /**
     * @notice Get locked stake amount for an operator
     * @param operator Address of the operator
     * @return Locked stake amount
     */
    function getLockedStake(address operator) 
        external 
        view 
        returns (uint256) 
    {
        return operatorTotalStake[operator] - operatorStake[operator];
    }
}