# MEGA BOTBOI MODULE; My baby

### How To Use
-  add ```"megabotboi": "file:<relative path from project root directory>"``` into dependencies in package.json
- Essentially there are 2 important files, erc20.js and ethClass.js , both are in /modules/geth
- theres also /module/APIs/1inch.js
  - 1inch.js essentially uses 1inch api to swap, but barely used it so pls test with caution
- and /module/APIs/dexscreener.js which is just a simple api call i used lol
- 
**example ethClass instance and usage**
```
const { Eth } = require('megabotboi/modules/geth/ethClass')
const eth = new ETH('eth-mainnet', RPC)
eth.getBlockNumber().then(console.log)

const params = const params = [usdc, weth,  500] //example querying univ3 factory for pair
const data = await eth.getContractData({
    to: router,
    functionName: "getPool",
    params: params,
    abi: routerAbi,
})
console.log(data)
```

**example erc20 instance and usage**
```
const { ERC20 } = require('megabotboi/modules/geth/erc20')
const erc20 = new ERC20('arb-mainnet', RPC, tokenAddress)
erc20.erc20.getBalance(address).then(console.log)

erc20.eth.getTransactionCount(myAddress).then(nonce => {
    erc20.transfer({
        myAddress: myAddress,
        to: to,
        amount: 10 * 10 ** 6,
        pkey: pkey,
        nonce: nonce
    }).then(txHash => console.log(txHash))
})
```

