import { initializeConnector } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import Z_WALLET_ICON from 'assets/wallets/z-wallet-icon.svg'

import { EXTERNAL_SERVICES_CONFIG, NETWORK_CONFIG } from '../config/zephyr'
import { Connection, ConnectionType } from './types'
import { ZWalletConnector } from './zWalletConnector'

const [web3ZWallet, web3ZWalletHooks] = initializeConnector<ZWalletConnector>(
  (actions) =>
    new ZWalletConnector(actions, {
      clientUrl: EXTERNAL_SERVICES_CONFIG.Z_WALLET_CLIENT_URL,
      chainId: NETWORK_CONFIG.CHAIN_ID,
    })
)

// eslint-disable-next-line import/no-unused-modules
export const injectedConnection: Connection = {
  getName: () => 'Z Wallet',
  connector: web3ZWallet,
  hooks: web3ZWalletHooks,
  type: ConnectionType.Z_WALLET,
  getIcon: () => Z_WALLET_ICON,
  shouldDisplay: () => true,
}

export const connections = [injectedConnection]

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = connections.find((connection) => connection.connector === c)
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    return injectedConnection
  }
}
