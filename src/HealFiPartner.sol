// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * @title HealFiPartners
 * @dev Manages healthcare partnerships on the HealFi platform
 */
contract HealFiPartners is Ownable {
    address public microcreditContract;
    address public tokenContract;
    
    address public celoUSD;
    address public celoEUR;
    address public celoREAL;
    
    enum PartnerType { Clinic, Pharmacy, Hospital, Laboratory }
    
    struct HealthcarePartner {
        string name;
        string location;
        address paymentAddress;
        PartnerType partnerType;
        uint256 discountPercentage; // Discount offered to HealFi users (in basis points)
        bool isActive;
        uint256 totalPatientsServed;
        uint256 registrationDate;
    }
    
    // Mapping of partner address to partner details
    mapping(address => HealthcarePartner) public partners;
    address[] public partnerAddresses;
    
    // Service records for patients
    struct ServiceRecord {
        address patient;
        address partner;
        uint256 amount;
        address token;
        uint256 serviceDate;
        string serviceDescription;
    }
    
    // Mapping patient address to their service history
    mapping(address => ServiceRecord[]) public patientServiceHistory;
    // Global service record count
    uint256 public serviceRecordCount;
    // Mapping service record ID to service record
    mapping(uint256 => ServiceRecord) public serviceRecords;
    
    // Partner verification status
    mapping(address => bool) public verifiedPartners;
    
    // Platform fee (in basis points)
    uint256 public platformFeeRate = 100; // 1% fee
    
    // Events
    event PartnerRegistered(address indexed partner, string name, PartnerType partnerType);
    event PartnerVerified(address indexed partner);
    event PartnerDeactivated(address indexed partner);
    event ServiceProvided(uint256 indexed recordId, address indexed patient, address indexed partner, uint256 amount);
    event DiscountApplied(address indexed patient, address indexed partner, uint256 discountAmount);
    event ContractsSet(address microcredit, address token);
    
    modifier onlyVerifiedPartner() {
        require(verifiedPartners[msg.sender], "Not a verified partner");
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
     * @dev Register as a healthcare partner
     */
    function registerPartner(
        string memory name,
        string memory location,
        address paymentAddress,
        PartnerType partnerType,
        uint256 discountPercentage
    ) external {
        require(!partners[msg.sender].isActive, "Already registered");
        require(discountPercentage <= 5000, "Discount too high"); // Max 50% discount
        
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
    
    /**
     * @dev Verify a healthcare partner (called by governance)
     */
    function verifyPartner(address partner) external onlyOwner {
        require(partners[partner].isActive, "Partner not registered or inactive");
        verifiedPartners[partner] = true;
        emit PartnerVerified(partner);
    }
    
    /**
     * @dev Deactivate a healthcare partner
     */
    function deactivatePartner(address partner) external onlyOwner {
        require(partners[partner].isActive, "Partner not active");
        partners[partner].isActive = false;
        verifiedPartners[partner] = false;
        emit PartnerDeactivated(partner);
    }
    
    /**
     * @dev Record a healthcare service provided to a patient
     */
    function recordService(
        address patient,
        uint256 amount,
        address token,
        string memory serviceDescription
    ) external onlyVerifiedPartner {
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        require(amount > 0, "Amount must be greater than 0");
        
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
    
    /**
     * @dev Apply a discount for HealFi users
     */
    function applyDiscount(address patient, uint256 fullAmount, address token) 
        external 
        onlyVerifiedPartner 
        returns (uint256 discountedAmount) 
    {
        require(partners[msg.sender].isActive, "Partner not active");
        
        uint256 discountPercentage = partners[msg.sender].discountPercentage;
        uint256 discountAmount = (fullAmount * discountPercentage) / 10000;
        discountedAmount = fullAmount - discountAmount;
        
        emit DiscountApplied(patient, msg.sender, discountAmount);
        return discountedAmount;
    }
    
    /**
     * @dev Process payment from patient to healthcare provider
     */
    function processPayment(address patient, uint256 amount, address token) external {
        require(partners[msg.sender].isActive, "Partner not active");
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        
        // Calculate platform fee
        uint256 fee = (amount * platformFeeRate) / 10000;
        uint256 partnerAmount = amount - fee;
        
        // Transfer tokens from patient to this contract
        IERC20(token).transferFrom(patient, address(this), amount);
        
        // Transfer partner amount to partner's payment address
        IERC20(token).transfer(partners[msg.sender].paymentAddress, partnerAmount);
        
        // Fee remains in contract (can be collected by governance)
    }
    
    /**
     * @dev Get partner details
     */
    function getPartnerDetails(address partner) external view returns (
        string memory name,
        string memory location,
        address paymentAddress,
        PartnerType partnerType,
        uint256 discountPercentage,
        bool isActive,
        uint256 totalPatientsServed
    ) {
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
    
    /**
     * @dev Get service history for a patient
     */
    function getPatientServiceHistory(address patient) external view returns (ServiceRecord[] memory) {
        return patientServiceHistory[patient];
    }
    
    /**
     * @dev Get all partners
     */
    function getAllPartners() external view returns (address[] memory) {
        return partnerAddresses;
    }
    
    /**
     * @dev Set platform fee rate (governance only)
     */
    function setPlatformFeeRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Fee too high"); // Max 10%
        platformFeeRate = newRate;
    }
    
    /**
     * @dev Withdraw platform fees (governance only)
     */
    function withdrawFees(address token, address recipient, uint256 amount) external onlyOwner {
        require(token == celoUSD || token == celoEUR || token == celoREAL, "Unsupported token");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(amount <= balance, "Insufficient balance");
        IERC20(token).transfer(recipient, amount);
    }
}