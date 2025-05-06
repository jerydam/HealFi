// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract HSTContract is ERC20, Ownable {
    address public userSavingsContract;
    address public loanContract;
    address public multisigRedemptionContract;
    IERC20 public usdtContract;

    mapping(address => bool) public partneredFacilities;

    event PartneredFacilityAdded(address indexed facility);
    event PartneredFacilityRemoved(address indexed facility);

    constructor(
        address _userSavingsContract,
        address _loanContract,
        address _multisigRedemptionContract,
        address _usdtContract
    ) ERC20("HealthFi Saving Token", "HST")  Ownable() {
        userSavingsContract = _userSavingsContract;
        loanContract = _loanContract;
        multisigRedemptionContract = _multisigRedemptionContract;
        usdtContract = IERC20(_usdtContract);
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == userSavingsContract || msg.sender == loanContract, "Unauthorized");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        require(msg.sender == multisigRedemptionContract, "Unauthorized");
        _burn(msg.sender, amount);
    }

    function addPartneredFacility(address facility) external onlyOwner {
        require(facility != address(0), "Invalid address");
        partneredFacilities[facility] = true;
        emit PartneredFacilityAdded(facility);
    }

    function removePartneredFacility(address facility) external onlyOwner {
        require(partneredFacilities[facility], "Not a partnered facility");
        partneredFacilities[facility] = false;
        emit PartneredFacilityRemoved(facility);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
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
        address _usdtContract
    ) external onlyOwner {
        userSavingsContract = _userSavingsContract;
        loanContract = _loanContract;
        multisigRedemptionContract = _multisigRedemptionContract;
        usdtContract = IERC20(_usdtContract);
    }
}