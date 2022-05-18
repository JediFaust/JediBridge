/* eslint-disable prettier/prettier */
/* eslint-disable node/no-unpublished-import */
/* eslint-disable node/no-extraneous-import */
import * as dotenv from "dotenv";

import { task } from "hardhat/config"
import { Contract } from "ethers";
import "@nomiclabs/hardhat-waffle";

dotenv.config();

task("swap", "Swap tokens")
  .addParam("to", "Address of the receiver")
  .addParam("token", "Address of the token to swap")
  .addParam("amount", "Amount of tokens to swap")
  .addParam("chainId", "Chain ID of the reciever")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const contractAddr = process.env.CONTRACT_ADDRESS_BRIDGE;

    const BridgeContract = <Contract>await hre.ethers.getContractAt(
      "JediBridge",
      contractAddr as string,
      signer
    );

    const result = await BridgeContract.swap(taskArgs.to, taskArgs.token, taskArgs.amount, taskArgs.chainId);

    console.log(result);
  });
