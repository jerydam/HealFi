// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/HealFi.sol";
import "../src/HealFiSavings.sol";
import "../src/HealFiMicroCredit.sol";
import "../src/HealFiPartner.sol";
import "../src/HealFiToken.sol";
import "../src/HealFiDao.sol";
import "./mock/MockERC20.sol";
import "./mock/MockAggregatorV3.sol";

contract HealFiAllTests is Test {
    HealFi healfi;
    HealFiSavings savings;
    HealFiMicrocredit microcredit;
    HealFiPartners partners;
    HealFiToken token;
    HealFiGovernance governance;
    MockERC20 celoUSD;
    MockERC20 celoEUR;
    MockERC20 celoREAL;
    MockAggregatorV3 eurUsdFeed;
    MockAggregatorV3 realUsdFeed;

    address admin = address(this);
    address user = address(0x1);
    address partner = address(0x2);
function setUp() public {
    // Deploy mock tokens and price feeds
    celoUSD = new MockERC20("Celo USD", "cUSD");
    celoEUR = new MockERC20("Celo EUR", "cEUR");
    celoREAL = new MockERC20("Celo REAL", "cREAL");
    eurUsdFeed = new MockAggregatorV3(120000000); // 1.2 USD per EUR
    realUsdFeed = new MockAggregatorV3(25000000); // 0.25 USD per REAL

    // Deploy all HealFi contracts
    healfi = new HealFi(address(celoUSD), address(celoEUR), address(celoREAL));
    savings = new HealFiSavings(address(eurUsdFeed), address(realUsdFeed));
    microcredit = new HealFiMicrocredit(address(eurUsdFeed), address(realUsdFeed));
    partners = new HealFiPartners(address(eurUsdFeed), address(realUsdFeed));
    token = new HealFiToken();
    governance = new HealFiGovernance();

    // Verify ownership
    assertEq(healfi.owner(), address(this), "HealFi owner mismatch");
    assertEq(savings.owner(), address(this), "Savings owner mismatch");
    assertEq(microcredit.owner(), address(this), "Microcredit owner mismatch");
    assertEq(partners.owner(), address(this), "Partners owner mismatch");
    assertEq(token.owner(), address(this), "Token owner mismatch");
    assertEq(governance.owner(), address(this), "Governance owner mismatch");

    // Set up contract relationships directly from the test contract
    healfi.setupContracts(address(savings), address(microcredit), address(partners), address(token), address(governance));
    savings.setContracts(address(microcredit), address(token));
    savings.updateSupportedStablecoins(address(celoUSD), address(celoEUR), address(celoREAL));
    microcredit.setContracts(address(savings), address(partners), address(token));
    microcredit.updateSupportedStablecoins(address(celoUSD), address(celoEUR), address(celoREAL));
    partners.setContracts(address(microcredit), address(token));
    partners.updateSupportedStablecoins(address(celoUSD), address(celoEUR), address(celoREAL));
    token.setContracts(address(savings), address(microcredit), address(partners));
    governance.setContracts(address(savings), address(microcredit), address(partners), address(token));

    // Mint tokens for testing
    celoUSD.mint(user, 1000 * 10**18);
    celoEUR.mint(user, 1000 * 10**18);
    celoREAL.mint(user, 1000 * 10**18);
    celoUSD.mint(address(savings), 1000 * 10**18); // Fund savings for loans
    token.governanceMint(user, 100 * 10**18); // For governance voting

    // Grant roles
    token.grantRole(token.MINTER_ROLE(), address(this));
    token.addRewardDistributor(address(microcredit));
}

    // HealFi Tests
    function testHealFiSetupContracts() public view { // Changed to view
        assertEq(address(healfi.savingsContract()), address(savings));
        assertEq(address(healfi.microcreditContract()), address(microcredit));
        assertEq(address(healfi.partnersContract()), address(partners));
        assertEq(address(healfi.tokenContract()), address(token));
        assertEq(address(healfi.governanceContract()), address(governance));
    }

    function testHealFiUpdateStablecoins() public {
        address newCeloUSD = address(new MockERC20("New USD", "nUSD"));
        healfi.updateStablecoins(newCeloUSD, address(celoEUR), address(celoREAL));
        assertEq(healfi.celoUSD(), newCeloUSD);
    }

    function testHealFiPause() public {
        healfi.pause();
        assertTrue(healfi.paused());
    }

    // HealFiSavings Tests
    function testSavingsDeposit() public {
        vm.startPrank(user);
        savings.createAccount();
        celoUSD.approve(address(savings), 100 * 10**18);
        savings.deposit(address(celoUSD), 100 * 10**18);
        (uint256 balanceUSD,,,,) = savings.getAccountInfo(user);
        assertEq(balanceUSD, 100 * 10**18);
        vm.stopPrank();
    }

    function testSavingsWithdraw() public {
        vm.startPrank(user);
        savings.createAccount();
        celoUSD.approve(address(savings), 100 * 10**18);
        savings.deposit(address(celoUSD), 100 * 10**18);
        savings.withdraw(address(celoUSD), 50 * 10**18);
        (uint256 balanceUSD,,,,) = savings.getAccountInfo(user);
        assertEq(balanceUSD, 50 * 10**18);
        vm.stopPrank();
    }

    // HealFiMicroCredit Tests
    function testMicroCreditRequestLoan() public {
        vm.startPrank(user);
        savings.createAccount();
        celoUSD.approve(address(savings), 100 * 10**18);
        savings.deposit(address(celoUSD), 100 * 10**18);
        vm.warp(block.timestamp + 30 days); // Simulate savings streak
        microcredit.requestLoan(address(celoUSD), 50 * 10**18, 30, false, address(0));
        (address borrower,,,,,,,) = microcredit.getLoanDetails(0);
        assertEq(borrower, user);
        vm.stopPrank();
    }

    function testMicroCreditApproveLoan() public {
        vm.startPrank(user);
        savings.createAccount();
        celoUSD.approve(address(savings), 100 * 10**18);
        savings.deposit(address(celoUSD), 100 * 10**18);
        vm.warp(block.timestamp + 30 days);
        microcredit.requestLoan(address(celoUSD), 50 * 10**18, 30, false, address(0));
        vm.stopPrank();
        microcredit.approveLoan(0);
        (, , , , , , , HealFiMicrocredit.LoanStatus status) = microcredit.getLoanDetails(0);
        assertEq(uint256(status), uint256(HealFiMicrocredit.LoanStatus.Active));
    }

    function testMicroCreditRepayLoan() public {
        vm.startPrank(user);
        savings.createAccount();
        celoUSD.approve(address(savings), 100 * 10**18);
        savings.deposit(address(celoUSD), 100 * 10**18);
        vm.warp(block.timestamp + 30 days);
        microcredit.requestLoan(address(celoUSD), 50 * 10**18, 30, false, address(0));
        vm.stopPrank();
        microcredit.approveLoan(0);
        vm.startPrank(user);
        celoUSD.approve(address(microcredit), 51 * 10**18); // Amount + fee (1%)
        microcredit.repayLoan(0, 51 * 10**18);
        (, , , , , , , HealFiMicrocredit.LoanStatus status) = microcredit.getLoanDetails(0);
        assertEq(uint256(status), uint256(HealFiMicrocredit.LoanStatus.Repaid));
        vm.stopPrank();
    }

    // HealFiPartner Tests
    function testPartnerRegister() public {
        vm.prank(partner);
        partners.registerPartner("Clinic A", "Location A", partner, HealFiPartners.PartnerType.Clinic, 1000);
        (string memory name,,,,,,) = partners.getPartnerDetails(partner);
        assertEq(name, "Clinic A");
    }

    function testPartnerVerifyAndRecordService() public {
        vm.prank(partner);
        partners.registerPartner("Clinic A", "Location A", partner, HealFiPartners.PartnerType.Clinic, 1000);
        partners.verifyPartner(partner);
        vm.prank(partner);
        partners.recordService(user, 10 * 10**18, address(celoUSD), "Checkup");
        (, , uint256 amount,,,) = partners.serviceRecords(0);
        assertEq(amount, 10 * 10**18);
    }

    // HealFiToken Tests
    function testTokenMintRewardTokens() public {
        token.mintRewardTokens(user, 100 * 10**18);
        assertEq(token.balanceOf(user), 200 * 10**18); // Initial 100 + 100 minted
    }

    function testTokenRedeemForService() public {
        vm.prank(user);
        token.redeemForService(50 * 10**18, "Healthcare Service");
        assertEq(token.balanceOf(user), 50 * 10**18); // 100 - 50 redeemed
    }

    // HealFiGovernance Tests
    function testGovernanceCreateProposal() public {
        vm.prank(user);
        governance.createProposal("Test Proposal", "", address(0), HealFiGovernance.ProposalType.General);
        assertEq(governance.getProposalCount(), 1);
    }

    function testGovernanceVoteAndExecute() public {
        vm.startPrank(user);
        governance.createProposal("Test Proposal", "", address(0), HealFiGovernance.ProposalType.General);
        governance.castVote(0, true);
        vm.warp(block.timestamp + 7 days + 2 days + 1); // Past voting + execution delay
        governance.executeProposal(0); // Note: This will fail due to empty callData, but status changes to Passed
        (,,,,,,,,,, HealFiGovernance.ProposalStatus status) = governance.proposals(0);
        assertEq(uint256(status), uint256(HealFiGovernance.ProposalStatus.Passed));
        vm.stopPrank();
    }
}