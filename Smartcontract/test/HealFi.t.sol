// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/UserSavingsContract.sol";
import "../src/HSTContract.sol";
import "../src/LoanContract.sol";
import "../src/DonorPoolContract.sol";
import "src/MultisigRedemptionContract.sol";
import "../src/FeeManagerContract.sol";
import "../src/MockUSDT.sol";

contract HealFiTest is Test {
    UserSavingsContract userSavings;
    HSTContract hst;
    LoanContract loan;
    DonorPoolContract donorPool;
    MultisigRedemptionContract multisig;
    FeeManagerContract feeManager;
    MockUSDT usdt;

    address deployer = address(this);
    address user1 = address(0x1);
    address user2 = address(0x2);
    address facility = address(0x3);
    address healfiAdmin = address(0x4);
    address guarantor = address(0x5);

    function setUp() public {
        // Deploy contracts
        usdt = new MockUSDT();
        feeManager = new FeeManagerContract(address(usdt));
        hst = new HSTContract(address(0), address(0), address(0), address(usdt));
        userSavings = new UserSavingsContract(address(hst), address(feeManager), address(usdt), address(0));
        loan = new LoanContract(address(userSavings), address(hst), address(feeManager), address(usdt));
        multisig = new MultisigRedemptionContract(address(hst), address(0), healfiAdmin, address(usdt));
        donorPool = new DonorPoolContract(address(hst), address(usdt), address(multisig), address(feeManager));

        // Update contract addresses
        hst.updateContractAddresses(address(userSavings), address(loan), address(multisig), address(usdt));
        multisig.updateContractAddresses(address(hst), address(donorPool), healfiAdmin, address(usdt));
        userSavings.updateContractAddresses(address(hst), address(feeManager), address(usdt), address(loan));
        loan.updateContractAddresses(address(userSavings), address(hst), address(feeManager), address(usdt));
        donorPool.updateContractAddresses(address(hst), address(usdt), address(multisig), address(feeManager));

        // Add partnered facility
        hst.addPartneredFacility(facility);

        // Fund users with USDT
        usdt.mint(user1, 10_000 * 10**6); // 10,000 USDT
        usdt.mint(user2, 10_000 * 10**6);
        usdt.mint(guarantor, 10_000 * 10**6);
        usdt.mint(deployer, 1_000_000 * 10**6);
    }

    function testIndividualRegistrationAndDeposit() public {
        vm.startPrank(user1);
        userSavings.registerIndividual(UserSavingsContract.PlanType.Daily);

        // Approve and deposit
        uint256 depositAmount = 1000 * 10**6; // 1000 USDT
        usdt.approve(address(userSavings), depositAmount);
        userSavings.deposit(depositAmount);

        // Check savings info
        (
            UserSavingsContract.AccountType accountType,
            uint256 balance,
            UserSavingsContract.PlanType planType,
            uint256 streak,
            uint256 hstEarned,
            uint256 familyId,
            uint256 familyTreasuryBalance,
            uint256 lastDepositTime
        ) = userSavings.getSavingsInfo(user1);

        assertEq(uint(accountType), uint(UserSavingsContract.AccountType.Individual));
        assertEq(balance, depositAmount - userSavings.DEPOSIT_FEE());
        assertEq(uint(planType), uint(UserSavingsContract.PlanType.Daily));
        assertEq(streak, 1);
        assertEq(hstEarned, 0);
        assertEq(familyId, 0);
        assertEq(familyTreasuryBalance, 0);
        assertEq(lastDepositTime, block.timestamp);

        // Second deposit to trigger streak bonus
        vm.warp(block.timestamp + 1 hours);
        usdt.approve(address(userSavings), depositAmount);
        userSavings.deposit(depositAmount);
        (, , , streak, hstEarned, , , ) = userSavings.getSavingsInfo(user1);
        assertEq(streak, 2);

        // Fast forward to 5 deposits
        for (uint i = 0; i < 3; i++) {
            vm.warp(block.timestamp + 1 hours);
            usdt.approve(address(userSavings), depositAmount);
            userSavings.deposit(depositAmount);
        }
        (, , , streak, hstEarned, , , ) = userSavings.getSavingsInfo(user1);
        assertEq(streak, 5);
        assertEq(hstEarned, userSavings.HST_BONUS_AMOUNT());

        vm.stopPrank();
    }

    function testFamilyRegistrationAndTreasury() public {
        address[] memory members = new address[](2);
        members[0] = user1;
        members[1] = user2;

        vm.startPrank(user1);
        userSavings.registerFamily(members, UserSavingsContract.PlanType.Weekly);

        // User1 deposits
        uint256 depositAmount = 1000 * 10**6;
        usdt.approve(address(userSavings), depositAmount);
        userSavings.deposit(depositAmount);

        // User2 deposits
        vm.startPrank(user2);
        usdt.approve(address(userSavings), depositAmount);
        userSavings.deposit(depositAmount);

        // Check family treasury
        (, , , , , uint256 familyId, uint256 familyTreasuryBalance, ) = userSavings.getSavingsInfo(user1);
        assertEq(familyTreasuryBalance, 2 * (depositAmount - userSavings.DEPOSIT_FEE()));
        assertEq(familyId, 1);

        // User2 withdraws
        uint256 withdrawAmount = 500 * 10**6;
        userSavings.withdraw(withdrawAmount);
        (, , , , , , familyTreasuryBalance, ) = userSavings.getSavingsInfo(user2);
        assertEq(familyTreasuryBalance, 2 * (depositAmount - userSavings.DEPOSIT_FEE()) - withdrawAmount);

        vm.stopPrank();
    }

    function testLoanProcess() public {
        vm.startPrank(user1);
        userSavings.registerIndividual(UserSavingsContract.PlanType.Daily);

        // Deposit enough to qualify
        uint256 depositAmount = 2000 * 10**6;
        usdt.approve(address(userSavings), depositAmount);
        userSavings.deposit(depositAmount);
        for (uint i = 0; i < 4; i++) {
            vm.warp(block.timestamp + 1 hours);
            usdt.approve(address(userSavings), depositAmount);
            userSavings.deposit(depositAmount);
        }
        assertEq(hst.balanceOf(user1), userSavings.HST_BONUS_AMOUNT());

        // Apply for loan
        uint256 loanAmount = 1000 * 10**6;
        loan.applyLoan(loanAmount);
        vm.stopPrank();

        // Guarantor stakes
        vm.startPrank(guarantor);
        userSavings.registerIndividual(UserSavingsContract.PlanType.Daily);
        usdt.approve(address(userSavings), 3000 * 10**6);
        userSavings.deposit(3000 * 10**6);
        loan.stakeGuarantor(user1, guarantor);

        // Verify guarantor funds are locked
        uint256 lockedBalance = userSavings.getLockedBalance(guarantor);
        assertEq(lockedBalance, loanAmount);

        // Attempt to withdraw locked funds (should fail)
        vm.expectRevert("Insufficient unlocked balance");
        userSavings.withdraw(2000 * 10**6); // Try to withdraw more than unlocked balance
        vm.stopPrank();

        // Disburse loan
        vm.startPrank(user1);
        usdt.mint(address(loan), 2000 * 10**6); // Fund loan contract for testing
        loan.disburseLoan(user1);
        assertEq(usdt.balanceOf(user1), 10_000 * 10**6 - 5 * depositAmount + loanAmount);

        // Repay loan
        uint256 repaymentAmount = loanAmount + (loanAmount * loan.LOAN_INTEREST_RATE() / 100);
        usdt.approve(address(loan), repaymentAmount);
        loan.repayLoan(repaymentAmount);
        assertEq(hst.balanceOf(guarantor), loan.GUARANTOR_HST_REWARD());

        // Verify guarantor funds are unlocked
        lockedBalance = userSavings.getLockedBalance(guarantor);
        assertEq(lockedBalance, 0);

        // Guarantor can now withdraw
        vm.startPrank(guarantor);
        usdt.approve(address(userSavings), 2000 * 10**6);
        userSavings.withdraw(2000 * 10**6); // Should succeed
        vm.stopPrank();
    }

    function testDonorPoolAndRedemption() public {
        vm.startPrank(user1);
        userSavings.registerIndividual(UserSavingsContract.PlanType.Daily);
        usdt.approve(address(userSavings), 1000 * 10**6);
        userSavings.deposit(1000 * 10**6);
        for (uint i = 0; i < 4; i++) {
            vm.warp(block.timestamp + 1 hours);
            usdt.approve(address(userSavings), 1000 * 10**6);
            userSavings.deposit(1000 * 10**6);
        }
        uint256 hstBalance = hst.balanceOf(user1);
        assertEq(hstBalance, userSavings.HST_BONUS_AMOUNT());
        vm.stopPrank();

        // Donor contributes
        vm.startPrank(deployer);
        uint256 donationAmount = 1000 * 10**6;
        usdt.approve(address(donorPool), donationAmount);
        donorPool.donate(donationAmount, "fee-free");
        assertEq(donorPool.feeFreePoolBalance(), donationAmount);
        vm.stopPrank();

        // Initiate redemption
        vm.startPrank(user1);
        hst.approve(address(multisig), hstBalance);
        multisig.initiateRedemption(user1, facility, hstBalance);
        vm.stopPrank();

        // Facility signs
        vm.startPrank(facility);
        multisig.signRedemption(0);
        vm.stopPrank();

        // HealFi signs
        vm.startPrank(healfiAdmin);
        multisig.signRedemption(0);
        vm.stopPrank();

        // Check redemption
        uint256 usdtAmount = (hstBalance * donorPool.HST_USDT_RATE()) / 10**18;
        assertEq(donorPool.feeFreePoolBalance(), donationAmount - usdtAmount);
        assertEq(hst.balanceOf(user1), 0);
        // Destructure donorInfo tuple
        (, , , uint256 hstMatched) = donorPool.donorInfo(facility);
        assertEq(hstMatched, hstBalance);
        (, , uint256 peopleHelped, ) = donorPool.donorInfo(facility);
        assertEq(peopleHelped, 1);
    }
}