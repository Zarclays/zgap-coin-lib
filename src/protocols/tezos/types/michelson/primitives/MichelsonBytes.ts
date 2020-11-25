import { invalidArgumentTypeError } from '../../../../../utils/error'
import { hexToBytes } from '../../../../../utils/hex'
import { MichelineDataNode, MichelinePrimitive } from '../../micheline/MichelineNode'
import { isMichelinePrimitive } from '../../utils'
import { MichelsonType } from '../MichelsonType'

export class MichelsonBytes extends MichelsonType {
  constructor(public readonly value: Buffer, name?: string) {
    super(name)
  }

  public static from(value: unknown, name?: string): MichelsonBytes {
    return isMichelinePrimitive('bytes', value)
      ? MichelsonBytes.fromMicheline(value, name)
      : MichelsonBytes.fromUnknown(value, name)
  }

  public static fromMicheline(micheline: MichelinePrimitive<'bytes'>, name?: string): MichelsonBytes {
    return MichelsonBytes.fromUnknown(micheline.bytes, name)
  }

  public static fromUnknown(unknownValue: unknown, name?: string): MichelsonBytes {
    if (unknownValue instanceof MichelsonBytes) {
      return unknownValue
    }

    if (typeof unknownValue !== 'string' && !Buffer.isBuffer(unknownValue)) {
      throw invalidArgumentTypeError('MichelsonBytes', 'string or Buffer', `${typeof unknownValue}: ${unknownValue}`)
    }

    return new MichelsonBytes(hexToBytes(unknownValue), name)
  }

  public asRawValue(): Record<string, string> | string {
    return this.name ? { [this.name]: this.value.toString('hex') } : this.value.toString('hex')
  }

  public toMichelineJSON(): MichelineDataNode {
    return {
      bytes: this.value.toString('hex')
    }
  }

}