import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import HORSWAP_LOGO from 'assets/svg/logo.svg'
import COINBASE_ICON from 'assets/wallets/coinbase-icon.svg'
import Z_WALLET_ICON from 'assets/wallets/z-wallet-icon.svg'
import { isMobile } from 'utils/userAgent'

import { EXTERNAL_SERVICES_CONFIG, NETWORK_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { RPC_URLS } from '../constants/networks'
import { Connection, ConnectionType } from './types'
import { getInjection, getIsCoinbaseWallet, getIsInjected, getIsMetaMaskWallet } from './utils'
import { ZWalletConnector } from './zWalletConnector'

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) =>
    new Network({
      actions,
      urlMap: RPC_URLS,
      defaultChainId: ZEPHYR_CHAIN_ID,
    })
)
export const networkConnection: Connection = {
  getName: () => 'Network',
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
  shouldDisplay: () => false,
}

const getIsCoinbaseWalletBrowser = () => isMobile && getIsCoinbaseWallet()
const getIsMetaMaskBrowser = () => isMobile && getIsMetaMaskWallet()
const getIsInjectedMobileBrowser = () => getIsCoinbaseWalletBrowser() || getIsMetaMaskBrowser()

const getShouldAdvertiseMetaMask = () =>
  !getIsMetaMaskWallet() && !isMobile && (!getIsInjected() || getIsCoinbaseWallet())
const getIsGenericInjector = () => getIsInjected() && !getIsMetaMaskWallet() && !getIsCoinbaseWallet()

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))

export const injectedConnection: Connection = {
  getName: () => getInjection().name,
  connector: web3Injected,
  hooks: web3InjectedHooks,
  type: ConnectionType.INJECTED,
  getIcon: (isDarkMode: boolean) => getInjection(isDarkMode).icon,
  shouldDisplay: () => getIsMetaMaskWallet() || getShouldAdvertiseMetaMask() || getIsGenericInjector(),
  // If on non-injected, non-mobile browser, prompt user to install Metamask
  overrideActivate: () => {
    if (getShouldAdvertiseMetaMask()) {
      window.open('https://metamask.io/', 'inst_metamask')
      return true
    }
    return false
  },
}

const [web3WalletConnect, web3WalletConnectHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: RPC_URLS[ZEPHYR_CHAIN_ID][0],
        appName: 'Horswap',
        appLogoUrl: HORSWAP_LOGO,
        reloadOnDisconnect: false,
      },
      onError,
    })
)
const coinbaseWalletConnection: Connection = {
  getName: () => 'Coinbase Wallet',
  connector: web3WalletConnect,
  hooks: web3WalletConnectHooks,
  type: ConnectionType.COINBASE_WALLET,
  getIcon: () => COINBASE_ICON,
  shouldDisplay: () =>
    Boolean((isMobile && !getIsInjectedMobileBrowser()) || !isMobile || getIsCoinbaseWalletBrowser()),
  // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
  overrideActivate: () => {
    if (isMobile && !getIsInjectedMobileBrowser()) {
      window.open('https://go.cb-w.com/mtUDhEZPy1', 'cbwallet')
      return true
    }
    return false
  },
}

const [web3ZWallet, web3ZWalletHooks] = initializeConnector<ZWalletConnector>(
  (actions) =>
    new ZWalletConnector(actions, {
      clientUrl: EXTERNAL_SERVICES_CONFIG.Z_WALLET_CLIENT_URL,
      chainId: NETWORK_CONFIG.CHAIN_ID,
    })
)
const zWalletConnection: Connection = {
  getName: () => 'Z Wallet',
  connector: web3ZWallet,
  hooks: web3ZWalletHooks,
  type: ConnectionType.Z_WALLET,
  getIcon: () => Z_WALLET_ICON,
  shouldDisplay: () => true,
}

export const connections = [injectedConnection, coinbaseWalletConnection, zWalletConnection, networkConnection]

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = connections.find((connection) => connection.connector === c)
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return injectedConnection
      case ConnectionType.COINBASE_WALLET:
        return coinbaseWalletConnection
      case ConnectionType.Z_WALLET:
        return zWalletConnection
      case ConnectionType.NETWORK:
        return networkConnection
    }
  }
}
