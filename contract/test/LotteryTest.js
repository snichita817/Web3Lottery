const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery", function () {
  const participationFee = 20;

  async function deploy_and_setup() {
    const [owner, signer1, signer2, signer3] = await ethers.getSigners();

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await upgrades.deployProxy(Lottery, [participationFee], { initializer: 'initialize' });

    return { lottery, owner, signer1, signer2, signer3};
  }

  
  it("should deploy and set manager correctly", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
    await expect(await lottery.manager()).to.equal(owner.address);
  });

  it("should enter lottery with at least min fee", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
    const amountToSend = ethers.parseEther(ethers.formatEther(participationFee.toString()));
    const contractWithSigner = lottery.connect(signer1);
    const oldBalance = await ethers.provider.getBalance(signer1.address);

    const tx = await contractWithSigner.enterLottery({ value: amountToSend });
    const txReceipt = await tx.wait();
    const gasCost = txReceipt.cumulativeGasUsed * tx.gasPrice;

    await expect(tx)
      .to.emit(lottery, "EnteredLottery") 
      .withArgs(signer1.address, amountToSend);

      const newBalance = await ethers.provider.getBalance(signer1.address);
      await expect(newBalance).to.equal(oldBalance - amountToSend - gasCost);

  });

  it("should be refused to enter lottery with less than min fee", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);

    const amountToSend = ethers.parseEther(ethers.formatEther((participationFee-1).toString()));

    const contractWithSigner = lottery.connect(signer2);

    await expect(contractWithSigner.enterLottery({ value: amountToSend }))
      .to.revertedWith("Minimum ETH not sent.");

  });

  it("should pick winner from more than 3 participants", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
    const signer1Connection = lottery.connect(signer1);
    const signer2Connection = lottery.connect(signer2);
    const signer3Connection = lottery.connect(signer3);
    const amountToSend = ethers.parseEther(ethers.formatEther((participationFee+1).toString()));
    const contractInitBalance = await ethers.provider.getBalance(lottery.target);

    await signer1Connection.enterLottery({ value: amountToSend });
    await signer2Connection.enterLottery({ value: amountToSend });
    await signer3Connection.enterLottery({ value: amountToSend });
    
    const contractBalanceAfterEnter = await ethers.provider.getBalance(lottery.target);
    await expect(contractBalanceAfterEnter).to.equal(contractInitBalance + BigInt(3) * amountToSend)
    
    const ownerConnection = lottery.connect(owner);
    const tx = await ownerConnection.pickWinner();

    await expect(tx).to.emit(lottery, "WinnersPicked");

    const contractFinalBalance = await ethers.provider.getBalance(lottery.target);

    await expect(contractFinalBalance).to.equal(contractBalanceAfterEnter - contractBalanceAfterEnter * BigInt(75) / BigInt(100) - contractBalanceAfterEnter * BigInt(15) / BigInt(100) - contractBalanceAfterEnter * BigInt(10) / BigInt(100));

  });
  it("should refuse to pick winner with less than 3 participants", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
    const signer1Connection = lottery.connect(signer1);
    const signer2Connection = lottery.connect(signer2);
    const amountToSend = ethers.parseEther(ethers.formatEther((participationFee+1).toString()));
    await signer1Connection.enterLottery({ value: amountToSend });
    await signer2Connection.enterLottery({ value: amountToSend });

    const ownerConnection = lottery.connect(owner);
    const tx = ownerConnection.pickWinner();

    await expect(tx).to.be.revertedWith("Not enough participants.");
  });

  it("should refuse to pick winner by smb else than manager", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
    const signer1Connection = lottery.connect(signer1);
    const signer2Connection = lottery.connect(signer2);
    const signer3Connection = lottery.connect(signer3);
    const amountToSend = ethers.parseEther(ethers.formatEther((participationFee+1).toString()));


    await signer1Connection.enterLottery({ value: amountToSend });
    await signer2Connection.enterLottery({ value: amountToSend });
    await signer3Connection.enterLottery({ value: amountToSend });

    const tx = signer1Connection.pickWinner();

    await expect(tx).to.be.revertedWith("Only the manager can call this.");
  });

  it("should be able to withdraw if participant", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
    const signer1Connection = lottery.connect(signer1);
    const amountToSend = ethers.parseEther(ethers.formatEther((participationFee*10).toString()));

    await signer1Connection.enterLottery({ value: amountToSend });
    const balanceAfterEntry = await ethers.provider.getBalance(signer1.address);
    const tx = await signer1Connection.withdrawFromLottery();
    const txReceipt = await tx.wait();
    const gasCost = txReceipt.cumulativeGasUsed * tx.gasPrice;
    const balanceAfterWithdraw = await ethers.provider.getBalance(signer1.address);
    
    const refundValue = amountToSend * BigInt(90) / BigInt(100);
    await expect(tx).to.emit(lottery, "ParticipantWithdrawn").withArgs(signer1.address, refundValue);

    await expect(balanceAfterWithdraw).to.equal(balanceAfterEntry + refundValue - gasCost);
  });

  it("should refuse to withdraw if not participant", async function () {
    const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
    const signer1Connection = lottery.connect(signer1);

    const tx = signer1Connection.withdrawFromLottery();
    await expect(tx).to.be.revertedWith("Not a participant or no funds to withdraw.");
  });

  // it("should not be allowed to enter lottery twice", async function () {
  //   const { lottery, owner, signer1, signer2, signer3 } = await loadFixture(deploy_and_setup);
  //   const amountToSend = ethers.parseEther(ethers.formatEther(participationFee.toString()));
  //   const contractWithSigner = lottery.connect(signer1);

  //   await contractWithSigner.enterLottery({ value: amountToSend });
  //   const tx = contractWithSigner.enterLottery({ value: amountToSend });

  //   await expect(tx).to.be.revertedWith("Participant already exists");
    
  // });
});
