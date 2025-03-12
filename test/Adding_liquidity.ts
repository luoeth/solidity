import deployer from '../.secret';
import { BigNumber, ethers } from 'ethers';
import { Percent, CurrencyAmount, Token } from '@uniswap/sdk-core';
import { Pool, Position, nearestUsableTick, NonfungiblePositionManager, AddLiquidityOptions, computePoolAddress } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';

// 常量定義
const POOL_FEE = 500;
const CHAIN_ID = 84532;
const PROVIDER_URL = "https://sepolia.base.org";
const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2";
const POOL_FACTORY_ADDRESS = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";
const MAX_FEE_PER_GAS = '300000';
const MAX_PRIORITY_FEE_PER_GAS = '300000';

// ABI 定義
const NONFUNGIBLE_POSITION_MANAGER_ABI = [/* ... ABI content ... */];
const ERC20_ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi;
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;

// Token 配置
const token0 = new Token(CHAIN_ID, "0x788EFfd91D0d6323d185233A2623DF6282cB409F", 18, 'TKN0', 'Token0');
const token1 = new Token(CHAIN_ID, "0x4084aA276Cf072C945A5a9803e1395f5B1098D0f", 18, 'TKN1', 'Token1');

// 初始化 Provider 和 Signer
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const signer = new ethers.Wallet(deployer.private, provider);

// 計算當前池地址
const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_ADDRESS,
    tokenA: token0,
    tokenB: token1,
    fee: POOL_FEE,
});

enum TransactionState {
    Failed = 'Failed',
    New = 'New',
    Rejected = 'Rejected',
    Sending = 'Sending',
    Sent = 'Sent',
}

interface PoolInfo {
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
    sqrtPriceX96: ethers.BigNumber;
    liquidity: ethers.BigNumber;
    tick: number;
}

/**
 * 批准代幣轉移給位置管理合約
 * @param tokenAddress 代幣地址
 * @param amount 批准金額
 */
async function approveToken(tokenAddress: string, amount: BigNumber): Promise<void> {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await tokenContract.approve(NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amount);
    console.log(`Approving ${tokenAddress}...`);
    await tx.wait();
    console.log(`Approval for ${tokenAddress} completed`);
}

/**
 * 獲取池信息
 * @returns 池的當前狀態信息
 */
async function getPoolInfo(): Promise<PoolInfo> {
    const poolContract = new ethers.Contract(currentPoolAddress, IUniswapV3PoolABI, provider);
    
    const [token0, token1, fee, tickSpacing, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ]);

    return { token0, token1, fee, tickSpacing, liquidity, sqrtPriceX96: slot0[0], tick: slot0[1] };
}

/**
 * 將可讀金額轉換為 JSBI 格式
 * @param amount 可讀金額
 * @param decimals 代幣小數位
 */
function fromReadableAmount(amount: number, decimals: number): JSBI {
    const extraDigits = Math.pow(10, amount.toString().split('.')[1]?.length || 0);
    const adjustedAmount = amount * extraDigits;
    return JSBI.divide(
        JSBI.multiply(
            JSBI.BigInt(adjustedAmount),
            JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
        ),
        JSBI.BigInt(extraDigits)
    );
}

/**
 * 構建 Uniswap V3 位置
 * @param token0Amount Token0 數量
 * @param token1Amount Token1 數量
 * @param priceRange 可選的價格範圍
 */
async function constructPosition(
    token0Amount: CurrencyAmount<Token>,
    token1Amount: CurrencyAmount<Token>,
    priceRange?: { lowerTick: number; upperTick: number }
): Promise<Position> {
    const poolInfo = await getPoolInfo();
    
    const pool = new Pool(
        token0Amount.currency,
        token1Amount.currency,
        poolInfo.fee,
        poolInfo.sqrtPriceX96.toString(),
        poolInfo.liquidity.toString(),
        poolInfo.tick
    );

    const tickLower = priceRange
        ? nearestUsableTick(priceRange.lowerTick, poolInfo.tickSpacing)
        : nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) - poolInfo.tickSpacing * 2;
    
    const tickUpper = priceRange
        ? nearestUsableTick(priceRange.upperTick, poolInfo.tickSpacing)
        : nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) + poolInfo.tickSpacing * 2;

    return Position.fromAmounts({
        pool,
        tickLower,
        tickUpper,
        amount0: token0Amount.quotient,
        amount1: token1Amount.quotient,
        useFullPrecision: true,
    });
}

/**
 * 獲取用戶的所有位置 ID
 * @returns 位置 ID 數組
 */
async function getPositionIds(): Promise<number[]> {
    const positionContract = new ethers.Contract(
        NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        NONFUNGIBLE_POSITION_MANAGER_ABI,
        provider
    );
    
    const balance: number = await positionContract.balanceOf(deployer.address);
    const tokenIds: number[] = [];
    
    for (let i = 0; i < balance; i++) {
        const tokenId = await positionContract.tokenOfOwnerByIndex(deployer.address, i);
        tokenIds.push(tokenId);
    }
    
    return tokenIds;
}

/**
 * 增加指定位置的流動性
 * @param positionId 位置 ID
 */
async function addLiquidity(positionId: number): Promise<TransactionState> {
    const positionToIncrease = await constructPosition(
        CurrencyAmount.fromRawAmount(token0, fromReadableAmount(1000000, token0.decimals)),
        CurrencyAmount.fromRawAmount(token1, fromReadableAmount(10000000, token1.decimals))
    );

    const addLiquidityOptions: AddLiquidityOptions = {
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        slippageTolerance: new Percent(5000, 10_000),
        tokenId: positionId,
    };

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
        positionToIncrease,
        addLiquidityOptions
    );

    const transaction = {
        data: calldata,
        to: NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        value,
        from: deployer.address,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        gasLimit: 1000000,
    };

    try {
        const tx = await signer.sendTransaction(transaction);
        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        
        console.log(receipt.status === 1 
            ? "Transaction successful:" 
            : "Transaction failed:", receipt);
            
        return TransactionState.Sent;
    } catch (error) {
        console.error("Add liquidity failed:", error);
        return TransactionState.Failed;
    }
}

/**
 * 主執行函數
 */
async function main() {
    try {
        // 批准代幣
        await Promise.all([
            approveToken(token0.address, ethers.utils.parseUnits("500000000", 18)),
            approveToken(token1.address, ethers.utils.parseUnits("500000000", 18))
        ]);

        // 獲取位置 ID
        const tokenIds = await getPositionIds();
        console.log("Position IDs fetched:", tokenIds);

        // 增加流動性（使用第3個位置作為示例）
        if (tokenIds.length > 2) {
            await addLiquidity(tokenIds[2]);
        } else {
            console.log("Not enough positions available");
        }
    } catch (error) {
        console.error("Error in main execution:", error);
    }
}

main();