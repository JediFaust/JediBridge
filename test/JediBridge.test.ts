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

    await jediBridge.includeToken(jedi20.address);
    await jediBridge.updateChainById(31337);
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

    const tx = await jediBridge
      .connect(userOne)
      .swap(userTwo.address, 100, jedi20.address, 31337);

    const rc = await tx.wait();
    const event = rc.events.find(
      (event: { event: string }) => event.event === "SwapInitialized"
    );
    const [from, to, token, value, chainFrom, chainTo, nonce] = event.args;

    // Checking event with right args
    expect(from).to.eq(userOne.address);
    expect(to).to.eq(userTwo.address);
    expect(token).to.eq(jedi20.address);
    expect(value).to.eq(100);
    expect(chainTo).to.eq(31337);
    expect(chainFrom).to.eq(31337);
    expect(nonce).to.eq(0);

    // Checking balances after swap
    expect(await jedi20.balanceOf(userOne.address)).to.eq(0);

    // generate signature on Backend API
    const message = ethers.utils.solidityKeccak256(
      [
        "address",
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
      ],
      [
        userOne.address,
        userTwo.address,
        jedi20bsc.address,
        100,
        31337,
        31337,
        0,
      ]
    );

    const signature = await validator.signMessage(
      ethers.utils.arrayify(message)
    );

    const sig = ethers.utils.splitSignature(signature);

    await jediBridgeBsc
      .connect(userTwo)
      .redeem(
        userOne.address,
        jedi20bsc.address,
        100,
        0,
        31337,
        sig.v,
        sig.r,
        sig.s
      );

    // Checking balances after redeem
    expect(await jedi20bsc.balanceOf(userTwo.address)).to.eq(100);
  });
});
