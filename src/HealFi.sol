// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./HealFiSavings.sol";
import "./HealFiMicroCredit.sol";
import "./HealFiPartner.sol";
import "./HealFiToken.sol";
import "./HealFiDao.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/access/AccessControl.sol";

contract HealFi is Ownable, Pausable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    string public constant VERSION = "1.0.0";
    
    HealFiSavings public savingsContract;
    HealFiMicrocredit public microcreditContract;
    HealFiPartners public partnersContract;
    HealFiToken public tokenContract;
    HealFiGovernance public governanceContract;
    
    address public celoUSD;
    address public celoEUR;
    address public celoREAL;
    
    event ContractSetup(address savings, address microcredit, address partners, address token, address governance);
    event StablecoinAdded(address stablecoin, string symbol);
    event EmergencyShutdown(address initiator);
    event VersionUpgraded(string newVersion);
    
    constructor(address _celoUSD, address _celoEUR, address _celoREAL) {
        celoUSD = _celoUSD;
        celoEUR = _celoEUR;
        celoREAL = _celoREAL;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }
    
    function setupContracts(
        address _savingsContract,
        address _microcreditContract,
        address _partnersContract,
        address _tokenContract,
        address _governanceContract
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        savingsContract = HealFiSavings(_savingsContract);
        microcreditContract = HealFiMicrocredit(_microcreditContract);
        partnersContract = HealFiPartners(_partnersContract);
        tokenContract = HealFiToken(_tokenContract);
        governanceContract = HealFiGovernance(_governanceContract);
        
        savingsContract.setContracts(address(microcreditContract), address(tokenContract));
        microcreditContract.setContracts(address(savingsContract), address(partnersContract), address(tokenContract));
        partnersContract.setContracts(address(microcreditContract), address(tokenContract));
        tokenContract.setContracts(address(savingsContract), address(microcreditContract), address(partnersContract));
        governanceContract.setContracts(address(savingsContract), address(microcreditContract), address(partnersContract), address(tokenContract));
        
        emit ContractSetup(_savingsContract, _microcreditContract, _partnersContract, _tokenContract, _governanceContract);
    }
    
    function updateStablecoins(address _celoUSD, address _celoEUR, address _celoREAL) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        celoUSD = _celoUSD;
        celoEUR = _celoEUR;
        celoREAL = _celoREAL;
        
        emit StablecoinAdded(_celoUSD, "cUSD");
        emit StablecoinAdded(_celoEUR, "cEUR");
        emit StablecoinAdded(_celoREAL, "cREAL");
        
        savingsContract.updateSupportedStablecoins(_celoUSD, _celoEUR, _celoREAL);
        microcreditContract.updateSupportedStablecoins(_celoUSD, _celoEUR, _celoREAL);
        partnersContract.updateSupportedStablecoins(_celoUSD, _celoEUR, _celoREAL);
    }
    
    function transferSystemControl(address newGovernance) 
        external 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
    {
        savingsContract.transferOwnership(newGovernance);
        microcreditContract.transferOwnership(newGovernance);
        partnersContract.transferOwnership(newGovernance);
        tokenContract.transferOwnership(newGovernance);
        governanceContract.transferOwnership(newGovernance);
        transferOwnership(newGovernance);
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function emergencyShutdown() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit EmergencyShutdown(msg.sender);
    }
    
    function addAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, newAdmin);
    }
    
    function upgradeTo(string memory newVersion) external onlyRole(ADMIN_ROLE) {
        emit VersionUpgraded(newVersion);
    }
}