// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHealFiToken {
    function mintRewardTokens(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function getReputationScore(address user) external view returns (uint256);
}