// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TaskRegistry
 * @notice Core contract for managing environmental tasks from creation to completion
 * @dev Handles task lifecycle: Proposed → Funded → InProgress → UnderReview → Verified/Rejected
 */
contract TaskRegistry is Ownable, Pausable, ReentrancyGuard {
    
    // ============ Enums ============
    
    enum TaskStatus {
        Proposed,      // Task created, awaiting funding
        Funded,        // Fully funded, awaiting operator
        InProgress,    // Operator assigned and working
        UnderReview,   // Proof submitted, validators reviewing
        Verified,      // Verification passed, credits minted
        Rejected       // Verification failed or abandoned
    }
    
    // ============ Structs ============
    
    struct Task {
        uint256 id;
        address proposer;
        string description;
        uint256 estimatedCost;        // In cUSD (18 decimals)
        uint256 expectedCO2;          // In tons (18 decimals)
        string location;
        uint256 deadline;             // Unix timestamp
        string proofRequirements;
        string ipfsHash;              // Full documentation on IPFS
        TaskStatus status;
        uint256 createdAt;
        address assignedOperator;
        uint256 actualCO2;            // Verified CO2 offset
        string proofHash;             // IPFS hash of submitted proof
    }
    
    // ============ State Variables ============
    
    uint256 private _taskIdCounter;
    mapping(uint256 => Task) private _tasks;
    
    // Indexes for efficient queries
    mapping(address => uint256[]) private _proposerTasks;
    mapping(address => uint256[]) private _operatorTasks;
    mapping(TaskStatus => uint256[]) private _tasksByStatus;
    
    // Contract addresses (set by owner)
    address public fundingPoolAddress;
    address public collateralManagerAddress;
    address public verificationManagerAddress;
    
    // ============ Events ============
    
    event TaskCreated(
        uint256 indexed taskId,
        address indexed proposer,
        uint256 estimatedCost,
        uint256 expectedCO2
    );
    
    event TaskStatusChanged(
        uint256 indexed taskId,
        TaskStatus oldStatus,
        TaskStatus newStatus
    );
    
    event OperatorAssigned(
        uint256 indexed taskId,
        address indexed operator
    );
    
    event ProofSubmitted(
        uint256 indexed taskId,
        string proofHash,
        uint256 actualCO2
    );
    
    event TaskAbandoned(
        uint256 indexed taskId,
        address indexed operator
    );
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        _taskIdCounter = 1; // Start from 1 for cleaner UX
    }
    
    // ============ Modifiers ============
    
    modifier onlyFundingPool() {
        require(msg.sender == fundingPoolAddress, "Only FundingPool");
        _;
    }
    
    modifier onlyCollateralManager() {
        require(msg.sender == collateralManagerAddress, "Only CollateralManager");
        _;
    }
    
    modifier onlyVerificationManager() {
        require(msg.sender == verificationManagerAddress, "Only VerificationManager");
        _;
    }
    
    modifier taskExists(uint256 taskId) {
        require(_tasks[taskId].id != 0, "Task does not exist");
        _;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set the FundingPool contract address
     * @param _fundingPool Address of the FundingPool contract
     */
    function setFundingPool(address _fundingPool) external onlyOwner {
        require(_fundingPool != address(0), "Invalid address");
        fundingPoolAddress = _fundingPool;
    }
    
    /**
     * @notice Set the CollateralManager contract address
     * @param _collateralManager Address of the CollateralManager contract
     */
    function setCollateralManager(address _collateralManager) external onlyOwner {
        require(_collateralManager != address(0), "Invalid address");
        collateralManagerAddress = _collateralManager;
    }
    
    /**
     * @notice Set the VerificationManager contract address
     * @param _verificationManager Address of the VerificationManager contract
     */
    function setVerificationManager(address _verificationManager) external onlyOwner {
        require(_verificationManager != address(0), "Invalid address");
        verificationManagerAddress = _verificationManager;
    }
    
    /**
     * @notice Pause all task operations (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause task operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a new environmental task
     * @param description Brief description of the task
     * @param estimatedCost Required funding in cUSD (18 decimals)
     * @param expectedCO2 Expected CO2 offset in tons (18 decimals)
     * @param location Geographic location of the task
     * @param deadline Unix timestamp for task completion
     * @param proofRequirements What proof is needed for verification
     * @param ipfsHash IPFS hash of full project documentation
     * @return taskId The ID of the created task
     */
    function createTask(
        string calldata description,
        uint256 estimatedCost,
        uint256 expectedCO2,
        string calldata location,
        uint256 deadline,
        string calldata proofRequirements,
        string calldata ipfsHash
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(description).length > 0, "Description required");
        require(estimatedCost > 0, "Cost must be positive");
        require(expectedCO2 > 0, "CO2 must be positive");
        require(deadline > block.timestamp, "Deadline must be in future");
        
        uint256 taskId = _taskIdCounter++;
        
        Task storage task = _tasks[taskId];
        task.id = taskId;
        task.proposer = msg.sender;
        task.description = description;
        task.estimatedCost = estimatedCost;
        task.expectedCO2 = expectedCO2;
        task.location = location;
        task.deadline = deadline;
        task.proofRequirements = proofRequirements;
        task.ipfsHash = ipfsHash;
        task.status = TaskStatus.Proposed;
        task.createdAt = block.timestamp;
        
        // Add to indexes
        _proposerTasks[msg.sender].push(taskId);
        _tasksByStatus[TaskStatus.Proposed].push(taskId);
        
        emit TaskCreated(taskId, msg.sender, estimatedCost, expectedCO2);
        
        return taskId;
    }
    
    /**
     * @notice Update task status to Funded (called by FundingPool)
     * @param taskId ID of the task
     */
    function markAsFunded(uint256 taskId) 
        external 
        onlyFundingPool 
        taskExists(taskId) 
    {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.Proposed, "Must be Proposed");
        
        _updateStatus(taskId, TaskStatus.Funded);
    }
    
    /**
     * @notice Assign an operator to a task (called by CollateralManager)
     * @param taskId ID of the task
     * @param operator Address of the operator
     */
    function assignOperator(uint256 taskId, address operator) 
        external 
        onlyCollateralManager 
        taskExists(taskId) 
    {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.Funded, "Must be Funded");
        require(task.assignedOperator == address(0), "Already assigned");
        
        task.assignedOperator = operator;
        _operatorTasks[operator].push(taskId);
        _updateStatus(taskId, TaskStatus.InProgress);
        
        emit OperatorAssigned(taskId, operator);
    }
    
    /**
     * @notice Submit proof of work completion (called by operator)
     * @param taskId ID of the task
     * @param proofHash IPFS hash of proof materials
     * @param actualCO2 Actual CO2 offset achieved (18 decimals)
     */
    function submitProof(
        uint256 taskId,
        string calldata proofHash,
        uint256 actualCO2
    ) external whenNotPaused taskExists(taskId) {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.InProgress, "Must be InProgress");
        require(msg.sender == task.assignedOperator, "Only assigned operator");
        require(bytes(proofHash).length > 0, "Proof hash required");
        require(actualCO2 > 0, "CO2 must be positive");
        
        task.proofHash = proofHash;
        task.actualCO2 = actualCO2;
        _updateStatus(taskId, TaskStatus.UnderReview);
        
        emit ProofSubmitted(taskId, proofHash, actualCO2);
    }
    
    /**
     * @notice Mark task as verified (called by VerificationManager)
     * @param taskId ID of the task
     */
    function markAsVerified(uint256 taskId) 
        external 
        onlyVerificationManager 
        taskExists(taskId) 
    {
        Task storage task = _tasks[taskId];
        require(
            task.status == TaskStatus.UnderReview || task.status == TaskStatus.InProgress,
            "Invalid status"
        );
        
        _updateStatus(taskId, TaskStatus.Verified);
    }
    
    /**
     * @notice Mark task as rejected (called by VerificationManager)
     * @param taskId ID of the task
     */
    function markAsRejected(uint256 taskId) 
        external 
        onlyVerificationManager 
        taskExists(taskId) 
    {
        Task storage task = _tasks[taskId];
        require(
            task.status == TaskStatus.UnderReview || task.status == TaskStatus.InProgress,
            "Invalid status"
        );
        
        _updateStatus(taskId, TaskStatus.Rejected);
    }
    
    /**
     * @notice Check if task deadline has passed and mark as abandoned
     * @param taskId ID of the task
     * @dev Can be called by anyone to trigger abandoned state
     */
    function checkDeadline(uint256 taskId) external taskExists(taskId) {
        Task storage task = _tasks[taskId];
        require(task.status == TaskStatus.InProgress, "Must be InProgress");
        
        uint256 gracePeriod = 7 days;
        require(
            block.timestamp > task.deadline + gracePeriod,
            "Grace period not over"
        );
        
        _updateStatus(taskId, TaskStatus.Rejected);
        emit TaskAbandoned(taskId, task.assignedOperator);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Internal function to update task status and maintain indexes
     */
    function _updateStatus(uint256 taskId, TaskStatus newStatus) private {
        TaskStatus oldStatus = _tasks[taskId].status;
        _tasks[taskId].status = newStatus;
        
        // Remove from old status index
        uint256[] storage oldStatusTasks = _tasksByStatus[oldStatus];
        for (uint256 i = 0; i < oldStatusTasks.length; i++) {
            if (oldStatusTasks[i] == taskId) {
                oldStatusTasks[i] = oldStatusTasks[oldStatusTasks.length - 1];
                oldStatusTasks.pop();
                break;
            }
        }
        
        // Add to new status index
        _tasksByStatus[newStatus].push(taskId);
        
        emit TaskStatusChanged(taskId, oldStatus, newStatus);
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get complete task details
     * @param taskId ID of the task
     * @return id Task ID
     * @return proposer Task proposer address
     * @return description Task description
     * @return estimatedCost Estimated cost in cUSD
     * @return expectedCO2 Expected CO2 offset
     * @return location Task location
     * @return deadline Task deadline
     * @return proofRequirements Proof requirements
     * @return ipfsHash IPFS hash
     * @return status Task status
     * @return createdAt Creation timestamp
     * @return assignedOperator Assigned operator address
     * @return actualCO2 Actual CO2 offset
     * @return proofHash Proof IPFS hash
     */
    function getTask(uint256 taskId) 
        external 
        view 
        taskExists(taskId) 
        returns (
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
        )
    {
        Task storage task = _tasks[taskId];
        return (
            task.id,
            task.proposer,
            task.description,
            task.estimatedCost,
            task.expectedCO2,
            task.location,
            task.deadline,
            task.proofRequirements,
            task.ipfsHash,
            task.status,
            task.createdAt,
            task.assignedOperator,
            task.actualCO2,
            task.proofHash
        );
    }
    
    /**
     * @notice Get multiple tasks by IDs
     * @param taskIds Array of task IDs
     * @return Array of Task structs
     */
    function getTasks(uint256[] calldata taskIds) 
        external 
        view 
        returns (Task[] memory) 
    {
        Task[] memory tasks = new Task[](taskIds.length);
        for (uint256 i = 0; i < taskIds.length; i++) {
            tasks[i] = _tasks[taskIds[i]];
        }
        return tasks;
    }
    
    /**
     * @notice Get tasks by status
     * @param status The task status to filter by
     * @return Array of task IDs
     */
    function getTasksByStatus(TaskStatus status) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _tasksByStatus[status];
    }
    
    /**
     * @notice Get tasks created by a proposer
     * @param proposer Address of the proposer
     * @return Array of task IDs
     */
    function getProposerTasks(address proposer) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _proposerTasks[proposer];
    }
    
    /**
     * @notice Get tasks assigned to an operator
     * @param operator Address of the operator
     * @return Array of task IDs
     */
    function getOperatorTasks(address operator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _operatorTasks[operator];
    }
    
    /**
     * @notice Get total number of tasks created
     * @return Total task count
     */
    function getTotalTasks() external view returns (uint256) {
        return _taskIdCounter - 1;
    }
    
    /**
     * @notice Get basic info for multiple tasks (lighter than full struct)
     * @param taskIds Array of task IDs
     * @return proposers Array of proposer addresses
     * @return costs Array of estimated costs
     * @return statuses Array of task statuses
     */
    function getTasksBasicInfo(uint256[] calldata taskIds)
        external
        view
        returns (
            address[] memory proposers,
            uint256[] memory costs,
            TaskStatus[] memory statuses
        )
    {
        proposers = new address[](taskIds.length);
        costs = new uint256[](taskIds.length);
        statuses = new TaskStatus[](taskIds.length);
        
        for (uint256 i = 0; i < taskIds.length; i++) {
            Task storage task = _tasks[taskIds[i]];
            proposers[i] = task.proposer;
            costs[i] = task.estimatedCost;
            statuses[i] = task.status;
        }
        
        return (proposers, costs, statuses);
    }
    
    /**
     * @notice Check if a task exists
     * @param taskId ID to check
     * @return bool True if task exists
     */
    function taskExists_(uint256 taskId) external view returns (bool) {
        return _tasks[taskId].id != 0;
    }
}