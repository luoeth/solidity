// filepath: /c:/Users/Luo/Desktop/solidity/test/create_pool.ts
import { ethers } from "hardhat";
import { abi as UniswapV3FactoryABI } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Using account:", deployer.address);

    // Uniswap V3 Factory 合约地址
    const uniswapV3FactoryAddress = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24'; 

    // Token1 和 Token2 的合约地址 
    const token1Address = '0x788EFfd91D0d6323d185233A2623DF6282cB409F'; // Token1 地址
    const token2Address = '0x4084aA276Cf072C945A5a9803e1395f5B1098D0f'; // Token2 地址

    // 設定手續費等級 (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
    const fee = 10000;

    // 取得並連接到 Uniswap V3 Factory 合約
    const uniswapV3Factory = new ethers.Contract(uniswapV3FactoryAddress, UniswapV3FactoryABI, deployer);

    // 創建 Pool
    try {
        const gasEstimate = await uniswapV3Factory.createPool.estimateGas(token1Address, token2Address, fee);
        const tx = await uniswapV3Factory.createPool(token1Address, token2Address, fee, {
            gasLimit: gasEstimate.add(ethers.BigNumber.from("100000"))  // 在估算的基础上加一些缓冲
        });
        await tx.wait();
        const poolAddress = await uniswapV3Factory.getPool(token1Address, token2Address, fee);
        console.log("Pool created successfully! Pool Address:", poolAddress);
    } catch (error) {
        console.error("Error creating pool:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });