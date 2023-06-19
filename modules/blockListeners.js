const Websocket = require('ws')
require('fs')

/**
 * @param {*} addresses list of addys that will emit the event
 * @param {*} topics list of topics to listen to
 */

exports.BlockListener = class BlockListener {
    constructor(_wssRpc) {
        this.wssRpc = _wssRpc
        this.client = new Websocket(this.wssRpc)
    }

    eventListener = async (addresses, topics, callback) => {
        //params for creating websocket
        const params = ["logs", { address: addresses, topics: topics }]

        const payload = {
            jsonrpc: "2.0",
            id: 0,
            method: "eth_subscribe",
            params: params
        }

        this.client.on("open", () => {
            console.log('sending connection request')
            this.client.send(JSON.stringify(payload))
        })
        this.client.on("message", (event) => {
            const data = JSON.parse(event)

            if (!data.params) {
                console.log("connected")
                return
            }
            if (!data.params.result) {
                return
            }
            const res = data.params.result
            callback(res)
        })
    }

    blockListener = (callback) => {
        const payload = { jsonrpc: "2.0", id: 1, method: "eth_subscribe", params: ["newHeads"] }
        this.client.on("open", () => {
            console.log('sending connection request')
            this.client.send(JSON.stringify(payload))
        })
        this.client.on("message", (event) => {
            const data = JSON.parse(event)

            if (!data.params) {
                console.log("connected")
                return
            }
            if (!data.params.result) {
                return
            }
            const res = data.params.result
            callback(res)
        })
    }
}
/**
 * avg time to get block 272.12698412698415 - loop
 * avg time to get block 262.9633027522936 - ws
//  */
// const getBlockLoop = async () => {
//     const eth = new Eth('mainnet')
//     var cachedBlock;
//     var currTime = Date.now()
//     const timeArray = []
//     // const bn = eth.getBlockNumber().then(console.log)
//     const interval = setInterval(async () => {
//         eth.getBlockNumber().then((bn) => {
//             if (bn != cachedBlock) {
//                 console.log(bn)
//                 cachedBlock = bn
//                 const newTime = Date.now()
//                 const timeDiff = Date.now() - currTime
//                 currTime = newTime
//                 console.log("time taken to detect new block", timeDiff, "ms")
//                 timeArray.push(timeDiff)
//                 const avg = timeArray.reduce((a, b) => a + b, 0) / timeArray.length
//                 console.log("avg time to get block", avg)
//             }
//         })
//     }, 100)
// }
