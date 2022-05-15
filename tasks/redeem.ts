/* eslint-disable prettier/prettier */
/* eslint-disable node/no-unpublished-import */
/* eslint-disable node/no-extraneous-import */
import * as dotenv from "dotenv";

import { task } from "hardhat/config"
import { Contract } from "ethers";
import "@nomiclabs/hardhat-waffle";

dotenv.config();

task("redeem", "Redeem tokens")
  .addParam("token", "Address of token to recieve")
  .addParam("amount", "Amount of tokens")
  .addParam("signature", "Signature from API")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const contractAddr = process.env.CONTRACT_ADDRESS_BRIDGE;

    const BridgeContract = <Contract>await hre.ethers.getContractAt(
      "JediBridge",
      contractAddr as string,
      signer
    );

    const result = await BridgeContract.redeem(taskArgs.token, taskArgs.amount, taskArgs.signature);

    console.log(result);
  });
