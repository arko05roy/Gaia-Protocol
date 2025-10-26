// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @notice Binary prediction markets for task success/failure
 * @dev Simple constant-sum market maker: YES + NO price = 1 cUSD
 */
contract PredictionMarket is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct Market {
        uint256 taskId;
        uint256 yesPool;           // Total cUSD in YES pool
        uint256 noPool;            // Total cUSD in NO pool
        uint256 totalVolume;       // Total trading volume
        uint256 resolutionDeadline;
        bool isResolved;
        bool outcome;              // true = task verified, false = task failed
        uint256 createdAt;
    }
    
    struct Position {
        uint256 yesShares;
        uint256 noShares;
    }
    
    // ============ State Variables ============
    
    IERC20 public cUSD;
    address public verificationManagerAddress;
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public positions;
    
    // Market creation fee
    uint256 public marketCreationFee = 0.2 ether; // 0.2 cUSD
    
    // ============ Events ============
    
    event MarketCreated(
        uint256 indexed taskId,
        uint256 resolutionDeadline
    );
    
    event SharesPurchased(
        uint256 indexed taskId,
        address indexed buyer,
        bool isYes,
        uint256 amount,
        uint256 cost
    );
    
    event MarketResolved(
        uint256 indexed taskId,
        bool outcome
    );
    
    event WinningsClaimed(
        uint256 indexed taskId,
        address indexed claimer,
        uint256 amount
    );
    
    // ============ Constructor ============
    
    constructor(address _cUSD) Ownable(msg.sender) {
        require(_cUSD != address(0), "Invalid cUSD");
        cUSD = IERC20(_cUSD);
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
     * @notice Update market creation fee
     * @param newFee New fee amount
     */
    function setMarketCreationFee(uint256 newFee) external onlyOwner {
        marketCreationFee = newFee;
    }
    
    /** 
     * @notice Pause trading
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause trading
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a prediction market for a task
     * @param taskId ID of the task
     * @param resolutionDeadline When market can be resolved
     */
    function createMarket(uint256 taskId, uint256 resolutionDeadline) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(markets[taskId].createdAt == 0, "Market already exists");
        require(resolutionDeadline > block.timestamp, "Invalid deadline");
        
        // Charge creation fee
        if (marketCreationFee > 0) {
            cUSD.safeTransferFrom(msg.sender, address(this), marketCreationFee);
        }
        
        markets[taskId] = Market({
            taskId: taskId,
            yesPool: 0,
            noPool: 0,
            totalVolume: 0,
            resolutionDeadline: resolutionDeadline,
            isResolved: false,
            outcome: false,
            createdAt: block.timestamp
        });
        
        emit MarketCreated(taskId, resolutionDeadline);
    }
    
    /**
     * @notice Buy YES or NO shares
     * @param taskId ID of the task market
     * @param isYes True to buy YES, false to buy NO
     * @param amount Amount of cUSD to spend
     */
    function buyShares(uint256 taskId, bool isYes, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Market storage market = markets[taskId];
        require(market.createdAt != 0, "Market does not exist");
        require(!market.isResolved, "Market already resolved");
        require(amount > 0, "Amount must be positive");
        
        // Transfer cUSD from buyer
        cUSD.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate shares using constant sum formula
        // For simplicity: 1 cUSD = 1 share, price discovery through pool ratios
        uint256 shares = amount;
        
        // Update pools and positions
        if (isYes) {
            market.yesPool += amount;
            positions[taskId][msg.sender].yesShares += shares;
        } else {
            market.noPool += amount;
            positions[taskId][msg.sender].noShares += shares;
        }
        
        market.totalVolume += amount;
        
        emit SharesPurchased(taskId, msg.sender, isYes, shares, amount);
    }
    
    /**
     * @notice Resolve market outcome (called by VerificationManager)
     * @param taskId ID of the task
     * @param outcome True if task verified, false if failed
     */
    function resolveMarket(uint256 taskId, bool outcome) external {
        require(
            msg.sender == verificationManagerAddress || msg.sender == owner(),
            "Not authorized"
        );
        
        Market storage market = markets[taskId];
        require(market.createdAt != 0, "Market does not exist");
        require(!market.isResolved, "Already resolved");
        
        market.isResolved = true;
        market.outcome = outcome;
        
        emit MarketResolved(taskId, outcome);
    }
    
    /**
     * @notice Claim winnings after market resolution
     * @param taskId ID of the task market
     */
    function claimWinnings(uint256 taskId) external nonReentrant {
        Market storage market = markets[taskId];
        require(market.isResolved, "Market not resolved");
        
        Position storage position = positions[taskId][msg.sender];
        uint256 winnings = 0;
        
        if (market.outcome) {
            // YES won
            require(position.yesShares > 0, "No winnings to claim");
            
            uint256 totalPool = market.yesPool + market.noPool;
            winnings = (position.yesShares * totalPool) / market.yesPool;
            position.yesShares = 0;
        } else {
            // NO won
            require(position.noShares > 0, "No winnings to claim");
            
            uint256 totalPool = market.yesPool + market.noPool;
            winnings = (position.noShares * totalPool) / market.noPool;
            position.noShares = 0;
        }
        
        require(winnings > 0, "No winnings to claim");
        
        // Transfer winnings
        cUSD.safeTransfer(msg.sender, winnings);
        
        emit WinningsClaimed(taskId, msg.sender, winnings);
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get market information
     * @param taskId Task ID
     * @return Market struct
     */
    function getMarket(uint256 taskId) 
        external 
        view 
        returns (Market memory) 
    {
        return markets[taskId];
    }
    
    /**
     * @notice Get user's position in a market
     * @param taskId Task ID
     * @param user User address
     * @return yesShares YES shares owned
     * @return noShares NO shares owned
     */
    function getPosition(uint256 taskId, address user) 
        external 
        view 
        returns (uint256 yesShares, uint256 noShares) 
    {
        Position storage position = positions[taskId][user];
        return (position.yesShares, position.noShares);
    }
    
    /**
     * @notice Get current market odds
     * @param taskId Task ID
     * @return yesPercent YES probability in basis points (10000 = 100%)
     * @return noPercent NO probability in basis points
     */
    function getOdds(uint256 taskId) 
        external 
        view 
        returns (uint256 yesPercent, uint256 noPercent) 
    {
        Market storage market = markets[taskId];
        uint256 totalPool = market.yesPool + market.noPool;
        
        if (totalPool == 0) {
            return (5000, 5000); // 50-50 if no bets
        }
        
        yesPercent = (market.yesPool * 10000) / totalPool;
        noPercent = (market.noPool * 10000) / totalPool;
        
        return (yesPercent, noPercent);
    }
    
    /**
     * @notice Calculate potential winnings
     * @param taskId Task ID
     * @param user User address
     * @return yesWinnings Winnings if YES wins
     * @return noWinnings Winnings if NO wins
     */
    function calculateWinnings(uint256 taskId, address user) 
        external 
        view 
        returns (uint256 yesWinnings, uint256 noWinnings) 
    {
        Market storage market = markets[taskId];
        Position storage position = positions[taskId][user];
        
        uint256 totalPool = market.yesPool + market.noPool;
        
        if (totalPool == 0) {
            return (0, 0);
        }
        
        if (position.yesShares > 0 && market.yesPool > 0) {
            yesWinnings = (position.yesShares * totalPool) / market.yesPool;
        }
        
        if (position.noShares > 0 && market.noPool > 0) {
            noWinnings = (position.noShares * totalPool) / market.noPool;
        }
        
        return (yesWinnings, noWinnings);
    }
    
    /**
     * @notice Check if market exists
     * @param taskId Task ID
     * @return True if market exists
     */
    function marketExists(uint256 taskId) external view returns (bool) {
        return markets[taskId].createdAt != 0;
    }
}