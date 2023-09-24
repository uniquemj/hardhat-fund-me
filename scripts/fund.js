const { getNamedAccounts, deployments, ethers } = require("hardhat")

const main = async () => {
  const { deployer } = await getNamedAccounts()
  const fundMeAddress = (await deployments.get("FundMe")).address
  const fundMe = await ethers.getContractAt("FundMe", fundMeAddress)

  console.log("Funding Contract . . .")
  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("0.1"),
  })
  await transactionResponse.wait(1)
  console.log("Funded!!")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
