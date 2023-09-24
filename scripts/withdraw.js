const { getNamedAccounts, deployments, ethers } = require("hardhat")

const main = async () => {
  const { deployer } = await getNamedAccounts()
  const fundMeAddress = (await deployments.get("FundMe")).address
  const fundMe = await ethers.getContractAt("FundMe", fundMeAddress)

  console.log("Withdrawing Fund . . .")
  const transactionResponse = await fundMe.withdraw()
  await transactionResponse.wait(1)
  console.log("Fund Withdrawed !!")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
