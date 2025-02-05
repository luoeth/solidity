import { ethers } from "hardhat";
import { utils } from "ethers";


async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 取得 DualToken 合約工廠
    const DualToken = await ethers.getContractFactory("DualToken");
    
    const initialSupplyToken1 = utils.parseUnits("5000000", 18);
    const initialSupplyToken2 = utils.parseUnits("5000000", 18);
    
    // 部署 DualToken 合约
    const dualToken = await DualToken.deploy(initialSupplyToken1, initialSupplyToken2);

    console.log("DualToken contract deployed to:", dualToken.address);
    console.log("Token1 address:", await dualToken.token1());
    console.log("Token2 address:", await dualToken.token2());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
