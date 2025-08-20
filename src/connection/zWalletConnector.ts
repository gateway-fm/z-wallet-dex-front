import type { Actions } from '@web3-react/types'
import { Connector } from '@web3-react/types'
import { zWalletClient } from 'z-wallet-sdk'

import { EXTERNAL_SERVICES_CONFIG } from '../config/zephyr'

interface ZWalletConnectorOptions {
  clientUrl: string
  chainId?: number
}

const Z_WALLET_STORAGE_KEY = 'z_wallet_state'

interface ZWalletPersistedState {
  walletInfo: any
  isConnected: boolean
  lastConnected: number
}

function getPersistedZWalletState(): ZWalletPersistedState | null {
  try {
    const stored = localStorage.getItem(Z_WALLET_STORAGE_KEY)
    if (stored) {
      const state = JSON.parse(stored) as ZWalletPersistedState
      const now = Date.now()
      const ttl = EXTERNAL_SERVICES_CONFIG.Z_WALLET_PERSISTENCE_TTL
      if (now - state.lastConnected < ttl) {
        return state
      }
    }
  } catch (error) {
    console.debug('Failed to parse persisted Z Wallet state', error)
  }
  return null
}

function setPersistedZWalletState(walletInfo: any, isConnected: boolean) {
  try {
    const state: ZWalletPersistedState = {
      walletInfo,
      isConnected,
      lastConnected: Date.now(),
    }
    localStorage.setItem(Z_WALLET_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.debug('Failed to persist Z Wallet state', error)
  }
}

function clearPersistedZWalletState() {
  try {
    localStorage.removeItem(Z_WALLET_STORAGE_KEY)
  } catch (error) {
    console.debug('Failed to clear persisted Z Wallet state', error)
  }
}

export class ZWalletConnector extends Connector {
  private readonly clientUrl: string
  private readonly chainId: number

  constructor(actions: Actions, options: ZWalletConnectorOptions, connectEagerly = false) {
    super(actions)

    this.clientUrl = options.clientUrl
    this.chainId = options.chainId || 1417429182

    if (connectEagerly) {
      void this.connectEagerly()
    }
  }

  public async connectEagerly(): Promise<void> {
    const cancelActivation = this.actions.startActivation()

    try {
      // Set client URL for this instance
      zWalletClient.clientUrl = this.clientUrl

      // Try to restore persisted state
      const persistedState = getPersistedZWalletState()

      if (persistedState && persistedState.isConnected && persistedState.walletInfo) {
        console.debug('Restoring Z Wallet connection from persisted state')

        // Restore the client state
        zWalletClient.walletInfo = persistedState.walletInfo
        zWalletClient.isConnected = true

        this.actions.update({
          chainId: this.chainId,
          accounts: [persistedState.walletInfo.zeroWallet],
        })
      } else {
        console.debug('No valid persisted Z Wallet state found')
        cancelActivation()
      }
    } catch (error) {
      console.debug('Failed to connect eagerly to Z Wallet', error)
      clearPersistedZWalletState()
      cancelActivation()
    }
  }

  public async activate(): Promise<void> {
    const cancelActivation = this.actions.startActivation()

    try {
      zWalletClient.clientUrl = this.clientUrl

      await zWalletClient.connect()

      if (zWalletClient.isConnected && zWalletClient.walletInfo) {
        // Save successful connection state
        setPersistedZWalletState(zWalletClient.walletInfo, true)

        this.actions.update({
          chainId: this.chainId,
          accounts: [zWalletClient.walletInfo.zeroWallet],
        })
      } else {
        throw new Error(zWalletClient.error || 'Failed to connect to Z Wallet')
      }
    } catch (error) {
      console.debug('Failed to activate Z Wallet', error)
      clearPersistedZWalletState()
      cancelActivation()
      throw error
    }
  }

  public async deactivate(): Promise<void> {
    // Clear persisted state on disconnect
    clearPersistedZWalletState()

    // Reset Z Wallet client state
    zWalletClient.isConnected = false
    zWalletClient.walletInfo = null
    zWalletClient.error = null

    // Reset connector state
    this.actions.resetState()
  }

  public getSupportedChainIds(): number[] {
    return [this.chainId]
  }
}
