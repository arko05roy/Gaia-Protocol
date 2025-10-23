// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ITaskRegistry {
    function getTask(uint256 taskId) external view returns (
        uint256 id, address proposer, string memory description,
        uint256 estimatedCost, uint256 expectedCO2, string memory location,
        uint256 deadline, string memory proofRequirements, string memory ipfsHash,
        uint8 status, uint256 createdAt, address assignedOperator,
        uint256 actualCO2, string memory proofHash
    );
}

interface IFundingPool {
    function getFundersWithShares(uint256 taskId) 
        external 
        view 
        returns (address[] memory funders, uint256[] memory shares);
    
    function getPool(uint256 taskId) 
        external 
        view 
        returns (uint256 totalFunded, uint256 fundersCount, bool paymentReleased, bool refundsEnabled);
}

/**
 * @title CarbonCreditMinter
 * @notice Mints ERC1155 carbon credit tokens for verified tasks
 * @dev Each task creates a unique token ID representing its carbon credits
 */
contract CarbonCreditMinter is ERC1155, ERC1155Holder, Ownable, Pausable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct CreditMetadata {
        uint256 taskId;
        uint256 totalCO2;              // Total CO2 offset in tons (18 decimals)
        string projectType;            // e.g., "Mangrove Restoration"
        string location;
        uint256 vintage;               // Year of creation
        uint256 mintedAt;
        uint256 totalSupply;           // Total credits minted
        bool exists;
    }
    
    // ============ State Variables ============
    
    ITaskRegistry public taskRegistry;
    IFundingPool public fundingPool;
    address public verificationManagerAddress;
    
    // Credit tracking: tokenId => metadata
    mapping(uint256 => CreditMetadata) public creditMetadata;
    
    // Retired (burned) credits tracking
    mapping(uint256 => uint256) public retiredCredits;
    mapping(address => mapping(uint256 => uint256)) public userRetiredCredits;
    
    // TokenId is same as taskId for simplicity
    uint256 public totalTokenTypes;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // ============ Events ============
    
    event CreditsMinted(
        uint256 indexed tokenId,
        uint256 indexed taskId,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event CreditsRetired(
        uint256 indexed tokenId,
        address indexed account,
        uint256 amount,
        string reason
    );
    
    event MetadataUpdated(
        uint256 indexed tokenId,
        string projectType
    );
    
    // ============ Constructor ============
    
    constructor(
        address _taskRegistry,
        address _fundingPool,
        string memory baseURI
    ) ERC1155(baseURI) Ownable(msg.sender) {
        require(_taskRegistry != address(0), "Invalid registry");
        require(_fundingPool != address(0), "Invalid funding pool");
        
        taskRegistry = ITaskRegistry(_taskRegistry);
        fundingPool = IFundingPool(_fundingPool);
        _baseTokenURI = baseURI;
    }
    
    // ============ Modifiers ============
    
    modifier onlyVerificationManager() {
        require(msg.sender == verificationManagerAddress, "Only VerificationManager");
        _;
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
     * @notice Update base URI for token metadata
     * @param newURI New base URI
     */
    function setBaseURI(string memory newURI) external onlyOwner {
        _baseTokenURI = newURI;
        _setURI(newURI);
    }
    
    /**
     * @notice Update project type for a credit token
     * @param tokenId Token ID to update
     * @param projectType New project type
     */
    function updateProjectType(uint256 tokenId, string calldata projectType) external onlyOwner {
        require(creditMetadata[tokenId].exists, "Token does not exist");
        creditMetadata[tokenId].projectType = projectType;
        emit MetadataUpdated(tokenId, projectType);
    }
    
    /**
     * @notice Pause minting
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Mint carbon credits for a verified task
     * @param taskId ID of the verified task
     */
    function mintCredits(uint256 taskId) 
        external 
        onlyVerificationManager 
        whenNotPaused 
        nonReentrant 
    {
        require(!creditMetadata[taskId].exists, "Credits already minted");
        
        // Get task details
        (
            ,
            ,
            string memory description,
            ,
            ,
            string memory location,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 actualCO2,
        ) = taskRegistry.getTask(taskId);
        
        require(actualCO2 > 0, "No CO2 offset recorded");
        
        // Get funders and their shares
        (address[] memory funders, uint256[] memory shares) = fundingPool.getFundersWithShares(taskId);
        require(funders.length > 0, "No funders found");
        
        // Get total funded amount
        (uint256 totalFunded, , , ) = fundingPool.getPool(taskId);
        require(totalFunded > 0, "Invalid pool");
        
        // Mint proportional credits to each funder
        uint256[] memory amounts = new uint256[](funders.length);
        
        for (uint256 i = 0; i < funders.length; i++) {
            // Calculate proportional credits: (funderShare / totalFunded) * actualCO2
            amounts[i] = (shares[i] * actualCO2) / totalFunded;
        }
        
        // Mint total supply to contract, then distribute to funders
        _mint(address(this), taskId, actualCO2, "");
        
        // For each funder, transfer from contract to funder
        for (uint256 i = 0; i < funders.length; i++) {
            if (amounts[i] > 0) {
                _safeTransferFrom(address(this), funders[i], taskId, amounts[i], "");
            }
        }
        
        // Store metadata
        creditMetadata[taskId] = CreditMetadata({
            taskId: taskId,
            totalCO2: actualCO2,
            projectType: _extractProjectType(description),
            location: location,
            vintage: block.timestamp / 365 days + 1970, // Approximate year
            mintedAt: block.timestamp,
            totalSupply: actualCO2,
            exists: true
        });
        
        totalTokenTypes++;
        
        emit CreditsMinted(taskId, taskId, actualCO2, funders.length);
    }
    
    /**
     * @notice Retire (burn) carbon credits for offsetting
     * @param tokenId Token ID to retire
     * @param amount Amount to retire
     * @param reason Reason for retirement (e.g., "Corporate ESG 2025")
     */
    function retireCredits(
        uint256 tokenId,
        uint256 amount,
        string calldata reason
    ) external whenNotPaused nonReentrant {
        require(creditMetadata[tokenId].exists, "Token does not exist");
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        
        // Burn the credits
        _burn(msg.sender, tokenId, amount);
        
        // Track retirement
        retiredCredits[tokenId] += amount;
        userRetiredCredits[msg.sender][tokenId] += amount;
        
        emit CreditsRetired(tokenId, msg.sender, amount, reason);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Extract project type from description (simplified)
     */
    function _extractProjectType(string memory description) private pure returns (string memory) {
        // For MVP, return generic type
        // In production, parse description or use separate field
        bytes memory descBytes = bytes(description);
        
        if (descBytes.length > 20) {
            // Return first 20 chars as project type
            bytes memory result = new bytes(20);
            for (uint i = 0; i < 20; i++) {
                result[i] = descBytes[i];
            }
            return string(result);
        }
        
        return description;
    }
    
    /**
     * @dev Helper for creating singleton arrays
     */
    function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;
        return array;
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get credit metadata for a token
     * @param tokenId Token ID
     * @return Metadata struct
     */
    function getMetadata(uint256 tokenId) 
        external 
        view 
        returns (CreditMetadata memory) 
    {
        require(creditMetadata[tokenId].exists, "Token does not exist");
        return creditMetadata[tokenId];
    }
    
    /**
     * @notice Get circulating supply (minted - retired)
     * @param tokenId Token ID
     * @return Circulating supply
     */
    function getCirculatingSupply(uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        require(creditMetadata[tokenId].exists, "Token does not exist");
        return creditMetadata[tokenId].totalSupply - retiredCredits[tokenId];
    }
    
    /**
     * @notice Get total retired credits for a token
     * @param tokenId Token ID
     * @return Total retired amount
     */
    function getTotalRetired(uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        return retiredCredits[tokenId];
    }
    
    /**
     * @notice Get user's retired credits for a token
     * @param account User address
     * @param tokenId Token ID
     * @return Amount retired by user
     */
    function getUserRetired(address account, uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        return userRetiredCredits[account][tokenId];
    }
    
    /**
     * @notice Get all credit tokens owned by an address
     * @param account Address to query
     * @param tokenIds Array of token IDs to check
     * @return balances Array of balances
     */
    function balanceOfBatchForAccount(address account, uint256[] memory tokenIds) 
        public 
        view 
        returns (uint256[] memory balances) 
    {
        balances = new uint256[](tokenIds.length);
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            balances[i] = balanceOf(account, tokenIds[i]);
        }
        
        return balances;
    }
    
    /**
     * @notice Check if credits have been minted for a task
     * @param taskId Task ID
     * @return True if credits exist
     */
    function creditsExist(uint256 taskId) external view returns (bool) {
        return creditMetadata[taskId].exists;
    }
    
    /**
     * @notice Get URI for token metadata
     * @param tokenId Token ID
     * @return URI string
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(creditMetadata[tokenId].exists, "Token does not exist");
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId), ".json"));
    }
    
    /**
     * @notice Support for ERC1155 and ERC165 interfaces
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC1155, ERC1155Holder) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Convert uint to string
     */
    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}