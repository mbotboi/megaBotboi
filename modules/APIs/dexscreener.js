const axios = require('axios')
const { saveToJSON } = require('../../utils/utils')
exports.getTokenData = async (addresses) => {
    var addressString = "";
    addresses.map(addr => addressString = addressString + addr + ',')
    const url = "https://api.dexscreener.com/latest/dex/tokens/" + addressString
    const resp = await axios.get(url)
    return resp.data
}