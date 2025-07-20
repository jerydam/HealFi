// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "./UserSavingsContract.sol";
import "./LoanContract.sol";
import "./DonorPoolContract.sol";

contract MetricsContract is Ownable {
    UserSavingsContract public userSavingsContract;
    LoanContract public loanContract;
    DonorPoolContract public donorPoolContract;
    uint256 public totalHSTRedeemed;

    event RedemptionMetricsUpdated(uint256 hstAmount);

    constructor(address _userSavingsContract, address _loanContract, address _donorPoolContract) Ownable() {
        userSavingsContract = UserSavingsContract(_userSavingsContract);
        loanContract = LoanContract(_loanContract);
        donorPoolContract = DonorPoolContract(_donorPoolContract);
    }

    function updateRedemptionMetrics(uint256 hstAmount) external {
        require(msg.sender == address(donorPoolContract), "Only DonorPoolContract can call");
        totalHSTRedeemed += hstAmount;
        emit RedemptionMetricsUpdated(hstAmount);
    }

    function getPlatformMetrics() external view returns (
        uint256 totalUsers,
        uint256 totalSavings,
        uint256 totalLoansDisbursed,
        uint256 _totalHSTRedeemed,
        uint256 totalFundsMatched
    ) {
        return (
            userSavingsContract.totalUsers(),
            userSavingsContract.totalSavings(),
            loanContract.totalLoansDisbursed(),
            totalHSTRedeemed,
            donorPoolContract.totalFundsMatched()
        );
    }

    function updateContractAddresses(address _userSavingsContract, address _loanContract, address _donorPoolContract) external onlyOwner {
        userSavingsContract = UserSavingsContract(_userSavingsContract);
        loanContract = LoanContract(_loanContract);
        donorPoolContract = DonorPoolContract(_donorPoolContract);
    }
}