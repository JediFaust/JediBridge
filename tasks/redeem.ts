/* eslint-disable prettier/prettier */
/* eslint-disable node/no-unpublished-import */
/* eslint-disable node/no-extraneous-import */
import * as dotenv from "dotenv";

import { task } from "hardhat/config"
import { Contract } from "ethers";
import "@nomiclabs/hardhat-waffle";

dotenv.config();

task("redeem", "Redeem tokens")
  .addParam("from", "Address of sender")
  .addParam("token", "Address of token to recieve")
  .addParam("amount", "Amount of tokens")
  .addParam("nonce", "Nonce value")
  .addParam("fromChainId", "ChainId of sender blockchain")
  .addParam("v", "Part of signature")
  .addParam("r", "Part of signature")
  .addParam("s", "Part of signature")
  .setAction(async (taskArgs, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const contractAddr = process.env.CONTRACT_ADDRESS_BRIDGE;

    const BridgeContract = <Contract>await hre.ethers.getContractAt(
      "JediBridge",
      contractAddr as string,
      signer
    );

    const result = await BridgeContract.redeem(
      taskArgs.from, taskArgs.token, taskArgs.amount,
      taskArgs.nonce, taskArgs.fromChainId, taskArgs.v,
      taskArgs.r, taskArgs.s);

    console.log(result);
  });
