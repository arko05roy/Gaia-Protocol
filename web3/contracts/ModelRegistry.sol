// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ModelRegistry
 * @notice Registry for AI/ML models that predict task success
 * @dev Models stake collateral, make predictions, and earn rewards for accuracy
 */
contract ModelRegistry is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct Model {
        uint256 id;
        address owner;
        string name;
        string description;
        string ipfsHash;           // Model weights and metadata
        string architecture;       // e.g., "Random Forest", "Neural Network"
        uint256 stake;             // Staked amount in cUSD
        uint256 registeredAt;
        bool isActive;
        
        // Performance metrics
        uint256 totalPredictions;
        uint256 correctPredictions;
        uint256 accuracy;          // Basis points (10000 = 100%)
        uint256 reputationScore;   // 0-100
        uint256 totalRewardsEarned;
    }
    
    struct Prediction {
        uint256 modelId;
        uint256 taskId;
        bool predictedOutcome;     // true = success, false = failure
        uint256 confidence;        // 0-100
        uint256 timestamp;
        bool isResolved;
        bool wasCorrect;
    }
    
    // ============ State Variables ============
    
    IERC20 public cUSD;
    address public verificationManagerAddress;
    
    uint256 private _modelIdCounter;
    mapping(uint256 => Model) public models;
    mapping(address => uint256[]) private _ownerModels;
    
    // Predictions: taskId => modelId => Prediction
    mapping(uint256 => mapping(uint256 => Prediction)) public predictions;
    mapping(uint256 => uint256[]) private _taskPredictions; // taskId => modelIds
    
    // Parameters
    uint256 public minimumStake = 0.2 ether; // 0.2 cUSD
    uint256 public baseReward = 10 ether;     // 10 cUSD per correct prediction
    uint256 public minimumAccuracy = 5000;    // 50% in basis points
    
    // Leaderboard tracking
    uint256[] private _activeModelIds;
    
    // ============ Events ============
    
    event ModelRegistered(
        uint256 indexed modelId,
        address indexed owner,
        string name,
        uint256 stake
    );
    
    event ModelUpdated(
        uint256 indexed modelId,
        string ipfsHash
    );
    
    event ModelDeactivated(
        uint256 indexed modelId,
        string reason
    );
    
    event PredictionRecorded(
        uint256 indexed modelId,
        uint256 indexed taskId,
        bool predictedOutcome,
        uint256 confidence
    );
    
    event PredictionResolved(
        uint256 indexed modelId,
        uint256 indexed taskId,
        bool wasCorrect
    );
    
    event RewardPaid(
        uint256 indexed modelId,
        address indexed owner,
        uint256 amount
    );
    
    event StakeSlashed(
        uint256 indexed modelId,
        uint256 amount,
        string reason
    );
    
    event StakeAdded(
        uint256 indexed modelId,
        uint256 amount
    );
    
    event StakeWithdrawn(
        uint256 indexed modelId,
        uint256 amount
    );
    
    // ============ Constructor ============
    
    constructor(address _cUSD) Ownable(msg.sender) {
        require(_cUSD != address(0), "Invalid cUSD");
        cUSD = IERC20(_cUSD);
        _modelIdCounter = 1;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set VerificationManager address
     * @param _verificationManager Address of VerificationManager
     */
    function setVerificationManager(address _verificationManager) external onlyOwner {
        require(_verificationManager != address(0), "Invalid address");
        verificationManagerAddress = _verificationManager;
    }
    
    /**
     * @notice Update minimum stake requirement
     * @param newMinimum New minimum stake
     */
    function setMinimumStake(uint256 newMinimum) external onlyOwner {
        minimumStake = newMinimum;
    }
    
    /**
     * @notice Update base reward amount
     * @param newReward New reward amount
     */
    function setBaseReward(uint256 newReward) external onlyOwner {
        baseReward = newReward;
    }
    
    /**
     * @notice Update minimum accuracy threshold
     * @param newMinimum New minimum accuracy in basis points
     */
    function setMinimumAccuracy(uint256 newMinimum) external onlyOwner {
        require(newMinimum <= 10000, "Invalid accuracy");
        minimumAccuracy = newMinimum;
    }
    
    /**
     * @notice Pause model operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause model operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Register a new AI model
     * @param name Model name
     * @param description Model description
     * @param ipfsHash IPFS hash of model weights and metadata
     * @param architecture Model architecture description
     * @param stakeAmount Amount to stake (must be >= minimumStake)
     * @return modelId The registered model ID
     */
    function registerModel(
        string calldata name,
        string calldata description,
        string calldata ipfsHash,
        string calldata architecture,
        uint256 stakeAmount
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(stakeAmount >= minimumStake, "Insufficient stake");
        
        // Transfer stake
        cUSD.safeTransferFrom(msg.sender, address(this), stakeAmount);
        
        uint256 modelId = _modelIdCounter++;
        
        models[modelId] = Model({
            id: modelId,
            owner: msg.sender,
            name: name,
            description: description,
            ipfsHash: ipfsHash,
            architecture: architecture,
            stake: stakeAmount,
            registeredAt: block.timestamp,
            isActive: true,
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: 10000, // Start at 100%
            reputationScore: 100,
            totalRewardsEarned: 0
        });
        
        _ownerModels[msg.sender].push(modelId);
        _activeModelIds.push(modelId);
        
        emit ModelRegistered(modelId, msg.sender, name, stakeAmount);
        
        return modelId;
    }
    
    /**
     * @notice Update model IPFS hash (new version)
     * @param modelId Model ID
     * @param newIpfsHash New IPFS hash
     */
    function updateModel(uint256 modelId, string calldata newIpfsHash) 
        external 
        whenNotPaused 
    {
        Model storage model = models[modelId];
        require(model.owner == msg.sender, "Not model owner");
        require(model.isActive, "Model not active");
        require(bytes(newIpfsHash).length > 0, "IPFS hash required");
        
        model.ipfsHash = newIpfsHash;
        
        emit ModelUpdated(modelId, newIpfsHash);
    }
    
    /**
     * @notice Add stake to a model
     * @param modelId Model ID
     * @param amount Amount to add
     */
    function addStake(uint256 modelId, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Model storage model = models[modelId];
        require(model.owner == msg.sender, "Not model owner");
        require(amount > 0, "Amount must be positive");
        
        cUSD.safeTransferFrom(msg.sender, address(this), amount);
        model.stake += amount;
        
        emit StakeAdded(modelId, amount);
    }
    
    /**
     * @notice Withdraw stake from a model
     * @param modelId Model ID
     * @param amount Amount to withdraw
     */
    function withdrawStake(uint256 modelId, uint256 amount) 
        external 
        nonReentrant 
    {
        Model storage model = models[modelId];
        require(model.owner == msg.sender, "Not model owner");
        require(amount > 0, "Amount must be positive");
        require(model.stake >= amount, "Insufficient stake");
        
        uint256 remaining = model.stake - amount;
        require(remaining >= minimumStake || remaining == 0, "Below minimum stake");
        
        model.stake -= amount;
        
        // Deactivate if withdrawing all
        if (model.stake == 0) {
            model.isActive = false;
        }
        
        cUSD.safeTransfer(msg.sender, amount);
        
        emit StakeWithdrawn(modelId, amount);
    }
    
    /**
     * @notice Record a prediction for a task
     * @param modelId Model ID making the prediction
     * @param taskId Task ID to predict
     * @param predictedOutcome Predicted outcome (true = success)
     * @param confidence Confidence level (0-100)
     */
    function recordPrediction(
        uint256 modelId,
        uint256 taskId,
        bool predictedOutcome,
        uint256 confidence
    ) external whenNotPaused {
        Model storage model = models[modelId];
        require(model.owner == msg.sender, "Not model owner");
        require(model.isActive, "Model not active");
        require(confidence <= 100, "Invalid confidence");
        require(
            predictions[taskId][modelId].timestamp == 0,
            "Prediction already exists"
        );
        
        predictions[taskId][modelId] = Prediction({
            modelId: modelId,
            taskId: taskId,
            predictedOutcome: predictedOutcome,
            confidence: confidence,
            timestamp: block.timestamp,
            isResolved: false,
            wasCorrect: false
        });
        
        _taskPredictions[taskId].push(modelId);
        model.totalPredictions++;
        
        emit PredictionRecorded(modelId, taskId, predictedOutcome, confidence);
    }
    
    /**
     * @notice Update model performance after task verification
     * @param taskId Task ID that was verified
     * @param actualOutcome Actual outcome (true = verified)
     */
    function updateModelPerformance(uint256 taskId, bool actualOutcome) 
        external 
        nonReentrant 
    {
        require(
            msg.sender == verificationManagerAddress || msg.sender == owner(),
            "Not authorized"
        );
        
        uint256[] memory modelIds = _taskPredictions[taskId];
        
        for (uint256 i = 0; i < modelIds.length; i++) {
            uint256 modelId = modelIds[i];
            Prediction storage prediction = predictions[taskId][modelId];
            Model storage model = models[modelId];
            
            if (!prediction.isResolved) {
                prediction.isResolved = true;
                
                // Check if prediction was correct
                bool wasCorrect = prediction.predictedOutcome == actualOutcome;
                prediction.wasCorrect = wasCorrect;
                
                if (wasCorrect) {
                    model.correctPredictions++;
                    
                    // Calculate reward based on confidence
                    uint256 reward = _calculateReward(modelId, prediction.confidence);
                    
                    if (reward > 0 && address(this).balance >= reward) {
                        model.totalRewardsEarned += reward;
                        cUSD.safeTransfer(model.owner, reward);
                        emit RewardPaid(modelId, model.owner, reward);
                    }
                }
                
                // Update accuracy
                model.accuracy = (model.correctPredictions * 10000) / model.totalPredictions;
                
                // Update reputation score (weighted moving average)
                model.reputationScore = _calculateReputation(model);
                
                // Deactivate if accuracy drops too low
                if (model.totalPredictions >= 10 && model.accuracy < minimumAccuracy) {
                    model.isActive = false;
                    emit ModelDeactivated(modelId, "Accuracy below threshold");
                }
                
                emit PredictionResolved(modelId, taskId, wasCorrect);
            }
        }
    }
    
    /**
     * @notice Manually deactivate a model
     * @param modelId Model ID
     * @param reason Reason for deactivation
     */
    function deactivateModel(uint256 modelId, string calldata reason) external {
        Model storage model = models[modelId];
        require(
            msg.sender == model.owner || msg.sender == owner(),
            "Not authorized"
        );
        require(model.isActive, "Already inactive");
        
        model.isActive = false;
        
        emit ModelDeactivated(modelId, reason);
    }
    
    /**
     * @notice Reactivate a model (requires meeting minimum accuracy)
     * @param modelId Model ID
     */
    function reactivateModel(uint256 modelId) external {
        Model storage model = models[modelId];
        require(model.owner == msg.sender, "Not model owner");
        require(!model.isActive, "Already active");
        require(model.stake >= minimumStake, "Insufficient stake");
        require(
            model.totalPredictions == 0 || model.accuracy >= minimumAccuracy,
            "Accuracy too low"
        );
        
        model.isActive = true;
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Calculate reward amount based on model performance
     */
    function _calculateReward(uint256 modelId, uint256 confidence) 
        private 
        view 
        returns (uint256) 
    {
        Model storage model = models[modelId];
        
        // Base reward
        uint256 reward = baseReward;
        
        // Confidence multiplier (higher confidence = higher reward)
        reward = (reward * (50 + confidence / 2)) / 100;
        
        // Stake multiplier (higher stake = higher reward)
        uint256 stakeMultiplier = (model.stake * 100) / minimumStake;
        if (stakeMultiplier > 200) stakeMultiplier = 200; // Cap at 2x
        reward = (reward * stakeMultiplier) / 100;
        
        // Reputation multiplier
        reward = (reward * (50 + model.reputationScore / 2)) / 100;
        
        return reward;
    }
    
    /**
     * @dev Calculate reputation score
     */
    function _calculateReputation(Model storage model) 
        private 
        view 
        returns (uint256) 
    {
        if (model.totalPredictions == 0) return 100;
        
        // Base reputation from accuracy
        uint256 reputation = model.accuracy / 100; // Convert basis points to 0-100
        
        // Bonus for consistency (many predictions)
        if (model.totalPredictions >= 50) {
            reputation = reputation + 10;
        } else if (model.totalPredictions >= 20) {
            reputation = reputation + 5;
        }
        
        // Cap at 100
        if (reputation > 100) reputation = 100;
        
        return reputation;
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get model details
     * @param modelId Model ID
     * @return Model struct
     */
    function getModel(uint256 modelId) 
        external 
        view 
        returns (Model memory) 
    {
        return models[modelId];
    }
    
    /**
     * @notice Get multiple models
     * @param modelIds Array of model IDs
     * @return Array of Model structs
     */
    function getModels(uint256[] calldata modelIds) 
        external 
        view 
        returns (Model[] memory) 
    {
        Model[] memory result = new Model[](modelIds.length);
        
        for (uint256 i = 0; i < modelIds.length; i++) {
            result[i] = models[modelIds[i]];
        }
        
        return result;
    }
    
    /**
     * @notice Get models by owner
     * @param owner Owner address
     * @return Array of model IDs
     */
    function getModelsByOwner(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _ownerModels[owner];
    }
    
    /**
     * @notice Get prediction details
     * @param taskId Task ID
     * @param modelId Model ID
     * @return Prediction struct
     */
    function getPrediction(uint256 taskId, uint256 modelId) 
        external 
        view 
        returns (Prediction memory) 
    {
        return predictions[taskId][modelId];
    }
    
    /**
     * @notice Get all predictions for a task
     * @param taskId Task ID
     * @return modelIds Array of model IDs that made predictions
     * @return predictionData Array of predictions
     */
    function getTaskPredictions(uint256 taskId) 
        external 
        view 
        returns (
            uint256[] memory modelIds,
            Prediction[] memory predictionData
        ) 
    {
        modelIds = _taskPredictions[taskId];
        predictionData = new Prediction[](modelIds.length);
        
        for (uint256 i = 0; i < modelIds.length; i++) {
            predictionData[i] = predictions[taskId][modelIds[i]];
        }
        
        return (modelIds, predictionData);
    }
    
    /**
     * @notice Get top performing models
     * @param count Number of models to return
     * @return Array of model IDs sorted by accuracy
     */
    function getTopModels(uint256 count) 
        external 
        view 
        returns (uint256[] memory) 
    {
        if (count > _activeModelIds.length) {
            count = _activeModelIds.length;
        }
        
        // Create array of active models with predictions
        uint256 eligibleCount = 0;
        for (uint256 i = 0; i < _activeModelIds.length; i++) {
            Model storage model = models[_activeModelIds[i]];
            if (model.isActive && model.totalPredictions >= 5) {
                eligibleCount++;
            }
        }
        
        uint256[] memory eligibleModels = new uint256[](eligibleCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _activeModelIds.length; i++) {
            Model storage model = models[_activeModelIds[i]];
            if (model.isActive && model.totalPredictions >= 5) {
                eligibleModels[index] = _activeModelIds[i];
                index++;
            }
        }
        
        // Simple bubble sort by accuracy (good enough for small arrays)
        for (uint256 i = 0; i < eligibleModels.length; i++) {
            for (uint256 j = i + 1; j < eligibleModels.length; j++) {
                if (models[eligibleModels[i]].accuracy < models[eligibleModels[j]].accuracy) {
                    uint256 temp = eligibleModels[i];
                    eligibleModels[i] = eligibleModels[j];
                    eligibleModels[j] = temp;
                }
            }
        }
        
        // Return top N
        if (count > eligibleModels.length) {
            count = eligibleModels.length;
        }
        
        uint256[] memory topModels = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            topModels[i] = eligibleModels[i];
        }
        
        return topModels;
    }
    
    /**
     * @notice Get model performance metrics
     * @param modelId Model ID
     * @return totalPredictions Total predictions made
     * @return correctPredictions Correct predictions
     * @return accuracy Accuracy percentage (basis points)
     * @return reputationScore Reputation score (0-100)
     */
    function getModelPerformance(uint256 modelId) 
        external 
        view 
        returns (
            uint256 totalPredictions,
            uint256 correctPredictions,
            uint256 accuracy,
            uint256 reputationScore
        ) 
    {
        Model storage model = models[modelId];
        return (
            model.totalPredictions,
            model.correctPredictions,
            model.accuracy,
            model.reputationScore
        );
    }
    
    /**
     * @notice Get all active models
     * @return Array of active model IDs
     */
    function getActiveModels() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < _activeModelIds.length; i++) {
            if (models[_activeModelIds[i]].isActive) {
                activeCount++;
            }
        }
        
        uint256[] memory active = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _activeModelIds.length; i++) {
            if (models[_activeModelIds[i]].isActive) {
                active[index] = _activeModelIds[i];
                index++;
            }
        }
        
        return active;
    }
    
    /**
     * @notice Get consensus prediction for a task
     * @param taskId Task ID
     * @return predictedOutcome Consensus prediction
     * @return confidence Weighted confidence (0-100)
     * @return agreementCount Number of models in agreement
     */
    function getConsensusPrediction(uint256 taskId) 
        external 
        view 
        returns (
            bool predictedOutcome,
            uint256 confidence,
            uint256 agreementCount
        ) 
    {
        uint256[] memory modelIds = _taskPredictions[taskId];
        
        if (modelIds.length == 0) {
            return (false, 0, 0);
        }
        
        uint256 yesVotes = 0;
        uint256 noVotes = 0;
        uint256 totalConfidence = 0;
        
        for (uint256 i = 0; i < modelIds.length; i++) {
            Prediction storage pred = predictions[taskId][modelIds[i]];
            Model storage model = models[pred.modelId];
            
            // Weight by model reputation
            uint256 weight = model.reputationScore;
            
            if (pred.predictedOutcome) {
                yesVotes += weight;
            } else {
                noVotes += weight;
            }
            
            totalConfidence += pred.confidence * weight;
        }
        
        predictedOutcome = yesVotes > noVotes;
        agreementCount = predictedOutcome ? yesVotes : noVotes;
        
        uint256 totalWeight = yesVotes + noVotes;
        confidence = totalWeight > 0 ? totalConfidence / totalWeight : 0;
        
        return (predictedOutcome, confidence, modelIds.length);
    }
    
    /**
     * @notice Get total number of models
     * @return Total model count
     */
    function getTotalModels() external view returns (uint256) {
        return _modelIdCounter - 1;
    }
    
    /**
     * @notice Calculate expected reward for a prediction
     * @param modelId Model ID
     * @param confidence Confidence level
     * @return Expected reward amount
     */
    function calculateExpectedReward(uint256 modelId, uint256 confidence) 
        external 
        view 
        returns (uint256) 
    {
        return _calculateReward(modelId, confidence);
    }
}