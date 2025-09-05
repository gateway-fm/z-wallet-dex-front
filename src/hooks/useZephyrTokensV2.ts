import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { NETWORK_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenSearch, useTrendingTokens } from './useTokenSearch'

// Global cache for all discovered tokens
const globalTokenCache: { [address: string]: Token } = {}

// Global cache for token metadata (symbol, name)
const globalTokenMetadata: { [address: string]: { symbol: string; name: string; decimals: number } } = {}

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
  volume: string
  price_in_base: string
}): Token | null {
  try {
    const token = new Token(ZEPHYR_CHAIN_ID, tokenData.address, tokenData.decimals, tokenData.symbol, tokenData.name)
    const address = token.address.toLowerCase()
    globalTokenCache[address] = token
    globalTokenMetadata[address] = {
      symbol: tokenData.symbol,
      name: tokenData.name,
      decimals: tokenData.decimals,
    }
    return token
  } catch (error) {
    return null
  }
}

export function useZephyrTokens(): { [address: string]: Token } {
  const { tokens: apiTokens } = useTrendingTokens(100)

  return useMemo(() => {
    const tokens: { [address: string]: Token } = { ...globalTokenCache }

    if (apiTokens) {
      for (const tokenData of apiTokens) {
        const token = createTokenFromApiData(tokenData)
        if (token) {
          const address = token.address.toLowerCase()
          if (!tokens[address] || isTokenPreferrable(token, tokens[address])) {
            tokens[address] = token
          }
        }
      }
    }

    return tokens
  }, [apiTokens])
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
          const address = token.address.toLowerCase()
          tokens[address] = token
        }
      }
    }

    return { tokens, loading: loading && !shouldSkip }
  }, [searchResults, loading, shouldSkip])
}

// eslint-disable-next-line import/no-unused-modules
export function getTokenMetadata(address: string): { symbol: string; name: string; decimals: number } | null {
  const lowerAddress = address.toLowerCase()
  return globalTokenMetadata[lowerAddress] || null
}
