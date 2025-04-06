// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockAggregatorV3 {
    int256 public price;

    constructor(int256 _price) {
        price = _price;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, price, block.timestamp, block.timestamp, 1);
    }

    function setPrice(int256 _price) external {
        price = _price;
    }
}