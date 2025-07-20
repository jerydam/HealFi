// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/UserSavingsContract.sol";
import "../src/HSTContract.sol";
import "../src/LoanContract.sol";
import "../src/DonorPoolContract.sol";
import "../src/MultisigRedemptionContract.sol";
import "../src/FeeManagerContract.sol";
import "../src/MetricsContract.sol";

contract DeployHealFi is Script {
    function run() external {
        // Deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer address:", deployer);

        // Facility private key for testing (for address 0x123)
        // Replace with secure key or .env variable in production
        uint256 facilityPrivateKey = vm.envUint("PRIVATE_KEY2");
        address facility = vm.addr(facilityPrivateKey);
        console.log("Facility address:", facility);
        console.log("Facility address is 0x123:", facility == address(0x123));

        vm.startBroadcast(deployerPrivateKey);

        // Celo Alfajores cUSD address
        address cUSD = 0x90193C961A926261B756D1E5bb255e67ff9498A1;
        console.log("cUSD address:", cUSD);

        // Deploy contracts
        FeeManagerContract feeManager;
        HSTContract hst;
        UserSavingsContract userSavings;
        LoanContract loan;
        MultisigRedemptionContract multisig;
        DonorPoolContract donorPool;
        MetricsContract metrics;

        // Deploy FeeManagerContract
        try new FeeManagerContract(cUSD) returns (FeeManagerContract _feeManager) {
            feeManager = _feeManager;
            console.log("FeeManagerContract deployed at:", address(feeManager));
        } catch Error(string memory reason) {
            console.log("FeeManagerContract deployment failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Deploy HSTContract
        try new HSTContract(address(0), address(0), address(0), cUSD) returns (HSTContract _hst) {
            hst = _hst;
            console.log("HSTContract deployed at:", address(hst));
        } catch Error(string memory reason) {
            console.log("HSTContract deployment failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Deploy UserSavingsContract
        try new UserSavingsContract(address(hst), address(feeManager), cUSD, address(0)) returns (UserSavingsContract _userSavings) {
            userSavings = _userSavings;
            console.log("UserSavingsContract deployed at:", address(userSavings));
        } catch Error(string memory reason) {
            console.log("UserSavingsContract deployment failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Deploy LoanContract
        try new LoanContract(address(userSavings), address(hst), address(feeManager), cUSD) returns (LoanContract _loan) {
            loan = _loan;
            console.log("LoanContract deployed at:", address(loan));
        } catch Error(string memory reason) {
            console.log("LoanContract deployment failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Deploy MultisigRedemptionContract
        try new MultisigRedemptionContract(address(hst), address(0), deployer, cUSD) returns (MultisigRedemptionContract _multisig) {
            multisig = _multisig;
            console.log("MultisigRedemptionContract deployed at:", address(multisig));
        } catch Error(string memory reason) {
            console.log("MultisigRedemptionContract deployment failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Deploy DonorPoolContract
        try new DonorPoolContract(address(hst), cUSD, address(multisig), address(feeManager)) returns (DonorPoolContract _donorPool) {
            donorPool = _donorPool;
            console.log("DonorPoolContract deployed at:", address(donorPool));
        } catch Error(string memory reason) {
            console.log("DonorPoolContract deployment failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Deploy MetricsContract
        try new MetricsContract(address(userSavings), address(loan), address(donorPool)) returns (MetricsContract _metrics) {
            metrics = _metrics;
            console.log("MetricsContract deployed at:", address(metrics));
        } catch Error(string memory reason) {
            console.log("MetricsContract deployment failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Update contract addresses
        try hst.updateContractAddresses(address(userSavings), address(loan), address(multisig), cUSD) {
            console.log("HSTContract addresses updated");
        } catch Error(string memory reason) {
            console.log("HSTContract updateContractAddresses failed:", reason);
            vm.stopBroadcast();
            return;
        }

        try multisig.updateContractAddresses(address(hst), address(donorPool), deployer, cUSD) {
            console.log("MultisigRedemptionContract addresses updated");
        } catch Error(string memory reason) {
            console.log("MultisigRedemptionContract updateContractAddresses failed:", reason);
            vm.stopBroadcast();
            return;
        }

        try userSavings.updateContractAddresses(address(hst), address(feeManager), cUSD, address(loan)) {
            console.log("UserSavingsContract addresses updated");
        } catch Error(string memory reason) {
            console.log("UserSavingsContract updateContractAddresses failed:", reason);
            vm.stopBroadcast();
            return;
        }

        try loan.updateContractAddresses(address(userSavings), address(hst), address(feeManager), cUSD) {
            console.log("LoanContract addresses updated");
        } catch Error(string memory reason) {
            console.log("LoanContract updateContractAddresses failed:", reason);
            vm.stopBroadcast();
            return;
        }

        try donorPool.updateContractAddresses(address(hst), cUSD, address(multisig), address(feeManager)) {
            console.log("DonorPoolContract addresses updated");
        } catch Error(string memory reason) {
            console.log("DonorPoolContract updateContractAddresses failed:", reason);
            vm.stopBroadcast();
            return;
        }

        try metrics.updateContractAddresses(address(userSavings), address(loan), address(donorPool)) {
            console.log("MetricsContract addresses updated");
        } catch Error(string memory reason) {
            console.log("MetricsContract updateContractAddresses failed:", reason);
            vm.stopBroadcast();
            return;
        }

        // Stop deployer broadcast
        vm.stopBroadcast();

        // Register facility as 0x123
        vm.startBroadcast(facilityPrivateKey);
        try hst.registerFacility(facility, "Test Facility", "LIC123") {
            console.log("Facility registered:", facility);
        } catch Error(string memory reason) {
            console.log("Facility registration failed:", reason);
            vm.stopBroadcast();
            return;
        }
        vm.stopBroadcast();

        // Resume deployer broadcast for verification
        vm.startBroadcast(deployerPrivateKey);
        try hst.verifyFacility(facility) {
            console.log("Facility verified:", facility);
        } catch Error(string memory reason) {
            console.log("Facility verification failed:", reason);
            vm.stopBroadcast();
            return;
        }

        vm.stopBroadcast();
    }
}