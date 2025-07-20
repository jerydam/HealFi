// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/security/Pausable.sol";

contract HSTContract is ERC20, Ownable, Pausable {
    address public userSavingsContract;
    address public loanContract;
    address public multisigRedemptionContract;
    IERC20 public cUSDContract;
    uint256 public constant TESTNET_CHAIN_ID = 44787; // Celo Alfajores testnet

    struct Facility {
        string name;
        string licenseNumber;
        bool verified;
    }

    mapping(address => bool) public partneredFacilities;
    mapping(address => Facility) public facilityInfo;

    event PartneredFacilityAdded(address indexed facility);
    event PartneredFacilityRemoved(address indexed facility);
    event FacilityRegistered(address indexed facility, string name);
    event FacilityVerified(address indexed facility);

    constructor(
        address _userSavingsContract,
        address _loanContract,
        address _multisigRedemptionContract,
        address _cUSDContract
    ) ERC20("HealthFi Saving Token", "HST") Ownable() {
        userSavingsContract = _userSavingsContract;
        loanContract = _loanContract;
        multisigRedemptionContract = _multisigRedemptionContract;
        cUSDContract = IERC20(_cUSDContract);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) external whenNotPaused {
        require(msg.sender == userSavingsContract || msg.sender == loanContract, "Unauthorized caller");
        _mint(to, amount);
    }

    function testMint(address to, uint256 amount) external onlyOwner {
        require(block.chainid == TESTNET_CHAIN_ID, "Testnet only");
        _mint(to, amount);
    }

    function burn(uint256 amount) external whenNotPaused {
        require(msg.sender == multisigRedemptionContract, "Unauthorized caller");
        _burn(msg.sender, amount);
    }

    function registerFacility(address facility, string calldata name, string calldata licenseNumber) external whenNotPaused {
        require(msg.sender == facility, "Only facility can register");
        require(!partneredFacilities[facility], "Already registered");
        require(bytes(name).length > 0, "Name required");
        require(bytes(licenseNumber).length > 0, "License number required");
        facilityInfo[facility] = Facility(name, licenseNumber, false);
        emit FacilityRegistered(facility, name);
    }

    function verifyFacility(address facility) external onlyOwner whenNotPaused {
        require(facilityInfo[facility].verified == false, "Already verified");
        facilityInfo[facility].verified = true;
        partneredFacilities[facility] = true;
        emit FacilityVerified(facility);
        emit PartneredFacilityAdded(facility);
    }

    function addPartneredFacility(address facility) external onlyOwner whenNotPaused {
        require(facility != address(0), "Invalid facility address");
        require(!partneredFacilities[facility], "Already partnered");
        partneredFacilities[facility] = true;
        facilityInfo[facility] = Facility("Unknown", "Unknown", true);
        emit PartneredFacilityAdded(facility);
    }

    function removePartneredFacility(address facility) external onlyOwner whenNotPaused {
        require(partneredFacilities[facility], "Not a partnered facility");
        partneredFacilities[facility] = false;
        facilityInfo[facility].verified = false;
        emit PartneredFacilityRemoved(facility);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            require(
                partneredFacilities[to] || to == multisigRedemptionContract,
                "Transfer only to partnered facilities or multisig"
            );
        }
        super._beforeTokenTransfer(from, to, amount);
    }

    function updateContractAddresses(
        address _userSavingsContract,
        address _loanContract,
        address _multisigRedemptionContract,
        address _cUSDContract
    ) external onlyOwner {
        require(_userSavingsContract != address(0), "Invalid UserSavingsContract address");
        require(_loanContract != address(0), "Invalid LoanContract address");
        require(_multisigRedemptionContract != address(0), "Invalid MultisigRedemptionContract address");
        require(_cUSDContract != address(0), "Invalid cUSDContract address");
        userSavingsContract = _userSavingsContract;
        loanContract = _loanContract;
        multisigRedemptionContract = _multisigRedemptionContract;
        cUSDContract = IERC20(_cUSDContract);
    }
}   