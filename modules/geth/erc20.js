const { Eth } = require('../geth/ethClass')
const ERC20 = require('../../ABIs/ERC20.json')
const ABI = ERC20.abi
const maxUint = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

//READ FUNCTIONS----------------------------------------------------------------
exports.ERC20 = class EC20 {
    constructor(chain, rpc, tokenAddress) {
        this.chain = chain
        this.rpc = rpc
        this.tokenAddress = tokenAddress

        this.eth = new Eth(chain, rpc)
    }

    getBalance = async (walletAddress) => {
        const params = [walletAddress]
        const data = await this.eth.getContractData({ to: this.tokenAddress, functionName: "balanceOf", params: params, abi: ABI })
        return data[0]
    }

    allowance = async (myAddress, spender) => {
        const params = [myAddress, spender]
        const data = await this.eth.getContractData({ to: this.tokenAddress, functionName: "allowance", params: params, abi: ABI })
        return data[0]
    }

    decimals = async () => {
        const data = await this.eth.getContractData({ to: this.tokenAddress, functionName: "decimals", params: [], abi: ABI })
        return data
    }

    symbol = async () => {
        const data = await this.eth.getContractData({ to: this.tokenAddress, functionName: "symbol", params: [], abi: ABI })
        return data
    }

    //WRITE FUNCTIONS----------------------------------------------------------------
    //this function will approve max if not given
    approve = async ({ myAddress, spender, amount, nonce, pkey }) => {
        var amountToApprove = !amount ? maxUint : amount
        const params = [spender, amountToApprove]
        const inputs = {
            functionName: "approve",
            abi: ABI,
            value: 0,
            to: this.tokenAddress,
            from: myAddress,
            params: params,
            nonce: nonce,
            pkey: pkey
        }
        const hash = await this.eth.sendTransaction(inputs)
        return hash
    }

    transfer = async ({ myAddress, to, amount, nonce, pkey }) => {
        const params = [to, amount]
        const inputs = {
            functionName: "transfer",
            abi: ABI,
            value: 0,
            to: this.tokenAddress,
            from: myAddress,
            params: params,
            nonce: nonce,
            pkey: pkey
        }
        const hash = await this.eth.sendTransaction(inputs)
        return hash
    }
}