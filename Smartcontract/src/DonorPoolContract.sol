// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./HSTContract.sol";

contract DonorPoolContract is Ownable, ReentrancyGuard {
    HSTContract public hstContract;
    IERC20 public usdtContract;
    address public multisigRedemptionContract;
    address public feeManager;

    uint256 public standardPoolBalance;
    uint256 public feeFreePoolBalance;
    uint256 public totalFundsMatched;
    uint256 public constant HST_USDT_RATE = 1 * 10**6; // 1 HST = 1 USDT (6 decimals for USDT)
    uint256 public constant REDEMPTION_FEE = 10; // 10%

    struct Donor {
        uint256 contribution;
        string poolType;
        uint256 peopleHelped;
        uint256 hstMatched;
    }

    mapping(address => Donor) public donorInfo;

    event DonationReceived(address indexed donor, uint256 amount, string poolType);
    event RedemptionMatched(address indexed user, uint256 hstAmount, address indexed facility);

    constructor(address _hstContract, address _usdtContract, address _multisigRedemptionContract, address _feeManager)  Ownable() {
        hstContract = HSTContract(_hstContract);
        usdtContract = IERC20(_usdtContract);
        multisigRedemptionContract = _multisigRedemptionContract;
        feeManager = _feeManager;
    }

    function donate(uint256 amount, string calldata poolType) external nonReentrant {
        require(keccak256(bytes(poolType)) == keccak256("standard") || keccak256(bytes(poolType)) == keccak256("fee-free"), "Invalid pool");
        require(usdtContract.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");

        if (keccak256(bytes(poolType)) == keccak256("standard")) {
            standardPoolBalance += amount;
        } else {
            feeFreePoolBalance += amount;
        }

        donorInfo[msg.sender].contribution += amount;
        donorInfo[msg.sender].poolType = poolType;

        emit DonationReceived(msg.sender, amount, poolType);
    }

    function matchRedemption(address user, uint256 hstAmount, address facility) external nonReentrant {
        require(msg.sender == multisigRedemptionContract, "Only multisig can call");
        uint256 usdtAmount = (hstAmount * HST_USDT_RATE) / 10**18; // Adjust for decimals

        uint256 amountFromFeeFree = feeFreePoolBalance >= usdtAmount ? usdtAmount : feeFreePoolBalance;
        uint256 amountFromStandard = usdtAmount - amountFromFeeFree;

        if (amountFromFeeFree > 0) {
            feeFreePoolBalance -= amountFromFeeFree;
            require(usdtContract.transfer(facility, amountFromFeeFree), "Fee-free transfer failed");
        }

        if (amountFromStandard > 0) {
            standardPoolBalance -= amountFromStandard;
            uint256 fee = (amountFromStandard * REDEMPTION_FEE) / 100;
            uint256 facilityShare = fee / 2;
            uint256 healfiShare = fee / 2;

            require(usdtContract.transfer(facility, amountFromStandard - fee + facilityShare), "Standard transfer failed");
            require(usdtContract.transfer(feeManager, healfiShare), "Fee transfer failed");
        }

        totalFundsMatched += usdtAmount;
        donorInfo[facility].hstMatched += hstAmount;
        donorInfo[facility].peopleHelped += 1;

        emit RedemptionMatched(user, hstAmount, facility);
    }

    function updateContractAddresses(
        address _hstContract,
        address _usdtContract,
        address _multisigRedemptionContract,
        address _feeManager
    ) external onlyOwner {
        hstContract = HSTContract(_hstContract);
        usdtContract = IERC20(_usdtContract);
        multisigRedemptionContract = _multisigRedemptionContract;
        feeManager = _feeManager;
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}