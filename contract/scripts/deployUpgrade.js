const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await ethers.getSigners();
    const participationFee = 10;

    const proxyAddress = fs.readFileSync("ProxyContractAddress.txt", 'utf8');
    console.log(proxyAddress);

    console.log("Deploying contracts with the account:", deployer.address);
  
    const LotteryV2 = await ethers.getContractFactory("LotteryV2");
    const lottery = await upgrades.upgradeProxy(proxyAddress, LotteryV2);
    
    console.log("Address of Proxy contract:", lottery.target);
    //console.log("Address of Implementation contract (actual Loterry): ", await upgrades.erc1967.getImplementationAddress(lottery.target));
    //console.log("Address of ProxyAdmin contract: ", await upgrades.erc1967.getAdminAddress(lottery.target));

    
  }
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  