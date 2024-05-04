const { ethers } = require("hardhat");
const fs = require('fs');

async function interact() {
    [owner, user1] = await ethers.getSigners();

    let deployedTokenAddress = fs.readFileSync("ProxyContractAddress.txt", 'utf8');
    let contract = await ethers.getContractAt("LotteryV2", deployedTokenAddress)

    // Call some methods from the token
    // await contract.initialize(1);
    // console.log("ajuns");

    let price = await contract.getPrice();
    console.log("price: ", price);
}

interact()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });