import { ChainId } from '@uniswap/sdk-core'
import { Connector } from '@web3-react/types'
import { networkConnection } from 'connection'
import { getChainInfo } from 'constants/chainInfo'
import { isSupportedChain, SupportedInterfaceChain } from 'constants/chains'
import { RPC_URLS } from 'constants/networks'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'
import { endSwitchingChain, startSwitchingChain } from 'state/wallets/reducer'

function getRpcUrl(chainId: SupportedInterfaceChain): string {
  // Only Zephyr network is supported
  return RPC_URLS[chainId][0]
}

export function useSwitchChain() {
  const dispatch = useAppDispatch()

  return useCallback(
    async (connector: Connector, chainId: ChainId) => {
      if (!isSupportedChain(chainId)) {
        throw new Error(`Chain ${chainId} not supported for connector (${typeof connector})`)
      } else {
        dispatch(startSwitchingChain(chainId))
        try {
          if ([networkConnection.connector].includes(connector)) {
            await connector.activate(chainId)
          } else {
            const info = getChainInfo(chainId)
            const addChainParameter = {
              chainId,
              chainName: info.label,
              rpcUrls: [getRpcUrl(chainId)],
              nativeCurrency: info.nativeCurrency,
              blockExplorerUrls: [info.explorer],
            }
            await connector.activate(addChainParameter)
          }
        } catch (error) {
          // In activating a new chain, the connector passes through a deactivated state.
          // If we fail to switch chains, it may remain in this state, and no longer be usable.
          // We defensively re-activate the connector to ensure the user does not notice any change.
          try {
            await connector.activate()
          } catch (error) {
            console.error('Failed to re-activate connector', error)
          }
          throw error
        } finally {
          dispatch(endSwitchingChain())
        }
      }
    },
    [dispatch]
  )
}
