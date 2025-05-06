// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IHSTContract {
    function mint(address user, uint256 amount) external;
}

contract UserSavingsContract is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant DEPOSIT_FEE = 100 * 10**6; // ~N100 ≈ $0.06 in USDT (6 decimals)
    uint256 public constant WITHDRAW_FEE = 100 * 10**6; // ~N100 in USDT
    uint256 public constant STREAK_BONUS_INTERVAL = 5;
    uint256 public constant HST_BONUS_AMOUNT = 10 * 10**18; // 10 HST (18 decimals)

    // State variables
    uint256 public totalSavings; // Tracks total USDT saved
    uint256 public totalUsers;
    address public hstContract;
    address public feeManager;
    address public loanContract; // Added for locking funds
    IERC20 public usdtContract; // USDT contract address

    // Enums
    enum PlanType { Daily, Weekly, Monthly }
    enum AccountType { None, Individual, Family }

    // Structs
    struct UserSavings {
        AccountType accountType;
        uint256 balance; // USDT balance
        PlanType planType;
        uint256 streak;
        uint256 lastDepositTime;
        uint256 hstEarned;
        uint256 familyId;
        uint256 lockedBalance; // USDT locked for guarantees (Individual only)
    }

    struct Family {
        mapping(address => bool) members;
        uint256 memberCount;
        uint256 treasuryBalance; // USDT treasury balance
        uint256 lockedTreasuryBalance; // USDT locked for guarantees (Family only)
    }

    // Mappings
    mapping(address => UserSavings) public userSavings;
    mapping(uint256 => Family) private families;
    uint256 public nextFamilyId;

    // Events
    event UserRegistered(address indexed user, AccountType accountType, PlanType planType, uint256 familyId);
    event Deposit(address indexed user, uint256 amount, uint256 streak, uint256 familyId);
    event Withdrawal(address indexed user, uint256 amount, uint256 familyId);
    event HSTAwarded(address indexed user, uint256 amount);
    event FundsLocked(address indexed user, uint256 amount, uint256 familyId);
    event FundsUnlocked(address indexed user, uint256 amount, uint256 familyId);

    constructor(address _hstContract, address _feeManager, address _usdtContract, address _loanContract) Ownable() {
        hstContract = _hstContract;
        feeManager = _feeManager;
        usdtContract = IERC20(_usdtContract);
        loanContract = _loanContract;
        nextFamilyId = 1;
    }

    function registerIndividual(PlanType planType) external nonReentrant {
        require(userSavings[msg.sender].accountType == AccountType.None, "Already registered");
        require(uint8(planType) <= uint8(PlanType.Monthly), "Invalid plan type");

        userSavings[msg.sender] = UserSavings({
            accountType: AccountType.Individual,
            balance: 0,
            planType: planType,
            streak: 0,
            lastDepositTime: 0,
            hstEarned: 0,
            familyId: 0,
            lockedBalance: 0
        });

        totalUsers += 1;
        emit UserRegistered(msg.sender, AccountType.Individual, planType, 0);
    }

    function registerFamily(address[] calldata members, PlanType planType) external nonReentrant {
        require(userSavings[msg.sender].accountType == AccountType.None, "Already registered");
        require(members.length > 0, "At least one member required");
        require(uint8(planType) <= uint8(PlanType.Monthly), "Invalid plan type");

        uint256 familyId = nextFamilyId++;
        Family storage family = families[familyId];

        for (uint256 i = 0; i < members.length; i++) {
            require(members[i] != address(0), "Invalid member address");
            require(userSavings[members[i]].accountType == AccountType.None, "Member already registered");
            family.members[members[i]] = true;
            userSavings[members[i]] = UserSavings({
                accountType: AccountType.Family,
                balance: 0,
                planType: planType,
                streak: 0,
                lastDepositTime: 0,
                hstEarned: 0,
                familyId: familyId,
                lockedBalance: 0
            });
            totalUsers += 1;
        }
        family.memberCount = members.length;

        emit UserRegistered(msg.sender, AccountType.Family, planType, familyId);
    }

    function deposit(uint256 amount) external nonReentrant {
        UserSavings storage savings = userSavings[msg.sender];
        require(savings.accountType != AccountType.None, "Not registered");
        require(amount > DEPOSIT_FEE, "Deposit too small");

        // Transfer USDT from user to contract
        require(usdtContract.transferFrom(msg.sender, address(this), amount), "USDT transfer failed");

        uint256 netAmount = amount - DEPOSIT_FEE;
        totalSavings += netAmount;

        if (savings.accountType == AccountType.Individual) {
            savings.balance += netAmount;
        } else {
            uint256 familyId = savings.familyId;
            require(familyId != 0, "Invalid family");
            families[familyId].treasuryBalance += netAmount;
        }

        uint256 timeSinceLast = block.timestamp - savings.lastDepositTime;
        bool onTime = (savings.planType == PlanType.Daily && timeSinceLast <= 1 days) ||
                      (savings.planType == PlanType.Weekly && timeSinceLast <= 7 days) ||
                      (savings.planType == PlanType.Monthly && timeSinceLast <= 30 days);

        if (onTime) {
            savings.streak += 1;
            if (savings.streak % STREAK_BONUS_INTERVAL == 0) {
                _awardHST(msg.sender, HST_BONUS_AMOUNT);
            }
        } else {
            savings.streak = 1;
        }
        savings.lastDepositTime = block.timestamp;

        // Transfer fee to FeeManager
        require(usdtContract.transfer(feeManager, DEPOSIT_FEE), "Fee transfer failed");

        emit Deposit(msg.sender, netAmount, savings.streak, savings.familyId);
    }

    function withdraw(uint256 amount) external nonReentrant {
        UserSavings storage savings = userSavings[msg.sender];
        require(savings.accountType != AccountType.None, "Not registered");
        require(amount > WITHDRAW_FEE, "Withdrawal too small");

        uint256 withdrawableAmount = amount - WITHDRAW_FEE;

        if (savings.accountType == AccountType.Individual) {
            uint256 availableBalance = savings.balance - savings.lockedBalance;
            require(availableBalance >= amount, "Insufficient unlocked balance");
            savings.balance -= amount;
            totalSavings -= amount;
        } else {
            uint256 familyId = savings.familyId;
            require(familyId != 0, "Invalid family");
            require(families[familyId].members[msg.sender], "Not a family member");
            uint256 availableTreasury = families[familyId].treasuryBalance - families[familyId].lockedTreasuryBalance;
            require(availableTreasury >= amount, "Insufficient unlocked treasury balance");
            families[familyId].treasuryBalance -= amount;
            totalSavings -= amount;
        }

        // Transfer USDT to user
        require(usdtContract.transfer(msg.sender, withdrawableAmount), "Withdrawal transfer failed");

        // Transfer fee to FeeManager
        require(usdtContract.transfer(feeManager, WITHDRAW_FEE), "Fee transfer failed");

        emit Withdrawal(msg.sender, amount, savings.familyId);
    }

    function lockFunds(address user, uint256 amount) external nonReentrant {
        require(msg.sender == loanContract, "Only LoanContract can lock funds");
        UserSavings storage savings = userSavings[user];
        require(savings.accountType != AccountType.None, "User not registered");

        if (savings.accountType == AccountType.Individual) {
            require(savings.balance >= savings.lockedBalance + amount, "Insufficient balance to lock");
            savings.lockedBalance += amount;
        } else {
            uint256 familyId = savings.familyId;
            require(familyId != 0, "Invalid family");
            Family storage family = families[familyId];
            require(family.treasuryBalance >= family.lockedTreasuryBalance + amount, "Insufficient treasury to lock");
            family.lockedTreasuryBalance += amount;
        }

        emit FundsLocked(user, amount, savings.familyId);
    }

    function unlockFunds(address user, uint256 amount) external nonReentrant {
        require(msg.sender == loanContract, "Only LoanContract can unlock funds");
        UserSavings storage savings = userSavings[user];
        require(savings.accountType != AccountType.None, "User not registered");

        if (savings.accountType == AccountType.Individual) {
            require(savings.lockedBalance >= amount, "Insufficient locked balance");
            savings.lockedBalance -= amount;
        } else {
            uint256 familyId = savings.familyId;
            require(familyId != 0, "Invalid family");
            Family storage family = families[familyId];
            require(family.lockedTreasuryBalance >= amount, "Insufficient locked treasury");
            family.lockedTreasuryBalance -= amount;
        }

        emit FundsUnlocked(user, amount, savings.familyId);
    }

    function _awardHST(address user, uint256 amount) internal {
        userSavings[user].hstEarned += amount;
        IHSTContract(hstContract).mint(user, amount);
        emit HSTAwarded(user, amount);
    }

    function getSavingsInfo(address user) external view returns (
        AccountType accountType,
        uint256 balance,
        PlanType planType,
        uint256 streak,
        uint256 hstEarned,
        uint256 familyId,
        uint256 familyTreasuryBalance,
        uint256 lastDepositTime
    ) {
        UserSavings memory savings = userSavings[user];
        uint256 treasuryBalance = savings.accountType == AccountType.Family
            ? families[savings.familyId].treasuryBalance
            : 0;
        return (
            savings.accountType,
            savings.balance,
            savings.planType,
            savings.streak,
            savings.hstEarned,
            savings.familyId,
            treasuryBalance,
            savings.lastDepositTime
        );
    }

    function getLockedBalance(address user) external view returns (uint256) {
        UserSavings memory savings = userSavings[user];
        if (savings.accountType == AccountType.Individual) {
            return savings.lockedBalance;
        } else {
            uint256 familyId = savings.familyId;
            return familyId != 0 ? families[familyId].lockedTreasuryBalance : 0;
        }
    }

    function updateContractAddresses(address _hstContract, address _feeManager, address _usdtContract, address _loanContract) external onlyOwner {
        hstContract = _hstContract;
        feeManager = _feeManager;
        usdtContract = IERC20(_usdtContract);
        loanContract = _loanContract;
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}