/**
 * @param {*} response from RPC call that returns a hex
 * @returns the result in decimals
 */
exports.getResultFromHex = (resp) => {
    const result = resp.data.result
    return parseInt(result, 16)
}