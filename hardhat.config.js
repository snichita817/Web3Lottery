require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require('@openzeppelin/hardhat-upgrades');

//const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;
const PRIVATE_KEY1 = vars.get("GET_PK1");
const PRIVATE_KEY2 = vars.get("GET_PK2");

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`]
    }
  }
};
