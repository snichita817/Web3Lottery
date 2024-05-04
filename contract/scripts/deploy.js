const { ethers, upgrades } = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await ethers.getSigners();
    const participationFee = 10;


    console.log("Deploying contracts with the account:", deployer.address);
  
    const Lottery = await ethers.getContractFactory("Lottery");
    //const lottery = await Lottery.connect(deployer).deploy();
    //await lottery.waitForDeployment();
    const lottery = await upgrades.deployProxy(Lottery, [participationFee], { initializer: 'initialize' });
    
    console.log("Address of Proxy contract:", lottery.target);
    // console.log("Address of Implementation contract (actual Loterry): ", await lottery.implementation.target);
    // console.log("Address of ProxyAdmin contract: ", await upgrades.erc1967.getAdminAddress(lottery.target));

    fs.writeFileSync("ProxyContractAddress.txt", (lottery.target).toString(), (err) =>{
      if (err) throw err;
    });

    fs.writeFileSync("./../web/public/ProxyContractAddress.txt", (lottery.target).toString(), (err) =>{
      if (err) throw err;
    });
  }
  
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  