import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // 取得 DualToken 合約
    const DualToken = await ethers.getContractFactory("DualToken");
    
    const initialSupplyToken1 = ethers.parseUnits("5000000", 18);
    const initialSupplyToken2 = ethers.parseUnits("5000000", 18);
    
    // 部署 DualToken 合約
    const dualToken = await DualToken.deploy(initialSupplyToken1, initialSupplyToken2);

    console.log("DualToken contract deployed to:", dualToken.target);
    console.log("Token1 address:", await dualToken.token1());
    console.log("Token2 address:", await dualToken.token2());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
