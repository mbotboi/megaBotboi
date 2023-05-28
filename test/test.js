const { ERC20 } = require('../modules/geth/erc20')

const main = async () => {
    const RPC = "https://arb-mainnet.blockvision.org/v1/2QGj1lhCMPu7ege56dsADklM6qs"

    const usdc = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8";
    const weth = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    const address = "0x384eA34901FB77290EAfDc9Fe3ac5eF5A9FF755E"

    const erc20 = new ERC20('arb-mainnet', RPC, usdc)

    erc20.getBalance(address).then(console.log)
    // erc20.decimals().then(console.log)
    // erc20.symbol().then(console.log)
    // // erc20.getBalance(address).then(console.log)

}
main()