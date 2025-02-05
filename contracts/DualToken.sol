// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 這個合約用於創建兩種 ERC20 代幣
contract DualToken {
    ERC20Token public token1;
    ERC20Token public token2;

    // 在部署時傳入兩種代幣的初始供應量
    constructor(uint256 initialSupplyToken1, uint256 initialSupplyToken2) {
        // 創建第一種代幣 (Token1)，並將其供應量分配給合約部署者
        token1 = new ERC20Token("Token1", "TK1", initialSupplyToken1, msg.sender);
        
        // 創建第二種代幣 (Token2)，並將其供應量分配給合約部署者
        token2 = new ERC20Token("Token2", "TK2", initialSupplyToken2, msg.sender);
    }
}

// ERC20 代幣合約
contract ERC20Token is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address owner) ERC20(name, symbol) {
        // 鑄造初始供應量並發送到部署者地址
        _mint(owner, initialSupply);
    }
}
