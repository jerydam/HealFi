// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract FeeManagerContract is Ownable, ReentrancyGuard, Pausable {
    IERC20 public cUSDContract; // Changed to cUSD
    uint256 public totalFeesCollected;
    uint256 public healfiBalance;
    mapping(address => uint256) public facilityBalances;

    struct TimeLock {
        uint256 executionTime;
        address cUSDContract;
    }

    mapping(bytes32 => TimeLock) public timeLocks;
    uint256 public constant TIME_LOCK_DELAY = 2 days;

    event FeeCollected(address indexed payer, uint256 amount);
    event FeeDistributed(address indexed facility, uint256 facilityShare, uint256 healfiShare);
    event FacilityBalanceWithdrawn(address indexed facility, uint256 amount);
    event AddressUpdateProposed(bytes32 indexed key, address cUSDContract);
    event AddressUpdateExecuted(bytes32 indexed key, address cUSDContract);

    constructor(address _cUSDContract) Ownable() {
        cUSDContract = IERC20(_cUSDContract);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function collectFee(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "No fee provided");
        require(cUSDContract.transferFrom(msg.sender, address(this), amount), "Fee transfer failed");
        totalFeesCollected += amount;
        healfiBalance += amount;
        emit FeeCollected(msg.sender, amount);
    }

    function distributeRedemptionFee(address facility, uint256 totalFee) external nonReentrant whenNotPaused {
        require(msg.sender == address(this), "Only internal call");
        uint256 facilityShare = totalFee / 2;
        uint256 healfiShare = totalFee / 2;

        healfiBalance -= facilityShare;
        facilityBalances[facility] += facilityShare;

        emit FeeDistributed(facility, facilityShare, healfiShare);
    }

    function withdrawFacilityBalance() external nonReentrant whenNotPaused {
        uint256 amount = facilityBalances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        facilityBalances[msg.sender] = 0;
        require(cUSDContract.transfer(msg.sender, amount), "Withdrawal failed");

        emit FacilityBalanceWithdrawn(msg.sender, amount);
    }

    function proposeUSDTContractUpdate(address _cUSDContract) external onlyOwner {
        bytes32 key = keccak256(abi.encode(_cUSDContract));
        timeLocks[key] = TimeLock({
            executionTime: block.timestamp + TIME_LOCK_DELAY,
            cUSDContract: _cUSDContract
        });
        emit AddressUpdateProposed(key, _cUSDContract);
    }

    function executeUSDTContractUpdate(address _cUSDContract) external onlyOwner {
        bytes32 key = keccak256(abi.encode(_cUSDContract));
        TimeLock memory lock = timeLocks[key];
        require(lock.executionTime > 0 && lock.executionTime <= block.timestamp, "Time lock not expired or invalid");
        cUSDContract = IERC20(_cUSDContract);
        delete timeLocks[key];
        emit AddressUpdateExecuted(key, _cUSDContract);
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}