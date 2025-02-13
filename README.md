# Install the Uniswap V3 Core package

```npm install @uniswap/v3-core```

# 創建兩種 ERC20 代幣 contracts\DualToken.sol

編譯Solidity 智能合約
```shell
npx hardhat compile
```

使用test/deploy-dual-token.ts 將合約部屬到BASE_SEPOLIA測試網，並創建兩種代幣
```shell
npx hardhat run test/deploy-dual-token.ts --network BASE_SEPOLIA
```
```
Deploying contracts with the account: 0x3F3140ceb82D0C490649c066FFf6AE07A75df447
DualToken contract deployed to: 0x9120e688a4d32EA7cE04C1EE05fe444417c5f01c
Token1 address: 0xF75A85A81912f5b95B89c0e58e6F9a0Abc7e3b03
Token2 address: 0xe3980F63314dD3853C01536A38F35b8Bf1F21Af1
```
