// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import "./HSTContract.sol";
import "./DonorPoolContract.sol";

contract MultisigRedemptionContract is Ownable {
    HSTContract public hstContract;
    DonorPoolContract public donorPoolContract;
    address public healfiAdmin;
    IERC20 public usdtContract;

    struct Redemption {
        address user;
        address facility;
        uint256 hstAmount;
        bool facilitySigned;
        bool healfiSigned;
        bool executed;
    }

    Redemption[] public redemptions;

    event RedemptionInitiated(uint256 indexed redemptionId, address indexed user, address indexed facility, uint256 hstAmount);
    event RedemptionSigned(uint256 indexed redemptionId, address indexed signer);
    event RedemptionExecuted(uint256 indexed redemptionId, address indexed user, uint256 usdtAmount);

    constructor(address _hstContract, address _donorPoolContract, address _healfiAdmin, address _usdtContract)  Ownable() {
        hstContract = HSTContract(_hstContract);
        donorPoolContract = DonorPoolContract(_donorPoolContract);
        healfiAdmin = _healfiAdmin;
        usdtContract = IERC20(_usdtContract);
    }

    function initiateRedemption(address user, address facility, uint256 hstAmount) external {
        require(msg.sender == user, "Only user can initiate");
        require(hstContract.partneredFacilities(facility), "Not a partnered facility");
        require(hstContract.balanceOf(msg.sender) >= hstAmount, "Insufficient HST");

        uint256 redemptionId = redemptions.length;
        redemptions.push(Redemption({
            user: user,
            facility: facility,
            hstAmount: hstAmount,
            facilitySigned: false,
            healfiSigned: false,
            executed: false
        }));

        hstContract.transferFrom(user, address(this), hstAmount);
        emit RedemptionInitiated(redemptionId, user, facility, hstAmount);
    }

    function signRedemption(uint256 redemptionId) external {
        Redemption storage redemption = redemptions[redemptionId];
        require(!redemption.executed, "Redemption already executed");
        require(msg.sender == redemption.facility || msg.sender == healfiAdmin, "Unauthorized");

        if (msg.sender == redemption.facility) {
            require(!redemption.facilitySigned, "Facility already signed");
            redemption.facilitySigned = true;
        } else if (msg.sender == healfiAdmin) {
            require(!redemption.healfiSigned, "HealFi already signed");
            redemption.healfiSigned = true;
        }

        emit RedemptionSigned(redemptionId, msg.sender);

        if (redemption.facilitySigned && redemption.healfiSigned) {
            executeRedemption(redemptionId);
        }
    }

    function executeRedemption(uint256 redemptionId) internal {
        Redemption storage redemption = redemptions[redemptionId];
        require(!redemption.executed, "Already executed");
        require(redemption.facilitySigned && redemption.healfiSigned, "Not fully signed");

        redemption.executed = true;
        uint256 usdtAmount = (redemption.hstAmount * donorPoolContract.HST_USDT_RATE()) / 10**18;

        hstContract.burn(redemption.hstAmount);
        donorPoolContract.matchRedemption(redemption.user, redemption.hstAmount, redemption.facility);

        emit RedemptionExecuted(redemptionId, redemption.user, usdtAmount);
    }

    function updateContractAddresses(
        address _hstContract,
        address _donorPoolContract,
        address _healfiAdmin,
        address _usdtContract
    ) external onlyOwner {
        hstContract = HSTContract(_hstContract);
        donorPoolContract = DonorPoolContract(_donorPoolContract);
        healfiAdmin = _healfiAdmin;
        usdtContract = IERC20(_usdtContract);
    }
}