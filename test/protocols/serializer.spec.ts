import 'mocha'

import { expect } from 'chai'
import { TestProtocolSpec } from './implementations'
import { ethereumProtocol } from './specs/ethereum'
import {
  EthereumUnsignedTransactionSerializer,
  SerializedUnsignedEthereumTransaction
} from '../../lib/serializer/transactions/ethereum-transactions.serializer'

const protocols = [ethereumProtocol]

protocols.forEach((protocol: TestProtocolSpec) => {
  describe(`AirGap Serialization Protocol`, () => {
    it('should be able to serialize an EthereumTx to a airgap protocol string', () => {
      const ethereumTx: SerializedUnsignedEthereumTransaction = [
        '0x00',
        '0x3b9aca00',
        '0x5208',
        protocol.wallet.address,
        '0x8ac7230489e80000',
        '0x'
      ]
      const txSerializer = new EthereumUnsignedTransactionSerializer()
      const serializedTx = txSerializer.serialize(
        protocol.wallet.address,
        protocol.wallet.tx.fee,
        protocol.wallet.tx.amount,
        protocol.wallet.publicKey,
        ethereumTx
      )
      console.log(serializedTx)
      expect(serializedTx).to.be.equal('')
    })
  })
})