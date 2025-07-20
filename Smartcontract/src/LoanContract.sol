// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./UserSavingsContract.sol";
import "./HSTContract.sol";

contract LoanContract is Ownable, ReentrancyGuard, Pausable {
    UserSavingsContract public userSavingsContract;
    HSTContract public hstContract;
    address public feeManager;
    IERC20 public cUSDContract;

    uint256 public constant MIN_SAVINGS_THRESHOLD = 1000 * 10**6;
    uint256 public constant MIN_HST_THRESHOLD = 10 * 10**18;
    uint256 public constant MIN_ACTIVITY_PERIOD = 180 days;
    uint256 public constant LOAN_INTEREST_RATE = 5;
    uint256 public constant LOAN_ORIGINATION_FEE = 5;
    uint256 public constant GUARANTOR_HST_REWARD = 5 * 10**18;
    uint256 public constant LARGE_LOAN_THRESHOLD = 5000 * 10**6;
    uint256 public constant TIME_LOCK_DELAY = 2 days;
    uint256 public constant TESTNET_CHAIN_ID = 44787;

    struct Loan {
        uint256 amount;
        address guarantor;
        uint256 dueDate;
        bool repaid;
        uint256 interest;
    }

    struct TimeLock {
        uint256 executionTime;
        address hstContract;
        address feeManager;
        address cUSDContract;
        address userSavingsContract;
    }

    mapping(address => Loan) public loans;
    mapping(bytes32 => TimeLock) public timeLocks;
    uint256 public totalLoansDisbursed;
    uint256 public totalLoansRepaid;

    event LoanApplied(address indexed user, uint256 amount);
    event GuarantorStaked(address indexed user, address indexed guarantor, uint256 lockedAmount);
    event LoanDisbursed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);
    event GuarantorFundsUnlocked(address indexed guarantor, uint256 amount);
    event AddressUpdateProposed(bytes32 indexed key, address hstContract, address feeManager, address cUSDContract, address userSavingsContract);
    event AddressUpdateExecuted(bytes32 indexed key, address hstContract, address feeManager, address cUSDContract, address userSavingsContract);

    constructor(address _userSavingsContract, address _hstContract, address _feeManager, address _cUSDContract) Ownable() {
        userSavingsContract = UserSavingsContract(_userSavingsContract);
        hstContract = HSTContract(_hstContract);
        feeManager = _feeManager;
        cUSDContract = IERC20(_cUSDContract);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function applyLoan(uint256 amount) external nonReentrant whenNotPaused {
    require(loans[msg.sender].amount == 0, "Active loan exists");
    require(userSavingsContract.isUserVerified(msg.sender), "User must be verified to apply for loan");
    (bool eligible, string memory reason) = checkEligibilityWithReason(msg.sender);
    require(eligible, reason);

    loans[msg.sender] = Loan({
        amount: amount,
        guarantor: address(0),
        dueDate: 0,
        repaid: false,
        interest: (amount * LOAN_INTEREST_RATE) / 100
    });

    emit LoanApplied(msg.sender, amount);
}

    function checkEligibilityWithReason(address user) public view returns (bool, string memory) {
        (
            UserSavingsContract.AccountType accountType,
            uint256 balance,
            ,
            ,
            uint256 hstEarned,
            ,
            uint256 familyTreasuryBalance,
            uint256 lastDepositTime,
            ,
            ,
            
        ) = userSavingsContract.getSavingsInfo(user);

        uint256 effectiveBalance = accountType == UserSavingsContract.AccountType.Individual
            ? balance
            : familyTreasuryBalance;

        if (effectiveBalance < MIN_SAVINGS_THRESHOLD) {
            return (false, "Insufficient savings balance");
        }
        if (hstEarned < MIN_HST_THRESHOLD) {
            return (false, "Insufficient HST earned");
        }
        if (block.timestamp - lastDepositTime > MIN_ACTIVITY_PERIOD) {
            return (false, "Insufficient platform activity");
        }
        return (true, "");
    }

    function stakeGuarantor(address user, address guarantor) external nonReentrant whenNotPaused {
        require(loans[user].amount > 0, "No loan application");
        require(loans[user].guarantor == address(0), "Guarantor already set");
        require(msg.sender == user, "Only borrower can set guarantor");
        (
            UserSavingsContract.AccountType accountType,
            uint256 balance,
            ,
            ,
            ,
            ,
            uint256 familyTreasuryBalance,
            ,
            ,
            ,
            
        ) = userSavingsContract.getSavingsInfo(guarantor);

        uint256 guarantorBalance = accountType == UserSavingsContract.AccountType.Individual
            ? balance
            : familyTreasuryBalance;
        require(guarantorBalance >= loans[user].amount, "Insufficient guarantor balance");

        userSavingsContract.lockFunds(guarantor, loans[user].amount);

        loans[user].guarantor = guarantor;
        emit GuarantorStaked(user, guarantor, loans[user].amount);
    }

    function disburseLoan(address user) external nonReentrant whenNotPaused {
        Loan storage loan = loans[user];
        require(loan.amount > 0, "No loan application");
        require(loan.guarantor != address(0), "No guarantor");
        require(!loan.repaid, "Loan already repaid");

        loan.dueDate = block.timestamp + 180 days;

        require(cUSDContract.transfer(user, loan.amount), "Loan disbursement failed");

        uint256 fee = (loan.amount * LOAN_ORIGINATION_FEE) / 100;
        require(cUSDContract.transfer(feeManager, fee), "Fee transfer failed");

        totalLoansDisbursed += loan.amount;
        emit LoanDisbursed(user, loan.amount);
    }

    function testDisburseLoan(address user) external onlyOwner {
        require(block.chainid == TESTNET_CHAIN_ID, "Testnet only");
        Loan storage loan = loans[user];
        require(loan.amount > 0, "No loan application");
        require(loan.guarantor != address(0), "No guarantor");
        require(!loan.repaid, "Loan already repaid");

        loan.dueDate = block.timestamp + 180 days;
        totalLoansDisbursed += loan.amount;
        emit LoanDisbursed(user, loan.amount);
    }

    function updateContractAddresses(
        address _userSavingsContract,
        address _hstContract,
        address _feeManager,
        address _cUSDContract
    ) external onlyOwner {
        require(_userSavingsContract != address(0), "Invalid UserSavingsContract address");
        require(_hstContract != address(0), "Invalid HSTContract address");
        require(_feeManager != address(0), "Invalid FeeManager address");
        require(_cUSDContract != address(0), "Invalid cUSDContract address");
        userSavingsContract = UserSavingsContract(_userSavingsContract);
        hstContract = HSTContract(_hstContract);
        feeManager = _feeManager;
        cUSDContract = IERC20(_cUSDContract);
    }

    function repayLoan(uint256 amount) external nonReentrant whenNotPaused {
        Loan storage loan = loans[msg.sender];
        require(loan.amount > 0, "No active loan");
        require(!loan.repaid, "Loan already repaid");
        require(amount >= loan.amount + loan.interest, "Insufficient repayment amount");

        require(cUSDContract.transferFrom(msg.sender, address(this), amount), "Repayment transfer failed");

        userSavingsContract.unlockFunds(loan.guarantor, loan.amount);

        loan.amount = 0;
        loan.repaid = true;
        totalLoansRepaid += amount;

        hstContract.mint(loan.guarantor, GUARANTOR_HST_REWARD);

        emit LoanRepaid(msg.sender, amount);
        emit GuarantorFundsUnlocked(loan.guarantor, loan.amount);
    }

    function proposeAddressUpdate(address _userSavingsContract, address _hstContract, address _feeManager, address _cUSDContract) external onlyOwner {
        bytes32 key = keccak256(abi.encode(_userSavingsContract, _hstContract, _feeManager, _cUSDContract));
        timeLocks[key] = TimeLock({
            executionTime: block.timestamp + TIME_LOCK_DELAY,
            userSavingsContract: _userSavingsContract,
            hstContract: _hstContract,
            feeManager: _feeManager,
            cUSDContract: _cUSDContract
        });
        emit AddressUpdateProposed(key, _hstContract, _feeManager, _cUSDContract, _userSavingsContract);
    }

    function executeAddressUpdate(address _userSavingsContract, address _hstContract, address _feeManager, address _cUSDContract) external onlyOwner {
        bytes32 key = keccak256(abi.encode(_userSavingsContract, _hstContract, _feeManager, _cUSDContract));
        TimeLock memory lock = timeLocks[key];
        require(lock.executionTime > 0 && lock.executionTime <= block.timestamp, "Time lock not expired or invalid");
        userSavingsContract = UserSavingsContract(_userSavingsContract);
        hstContract = HSTContract(_hstContract);
        feeManager = _feeManager;
        cUSDContract = IERC20(_cUSDContract);
        delete timeLocks[key];
        emit AddressUpdateExecuted(key, _hstContract, _feeManager, _cUSDContract, _userSavingsContract);
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}