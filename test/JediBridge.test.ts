/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("JediBridge", function () {
  let validator: SignerWithAddress;
  let userOne: SignerWithAddress;
  let userTwo: SignerWithAddress;
  let userThree: SignerWithAddress;
  let jediBridge: Contract;
  let jediBridgeBsc: Contract;
  let jedi20: Contract;
  let jedi20bsc: Contract;

  beforeEach(async function () {
    // Get the signers
    [validator, userOne, userTwo, userThree] = await ethers.getSigners();

    // Deploy ERC20BurnableMintable token on ETH
    const testERC20 = await ethers.getContractFactory("ERC20MintableBurnable");
    jedi20 = <Contract>await testERC20.deploy("JDT", "JediToken", 10000000, 1);
    await jedi20.deployed();

    // Deploy ERC20BurnableMintable token on BSC
    const testERC20BSC = await ethers.getContractFactory(
      "ERC20MintableBurnable"
    );
    jedi20bsc = <Contract>(
      await testERC20BSC.deploy("JDT", "JediToken", 10000000, 1)
    );
    await jedi20bsc.deployed();

    // Deploy the JediBridge with validator
    const testBridge = await ethers.getContractFactory("JediBridge");
    jediBridge = <Contract>await testBridge.deploy(validator.address);
    await jediBridge.deployed();

    const testBridgeBsc = await ethers.getContractFactory("JediBridge");
    jediBridgeBsc = <Contract>await testBridgeBsc.deploy(validator.address);
    await jediBridgeBsc.deployed();

    // Set Bridge as minter and burner on both chains
    await jedi20.setMinterBurner(jediBridge.address);
    await jedi20.setMinterBurner(validator.address);

    await jedi20bsc.setMinterBurner(jediBridgeBsc.address);
    await jedi20bsc.setMinterBurner(validator.address);
  });

  it("should be deployed", async function () {
    expect(jedi20.address).to.be.properAddress;
    expect(jedi20bsc.address).to.be.properAddress;
    expect(jediBridge.address).to.be.properAddress;
    expect(jediBridgeBsc.address).to.be.properAddress;
  });

  it("should not be able to add tokens and chains when not owner", async function () {
    expect(
      jediBridge.connect(userOne).includeToken(jedi20.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(jediBridge.connect(userOne).updateChainById(1)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    expect(
      jediBridgeBsc.connect(userOne).includeToken(jedi20.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(
      jediBridgeBsc.connect(userOne).updateChainById(1)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should be able to swap and redeem", async function () {
    await jediBridge.includeToken(jedi20.address);
    await jediBridgeBsc.includeToken(jedi20bsc.address);

    await jediBridge.updateChainById(1);
    await jediBridge.updateChainById(56);
    await jediBridgeBsc.updateChainById(1);
    await jediBridgeBsc.updateChainById(56);
    await jediBridgeBsc.updateChainById(31337);

    await jedi20.mint(userOne.address, 100);
    expect(await jedi20.balanceOf(userOne.address)).to.eq(100);

    expect(
      await jediBridge
        .connect(userOne)
        .swap(userTwo.address, 100, jedi20.address, 56)
    )
      .to.emit(jediBridge, "swapInitialized")
      .withArgs(userOne.address, userTwo.address, 100, 56);
    expect(await jedi20.balanceOf(userOne.address)).to.eq(0);

    // generate signature on Backend API
    const message = ethers.utils.solidityKeccak256(
      ["address", "uint256"],
      [userTwo.address, 100]
    );
    const signature = await validator.signMessage(
      ethers.utils.arrayify(message)
    );

    await jediBridgeBsc
      .connect(userTwo)
      .redeem(jedi20bsc.address, 100, signature);

    expect(await jedi20bsc.balanceOf(userTwo.address)).to.eq(100);
  });

  // it("should be able to list and cancel", async function () {
  //   await jediBridge
  //     .connect(userOne)
  //     .createItem("Qma8z6G3c1gsKUcfv8JqoEtFMsrq5hBuESp3EiB8juXiS9");

  //   expect(await jedi721.balanceOf(userOne.address)).to.eq(1);

  //   await jedi721.connect(userOne).approve(jediBridge.address, 0);
  //   await jediBridge.connect(userOne).listItem(0, 10);

  //   expect(await jedi721.balanceOf(userOne.address)).to.eq(0);

  //   await jediBridge.connect(userOne).cancel(0);

  //   expect(await jedi721.balanceOf(userOne.address)).to.eq(1);
  // });

  // it("should be able to list on auction and cancel", async function () {
  //   await jediBridge
  //     .connect(userOne)
  //     .createItem("Qma8z6G3c1gsKUcfv8JqoEtFMsrq5hBuESp3EiB8juXiS9");

  //   expect(await jedi721.balanceOf(userOne.address)).to.eq(1);

  //   await jedi721.connect(userOne).approve(jediBridge.address, 0);
  //   await jediBridge.connect(userOne).listItemOnAuction(0, 10000);

  //   expect(await jedi721.balanceOf(userOne.address)).to.eq(0);

  //   await jedi20.mint(userOne.address, 11000);
  //   await jedi20.connect(userOne).approve(jediBridge.address, 11000);
  //   await jediBridge.connect(userOne).makeBid(0, 11000);

  //   expect(await jedi20.balanceOf(userOne.address)).to.eq(0);
  //   expect(await jedi20.balanceOf(jediBridge.address)).to.eq(11000);

  //   await jedi20.mint(userTwo.address, 15000);
  //   await jedi20.connect(userTwo).approve(jediBridge.address, 15000);
  //   await jediBridge.connect(userTwo).makeBid(0, 15000);

  //   expect(await jedi20.balanceOf(userTwo.address)).to.eq(0);
  //   expect(await jedi20.balanceOf(userOne.address)).to.eq(11000);
  //   expect(await jedi20.balanceOf(jediBridge.address)).to.eq(15000);

  //   await jediBridge.backDate(0);

  //   expect(jediBridge.connect(userOne).finishAuction(0)).to.be.revertedWith(
  //     "Bids less than 2"
  //   );

  //   await jediBridge.connect(userOne).cancelAuction(0);

  //   expect(await jedi20.balanceOf(userTwo.address)).to.eq(15000);
  //   expect(await jedi721.balanceOf(userOne.address)).to.eq(1);
  // });

  // it("should be able to list and not finish early", async function () {
  //   await jediBridge
  //     .connect(userOne)
  //     .createItem("Qma8z6G3c1gsKUcfv8JqoEtFMsrq5hBuESp3EiB8juXiS9");

  //   await jedi721.connect(userOne).approve(jediBridge.address, 0);
  //   await jediBridge.connect(userOne).listItemOnAuction(0, 10000);

  //   expect(await jedi721.balanceOf(userOne.address)).to.eq(0);

  //   await jedi20.mint(userOne.address, 11000);
  //   await jedi20.connect(userOne).approve(jediBridge.address, 11000);
  //   await jediBridge.connect(userOne).makeBid(0, 11000);

  //   expect(await jedi20.balanceOf(userOne.address)).to.eq(0);
  //   expect(await jedi20.balanceOf(jediBridge.address)).to.eq(11000);

  //   await jedi20.mint(userTwo.address, 15000);
  //   await jedi20.connect(userTwo).approve(jediBridge.address, 15000);
  //   await jediBridge.connect(userTwo).makeBid(0, 15000);

  //   expect(await jedi20.balanceOf(userTwo.address)).to.eq(0);
  //   expect(await jedi20.balanceOf(userOne.address)).to.eq(11000);
  //   expect(await jedi20.balanceOf(jediBridge.address)).to.eq(15000);

  //   expect(jediBridge.connect(userOne).finishAuction(0)).to.be.revertedWith(
  //     "Auction not finished"
  //   );
  //   expect(jediBridge.connect(userTwo).finishAuction(0)).to.be.revertedWith(
  //     "You are not owner"
  //   );
  // });

  // it("should be able to list and finish correct", async function () {
  //   await jediBridge
  //     .connect(userOne)
  //     .createItem("Qma8z6G3c1gsKUcfv8JqoEtFMsrq5hBuESp3EiB8juXiS9");

  //   await jedi721.connect(userOne).approve(jediBridge.address, 0);
  //   await jediBridge.connect(userOne).listItemOnAuction(0, 10000);

  //   await jedi20.mint(userOne.address, 11000);
  //   await jedi20.connect(userOne).approve(jediBridge.address, 11000);
  //   await jediBridge.connect(userOne).makeBid(0, 11000);

  //   await jedi20.mint(userTwo.address, 15000);
  //   await jedi20.connect(userTwo).approve(jediBridge.address, 15000);
  //   await jediBridge.connect(userTwo).makeBid(0, 15000);

  //   await jedi20.mint(userThree.address, 20000);
  //   await jedi20.connect(userThree).approve(jediBridge.address, 20000);
  //   await jediBridge.connect(userThree).makeBid(0, 20000);

  //   await jediBridge.backDate(0);

  //   expect(jediBridge.connect(userOne).cancelAuction(0)).to.be.revertedWith(
  //     "Bids more than 2"
  //   );

  //   expect(await jedi721.balanceOf(userThree.address)).to.eq(0);
  //   expect(await jedi721.balanceOf(jediBridge.address)).to.eq(1);

  //   await jediBridge.connect(userOne).finishAuction(0);

  //   expect(await jedi721.balanceOf(userThree.address)).to.eq(1);
  //   expect(await jedi721.balanceOf(jediBridge.address)).to.eq(0);
  //   expect(await jedi20.balanceOf(userOne.address)).to.eq(11000 + 20000);
  // });
});
