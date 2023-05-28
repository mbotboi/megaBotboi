require('dotenv').config()

const { I1Inch } = require('./1Inch')

const weth = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"
const usdc = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"

const main = async () => {
    const walletAddress = process.env.ADDRESS
    const pkey = process.env.PKEY
    // First, let's build the body of the transaction
    const i1Inch = new I1Inch("arb", walletAddress, pkey);
    
    const approve = await i1Inch.approveRouter(weth)
    console.log('approve success', approve)
    
    const minAmountOut = 1 / 1500
    const swapParams = {
        tokenIn: weth,
        tokenOut: usdc,
        amountIn: 0.0023 * 10 ** 18,
        slippage: 1,
    }

    const txHash = await i1Inch.swap(swapParams);
    console.log(txHash)
}
// main()

// `
// 0x12aa3caf
// 00000000000000000000000064768a3a2453f1e8de9e43e92d65fc36e4c9872d - executor
// 000000000000000000000000ff970a61a04b1ca14834a43f5de4533ebddb5cc8 - tokenIn
// 00000000000000000000000082af49447d8a07e3bd95bd0d56f35241523fbab1 - tokenOut
// 0000000000000000000000008bc2cd9dab840231a0dab5b747b8a6085c4ea459 - in Receiver
// 00000000000000000000000080d1f912f2ba9ccb58ac163e9480ac3120f9e3ae - out Receiver / my address
// 00000000000000000000000000000000000000000000000000000000000f4240 - amount in
// 0000000000000000000000000000000000000000000000000001f3e6209099a3 - min amount out
// 0000000000000000000000000000000000000000000000000000000000000004 - length of array?
// 0000000000000000000000000000000000000000000000000000000000000140
// 0000000000000000000000000000000000000000000000000000000000000160
// 0000000000000000000000000000000000000000000000000000000000000000
// 0000000000000000000000000000000000000000000000000000000000000085
// 0000000000000000000000000000000000000000000000000000000000670020
// 6ae4071138002dc6c08bc2cd9dab840231a0dab5b747b8a6085c4ea459111111
// 1254eeb25477b68fb85ed929f73a960582000000000000000000000000000000
// 0000000000000000000001f3e6209099a3ff970a61a04b1ca14834a43f5de453
// 3ebddb5cc8000000000000000000000000000000000000000000000000000000
// cfee7c08
// `