import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenSearch, useTrendingTokens } from './useTokenSearch'

function createTokenFromApiData(tokenData: {
  address: string
  symbol: string
  name: string
  decimals: number
}): Token | null {
  try {
    return new Token(ZEPHYR_CHAIN_ID, tokenData.address, tokenData.decimals, tokenData.symbol, tokenData.name)
  } catch (error) {
    console.warn('Failed to create token from API data:', tokenData, error)
    return null
  }
}

export function useZephyrTokens(): { [address: string]: Token } {
  const { tokens: apiTokens } = useTrendingTokens(20)

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (apiTokens) {
      for (const tokenData of apiTokens) {
        const token = createTokenFromApiData(tokenData)
        if (token) {
          const address = token.address.toLowerCase()
          tokens[address] = token
        }
      }
    }

    return tokens
  }, [apiTokens])
}

export function useZephyrTokenSearch(searchQuery: string, chainId: number | undefined) {
  const { tokens: searchResults, loading } = useTokenSearch(searchQuery, 20)

  const shouldSkip = chainId !== ZEPHYR_CHAIN_ID || !searchQuery || searchQuery.length < 2

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (!shouldSkip && searchResults) {
      for (const tokenData of searchResults) {
        const token = createTokenFromApiData(tokenData)
        if (token) {
          const address = token.address.toLowerCase()
          tokens[address] = token
        }
      }
    }

    return { tokens, loading: loading && !shouldSkip }
  }, [searchResults, loading, shouldSkip])
}
