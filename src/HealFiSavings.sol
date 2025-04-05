// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title HealFi Savings
 * @notice Manages health savings accounts
 */
contract HealFiSavings is Ownable, ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    string public constant VERSION = "1.0.0";
    
    address public microcreditContract;
    address public tokenContract;
    
    address public celoUSD;
    address public celoEUR;
    address public celoREAL;
    
    AggregatorV3Interface public eurUsdPriceFeed;
    AggregatorV3Interface public realUsdPriceFeed;
    
    uint256 public totalSavingsUSD;
    uint256 public totalPooled;
    uint256 public interestRate = 200; // 2% annually in basis points
    uint256 public lastInterestDistribution;
    uint256 public constant INTEREST_DISTRIBUTION_PERIOD = 30 days;
    
    struct SavingsAccount {
        uint256 balanceUSD;
        uint256 balanceEUR;
        uint256 balanceREAL;
        uint256 lastDeposit;
        uint256 savingsStreak;
        bool isActive;
        uint256 lastInterestTimestamp;
    }
    
    mapping(address => SavingsAccount) public accounts;
    address[] public accountHolders;
    
    event AccountCreated(address indexed user);
    event Deposit(address indexed user, address token, uint256 amount);
    event Withdrawal(address indexed user, address token, uint256 amount);
    event InterestDistributed(uint256 totalInterest, uint256 timestamp);
    event ContractsSet(address microcredit, address token);
    event EmergencyWithdrawal(address indexed user, address token, uint256 amount);
    event VersionUpgraded(string newVersion);
    
    modifier onlyMicrocredit() {
        require(msg.sender == microcreditContract, "Only microcredit");
        _;
    }
    
    constructor(address _eurUsdFeed, address _realUsdFeed) {
        eurUsdPriceFeed = AggregatorV3Interface(_eurUsdFeed);
        realUsdPriceFeed = AggregatorV3Interface(_realUsdFeed);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MANAGER_ROLE, msg.sender);
    }
    
    /// @notice Sets contract addresses
    function setContracts(address _microcreditContract, address _tokenContract) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        microcreditContract = _microcreditContract;
        tokenContract = _tokenContract;
        emit ContractsSet(_microcreditContract, _tokenContract);
    }
    
    /// @notice Updates supported stablecoins
    function updateSupportedStablecoins(address _celoUSD, address _celoEUR, address _celoREAL) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        celoUSD = _celoUSD;
        celoEUR = _celoEUR;
        celoREAL = _celoREAL;
    }
    
    /// @notice Creates new savings account
    function createAccount() external whenNotPaused {
        require(!accounts[msg.sender].isActive, "Account exists");
        
        accounts[msg.sender] = SavingsAccount({
            balanceUSD: 0,
            balanceEUR: 0,
            balanceREAL: 0,
            lastDeposit: 0,
            savingsStreak: 0,
            isActive: true,
            lastInterestTimestamp: block.timestamp
        });
        
        accountHolders.push(msg.sender);
        emit AccountCreated(msg.sender);
    }
    
    /// @notice Deposits into savings
    function deposit(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(accounts[msg.sender].isActive, "Account not active");
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        uint256 usdAmount = token == celoUSD ? amount :
                          token == celoEUR ? convertToUSD(amount, eurUsdPriceFeed) :
                          convertToUSD(amount, realUsdPriceFeed);
                          
        if (token == celoUSD) accounts[msg.sender].balanceUSD += amount;
        else if (token == celoEUR) accounts[msg.sender].balanceEUR += amount;
        else accounts[msg.sender].balanceREAL += amount;
        
        totalSavingsUSD += usdAmount;
        
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
    
    /// @notice Withdraws from savings
    function withdraw(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(accounts[msg.sender].isActive, "Account not active");
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        
        if (token == celoUSD) {
            require(amount <= accounts[msg.sender].balanceUSD, "Insufficient balance");
            accounts[msg.sender].balanceUSD -= amount;
            totalSavingsUSD -= amount;
        } else if (token == celoEUR) {
            require(amount <= accounts[msg.sender].balanceEUR, "Insufficient balance");
            accounts[msg.sender].balanceEUR -= amount;
            totalSavingsUSD -= convertToUSD(amount, eurUsdPriceFeed);
        } else {
            require(amount <= accounts[msg.sender].balanceREAL, "Insufficient balance");
            accounts[msg.sender].balanceREAL -= amount;
            totalSavingsUSD -= convertToUSD(amount, realUsdPriceFeed);
        }
        
        totalPooled -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, token, amount);
    }
    
    /// @notice Emergency withdrawal
    function emergencyWithdraw(address token) 
        external 
        nonReentrant 
        whenPaused 
    {
        require(accounts[msg.sender].isActive, "Account not active");
        uint256 amount = token == celoUSD ? accounts[msg.sender].balanceUSD :
                        token == celoEUR ? accounts[msg.sender].balanceEUR :
                        accounts[msg.sender].balanceREAL;
                        
        if (amount > 0) {
            if (token == celoUSD) accounts[msg.sender].balanceUSD = 0;
            else if (token == celoEUR) accounts[msg.sender].balanceEUR = 0;
            else accounts[msg.sender].balanceREAL = 0;
            
            totalPooled -= amount;
            totalSavingsUSD -= convertToUSD(amount, 
                token == celoEUR ? eurUsdPriceFeed : 
                token == celoREAL ? realUsdPriceFeed : 
                AggregatorV3Interface(address(0)));
                
            IERC20(token).transfer(msg.sender, amount);
            emit EmergencyWithdrawal(msg.sender, token, amount);
        }
    }
    
    /// @notice Distributes interest
    function distributeInterest() 
        external 
        onlyRole(MANAGER_ROLE) 
        whenNotPaused 
    {
        require(block.timestamp >= lastInterestDistribution + INTEREST_DISTRIBUTION_PERIOD, 
                "Too soon");
                
        for (uint i = 0; i < accountHolders.length; i++) {
            address holder = accountHolders[i];
            if (accounts[holder].isActive) {
                uint256 interest = calculateCompoundInterest(holder);
                if (interest > 0) {
                    accounts[holder].balanceUSD += interest;
                    accounts[holder].lastInterestTimestamp = block.timestamp;
                }
            }
        }
        
        lastInterestDistribution = block.timestamp;
        emit InterestDistributed(totalSavingsUSD, block.timestamp);
    }
    
    /// @notice Calculates compound interest
    function calculateCompoundInterest(address user) 
        internal 
        view 
        returns (uint256) 
    {
        SavingsAccount storage account = accounts[user];
        uint256 timeElapsed = block.timestamp - account.lastInterestTimestamp;
        uint256 totalBalanceUSD = account.balanceUSD + 
                                convertToUSD(account.balanceEUR, eurUsdPriceFeed) + 
                                convertToUSD(account.balanceREAL, realUsdPriceFeed);
                                
        uint256 ratePerPeriod = interestRate * 10**18 / 365 / 10000;
        uint256 periods = timeElapsed / 1 days;
        uint256 base = 10**18 + ratePerPeriod;
        uint256 interest = totalBalanceUSD;
        
        for (uint i = 0; i < periods; i++) {
            interest = (interest * base) / 10**18;
        }
        
        return interest - totalBalanceUSD;
    }
    
    /// @notice Converts to USD using price feed
    function convertToUSD(uint256 amount, AggregatorV3Interface priceFeed) 
        internal 
        view 
        returns (uint256) 
    {
        if (address(priceFeed) == address(0)) return amount;
        (,int256 price,,,) = priceFeed.latestRoundData();
        return (amount * uint256(price)) / 10**8;
    }
    
    /// @notice Gets account info
    function getAccountInfo(address user) 
        external 
        view 
        returns (
            uint256 balanceUSD,
            uint256 balanceEUR,
            uint256 balanceREAL,
            uint256 savingsStreak,
            bool isActive
        ) 
    {
        SavingsAccount storage account = accounts[user];
        return (
            account.balanceUSD,
            account.balanceEUR,
            account.balanceREAL,
            account.savingsStreak,
            account.isActive
        );
    }
    
    /// @notice Gets available funds
    function getAvailableFunds(address token) 
        external 
        view 
        returns (uint256) 
    {
        return IERC20(token).balanceOf(address(this));
    }
    
    /// @notice Withdraws for loan
    function withdrawForLoan(address token, uint256 amount) 
        external 
        onlyMicrocredit 
        whenNotPaused 
        returns (bool) 
    {
        if (IERC20(token).balanceOf(address(this)) >= amount) {
            IERC20(token).transfer(microcreditContract, amount);
            return true;
        }
        return false;
    }
    
    /// @notice Deposits loan repayment
    function depositLoanRepayment(address token, uint256 amount) 
        external 
        onlyMicrocredit 
        whenNotPaused 
    {
        require(IERC20(token).transferFrom(microcreditContract, address(this), amount), 
                "Transfer failed");
    }
    
    /// @notice Pauses contract
    function pause() external onlyRole(MANAGER_ROLE) {
        _pause();
    }
    
    /// @notice Unpauses contract
    function unpause() external onlyRole(MANAGER_ROLE) {
        _unpause();
    }
    
    /// @notice Upgrade placeholder
    function upgradeTo(string memory newVersion) external onlyRole(MANAGER_ROLE) {
        emit VersionUpgraded(newVersion);
    }
}