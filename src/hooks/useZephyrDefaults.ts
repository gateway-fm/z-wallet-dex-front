import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'

import { NETWORK_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useZephyrTokens } from './useZephyrTokensV2'

/**
 * Hook that returns the default token for Zephyr network
 * Prioritizes base token (USDC), then falls back to first available token
 */
export function useZephyrDefaultToken(): string | undefined {
  const { chainId } = useWeb3React()
  const zephyrTokens = useZephyrTokens()

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID) {
      return undefined
    }

    const tokenAddresses = Object.keys(zephyrTokens)
    if (tokenAddresses.length === 0) {
      return undefined
    }

    // First priority: base token (USDC)
    const baseTokenAddress = NETWORK_CONFIG.BASE_TOKEN.ADDRESS.toLowerCase()
    if (zephyrTokens[baseTokenAddress]) {
      return `${ZEPHYR_CHAIN_ID}-${baseTokenAddress}`
    }

    // Second priority: find USDC by symbol
    const usdcToken = Object.values(zephyrTokens).find((token) => token.symbol === 'USDC' || token.name === 'USD Coin')
    if (usdcToken) {
      return `${ZEPHYR_CHAIN_ID}-${usdcToken.address}`
    }

    // Fallback: use first available token
    const firstTokenAddress = tokenAddresses[0]
    return `${ZEPHYR_CHAIN_ID}-${firstTokenAddress}`
  }, [chainId, zephyrTokens])
}
