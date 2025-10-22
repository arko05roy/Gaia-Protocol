// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CarbonMarketplace
 * @notice Marketplace for trading carbon credit tokens
 * @dev Simple order book implementation with fixed-price orders
 */
contract CarbonMarketplace is Ownable, Pausable, ReentrancyGuard, ERC1155Holder {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct Order {
        uint256 orderId;
        address seller;
        uint256 tokenId;           // Carbon credit token ID
        uint256 amount;            // Amount of credits for sale
        uint256 pricePerCredit;    // Price in cUSD per credit (18 decimals)
        uint256 createdAt;
        bool isActive;
    }
    
    // ============ State Variables ============
    
    IERC1155 public creditToken;
    IERC20 public cUSD;
    address public treasuryAddress;
    
    uint256 private _orderIdCounter;
    mapping(uint256 => Order) public orders;
    
    // Indexes for efficient queries
    mapping(address => uint256[]) private _sellerOrders;
    mapping(uint256 => uint256[]) private _tokenOrders; // tokenId => orderIds
    uint256[] private _activeOrderIds;
    
    // Trading fee (0.5% = 50 basis points)
    uint256 public tradingFeeBps = 50;
    uint256 public constant MAX_FEE_BPS = 500; // Max 5%
    
    // Statistics
    mapping(uint256 => uint256) public totalVolumeByToken;  // tokenId => total cUSD volume
    mapping(uint256 => uint256) public totalTradesByToken;  // tokenId => number of trades
    
    // ============ Events ============
    
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 pricePerCredit
    );
    
    event OrderCancelled(
        uint256 indexed orderId,
        address indexed seller
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 amount,
        uint256 totalPrice,
        uint256 fee
    );
    
    event OrderPartiallyFilled(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amountFilled,
        uint256 amountRemaining
    );
    
    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // ============ Constructor ============
    
    constructor(
        address _creditToken,
        address _cUSD,
        address _treasury
    ) Ownable(msg.sender) {
        require(_creditToken != address(0), "Invalid credit token");
        require(_cUSD != address(0), "Invalid cUSD");
        require(_treasury != address(0), "Invalid treasury");
        
        creditToken = IERC1155(_creditToken);
        cUSD = IERC20(_cUSD);
        treasuryAddress = _treasury;
        _orderIdCounter = 1;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update trading fee
     * @param newFeeBps New fee in basis points
     */
    function setTradingFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 oldFee = tradingFeeBps;
        tradingFeeBps = newFeeBps;
        emit TradingFeeUpdated(oldFee, newFeeBps);
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
     * @notice Pause marketplace
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause marketplace
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a sell order
     * @param tokenId Carbon credit token ID to sell
     * @param amount Amount of credits to sell
     * @param pricePerCredit Price per credit in cUSD (18 decimals)
     * @return orderId The created order ID
     */
    function createSellOrder(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerCredit
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be positive");
        require(pricePerCredit > 0, "Price must be positive");
        require(
            creditToken.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient balance"
        );
        
        uint256 orderId = _orderIdCounter++;
        
        // Transfer credits to marketplace (escrow)
        creditToken.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        
        // Create order
        orders[orderId] = Order({
            orderId: orderId,
            seller: msg.sender,
            tokenId: tokenId,
            amount: amount,
            pricePerCredit: pricePerCredit,
            createdAt: block.timestamp,
            isActive: true
        });
        
        // Update indexes
        _sellerOrders[msg.sender].push(orderId);
        _tokenOrders[tokenId].push(orderId);
        _activeOrderIds.push(orderId);
        
        emit OrderCreated(orderId, msg.sender, tokenId, amount, pricePerCredit);
        
        return orderId;
    }
    
    /**
     * @notice Cancel a sell order
     * @param orderId ID of the order to cancel
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(order.seller == msg.sender, "Not order owner");
        
        order.isActive = false;
        
        // Return credits to seller
        creditToken.safeTransferFrom(
            address(this),
            order.seller,
            order.tokenId,
            order.amount,
            ""
        );
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    /**
     * @notice Buy carbon credits from an order
     * @param orderId ID of the order to buy from
     * @param amount Amount of credits to buy
     */
    function buyCredits(uint256 orderId, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Order storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(amount > 0, "Amount must be positive");
        require(amount <= order.amount, "Amount exceeds order");
        
        // Calculate costs
        uint256 totalPrice = amount * order.pricePerCredit / 1e18;
        uint256 fee = (totalPrice * tradingFeeBps) / 10000;
        uint256 sellerProceeds = totalPrice - fee;
        
        // Transfer cUSD from buyer
        cUSD.safeTransferFrom(msg.sender, order.seller, sellerProceeds);
        if (fee > 0) {
            cUSD.safeTransferFrom(msg.sender, treasuryAddress, fee);
        }
        
        // Transfer credits to buyer
        creditToken.safeTransferFrom(
            address(this),
            msg.sender,
            order.tokenId,
            amount,
            ""
        );
        
        // Update order
        order.amount -= amount;
        
        // Update statistics
        totalVolumeByToken[order.tokenId] += totalPrice;
        totalTradesByToken[order.tokenId]++;
        
        if (order.amount == 0) {
            order.isActive = false;
            emit OrderFilled(
                orderId,
                msg.sender,
                order.seller,
                order.tokenId,
                amount,
                totalPrice,
                fee
            );
        } else {
            emit OrderPartiallyFilled(orderId, msg.sender, amount, order.amount);
        }
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get order details
     * @param orderId Order ID
     * @return Order struct
     */
    function getOrder(uint256 orderId) 
        external 
        view 
        returns (Order memory) 
    {
        return orders[orderId];
    }
    
    /**
     * @notice Get multiple orders
     * @param orderIds Array of order IDs
     * @return Array of Order structs
     */
    function getOrders(uint256[] calldata orderIds) 
        external 
        view 
        returns (Order[] memory) 
    {
        Order[] memory result = new Order[](orderIds.length);
        for (uint256 i = 0; i < orderIds.length; i++) {
            result[i] = orders[orderIds[i]];
        }
        return result;
    }
    
    /**
     * @notice Get all orders for a token
     * @param tokenId Token ID
     * @return Array of order IDs
     */
    function getOrdersByToken(uint256 tokenId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _tokenOrders[tokenId];
    }
    
    /**
     * @notice Get active orders for a token
     * @param tokenId Token ID
     * @return Array of active order IDs
     */
    function getActiveOrdersByToken(uint256 tokenId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory tokenOrderIds = _tokenOrders[tokenId];
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < tokenOrderIds.length; i++) {
            if (orders[tokenOrderIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Build result array
        uint256[] memory activeOrders = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < tokenOrderIds.length; i++) {
            if (orders[tokenOrderIds[i]].isActive) {
                activeOrders[index] = tokenOrderIds[i];
                index++;
            }
        }
        
        return activeOrders;
    }
    
    /**
     * @notice Get orders by seller
     * @param seller Seller address
     * @return Array of order IDs
     */
    function getOrdersBySeller(address seller) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _sellerOrders[seller];
    }
    
    /**
     * @notice Get active orders by seller
     * @param seller Seller address
     * @return Array of active order IDs
     */
    function getActiveOrdersBySeller(address seller) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory sellerOrderIds = _sellerOrders[seller];
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < sellerOrderIds.length; i++) {
            if (orders[sellerOrderIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Build result array
        uint256[] memory activeOrders = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < sellerOrderIds.length; i++) {
            if (orders[sellerOrderIds[i]].isActive) {
                activeOrders[index] = sellerOrderIds[i];
                index++;
            }
        }
        
        return activeOrders;
    }
    
    /**
     * @notice Get all active orders
     * @return Array of active order IDs
     */
    function getAllActiveOrders() 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < _activeOrderIds.length; i++) {
            if (orders[_activeOrderIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Build result array
        uint256[] memory activeOrders = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _activeOrderIds.length; i++) {
            if (orders[_activeOrderIds[i]].isActive) {
                activeOrders[index] = _activeOrderIds[i];
                index++;
            }
        }
        
        return activeOrders;
    }
    
    /**
     * @notice Get cheapest order for a token
     * @param tokenId Token ID
     * @return orderId Order ID of cheapest order (0 if none)
     * @return price Price per credit
     */
    function getCheapestOrder(uint256 tokenId) 
        external 
        view 
        returns (uint256 orderId, uint256 price) 
    {
        uint256[] memory tokenOrderIds = _tokenOrders[tokenId];
        uint256 lowestPrice = type(uint256).max;
        uint256 cheapestOrderId = 0;
        
        for (uint256 i = 0; i < tokenOrderIds.length; i++) {
            Order storage order = orders[tokenOrderIds[i]];
            if (order.isActive && order.pricePerCredit < lowestPrice) {
                lowestPrice = order.pricePerCredit;
                cheapestOrderId = order.orderId;
            }
        }
        
        return (cheapestOrderId, lowestPrice);
    }
    
    /**
     * @notice Get market statistics for a token
     * @param tokenId Token ID
     * @return totalVolume Total trading volume in cUSD
     * @return totalTrades Number of completed trades
     * @return activeOrderCount Number of active orders
     */
    function getMarketStats(uint256 tokenId) 
        external 
        view 
        returns (
            uint256 totalVolume,
            uint256 totalTrades,
            uint256 activeOrderCount
        ) 
    {
        uint256[] memory tokenOrderIds = _tokenOrders[tokenId];
        uint256 active = 0;
        
        for (uint256 i = 0; i < tokenOrderIds.length; i++) {
            if (orders[tokenOrderIds[i]].isActive) {
                active++;
            }
        }
        
        return (
            totalVolumeByToken[tokenId],
            totalTradesByToken[tokenId],
            active
        );
    }
    
    /**
     * @notice Calculate cost to buy credits
     * @param orderId Order ID
     * @param amount Amount to buy
     * @return totalCost Total cost including fees
     * @return fee Trading fee amount
     * @return sellerReceives Amount seller receives
     */
    function calculateBuyCost(uint256 orderId, uint256 amount) 
        external 
        view 
        returns (
            uint256 totalCost,
            uint256 fee,
            uint256 sellerReceives
        ) 
    {
        Order storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(amount <= order.amount, "Amount exceeds order");
        
        uint256 basePrice = amount * order.pricePerCredit / 1e18;
        fee = (basePrice * tradingFeeBps) / 10000;
        totalCost = basePrice;
        sellerReceives = basePrice - fee;
        
        return (totalCost, fee, sellerReceives);
    }
    
    /**
     * @notice Get total number of orders created
     * @return Total order count
     */
    function getTotalOrders() external view returns (uint256) {
        return _orderIdCounter - 1;
    }
}