const axios = require('axios');
require("dotenv").config()

const { Eth } = require('../geth/ethClass')
const { approve } = require('../geth/erc20');

exports.I1Inch = class I1Inc {
    constructor(chain, walletAddress, pkey) {
        if (chain == "arb") {
            this.chainId = 42161
            this.rpc = process.env.RPC
            this.env = "mainnet" //for my eth class -> mainnet is arb mainnet
            this.eth = new Eth(this.env)
            this.router1Inch = "0x1111111254EEB25477B68fb85Ed929f73A960582"
        }

        this.walletAddress = walletAddress
        this.pkey = pkey

        this.maxUint = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        this.apiBaseUrl = 'https://api.1inch.io/v5.0/' + this.chainId;
        this.broadcastApiUrl = 'https://tx-gateway.1inch.io/v1.1/' + this.chainId + '/broadcast';
    }

    apiRequestUrl = (methodName, queryParams) => {
        return this.apiBaseUrl + methodName + '?' + (new URLSearchParams(queryParams)).toString();
    }

    approveRouter = async (tokenAddress) => {
        const nonce = await this.eth.getTransactionCount(this.walletAddress)
        try {
            await approve({
                env: this.env,
                tokenAddress: tokenAddress,
                myAddress: this.walletAddress,
                spender: this.router1Inch,
                nonce: nonce,
                pkey: this.pkey
            })
            return true
        } catch (e) {
            console.error(e.name)
            console.error(e.msg)
            return false
        }
    }

    swap = async ({ tokenIn, tokenOut, amountIn, slippage, minAmountOut }) => {

        const swapParams = {
            fromTokenAddress: tokenIn,
            toTokenAddress: tokenOut,
            amount: amountIn,
            fromAddress: this.walletAddress,
            disableEstimate: false,
            slippage: slippage,
            allowPartialFill: false,
        };

        const url = this.apiRequestUrl('/swap', swapParams);
        const resp = await axios.get(url);
        const data = resp.data

        const estimatedAmountOut = Number(data.toTokenAmount)
        console.log(estimatedAmountOut)
        console.log(minAmountOut)

        if (minAmountOut) {
            if (estimatedAmountOut < minAmountOut) return -1
        }
        const nonce = await this.eth.getTransactionCount(this.walletAddress)

        const txData = data.tx
        const txHash = await this.eth.sendTransaction({
            value: txData.value,
            to: txData.to,
            from: txData.from,
            nonce: nonce,
            pkey: this.pkey,
            data: txData.data
        })
        return txHash

    }
}