// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

interface IHealFiToken {
    function balanceOf(address account) external view returns (uint256);
    function getReputationScore(address user) external view returns (uint256);
}

/**
 * @title HealFiGovernance
 * @dev DAO governance for the HealFi platform
 */
contract HealFiGovernance is Ownable {
    address public savingsContract;
    address public microcreditContract;
    address public partnersContract;
    address public tokenContract;
    
    enum ProposalType { 
        General,
        PartnerVerification,
        MicrocreditTerm,
        FeeChange,
        TreasuryFunding
    }
    
    enum ProposalStatus {
        Active,
        Passed,
        Failed,
        Executed
    }
    
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes callData;
        address targetContract;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        ProposalType proposalType;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
    }
    
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    // Community Treasury
    mapping(address => uint256) public treasury; // token => amount
    
    // Governance parameters
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;
    uint256 public minimumQuorum = 100 * 10**18; // 100 tokens
    uint256 public proposalThreshold = 10 * 10**18; // 10 tokens
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, ProposalType proposalType);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event ContractsSet(address savings, address microcredit, address partners, address token);
    event TreasuryFunded(address token, uint256 amount);
    event TreasuryWithdrawn(address token, uint256 amount, address recipient);
    
    modifier onlyValidProposal(uint256 proposalId) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        _;
    }
    
    /**
     * @dev Set addresses of related contracts
     */
    function setContracts(
        address _savingsContract, 
        address _microcreditContract, 
        address _partnersContract, 
        address _tokenContract
    ) external onlyOwner {
        savingsContract = _savingsContract;
        microcreditContract = _microcreditContract;
        partnersContract = _partnersContract;
        tokenContract = _tokenContract;
        emit ContractsSet(_savingsContract, _microcreditContract, _partnersContract, _tokenContract);
    }
    
    /**
     * @dev Create a new governance proposal
     */
    function createProposal(
        string memory description,
        bytes memory callData,
        address targetContract,
        ProposalType proposalType
    ) external returns (uint256) {
        // Check if proposer has enough tokens
        require(IHealFiToken(tokenContract).balanceOf(msg.sender) >= proposalThreshold, 
                "Insufficient tokens to create proposal");
        
        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.callData = callData;
        newProposal.targetContract = targetContract;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;
        newProposal.proposalType = proposalType;
        newProposal.status = ProposalStatus.Active;
        
        emit ProposalCreated(proposalId, msg.sender, description, proposalType);
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on an active proposal
     */
    function castVote(uint256 proposalId, bool support) external onlyValidProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.endTime, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // Calculate voting weight based on token balance and reputation
        uint256 tokenBalance = IHealFiToken(tokenContract).balanceOf(msg.sender);
        uint256 reputationScore = IHealFiToken(tokenContract).getReputationScore(msg.sender);
        
        // Weight calculation: balance + (reputation * weight factor)
        uint256 voteWeight = tokenBalance + (reputationScore * 10**16); // Simplified weight calculation
        
        if (support) {
            proposal.votesFor += voteWeight;
        } else {
            proposal.votesAgainst += voteWeight;
        }
        
        proposal.hasVoted[msg.sender] = true;
        
        emit VoteCast(proposalId, msg.sender, support, voteWeight);
    }
    
    /**
     * @dev Execute a passed proposal after the execution delay
     */
    function executeProposal(uint256 proposalId) external onlyValidProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.status == ProposalStatus.Active, "Proposal not in correct state");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(block.timestamp > proposal.endTime + executionDelay, "Execution delay not met");
        
        // Check if the proposal passed
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVotes >= minimumQuorum, "Quorum not reached");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal did not pass");
        
        // Mark as passed before execution
        proposal.status = ProposalStatus.Passed;
        
        // Execute the proposal
        (bool success, ) = proposal.targetContract.call(proposal.callData);
        require(success, "Proposal execution failed");
        
        // Mark as executed
        proposal.status = ProposalStatus.Executed;
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Cancel a proposal (only by proposer or governance)
     */
    function cancelProposal(uint256 proposalId) external onlyValidProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(msg.sender == proposal.proposer || msg.sender == owner(), "Not authorized");
        
        proposal.status = ProposalStatus.Failed;
        
        emit ProposalCancelled(proposalId);
    }
    
    /**
     * @dev Update governance parameters (only by governance)
     */
    function updateGovernanceParams(
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _minimumQuorum,
        uint256 _proposalThreshold
    ) external onlyOwner {
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        minimumQuorum = _minimumQuorum;
        proposalThreshold = _proposalThreshold;
    }
    
    /**
     * @dev Fund the community treasury
     */
    function fundTreasury(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        treasury[token] += amount;
        
        emit TreasuryFunded(token, amount);
    }
    
    /**
     * @dev Withdraw from community treasury (only by governance)
     */
    function withdrawFromTreasury(address token, uint256 amount, address recipient) external onlyOwner {
        require(treasury[token] >= amount, "Insufficient treasury funds");
        
        treasury[token] -= amount;
        IERC20(token).transfer(recipient, amount);
        
        emit TreasuryWithdrawn(token, amount, recipient);
    }
    
    /**
     * @dev Get proposal count
     */
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }
    
    /**
     * @dev Check if a user has voted on a proposal
     */
    function hasVoted(uint256 proposalId, address user) external view onlyValidProposal(proposalId) returns (bool) {
        return proposals[proposalId].hasVoted[user];
    }
    
    /**
     * @dev Create a partner verification proposal
     */
    function proposePartnerVerification(address partner, string memory description) external returns (uint256) {
        // Create calldata for partner verification
        bytes memory callData = abi.encodeWithSignature("verifyPartner(address)", partner);
        
        return createProposal(
            description,
            callData,
            partnersContract,
            ProposalType.PartnerVerification
        );
    }
    
    /**
     * @dev Create a proposal to change microcredit terms
     */
    function proposeMicrocreditTermChange(
        uint256 minimumSavingsStreak,
        uint256 loanFeeRate,
        string memory description
    ) external returns (uint256) {
        // Example of changing microcredit terms (simplified)
        bytes memory callData = abi.encodeWithSignature(
            "updateTerms(uint256,uint256)",
            minimumSavingsStreak,
            loanFeeRate
        );
        
        return createProposal(
            description,
            callData,
            microcreditContract,
            ProposalType.MicrocreditTerm
        );
    }
}