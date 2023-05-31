const Websocket = require('ws')
const ethers = require('ethers')
var Accounts = require('web3-eth-accounts');
const fs = require('fs');

exports.SequencerListener = class SequencerListener {
    constructor(_saveRawMessages) {
        this.SEQUENCER_URL = "wss://arb1.arbitrum.io/feed"
        this.txLink = "https://arbiscan.io/tx/"
        this.accounts = new Accounts();
        if (!_saveRawMessages) {
            this.saveRawMessages = false
        }
        this.saveRawMessages = _saveRawMessages;
        this.allL2Msgs = []
    }

    listener = async (callback) => {
        console.log("Starting sequencer feed watcher")
        const client = new Websocket(this.SEQUENCER_URL)

        client.on("open", () => {
            console.log('connected to sequencer')
        })
        client.on("message", (sequencerMsg => {
            const msg = JSON.parse(sequencerMsg)

            if (this.saveRawMessages) {
                this.allL2Msgs.push(msg)
                fs.writeFileSync('./scripts/uniV3Sniper/data/l2Msgs.json', JSON.stringify(this.allL2Msgs));
            }
            const messages = msg.messages
            if (!messages) return

            messages.map(async messageTop => {
                const l1Kind = messageTop.message.message.header.kind
                if (l1Kind != 3) return
                const l2Msg = messageTop.message.message.l2Msg
                const tx = await this._decodeL2Message(l2Msg)

                if (tx) callback(tx)
            })
        }))
    }

    _decodeL2Message = async (l2Msg) => {
        const buff = Buffer.from(l2Msg, "base64")
        const text = buff.toString("hex")

        //FILTER ONLY FOR  L2 MESSAGE TYPE 4 -> IF NOT TYPE 4 CONTINUE
        const l2MsgKind = text.slice(0, 2)
        if (Number(l2MsgKind) == 4) {
            const rawTx = '0x' + text.slice(2, text.length)
            let tx, from;
            try {
                if (rawTx.slice(0, 4) == '0x02') {
                    [tx, from] = await Promise.all([
                        this._decodeType2Tx(rawTx),
                        this._getAddressFromRawTxAsync(rawTx)
                    ])
                } else {
                    [tx, from] = await Promise.all([
                        this._decodeType0Tx(rawTx),
                        this._getAddressFromRawTxAsync(rawTx)
                    ])
                }
                tx.from = from
                if (!tx.from) console.log(tx.link)
                return tx
            } catch (e) {
                console.log(rawTx)
                console.log('txHash', ethers.utils.keccak256(rawTx))
                console.error(e.message)
            }
        }
    }

    _decodeType0Tx = async (rawTx) => {
        try {
            const decoded = ethers.utils.RLP.decode(rawTx)
            const possibleTxHash = ethers.utils.keccak256(rawTx)
            const tx = {
                raw: rawTx,
                nonce: decoded[0],
                gasPrice: decoded[1],
                gas: decoded[2],
                to: decoded[3],
                value: decoded[4],
                input: decoded[5],
                v: decoded[6],
                r: decoded[7],
                s: decoded[8],
                hash: possibleTxHash,
                link: this.txLink + possibleTxHash
            }
            return tx
        } catch (e) {
            console.error('cannot decode transactions - skipping')
        }
    }

    _decodeType2Tx = async (rawTx) => {
        const rawTxDecode = '0x' + rawTx.slice(4, rawTx.length)
        try {
            const decoded = ethers.utils.RLP.decode(rawTxDecode)
            const possibleTxHash = ethers.utils.keccak256(rawTx)

            const tx = {
                raw: rawTx,
                type: '0x2',
                chainId: decoded[0],
                nonce: decoded[1],
                maxPriorityFeePerGas: decoded[2],
                maxFeePerGas: decoded[3],
                gas: decoded[4],
                to: decoded[5],
                value: decoded[6],
                input: decoded[7],
                accessList: decoded[8],
                v: decoded[9],
                r: decoded[10],
                s: decoded[11],
                hash: possibleTxHash,
                link: this.txLink + possibleTxHash
            }
            return tx
        } catch (e) {
            console.error('cannot decode transactions - skipping')
        }
    }

    _getAddressFromRawTxAsync = async (raw) => {
        try {
            const address = this.accounts.recoverTransaction(raw)
            return address
        } catch (e) {
            // console.error("Could not get address from VRS and raw tx bytes")
            return
        }

    }
}
