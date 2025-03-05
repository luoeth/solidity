import { BigintIsh, Percent, SUPPORTED_CHAINS, Token, ChainId  } from '@uniswap/sdk-core'
import { MintOptions, nearestUsableTick, NonfungiblePositionManager, Pool, Position, computePoolAddress, FeeAmount } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { ethers } from 'ethers'
import { exit } from 'process'

const ERC20_ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi;
const NONFUNGIBLE_POSITION_MANAGER_ABI = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json').abi;
