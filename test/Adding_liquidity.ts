import { BigintIsh, Percent, SUPPORTED_CHAINS, Token, ChainId, CurrencyAmount  } from '@uniswap/sdk-core'
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

// async function getTokenTransferApproval(address: string, amount: BigNumberish) {
//     const tokenContract = new ethers.Contract(
//         address,
//         ERC20_ABI,
//         signer
//     )
//     return tokenContract.approve(
//         NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
//         amount
//     )
//   }


//   async function approveTokens(){
//     const token0Approval = await getTokenTransferApproval(
//       token0Address,
//       parseUnits("500000000", 18)
//     )
//     console.log("Approving token1...");
//     await token0Approval.wait();
    
//   const token1Approval = await getTokenTransferApproval(
//       token1Address,
//       parseUnits("500000000", 18)
//     )
//     console.log("Approving token2...");
//     await token1Approval.wait();
//     console.log("Approve token DONE");
//   }



enum TransactionState {
    Failed = 'Failed',
    New = 'New',
    Rejected = 'Rejected',
    Sending = 'Sending',
    Sent = 'Sent',
  }


async function addLiquidity(positionId: number): Promise<TransactionState> {
    const address = process.env.ADDRESS!
    // const provider = getProvider()
    // if (!address || !provider) {
    //   return TransactionState.Failed
    // }
  
    const positionToIncreaseBy = await await constructPosition(
      CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.token0,
        fromReadableAmount(
          (CurrentConfig.tokens.token0Amount *
            CurrentConfig.tokens.fractionToAdd) /
            100,
          CurrentConfig.tokens.token0.decimals
        )
      ),
      CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.token1,
        fromReadableAmount(
          (CurrentConfig.tokens.token1Amount *
            CurrentConfig.tokens.fractionToAdd) /
            100,
          CurrentConfig.tokens.token1.decimals
        )
      )
    )
  
    const addLiquidityOptions: AddLiquidityOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
      tokenId: positionId,
    }
  
    // get calldata for increasing a position
    const { calldata, value } = NonfungiblePositionManager.addCallParameters(
      positionToIncreaseBy,
      addLiquidityOptions
    )
  
    // build transaction
    const transaction = {
      data: calldata,
      to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      value: value,
      from: address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    }
  
    await sendTransaction(transaction)
    return TransactionState.Sent
  }