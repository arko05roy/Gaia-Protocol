// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GovernanceDAO
 * @notice Decentralized governance for protocol parameters
 * @dev Token-weighted voting using carbon credit tokens as voting power
 */
contract GovernanceDAO is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Enums ============
    
    enum ProposalState {
        Active,
        Defeated,
        Succeeded,
        Executed,
        Cancelled
    }
    
    // ============ Structs ============
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address targetContract;
        bytes callData;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        bool cancelled;
        uint256 bond;
    }
    
    struct Vote {
        bool hasVoted;
        bool support;
        uint256 votes;
    }
    
    // ============ State Variables ============
    
    IERC1155 public creditToken;
    IERC20 public cUSD;
    
    uint256 private _proposalIdCounter;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    
    // Governance parameters
    uint256 public votingPeriod = 3 days;
    uint256 public proposalBond = 0.2 ether; // 0.2 cUSD bond
    uint256 public quorumPercentageBps = 2000; // 20% quorum
    uint256 public executionDelay = 2 days; // Timelock
    
    mapping(uint256 => uint256) public proposalExecutableAt;
    
    // ============ Events ============
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 endBlock
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votes
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool success
    );
    
    event ProposalCancelled(
        uint256 indexed proposalId
    );
    
    // ============ Constructor ============
    
    constructor(
        address _creditToken,
        address _cUSD
    ) Ownable(msg.sender) {
        require(_creditToken != address(0), "Invalid credit token");
        require(_cUSD != address(0), "Invalid cUSD");
        
        creditToken = IERC1155(_creditToken);
        cUSD = IERC20(_cUSD);
        _proposalIdCounter = 1;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update voting period
     * @param newPeriod New voting period in seconds
     */
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod >= 1 days && newPeriod <= 14 days, "Invalid period");
        votingPeriod = newPeriod;
    }
    
    /**
     * @notice Update proposal bond
     * @param newBond New bond amount
     */
    function setProposalBond(uint256 newBond) external onlyOwner {
        proposalBond = newBond;
    }
    
    /**
     * @notice Update quorum percentage
     * @param newQuorumBps New quorum in basis points
     */
    function setQuorum(uint256 newQuorumBps) external onlyOwner {
        require(newQuorumBps <= 5000, "Max 50%");
        quorumPercentageBps = newQuorumBps;
    }
    
    /**
     * @notice Update execution delay
     * @param newDelay New delay in seconds
     */
    function setExecutionDelay(uint256 newDelay) external onlyOwner {
        require(newDelay <= 7 days, "Max 7 days");
        executionDelay = newDelay;
    }
    
    /**
     * @notice Pause governance
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause governance
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Create a governance proposal
     * @param description Proposal description
     * @param targetContract Contract to call if proposal passes
     * @param callData Encoded function call data
     * @return proposalId The created proposal ID
     */
    function createProposal(
        string calldata description,
        address targetContract,
        bytes calldata callData
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(description).length > 0, "Description required");
        require(targetContract != address(0), "Invalid target");
        
        // Lock bond
        if (proposalBond > 0) {
            cUSD.safeTransferFrom(msg.sender, address(this), proposalBond);
        }
        
        uint256 proposalId = _proposalIdCounter++;
        uint256 endBlock = block.number + (votingPeriod / 12); // Assuming 12s blocks
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: description,
            targetContract: targetContract,
            callData: callData,
            forVotes: 0,
            againstVotes: 0,
            startBlock: block.number,
            endBlock: endBlock,
            executed: false,
            cancelled: false,
            bond: proposalBond
        });
        
        emit ProposalCreated(proposalId, msg.sender, description, endBlock);
        
        return proposalId;
    }
    
    /**
     * @notice Vote on a proposal
     * @param proposalId ID of the proposal
     * @param support True to vote for, false to vote against
     * @param tokenId Carbon credit token ID to use for voting power
     */
    function vote(
        uint256 proposalId,
        bool support,
        uint256 tokenId
    ) external whenNotPaused {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.number <= proposal.endBlock, "Voting ended");
        require(!proposal.cancelled, "Proposal cancelled");
        require(!votes[proposalId][msg.sender].hasVoted, "Already voted");
        
        // Get voting power (credit balance)
        uint256 votingPower = creditToken.balanceOf(msg.sender, tokenId);
        require(votingPower > 0, "No voting power");
        
        // Record vote
        votes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            votes: votingPower
        });
        
        // Update vote counts
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    /**
     * @notice Execute a passed proposal after delay
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(block.number > proposal.endBlock, "Voting not ended");
        
        // Check if proposal succeeded
        ProposalState state = getProposalState(proposalId);
        require(state == ProposalState.Succeeded, "Proposal did not succeed");
        
        // Check timelock
        if (proposalExecutableAt[proposalId] == 0) {
            proposalExecutableAt[proposalId] = block.timestamp + executionDelay;
            return; // Need to wait for delay
        }
        
        require(
            block.timestamp >= proposalExecutableAt[proposalId],
            "Execution delay not passed"
        );
        
        proposal.executed = true;
        
        // Return bond to proposer
        if (proposal.bond > 0) {
            cUSD.safeTransfer(proposal.proposer, proposal.bond);
        }
        
        // Execute the call
        (bool success, ) = proposal.targetContract.call(proposal.callData);
        
        emit ProposalExecuted(proposalId, success);
    }
    
    /**
     * @notice Cancel a proposal (only proposer or owner)
     * @param proposalId ID of the proposal
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );
        
        proposal.cancelled = true;
        
        // Return bond
        if (proposal.bond > 0) {
            cUSD.safeTransfer(proposal.proposer, proposal.bond);
        }
        
        emit ProposalCancelled(proposalId);
    }
    
    // ============ Read Functions ============
    
    /**
     * @notice Get proposal state
     * @param proposalId Proposal ID
     * @return ProposalState enum value
     */
    function getProposalState(uint256 proposalId) 
        public 
        view 
        returns (ProposalState) 
    {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.cancelled) {
            return ProposalState.Cancelled;
        }
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }
        
        // Check quorum and majority
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        
        // For simplicity, assuming total supply is sum of votes
        // In production, track total credit supply
        uint256 quorumVotes = (totalVotes * quorumPercentageBps) / 10000;
        
        if (totalVotes < quorumVotes) {
            return ProposalState.Defeated;
        }
        
        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }
        
        return ProposalState.Defeated;
    }
    
    /**
     * @notice Get proposal details
     * @param proposalId Proposal ID
     * @return Proposal struct
     */
    function getProposal(uint256 proposalId) 
        external 
        view 
        returns (Proposal memory) 
    {
        return proposals[proposalId];
    }
    
    /**
     * @notice Get user's vote on a proposal
     * @param proposalId Proposal ID
     * @param voter Voter address
     * @return hasVoted Whether user has voted
     * @return support Vote direction
     * @return votesCount Number of votes cast
     */
    function getVote(uint256 proposalId, address voter) 
        external 
        view 
        returns (bool hasVoted, bool support, uint256 votesCount) 
    {
        Vote storage v = votes[proposalId][voter];
        return (v.hasVoted, v.support, v.votes);
    }
    
    /**
     * @notice Get voting results for a proposal
     * @param proposalId Proposal ID
     * @return forVotes Votes in favor
     * @return againstVotes Votes against
     * @return totalVotes Total votes cast
     * @return forPercentage Percentage for (basis points)
     */
    function getVotingResults(uint256 proposalId) 
        external 
        view 
        returns (
            uint256 forVotes,
            uint256 againstVotes,
            uint256 totalVotes,
            uint256 forPercentage
        ) 
    {
        Proposal storage proposal = proposals[proposalId];
        forVotes = proposal.forVotes;
        againstVotes = proposal.againstVotes;
        totalVotes = forVotes + againstVotes;
        forPercentage = totalVotes > 0 ? (forVotes * 10000) / totalVotes : 0;
        
        return (forVotes, againstVotes, totalVotes, forPercentage);
    }
    
    /**
     * @notice Check if proposal meets quorum
     * @param proposalId Proposal ID
     * @return meetsQuorum Whether quorum is met
     * @return votesReceived Votes received
     * @return votesRequired Votes required for quorum
     */
    function checkQuorum(uint256 proposalId) 
        external 
        view 
        returns (
            bool meetsQuorum,
            uint256 votesReceived,
            uint256 votesRequired
        ) 
    {
        Proposal storage proposal = proposals[proposalId];
        votesReceived = proposal.forVotes + proposal.againstVotes;
        
        // Simplified: require percentage of total votes
        votesRequired = (votesReceived * quorumPercentageBps) / 10000;
        meetsQuorum = votesReceived >= votesRequired;
        
        return (meetsQuorum, votesReceived, votesRequired);
    }
    
    /**
     * @notice Get time remaining for voting
     * @param proposalId Proposal ID
     * @return blocksRemaining Blocks remaining
     * @return hasEnded Whether voting has ended
     */
    function getTimeRemaining(uint256 proposalId) 
        external 
        view 
        returns (uint256 blocksRemaining, bool hasEnded) 
    {
        Proposal storage proposal = proposals[proposalId];
        
        if (block.number >= proposal.endBlock) {
            return (0, true);
        }
        
        return (proposal.endBlock - block.number, false);
    }
    
    /**
     * @notice Get total proposals created
     * @return Total proposal count
     */
    function getTotalProposals() external view returns (uint256) {
        return _proposalIdCounter - 1;
    }
    
    /**
     * @notice Check if proposal can be executed
     * @param proposalId Proposal ID
     * @return executable Whether proposal can be executed
     * @return reason Reason if cannot execute
     */
    function canExecute(uint256 proposalId) 
        external 
        view 
        returns (bool executable, string memory reason) 
    {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.id == 0) {
            return (false, "Proposal does not exist");
        }
        
        if (proposal.executed) {
            return (false, "Already executed");
        }
        
        if (proposal.cancelled) {
            return (false, "Proposal cancelled");
        }
        
        if (block.number <= proposal.endBlock) {
            return (false, "Voting not ended");
        }
        
        ProposalState state = this.getProposalState(proposalId);
        if (state != ProposalState.Succeeded) {
            return (false, "Proposal did not succeed");
        }
        
        if (proposalExecutableAt[proposalId] == 0) {
            return (false, "Timelock not initiated");
        }
        
        if (block.timestamp < proposalExecutableAt[proposalId]) {
            return (false, "Timelock not expired");
        }
        
        return (true, "");
    }
}