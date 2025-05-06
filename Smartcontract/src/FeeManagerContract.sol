// SPDX-License-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract FeeManagerContract is Ownable, ReentrancyGuard {
    IERC20 public usdtContract;
    uint256 public totalFeesCollected; // USDT units
    uint256 public healfiBalance; // USDT balance
    mapping(address => uint256) public facilityBalances; // USDT balances

    event FeeCollected(address indexed payer, uint256 amount);
    event FeeDistributed(address indexed facility, uint256 facilityShare, uint256 healfiShare);
    event FacilityBalanceWithdrawn(address indexed facility, uint256 amount);

    constructor(address _usdtContract)  Ownable() {
        usdtContract = IERC20(_usdtContract);
    }

    function collectFee(uint256 amount) external nonReentrant {
        require(amount > 0, "No fee provided");
        require(usdtContract.transferFrom(msg.sender, address(this), amount), "Fee transfer failed");
        totalFeesCollected += amount;
        healfiBalance += amount;
        emit FeeCollected(msg.sender, amount);
    }

    function distributeRedemptionFee(address facility, uint256 totalFee) external nonReentrant {
        require(msg.sender == address(this), "Only internal call"); // Restricted for now
        uint256 facilityShare = totalFee / 2;
        uint256 healfiShare = totalFee / 2;

        healfiBalance -= facilityShare;
        facilityBalances[facility] += facilityShare;

        emit FeeDistributed(facility, facilityShare, healfiShare);
    }

    function withdrawFacilityBalance() external nonReentrant {
        uint256 amount = facilityBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        facilityBalances[msg.sender] = 0;
        require(usdtContract.transfer(msg.sender, amount), "Withdrawal failed");

        emit FacilityBalanceWithdrawn(msg.sender, amount);
    }

    function updateUSDTContract(address _usdtContract) external onlyOwner {
        usdtContract = IERC20(_usdtContract);
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}