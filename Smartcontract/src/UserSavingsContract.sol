// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IHSTContract {
    function mint(address user, uint256 amount) external;
}

/// @notice A single wallet can hold an Individual savings profile AND belong to a
/// Family at the same time. Both tracks are independent: depositing, withdrawing,
/// streaks and HST are tracked separately per track. `activeAccount` is only a
/// UI/eligibility default (e.g. which balance a loan check uses) and can be
/// switched at any time with `switchActiveAccount` - it never blocks access to
/// either track.
contract UserSavingsContract is Ownable, ReentrancyGuard, Pausable {
    // Assumes a 6-decimal token (e.g. USDT/cUSD-equivalent): 100 * 10**3 = 0.10 token.
    uint256 public constant DEPOSIT_FEE = 100 * 10**3; // ~$0.10 in cUSD
    uint256 public constant WITHDRAW_FEE = 100 * 10**3; // ~$0.10 in cUSD
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

    /// @notice Also used as a "target" selector for deposits/loans/locking, and as
    /// the user's switchable default account. `None` only ever appears as the
    /// zero-value default before a user has registered anything.
    enum AccountType { None, Individual, Family }

    // Relationship of a member within the family. Names live off-chain in IPFS.
    enum MemberRole { Unspecified, Father, Mother, Child, Guardian, Sibling, Other }

    // The two family signers that can be rotated by the owner during recovery
    enum SignerRole { Emergency, Trustee }

    struct UserDetails {
        string detailsHash;
    }

    struct UserSavings {
        // Which pool is used by default for single-target actions (loan
        // eligibility, getSavingsInfo/getUserDashboard). Purely a preference -
        // switch anytime with switchActiveAccount(). Does not gate deposits,
        // withdrawals, or family actions, which always take an explicit target.
        AccountType activeAccount;

        // ---------------- Individual track ----------------
        bool individualRegistered;
        uint256 balance;
        uint256 lockedBalance;
        PlanType individualPlanType;
        uint256 individualStreak;
        uint256 individualLastDepositTime;
        uint256 individualHstEarned;
        UserDetails details;
        bool isVerified; // KYC status is per-wallet, shared across both tracks
        address referrer;

        // ---------------- Family track (membership only; shared treasury and
        // ---------------- roles live on the Family struct, keyed by familyId)
        uint256 familyId; // 0 = not currently in a family
        PlanType familyPlanType;
        uint256 familyStreak;
        uint256 familyLastDepositTime;
        uint256 familyHstEarned;
    }

    struct Family {
        string familyName;
        mapping(address => bool) members;
        mapping(address => bool) approvedWithdrawers;
        mapping(address => MemberRole) memberRoles;
        address[] memberList;
        address creator;
        uint256 memberCount;
        uint256 treasuryBalance;
        uint256 lockedTreasuryBalance;
        // IPFS CID of the family record (names, roles, contact details)
        string familyDataHash;
        // Registers on behalf of the family and proposes outbound transactions
        address emergencySigner;
        // Co-signs every outbound family transaction
        address trusteeSigner;
    }

    struct MemberInput {
        address member;
        MemberRole role;
    }

    // A family withdrawal awaiting the trustee's co-signature
    struct WithdrawalRequest {
        uint256 familyId;
        uint256 amount;
        address to;
        address proposer;
        uint256 createdAt;
        bool executed;
        bool cancelled;
    }

    // A member's plea to have one of the family signers replaced by the owner
    struct RecoveryRequest {
        uint256 familyId;
        SignerRole role;
        address proposedSigner;
        address requester;
        // IPFS CID holding the supporting evidence for the request
        string reasonHash;
        uint256 createdAt;
        bool resolved;
    }

    mapping(address => UserSavings) public userSavings;
    mapping(uint256 => Family) private families;
    uint256 public nextFamilyId;

    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(uint256 => uint256[]) private familyWithdrawalRequests;
    uint256 public nextWithdrawalRequestId;

    mapping(uint256 => RecoveryRequest) public recoveryRequests;
    mapping(uint256 => uint256[]) private familyRecoveryRequests;
    uint256 public nextRecoveryRequestId;

    event UserRegistered(address indexed user, AccountType accountType, PlanType planType, uint256 familyId, string detailsHash);
    event FamilyUpdated(address indexed user, uint256 familyId, string familyName);
    event Deposit(address indexed user, AccountType target, uint256 amount, uint256 streak, uint256 familyId);
    event Withdrawal(address indexed user, uint256 amount, uint256 familyId);
    event HSTAwarded(address indexed user, uint256 amount);
    event FundsLocked(address indexed user, uint256 amount, uint256 familyId);
    event FundsUnlocked(address indexed user, uint256 amount, uint256 familyId);
    event WithdrawerApproved(address indexed approver, address indexed withdrawer, uint256 familyId);
    event WithdrawerRevoked(address indexed approver, address indexed withdrawer, uint256 familyId);
    event ReferralRewarded(address indexed referrer, address indexed referee, uint256 amount);
    event StreakUpdated(address indexed user, AccountType target, uint256 newStreak);
    event VerificationStatusUpdated(address indexed user, bool status);
    event ActiveAccountSwitched(address indexed user, AccountType newActiveAccount);
    event FamilyRegistered(
        uint256 indexed familyId,
        string familyName,
        address indexed emergencySigner,
        address indexed trusteeSigner,
        string familyDataHash,
        uint256 memberCount
    );
    event FamilyMemberAdded(uint256 indexed familyId, address indexed member, MemberRole role);
    event FamilyDataHashUpdated(uint256 indexed familyId, string familyDataHash);
    event WithdrawalProposed(uint256 indexed requestId, uint256 indexed familyId, address indexed proposer, uint256 amount, address to);
    event WithdrawalApproved(uint256 indexed requestId, uint256 indexed familyId, address indexed trustee, uint256 amount);
    event WithdrawalCancelled(uint256 indexed requestId, uint256 indexed familyId, address indexed cancelledBy);
    event SignerRecoveryRequested(uint256 indexed requestId, uint256 indexed familyId, SignerRole role, address proposedSigner, address indexed requester);
    event SignerReplaced(uint256 indexed familyId, SignerRole role, address indexed previousSigner, address indexed newSigner);

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

    // ------------------------------------------------------------------
    // Registration
    // ------------------------------------------------------------------

    /// @notice Register (or add) an individual savings profile. Works whether or
    /// not the caller already belongs to a family - both can coexist.
    function registerIndividual(
        PlanType planType,
        string calldata detailsHash,
        address referrer
    ) external nonReentrant whenNotPaused {
        UserSavings storage savings = userSavings[msg.sender];
        require(!savings.individualRegistered, "Individual account already registered");
        require(uint8(planType) <= uint8(PlanType.Monthly), "Invalid plan type");
        require(bytes(detailsHash).length > 0, "Details hash required");

        bool brandNewUser = savings.familyId == 0; // individualRegistered already known false here

        savings.individualRegistered = true;
        savings.individualPlanType = planType;
        savings.details = UserDetails({detailsHash: detailsHash});
        savings.referrer = referrer;
        savings.activeAccount = AccountType.Individual;

        if (brandNewUser) {
            totalUsers += 1;
        }

        emit UserRegistered(msg.sender, AccountType.Individual, planType, savings.familyId, detailsHash);

        if (referrer != address(0) && _isRegistered(referrer)) {
            _awardHST(referrer, REFERRAL_HST_REWARD);
            emit ReferralRewarded(referrer, msg.sender, REFERRAL_HST_REWARD);
        }
    }

    /// @notice Register a family. `familyDataHash` is the IPFS CID holding member names
    /// and roles; only addresses, roles and the CID are kept on-chain. The creator
    /// (and any listed member) may already have an individual account - it is left
    /// untouched.
    /// @param emergencySigner Registers for the family and proposes outbound transactions.
    /// @param trusteeSigner Must co-sign every outbound family transaction.
    function registerFamily(
        MemberInput[] calldata members,
        PlanType planType,
        string calldata familyName,
        string calldata familyDataHash,
        address emergencySigner,
        address trusteeSigner,
        address referrer
    ) external nonReentrant whenNotPaused {
        require(userSavings[msg.sender].familyId == 0, "Creator already in a family");
        require(members.length > 0 && members.length <= 100, "Invalid member count");
        require(uint8(planType) <= uint8(PlanType.Monthly), "Invalid plan type");
        require(bytes(familyName).length > 0, "Family name required");
        require(bytes(familyDataHash).length > 0, "Family data hash required");
        require(emergencySigner != address(0), "Emergency signer required");
        require(trusteeSigner != address(0), "Trustee signer required");
        require(emergencySigner != trusteeSigner, "Signers must be distinct");

        uint256 familyId = nextFamilyId++;
        Family storage family = families[familyId];
        family.familyName = familyName;
        family.creator = msg.sender;
        family.familyDataHash = familyDataHash;
        family.emergencySigner = emergencySigner;
        family.trusteeSigner = trusteeSigner;

        for (uint256 i = 0; i < members.length; i++) {
            _processMember(members[i], planType, familyId, family, familyDataHash);
        }

        family.memberCount = family.memberList.length;
        require(family.members[emergencySigner], "Emergency signer must be a member");
        require(family.members[trusteeSigner], "Trustee signer must be a member");

        family.approvedWithdrawers[emergencySigner] = true;
        emit UserRegistered(msg.sender, AccountType.Family, planType, familyId, familyDataHash);
        emit FamilyRegistered(familyId, familyName, emergencySigner, trusteeSigner, familyDataHash, family.memberCount);

        if (referrer != address(0) && _isRegistered(referrer)) {
            _awardHST(referrer, REFERRAL_HST_REWARD);
            emit ReferralRewarded(referrer, msg.sender, REFERRAL_HST_REWARD);
        }
    }

    function _processMember(
        MemberInput calldata input,
        PlanType planType,
        uint256 familyId,
        Family storage family,
        string calldata familyDataHash
    ) internal {
        require(input.member != address(0), "Invalid member address");
        require(!family.members[input.member], "Duplicate member");
        UserSavings storage memberSavings = userSavings[input.member];
        require(memberSavings.familyId == 0, "Member already in a family");

        bool brandNewUser = !memberSavings.individualRegistered;

        memberSavings.familyId = familyId;
        memberSavings.familyPlanType = planType;

        // Only seed the shared family record hash if this member has no
        // individual profile of their own to keep their detailsHash from.
        if (!memberSavings.individualRegistered) {
            memberSavings.details = UserDetails({detailsHash: familyDataHash});
            memberSavings.activeAccount = AccountType.Family;
        }

        if (brandNewUser) {
            totalUsers += 1;
        }

        family.members[input.member] = true;
        family.memberRoles[input.member] = input.role;
        family.memberList.push(input.member);
        emit FamilyMemberAdded(familyId, input.member, input.role);
        emit UserRegistered(input.member, AccountType.Family, planType, familyId, familyDataHash);
    }

    /// @notice Let a user pick which account is treated as the default for
    /// single-target actions (loan eligibility, getSavingsInfo/getUserDashboard).
    /// Both accounts remain fully usable regardless of which is "active".
    function switchActiveAccount(AccountType target) external whenNotPaused {
        UserSavings storage savings = userSavings[msg.sender];
        require(target == AccountType.Individual || target == AccountType.Family, "Invalid target");
        if (target == AccountType.Individual) {
            require(savings.individualRegistered, "No individual account to switch to");
        } else {
            require(savings.familyId != 0, "No family account to switch to");
        }
        savings.activeAccount = target;
        emit ActiveAccountSwitched(msg.sender, target);
    }

    /// @notice Refresh the IPFS record after members are added or details change.
    function updateFamilyDataHash(uint256 familyId, string calldata familyDataHash) external whenNotPaused {
        Family storage family = families[familyId];
        require(family.emergencySigner != address(0), "Family does not exist");
        require(msg.sender == family.emergencySigner || msg.sender == owner(), "Not authorised");
        require(bytes(familyDataHash).length > 0, "Family data hash required");

        family.familyDataHash = familyDataHash;
        emit FamilyDataHashUpdated(familyId, familyDataHash);
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

    // ------------------------------------------------------------------
    // Deposits / withdrawals
    // ------------------------------------------------------------------

    /// @notice Deposit into either the caller's Individual balance or their
    /// Family's shared treasury. A user with both accounts chooses per call.
    function deposit(uint256 amount, AccountType target) external nonReentrant whenNotPaused {
        UserSavings storage savings = userSavings[msg.sender];
        require(target == AccountType.Individual || target == AccountType.Family, "Invalid deposit target");
        if (target == AccountType.Individual) {
            require(savings.individualRegistered, "No individual account");
        } else {
            require(savings.familyId != 0, "No family account");
        }
        require(amount > DEPOSIT_FEE, "Deposit amount too small");
        if (amount >= LARGE_DEPOSIT_THRESHOLD) {
            require(savings.isVerified, "Verification required for large deposits");
        }

        require(cUSDContract.transferFrom(msg.sender, address(this), amount), "cUSD transfer failed");

        uint256 netAmount = amount - DEPOSIT_FEE;
        totalSavings += netAmount;

        if (target == AccountType.Individual) {
            savings.balance += netAmount;
        } else {
            families[savings.familyId].treasuryBalance += netAmount;
        }

        _applyStreak(msg.sender, target);

        require(cUSDContract.transfer(feeManager, DEPOSIT_FEE), "Fee transfer failed");

        uint256 streak = target == AccountType.Individual ? savings.individualStreak : savings.familyStreak;
        emit Deposit(msg.sender, target, netAmount, streak, savings.familyId);
    }

    /// @notice Admin/cron bulk deposit into the same target (Individual or
    /// Family) for many users in one call.
    function batchDeposit(address[] calldata users, uint256[] calldata amounts, AccountType target) external nonReentrant whenNotPaused {
        require(users.length == amounts.length, "Mismatched inputs");
        require(users.length <= 50, "Too many users for batch");
        require(target == AccountType.Individual || target == AccountType.Family, "Invalid deposit target");

        for (uint256 i = 0; i < users.length; i++) {
            UserSavings storage savings = userSavings[users[i]];
            if (target == AccountType.Individual) {
                require(savings.individualRegistered, "User has no individual account");
            } else {
                require(savings.familyId != 0, "User has no family account");
            }
            require(amounts[i] > DEPOSIT_FEE, "Deposit amount too small");
            if (amounts[i] >= LARGE_DEPOSIT_THRESHOLD) {
                require(savings.isVerified, "Verification required for large deposits");
            }

            require(cUSDContract.transferFrom(users[i], address(this), amounts[i]), "cUSD transfer failed");
            uint256 netAmount = amounts[i] - DEPOSIT_FEE;
            totalSavings += netAmount;

            if (target == AccountType.Individual) {
                savings.balance += netAmount;
            } else {
                families[savings.familyId].treasuryBalance += netAmount;
            }

            _applyStreak(users[i], target);

            uint256 streak = target == AccountType.Individual ? savings.individualStreak : savings.familyStreak;
            emit Deposit(users[i], target, netAmount, streak, savings.familyId);
        }
        require(cUSDContract.transfer(feeManager, DEPOSIT_FEE * users.length), "Batch fee transfer failed");
    }

    /// @notice Withdraw from the caller's individual balance. Family treasuries
    /// always use the two-signature flow: proposeFamilyWithdrawal + approveFamilyWithdrawal.
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        UserSavings storage savings = userSavings[msg.sender];
        require(savings.individualRegistered, "No individual account");
        require(amount > WITHDRAW_FEE, "Withdrawal amount too small");

        uint256 availableBalance = savings.balance - savings.lockedBalance;
        require(availableBalance >= amount, "Insufficient unlocked balance");
        savings.balance -= amount;
        totalSavings -= amount;

        uint256 withdrawableAmount = amount - WITHDRAW_FEE;
        require(cUSDContract.transfer(msg.sender, withdrawableAmount), "Withdrawal transfer failed");
        require(cUSDContract.transfer(feeManager, WITHDRAW_FEE), "Fee transfer failed");

        emit Withdrawal(msg.sender, amount, savings.familyId);
    }

    /// @notice Step 1 of a family withdrawal. Only the emergency signer may propose.
    function proposeFamilyWithdrawal(uint256 amount, address to) external nonReentrant whenNotPaused returns (uint256 requestId) {
        UserSavings storage savings = userSavings[msg.sender];
        require(savings.familyId != 0, "Not a family account");

        uint256 familyId = savings.familyId;
        Family storage family = families[familyId];
        require(msg.sender == family.emergencySigner, "Only emergency signer can propose");
        require(amount > WITHDRAW_FEE, "Withdrawal amount too small");
        require(to != address(0), "Invalid recipient");
        require(family.members[to], "Recipient must be a family member");

        uint256 availableTreasury = family.treasuryBalance - family.lockedTreasuryBalance;
        require(availableTreasury >= amount, "Insufficient unlocked treasury balance");

        requestId = nextWithdrawalRequestId++;
        withdrawalRequests[requestId] = WithdrawalRequest({
            familyId: familyId,
            amount: amount,
            to: to,
            proposer: msg.sender,
            createdAt: block.timestamp,
            executed: false,
            cancelled: false
        });
        familyWithdrawalRequests[familyId].push(requestId);

        emit WithdrawalProposed(requestId, familyId, msg.sender, amount, to);
    }

    /// @notice Step 2 of a family withdrawal. The trustee's co-signature executes it.
    function approveFamilyWithdrawal(uint256 requestId) external nonReentrant whenNotPaused {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        require(request.amount > 0, "Unknown request");
        require(!request.executed, "Already executed");
        require(!request.cancelled, "Request cancelled");

        Family storage family = families[request.familyId];
        require(msg.sender == family.trusteeSigner, "Only trustee signer can approve");

        uint256 availableTreasury = family.treasuryBalance - family.lockedTreasuryBalance;
        require(availableTreasury >= request.amount, "Insufficient unlocked treasury balance");

        request.executed = true;
        family.treasuryBalance -= request.amount;
        totalSavings -= request.amount;

        uint256 withdrawableAmount = request.amount - WITHDRAW_FEE;
        require(cUSDContract.transfer(request.to, withdrawableAmount), "Withdrawal transfer failed");
        require(cUSDContract.transfer(feeManager, WITHDRAW_FEE), "Fee transfer failed");

        emit WithdrawalApproved(requestId, request.familyId, msg.sender, request.amount);
        emit Withdrawal(request.to, request.amount, request.familyId);
    }

    /// @notice Either signer, or the owner, can drop a pending withdrawal.
    function cancelFamilyWithdrawal(uint256 requestId) external nonReentrant whenNotPaused {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        require(request.amount > 0, "Unknown request");
        require(!request.executed, "Already executed");
        require(!request.cancelled, "Already cancelled");

        Family storage family = families[request.familyId];
        require(
            msg.sender == family.emergencySigner || msg.sender == family.trusteeSigner || msg.sender == owner(),
            "Not authorised to cancel"
        );

        request.cancelled = true;
        emit WithdrawalCancelled(requestId, request.familyId, msg.sender);
    }

    /// @notice Any family member can flag a lost or compromised signer. The owner
    /// reviews the request off-chain and then calls replaceFamilySigner.
    function requestSignerRecovery(
        uint256 familyId,
        SignerRole role,
        address proposedSigner,
        string calldata reasonHash
    ) external whenNotPaused returns (uint256 requestId) {
        Family storage family = families[familyId];
        require(family.emergencySigner != address(0), "Family does not exist");
        require(family.members[msg.sender], "Not a family member");
        require(proposedSigner != address(0), "Invalid proposed signer");

        requestId = nextRecoveryRequestId++;
        recoveryRequests[requestId] = RecoveryRequest({
            familyId: familyId,
            role: role,
            proposedSigner: proposedSigner,
            requester: msg.sender,
            reasonHash: reasonHash,
            createdAt: block.timestamp,
            resolved: false
        });
        familyRecoveryRequests[familyId].push(requestId);

        emit SignerRecoveryRequested(requestId, familyId, role, proposedSigner, msg.sender);
    }

    /// @notice Owner-only signer rotation, used when a signer dies or is compromised.
    function replaceFamilySigner(uint256 familyId, SignerRole role, address newSigner) external onlyOwner {
        Family storage family = families[familyId];
        require(family.emergencySigner != address(0), "Family does not exist");
        require(newSigner != address(0), "Invalid new signer");

        address previous;
        if (role == SignerRole.Emergency) {
            require(newSigner != family.trusteeSigner, "Signers must be distinct");
            previous = family.emergencySigner;
            family.emergencySigner = newSigner;
            family.approvedWithdrawers[previous] = false;
            family.approvedWithdrawers[newSigner] = true;
        } else {
            require(newSigner != family.emergencySigner, "Signers must be distinct");
            previous = family.trusteeSigner;
            family.trusteeSigner = newSigner;
        }

        // A replacement signer joins the family if they were not already a member
        if (!family.members[newSigner]) {
            family.members[newSigner] = true;
            family.memberRoles[newSigner] = MemberRole.Guardian;
            family.memberList.push(newSigner);
            family.memberCount = family.memberList.length;

            UserSavings storage newSignerSavings = userSavings[newSigner];
            if (newSignerSavings.familyId == 0) {
                bool brandNewUser = !newSignerSavings.individualRegistered;
                newSignerSavings.familyId = familyId;
                if (!newSignerSavings.individualRegistered) {
                    newSignerSavings.details = UserDetails({detailsHash: family.familyDataHash});
                    newSignerSavings.activeAccount = AccountType.Family;
                }
                if (brandNewUser) {
                    totalUsers += 1;
                }
            }
            emit FamilyMemberAdded(familyId, newSigner, MemberRole.Guardian);
        }

        emit SignerReplaced(familyId, role, previous, newSigner);
    }

    /// @notice Mark a recovery request handled. Kept separate so the owner can close
    /// requests that were resolved another way.
    function resolveRecoveryRequest(uint256 requestId) external onlyOwner {
        RecoveryRequest storage request = recoveryRequests[requestId];
        require(request.proposedSigner != address(0), "Unknown request");
        request.resolved = true;
    }

    // ------------------------------------------------------------------
    // Loan locking (called by LoanContract)
    // ------------------------------------------------------------------

    /// @notice Locks against whichever pool is the user's current activeAccount.
    /// LoanContract reads getSavingsInfo() first (which reports the same
    /// active-account balance) to size the loan/guarantor check, so the two stay
    /// consistent without LoanContract needing to pass a target explicitly.
    function lockFunds(address user, uint256 amount) external nonReentrant whenNotPaused {
        require(msg.sender == loanContract, "Only LoanContract can lock funds");
        UserSavings storage savings = userSavings[user];
        require(_isRegistered(savings), "User not registered");

        if (savings.activeAccount == AccountType.Family) {
            require(savings.familyId != 0, "No family account");
            Family storage family = families[savings.familyId];
            require(family.treasuryBalance >= family.lockedTreasuryBalance + amount, "Insufficient treasury to lock");
            family.lockedTreasuryBalance += amount;
        } else {
            require(savings.individualRegistered, "No individual account");
            require(savings.balance >= savings.lockedBalance + amount, "Insufficient balance to lock");
            savings.lockedBalance += amount;
        }

        emit FundsLocked(user, amount, savings.familyId);
    }

    function unlockFunds(address user, uint256 amount) external nonReentrant whenNotPaused {
        require(msg.sender == loanContract, "Only LoanContract can unlock funds");
        UserSavings storage savings = userSavings[user];
        require(_isRegistered(savings), "User not registered");

        if (savings.activeAccount == AccountType.Family) {
            require(savings.familyId != 0, "No family account");
            Family storage family = families[savings.familyId];
            require(family.lockedTreasuryBalance >= amount, "Insufficient locked treasury");
            family.lockedTreasuryBalance -= amount;
        } else {
            require(savings.individualRegistered, "No individual account");
            require(savings.lockedBalance >= amount, "Insufficient locked balance");
            savings.lockedBalance -= amount;
        }

        emit FundsUnlocked(user, amount, savings.familyId);
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    function _isRegistered(address user) internal view returns (bool) {
        return _isRegistered(userSavings[user]);
    }

    function _isRegistered(UserSavings storage savings) internal view returns (bool) {
        return savings.individualRegistered || savings.familyId != 0;
    }

    function _applyStreak(address user, AccountType target) internal {
        UserSavings storage savings = userSavings[user];
        bool isIndividual = target == AccountType.Individual;

        PlanType plan = isIndividual ? savings.individualPlanType : savings.familyPlanType;
        uint256 lastTime = isIndividual ? savings.individualLastDepositTime : savings.familyLastDepositTime;
        uint256 timeSinceLast = block.timestamp - lastTime;
        bool onTime = (plan == PlanType.Daily && timeSinceLast <= 1 days + GRACE_PERIOD) ||
                      (plan == PlanType.Weekly && timeSinceLast <= 7 days + GRACE_PERIOD) ||
                      (plan == PlanType.Monthly && timeSinceLast <= 30 days + GRACE_PERIOD);

        uint256 newStreak;
        if (isIndividual) {
            savings.individualStreak = onTime ? savings.individualStreak + 1 : 1;
            savings.individualLastDepositTime = block.timestamp;
            newStreak = savings.individualStreak;
        } else {
            savings.familyStreak = onTime ? savings.familyStreak + 1 : 1;
            savings.familyLastDepositTime = block.timestamp;
            newStreak = savings.familyStreak;
        }

        emit StreakUpdated(user, target, newStreak);

        if (newStreak % STREAK_BONUS_INTERVAL == 0) {
            _awardHST(user, HST_BONUS_AMOUNT, isIndividual);
        }
    }

    /// @dev Credits HST to whichever track the caller specifies.
    function _awardHST(address user, uint256 amount, bool individualTrack) internal {
        UserSavings storage savings = userSavings[user];
        if (individualTrack) {
            savings.individualHstEarned += amount;
        } else {
            savings.familyHstEarned += amount;
        }
        IHSTContract(hstContract).mint(user, amount);
        emit HSTAwarded(user, amount);
    }

    /// @dev Convenience overload for call sites (referrals, test minting) that
    /// don't know which specific track a bonus belongs to - credits whichever
    /// account is currently active for that address.
    function _awardHST(address user, uint256 amount) internal {
        bool individualTrack = userSavings[user].activeAccount != AccountType.Family;
        _awardHST(user, amount, individualTrack);
    }

    function testMintHST(address user, uint256 amount) external onlyOwner {
        require(block.chainid == TESTNET_CHAIN_ID, "Testnet only");
        _awardHST(user, amount);
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    /// @notice Backward-compatible summary: reports whichever account is
    /// currently "active" for this user (see activeAccount / switchActiveAccount).
    /// Use getIndividualAccount / getFamilyAccount / getAccountStatus below to
    /// read both tracks at once.
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
        bool isVerified,
        address referrer
    ) {
        UserSavings storage savings = userSavings[user];
        bool activeIsFamily = savings.activeAccount == AccountType.Family;

        uint256 treasuryBalance = savings.familyId != 0 ? families[savings.familyId].treasuryBalance : 0;

        return (
            savings.activeAccount,
            savings.balance,
            activeIsFamily ? savings.familyPlanType : savings.individualPlanType,
            activeIsFamily ? savings.familyStreak : savings.individualStreak,
            activeIsFamily ? savings.familyHstEarned : savings.individualHstEarned,
            savings.familyId,
            treasuryBalance,
            activeIsFamily ? savings.familyLastDepositTime : savings.individualLastDepositTime,
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
        bool isVerified
    ) {
        UserSavings storage savings = userSavings[user];
        bool activeIsFamily = savings.activeAccount == AccountType.Family;

        uint256 _loanAmount = 0;
        bool repaid = false;
        if (loanContract != address(0)) {
            (uint256 amount,,, bool _repaid,) = ILoanContract(loanContract).loans(user);
            _loanAmount = amount;
            repaid = _repaid;
        }
        return (
            activeIsFamily ? families[savings.familyId].treasuryBalance : savings.balance,
            activeIsFamily ? savings.familyHstEarned : savings.individualHstEarned,
            activeIsFamily ? savings.familyStreak : savings.individualStreak,
            _loanAmount,
            repaid,
            savings.isVerified
        );
    }

    /// @notice Which accounts this user has, and which is currently active.
    function getAccountStatus(address user) external view returns (
        bool hasIndividualAccount,
        bool hasFamilyAccount,
        uint256 familyId,
        AccountType activeAccount
    ) {
        UserSavings storage savings = userSavings[user];
        return (savings.individualRegistered, savings.familyId != 0, savings.familyId, savings.activeAccount);
    }

    /// @notice Full individual-track data, independent of activeAccount or
    /// family membership.
    function getIndividualAccount(address user) external view returns (
        bool registered,
        uint256 balance,
        uint256 lockedBalance,
        PlanType planType,
        uint256 streak,
        uint256 hstEarned,
        uint256 lastDepositTime,
        string memory detailsHash,
        bool isVerified,
        address referrer
    ) {
        UserSavings storage savings = userSavings[user];
        return (
            savings.individualRegistered,
            savings.balance,
            savings.lockedBalance,
            savings.individualPlanType,
            savings.individualStreak,
            savings.individualHstEarned,
            savings.individualLastDepositTime,
            savings.details.detailsHash,
            savings.isVerified,
            savings.referrer
        );
    }

    /// @notice Full family-track data for this user (their personal streak/HST
    /// within the family, plus the shared family treasury they draw on).
    function getFamilyAccount(address user) external view returns (
        bool isMember,
        uint256 familyId,
        string memory familyName,
        uint256 treasuryBalance,
        uint256 lockedTreasuryBalance,
        PlanType planType,
        uint256 streak,
        uint256 hstEarned,
        uint256 lastDepositTime
    ) {
        UserSavings storage savings = userSavings[user];
        uint256 fid = savings.familyId;
        Family storage family = families[fid];
        return (
            fid != 0,
            fid,
            family.familyName,
            family.treasuryBalance,
            family.lockedTreasuryBalance,
            savings.familyPlanType,
            savings.familyStreak,
            savings.familyHstEarned,
            savings.familyLastDepositTime
        );
    }

    function getLockedBalance(address user) external view returns (uint256) {
        UserSavings storage savings = userSavings[user];
        if (savings.activeAccount == AccountType.Family && savings.familyId != 0) {
            return families[savings.familyId].lockedTreasuryBalance;
        }
        return savings.lockedBalance;
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

    function getFamilySigners(uint256 familyId) external view returns (
        address emergencySigner,
        address trusteeSigner,
        string memory familyDataHash
    ) {
        Family storage family = families[familyId];
        return (family.emergencySigner, family.trusteeSigner, family.familyDataHash);
    }

    function getFamilyMembers(uint256 familyId) external view returns (
        address[] memory memberAddresses,
        MemberRole[] memory roles
    ) {
        Family storage family = families[familyId];
        uint256 count = family.memberList.length;
        memberAddresses = new address[](count);
        roles = new MemberRole[](count);
        for (uint256 i = 0; i < count; i++) {
            address member = family.memberList[i];
            memberAddresses[i] = member;
            roles[i] = family.memberRoles[member];
        }
    }

    function getMemberRole(uint256 familyId, address member) external view returns (MemberRole) {
        return families[familyId].memberRoles[member];
    }

    function isFamilyMember(uint256 familyId, address member) external view returns (bool) {
        return families[familyId].members[member];
    }

    function getFamilyWithdrawalRequests(uint256 familyId) external view returns (uint256[] memory) {
        return familyWithdrawalRequests[familyId];
    }

    function getFamilyRecoveryRequests(uint256 familyId) external view returns (uint256[] memory) {
        return familyRecoveryRequests[familyId];
    }

    /// @notice Pending (neither executed nor cancelled) withdrawal ids for a family.
    function getPendingWithdrawalRequests(uint256 familyId) external view returns (uint256[] memory pending) {
        uint256[] storage ids = familyWithdrawalRequests[familyId];
        uint256 pendingCount;
        for (uint256 i = 0; i < ids.length; i++) {
            WithdrawalRequest storage request = withdrawalRequests[ids[i]];
            if (!request.executed && !request.cancelled) {
                pendingCount++;
            }
        }

        pending = new uint256[](pendingCount);
        uint256 cursor;
        for (uint256 i = 0; i < ids.length; i++) {
            WithdrawalRequest storage request = withdrawalRequests[ids[i]];
            if (!request.executed && !request.cancelled) {
                pending[cursor++] = ids[i];
            }
        }
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