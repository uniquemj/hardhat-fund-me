// function deployFunc(){
//     console.log("Hello")
// }

// module.exports.default = deployFunc

//{getNamedAccounts, deployments} = hre

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  //This will be more flexible in between chainId of network and price feed in those network
  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]

  //Concept of Mock Contract :-> If the contract doesn't exist, we deploy a minimal version of for our local testing
  //For our local testing
  let ethUsdPriceFeedAddress
  if (chainId == 31337) {
    ethUsdPriceAggregator = await deployments.get("MockV3Aggregator")
    ethUsdPriceFeedAddress = ethUsdPriceAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    console.log("PriceValue : ", ethUsdPriceFeedAddress)
  }

  //well what happens when we want to change chains?
  //When going for localhost or hardhat network we want to use a mock
  const args = [ethUsdPriceFeedAddress]
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put price feed
    log: true, //customer log console.log
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  console.log("Fund me Address:", fundMe.address)

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    //verify
    await verify(fundMe.address, args)
  }
  log("-----------------------------------")
}
module.exports.tags = ["all", "fundme"]
