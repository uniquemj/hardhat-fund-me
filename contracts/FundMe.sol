//SPDX-License-Identifier: MIT
//Pragma
pragma solidity ^0.8.8;

//Imports
import {PriceConverter} from "./PriceConverter.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//Error Codes
error FundMe__NotOwner();

//Interfaces, Libraries: not imported ones, Contracts.

/** @title A contract for crowd funding
 * @author Unique Maharjan
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as library
 */
contract FundMe {
  //Type declarations

  using PriceConverter for uint256;

  //State variables!
  uint256 public constant MINIMUM_USD = 50 * 1e18;
  address private immutable i_owner;
  address[] private s_funders;
  mapping(address => uint256) private s_addressToAmountFunded;

  AggregatorV3Interface private s_priceFeed;

  // Modifiers
  modifier onlyOwner() {
    // require(msg.sender == i_owner,"Sender is not owner!");
    if (msg.sender != i_owner) {
      revert FundMe__NotOwner();
    }
    _;
  }

  //Functions Order:
  /// constructor
  /// receive
  /// fallback
  /// external
  /// public
  /// internal
  /// private
  /// view/ pure

  constructor(address priceFeedAddress) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  /**
   * @notice This function funds this contract
   */
  function fund() public payable {
    require(
      msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
      "Didn't send enough Amount"
    );
    s_funders.push(msg.sender);
    s_addressToAmountFunded[msg.sender] += msg.value;
  }

  function withdraw() public onlyOwner {
    for (
      uint256 funderIndex = 0;
      funderIndex < s_funders.length;
      funderIndex++
    ) {
      address funder = s_funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }

    s_funders = new address[](0);

    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }("");
    require(callSuccess, "Call failed");
  }

  function cheaperWithdraw() public payable onlyOwner {
    address[] memory funders = s_funders;
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
    (bool success, ) = i_owner.call{value: address(this).balance}("");
    require(success, "Call failed");
  }

  //view function
  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getFunder(uint256 index) public view returns (address) {
    return s_funders[index];
  }

  function getAddressToAmountFunded(
    address funder
  ) public view returns (uint256) {
    return s_addressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}
