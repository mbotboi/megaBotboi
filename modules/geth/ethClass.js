const axios = require('axios')
const { Transaction } = require("@ethereumjs/tx")
const Common = require('@ethereumjs/common')
const { getResultFromHex } = require('./helper')
const { getFunctionSignature, decodeData, encodeInputParams } = require('./enDecode')


exports.Eth = class Eth {
    constructor(chain, rpc) {
        this.baseData = { "jsonrpc": "2.0", "params": [], "id": 42161 }
        if (chain == "eth-mainnet") {
            this.common = Common.default.custom({ chainId: 1 })

            this.ai = axios.create({
                baseURL: rpc,
                timeout: 2000,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        } else if (chain === 'arb-mainnet') {
            //gas settings -> specifically for arbitrum
            //at worst, i will spend 0.0012 ETH on gas more or less
            this.gasPrice = 1 * 10 ** 9//gwei
            this.gasLimit = 6000000// default to 6mn. the rest will be refunded anyway

            //setup for signing TXs
            this.common = Common.default.custom({ chainId: 42161 })

            this.ai = axios.create({
                baseURL: rpc,
                timeout: 2000,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        } else if (chain === "arb-testnet") {
            this.gasPrice = 1 * 10 ** 9//gwei
            this.gasLimit = 6000000// default to 6mn. the rest will be refunded anyway

            this.common = Common.default.custom({ chainId: 421613 })

            this.ai = axios.create({
                baseURL: rpc,
                timeout: 2000,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        } else if (chain === "local") {
            this.common = Common.default.custom({ chainId: 31337 })
            this.ai = axios.create({
                baseURL: "http://127.0.0.1:8545/",
                timeout: 2000,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
        }
    }
    //CLASS? FUNCTIONS----------------------------------------------------------------
    changeRPCs = (rpc) => {
        this.ai = axios.create({
            baseURL: rpc,
            timeout: 2000,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
    }
    currentRPC = () => {
        return this.ai.defaults.baseURL
    }
    //READ FUNCTIONS----------------------------------------------------------------
    getGasPrice = async () => {
        this.baseData.method = "eth_gasPrice"
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        return getResultFromHex(resp)
    }

    getBlockNumber = async () => {
        // console.time('getBlockNumber')
        this.baseData.method = "eth_blockNumber"
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        // console.timeEnd('getBlockNumber')
        return getResultFromHex(resp)

    }

    getNetworkId = async () => {
        this.baseData.method = "net_version"
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        return resp.data.result
    }

    getBalance = async (address) => {
        this.baseData.method = "eth_getBalance"
        this.baseData.params = [address, "latest"]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        return getResultFromHex(resp)
    }

    getTransactionCount = async (address) => {
        // console.time('getting nonce')
        this.baseData.method = "eth_getTransactionCount"
        this.baseData.params = [address, "latest"]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        // console.timeEnd('getting nonce')
        return getResultFromHex(resp)
    }

    getBlockTransactions = async (blockNumber) => {
        console.time('getBlockTransaction')
        this.baseData.method = "eth_getBlockByNumber"
        this.baseData.params = ["0x" + blockNumber.toString(16), true]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        console.timeEnd('getBlockTransaction')
        return resp.data.result
    }

    getLatestBlockTransactions = async () => {
        this.baseData.method = "eth_getBlockByNumber"
        this.baseData.params = ["latest", true]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        return resp.data.result
    }
    /**
     * 
     * @param {*} address contract address
     * @param {*} functionName name of function
     * @param {*} params array of params in the correct order
     * @param {*} abi abi of the contract interacted with to decode result
     * @returns 
     */
    getContractData = async ({ to, functionName, params, abi, blockNumber, from }) => {
        // console.time('fetching data custom')

        const funcObj = abi.filter(x => x.name == functionName)[0]
        blockNumber = !blockNumber ? "latest" : blockNumber

        const data = this.getFunctionData(funcObj, params)
        this.baseData.method = "eth_call"
        this.baseData.params = [
            {
                to: to,
                data: data,
                from: from
            },
            blockNumber
        ]

        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        const res = resp.data.result
        // console.timeEnd('fetching data custom')
        // console.time('decoding with custom')
        const outputTypes = funcObj.outputs
        const decoded = decodeData(res, outputTypes)
        // console.timeEnd('decoding with custom')
        return decoded
    }
    getContractDataW3 = async ({ address, functionName, params, abi, blockNumber, from }) => {
        console.time('fetching data w3')

        const w3Abi = require('web3-eth-abi');

        const funcObj = abi.filter(x => x.name == functionName)[0]
        blockNumber = !blockNumber ? "latest" : blockNumber

        const data = this.getFunctionData(funcObj, params)
        this.baseData.method = "eth_call"
        this.baseData.params = [
            {
                to: address,
                data: data,
                from: from
            },
            blockNumber
        ]

        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        const res = resp.data.result
        console.timeEnd('fetching data w3')

        console.time('decoding with w3')
        const decoded = w3Abi.decodeParameters(['address'], res)
        console.timeEnd('decoding with w3')
        return decoded
    }

    getTransactionByHash = async (txHash) => {
        this.baseData.method = "eth_getTransactionByHash"
        this.baseData.params = [txHash]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        return resp.data.result //the transaction object
    }

    getTransactionReceipt = async (txHash) => {
        console.time('getTransactionReceipt')
        this.baseData.method = "eth_getTransactionReceipt"
        this.baseData.params = [txHash]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        console.timeEnd('getTransactionReceipt')
        return resp.data.result //the transaction receipt object
    }

    getLogs = async ({ topic0, address, fromBlock, toBlock }) => {
        fromBlock = !fromBlock ? 'latest' : "0x" + fromBlock.toString(16)
        toBlock = !toBlock ? 'latest' : "0x" + toBlock.toString(16)

        this.baseData.method = "eth_getLogs"
        this.baseData.params = [{
            topics: [topic0],
            address: address,
            fromBlock: fromBlock,
            toBlock: toBlock
        }]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        return resp.data.result //the transaction receipt object
    }

    //WRITE FUNCTIONS----------------------------------------------------------------
    signTransaction = async (transactionData) => {
        this.baseData.method = "eth_signTransaction"
        this.baseData.params = [
            transactionData,
            "latest"
        ]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        return resp.data.result //the signed transaction hex
    }

    sendRawTransaction = async (signedTransaction) => {
        this.baseData.method = "eth_sendRawTransaction"
        this.baseData.params = [signedTransaction]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        if (resp.data.error) {
            return resp.data.error
        } else {
            return resp.data.result //the transaction hash
        }
    }

    simulateTransaction = async ({ functionName, abi, value, to, from, params, nonce, pkey }) => {
        const funcObj = abi.filter(x => x.name == functionName)[0]
        const data = this.getFunctionData(funcObj, params)
        if (pkey.includes('0x')) {
            pkey = pkey.split('0x')[1]
        }
        const amountInWei = value * 10 ** 18

        this.baseData.method = "eth_call"
        this.baseData.params = [
            {
                to: to,
                from: from,
                data: data,
                value: '0x' + amountInWei.toString(16),
            },
            "latest"
        ]
        const resp = await this.ai({ method: "post", data: JSON.stringify(this.baseData) })
        const res = resp.data.result
        const outputTypes = funcObj.outputs
        const decoded = decodeData(res, outputTypes)
        return decoded
    }

    //FUNCTIONS FOR SENDING TXS----------------------------------------------------------------    
    sendEth = async (amount, to, from, pkey,) => {
        console.time('encoding and signing')

        if (pkey.includes('0x')) {
            pkey = pkey.split('0x')[1]
        }
        const txParams = {
            to: to,
            from: from,
            gasLimit: '0x' + this.gasLimit.toString(16),
            gasPrice: '0x' + this.gasPrice.toString(16),
            value: '0x' + amount.toString(16),
            data: '0x',
            nonce: '0x' + (nonce).toString(16),
        }
        const common = this.common

        const createdTx = Transaction.fromTxData(txParams, { common })
        const signedTx = createdTx.sign(Buffer.from(pkey, "hex"))
        const serializedTx = signedTx.serialize()
        console.timeEnd('encoding and signing')

        const txHash = await this.sendRawTransaction('0x' + serializedTx.toString('hex'))
        return txHash
    }

    sendTransaction = async ({ functionName, abi, value, to, from, params, nonce, pkey, data }) => {
        // console.time("tx encoding and signing")
        if (functionName && abi && params && !data) {
            const funcObj = abi.filter(x => x.name == functionName)[0]
            data = this.getFunctionData(funcObj, params)
        }
        if (!value) {
            value = 0
        }

        if (pkey.includes('0x')) {
            pkey = pkey.split('0x')[1]
        }
        const txParams = {
            to: to,
            from: from,
            gasLimit: '0x' + this.gasLimit.toString(16),
            gasPrice: '0x' + this.gasPrice.toString(16),
            value: '0x' + value.toString(16),
            data: data,
            nonce: '0x' + (nonce).toString(16),
        }
        // console.time("signingTx")
        const common = this.common
        const createdTx = Transaction.fromTxData(txParams, { common })
        const signedTx = createdTx.sign(Buffer.from(pkey, "hex"))
        const serializedTx = signedTx.serialize()
        // console.timeEnd("signingTx")
        // console.timeEnd("tx encoding and signing")

        // console.time("sending tx to node")
        const txHash = await this.sendRawTransaction('0x' + serializedTx.toString('hex'))
        // console.timeEnd("sending tx to node")
        return txHash
    }




    //HELPER FUNCTIONS ----------------------------------------------------------------
    /**
     * 
     * @param {*} funcObj - object for the specific function returned from ABI
     * @param {*} params - params for the function call that need to be encoded
     * @returns encoded function parameters
     * 
     * this function is not perfect (ie if theres more than 1 array in the function it does not work)
     * but for sniping grail its fine.
     * i just realised im so fucking slow and spent wayyy too much time on this shit for idk why
     */
    getFunctionData = (funcObj, params) => {
        // console.log("funcObj", funcObj)
        // console.log("params", params)

        // console.time('transforming data')
        var data;

        if (!params || params.length === 0) {
            data = getFunctionSignature(`${funcObj.name}()`)
        } else {
            // console.time('encoding loop')
            var encoded = ""
            var signatureTypes = ""
            const inputTypes = funcObj.inputs
            var arr = ""

            inputTypes.map((type, i) => {
                let encodedParam;
                const isArray = Array.isArray(params[i])
                if (isArray) { //dynamic array
                    /**
                     * i = position of current argument 
                     * argument at place i = pointer to byte position to the length of the array
                     * argument at i = length +1 = length of dynamic array, n
                     * argument at i = length+2... length+n = the elements in the dynamic array 
                     */
                    const pos = params.length * 32
                    encodedParam = encodeInputParams(pos, "uint256")

                    //add the length to arr, then concantenate with elements of the array
                    arr += encodeInputParams(params[i].length, "uint256")
                    params[i].map(x => arr += encodeInputParams(x, 'address'))
                } else {

                    encodedParam = encodeInputParams(params[i], type.type)
                }
                encoded += encodedParam
                //append type to string to generate the signature hash
                signatureTypes += type.type
                if (i !== inputTypes.length - 1) { signatureTypes += ',' }
            })
            encoded += arr
            data = getFunctionSignature(`${funcObj.name}(${signatureTypes})`) + encoded
            // console.timeEnd('encoding loop')
        }
        // console.timeEnd('transforming data')
        return data
    }
}
