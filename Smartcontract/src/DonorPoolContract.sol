// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./HSTContract.sol";

contract DonorPoolContract is Ownable, ReentrancyGuard, Pausable {
    HSTContract public hstContract;
    IERC20 public cUSDContract;
    address public multisigRedemptionContract;
    address public feeManager;
    uint256 public constant TESTNET_CHAIN_ID = 44787; // Celo Alfajores testnet
    uint256 public constant TIME_LOCK_DELAY = 2 days; // Consistent with other contracts

    uint256 public standardPoolBalance;
    uint256 public feeFreePoolBalance;
    uint256 public totalFundsMatched;
    uint256 public constant HST_CUSD_RATE = 1 * 10**6;
    uint256 public constant REDEMPTION_FEE = 10;
    uint256 public constant LARGE_DONATION_THRESHOLD = 10000 * 10**6;

    struct Donor {
        uint256 contribution;
        string poolType;
        uint256 peopleHelped;
        uint256 hstMatched;
        bool kycVerified;
    }

    struct TimeLock {
        uint256 executionTime;
        address hstContract;
        address cUSDContract;
        address multisigRedemptionContract;
        address feeManager;
    }

    mapping(address => Donor) public donorInfo;
    mapping(address => uint256) public facilityPatientsServed;
    mapping(bytes32 => TimeLock) public timeLocks;

    event DonationReceived(address indexed donor, uint256 amount, string poolType);
    event RedemptionMatched(address indexed user, uint256 hstAmount, address indexed facility);
    event AddressUpdateProposed(bytes32 indexed key, address hstContract, address cUSDContract, address multisigRedemptionContract, address feeManager);
    event AddressUpdateExecuted(bytes32 indexed key, address hstContract, address cUSDContract, address multisigRedemptionContract, address feeManager);
    event KYCStatusUpdated(address indexed donor, bool status);

    constructor(address _hstContract, address _cUSDContract, address _multisigRedemptionContract, address _feeManager) Ownable() {
        hstContract = HSTContract(_hstContract);
        cUSDContract = IERC20(_cUSDContract);
        multisigRedemptionContract = _multisigRedemptionContract;
        feeManager = _feeManager;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setKYCStatus(address donor, bool status) external onlyOwner {
        donorInfo[donor].kycVerified = status;
        emit KYCStatusUpdated(donor, status);
    }

    function donate(uint256 amount, string calldata poolType) external nonReentrant whenNotPaused {
        require(keccak256(bytes(poolType)) == keccak256("standard") || keccak256(bytes(poolType)) == keccak256("fee-free"), "Invalid pool type");
        if (amount >= LARGE_DONATION_THRESHOLD) {
            require(donorInfo[msg.sender].kycVerified, "KYC verification required for large donations");
        }
        require(cUSDContract.transferFrom(msg.sender, address(this), amount), "cUSD transfer failed");

        if (keccak256(bytes(poolType)) == keccak256("standard")) {
            standardPoolBalance += amount;
        } else {
            feeFreePoolBalance += amount;
        }

        donorInfo[msg.sender].contribution += amount;
        donorInfo[msg.sender].poolType = poolType;

        emit DonationReceived(msg.sender, amount, poolType);
    }

    function testDonate(uint256 amount, string calldata poolType, address donor) external onlyOwner {
        require(block.chainid == TESTNET_CHAIN_ID, "Testnet only");
        require(keccak256(bytes(poolType)) == keccak256("standard") || keccak256(bytes(poolType)) == keccak256("fee-free"), "Invalid pool type");

        if (keccak256(bytes(poolType)) == keccak256("standard")) {
            standardPoolBalance += amount;
        } else {
            feeFreePoolBalance += amount;
        }

        donorInfo[donor].contribution += amount;
        donorInfo[donor].poolType = poolType;

        emit DonationReceived(donor, amount, poolType);
    }

    function matchRedemption(address user, uint256 hstAmount, address facility) external nonReentrant whenNotPaused {
        require(msg.sender == multisigRedemptionContract, "Only multisig can call");
        require(hstContract.partneredFacilities(facility), "Not a partnered facility");
        uint256 cUSDAmount = (hstAmount * HST_CUSD_RATE) / 10**18;

        uint256 amountFromFeeFree = feeFreePoolBalance >= cUSDAmount ? cUSDAmount : feeFreePoolBalance;
        uint256 amountFromStandard = cUSDAmount - amountFromFeeFree;

        if (amountFromFeeFree > 0) {
            feeFreePoolBalance -= amountFromFeeFree;
            require(cUSDContract.transfer(facility, amountFromFeeFree), "Fee-free transfer failed");
        }

        if (amountFromStandard > 0) {
            standardPoolBalance -= amountFromStandard;
            uint256 fee = (amountFromStandard * REDEMPTION_FEE) / 100;
            uint256 facilityShare = fee / 2;
            uint256 healfiShare = fee / 2;

            require(cUSDContract.transfer(facility, amountFromStandard - fee + facilityShare), "Standard transfer failed");
            require(cUSDContract.transfer(feeManager, healfiShare), "Fee transfer failed");
        }

        totalFundsMatched += cUSDAmount;
        donorInfo[facility].hstMatched += hstAmount;
        donorInfo[facility].peopleHelped += 1;
        facilityPatientsServed[facility] += 1;

        emit RedemptionMatched(user, hstAmount, facility);
    }

    function proposeAddressUpdate(
        address _hstContract,
        address _cUSDContract,
        address _multisigRedemptionContract,
        address _feeManager
    ) external onlyOwner {
        bytes32 key = keccak256(abi.encode(_hstContract, _cUSDContract, _multisigRedemptionContract, _feeManager));
        timeLocks[key] = TimeLock({
            executionTime: block.timestamp + TIME_LOCK_DELAY,
            hstContract: _hstContract,
            cUSDContract: _cUSDContract,
            multisigRedemptionContract: _multisigRedemptionContract,
            feeManager: _feeManager
        });
        emit AddressUpdateProposed(key, _hstContract, _cUSDContract, _multisigRedemptionContract, _feeManager);
    }

    function executeAddressUpdate(
        address _hstContract,
        address _cUSDContract,
        address _multisigRedemptionContract,
        address _feeManager
    ) external onlyOwner {
        bytes32 key = keccak256(abi.encode(_hstContract, _cUSDContract, _multisigRedemptionContract, _feeManager));
        TimeLock memory lock = timeLocks[key];
        require(lock.executionTime > 0 && lock.executionTime <= block.timestamp, "Time lock not expired or invalid");
        hstContract = HSTContract(_hstContract);
        cUSDContract = IERC20(_cUSDContract);
        multisigRedemptionContract = _multisigRedemptionContract;
        feeManager = _feeManager;
        delete timeLocks[key];
        emit AddressUpdateExecuted(key, _hstContract, _cUSDContract, _multisigRedemptionContract, _feeManager);
    }

    function updateContractAddresses(
        address _hstContract,
        address _cUSDContract,
        address _multisigRedemptionContract,
        address _feeManager
    ) external onlyOwner {
        require(_hstContract != address(0), "Invalid HSTContract address");
        require(_cUSDContract != address(0), "Invalid cUSDContract address");
        require(_multisigRedemptionContract != address(0), "Invalid MultisigRedemptionContract address");
        require(_feeManager != address(0), "Invalid FeeManager address");
        hstContract = HSTContract(_hstContract);
        cUSDContract = IERC20(_cUSDContract);
        multisigRedemptionContract = _multisigRedemptionContract;
        feeManager = _feeManager;
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}