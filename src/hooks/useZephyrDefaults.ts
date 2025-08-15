import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTopPools } from './useProtocolStats'
import { useZephyrTokens } from './useZephyrTokensV2'

/**
 * Hook that returns the first token as default for Zephyr network
 * Tries pools first, falls back to first available token
 */
export function useZephyrDefaultToken(): string | undefined {
  const { chainId } = useWeb3React()
  const { pools } = useTopPools(1) // Get top pool for default token
  const zephyrTokens = useZephyrTokens() // Fallback to any available token

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID) {
      return undefined
    }

    // First try: get token from top pool
    if (pools && pools.length > 0) {
      const firstPool = pools[0]
      const firstToken = firstPool?.token0
      if (firstToken) {
        return `${ZEPHYR_CHAIN_ID}-${firstToken.id}`
      }
    }

    // Fallback: get first available token from GraphQL (prefer USDC if available)
    const tokenAddresses = Object.keys(zephyrTokens)
    if (tokenAddresses.length > 0) {
      // Try to find USDC first
      const usdcToken = Object.values(zephyrTokens).find((token) => token.symbol === 'USDC')
      if (usdcToken) {
        return `${ZEPHYR_CHAIN_ID}-${usdcToken.address}`
      }

      // Otherwise use first available token
      const firstTokenAddress = tokenAddresses[0]
      return `${ZEPHYR_CHAIN_ID}-${firstTokenAddress}`
    }

    return undefined
  }, [chainId, pools, zephyrTokens])
}
