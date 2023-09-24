const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe,
        fundMeAddress,
        deployer,
        mockV3Aggregator,
        mockV3AggregatorAddress
      const sendValue = ethers.parseEther("1")

      beforeEach(async () => {
        //deploy fundme contract using hardhat deploy
        deployer = (await getNamedAccounts()).deployer

        // will give whatever accounts available in accounts section in testnet available in hardhat.config.js and for localhost or hardhat network it gives 10 accounts
        // const accounts = await ethers.getSigners()
        // const accountsZero = accounts[0]

        ////fixture allow to run entire deploy folder with as many tags as we want
        await deployments.fixture(["all"])

        // hardhat deploy wraps ethers with getContract() -> will get the most recent deployment of whatever contract we tell it
        //deployer is connected to FundMe contract
        fundMeAddress = (await deployments.get("FundMe")).address
        mockV3AggregatorAddress = (await deployments.get("MockV3Aggregator"))
          .address

        // fundMe = await ethers.getContract("FundMe", deployer)
        fundMe = await ethers.getContractAt("FundMe", fundMeAddress)

        // mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          mockV3AggregatorAddress
        )
      })

      describe("Constructor", async () => {
        it("sets the aggregator address correctly", async () => {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.target)
        })
      })

      describe("Fund", async () => {
        it("fails if your don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.reverted
        })
        it("updated the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async () => {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("Withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraw ETH from a single founder", async () => {
          //Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          //Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          //gasCost gasPrice gasUsed
          const { gasPrice, gasUsed } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          //Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          )
        })

        it("allows us to withdraw with multiple funders", async () => {
          // Arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(
              accounts[i].address
            )
            fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          //Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingDeployerBalance + startingFundMeBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          )

          // Make sure funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("Only allows owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
        })

        it("cheaperWithdraw testing...", async () => {
          // Arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(
              accounts[i].address
            )
            fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, gasPrice } = transactionReceipt
          const gasCost = gasUsed * gasPrice

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMeAddress
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )
          //Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            (startingDeployerBalance + startingFundMeBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          )

          // Make sure funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
