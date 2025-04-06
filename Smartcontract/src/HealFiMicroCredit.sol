// SPDX-License-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./interface.sol";
interface IHealFiSavings {
    function withdrawForLoan(address token, uint256 amount) external returns (bool);
    function depositLoanRepayment(address token, uint256 amount) external;
    function getAccountInfo(address user) external view returns (
        uint256 balanceUSD, uint256 balanceEUR, uint256 balanceREAL, 
        uint256 savingsStreak, bool isActive);
}


contract HealFiMicrocredit is Ownable, ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant LOAN_MANAGER_ROLE = keccak256("LOAN_MANAGER_ROLE");
    string public constant VERSION = "1.0.0";
    
    address public savingsContract;
    address public partnersContract;
    address public tokenContract;
    
    address public celoUSD;
    address public celoEUR;
    address public celoREAL;
    
    AggregatorV3Interface public eurUsdPriceFeed;
    AggregatorV3Interface public realUsdPriceFeed;
    
    uint256 public totalActiveLoanValueUSD;
    uint256 public minimumSavingsStreak = 3;
    uint256 public loanFeeRate = 100; // 1% in basis points
    
    enum LoanStatus { None, Pending, Active, PastDue, Repaid, Defaulted }
    
    struct Loan {
        address borrower;
        address token;
        uint256 amount;
        uint256 feeAmount;
        uint256 totalRepaid;
        uint256 startDate;
        uint256 dueDate;
        LoanStatus status;
        bool isHealthEmergency;
        address partnerHealthProvider;
    }
    
    mapping(address => Loan[]) public userLoans;
    mapping(uint256 => Loan) public loans;
    uint256 public loanCount;
    
    mapping(address => uint256) public creditScores;
    uint256 public constant BASE_CREDIT_SCORE = 500;
    
    event LoanRequested(uint256 indexed loanId, address indexed borrower, address token, uint256 amount);
    event LoanApproved(uint256 indexed loanId, address indexed borrower);
    event LoanRepayment(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanFullyRepaid(uint256 indexed loanId, address indexed borrower);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower);
    event ContractsSet(address savings, address partners, address token);
    event EmergencyLoanCancellation(uint256 indexed loanId);
    event TermsUpdated(uint256 minimumSavingsStreak, uint256 loanFeeRate);
    event VersionUpgraded(string newVersion);
    
    constructor(address _eurUsdFeed, address _realUsdFeed) {
        eurUsdPriceFeed = AggregatorV3Interface(_eurUsdFeed);
        realUsdPriceFeed = AggregatorV3Interface(_realUsdFeed);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(LOAN_MANAGER_ROLE, msg.sender);
    }
    
    function setContracts(address _savingsContract, address _partnersContract, address _tokenContract) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        savingsContract = _savingsContract;
        partnersContract = _partnersContract;
        tokenContract = _tokenContract;
        emit ContractsSet(_savingsContract, _partnersContract, _tokenContract);
    }
    
    function updateSupportedStablecoins(address _celoUSD, address _celoEUR, address _celoREAL) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        celoUSD = _celoUSD;
        celoEUR = _celoEUR;
        celoREAL = _celoREAL;
    }
    
    function initializeCreditScore(address user) internal {
        if (creditScores[user] == 0) {
            creditScores[user] = BASE_CREDIT_SCORE;
        }
    }
    
    function requestLoan(
        address token, 
        uint256 amount, 
        uint256 durationDays,
        bool isEmergency,
        address healthProvider
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        require(amount > 0, "Amount must be > 0");
        require(durationDays > 0 && durationDays <= 365, "Invalid duration");
        
        (,,,uint256 savingsStreak, bool isActive) = IHealFiSavings(savingsContract).getAccountInfo(msg.sender);
        require(isActive, "No active account");
        if (!isEmergency) {
            require(savingsStreak >= minimumSavingsStreak, "Insufficient savings history");
        }
        
        uint256 fee = (amount * loanFeeRate) / 10000;
        uint256 loanId = loanCount++;
        
        Loan memory newLoan = Loan({
            borrower: msg.sender,
            token: token,
            amount: amount,
            feeAmount: fee,
            totalRepaid: 0,
            startDate: block.timestamp,
            dueDate: block.timestamp + (durationDays * 1 days),
            status: LoanStatus.Pending,
            isHealthEmergency: isEmergency,
            partnerHealthProvider: healthProvider
        });
        
        loans[loanId] = newLoan;
        userLoans[msg.sender].push(newLoan);
        
        emit LoanRequested(loanId, msg.sender, token, amount);
        if (isEmergency) approveLoan(loanId);
        
        return loanId;
    }
    
    function approveLoan(uint256 loanId) 
        public 
        onlyRole(LOAN_MANAGER_ROLE) 
        whenNotPaused 
    {
        require(loans[loanId].status == LoanStatus.Pending, "Not pending");
        
        Loan storage loan = loans[loanId];
        bool fundingSuccess = IHealFiSavings(savingsContract).withdrawForLoan(loan.token, loan.amount);
        require(fundingSuccess, "Insufficient funds");
        
        loan.status = LoanStatus.Active;
        address recipient = loan.partnerHealthProvider != address(0) ? loan.partnerHealthProvider : loan.borrower;
        IERC20(loan.token).transfer(recipient, loan.amount);
        
        totalActiveLoanValueUSD += convertToUSD(loan.amount, 
            loan.token == celoEUR ? eurUsdPriceFeed : 
            loan.token == celoREAL ? realUsdPriceFeed : 
            AggregatorV3Interface(address(0)));
            
        emit LoanApproved(loanId, loan.borrower);
    }
    
    function repayLoan(uint256 loanId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(loans[loanId].borrower == msg.sender, "Not borrower");
        require(loans[loanId].status == LoanStatus.Active || loans[loanId].status == LoanStatus.PastDue, "Not active");
        require(amount > 0, "Amount must be > 0");
        
        Loan storage loan = loans[loanId];
        uint256 remainingAmount = loan.amount + loan.feeAmount - loan.totalRepaid;
        if (amount > remainingAmount) amount = remainingAmount;
        
        IERC20(loan.token).transferFrom(msg.sender, address(this), amount);
        IERC20(loan.token).approve(savingsContract, amount);
        IHealFiSavings(savingsContract).depositLoanRepayment(loan.token, amount);
        
        loan.totalRepaid += amount;
        emit LoanRepayment(loanId, msg.sender, amount);
        
        if (loan.totalRepaid >= loan.amount + loan.feeAmount) {
            loan.status = LoanStatus.Repaid;
            totalActiveLoanValueUSD -= convertToUSD(loan.amount, 
                loan.token == celoEUR ? eurUsdPriceFeed : 
                loan.token == celoREAL ? realUsdPriceFeed : 
                AggregatorV3Interface(address(0)));
                
            IHealFiToken(tokenContract).mintRewardTokens(msg.sender, loan.amount / 10);
            if (block.timestamp <= loan.dueDate) creditScores[msg.sender] += 10;
            
            emit LoanFullyRepaid(loanId, msg.sender);
        }
    }
    
    function checkLoanStatuses() 
        external 
        onlyRole(LOAN_MANAGER_ROLE) 
        whenNotPaused 
    {
        for (uint256 i = 0; i < loanCount; i++) {
            Loan storage loan = loans[i];
            if (loan.status == LoanStatus.Active && block.timestamp > loan.dueDate) {
                loan.status = LoanStatus.PastDue;
                if (creditScores[loan.borrower] > 10) creditScores[loan.borrower] -= 10;
            }
            
            if (loan.status == LoanStatus.PastDue && block.timestamp > loan.dueDate + 30 days) {
                loan.status = LoanStatus.Defaulted;
                creditScores[loan.borrower] = creditScores[loan.borrower] > 100 ? 
                    creditScores[loan.borrower] - 100 : 0;
                emit LoanDefaulted(i, loan.borrower);
            }
        }
    }
    
    function emergencyCancelLoan(uint256 loanId) 
        external 
        onlyRole(LOAN_MANAGER_ROLE) 
        whenPaused 
    {
        require(loans[loanId].status == LoanStatus.Pending, "Not pending");
        loans[loanId].status = LoanStatus.None;
        emit EmergencyLoanCancellation(loanId);
    }
    
    function updateTerms(uint256 _minimumSavingsStreak, uint256 _loanFeeRate) 
        external 
        onlyRole(LOAN_MANAGER_ROLE) 
        whenNotPaused 
    {
        require(_loanFeeRate <= 1000, "Fee rate too high"); // Cap at 10%
        minimumSavingsStreak = _minimumSavingsStreak;
        loanFeeRate = _loanFeeRate;
        emit TermsUpdated(_minimumSavingsStreak, _loanFeeRate);
    }
    
    function getLoanDetails(uint256 loanId) 
        external 
        view 
        returns (
            address borrower,
            address token,
            uint256 amount,
            uint256 feeAmount,
            uint256 totalRepaid,
            uint256 startDate,
            uint256 dueDate,
            LoanStatus status
        ) 
    {
        Loan storage loan = loans[loanId];
        return (
            loan.borrower,
            loan.token,
            loan.amount,
            loan.feeAmount,
            loan.totalRepaid,
            loan.startDate,
            loan.dueDate,
            loan.status
        );
    }
    
    function getUserLoans(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 userLoanCount = 0;
        for (uint256 i = 0; i < loanCount; i++) {
            if (loans[i].borrower == user) userLoanCount++;
        }
        
        uint256[] memory result = new uint256[](userLoanCount);
        uint256 index = 0;
        for (uint256 i = 0; i < loanCount; i++) {
            if (loans[i].borrower == user) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }
    
    function getMaxLoanAmount(address user, address token) 
        external 
        view 
        returns (uint256) 
    {
        (uint256 balanceUSD, uint256 balanceEUR, uint256 balanceREAL, uint256 savingsStreak, bool isActive) = 
            IHealFiSavings(savingsContract).getAccountInfo(user);
            
        if (!isActive || savingsStreak < minimumSavingsStreak) return 0;
        
        uint256 totalBalanceUSD = balanceUSD + 
                                convertToUSD(balanceEUR, eurUsdPriceFeed) + 
                                convertToUSD(balanceREAL, realUsdPriceFeed);
        
        uint256 baseAmount = totalBalanceUSD * 3;
        uint256 creditMultiplier = creditScores[user] / 100;
        uint256 maxUSD = baseAmount * creditMultiplier / 10;
        
        if (token == celoUSD) return maxUSD;
        else if (token == celoEUR) return convertFromUSD(maxUSD, eurUsdPriceFeed);
        else if (token == celoREAL) return convertFromUSD(maxUSD, realUsdPriceFeed);
        return 0;
    }
    
    function convertToUSD(uint256 amount, AggregatorV3Interface priceFeed) 
        internal 
        view 
        returns (uint256) 
    {
        if (address(priceFeed) == address(0)) return amount;
        (,int256 price,,,) = priceFeed.latestRoundData();
        return (amount * uint256(price)) / 10**8;
    }
    
    function convertFromUSD(uint256 usdAmount, AggregatorV3Interface priceFeed) 
        internal 
        view 
        returns (uint256) 
    {
        if (address(priceFeed) == address(0)) return usdAmount;
        (,int256 price,,,) = priceFeed.latestRoundData();
        return (usdAmount * 10**8) / uint256(price);
    }
    
    function pause() external onlyRole(LOAN_MANAGER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(LOAN_MANAGER_ROLE) {
        _unpause();
    }
    
    function upgradeTo(string memory newVersion) external onlyRole(LOAN_MANAGER_ROLE) {
        emit VersionUpgraded(newVersion);
    }
}