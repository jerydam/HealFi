// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "./interface.sol";

contract HealFiGovernance is Ownable, Pausable, AccessControl {
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    string public constant VERSION = "1.0.0";
    
    address public savingsContract;
    address public microcreditContract;
    address public partnersContract;
    address public tokenContract;
    
    enum ProposalType { General, PartnerVerification, MicrocreditTerm, FeeChange, TreasuryFunding }
    enum ProposalStatus { Active, Passed, Failed, Executed }
    
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
    mapping(address => uint256) public treasury;
    
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;
    uint256 public minimumQuorum = 100 * 10**18;
    uint256 public proposalThreshold = 10 * 10**18;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, ProposalType proposalType);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event ContractsSet(address savings, address microcredit, address partners, address token);
    event TreasuryFunded(address token, uint256 amount);
    event TreasuryWithdrawn(address token, uint256 amount, address recipient);
    event EmergencyTreasuryWithdrawal(address token, uint256 amount);
    event VersionUpgraded(string newVersion);
    
    modifier onlyValidProposal(uint256 proposalId) {
        require(proposalId < proposalCount, "Invalid proposal ID");
        _;
    }
    
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(GOVERNOR_ROLE, msg.sender);
    }
    
    function setContracts(
        address _savingsContract, 
        address _microcreditContract, 
        address _partnersContract, 
        address _tokenContract
    ) external onlyOwner whenNotPaused {
        savingsContract = _savingsContract;
        microcreditContract = _microcreditContract;
        partnersContract = _partnersContract;
        tokenContract = _tokenContract;
        emit ContractsSet(_savingsContract, _microcreditContract, _partnersContract, _tokenContract);
    }
    
   function _createProposal(
        string memory description,
        bytes memory callData,
        address targetContract,
        ProposalType proposalType
    ) internal whenNotPaused returns (uint256) {
        require(IHealFiToken(tokenContract).balanceOf(msg.sender) >= proposalThreshold, 
                "Insufficient tokens");
        
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

    // External wrapper for createProposal
    function createProposal(
        string memory description,
        bytes memory callData,
        address targetContract,
        ProposalType proposalType
    ) external whenNotPaused returns (uint256) {
        return _createProposal(description, callData, targetContract, proposalType);
    }

    
    function castVote(uint256 proposalId, bool support) 
        external 
        onlyValidProposal(proposalId) 
        whenNotPaused 
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Not active");
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 tokenBalance = IHealFiToken(tokenContract).balanceOf(msg.sender);
        uint256 reputationScore = IHealFiToken(tokenContract).getReputationScore(msg.sender);
        uint256 voteWeight = tokenBalance + (reputationScore * 10**16);
        
        if (support) proposal.votesFor += voteWeight;
        else proposal.votesAgainst += voteWeight;
        
        proposal.hasVoted[msg.sender] = true;
        emit VoteCast(proposalId, msg.sender, support, voteWeight);
    }
    
    function executeProposal(uint256 proposalId) 
        external 
        onlyValidProposal(proposalId) 
        whenNotPaused 
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Not active");
        require(block.timestamp > proposal.endTime + executionDelay, "Delay not met");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVotes >= minimumQuorum && proposal.votesFor > proposal.votesAgainst, "Not passed");
        
        proposal.status = ProposalStatus.Passed;
        (bool success, ) = proposal.targetContract.call(proposal.callData);
        require(success, "Execution failed");
        
        proposal.status = ProposalStatus.Executed;
        emit ProposalExecuted(proposalId);
    }
    
    function cancelProposal(uint256 proposalId) 
        external 
        onlyValidProposal(proposalId) 
        whenNotPaused 
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Not active");
        require(msg.sender == proposal.proposer || hasRole(GOVERNOR_ROLE, msg.sender), "Not authorized");
        
        proposal.status = ProposalStatus.Failed;
        emit ProposalCancelled(proposalId);
    }
    
    function updateGovernanceParams(
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _minimumQuorum,
        uint256 _proposalThreshold
    ) external onlyRole(GOVERNOR_ROLE) whenNotPaused {
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        minimumQuorum = _minimumQuorum;
        proposalThreshold = _proposalThreshold;
    }
    
    function fundTreasury(address token, uint256 amount) 
        external 
        whenNotPaused 
    {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        treasury[token] += amount;
        emit TreasuryFunded(token, amount);
    }
    
    function withdrawFromTreasury(address token, uint256 amount, address recipient) 
        external 
        onlyRole(GOVERNOR_ROLE) 
        whenNotPaused 
    {
        require(treasury[token] >= amount, "Insufficient funds");
        treasury[token] -= amount;
        IERC20(token).transfer(recipient, amount);
        emit TreasuryWithdrawn(token, amount, recipient);
    }
    
    function emergencyTreasuryWithdrawal(address token, address recipient) 
        external 
        onlyRole(GOVERNOR_ROLE) 
        whenPaused 
    {
        uint256 amount = treasury[token];
        treasury[token] = 0;
        IERC20(token).transfer(recipient, amount);
        emit EmergencyTreasuryWithdrawal(token, amount);
    }
    
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }
    
    function hasVoted(uint256 proposalId, address user) 
        external 
        view 
        onlyValidProposal(proposalId) 
        returns (bool) 
    {
        return proposals[proposalId].hasVoted[user];
    }
    
    function proposePartnerVerification(address partner, string memory description) 
        external 
        whenNotPaused 
        returns (uint256) 
    {
        bytes memory callData = abi.encodeWithSignature("verifyPartner(address)", partner);
        return _createProposal(description, callData, partnersContract, ProposalType.PartnerVerification);
    }
    
    function proposeMicrocreditTermChange(
        uint256 minimumSavingsStreak,
        uint256 loanFeeRate,
        string memory description
    ) external whenNotPaused returns (uint256) {
        bytes memory callData = abi.encodeWithSignature(
            "updateTerms(uint256,uint256)",
            minimumSavingsStreak,
            loanFeeRate
        );
        return _createProposal(description, callData, microcreditContract, ProposalType.MicrocreditTerm);
    }
    
    function pause() external onlyRole(GOVERNOR_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(GOVERNOR_ROLE) {
        _unpause();
    }
    
    function upgradeTo(string memory newVersion) external onlyRole(GOVERNOR_ROLE) {
        emit VersionUpgraded(newVersion);
    }
}