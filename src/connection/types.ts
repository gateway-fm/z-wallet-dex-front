import { ChainId } from '@uniswap/sdk-core'
import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'

export enum ConnectionType {
  INJECTED = 'INJECTED',
  COINBASE_WALLET = 'COINBASE_WALLET',
  Z_WALLET = 'Z_WALLET',
}

export function toConnectionType(value = ''): ConnectionType | undefined {
  if (Object.keys(ConnectionType).includes(value)) {
    return value as ConnectionType
  } else {
    return undefined
  }
}

export interface Connection {
  getName(): string
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
  getIcon?(isDarkMode: boolean): string
  shouldDisplay(): boolean
  overrideActivate?: (chainId?: ChainId) => boolean
}
