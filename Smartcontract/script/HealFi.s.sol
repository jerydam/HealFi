// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/HealFi.sol";
import "../src/HealFiSavings.sol";
import "../src/HealFiMicroCredit.sol";
import "../src/HealFiPartner.sol";
import "../src/HealFiToken.sol";
import "../src/HealFiDao.sol";

contract DeployHealFi is Script {
    function run() external {
        vm.startBroadcast();

        // Celo Alfajores addresses with corrected checksums
        address celoUSD = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1; // cUSD
        address celoEUR = 0xE4d517785D091D3c08ebdbA17733A2087cFaB023; // cEUR
        address celoREAL = 0xE4d517785D091D3c08ebdbA17733A2087cFaB023; // Placeholder (replace with cREAL)
        address eurUsdFeed = 0x7D7356bF6EE5C64169a3b940007E37731fB53214; // Chainlink EUR/USD on Alfajores
        address realUsdFeed = 0x7D7356bF6EE5C64169a3b940007E37731fB53214; // Placeholder (replace with REAL/USD)

        HealFiSavings savings = new HealFiSavings(eurUsdFeed, realUsdFeed);
        HealFiMicrocredit microcredit = new HealFiMicrocredit(eurUsdFeed, realUsdFeed);
        HealFiPartners partners = new HealFiPartners(eurUsdFeed, realUsdFeed);
        HealFiToken token = new HealFiToken();
        HealFiGovernance governance = new HealFiGovernance();
        HealFi healfi = new HealFi(celoUSD, celoEUR, celoREAL);

        healfi.setupContracts(address(savings), address(microcredit), address(partners), address(token), address(governance));
        savings.updateSupportedStablecoins(celoUSD, celoEUR, celoREAL);
        microcredit.updateSupportedStablecoins(celoUSD, celoEUR, celoREAL);
        partners.updateSupportedStablecoins(celoUSD, celoEUR, celoREAL);

        console.log("HealFi deployed at:", address(healfi));
        console.log("Savings deployed at:", address(savings));
        console.log("Microcredit deployed at:", address(microcredit));
        console.log("Partners deployed at:", address(partners));
        console.log("Token deployed at:", address(token));
        console.log("Governance deployed at:", address(governance));

        vm.stopBroadcast();
    }
}