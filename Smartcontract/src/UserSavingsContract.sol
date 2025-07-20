// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IHSTContract {
    function mint(address user, uint256 amount) external;
}

contract UserSavingsContract is Ownable, ReentrancyGuard, Pausable {
    uint256 public constant DEPOSIT_FEE = 100 * 10**6; // ~$0.10 in cUSD
    uint256 public constant WITHDRAW_FEE = 100 * 10**6; // ~$0.10 in cUSD
    uint256 public constant STREAK_BONUS_INTERVAL = 5;
    uint256 public constant HST_BONUS_AMOUNT = 10 * 10**18;
    uint256 public constant GRACE_PERIOD = 1 days;
    uint256 public constant LARGE_DEPOSIT_THRESHOLD = 10000 * 10**6; // $10,000 in cUSD
    uint256 public constant REFERRAL_HST_REWARD = 2 * 10**18;
    uint256 public constant TESTNET_CHAIN_ID = 44787; // Celo Alfajores testnet

    uint256 public totalSavings;
    uint256 public totalUsers;
    address public hstContract;
    address public feeManager;
    address public loanContract;
    IERC20 public cUSDContract;

    enum PlanType { Daily, Weekly, Monthly }
    enum AccountType { None, Individual, Family }

    struct UserDetails {
        string detailsHash;
    }

    struct UserSavings {
        AccountType accountType;
        uint256 balance;
        PlanType planType;
        uint256 streak;
        uint256 lastDepositTime;
        uint256 hstEarned;
        uint256 familyId;
        uint256 lockedBalance;
        UserDetails details;
        bool isVerified; // Replaced kycVerified
        address referrer;
    }

    struct Family {
        string familyName;
        mapping(address => bool) members;
        mapping(address => bool) approvedWithdrawers;
        address creator;
        uint256 memberCount;
        uint256 treasuryBalance;
        uint256 lockedTreasuryBalance;
    }

    struct MemberInput {
        address member;
        string detailsHash;
    }

    mapping(address => UserSavings) public userSavings;
    mapping(uint256 => Family) private families;
    uint256 public nextFamilyId;

    event UserRegistered(address indexed user, AccountType accountType, PlanType planType, uint256 familyId, string detailsHash);
    event FamilyUpdated(address indexed user, uint256 familyId, string familyName);
    event Deposit(address indexed user, uint256 amount, uint256 streak, uint256 familyId);
    event Withdrawal(address indexed user, uint256 amount, uint256 familyId);
    event HSTAwarded(address indexed user, uint256 amount);
    event FundsLocked(address indexed user, uint256 amount, uint256 familyId);
    event FundsUnlocked(address indexed user, uint256 amount, uint256 familyId);
    event WithdrawerApproved(address indexed approver, address indexed withdrawer, uint256 familyId);
    event WithdrawerRevoked(address indexed approver, address indexed withdrawer, uint256 familyId);
    event ReferralRewarded(address indexed referrer, address indexed referee, uint256 amount);
    event StreakUpdated(address indexed user, uint256 newStreak);
    event VerificationStatusUpdated(address indexed user, bool status); // Updated event

    constructor(address _hstContract, address _feeManager, address _cUSDContract, address _loanContract) Ownable() {
        hstContract = _hstContract;
        feeManager = _feeManager;
        cUSDContract = IERC20(_cUSDContract);
        loanContract = _loanContract;
        nextFamilyId = 1;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setUserVerified(address user, bool status) external onlyOwner {
        userSavings[user].isVerified = status;
        emit VerificationStatusUpdated(user, status);
    }

    function isUserVerified(address user) external view returns (bool) {
        return userSavings[user].isVerified;
    }

    function registerIndividual(
        PlanType planType,
        string calldata detailsHash,
        address referrer
    ) external nonReentrant whenNotPaused {
        require(userSavings[msg.sender].accountType == AccountType.None, "Already registered");
        require(uint8(planType) <= uint8(PlanType.Monthly), "Invalid plan type");
        require(bytes(detailsHash).length > 0, "Details hash required");

        userSavings[msg.sender] = UserSavings({
            accountType: AccountType.Individual,
            balance: 0,
            planType: planType,
            streak: 0,
            lastDepositTime: 0,
            hstEarned: 0,
            familyId: 0,
            lockedBalance: 0,
            details: UserDetails({detailsHash: detailsHash}),
            isVerified: false,
            referrer: referrer
        });

        totalUsers += 1;
        emit UserRegistered(msg.sender, AccountType.Individual, planType, 0, detailsHash);

        if (referrer != address(0) && userSavings[referrer].accountType != AccountType.None) {
            _awardHST(referrer, REFERRAL_HST_REWARD);
            emit ReferralRewarded(referrer, msg.sender, REFERRAL_HST_REWARD);
        }
    }

    function registerFamily(
        MemberInput[] calldata members,
        PlanType planType,
        string calldata familyName,
        address referrer
    ) external nonReentrant whenNotPaused {
        require(userSavings[msg.sender].accountType == AccountType.None, "Creator already registered");
        require(members.length > 0 && members.length <= 100, "Invalid member count");
        require(uint8(planType) <= uint8(PlanType.Monthly), "Invalid plan type");
        require(bytes(familyName).length > 0, "Family name required");

        uint256 familyId = nextFamilyId++;
        Family storage family = families[familyId];
        family.familyName = familyName;
        family.creator = msg.sender;

        for (uint256 i = 0; i < members.length; i++) {
            _processMember(members[i], planType, familyId, family);
        }

        family.memberCount = members.length;
        family.approvedWithdrawers[msg.sender] = true;
        emit UserRegistered(msg.sender, AccountType.Family, planType, familyId, members[0].detailsHash);

        if (referrer != address(0) && userSavings[referrer].accountType != AccountType.None) {
            _awardHST(referrer, REFERRAL_HST_REWARD);
            emit ReferralRewarded(referrer, msg.sender, REFERRAL_HST_REWARD);
        }
    }

    function _processMember(
        MemberInput calldata input,
        PlanType planType,
        uint256 familyId,
        Family storage family
    ) internal {
        require(input.member != address(0), "Invalid member address");
        require(bytes(input.detailsHash).length > 0, "Details hash required for member");
        UserSavings storage memberSavings = userSavings[input.member];

        if (memberSavings.accountType == AccountType.None) {
            memberSavings.accountType = AccountType.Family;
            memberSavings.planType = planType;
            memberSavings.familyId = familyId;
            memberSavings.details = UserDetails({detailsHash: input.detailsHash});
            memberSavings.isVerified = false;
            memberSavings.referrer = address(0);
            totalUsers += 1;
            emit UserRegistered(input.member, AccountType.Family, planType, familyId, input.detailsHash);
        } else if (memberSavings.accountType == AccountType.Individual) {
            memberSavings.accountType = AccountType.Family;
            memberSavings.planType = planType;
            memberSavings.familyId = familyId;
            memberSavings.details = UserDetails({detailsHash: input.detailsHash});
            emit FamilyUpdated(input.member, familyId, family.familyName);
        } else {
            revert("Member already in a family");
        }

        family.members[input.member] = true;
    }

    function approveWithdrawer(address withdrawer, uint256 familyId) external nonReentrant whenNotPaused {
        Family storage family = families[familyId];
        require(family.creator == msg.sender, "Only creator can approve withdrawers");
        require(family.members[withdrawer], "Not a family member");
        require(!family.approvedWithdrawers[withdrawer], "Already approved");

        family.approvedWithdrawers[withdrawer] = true;
        emit WithdrawerApproved(msg.sender, withdrawer, familyId);
    }

    function revokeWithdrawer(address withdrawer, uint256 familyId) external nonReentrant whenNotPaused {
        Family storage family = families[familyId];
        require(family.creator == msg.sender, "Only creator can revoke withdrawers");
        require(family.approvedWithdrawers[withdrawer], "Not an approved withdrawer");
        require(withdrawer != msg.sender, "Cannot revoke self");

        family.approvedWithdrawers[withdrawer] = false;
        emit WithdrawerRevoked(msg.sender, withdrawer, familyId);
    }

    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        UserSavings storage savings = userSavings[msg.sender];
        require(savings.accountType != AccountType.None, "Not registered");
        require(amount > DEPOSIT_FEE, "Deposit amount too small");
        if (amount >= LARGE_DEPOSIT_THRESHOLD) {
            require(savings.isVerified, "Verification required for large deposits");
        }

        require(cUSDContract.transferFrom(msg.sender, address(this), amount), "cUSD transfer failed");

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
        bool onTime = (savings.planType == PlanType.Daily && timeSinceLast <= 1 days + GRACE_PERIOD) ||
                      (savings.planType == PlanType.Weekly && timeSinceLast <= 7 days + GRACE_PERIOD) ||
                      (savings.planType == PlanType.Monthly && timeSinceLast <= 30 days + GRACE_PERIOD);

        if (onTime) {
            savings.streak += 1;
            if (savings.streak % STREAK_BONUS_INTERVAL == 0) {
                _awardHST(msg.sender, HST_BONUS_AMOUNT);
            }
        } else {
            savings.streak = 1;
        }
        savings.lastDepositTime = block.timestamp;
        emit StreakUpdated(msg.sender, savings.streak);

        require(cUSDContract.transfer(feeManager, DEPOSIT_FEE), "Fee transfer failed");

        emit Deposit(msg.sender, netAmount, savings.streak, savings.familyId);
    }

    function batchDeposit(address[] calldata users, uint256[] calldata amounts) external nonReentrant whenNotPaused {
        require(users.length == amounts.length, "Mismatched inputs");
        require(users.length <= 50, "Too many users for batch");
        for (uint256 i = 0; i < users.length; i++) {
            UserSavings storage savings = userSavings[users[i]];
            require(savings.accountType != AccountType.None, "User not registered");
            require(amounts[i] > DEPOSIT_FEE, "Deposit amount too small");
            if (amounts[i] >= LARGE_DEPOSIT_THRESHOLD) {
                require(savings.isVerified, "Verification required for large deposits");
            }

            require(cUSDContract.transferFrom(users[i], address(this), amounts[i]), "cUSD transfer failed");
            uint256 netAmount = amounts[i] - DEPOSIT_FEE;
            totalSavings += netAmount;

            if (savings.accountType == AccountType.Individual) {
                savings.balance += netAmount;
            } else {
                uint256 familyId = savings.familyId;
                require(familyId != 0, "Invalid family");
                families[familyId].treasuryBalance += netAmount;
            }

            uint256 timeSinceLast = block.timestamp - savings.lastDepositTime;
            bool onTime = (savings.planType == PlanType.Daily && timeSinceLast <= 1 days + GRACE_PERIOD) ||
                          (savings.planType == PlanType.Weekly && timeSinceLast <= 7 days + GRACE_PERIOD) ||
                          (savings.planType == PlanType.Monthly && timeSinceLast <= 30 days + GRACE_PERIOD);

            if (onTime) {
                savings.streak += 1;
                if (savings.streak % STREAK_BONUS_INTERVAL == 0) {
                    _awardHST(users[i], HST_BONUS_AMOUNT);
                }
            } else {
                savings.streak = 1;
            }
            savings.lastDepositTime = block.timestamp;
            emit StreakUpdated(users[i], savings.streak);
            emit Deposit(users[i], netAmount, savings.streak, savings.familyId);
        }
        require(cUSDContract.transfer(feeManager, DEPOSIT_FEE * users.length), "Batch fee transfer failed");
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        UserSavings storage savings = userSavings[msg.sender];
        require(savings.accountType != AccountType.None, "Not registered");
        require(savings.isVerified, "User must be verified to withdraw"); // Added verification check
        require(amount > WITHDRAW_FEE, "Withdrawal amount too small");

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
            require(families[familyId].approvedWithdrawers[msg.sender], "Not approved to withdraw");
            uint256 availableTreasury = families[familyId].treasuryBalance - families[familyId].lockedTreasuryBalance;
            require(availableTreasury >= amount, "Insufficient unlocked treasury balance");
            families[familyId].treasuryBalance -= amount;
            totalSavings -= amount;
        }

        require(cUSDContract.transfer(msg.sender, withdrawableAmount), "Withdrawal transfer failed");
        require(cUSDContract.transfer(feeManager, WITHDRAW_FEE), "Fee transfer failed");

        emit Withdrawal(msg.sender, amount, savings.familyId);
    }

    function lockFunds(address user, uint256 amount) external nonReentrant whenNotPaused {
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

    function unlockFunds(address user, uint256 amount) external nonReentrant whenNotPaused {
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

    function testMintHST(address user, uint256 amount) external onlyOwner {
        require(block.chainid == TESTNET_CHAIN_ID, "Testnet only");
        _awardHST(user, amount);
    }

    function getSavingsInfo(address user) external view returns (
        AccountType accountType,
        uint256 balance,
        PlanType planType,
        uint256 streak,
        uint256 hstEarned,
        uint256 familyId,
        uint256 familyTreasuryBalance,
        uint256 lastDepositTime,
        string memory detailsHash,
        bool isVerified, // Updated to return isVerified
        address referrer
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
            savings.lastDepositTime,
            savings.details.detailsHash,
            savings.isVerified,
            savings.referrer
        );
    }

    function getUserDashboard(address user) external view returns (
        uint256 balance,
        uint256 hstEarned,
        uint256 streak,
        uint256 loanAmount,
        bool loanRepaid,
        bool isVerified // Updated to return isVerified
    ) {
        UserSavings memory savings = userSavings[user];
        uint256 _loanAmount = 0;
        bool repaid = false;
        if (loanContract != address(0)) {
            (uint256 amount,,, bool _repaid,) = ILoanContract(loanContract).loans(user);
            _loanAmount = amount;
            repaid = _repaid;
        }
        return (
            savings.accountType == AccountType.Individual ? savings.balance : families[savings.familyId].treasuryBalance,
            savings.hstEarned,
            savings.streak,
            _loanAmount,
            repaid,
            savings.isVerified
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

    function getFamilyInfo(uint256 familyId) external view returns (
        string memory familyName,
        address creator,
        uint256 memberCount,
        uint256 treasuryBalance,
        uint256 lockedTreasuryBalance
    ) {
        Family storage family = families[familyId];
        return (
            family.familyName,
            family.creator,
            family.memberCount,
            family.treasuryBalance,
            family.lockedTreasuryBalance
        );
    }

    function isApprovedWithdrawer(address user, uint256 familyId) external view returns (bool) {
        return families[familyId].approvedWithdrawers[user];
    }

    function updateContractAddresses(address _hstContract, address _feeManager, address _cUSDContract, address _loanContract) external onlyOwner {
        hstContract = _hstContract;
        feeManager = _feeManager;
        cUSDContract = IERC20(_cUSDContract);
        loanContract = _loanContract;
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}

interface ILoanContract {
    function loans(address user) external view returns (
        uint256 amount,
        address guarantor,
        uint256 dueDate,
        bool repaid,
        uint256 interest
    );
}   