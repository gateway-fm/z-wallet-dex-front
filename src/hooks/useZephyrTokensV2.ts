import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { NETWORK_CONFIG, shouldIncludeInQuickAccess } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenSearch, useTrendingTokens } from './useTokenSearch'

function isTokenPreferrable(newToken: Token, existingToken: Token): boolean {
  const baseTokenAddress = NETWORK_CONFIG.BASE_TOKEN.ADDRESS.toLowerCase()
  const isBaseToken =
    newToken.address.toLowerCase() === baseTokenAddress &&
    (newToken.symbol === NETWORK_CONFIG.BASE_TOKEN.SYMBOL || newToken.name === NETWORK_CONFIG.BASE_TOKEN.NAME)
  const existingIsBaseToken =
    existingToken.address.toLowerCase() === baseTokenAddress &&
    (existingToken.symbol === NETWORK_CONFIG.BASE_TOKEN.SYMBOL || existingToken.name === NETWORK_CONFIG.BASE_TOKEN.NAME)

  // Base token always wins
  if (isBaseToken && !existingIsBaseToken) return true
  if (!isBaseToken && existingIsBaseToken) return false
  return false
}

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
  const { tokens: apiTokens, error } = useTrendingTokens(100)

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (error) console.error('Error loading tokens:', error)

    if (apiTokens) {
      for (const tokenData of apiTokens) {
        const token = createTokenFromApiData(tokenData)
        if (token) {
          // For trending tokens, include all tokens to show more options
            const address = token.address.toLowerCase()
            if (tokens[address]) {
              const existingToken = tokens[address]
              if (isTokenPreferrable(token, existingToken)) {
                tokens[address] = token
              }
            } else {
              tokens[address] = token
            }
          }
        }
      }
    }

    return tokens
  }, [apiTokens, error])
}

export function useZephyrTokenSearch(searchQuery: string, chainId: number | undefined) {
  const { tokens: searchResults, loading } = useTokenSearch(searchQuery, 100)

  const shouldSkip = chainId !== ZEPHYR_CHAIN_ID || !searchQuery || searchQuery.length < 2

  return useMemo(() => {
    const tokens: { [address: string]: Token } = {}

    if (!shouldSkip && searchResults) {
      for (const tokenData of searchResults) {
        const token = createTokenFromApiData(tokenData)
        if (token) {
          // For search results, include all tokens to show complete search results
            const address = token.address.toLowerCase()
            tokens[address] = token
        }
      }
    }

    return { tokens, loading: loading && !shouldSkip }
  }, [searchResults, loading, shouldSkip])
}
