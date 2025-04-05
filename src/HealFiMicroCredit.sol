// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";

interface IHealFiSavings {
    function withdrawForLoan(address token, uint256 amount) external returns (bool);
    function depositLoanRepayment(address token, uint256 amount) external;
    function getAccountInfo(address user) external view returns (
        uint256 balanceUSD, uint256 balanceEUR, uint256 balanceREAL, 
        uint256 savingsStreak, bool isActive);
}

interface IHealFiToken {
    function mintRewardTokens(address to, uint256 amount) external;
}

/**
 * @title HealFiMicrocredit
 * @dev Manages health microloans on the HealFi platform
 */
contract HealFiMicrocredit is Ownable, ReentrancyGuard {
    address public savingsContract;
    address public partnersContract;
    address public tokenContract;
    
    address public celoUSD;
    address public celoEUR;
    address public celoREAL;
    
    uint256 public totalActiveLoanValueUSD;
    uint256 public minimumSavingsStreak = 3; // Minimum savings streak to be eligible for loans
    uint256 public loanFeeRate = 100; // 1% fee (in basis points)
    
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
        bool isHealthEmergency; // Flag for emergency loans (can have different terms)
        address partnerHealthProvider; // Associated healthcare provider if applicable
    }
    
    // Mapping of user address to their loans
    mapping(address => Loan[]) public userLoans;
    // Mapping of loan IDs to track all loans
    mapping(uint256 => Loan) public loans;
    uint256 public loanCount;
    
    // Credit scores for users (determines loan eligibility and limits)
    mapping(address => uint256) public creditScores;
    uint256 public constant BASE_CREDIT_SCORE = 500;
    
    // Events
    event LoanRequested(uint256 indexed loanId, address indexed borrower, address token, uint256 amount);
    event LoanApproved(uint256 indexed loanId, address indexed borrower);
    event LoanRepayment(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanFullyRepaid(uint256 indexed loanId, address indexed borrower);
    event LoanDefaulted(uint256 indexed loanId, address indexed borrower);
    event ContractsSet(address savings, address partners, address token);
    
    /**
     * @dev Set addresses of related contracts
     */
    function setContracts(address _savingsContract, address _partnersContract, address _tokenContract) external onlyOwner {
        savingsContract = _savingsContract;
        partnersContract = _partnersContract;
        tokenContract = _tokenContract;
        emit ContractsSet(_savingsContract, _partnersContract, _tokenContract);
    }
    
    /**
     * @dev Update supported stablecoins
     */
    function updateSupportedStablecoins(address _celoUSD, address _celoEUR, address _celoREAL) external onlyOwner {
        celoUSD = _celoUSD;
        celoEUR = _celoEUR;
        celoREAL = _celoREAL;
    }
    
    /**
     * @dev Initialize credit score for a new user
     */
    function initializeCreditScore(address user) internal {
        if (creditScores[user] == 0) {
            creditScores[user] = BASE_CREDIT_SCORE;
        }
    }
    
    /**
     * @dev Request a health microloan
     */
    function requestLoan(
        address token, 
        uint256 amount, 
        uint256 durationDays,
        bool isEmergency,
        address healthProvider
    ) external nonReentrant returns (uint256) {
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        require(durationDays > 0 && durationDays <= 365, "Invalid duration");
        
        // Check eligibility through savings account
        (,,,uint256 savingsStreak, bool isActive) = IHealFiSavings(savingsContract).getAccountInfo(msg.sender);
        require(isActive, "No active savings account");
        
        // Emergency loans might have relaxed requirements
        if (!isEmergency) {
            require(savingsStreak >= minimumSavingsStreak, "Insufficient savings history");
        }
        
        // Calculate loan fees
        uint256 fee = (amount * loanFeeRate) / 10000;
        
        // Create new loan
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
        
        // If it's an emergency, we might auto-approve (governed by DAO)
        if (isEmergency) {
            approveLoan(loanId);
        }
        
        return loanId;
    }
    
    /**
     * @dev Approve a pending loan (called by DAO or governance)
     */
    function approveLoan(uint256 loanId) public onlyOwner {
        require(loans[loanId].status == LoanStatus.Pending, "Loan is not pending");
        
        Loan storage loan = loans[loanId];
        
        // Check if savings pool has sufficient funds
        bool fundingSuccess = IHealFiSavings(savingsContract).withdrawForLoan(loan.token, loan.amount);
        require(fundingSuccess, "Insufficient funds in savings pool");
        
        // Update loan status
        loan.status = LoanStatus.Active;
        
        // Transfer funds to borrower (or directly to healthcare provider if specified)
        address recipient = loan.partnerHealthProvider != address(0) ? loan.partnerHealthProvider : loan.borrower;
        IERC20(loan.token).transfer(recipient, loan.amount);
        
        // Update total active loans
        if (loan.token == celoUSD) {
            totalActiveLoanValueUSD += loan.amount;
        } else if (loan.token == celoEUR) {
            totalActiveLoanValueUSD += (loan.amount * 110) / 100; // Simplified conversion
        } else if (loan.token == celoREAL) {
            totalActiveLoanValueUSD += (loan.amount * 20) / 100; // Simplified conversion
        }
        
        emit LoanApproved(loanId, loan.borrower);
    }
    
    /**
     * @dev Make a repayment on an active loan
     */
    function repayLoan(uint256 loanId, uint256 amount) external nonReentrant {
        require(loans[loanId].borrower == msg.sender, "Not the borrower");
        require(loans[loanId].status == LoanStatus.Active || loans[loanId].status == LoanStatus.PastDue, "Loan not active");
        require(amount > 0, "Amount must be greater than 0");
        
        Loan storage loan = loans[loanId];
        uint256 remainingAmount = loan.amount + loan.feeAmount - loan.totalRepaid;
        
        // Cap repayment at the remaining debt
        if (amount > remainingAmount) {
            amount = remainingAmount;
        }
        
        // Transfer tokens from borrower to this contract
        IERC20(loan.token).transferFrom(msg.sender, address(this), amount);
        
        // Send repayment to savings pool
        IERC20(loan.token).approve(savingsContract, amount);
        IHealFiSavings(savingsContract).depositLoanRepayment(loan.token, amount);
        
        // Update loan state
        loan.totalRepaid += amount;
        
        emit LoanRepayment(loanId, msg.sender, amount);
        
        // Check if loan is fully repaid
        if (loan.totalRepaid >= loan.amount + loan.feeAmount) {
            loan.status = LoanStatus.Repaid;
            
            // Update total active loans
            if (loan.token == celoUSD) {
                totalActiveLoanValueUSD -= loan.amount;
            } else if (loan.token == celoEUR) {
                totalActiveLoanValueUSD -= (loan.amount * 110) / 100;
            } else if (loan.token == celoREAL) {
                totalActiveLoanValueUSD -= (loan.amount * 20) / 100;
            }
            
            // Reward borrower with tokens for successful repayment
            IHealFiToken(tokenContract).mintRewardTokens(msg.sender, loan.amount / 10);
            
            // Improve credit score for timely repayment
            if (block.timestamp <= loan.dueDate) {
                creditScores[msg.sender] += 10;
            }
            
            emit LoanFullyRepaid(loanId, msg.sender);
        }
    }
    
    /**
     * @dev Mark loans as past due (called by a maintenance function)
     */
    function checkLoanStatuses() external {
        for (uint256 i = 0; i < loanCount; i++) {
            Loan storage loan = loans[i];
            if (loan.status == LoanStatus.Active && block.timestamp > loan.dueDate) {
                loan.status = LoanStatus.PastDue;
                
                // Decrease credit score for late payment
                if (creditScores[loan.borrower] > 10) {
                    creditScores[loan.borrower] -= 10;
                }
            }
            
            // Mark as defaulted if significantly overdue (e.g., 30 days)
            if (loan.status == LoanStatus.PastDue && 
                block.timestamp > loan.dueDate + 30 days) {
                loan.status = LoanStatus.Defaulted;
                
                // Significant credit score penalty for default
                if (creditScores[loan.borrower] > 100) {
                    creditScores[loan.borrower] -= 100;
                } else {
                    creditScores[loan.borrower] = 0;
                }
                
                emit LoanDefaulted(i, loan.borrower);
            }
        }
    }
    
    /**
     * @dev Get loan details
     */
    function getLoanDetails(uint256 loanId) external view returns (
        address borrower,
        address token,
        uint256 amount,
        uint256 feeAmount,
        uint256 totalRepaid,
        uint256 startDate,
        uint256 dueDate,
        LoanStatus status
    ) {
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
    
    /**
     * @dev Get all loans for a user
     */
    function getUserLoans(address user) external view returns (uint256[] memory) {
        uint256 userLoanCount = 0;
        
        for (uint256 i = 0; i < loanCount; i++) {
            if (loans[i].borrower == user) {
                userLoanCount++;
            }
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
    
    /**
     * @dev Calculate maximum loan amount for a user based on their credit score and savings
     */
    function getMaxLoanAmount(address user, address token) external view returns (uint256) {
        (uint256 balanceUSD, uint256 balanceEUR, uint256 balanceREAL, uint256 savingsStreak, bool isActive) = 
            IHealFiSavings(savingsContract).getAccountInfo(user);
            
        if (!isActive || savingsStreak < minimumSavingsStreak) {
            return 0;
        }
        
        // Convert all balances to USD for calculation
        uint256 totalBalanceUSD = balanceUSD + 
                                 (balanceEUR * 110) / 100 + 
                                 (balanceREAL * 20) / 100;
        
        // Base amount is 3x their savings
        uint256 baseAmount = totalBalanceUSD * 3;
        
        // Adjust based on credit score (simplified)
        uint256 creditMultiplier = creditScores[user] / 100;  // 500 score = 5x multiplier
        uint256 maxUSD = baseAmount * creditMultiplier / 10;  // Limit growth
        
        // Convert back to requested token
        if (token == celoUSD) {
            return maxUSD;
        } else if (token == celoEUR) {
            return (maxUSD * 100) / 110;  // USD to EUR
        } else if (token == celoREAL) {
            return (maxUSD * 100) / 20;   // USD to REAL
        }
        
        return 0;
    }
}