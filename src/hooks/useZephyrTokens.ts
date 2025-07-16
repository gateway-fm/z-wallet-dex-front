import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useSearchTokens, useTrendingTokens } from './useSearchTokens'

/**
 * Hook that uses only GraphQL tokens for Zephyr network, default tokens for others
 */
export function useZephyrTokens(): { [address: string]: Token } {
  const { data: graphqlTokens } = useTrendingTokens(20)

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (graphqlTokens) {
      for (const tokenResult of graphqlTokens) {
        const token = tokenResult.currency
        const address = token.address.toLowerCase()
        tokens[address] = token
      }
    }

    return tokens
  }, [graphqlTokens])
}

/**
 * Hook for searching tokens with GraphQL integration
 */
export function useZephyrTokenSearch(searchQuery: string, chainId: number | undefined) {
  const { data: searchResults, loading } = useSearchTokens({
    searchQuery,
    skip: chainId !== ZEPHYR_CHAIN_ID || !searchQuery || searchQuery.length < 2,
  })

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (searchResults) {
      for (const tokenResult of searchResults) {
        const token = tokenResult.currency
        const address = token.address.toLowerCase()
        tokens[address] = token
      }
    }

    return { tokens, loading }
  }, [searchResults, loading])
}
