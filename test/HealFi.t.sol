// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/HealFi.sol";
import "../src/HealFiDao.sol";
import "../src/HealFiToken.sol";
import "../lib/openzeppelin-contracts/contracts/governance/TimelockController.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockCUSD is ERC20 {
    constructor() ERC20("Celo USD", "cUSD") {
        _mint(msg.sender, 1_000_000e18);
    }
}

contract HealFiTest is Test {
    HealFi healfi;
    HealFiDAO dao;
    HealFiToken token;
    TimelockController timelock;
    MockCUSD cUSD;

    address deployer = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    address guarantor = address(0x3);

    function setUp() public {
        cUSD = new MockCUSD();
        token = new HealFiToken(1_000_000e18);

        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = address(0);
        timelock = new TimelockController(2 days, proposers, executors, deployer);

        healfi = new HealFi(address(cUSD), deployer); // Deployer as temp governance
        dao = new HealFiDAO(
            ERC20Votes(address(token)),
            address(healfi),
            1, // 1 block delay
            10, // 10 blocks voting
            10e18,
            timelock
        );

        // Update governance to DAO (via cheatcode for test)
        vm.store(address(healfi), keccak256("governance"), bytes32(uint256(uint160(address(dao)))));

        timelock.grantRole(timelock.PROPOSER_ROLE(), address(dao));
        timelock.revokeRole(timelock.PROPOSER_ROLE(), deployer);

        token.transfer(user1, 100e18);
        token.transfer(user2, 100e18);
        cUSD.transfer(user1, 1000e18);
        cUSD.transfer(guarantor, 1000e18);
    }

    function testAddSavings() public {
        vm.startPrank(user1);
        cUSD.approve(address(healfi), 100e18);
        healfi.addSavings(100e18);
        assertEq(healfi.savings(user1), 100e18);
        assertEq(healfi.totalSavingsPool(), 100e18);
        assertEq(healfi.reputation(user1), 1);
        vm.stopPrank();
    }

    function testRequestLoan() public {
        vm.startPrank(user1);
        cUSD.approve(address(healfi), 100e18);
        healfi.addSavings(100e18);
        healfi.reputation(user1) = 10;
        vm.stopPrank();

        vm.startPrank(guarantor);
        cUSD.approve(address(healfi), 50e18);
        vm.stopPrank();

        vm.startPrank(user1);
        healfi.requestLoan(100e18, guarantor);
        (,,, uint256 repaidAmount,, bool active) = healfi.getLoanDetails(user1);
        assertEq(repaidAmount, 0);
        assertTrue(active);
        assertEq(cUSD.balanceOf(user1), 1000e18);
        vm.stopPrank();
    }

    function testDAOSlashProposal() public {
        testRequestLoan();

        vm.warp(block.timestamp + 181 days);

        vm.startPrank(user2);
        token.delegate(user2);
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(healfi);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("slashGuarantor(address)", user1);

        uint256 proposalId = dao.propose(targets, values, calldatas, "Slash guarantor");
        vm.roll(block.number + 2);
        dao.castVote(proposalId, 1);
        vm.roll(block.number + 11);
        dao.queue(proposalId);
        vm.warp(block.timestamp + 2 days + 1);
        dao.execute(proposalId);

        (,,, uint256 repaidAmount,, bool active) = healfi.getLoanDetails(user1);
        assertFalse(active);
        vm.stopPrank();
    }
}