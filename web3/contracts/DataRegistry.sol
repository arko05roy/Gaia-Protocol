// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

/**
 * @title DataRegistry
 * @notice Registry for verified environmental data for DeSci research
 * @dev Stores anonymized metrics and provides query interface for researchers
 */
contract DataRegistry is Ownable, Pausable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct DataEntry {
        uint256 taskId;
        string projectType;        // e.g., "Mangrove Restoration", "Solar Installation"
        string location;           // Geographic region (anonymized if needed)
        uint256 cost;              // Project cost in cUSD
        uint256 co2Offset;         // Verified CO2 offset in tons
        uint256 timestamp;         // When data was published
        string ipfsHash;           // Full dataset on IPFS
        bool isPublic;             // Whether data is publicly accessible
        address contributor;       // Operator who generated data
        uint256 qualityScore;      // Verification confidence score (0-100)
    }
    
    struct DatasetMetadata {
        uint256 entryCount;
        uint256 totalCO2;
        uint256 totalCost;
        string[] projectTypes;
        string[] locations;
    }
    
    // ============ State Variables ============
    
    ITaskRegistry public taskRegistry;
    address public verificationManagerAddress;
    
    // Data storage
    mapping(uint256 => DataEntry) public dataEntries;  // taskId => DataEntry
    uint256[] private _allEntryIds;
    
    // Indexes for efficient queries
    mapping(string => uint256[]) private _entriesByProjectType;
    mapping(string => uint256[]) private _entriesByLocation;
    mapping(address => uint256[]) private _entriesByContributor;
    
    // Statistics
    uint256 public totalEntries;
    uint256 public totalCO2Recorded;
    uint256 public totalCostRecorded;
    
    // Data contribution rewards
    uint256 public dataRewardAmount = 0.2 ether; // 0.2 cUSD per verified entry
    
    // Access control for private data
    mapping(address => bool) public authorizedResearchers;
    
    // ============ Events ============
    
    event DataPublished(
        uint256 indexed taskId,
        string projectType,
        string location,
        uint256 co2Offset,
        uint256 cost
    );
    
    event DataUpdated(
        uint256 indexed taskId,
        string ipfsHash
    );
    
    event ResearcherAuthorized(
        address indexed researcher
    );
    
    event ResearcherRevoked(
        address indexed researcher
    );
    
    event DataAccessGranted(
        uint256 indexed taskId,
        address indexed researcher
    );
    
    // ============ Constructor ============
    
    constructor(address _taskRegistry) Ownable(msg.sender) {
        require(_taskRegistry != address(0), "Invalid registry");
        taskRegistry = ITaskRegistry(_taskRegistry);
    }
    
    // ============ Modifiers ============
    
    modifier onlyVerificationManager() {
        require(msg.sender == verificationManagerAddress, "Only VerificationManager");
        _;
    }
    
    modifier onlyAuthorizedResearcher() {
        require(
            authorizedResearchers[msg.sender] || msg.sender == owner(),
            "Not authorized researcher"
        );
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
     * @notice Update data reward amount
     * @param newAmount New reward amount
     */
    function setDataRewardAmount(uint256 newAmount) external onlyOwner {
        dataRewardAmount = newAmount;
    }
    
    /**
     * @notice Authorize a researcher for data access
     * @param researcher Researcher address
     */
    function authorizeResearcher(address researcher) external onlyOwner {
        require(researcher != address(0), "Invalid address");
        authorizedResearchers[researcher] = true;
        emit ResearcherAuthorized(researcher);
    }
    
    /**
     * @notice Revoke researcher authorization
     * @param researcher Researcher address
     */
    function revokeResearcher(address researcher) external onlyOwner {
        authorizedResearchers[researcher] = false;
        emit ResearcherRevoked(researcher);
    }
    
    /**
     * @notice Pause data publishing
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause data publishing
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Publish verified task data (called by VerificationManager)
     * @param taskId ID of the verified task
     * @param qualityScore Verification confidence score
     */
    function publishTaskData(uint256 taskId, uint256 qualityScore) 
        external 
        onlyVerificationManager 
        whenNotPaused 
        nonReentrant 
    {
        require(qualityScore <= 100, "Invalid quality score");
        require(dataEntries[taskId].timestamp == 0, "Data already published");
        
        // Get task details
        (
            ,
            ,
            string memory description,
            uint256 estimatedCost,
            ,
            string memory location,
            ,
            ,
            ,
            ,
            ,
            address operator,
            uint256 actualCO2,
            string memory proofHash
        ) = taskRegistry.getTask(taskId);
        
        require(actualCO2 > 0, "No CO2 data");
        
        // Extract project type from description (simplified)
        string memory projectType = _extractProjectType(description);
        
        // Create data entry
        dataEntries[taskId] = DataEntry({
            taskId: taskId,
            projectType: projectType,
            location: location,
            cost: estimatedCost,
            co2Offset: actualCO2,
            timestamp: block.timestamp,
            ipfsHash: proofHash,
            isPublic: true,
            contributor: operator,
            qualityScore: qualityScore
        });
        
        // Update indexes
        _allEntryIds.push(taskId);
        _entriesByProjectType[projectType].push(taskId);
        _entriesByLocation[location].push(taskId);
        _entriesByContributor[operator].push(taskId);
        
        // Update statistics
        totalEntries++;
        totalCO2Recorded += actualCO2;
        totalCostRecorded += estimatedCost;
        
        emit DataPublished(taskId, projectType, location, actualCO2, estimatedCost);
    }
    
    /**
     * @notice Update IPFS hash for additional data
     * @param taskId Task ID
     * @param newIpfsHash New IPFS hash
     */
    function updateDataHash(uint256 taskId, string calldata newIpfsHash) 
        external 
        whenNotPaused 
    {
        DataEntry storage entry = dataEntries[taskId];
        require(entry.timestamp != 0, "Data entry does not exist");
        require(
            msg.sender == entry.contributor || msg.sender == owner(),
            "Not authorized"
        );
        
        entry.ipfsHash = newIpfsHash;
        
        emit DataUpdated(taskId, newIpfsHash);
    }
    
    /**
     * @notice Toggle data entry privacy
     * @param taskId Task ID
     * @param isPublic Whether data should be public
     */
    function setDataPrivacy(uint256 taskId, bool isPublic) external {
        DataEntry storage entry = dataEntries[taskId];
        require(entry.timestamp != 0, "Data entry does not exist");
        require(
            msg.sender == entry.contributor || msg.sender == owner(),
            "Not authorized"
        );
        
        entry.isPublic = isPublic;
    }
    
    // ============ Query Functions ============
    
    /**
     * @notice Get data entry for a task
     * @param taskId Task ID
     * @return DataEntry struct
     */
    function getDataEntry(uint256 taskId) 
        external 
        view 
        returns (DataEntry memory) 
    {
        DataEntry memory entry = dataEntries[taskId];
        require(entry.timestamp != 0, "Data entry does not exist");
        
        // Check access permissions for private data
        if (!entry.isPublic) {
            require(
                authorizedResearchers[msg.sender] || 
                msg.sender == owner() || 
                msg.sender == entry.contributor,
                "No access to private data"
            );
        }
        
        return entry;
    }
    
    /**
     * @notice Get multiple data entries
     * @param taskIds Array of task IDs
     * @return Array of DataEntry structs
     */
    function getDataEntries(uint256[] calldata taskIds) 
        external 
        view 
        returns (DataEntry[] memory) 
    {
        DataEntry[] memory entries = new DataEntry[](taskIds.length);
        
        for (uint256 i = 0; i < taskIds.length; i++) {
            DataEntry memory entry = dataEntries[taskIds[i]];
            
            // Only include if public or caller has access
            if (entry.isPublic || 
                authorizedResearchers[msg.sender] || 
                msg.sender == owner()) {
                entries[i] = entry;
            }
        }
        
        return entries;
    }
    
    /**
     * @notice Query entries by project type
     * @param projectType Project type to filter by
     * @return Array of task IDs
     */
    function queryByProjectType(string calldata projectType) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _entriesByProjectType[projectType];
    }
    
    /**
     * @notice Query entries by location
     * @param location Location to filter by
     * @return Array of task IDs
     */
    function queryByLocation(string calldata location) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _entriesByLocation[location];
    }
    
    /**
     * @notice Query entries by contributor
     * @param contributor Contributor address
     * @return Array of task IDs
     */
    function queryByContributor(address contributor) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _entriesByContributor[contributor];
    }
    
    /**
     * @notice Query entries by date range
     * @param startTime Start timestamp
     * @param endTime End timestamp
     * @return Array of task IDs
     */
    function queryByDateRange(uint256 startTime, uint256 endTime) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(endTime >= startTime, "Invalid date range");
        
        uint256 matchCount = 0;
        
        // Count matches
        for (uint256 i = 0; i < _allEntryIds.length; i++) {
            uint256 taskId = _allEntryIds[i];
            DataEntry storage entry = dataEntries[taskId];
            
            if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
                if (entry.isPublic || authorizedResearchers[msg.sender]) {
                    matchCount++;
                }
            }
        }
        
        // Build result array
        uint256[] memory results = new uint256[](matchCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _allEntryIds.length; i++) {
            uint256 taskId = _allEntryIds[i];
            DataEntry storage entry = dataEntries[taskId];
            
            if (entry.timestamp >= startTime && entry.timestamp <= endTime) {
                if (entry.isPublic || authorizedResearchers[msg.sender]) {
                    results[index] = taskId;
                    index++;
                }
            }
        }
        
        return results;
    }
    
    /**
     * @notice Query entries by CO2 range
     * @param minCO2 Minimum CO2 offset
     * @param maxCO2 Maximum CO2 offset
     * @return Array of task IDs
     */
    function queryByCO2Range(uint256 minCO2, uint256 maxCO2) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(maxCO2 >= minCO2, "Invalid CO2 range");
        
        uint256 matchCount = 0;
        
        // Count matches
        for (uint256 i = 0; i < _allEntryIds.length; i++) {
            uint256 taskId = _allEntryIds[i];
            DataEntry storage entry = dataEntries[taskId];
            
            if (entry.co2Offset >= minCO2 && entry.co2Offset <= maxCO2) {
                if (entry.isPublic || authorizedResearchers[msg.sender]) {
                    matchCount++;
                }
            }
        }
        
        // Build result array
        uint256[] memory results = new uint256[](matchCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _allEntryIds.length; i++) {
            uint256 taskId = _allEntryIds[i];
            DataEntry storage entry = dataEntries[taskId];
            
            if (entry.co2Offset >= minCO2 && entry.co2Offset <= maxCO2) {
                if (entry.isPublic || authorizedResearchers[msg.sender]) {
                    results[index] = taskId;
                    index++;
                }
            }
        }
        
        return results;
    }
    
    /**
     * @notice Get all public entries
     * @return Array of task IDs
     */
    function getAllPublicEntries() external view returns (uint256[] memory) {
        uint256 publicCount = 0;
        
        // Count public entries
        for (uint256 i = 0; i < _allEntryIds.length; i++) {
            if (dataEntries[_allEntryIds[i]].isPublic) {
                publicCount++;
            }
        }
        
        // Build result array
        uint256[] memory results = new uint256[](publicCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _allEntryIds.length; i++) {
            if (dataEntries[_allEntryIds[i]].isPublic) {
                results[index] = _allEntryIds[i];
                index++;
            }
        }
        
        return results;
    }
    
    /**
     * @notice Get dataset statistics
     * @return totalEntries Total number of entries
     * @return totalCO2 Total CO2 offset recorded
     * @return totalCost Total cost of all projects
     * @return avgCostPerTon Average cost per ton of CO2
     */
    function getDatasetStats() 
        external 
        view 
        returns (
            uint256,
            uint256,
            uint256,
            uint256 avgCostPerTon
        ) 
    {
        avgCostPerTon = totalCO2Recorded > 0 ? 
            (totalCostRecorded * 1e18) / totalCO2Recorded : 0;
        
        return (totalEntries, totalCO2Recorded, totalCostRecorded, avgCostPerTon);
    }
    
    /**
     * @notice Get statistics by project type
     * @param projectType Project type
     * @return entryCount Number of entries
     * @return totalCO2 Total CO2 offset
     * @return avgCO2 Average CO2 per project
     */
    function getStatsByProjectType(string calldata projectType) 
        external 
        view 
        returns (
            uint256 entryCount,
            uint256 totalCO2,
            uint256 avgCO2
        ) 
    {
        uint256[] memory entries = _entriesByProjectType[projectType];
        entryCount = entries.length;
        totalCO2 = 0;
        
        for (uint256 i = 0; i < entries.length; i++) {
            totalCO2 += dataEntries[entries[i]].co2Offset;
        }
        
        avgCO2 = entryCount > 0 ? totalCO2 / entryCount : 0;
        
        return (entryCount, totalCO2, avgCO2);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Extract project type from description
     */
    function _extractProjectType(string memory description) 
        private 
        pure 
        returns (string memory) 
    {
        // Simplified extraction - take first 30 chars
        bytes memory descBytes = bytes(description);
        
        if (descBytes.length == 0) {
            return "Unknown";
        }
        
        uint256 length = descBytes.length > 30 ? 30 : descBytes.length;
        bytes memory result = new bytes(length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = descBytes[i];
        }
        
        return string(result);
    }
    
    /**
     * @notice Check if address is authorized researcher
     * @param researcher Address to check
     * @return True if authorized
     */
    function isAuthorizedResearcher(address researcher) 
        external 
        view 
        returns (bool) 
    {
        return authorizedResearchers[researcher];
    }
}