//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
  function getPrice(
    AggregatorV3Interface priceFeed
  ) internal view returns (uint256) {
    //Address : 0x694AA1769357215DE4FAC081bf1f309aDC325306
    (, int price, , , ) = priceFeed.latestRoundData();

    return uint256(price * 1e10);
  }

  function getConversionRate(
    uint256 ethAmount,
    AggregatorV3Interface priceFeed
  ) internal view returns (uint256) {
    uint256 ethPrice = getPrice(priceFeed);
    uint256 ethAmountInUsd = (ethAmount * ethPrice) / 1e18;
    return ethAmountInUsd;
  }
}
