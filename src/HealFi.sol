// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./HealFiSavings.sol";
import "./HealFiMicroCredit.sol";
import "./HealFiPartner.sol";
import "./HealFiToken.sol";
import "./HealFiDao.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title HealFi
 * @dev Main contract for the HealFi platform that integrates all other contracts
 */
contract HealFi is Ownable {
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
    
    constructor(address _celoUSD, address _celoEUR, address _celoREAL) {
        celoUSD = _celoUSD;
        celoEUR = _celoEUR;
        celoREAL = _celoREAL;
    }
    
    /**
     * @dev Sets up and links all the HealFi component contracts
     */
    function setupContracts(
        address _savingsContract,
        address _microcreditContract,
        address _partnersContract,
        address _tokenContract,
        address _governanceContract
    ) external onlyOwner {
        savingsContract = HealFiSavings(_savingsContract);
        microcreditContract = HealFiMicrocredit(_microcreditContract);
        partnersContract = HealFiPartners(_partnersContract);
        tokenContract = HealFiToken(_tokenContract);
        governanceContract = HealFiGovernance(_governanceContract);
        
        // Link the contracts together
        savingsContract.setContracts(address(microcreditContract), address(tokenContract));
        microcreditContract.setContracts(address(savingsContract), address(partnersContract), address(tokenContract));
        partnersContract.setContracts(address(microcreditContract), address(tokenContract));
        tokenContract.setContracts(address(savingsContract), address(microcreditContract), address(partnersContract));
        governanceContract.setContracts(address(savingsContract), address(microcreditContract), address(partnersContract), address(tokenContract));
        
        emit ContractSetup(_savingsContract, _microcreditContract, _partnersContract, _tokenContract, _governanceContract);
    }
    
    /**
     * @dev Updates supported stablecoins
     */
    function updateStablecoins(address _celoUSD, address _celoEUR, address _celoREAL) external onlyOwner {
        celoUSD = _celoUSD;
        celoEUR = _celoEUR;
        celoREAL = _celoREAL;
        
        emit StablecoinAdded(_celoUSD, "cUSD");
        emit StablecoinAdded(_celoEUR, "cEUR");
        emit StablecoinAdded(_celoREAL, "cREAL");
        
        // Update stablecoins in all contracts
        savingsContract.updateSupportedStablecoins(_celoUSD, _celoEUR, _celoREAL);
        microcreditContract.updateSupportedStablecoins(_celoUSD, _celoEUR, _celoREAL);
        partnersContract.updateSupportedStablecoins(_celoUSD, _celoEUR, _celoREAL);
    }
    
    /**
     * @dev Transfer ownership of component contracts to a new governance structure
     */
    function transferSystemControl(address newGovernance) external onlyOwner {
        savingsContract.transferOwnership(newGovernance);
        microcreditContract.transferOwnership(newGovernance);
        partnersContract.transferOwnership(newGovernance);
        tokenContract.transferOwnership(newGovernance);
        governanceContract.transferOwnership(newGovernance);
        transferOwnership(newGovernance);
    }
}