import { SubstrateNetwork } from '../../../../../SubstrateNetwork'
import { SCALEDecoder, SCALEDecodeResult } from '../../../scale/SCALEDecoder'
import { MetadataV14Component } from '../MetadataV14Component'

export class MetadataV14Event extends MetadataV14Component {
  public static decode<Network extends SubstrateNetwork>(
    network: Network,
    runtimeVersion: number | undefined,
    raw: string
  ): SCALEDecodeResult<MetadataV14Event> {
    const decoder = new SCALEDecoder(network, runtimeVersion, raw)

    const type = decoder.decodeNextCompactInt()

    return {
      bytesDecoded: type.bytesDecoded,
      decoded: new MetadataV14Event(type.decoded)
    }
  }
}
