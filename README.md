[<img src="https://github.com/luoeth/solidity/blob/main/Untitled.png">](https://docs.uniswap.org/sdk/v3/overview)

# Install the Uniswap/ethers/openzeppelin package

```
npm install @uniswap/sdk-core @uniswap/v3-sdk ethers @openzeppelin
```

# :one: 創建兩種 ERC20 代幣 contracts\DualToken.sol

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

# :two: 建立池 create_pool
## 主要參數
- token1 / token2：要交易的兩種代幣地址。
- fee：交易手續費，常見的選項：
  - 100（0.01%）
  - 500（0.05%）
  - 3000（0.3%）
  - 10000（1%）
```
npx hardhat run test/create_pool.ts --network BASE_SEPOLIA
```
```
Using account: 0x3F3140ceb82D0C490649c066FFf6AE07A75df447
Pool created successfully! Pool Address: 0x18300a11b8F480F3801BFa4882934A6B47A10C3E
```

# :three: mint_Position （流動性倉位）
設定一個流動性倉位，允許用戶在特定價格範圍內提供流動性。
## 主要參數
- pool: configuredPool：綁定剛剛建立的 Pool 物件。
- tickLower：倉位的 最低 tick，由 nearestUsableTick 計算，並向下擴展 2 個 tick spacing。
- tickUpper：倉位的 最高 tick，由 nearestUsableTick 計算，並向上擴展 2 個 tick spacing。
- amount0, amount1：要提供的 Token0 和 Token1 的數量
- recipient ：接收流動性 NFT 的地址。
- deadline: Math.floor(Date.now() / 1000) + 60 * 20：交易的最晚完成時間（當前時間 + 20 分鐘）。
- slippageTolerance: new Percent(50, 10_000)：允許的 最大滑點（0.5% = 50 / 10,000）。
```
npx hardhat run test/mint_Position.ts --network BASE_SEPOLIA
```
```
Transaction sent: 0x2ec30d70b2060c6f21af089baccbddcf2b2be51459a1a8aa67ad96bee539c3d1
Transaction successful TransactionReceipt {
  provider: JsonRpcProvider {},
  to: '0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2',
  from: '0x3F3140ceb82D0C490649c066FFf6AE07A75df447',
...
```

# 4️⃣ Adding_liquidity （增加Position流動性）
主流程:批准代幣(approveToken) >
## 主要參數
- POOL_FEE:填入建立流動性池時的手續費
- APPROVETOKENAMOUNT: 授權要增加的流動性數量
- ADDLIQUIDITYAMOUNT: 要增加的數量

  

