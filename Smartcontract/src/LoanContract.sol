// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./UserSavingsContract.sol";
import "./HSTContract.sol";

contract LoanContract is Ownable, ReentrancyGuard {
    UserSavingsContract public userSavingsContract;
    HSTContract public hstContract;
    address public feeManager;
    IERC20 public usdtContract;

    uint256 public constant MIN_SAVINGS_THRESHOLD = 1000 * 10**6; // 1000 USDT (6 decimals)
    uint256 public constant MIN_HST_THRESHOLD = 10 * 10**18; // 10 HST
    uint256 public constant MIN_ACTIVITY_PERIOD = 180 days;
    uint256 public constant LOAN_INTEREST_RATE = 5; // 5%
    uint256 public constant LOAN_ORIGINATION_FEE = 5; // 5%
    uint256 public constant GUARANTOR_HST_REWARD = 5 * 10**18; // 5 HST

    struct Loan {
        uint256 amount; // USDT amount
        address guarantor;
        uint256 dueDate;
        bool repaid;
        uint256 interest;
    }

    mapping(address => Loan) public loans;
    uint256 public totalLoansDisbursed;
    uint256 public totalLoansRepaid;

    event LoanApplied(address indexed user, uint256 amount);
    event GuarantorStaked(address indexed user, address indexed guarantor, uint256 lockedAmount);
    event LoanDisbursed(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount);
    event GuarantorFundsUnlocked(address indexed guarantor, uint256 amount);

    constructor(address _userSavingsContract, address _hstContract, address _feeManager, address _usdtContract) Ownable() {
        userSavingsContract = UserSavingsContract(_userSavingsContract);
        hstContract = HSTContract(_hstContract);
        feeManager = _feeManager;
        usdtContract = IERC20(_usdtContract);
    }

    function applyLoan(uint256 amount) external nonReentrant {
        require(loans[msg.sender].amount == 0, "Active loan exists");
        require(checkEligibility(msg.sender), "Not eligible");

        loans[msg.sender] = Loan({
            amount: amount,
            guarantor: address(0),
            dueDate: 0,
            repaid: false,
            interest: (amount * LOAN_INTEREST_RATE) / 100
        });

        emit LoanApplied(msg.sender, amount);
    }

    function checkEligibility(address user) public view returns (bool) {
        (
            UserSavingsContract.AccountType accountType,
            uint256 balance,
            ,
            , // streak (unused)
            uint256 hstEarned,
            , // familyId (unused)
            uint256 familyTreasuryBalance,
            uint256 lastDepositTime
        ) = userSavingsContract.getSavingsInfo(user);

        uint256 effectiveBalance = accountType == UserSavingsContract.AccountType.Individual
            ? balance
            : familyTreasuryBalance;

        return (
            effectiveBalance >= MIN_SAVINGS_THRESHOLD &&
            hstEarned >= MIN_HST_THRESHOLD &&
            block.timestamp - lastDepositTime <= MIN_ACTIVITY_PERIOD
        );
    }

    function stakeGuarantor(address user, address guarantor) external nonReentrant {
        require(loans[user].amount > 0, "No loan application");
        require(loans[user].guarantor == address(0), "Guarantor already set");
        require(msg.sender == user, "Only borrower can set guarantor");
        (
            UserSavingsContract.AccountType accountType,
            uint256 balance,
            , // planType (unused)
            , // streak (unused)
            , // hstEarned (unused)
            , // familyId (unused)
            uint256 familyTreasuryBalance,
            // lastDepositTime (unused)
        ) = userSavingsContract.getSavingsInfo(guarantor);

        uint256 guarantorBalance = accountType == UserSavingsContract.AccountType.Individual
            ? balance
            : familyTreasuryBalance;
        require(guarantorBalance >= loans[user].amount, "Insufficient guarantor balance");

        // Lock guarantor's funds
        userSavingsContract.lockFunds(guarantor, loans[user].amount);

        loans[user].guarantor = guarantor;
        emit GuarantorStaked(user, guarantor, loans[user].amount);
    }

    function disburseLoan(address user) external nonReentrant {
        Loan storage loan = loans[user];
        require(loan.amount > 0, "No loan application");
        require(loan.guarantor != address(0), "No guarantor");
        require(!loan.repaid, "Loan already repaid");

        loan.dueDate = block.timestamp + 180 days; // 6 months

        // Transfer USDT to user
        require(usdtContract.transfer(user, loan.amount), "Loan disbursement failed");

        // Transfer origination fee to FeeManager
        uint256 fee = (loan.amount * LOAN_ORIGINATION_FEE) / 100;
        require(usdtContract.transfer(feeManager, fee), "Fee transfer failed");

        totalLoansDisbursed += loan.amount;
        emit LoanDisbursed(user, loan.amount);
    }

    function repayLoan(uint256 amount) external nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.amount > 0, "No active loan");
        require(!loan.repaid, "Loan already repaid");
        require(amount >= loan.amount + loan.interest, "Insufficient repayment");

        // Transfer USDT from user to contract
        require(usdtContract.transferFrom(msg.sender, address(this), amount), "Repayment transfer failed");

        // Unlock guarantor's funds
        userSavingsContract.unlockFunds(loan.guarantor, loan.amount);

        loan.amount = 0;
        loan.repaid = true;
        totalLoansRepaid += amount; // Updated to track full repaid amount

        hstContract.mint(loan.guarantor, GUARANTOR_HST_REWARD);

        emit LoanRepaid(msg.sender, amount);
        emit GuarantorFundsUnlocked(loan.guarantor, loan.amount);
    }

    function updateContractAddresses(address _userSavingsContract, address _hstContract, address _feeManager, address _usdtContract) external onlyOwner {
        userSavingsContract = UserSavingsContract(_userSavingsContract);
        hstContract = HSTContract(_hstContract);
        feeManager = _feeManager;
        usdtContract = IERC20(_usdtContract);
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token recovery failed");
    }
}