// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title HealFiToken
 * @dev Health Support Token for the HealFi platform
 */
contract HealFiToken is ERC20, Ownable {
    address public savingsContract;
    address public microcreditContract;
    address public partnersContract;
    
    mapping(address => bool) public rewardDistributors;
    uint256 public maxSupply = 1000000000 * 10**18; // 1 billion tokens
    
    // Token utility
    mapping(address => uint256) public userReputationScore;
    mapping(address => uint256) public lastTokenUsage;
    
    // Rewards tracking
    struct RewardEvent {
        address user;
        uint256 amount;
        string reason;
        uint256 timestamp;
    }
    
    RewardEvent[] public rewardHistory;
    
    // Events
    event RewardTokensMinted(address indexed user, uint256 amount, string reason);
    event TokensRedeemed(address indexed user, uint256 amount, string service);
    event ContractsSet(address savings, address microcredit, address partners);
    
    constructor() ERC20("Health Support Token", "HST") {
        // Mint initial supply for governance and incentives
        _mint(msg.sender, 100000000 * 10**18); // 100 million tokens (10% of max supply)
    }
    
    /**
     * @dev Set addresses of related contracts
     */
    function setContracts(address _savingsContract, address _microcreditContract, address _partnersContract) external onlyOwner {
        savingsContract = _savingsContract;
        microcreditContract = _microcreditContract;
        partnersContract = _partnersContract;
        
        // Add contracts as reward distributors
        rewardDistributors[_savingsContract] = true;
        rewardDistributors[_microcreditContract] = true;
        rewardDistributors[_partnersContract] = true;
        
        emit ContractsSet(_savingsContract, _microcreditContract, _partnersContract);
    }
    
    /**
     * @dev Mint reward tokens for users (can only be called by approved contracts)
     */
    function mintRewardTokens(address to, uint256 amount) external {
        require(rewardDistributors[msg.sender], "Not authorized to distribute rewards");
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
        
        _mint(to, amount);
        
        // Record reward event
        string memory reason;
        if (msg.sender == savingsContract) {
            reason = "savings_reward";
        } else if (msg.sender == microcreditContract) {
            reason = "loan_repayment_reward";
        } else if (msg.sender == partnersContract) {
            reason = "healthcare_engagement_reward";
        }
        
        rewardHistory.push(RewardEvent({
            user: to,
            amount: amount,
            reason: reason,
            timestamp: block.timestamp
        }));
        
        // Update reputation score
        userReputationScore[to] += amount / 100; // Simplified reputation scoring
        
        emit RewardTokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Add a new reward distributor (governance only)
     */
    function addRewardDistributor(address distributor) external onlyOwner {
        rewardDistributors[distributor] = true;
    }
    
    /**
     * @dev Remove a reward distributor (governance only)
     */
    function removeRewardDistributor(address distributor) external onlyOwner {
        rewardDistributors[distributor] = false;
    }
    
    /**
     * @dev Redeem tokens for health services
     */
    function redeemForService(uint256 amount, string memory service) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Burn tokens on redemption
        _burn(msg.sender, amount);
        
        // Record usage
        lastTokenUsage[msg.sender] = block.timestamp;
        
        emit TokensRedeemed(msg.sender, amount, service);
    }
    
    /**
     * @dev Get user reputation score
     */
    function getReputationScore(address user) external view returns (uint256) {
        return userReputationScore[user];
    }
    
    /**
     * @dev Get reward history for a user
     */
    function getUserRewardHistory(address user) external view returns (
        uint256[] memory amounts,
        string[] memory reasons,
        uint256[] memory timestamps
    ) {
        // Count rewards for this user
        uint256 count = 0;
        for (uint256 i = 0; i < rewardHistory.length; i++) {
            if (rewardHistory[i].user == user) {
                count++;
            }
        }
        
        // Create arrays of appropriate size
        amounts = new uint256[](count);
        reasons = new string[](count);
        timestamps = new uint256[](count);
        
        // Fill arrays
        uint256 index = 0;
        for (uint256 i = 0; i < rewardHistory.length; i++) {
            if (rewardHistory[i].user == user) {
                amounts[index] = rewardHistory[i].amount;
                reasons[index] = rewardHistory[i].reason;
                timestamps[index] = rewardHistory[i].timestamp;
                index++;
            }
        }
        
        return (amounts, reasons, timestamps);
    }
    
    /**
     * @dev Governance function to mint additional tokens if needed
     */
    function governanceMint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Would exceed max supply");
        _mint(to, amount);
    }
}