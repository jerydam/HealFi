// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";
import "../lib/chainlink-brownie-contracts/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract HealFiPartners is Ownable, Pausable, AccessControl {
    bytes32 public constant PARTNER_MANAGER_ROLE = keccak256("PARTNER_MANAGER_ROLE");
    string public constant VERSION = "1.0.0";
    
    address public microcreditContract;
    address public tokenContract;
    
    address public celoUSD;
    address public celoEUR;
    address public celoREAL;
    
    AggregatorV3Interface public eurUsdPriceFeed;
    AggregatorV3Interface public realUsdPriceFeed;
    
    enum PartnerType { Clinic, Pharmacy, Hospital, Laboratory }
    
    struct HealthcarePartner {
        string name;
        string location;
        address paymentAddress;
        PartnerType partnerType;
        uint256 discountPercentage;
        bool isActive;
        uint256 totalPatientsServed;
        uint256 registrationDate;
    }
    
    mapping(address => HealthcarePartner) public partners;
    address[] public partnerAddresses;
    
    struct ServiceRecord {
        address patient;
        address partner;
        uint256 amount;
        address token;
        uint256 serviceDate;
        string serviceDescription;
    }
    
    mapping(address => ServiceRecord[]) public patientServiceHistory;
    uint256 public serviceRecordCount;
    mapping(uint256 => ServiceRecord) public serviceRecords;
    
    mapping(address => bool) public verifiedPartners;
    uint256 public platformFeeRate = 100; // 1% in basis points
    
    event PartnerRegistered(address indexed partner, string name, PartnerType partnerType);
    event PartnerVerified(address indexed partner);
    event PartnerDeactivated(address indexed partner);
    event ServiceProvided(uint256 indexed recordId, address indexed patient, address indexed partner, uint256 amount);
    event DiscountApplied(address indexed patient, address indexed partner, uint256 discountAmount);
    event ContractsSet(address microcredit, address token);
    event EmergencyFeeWithdrawal(address token, uint256 amount);
    event VersionUpgraded(string newVersion);
    
    modifier onlyVerifiedPartner() {
        require(verifiedPartners[msg.sender], "Not verified");
        _;
    }
    
    constructor(address _eurUsdFeed, address _realUsdFeed) {
        eurUsdPriceFeed = AggregatorV3Interface(_eurUsdFeed);
        realUsdPriceFeed = AggregatorV3Interface(_realUsdFeed);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PARTNER_MANAGER_ROLE, msg.sender);
    }
    
    function setContracts(address _microcreditContract, address _tokenContract) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        microcreditContract = _microcreditContract;
        tokenContract = _tokenContract;
        emit ContractsSet(_microcreditContract, _tokenContract);
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
    
    function registerPartner(
        string memory name,
        string memory location,
        address paymentAddress,
        PartnerType partnerType,
        uint256 discountPercentage
    ) external whenNotPaused {
        require(!partners[msg.sender].isActive, "Already registered");
        require(discountPercentage <= 5000, "Discount too high");
        
        HealthcarePartner memory newPartner = HealthcarePartner({
            name: name,
            location: location,
            paymentAddress: paymentAddress,
            partnerType: partnerType,
            discountPercentage: discountPercentage,
            isActive: true,
            totalPatientsServed: 0,
            registrationDate: block.timestamp
        });
        
        partners[msg.sender] = newPartner;
        partnerAddresses.push(msg.sender);
        emit PartnerRegistered(msg.sender, name, partnerType);
    }
    
    function verifyPartner(address partner) 
        external 
        onlyRole(PARTNER_MANAGER_ROLE) 
        whenNotPaused 
    {
        require(partners[partner].isActive, "Not registered");
        verifiedPartners[partner] = true;
        emit PartnerVerified(partner);
    }
    
    function deactivatePartner(address partner) 
        external 
        onlyRole(PARTNER_MANAGER_ROLE) 
        whenNotPaused 
    {
        require(partners[partner].isActive, "Not active");
        partners[partner].isActive = false;
        verifiedPartners[partner] = false;
        emit PartnerDeactivated(partner);
    }
    
    function recordService(
        address patient,
        uint256 amount,
        address token,
        string memory serviceDescription
    ) external onlyVerifiedPartner whenNotPaused {
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        require(amount > 0, "Amount must be > 0");
        
        uint256 recordId = serviceRecordCount++;
        ServiceRecord memory newRecord = ServiceRecord({
            patient: patient,
            partner: msg.sender,
            amount: amount,
            token: token,
            serviceDate: block.timestamp,
            serviceDescription: serviceDescription
        });
        
        serviceRecords[recordId] = newRecord;
        patientServiceHistory[patient].push(newRecord);
        partners[msg.sender].totalPatientsServed++;
        emit ServiceProvided(recordId, patient, msg.sender, amount);
    }
    
    function applyDiscount(address patient, uint256 fullAmount) 
        external 
        onlyVerifiedPartner 
        whenNotPaused 
        returns (uint256) 
    {
        require(partners[msg.sender].isActive, "Not active");
        uint256 discountAmount = (fullAmount * partners[msg.sender].discountPercentage) / 10000;
        uint256 discountedAmount = fullAmount - discountAmount;
        emit DiscountApplied(patient, msg.sender, discountAmount);
        return discountedAmount;
    }
    
    function processPayment(address patient, uint256 amount, address token) 
        external 
        whenNotPaused 
    {
        require(partners[msg.sender].isActive, "Not active");
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        
        uint256 fee = (amount * platformFeeRate) / 10000;
        uint256 partnerAmount = amount - fee;
        
        IERC20(token).transferFrom(patient, address(this), amount);
        IERC20(token).transfer(partners[msg.sender].paymentAddress, partnerAmount);
    }
    
    function getPartnerDetails(address partner) 
        external 
        view 
        returns (
            string memory name,
            string memory location,
            address paymentAddress,
            PartnerType partnerType,
            uint256 discountPercentage,
            bool isActive,
            uint256 totalPatientsServed
        ) 
    {
        HealthcarePartner storage p = partners[partner];
        return (
            p.name,
            p.location,
            p.paymentAddress,
            p.partnerType,
            p.discountPercentage,
            p.isActive,
            p.totalPatientsServed
        );
    }
    
    function getPatientServiceHistory(address patient) 
        external 
        view 
        returns (ServiceRecord[] memory) 
    {
        return patientServiceHistory[patient];
    }
    
    function getAllPartners() external view returns (address[] memory) {
        return partnerAddresses;
    }
    
    function setPlatformFeeRate(uint256 newRate) 
        external 
        onlyRole(PARTNER_MANAGER_ROLE) 
        whenNotPaused 
    {
        require(newRate <= 1000, "Fee too high");
        platformFeeRate = newRate;
    }
    
    function withdrawFees(address token, address recipient, uint256 amount) 
        external 
        onlyRole(PARTNER_MANAGER_ROLE) 
        whenNotPaused 
    {
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");
        IERC20(token).transfer(recipient, amount);
    }
    
    function emergencyFeeWithdrawal(address token, address recipient) 
        external 
        onlyRole(PARTNER_MANAGER_ROLE) 
        whenPaused 
    {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(recipient, balance);
        emit EmergencyFeeWithdrawal(token, balance);
    }
    
    function pause() external onlyRole(PARTNER_MANAGER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PARTNER_MANAGER_ROLE) {
        _unpause();
    }
    
    function upgradeTo(string memory newVersion) external onlyRole(PARTNER_MANAGER_ROLE) {
        emit VersionUpgraded(newVersion);
    }
}