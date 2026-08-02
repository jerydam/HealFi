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
import "../src/MockUSDT.sol";

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

        // Botchain has no native cUSD. Reuse an existing token by setting
        // USDT_ADDRESS before running; otherwise this deploys MockUSDT so the
        // script still runs end-to-end on a fresh chain.
        address cUSD = vm.envOr("USDT_ADDRESS", address(0));
        if (cUSD == address(0)) {
            MockUSDT mockUsdt = new MockUSDT();
            cUSD = address(mockUsdt);
            console.log("MockUSDT deployed at:", cUSD);
        } else {
            console.log("Using existing token at:", cUSD);
        }

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

        console.log("---------------------------------------------");
        console.log("Deployment summary");
        console.log("---------------------------------------------");
        console.log("Token (USDT-equivalent):   ", cUSD);
        console.log("FeeManagerContract:        ", address(feeManager));
        console.log("HSTContract:                ", address(hst));
        console.log("UserSavingsContract:        ", address(userSavings));
        console.log("LoanContract:               ", address(loan));
        console.log("MultisigRedemptionContract: ", address(multisig));
        console.log("DonorPoolContract:          ", address(donorPool));
        console.log("MetricsContract:            ", address(metrics));
    }
}