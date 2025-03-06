import { BigintIsh, Percent, SUPPORTED_CHAINS, Token, ChainId  } from '@uniswap/sdk-core'
import { MintOptions, nearestUsableTick, NonfungiblePositionManager, Pool, Position, computePoolAddress, FeeAmount } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { parseUnits, JsonRpcProvider, Wallet, BigNumberish, Contract, ethers } from "ethers";
import { exit } from 'process'
import * as dotenv from "dotenv";
dotenv.config();

const ERC20_ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi;
const NONFUNGIBLE_POSITION_MANAGER_ABI = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json').abi;
const IUniswapV3PoolABI = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json').abi;


const provider = new JsonRpcProvider("https://sepolia.base.org");
// 設定私鑰簽署者
const signer = new Wallet(process.env.PRIVATE_KEY!, provider);

const poolFee = 500
const MAX_FEE_PER_GAS = '300000'
const MAX_PRIORITY_FEE_PER_GAS = '300000'
const NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS = "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2";
const POOL_FACTORY_CONTRACT_ADDRESS ='0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';
const token0Address = "0x788EFfd91D0d6323d185233A2623DF6282cB409F";
const token1Address = "0x4084aA276Cf072C945A5a9803e1395f5B1098D0f";

async function getTokenTransferApproval(address: string, amount: BigNumberish) {
    const tokenContract = new ethers.Contract(
        address,
        ERC20_ABI,
        signer
    )
    return tokenContract.approve(
        NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
        amount
    )
  }