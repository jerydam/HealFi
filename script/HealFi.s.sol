// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/HealFi.sol";
import "../src/HealFiDao.sol";
import "../src/HealFiToken.sol";
import "../lib/openzeppelin-contracts/contracts/governance/TimelockController.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address cUSD = vm.envAddress("CUSD_ADDRESS"); // Alfajores testnet cUSD

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy HealFiToken
        HealFiToken token = new HealFiToken(1_000_000e18);
        console.log("HealFiToken deployed at:", address(token));

        // Step 2: Deploy TimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer; // Temporary
        executors[0] = address(0); // Anyone can execute
        TimelockController timelock = new TimelockController(2 days, proposers, executors, deployer);
        console.log("TimelockController deployed at:", address(timelock));

        // Step 3: Deploy HealFi (placeholder DAO address initially)
        HealFi healfi = new HealFi(cUSD, deployer); // Deployer as temp governance
        console.log("HealFi deployed at:", address(healfi));

        // Step 4: Deploy HealFiDAO with HealFi address
        HealFiDAO dao = new HealFiDAO(
            ERC20Votes(address(token)),
            address(healfi),
            17_280, // ~1 day voting delay
            51_840, // ~3 days voting period
            10e18,  // 10 tokens to propose
            timelock
        );
        console.log("HealFiDAO deployed at:", address(dao));

        // Step 5: Update HealFi governance to DAO (requires a setter in HealFi or initial deployment tweak)
        // For now, assume manual update post-deployment via a proposal or redeployment

        // Step 6: Update Timelock proposers
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.revokeRole(timelock.PROPOSER_ROLE(), deployer);
        console.log("Timelock updated: DAO is proposer");

        vm.stopBroadcast();
    }
}