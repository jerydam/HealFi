// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";

/**
 * @title HealFiSavings
 * @dev Manages health savings accounts on the HealFi platform
 */
contract HealFiSavings is Ownable, ReentrancyGuard {
    address public microcreditContract;
    address public tokenContract;
    
    address public celoUSD;
    address public celoEUR;
    address public celoREAL;
    
    uint256 public totalSavingsUSD;
    uint256 public totalPooled;
    uint256 public interestRate = 200; // 2% annually (in basis points)
    uint256 public lastInterestDistribution;
    uint256 public constant INTEREST_DISTRIBUTION_PERIOD = 30 days;
    
    struct SavingsAccount {
        uint256 balanceUSD;
        uint256 balanceEUR;
        uint256 balanceREAL;
        uint256 lastDeposit;
        uint256 savingsStreak; // For rewarding consistent saving
        bool isActive;
    }
    
    mapping(address => SavingsAccount) public accounts;
    address[] public accountHolders;
    
    // Events
    event AccountCreated(address indexed user);
    event Deposit(address indexed user, address token, uint256 amount);
    event Withdrawal(address indexed user, address token, uint256 amount);
    event InterestDistributed(uint256 totalInterest, uint256 timestamp);
    event ContractsSet(address microcredit, address token);
    
    modifier onlyMicrocredit() {
        require(msg.sender == microcreditContract, "Only microcredit contract");
        _;
    }
    
    /**
     * @dev Set addresses of related contracts
     */
    function setContracts(address _microcreditContract, address _tokenContract) external onlyOwner {
        microcreditContract = _microcreditContract;
        tokenContract = _tokenContract;
        emit ContractsSet(_microcreditContract, _tokenContract);
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
     * @dev Create a new health savings account
     */
    function createAccount() external {
        require(!accounts[msg.sender].isActive, "Account already exists");
        
        accounts[msg.sender] = SavingsAccount({
            balanceUSD: 0,
            balanceEUR: 0,
            balanceREAL: 0,
            lastDeposit: 0,
            savingsStreak: 0,
            isActive: true
        });
        
        accountHolders.push(msg.sender);
        emit AccountCreated(msg.sender);
    }
    
    /**
     * @dev Deposit stablecoins into savings account
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        require(accounts[msg.sender].isActive, "Account not active");
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Update account based on token type
        if (token == celoUSD) {
            accounts[msg.sender].balanceUSD += amount;
            totalSavingsUSD += amount;
        } else if (token == celoEUR) {
            accounts[msg.sender].balanceEUR += amount;
            // Convert to USD equivalent for total pooled calculation
            // In production, this would use an oracle
            totalSavingsUSD += (amount * 110) / 100; // Simplified EUR to USD conversion
        } else if (token == celoREAL) {
            accounts[msg.sender].balanceREAL += amount;
            // Convert to USD equivalent for total pooled calculation
            totalSavingsUSD += (amount * 20) / 100; // Simplified REAL to USD conversion
        }
        
        // Update savings streak logic
        uint256 currentTime = block.timestamp;
        if (accounts[msg.sender].lastDeposit == 0 || 
            currentTime - accounts[msg.sender].lastDeposit <= 8 days) {
            accounts[msg.sender].savingsStreak++;
        } else {
            accounts[msg.sender].savingsStreak = 1;
        }
        
        accounts[msg.sender].lastDeposit = currentTime;
        totalPooled += amount;
        
        emit Deposit(msg.sender, token, amount);
    }
    
    /**
     * @dev Withdraw from savings account
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(accounts[msg.sender].isActive, "Account not active");
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        
        uint256 availableBalance;
        if (token == celoUSD) {
            availableBalance = accounts[msg.sender].balanceUSD;
            require(amount <= availableBalance, "Insufficient balance");
            accounts[msg.sender].balanceUSD -= amount;
            totalSavingsUSD -= amount;
        } else if (token == celoEUR) {
            availableBalance = accounts[msg.sender].balanceEUR;
            require(amount <= availableBalance, "Insufficient balance");
            accounts[msg.sender].balanceEUR -= amount;
            // Update USD equivalent
            totalSavingsUSD -= (amount * 110) / 100;
        } else if (token == celoREAL) {
            availableBalance = accounts[msg.sender].balanceREAL;
            require(amount <= availableBalance, "Insufficient balance");
            accounts[msg.sender].balanceREAL -= amount;
            // Update USD equivalent
            totalSavingsUSD -= (amount * 20) / 100;
        }
        
        totalPooled -= amount;
        IERC20(token).transfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, token, amount);
    }
    
    /**
     * @dev Distribute interest to all savers (called periodically)
     */
    function distributeInterest() external onlyOwner {
        require(block.timestamp >= lastInterestDistribution + INTEREST_DISTRIBUTION_PERIOD, 
                "Too soon for interest distribution");
        
        uint256 periodInterestRate = interestRate / 12; // Monthly interest
        uint256 totalInterest = (totalSavingsUSD * periodInterestRate) / 10000;
        
        // In production, this would come from yield farming or reserve fund
        // Here we're just calculating what it would be
        
        for (uint i = 0; i < accountHolders.length; i++) {
            address holder = accountHolders[i];
            if (accounts[holder].isActive) {
                // Calculate user's share of the interest
                uint256 userShare = calculateUserShare(holder, totalInterest);
                
                // Add interest to user's USD balance as an example
                if (userShare > 0) {
                    accounts[holder].balanceUSD += userShare;
                }
            }
        }
        
        lastInterestDistribution = block.timestamp;
        emit InterestDistributed(totalInterest, block.timestamp);
    }
    
    /**
     * @dev Calculate user's share of distributed interest
     */
    function calculateUserShare(address user, uint256 totalInterest) internal view returns (uint256) {
        uint256 userTotalUSD = accounts[user].balanceUSD + 
                              (accounts[user].balanceEUR * 110) / 100 + 
                              (accounts[user].balanceREAL * 20) / 100;
                              
        if (totalSavingsUSD == 0) return 0;
        return (userTotalUSD * totalInterest) / totalSavingsUSD;
    }
    
    /**
     * @dev Get account info
     */
    function getAccountInfo(address user) external view returns (
        uint256 balanceUSD,
        uint256 balanceEUR,
        uint256 balanceREAL,
        uint256 savingsStreak,
        bool isActive
    ) {
        SavingsAccount storage account = accounts[user];
        return (
            account.balanceUSD,
            account.balanceEUR,
            account.balanceREAL,
            account.savingsStreak,
            account.isActive
        );
    }
    
    /**
     * @dev Reserved function for microcredit contract to check available balance
     */
    function getAvailableFunds(address token) external view returns (uint256) {
        if (token == celoUSD) {
            return IERC20(celoUSD).balanceOf(address(this));
        } else if (token == celoEUR) {
            return IERC20(celoEUR).balanceOf(address(this));
        } else if (token == celoREAL) {
            return IERC20(celoREAL).balanceOf(address(this));
        }
        return 0;
    }
    
    /**
     * @dev Function for microcredit contract to withdraw funds for loans
     */
    function withdrawForLoan(address token, uint256 amount) external onlyMicrocredit returns (bool) {
        if (IERC20(token).balanceOf(address(this)) >= amount) {
            IERC20(token).transfer(microcreditContract, amount);
            return true;
        }
        return false;
    }
    
    /**
     * @dev Function for microcredit contract to repay funds to savings pool
     */
    function depositLoanRepayment(address token, uint256 amount) external onlyMicrocredit {
        require(IERC20(token).transferFrom(microcreditContract, address(this), amount), 
                "Transfer failed");
    }
}