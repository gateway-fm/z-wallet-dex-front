import type { Actions } from '@web3-react/types'
import { Connector } from '@web3-react/types'
import { zWalletClient } from 'z-wallet-sdk'

interface ZWalletConnectorOptions {
  clientUrl: string
  chainId?: number
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
      zWalletClient.clientUrl = this.clientUrl

      if (zWalletClient.isConnected && zWalletClient.walletInfo) {
        this.actions.update({
          chainId: this.chainId,
          accounts: [zWalletClient.walletInfo.zeroWallet],
        })
      }
    } catch (error) {
      console.debug('Failed to connect eagerly to Z Wallet', error)
      cancelActivation()
    }
  }

  public async activate(): Promise<void> {
    const cancelActivation = this.actions.startActivation()

    try {
      zWalletClient.clientUrl = this.clientUrl

      await zWalletClient.connect()

      if (zWalletClient.isConnected && zWalletClient.walletInfo) {
        this.actions.update({
          chainId: this.chainId,
          accounts: [zWalletClient.walletInfo.zeroWallet],
        })
      } else {
        throw new Error(zWalletClient.error || 'Failed to connect to Z Wallet')
      }
    } catch (error) {
      console.debug('Failed to activate Z Wallet', error)
      cancelActivation()
      throw error
    }
  }

  public async deactivate(): Promise<void> {
    // Z Wallet SDK doesn't seem to have a disconnect method
    // Just reset the internal state
    this.actions.resetState()
  }

  public getSupportedChainIds(): number[] {
    return [this.chainId]
  }
}
