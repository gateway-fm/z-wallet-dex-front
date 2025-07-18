import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenSearch, useTrendingTokens } from './useTokenSearch'

/**
 * Convert GraphQL token data to Token instance
 */
function createTokenFromGraphQL(tokenData: {
  id: string
  symbol: string
  name: string
  decimals: string | number
}): Token | null {
  try {
    // Convert decimals to number if it's a string
    const decimals = typeof tokenData.decimals === 'string' ? parseInt(tokenData.decimals, 10) : tokenData.decimals

    return new Token(ZEPHYR_CHAIN_ID, tokenData.id, decimals, tokenData.symbol, tokenData.name)
  } catch (error) {
    console.warn('Failed to create token from GraphQL data:', tokenData, error)
    return null
  }
}

/**
 * Hook that uses only GraphQL tokens for Zephyr network
 */
export function useZephyrTokens(): { [address: string]: Token } {
  const { tokens: graphqlTokens } = useTrendingTokens(20)

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (graphqlTokens) {
      for (const tokenData of graphqlTokens) {
        const token = createTokenFromGraphQL(tokenData)
        if (token) {
          const address = token.address.toLowerCase()
          tokens[address] = token
        }
      }
    }

    return tokens
  }, [graphqlTokens])
}

/**
 * Hook for searching tokens with GraphQL integration
 */
export function useZephyrTokenSearch(searchQuery: string, chainId: number | undefined) {
  const { tokens: searchResults, loading } = useTokenSearch(searchQuery, 20)

  const shouldSkip = chainId !== ZEPHYR_CHAIN_ID || !searchQuery || searchQuery.length < 2

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (!shouldSkip && searchResults) {
      for (const tokenData of searchResults) {
        const token = createTokenFromGraphQL(tokenData)
        if (token) {
          const address = token.address.toLowerCase()
          tokens[address] = token
        }
      }
    }

    return { tokens, loading: loading && !shouldSkip }
  }, [searchResults, loading, shouldSkip])
}
