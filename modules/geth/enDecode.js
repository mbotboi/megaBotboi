const sha3 = require('js-sha3')
const importantLogs = require('./logValues.json')

/**
 * 
 * @param {*} funcSig function signature. eg: "balanceOf(address)"
 * @returns 
 */
exports.getFunctionSignature = (funcSig) => {
    // console.time("get function sig")
    const encoded = sha3.keccak_256(funcSig)
    const sig = '0x' + encoded.substring(0, 8)
    // console.timeEnd("get function sig")

    return sig
}

exports.encodeInputParams = (param, type) => {
    let curr;

    if (type.includes("address")) {
        curr = param.split('0x')[1]
    } else if (type.includes("int")) {
        if (String(param).includes('0x')) {
            curr = param.split("0x")[1]
        } else {
            curr = param.toString(16)

        }
    } else if (type.includes("bool")) {
        curr = param ? '1' : '0'
    }
    curr = curr.padStart('64', 0)
    return curr
}


const decodeData = (data, outputTypes) => {
    // console.time('decoding data')
    const outputs = data.split('0x')[1]

    const decoded = outputTypes.map((type, i) => {

        if (type.type == "string") {
            var offset = outputs.slice(0, 64)
            offset = "0x" + offset.replace(/^0+/, '')
            offset = parseInt(offset, 16) * 2

            var length = outputs.slice(offset, offset + 64)
            length = "0x" + length.replace(/^0+/, '')
            length = parseInt(length, 16) * 2

            var str = outputs.slice(offset + 64, offset + (64 * 2))
            str = str.replace(/\.?0*$/, '');
            const buf = Buffer.from(str, "hex")
            str = buf.toString("utf8")
            return str
        } else {
            const endIdx = 64 * (i + 1)
            var currentOutput = outputs.slice(64 * i, endIdx)
            currentOutput = "0x" + currentOutput.replace(/^0+/, '')

            if (type.type == "address") {
            } else if (type.type.includes("int")) {
                currentOutput = parseInt(currentOutput, 16)
            } else if (type.type == "bool") {
                currentOutput = true ? currentOutput == "0x1" : currentOutput == "0x0"
            }
            return currentOutput
        }
    })
    // console.timeEnd('decoding data')
    return decoded
}
exports.decodeData = decodeData


/**
 * 0000000000000000000000000000000000000000000000000000000000000020
 * 0000000000000000000000000000000000000000000000000000000000000004
 * 5553444300000000000000000000000000000000000000000000000000000000
 */