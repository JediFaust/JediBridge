
<h1 align="center"><b>JediBridge to swap tokens between blockchains</b></h3>

<div align="left">


[![Language](https://img.shields.io/badge/language-solidity-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

</div>

---

<p align="center"><h2 align="center"><b>Solidity Smart contract for MultiChain JediBridge 
    </h2></b><br> 
</p>

## 📝 Table of Contents

- [EtherScan Link](#etherscan)
- [Installing](#install)
- [Contract Functions](#functions)
- [Deploy & Test Scripts](#scripts)
- [HardHat Tasks](#tasks)

## 🚀 Link on EtherScan <a name = "etherscan"></a>
JediBridge: <br>
https://rinkeby.etherscan.io/address/0xb6BA15f0484a14E6e28974938806500c281C05ff#code<br>




## 🚀 Installing <a name = "install"></a>
- Set validator address on scripts/deploy.ts file
- Deploy four contracts running on console:
```shell
node scripts/deploy.ts
```
- Copy address of deployed contract and paste to .env file as CONTRACT_ADDRESS_BRIDGE
- Use swap and redeem functions




## ⛓️ Contract Functions <a name = "functions"></a>

- **swap()**
>Swap ERC20 tokens to other chain<br>

- **redeem()**
>Recieve swapped tokens<br>

- **includeToken()**
>Add supported ERC20 Token<br>

- **excludeToken()**
>Remove ERC20 Token from supported list<br>

- **updateChainById()**
>Updates state of allowed chain between supported and unsupported<br>








## 🎈 Deploy & Test Scripts <a name = "scripts"></a>

```shell
node scripts/deploy.js
npx hardhat test  --network hardhat
```


## 💡 HardHat Tasks <a name = "tasks"></a>


```shell
npx hardhat swap
npx hardhat redeem
```
```

