import { Percent, Token, BigintIsh } from '@uniswap/sdk-core';
import { MintOptions, nearestUsableTick, NonfungiblePositionManager, Pool, Position, computePoolAddress } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import * as dotenv from "dotenv";
dotenv.config();

import { parseUnits, JsonRpcProvider, Wallet, BigNumberish, Contract } from "ethers";

// 載入 ERC20 代幣 ABI，方便進行授權操作
const ERC20_ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi;

// 設定交易的最大手續費
const MAX_FEE_PER_GAS = '3000000';
const MAX_PRIORITY_FEE_PER_GAS = '3000000';

// Uniswap V3 NFT 流動性管理合約地址
const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2';
// Uniswap V3 流動性池工廠地址
const POOL_FACTORY_CONTRACT_ADDRESS = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';

// 設定授權的最大金額（3000 顆代幣）
const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = parseUnits("3000", 18);

// 設定流動性池手續費（0.3%）
const poolFee = 3000;

// 設定 JSON-RPC 提供者（連線到 Base Sepolia 測試網）
const provider = new JsonRpcProvider("https://sepolia.base.org");

// 設定私鑰簽署者
const signer = new Wallet(process.env.PRIVATE_KEY!, provider);

// 定義兩個代幣的基本資訊
const token0 = new Token(84532, '0x788EFfd91D0d6323d185233A2623DF6282cB409F', 18, 'token0', 'Token 0');
const token1 = new Token(84532, '0x4084aA276Cf072C945A5a9803e1395f5B1098D0f', 18, 'token1', 'Token 1');

/**
 * 取得代幣授權
 * @param address 代幣合約地址
 * @param amount 授權金額
 */
async function getTokenTransferApproval(address: string, amount: BigNumberish) {
  const tokenContract = new Contract(address, ERC20_ABI, signer);
  return tokenContract.approve(NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS, amount);
}

/**
 * 授權兩個代幣
 */
async function approveTokens() {
  console.log('Approving token0...');
  await (await getTokenTransferApproval(token0.address, TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER)).wait();
  
  console.log('Approving token1...');
  await (await getTokenTransferApproval(token1.address, TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER)).wait();

  console.log('Approve token DONE');
}


async function mint_position() {
  // 計算 Uniswap V3 流動性池地址
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: token0,
    tokenB: token1,
    fee: poolFee,
  });
  console.log('Pool Address:', currentPoolAddress);

  // 創建流動性池合約實例
  const poolContract = new Contract(currentPoolAddress, require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi, signer);

  // 讀取流動性池當前資訊
  const [liquidity, slot0] = await Promise.all([poolContract.liquidity(), poolContract.slot0()]);

  // 如果池尚未初始化，設定初始價格
  if (!slot0.unlocked) {
    const sqrtPriceX96 = BigInt(1 * (2 ** 96)); // 1:1 的價格比率
    await poolContract.initialize(sqrtPriceX96.toString());
    console.log('池初始化完成');
  }

  // 配置流動性池
  const configuredPool = new Pool(
    token0,
    token1,
    poolFee,
    slot0.sqrtPriceX96.toString(), 
    liquidity.toString(),     
    Number(slot0.tick)      
  );

  // 設定提供的流動性數量
  const amount0: BigintIsh = JSBI.BigInt(parseUnits("3000", 18).toString());
  const amount1: BigintIsh = JSBI.BigInt(parseUnits("3000", 18).toString());
  
  // 建立流動性倉位
  const position = Position.fromAmounts({
    pool: configuredPool,
    tickLower: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) - configuredPool.tickSpacing * 2,
    tickUpper: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing * 2,
    amount0: amount0,
    amount1: amount1,
    useFullPrecision: true,
  });

  // 設定交易選項
  const mintOptions: MintOptions = {
    recipient: process.env.ADDRESS!,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 設定交易期限 20 分鐘
    slippageTolerance: new Percent(50, 10_000), // 允許 0.5% 滑點
  };

  // 生成交易資料
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions);
 
  // 發送交易
  const txRes = await signer.sendTransaction({
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: process.env.ADDRESS!,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  });

  console.log('Transaction sent:', txRes.hash);
  const receipt = await txRes.wait();
  console.log(receipt.status === 1 ? 'Transaction successful' : 'Transaction failed', receipt);
}

/**
 * 主函數執行順序
 */
async function main() {
  try {
    await approveTokens();
    await mint_position();
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// 執行主函數
main();
