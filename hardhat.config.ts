import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const BASE_SEPOLIA_RPC_URL="https://sepolia.base.org";
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // hardhat: {},
    BASE_SEPOLIA: {
      url: BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: [process.env.PRIVATE_KEY!],
    }
  },
  mocha: {
    timeout: 40000,
  },
}

export default config;
