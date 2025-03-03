import { Percent, Token, BigintIsh } from '@uniswap/sdk-core';
import { MintOptions, nearestUsableTick, NonfungiblePositionManager, Pool, Position, computePoolAddress } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import * as dotenv from "dotenv";
dotenv.config();


import { parseUnits, JsonRpcProvider, Wallet, BigNumberish, Contract } from "ethers";



// 設定變數
const ERC20_ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi;
const MAX_FEE_PER_GAS = '3000000';
const MAX_PRIORITY_FEE_PER_GAS = '3000000';
const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2';
const POOL_FACTORY_CONTRACT_ADDRESS = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';
const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = parseUnits("3000", 18);
const poolFee = 3000;
const provider = new JsonRpcProvider("https://sepolia.base.org");
const signer = new Wallet(process.env.PRIVATE_KEY!, provider);

// 定義代幣
const token0 = new Token(84532, '0x788EFfd91D0d6323d185233A2623DF6282cB409F', 18, 'token0', 'Token 0');
const token1 = new Token(84532, '0x4084aA276Cf072C945A5a9803e1395f5B1098D0f', 18, 'token1', 'Token 1');

/**
 * 取得代幣授權
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

/**
 * 初始化池並添加流動性
 */
async function mint_position() {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: token0,
    tokenB: token1,
    fee: poolFee,
  });
  console.log('Pool Address:', currentPoolAddress);

  const poolContract = new Contract(currentPoolAddress, require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi, signer);

  const [liquidity, slot0] = await Promise.all([poolContract.liquidity(), poolContract.slot0()]);

  
  if (!slot0.unlocked) {
    const sqrtPriceX96 = BigInt(1 * (2 ** 96)); // 1:1 的價格比率
    await poolContract.initialize(sqrtPriceX96.toString());
    console.log('池初始化完成');
  }


  const configuredPool = new Pool(
    token0,
    token1,
    poolFee,
    slot0.sqrtPriceX96.toString(), 
    liquidity.toString(),     
    Number(slot0.tick)      
  );


const amount0: BigintIsh = JSBI.BigInt(parseUnits("3000", 18).toString());
const amount1: BigintIsh = JSBI.BigInt(parseUnits("3000", 18).toString());
  

  const position = Position.fromAmounts({
    pool: configuredPool,
    tickLower: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) - configuredPool.tickSpacing * 2,
    tickUpper: nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing * 2,
    amount0: amount0,
    amount1: amount1,
    useFullPrecision: true,
  });


  const mintOptions: MintOptions = {
    recipient: process.env.ADDRESS!,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  };
  console.log('mintOptions',mintOptions);

  

  const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions);
  console.log('calldata',calldata);
  console.log('value',value);
  exit

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
    // await approveTokens();
    await mint_position();
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// 執行主函數
main();
