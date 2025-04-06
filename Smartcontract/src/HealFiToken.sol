// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "./interface.sol";
contract HealFiToken is ERC20, Ownable, Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    string public constant VERSION = "1.0.0";
    
    address public savingsContract;
    address public microcreditContract;
    address public partnersContract;
    
    mapping(address => bool) public rewardDistributors;
    uint256 public maxSupply = 1000000000 * 10**18;
    
    mapping(address => uint256) public userReputationScore;
    mapping(address => uint256) public lastTokenUsage;
    
    struct RewardEvent {
        address user;
        uint256 amount;
        string reason;
        uint256 timestamp;
    }
    
    RewardEvent[] public rewardHistory;
    
    event RewardTokensMinted(address indexed user, uint256 amount, string reason);
    event TokensRedeemed(address indexed user, uint256 amount, string service);
    event ContractsSet(address savings, address microcredit, address partners);
    event EmergencyWithdrawal(address indexed user, uint256 amount);
    event VersionUpgraded(string newVersion);
    
    constructor() ERC20("Health Support Token", "HST") {
        _mint(msg.sender, 100000000 * 10**18);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }
    
    function setContracts(address _savingsContract, address _microcreditContract, address _partnersContract) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        savingsContract = _savingsContract;
        microcreditContract = _microcreditContract;
        partnersContract = _partnersContract;
        
        rewardDistributors[_savingsContract] = true;
        rewardDistributors[_microcreditContract] = true;
        rewardDistributors[_partnersContract] = true;
        
        emit ContractsSet(_savingsContract, _microcreditContract, _partnersContract);
    }
    
    function mintRewardTokens(address to, uint256 amount) 
        external 
        whenNotPaused 
        onlyRole(MINTER_ROLE) 
    {
        require(rewardDistributors[msg.sender], "Not authorized");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        
        _mint(to, amount);
        
        string memory reason = msg.sender == savingsContract ? "savings_reward" :
                             msg.sender == microcreditContract ? "loan_repayment_reward" :
                             "healthcare_engagement_reward";
        
        rewardHistory.push(RewardEvent({
            user: to,
            amount: amount,
            reason: reason,
            timestamp: block.timestamp
        }));
        
        userReputationScore[to] += amount / 100;
        emit RewardTokensMinted(to, amount, reason);
    }
    
    function addRewardDistributor(address distributor) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        rewardDistributors[distributor] = true;
    }
    
    function removeRewardDistributor(address distributor) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        rewardDistributors[distributor] = false;
    }
    
    function redeemForService(uint256 amount, string memory service) 
        external 
        whenNotPaused 
    {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        lastTokenUsage[msg.sender] = block.timestamp;
        emit TokensRedeemed(msg.sender, amount, service);
    }
    
    function emergencyWithdraw(uint256 amount) 
        external 
        whenPaused 
    {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, owner(), amount);
        emit EmergencyWithdrawal(msg.sender, amount);
    }
    
    function getReputationScore(address user) external view returns (uint256) {
        return userReputationScore[user];
    }
    
    function getUserRewardHistory(address user) external view returns (
        uint256[] memory amounts,
        string[] memory reasons,
        uint256[] memory timestamps
    ) {
        uint256 count = 0;
        for (uint256 i = 0; i < rewardHistory.length; i++) {
            if (rewardHistory[i].user == user) count++;
        }
        
        amounts = new uint256[](count);
        reasons = new string[](count);
        timestamps = new uint256[](count);
        
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
    
    function governanceMint(address to, uint256 amount) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function upgradeTo(string memory newVersion) external onlyOwner {
        emit VersionUpgraded(newVersion);
    }
}