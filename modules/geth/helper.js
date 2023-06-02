/**
 * @param {*} response from RPC call that returns a hex
 * @returns the result in decimals
 */
exports.getResultFromHex = (resp) => {
    const result = resp.data.result
    return parseInt(result, 16)
}

/**
 * 
 * @param {*} num 
 * @param {*} decimals if no decimal is passed, it will convert the raw number to string
 * @returns 
 */
exports.toHex = (num, decimals) => {
    var hex = '0x'
    if (!decimals) {
        hex += num.toString(16)
    } else {
        hex += (num * 10 ** decimals).toString(16)
    }
    return hex
}