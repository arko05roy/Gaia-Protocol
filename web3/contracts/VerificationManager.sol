// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITaskRegistry {
    enum TaskStatus { Proposed, Funded, InProgress, UnderReview, Verified, Rejected }
    function getTask(uint256 taskId) external view returns (
        uint256 id, address proposer, string memory description,
        uint256 estimatedCost, uint256 expectedCO2, string memory location,
        uint256 deadline, string memory proofRequirements, string memory ipfsHash,
        TaskStatus status, uint256 createdAt, address assignedOperator,
        uint256 actualCO2, string memory proofHash
    );
    function markAsVerified(uint256 taskId) external;
    function markAsRejected(uint256 taskId) external;
}

interface ICollateralManager {
    function releaseStake(uint256 taskId) external;
    function slashStake(uint256 taskId, uint256 slashPercentageBps, string calldata reason) external;
}

interface IFundingPool {
    function releasePayment(uint256 taskId) external;
    function enableRefunds(uint256 taskId) external;
}

interface ICarbonCreditMinter {
    function mintCredits(uint256 taskId) external;
}

/**
 * @title VerificationManager
 * @notice Manages the verification process for completed tasks
 * @dev Coordinates validators, processes votes, and triggers outcomes
 */
contract VerificationManager is Ownable, Pausable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct Verification {
        uint256 taskId;
        address[] validators;
        uint256 approveVotes;
        uint256 rejectVotes;
        uint256 deadline;
        bool isFinalized;
        bool outcome;              // true = verified, false = rejected
        mapping(address => Vote) votes;
    }
    
    struct Vote {
        bool hasVoted;
        bool approve;
        uint256 confidenceScore;   // 0-100
        string justification;
        uint256 timestamp;
    }
    
    // ============ State Variables ============
    
    ITaskRegistry public taskRegistry;
    ICollateralManager public collateralManager;
    IFundingPool public fundingPool;
    ICarbonCreditMinter public carbonCreditMinter;
    
    // Validator management
    address[] public approvedValidators;
    mapping(address => bool) public isValidator;
    mapping(address => uint256) public validatorReputationScore;
    
    // Verification data
    mapping(uint256 => Verification) private _verifications;
    mapping(uint256 => address[]) private _taskValidators;
    
    // Parameters
    uint256 public requiredValidators = 3;
    uint256 public consensusThresholdBps = 6600;  // 66% in basis points
    uint256 public verificationPeriod = 7 days;
    uint256 public validatorRewardPerTask = 50 ether;  // In cUSD (set by treasury)
    
    // ============ Events ============
    
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    
    event VerificationStarted(
        uint256 indexed taskId,
        address[] validators,
        uint256 deadline
    );
    
    event ValidatorVoted(
        uint256 indexed taskId,
        address indexed validator,
        bool approve,
        uint256 confidenceScore
    );
    
    event ConsensusReached(
        uint256 indexed taskId,
        bool outcome,
        uint256 approveVotes,
        uint256 rejectVotes
    );
    
    event VerificationFinalized(
        uint256 indexed taskId,
        bool outcome
    );
    
    // ============ Constructor ============
    
    constructor(
        address _taskRegistry,
        address _collateralManager,
        address _fundingPool
    ) Ownable(msg.sender) {
        require(_taskRegistry != address(0), "Invalid registry");
        require(_collateralManager != address(0), "Invalid collateral manager");
        require(_fundingPool != address(0), "Invalid funding pool");
        
        taskRegistry = ITaskRegistry(_taskRegistry);
        collateralManager = ICollateralManager(_collateralManager);
        fundingPool = IFundingPool(_fundingPool);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set CarbonCreditMinter address
     * @param _minter Address of the minter contract
     */
    function setCarbonCreditMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid address");
        carbonCreditMinter = ICarbonCreditMinter(_minter);
    }
    
    /**
     * @notice Add a validator
     * @param validator Address to add
     */
    function addValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid address");
        require(!isValidator[validator], "Already validator");
        
        approvedValidators.push(validator);
        isValidator[validator] = true;
        validatorReputationScore[validator] = 100; // Start with 100%
        
        emit ValidatorAdded(validator);
    }
    
    /**
     * @notice Remove a validator
     * @param validator Address to remove
     */
    function removeValidator(address validator) external onlyOwner {
        require(isValidator[validator], "Not a validator");
        isValidator[validator] = false;
        emit ValidatorRemoved(validator);
    }
    
    /**
     * @notice Update required number of validators
     * @param newRequired New number of validators required
     */
    function setRequiredValidators(uint256 newRequired) external onlyOwner {
        require(newRequired > 0 && newRequired <= 10, "Invalid number");
        requiredValidators = newRequired;
    }
    
    /**
     * @notice Update consensus threshold
     * @param newThresholdBps New threshold in basis points
     */
    function setConsensusThreshold(uint256 newThresholdBps) external onlyOwner {
        require(newThresholdBps >= 5000 && newThresholdBps <= 10000, "Invalid threshold");
        consensusThresholdBps = newThresholdBps;
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
    
    // ============ Core Functions ============
    
    /**
     * @notice Initiate verification process for a task
     * @param taskId ID of the task to verify
     */
    function initiateVerification(uint256 taskId) external whenNotPaused nonReentrant {
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
            ,
            ,
        ) = taskRegistry.getTask(taskId);
        
        require(status == ITaskRegistry.TaskStatus.UnderReview, "Task not under review");
        require(_verifications[taskId].deadline == 0, "Verification already initiated");
        require(approvedValidators.length >= requiredValidators, "Not enough validators");
        
        // Randomly select validators (pseudo-random for MVP)
        address[] memory selectedValidators = _selectValidators(taskId);
        
        Verification storage v = _verifications[taskId];
        v.taskId = taskId;
        v.deadline = block.timestamp + verificationPeriod;
        
        // Store validators separately for enumeration
        _taskValidators[taskId] = selectedValidators;
        
        emit VerificationStarted(taskId, selectedValidators, v.deadline);
    }
    
    /**
     * @notice Submit a validator vote
     * @param taskId ID of the task
     * @param approve True to approve, false to reject
     * @param confidenceScore Confidence level (0-100)
     * @param justification Explanation for the vote
     */
    function submitVote(
        uint256 taskId,
        bool approve,
        uint256 confidenceScore,
        string calldata justification
    ) external whenNotPaused {
        require(isValidator[msg.sender], "Not a validator");
        require(confidenceScore <= 100, "Invalid confidence score");
        
        Verification storage v = _verifications[taskId];
        require(v.deadline != 0, "Verification not initiated");
        require(block.timestamp <= v.deadline, "Deadline passed");
        require(!v.isFinalized, "Already finalized");
        require(!v.votes[msg.sender].hasVoted, "Already voted");
        
        // Check if validator is assigned to this task
        bool isAssigned = false;
        address[] memory validators = _taskValidators[taskId];
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i] == msg.sender) {
                isAssigned = true;
                break;
            }
        }
        require(isAssigned, "Not assigned to this task");
        
        // Record vote
        v.votes[msg.sender] = Vote({
            hasVoted: true,
            approve: approve,
            confidenceScore: confidenceScore,
            justification: justification,
            timestamp: block.timestamp
        });
        
        if (approve) {
            v.approveVotes++;
        } else {
            v.rejectVotes++;
        }
        
        emit ValidatorVoted(taskId, msg.sender, approve, confidenceScore);
        
        // Check if we have enough votes
        uint256 totalVotes = v.approveVotes + v.rejectVotes;
        if (totalVotes >= requiredValidators) {
            _finalizeVerification(taskId);
        }
    }
    
    /**
     * @notice Finalize verification after deadline or consensus
     * @param taskId ID of the task
     */
    function finalizeVerification(uint256 taskId) external nonReentrant {
        Verification storage v = _verifications[taskId];
        require(v.deadline != 0, "Verification not initiated");
        require(!v.isFinalized, "Already finalized");
        require(block.timestamp > v.deadline, "Deadline not reached");
        
        _finalizeVerification(taskId);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Select validators for a task (pseudo-random for MVP)
     */
    function _selectValidators(uint256 taskId) private view returns (address[] memory) {
        require(approvedValidators.length >= requiredValidators, "Not enough validators");
        
        address[] memory selected = new address[](requiredValidators);
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            taskId
        )));
        
        // Simple selection (can be improved with proper randomness)
        uint256 selectedCount = 0;
        uint256 attempts = 0;
        uint256 maxAttempts = approvedValidators.length * 3;
        
        while (selectedCount < requiredValidators && attempts < maxAttempts) {
            uint256 index = (seed + attempts) % approvedValidators.length;
            address validator = approvedValidators[index];
            
            // Check if not already selected
            bool alreadySelected = false;
            for (uint256 i = 0; i < selectedCount; i++) {
                if (selected[i] == validator) {
                    alreadySelected = true;
                    break;
                }
            }
            
            if (!alreadySelected && isValidator[validator]) {
                selected[selectedCount] = validator;
                selectedCount++;
            }
            
            attempts++;
        }
        
        require(selectedCount == requiredValidators, "Failed to select validators");
        return selected;
    }
    
    /**
     * @dev Internal function to finalize verification
     */
    function _finalizeVerification(uint256 taskId) private {
        Verification storage v = _verifications[taskId];
        require(!v.isFinalized, "Already finalized");
        
        v.isFinalized = true;
        
        uint256 totalVotes = v.approveVotes + v.rejectVotes;
        require(totalVotes > 0, "No votes received");
        
        // Calculate approval percentage
        uint256 approvalPercentage = (v.approveVotes * 10000) / totalVotes;
        bool passed = approvalPercentage >= consensusThresholdBps;
        
        v.outcome = passed;
        
        emit ConsensusReached(taskId, passed, v.approveVotes, v.rejectVotes);
        
        if (passed) {
            // Task verified
            taskRegistry.markAsVerified(taskId);
            collateralManager.releaseStake(taskId);
            fundingPool.releasePayment(taskId);
            
            // Mint carbon credits if minter is set
            if (address(carbonCreditMinter) != address(0)) {
                carbonCreditMinter.mintCredits(taskId);
            }
        } else {
            // Task rejected
            taskRegistry.markAsRejected(taskId);
            collateralManager.slashStake(taskId, 10000, "Failed verification");
            fundingPool.enableRefunds(taskId);
        }
        
        emit VerificationFinalized(taskId, passed);
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get verification details for a task
     * @param taskId ID of the task
     * @return validators Array of validator addresses
     * @return approveVotes Number of approve votes
     * @return rejectVotes Number of reject votes
     * @return deadline Voting deadline
     * @return isFinalized Whether verification is finalized
     * @return outcome Final outcome (if finalized)
     */
    function getVerification(uint256 taskId) 
        external 
        view 
        returns (
            address[] memory validators,
            uint256 approveVotes,
            uint256 rejectVotes,
            uint256 deadline,
            bool isFinalized,
            bool outcome
        ) 
    {
        Verification storage v = _verifications[taskId];
        return (
            _taskValidators[taskId],
            v.approveVotes,
            v.rejectVotes,
            v.deadline,
            v.isFinalized,
            v.outcome
        );
    }
    
    /**
     * @notice Get a validator's vote for a task
     * @param taskId ID of the task
     * @param validator Address of the validator
     * @return hasVoted Whether validator has voted
     * @return approve Vote decision
     * @return confidenceScore Confidence level
     * @return justification Vote explanation
     * @return timestamp When vote was cast
     */
    function getValidatorVote(uint256 taskId, address validator) 
        external 
        view 
        returns (
            bool hasVoted,
            bool approve,
            uint256 confidenceScore,
            string memory justification,
            uint256 timestamp
        ) 
    {
        Vote storage vote = _verifications[taskId].votes[validator];
        return (
            vote.hasVoted,
            vote.approve,
            vote.confidenceScore,
            vote.justification,
            vote.timestamp
        );
    }
    
    /**
     * @notice Get all validators
     * @return Array of validator addresses
     */
    function getAllValidators() external view returns (address[] memory) {
        return approvedValidators;
    }
    
    /**
     * @notice Get active validators (not removed)
     * @return Array of active validator addresses
     */
    function getActiveValidators() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < approvedValidators.length; i++) {
            if (isValidator[approvedValidators[i]]) {
                activeCount++;
            }
        }
        
        address[] memory active = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < approvedValidators.length; i++) {
            if (isValidator[approvedValidators[i]]) {
                active[index] = approvedValidators[i];
                index++;
            }
        }
        
        return active;
    }
    
    /**
     * @notice Get validator reputation score
     * @param validator Address of the validator
     * @return Reputation score (0-100)
     */
    function getValidatorReputation(address validator) 
        external 
        view 
        returns (uint256) 
    {
        return validatorReputationScore[validator];
    }
    
    /**
     * @notice Check if verification is ready to finalize
     * @param taskId ID of the task
     * @return canFinalize Whether verification can be finalized
     * @return reason Reason if cannot finalize
     */
    function canFinalize(uint256 taskId) 
        external 
        view 
        returns (bool canFinalize, string memory reason) 
    {
        Verification storage v = _verifications[taskId];
        
        if (v.deadline == 0) {
            return (false, "Verification not initiated");
        }
        
        if (v.isFinalized) {
            return (false, "Already finalized");
        }
        
        uint256 totalVotes = v.approveVotes + v.rejectVotes;
        
        if (totalVotes >= requiredValidators) {
            return (true, "Consensus reached");
        }
        
        if (block.timestamp > v.deadline) {
            if (totalVotes > 0) {
                return (true, "Deadline passed");
            } else {
                return (false, "No votes received");
            }
        }
        
        return (false, "Waiting for votes");
    }
    
    /**
     * @notice Get voting progress for a task
     * @param taskId ID of the task
     * @return votesReceived Number of votes received
     * @return votesRequired Number of votes required
     * @return percentageComplete Percentage complete (basis points)
     */
    function getVotingProgress(uint256 taskId) 
        external 
        view 
        returns (
            uint256 votesReceived,
            uint256 votesRequired,
            uint256 percentageComplete
        ) 
    {
        Verification storage v = _verifications[taskId];
        votesReceived = v.approveVotes + v.rejectVotes;
        votesRequired = requiredValidators;
        percentageComplete = votesRequired > 0 ? (votesReceived * 10000) / votesRequired : 0;
        
        return (votesReceived, votesRequired, percentageComplete);
    }
}