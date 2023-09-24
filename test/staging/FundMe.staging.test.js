const { ethers, deployments, network, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe, deployer, fundMeAddress

      const sendValue = ethers.parseEther("1")

      beforeEach(async () => {
        fundMeAddress = (await deployments.get("FundMe")).address
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress)
      })

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw()

        const endingBalance = await ethers.provider.getBalance(fundMeAddress)
        assert.equal(endingBalance.toString(), "0")
      })
    })
