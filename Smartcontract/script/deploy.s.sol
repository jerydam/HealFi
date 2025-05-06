// SPDX-License-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UserSavingsContract.sol";
import "../src/HSTContract.sol";
import "../src/LoanContract.sol";
import "../src/DonorPoolContract.sol";
import "../src/MultisigRedemptionContract.sol";
import "../src/FeeManagerContract.sol";
import "../src/MockUSDT.sol";

contract DeployHealFi is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockUSDT
        MockUSDT usdt = new MockUSDT();

        // Deploy FeeManagerContract
        FeeManagerContract feeManager = new FeeManagerContract(address(usdt));

        // Deploy HSTContract
        HSTContract hst = new HSTContract(address(0), address(0), address(0), address(usdt));

        // Deploy UserSavingsContract
        UserSavingsContract userSavings = new UserSavingsContract(address(hst), address(feeManager), address(usdt), address(0));

        // Deploy LoanContract
        LoanContract loan = new LoanContract(address(userSavings), address(hst), address(feeManager), address(usdt));

        // Deploy MultisigRedemptionContract
        MultisigRedemptionContract multisig = new MultisigRedemptionContract(
            address(hst),
            address(0), // Placeholder for DonorPool
            msg.sender, // HealFi admin
            address(usdt)
        );

        // Deploy DonorPoolContract
        DonorPoolContract donorPool = new DonorPoolContract(
            address(hst),
            address(usdt),
            address(multisig),
            address(feeManager)
        );

        // Update contract addresses
        hst.updateContractAddresses(address(userSavings), address(loan), address(multisig), address(usdt));
        multisig.updateContractAddresses(address(hst), address(donorPool), msg.sender, address(usdt));
        userSavings.updateContractAddresses(address(hst), address(feeManager), address(usdt), address(loan));
        loan.updateContractAddresses(address(userSavings), address(hst), address(feeManager), address(usdt));
        donorPool.updateContractAddresses(address(hst), address(usdt), address(multisig), address(feeManager));

        // Add a partnered facility for testing
        address facility = address(0x123);
        hst.addPartneredFacility(facility);

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("MockUSDT deployed at:", address(usdt));
        console.log("FeeManagerContract deployed at:", address(feeManager));
        console.log("HSTContract deployed at:", address(hst));
        console.log("UserSavingsContract deployed at:", address(userSavings));
        console.log("LoanContract deployed at:", address(loan));
        console.log("DonorPoolContract deployed at:", address(donorPool));
        console.log("MultisigRedemptionContract deployed at:", address(multisig));
    }
}