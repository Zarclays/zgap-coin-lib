import axios, { AxiosResponse } from 'axios'
import { EthereumNodeClient } from './NodeClient'
import { BigNumber } from 'bignumber.js'
import { EthereumUtils } from '../../utils/utils'

class EthereumRPCBody {
  public static blockEarliest = 'earliest'
  public static blockLatest = 'latest'
  public static blockPending = 'pending'

  public jsonrpc: string
  public method: string
  public params: any[]
  public id: number

  constructor(method: string, params: any[]) {
    this.jsonrpc = '2.0'
    this.method = method
    this.params = params
    this.id = 1
  }

  toJSON(): string {
    return JSON.stringify({
      jsonrpc: this.jsonrpc,
      method: this.method,
      params: this.params,
      id: this.id
    })
  }
}

export class EthereumRPCData {
  // 2 chars = 1 byte hence to get to 32 bytes we need 64 chars
  protected static parametersLength: number = 64
  public methodSignature: string

  constructor(methodSignature: string) {
    this.methodSignature = methodSignature
  }

  public abiEncoded(): string {
    const hash = EthereumUtils.sha3(this.methodSignature)
    if (hash === null) {
      return ''
    }
    return `0x${hash.slice(2, 10)}`
  }

  static addLeadingZeroPadding(value: string, targetLength: number = EthereumRPCData.parametersLength): string {
    let result = value
    while (result.length < targetLength) {
      result = '0' + result
    }
    return result
  }

  static removeLeadingZeroPadding(value: string): string {
    let result = value
    while (result.startsWith('0')) {
      result = result.slice(1) // this can probably be done much more efficiently with a regex
    }
    return result
  }
}

export class EthereumRPCDataBalanceOf extends EthereumRPCData {
  public static methodName: string = 'balanceOf'
  public address: string

  constructor(address: string) {
    super(`${EthereumRPCDataBalanceOf.methodName}(address)`)
    this.address = address
  }

  public abiEncoded(): string {
    let srcAddress = this.address
    if (srcAddress.startsWith('0x')) {
      srcAddress = srcAddress.slice(2)
    }
    return super.abiEncoded() + EthereumRPCData.addLeadingZeroPadding(srcAddress)
  }
}

export class EthereumRPCDataTransfer extends EthereumRPCData {
  public static methodName: string = 'transfer'
  public recipient: string
  public amount: string

  constructor(toAddressOrData: string, amount?: string) {
    super(`${EthereumRPCDataTransfer.methodName}(address,uint256)`)
    if (amount) {
      const toAddress = toAddressOrData
      this.recipient = toAddress
      this.amount = amount
    } else {
      const data = toAddressOrData
      const methodID = super.abiEncoded()
      if (!data.startsWith(methodID)) {
        throw new Error('unexpected method ID')
      }
      const params = data.slice(methodID.length)
      const recipient = EthereumRPCData.removeLeadingZeroPadding(params.slice(0, EthereumRPCData.parametersLength))
      const amount = EthereumRPCData.removeLeadingZeroPadding(params.slice(EthereumRPCData.parametersLength))
      this.recipient = `0x${recipient}`
      this.amount = `0x${amount}`
    }
  }

  public abiEncoded(): string {
    let dstAddress = this.recipient
    if (dstAddress.startsWith('0x')) {
      dstAddress = dstAddress.slice(2)
    }
    let transferAmount = this.amount
    if (transferAmount.startsWith('0x')) {
      transferAmount = transferAmount.slice(2)
    }

    return (
      super.abiEncoded() +
      EthereumRPCData.addLeadingZeroPadding(dstAddress.toLowerCase()) +
      EthereumRPCData.addLeadingZeroPadding(transferAmount.toLowerCase())
    )
  }
}

export class AirGapNodeClient extends EthereumNodeClient {
  constructor(baseURL: string = 'https://eth-rpc-proxy.airgap.prod.gke.papers.tech') {
    super(baseURL)
  }

  public async fetchBalance(address: string): Promise<BigNumber> {
    const body = new EthereumRPCBody('eth_getBalance', [address, EthereumRPCBody.blockLatest])
    return this.send(body, response => {
      let balance: string = response.data.result
      return new BigNumber(balance)
    })
  }

  public async fetchTransactionCount(address: string): Promise<number> {
    const body = new EthereumRPCBody('eth_getTransactionCount', [address, EthereumRPCBody.blockLatest])
    return this.send(body, response => {
      let count: string = response.data.result
      return new BigNumber(count).toNumber()
    })
  }

  public async sendSignedTransaction(transaction: string): Promise<string> {
    const body = new EthereumRPCBody('eth_sendRawTransaction', [transaction])
    return this.send(body, response => {
      return response.data.result
    })
  }

  public async callBalanceOf(contractAddress: string, address: string): Promise<BigNumber> {
    const data = new EthereumRPCDataBalanceOf(address)
    const body = new EthereumRPCBody('eth_call', [{ to: contractAddress, data: data.abiEncoded() }, EthereumRPCBody.blockLatest])
    return this.send(body, response => {
      return new BigNumber(response.data.result)
    })
  }

  public async estimateTransferGas(contractAddress: string, fromAddress: string, toAddress: string, hexAmount: string): Promise<number> {
    const data = new EthereumRPCDataTransfer(toAddress, hexAmount)
    const body = new EthereumRPCBody('eth_estimateGas', [
      { from: fromAddress, to: contractAddress, data: data.abiEncoded() },
      EthereumRPCBody.blockLatest
    ])
    return this.send(body, response => {
      return new BigNumber(response.data.result).toNumber()
    })
  }

  private async send<Result>(body: EthereumRPCBody, responseHandler: (response: AxiosResponse<any>) => Result): Promise<Result> {
    return new Promise((resolve, reject) => {
      axios
        .post(this.baseURL, body.toJSON())
        .then(response => {
          resolve(responseHandler(response))
        })
        .catch(reject)
    })
  }
}