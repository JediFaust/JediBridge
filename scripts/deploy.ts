/* eslint-disable prefer-const */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  let jediBridge: Contract;
  let jedi20: Contract;

  const Jedi20 = await ethers.getContractFactory("ERC20MintableBurnable");
  jedi20 = <Contract>await Jedi20.deploy("JDT", "JediToken", 10000000, 1);

  await jedi20.deployed();

  console.log("Jedi20 deployed to:", jedi20.address);

  const JediBridge = await ethers.getContractFactory("JediBridge");
  jediBridge = <Contract>await JediBridge.deploy();

  await jediBridge.deployed();

  console.log("JediBridge deployed to:", jediBridge.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
