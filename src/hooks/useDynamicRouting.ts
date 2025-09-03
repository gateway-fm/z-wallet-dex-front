import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'

import { NETWORK_CONFIG, shouldIncludeInQuickAccess } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useZephyrTokens } from './useZephyrTokensV2'

/**
 * Hook that returns common base tokens for Zephyr network
 * Returns available tokens with base token (USDC) prioritized
 */
export function useCommonBases(): Token[] {
  const { chainId } = useWeb3React()
  const zephyrTokens = useZephyrTokens()

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID) {
      return []
    }

    const tokens = Object.values(zephyrTokens)
    if (tokens.length === 0) {
      return []
    }

    const filteredTokens = tokens.filter((token) => shouldIncludeInQuickAccess(token))
    const uniqueTokens = filteredTokens.reduce((acc, token) => {
      const symbol = token.symbol?.toUpperCase()
      if (symbol && !acc.some((t) => t.symbol?.toUpperCase() === symbol)) {
        acc.push(token)
      }
      return acc
    }, [] as Token[])

    return uniqueTokens
      .sort((a, b) => {
        const baseTokenAddress = NETWORK_CONFIG.BASE_TOKEN.ADDRESS.toLowerCase()

        // Base token always first
        if (a.address.toLowerCase() === baseTokenAddress) return -1
        if (b.address.toLowerCase() === baseTokenAddress) return 1
        return (a.symbol || '').localeCompare(b.symbol || '')
      })
      .slice(0, 6) // Return top 6 tokens
  }, [chainId, zephyrTokens])
}

/**
 * Hook that returns pinned pairs from top pools for Zephyr network
 */
export function usePinnedPairs(): [Token, Token][] {
  const { chainId } = useWeb3React()

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID) {
      return []
    }

    // Without pool data, we can't determine popular pairs
    // This could be enhanced later if needed
    return []
  }, [chainId])
}

/**
 * Hook that returns bases to track liquidity for
 * Uses available tokens instead of pool data
 */
export function useBasesToTrackLiquidityFor(): Token[] {
  const { chainId } = useWeb3React()
  const zephyrTokens = useZephyrTokens()

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID) {
      return []
    }

    const tokens = Object.values(zephyrTokens)
    if (tokens.length === 0) {
      return []
    }

    // Use quick access filtering - if no tokens configured, include all (top pools logic)
    const filteredTokens = tokens.filter((token) => shouldIncludeInQuickAccess(token))

    // Remove duplicates by symbol to avoid showing multiple tokens with same symbol
    const uniqueTokens = filteredTokens.reduce((acc, token) => {
      const symbol = token.symbol?.toUpperCase()
      if (symbol && !acc.some((t) => t.symbol?.toUpperCase() === symbol)) {
        acc.push(token)
      }
      return acc
    }, [] as Token[])

    // Sort tokens with base token first, then alphabetically
    return uniqueTokens
      .sort((a, b) => {
        const baseTokenAddress = NETWORK_CONFIG.BASE_TOKEN.ADDRESS.toLowerCase()

        // Base token always first
        if (a.address.toLowerCase() === baseTokenAddress) return -1
        if (b.address.toLowerCase() === baseTokenAddress) return 1

        // Then by symbol alphabetically
        return (a.symbol || '').localeCompare(b.symbol || '')
      })
      .slice(0, 10) // Return top 10 tokens for liquidity tracking
  }, [chainId, zephyrTokens])
}
