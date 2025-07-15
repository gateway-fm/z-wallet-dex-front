import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useDefaultActiveTokens } from './Tokens'
import { useSearchTokens, useTrendingTokens } from './useSearchTokens'

/**
 * Hook that combines default active tokens with GraphQL tokens for Zephyr network
 */
export function useZephyrTokens(chainId: number | undefined): { [address: string]: Token } {
  const defaultTokens = useDefaultActiveTokens(chainId)

  // Only load GraphQL tokens for Zephyr network
  const { data: graphqlTokens } = useTrendingTokens(20)

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID) {
      return defaultTokens
    }

    // Start with default tokens
    const combinedTokens = { ...defaultTokens }

    // Add GraphQL tokens, avoiding duplicates
    if (graphqlTokens) {
      for (const tokenResult of graphqlTokens) {
        const token = tokenResult.currency
        const address = token.address.toLowerCase()

        // Only add if not already present (avoid duplicates)
        if (!combinedTokens[address]) {
          combinedTokens[address] = token
        }
      }
    }

    return combinedTokens
  }, [defaultTokens, graphqlTokens, chainId])
}

/**
 * Hook for searching tokens with GraphQL integration
 */
export function useZephyrTokenSearch(searchQuery: string, chainId: number | undefined) {
  const defaultTokens = useDefaultActiveTokens(chainId)

  // Use GraphQL search for Zephyr network
  const { data: searchResults, loading } = useSearchTokens({
    searchQuery,
    skip: chainId !== ZEPHYR_CHAIN_ID || !searchQuery || searchQuery.length < 2,
  })

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID) {
      return { tokens: defaultTokens, loading: false }
    }

    // Combine default tokens with search results
    const combinedTokens = { ...defaultTokens }

    if (searchResults) {
      for (const tokenResult of searchResults) {
        const token = tokenResult.currency
        const address = token.address.toLowerCase()
        combinedTokens[address] = token
      }
    }

    return { tokens: combinedTokens, loading }
  }, [defaultTokens, searchResults, loading, chainId])
}
