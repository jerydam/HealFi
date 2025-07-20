// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "./HSTContract.sol";
import "./DonorPoolContract.sol";

contract MultisigRedemptionContract is Ownable, Pausable {
    HSTContract public hstContract;
    DonorPoolContract public donorPoolContract;
    address public healfiAdmin;
    IERC20 public cUSDContract; // Changed to cUSD
    uint256 public constant TESTNET_CHAIN_ID = 44787; // Celo Alfajores testnet

    struct Redemption {
        address user;
        address facility;
        uint256 hstAmount;
        bool facilitySigned;
        bool healfiSigned;
        bool executed;
        string outcomeHash; // Added for health outcome tracking
    }

    Redemption[] public redemptions;

    event RedemptionInitiated(uint256 indexed redemptionId, address indexed user, address indexed facility, uint256 hstAmount, string outcomeHash);
    event RedemptionSigned(uint256 indexed redemptionId, address indexed signer);
    event RedemptionExecuted(uint256 indexed redemptionId, address indexed user, uint256 cUSDAmount);

    constructor(address _hstContract, address _donorPoolContract, address _healfiAdmin, address _cUSDContract) Ownable() {
        hstContract = HSTContract(_hstContract);
        donorPoolContract = DonorPoolContract(_donorPoolContract);
        healfiAdmin = _healfiAdmin;
        cUSDContract = IERC20(_cUSDContract);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function initiateRedemption(address user, address facility, uint256 hstAmount, string calldata outcomeHash) external whenNotPaused {
        require(msg.sender == user, "Only user can initiate");
        require(hstContract.partneredFacilities(facility), "Not a partnered facility");
        require(hstContract.balanceOf(msg.sender) >= hstAmount, "Insufficient HST balance");
        require(bytes(outcomeHash).length > 0, "Outcome hash required");

        uint256 redemptionId = redemptions.length;
        redemptions.push(Redemption({
            user: user,
            facility: facility,
            hstAmount: hstAmount,
            facilitySigned: false,
            healfiSigned: false,
            executed: false,
            outcomeHash: outcomeHash
        }));

        hstContract.transferFrom(user, address(this), hstAmount);
        emit RedemptionInitiated(redemptionId, user, facility, hstAmount, outcomeHash);
    }

    function testInitiateRedemption(address user, address facility, uint256 hstAmount, string calldata outcomeHash) external onlyOwner {
        require(block.chainid == TESTNET_CHAIN_ID, "Testnet only");
        require(hstContract.partneredFacilities(facility), "Not a partnered facility");
        require(bytes(outcomeHash).length > 0, "Outcome hash required");

        uint256 redemptionId = redemptions.length;
        redemptions.push(Redemption({
            user: user,
            facility: facility,
            hstAmount: hstAmount,
            facilitySigned: false,
            healfiSigned: false,
            executed: false,
            outcomeHash: outcomeHash
        }));

        emit RedemptionInitiated(redemptionId, user, facility, hstAmount, outcomeHash);
    }

    function signRedemption(uint256 redemptionId) external whenNotPaused {
        Redemption storage redemption = redemptions[redemptionId];
        require(!redemption.executed, "Redemption already executed");
        require(msg.sender == redemption.facility || msg.sender == healfiAdmin, "Unauthorized signer");

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
        uint256 cUSDAmount = (redemption.hstAmount * donorPoolContract.HST_CUSD_RATE()) / 10**18;

        hstContract.burn(redemption.hstAmount);
        donorPoolContract.matchRedemption(redemption.user, redemption.hstAmount, redemption.facility);

        emit RedemptionExecuted(redemptionId, redemption.user, cUSDAmount);
    }

    function updateContractAddresses(
        address _hstContract,
        address _donorPoolContract,
        address _healfiAdmin,
        address _cUSDContract
    ) external onlyOwner {
        hstContract = HSTContract(_hstContract);
        donorPoolContract = DonorPoolContract(_donorPoolContract);
        healfiAdmin = _healfiAdmin;
        cUSDContract = IERC20(_cUSDContract);
    }
}