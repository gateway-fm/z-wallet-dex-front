import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client'
import { Currency, Price } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { USDC_ZEPHYR } from '../constants/tokens'
import { zephyrGraphQLClient } from '../data/graphql/client'

// eslint-disable-next-line import/no-unused-modules
export interface TokenPriceData {
  address: string
  symbol: string
  priceUSD: number
}

const POOLS_REFRESH_INTERVAL = 30000 // 30 seconds

// Query to get token prices from pools (relative to USDC)
const TOKEN_POOLS_QUERY = gql`
  query TokenPools($tokenIds: [String!]!) {
    pools(
      where: { 
        or: [
          { token0_in: $tokenIds, token1: "${USDC_ZEPHYR.address.toLowerCase()}" }
          { token1_in: $tokenIds, token0: "${USDC_ZEPHYR.address.toLowerCase()}" }
        ]
      }
      orderBy: totalValueLockedUSD
      orderDirection: desc
      first: 100
    ) {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
      token0Price
      token1Price
      totalValueLockedUSD
    }
  }
`

/**
 * Calculate USD price for a token from pool data
 */
function calculateTokenPrice(tokenAddress: string, pools: any[]): number | undefined {
  const usdcAddress = USDC_ZEPHYR.address.toLowerCase()
  const targetAddress = tokenAddress.toLowerCase()

  // Find the best pool (highest TVL) containing this token paired with USDC
  const relevantPools = pools.filter((pool) => {
    const token0Id = pool.token0.id.toLowerCase()
    const token1Id = pool.token1.id.toLowerCase()

    return (
      (token0Id === targetAddress && token1Id === usdcAddress) ||
      (token1Id === targetAddress && token0Id === usdcAddress)
    )
  })

  if (relevantPools.length === 0) {
    console.warn(`No USDC pool found for token ${tokenAddress}`)
    return undefined
  }

  // Use the pool with highest TVL
  const bestPool = relevantPools[0]
  const token0Id = bestPool.token0.id.toLowerCase()
  const token1Id = bestPool.token1.id.toLowerCase()

  if (token0Id === targetAddress && token1Id === usdcAddress) {
    // Token is token0, USDC is token1
    // token0Price tells us how much USDC per 1 token
    return parseFloat(bestPool.token0Price)
  } else if (token1Id === targetAddress && token0Id === usdcAddress) {
    // Token is token1, USDC is token0
    // token1Price tells us how much USDC per 1 token
    return parseFloat(bestPool.token1Price)
  }

  return undefined
}

/**
 * Hook to get token prices from GraphQL pools for Zephyr network
 */
export function useTokenPricesFromGraphQL(tokenAddresses: string[]): {
  data: { [address: string]: TokenPriceData }
  loading: boolean
  error: any
} {
  const normalizedAddresses = useMemo(() => tokenAddresses.map((addr) => addr.toLowerCase()), [tokenAddresses])

  const { data, loading, error } = useQuery(TOKEN_POOLS_QUERY, {
    variables: { tokenIds: normalizedAddresses },
    client: zephyrGraphQLClient,
    skip: normalizedAddresses.length === 0,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    pollInterval: POOLS_REFRESH_INTERVAL,
  })

  const pricesMap = useMemo(() => {
    if (!data?.pools) return {}

    const pricesMap: { [address: string]: TokenPriceData } = {}

    // Add USDC with price 1.0
    const usdcAddress = USDC_ZEPHYR.address.toLowerCase()
    pricesMap[usdcAddress] = {
      address: USDC_ZEPHYR.address,
      symbol: 'USDC',
      priceUSD: 1.0,
    }

    // Calculate prices for other tokens
    normalizedAddresses.forEach((address) => {
      if (address === usdcAddress) return // Skip USDC, already added

      const price = calculateTokenPrice(address, data.pools)
      if (price !== undefined) {
        // Find token symbol from pools data
        const tokenData = data.pools.find(
          (pool: any) => pool.token0.id.toLowerCase() === address || pool.token1.id.toLowerCase() === address
        )

        const token = tokenData?.token0.id.toLowerCase() === address ? tokenData.token0 : tokenData?.token1

        if (token) {
          pricesMap[address] = {
            address,
            symbol: token.symbol,
            priceUSD: price,
          }
        }
      }
    })

    return pricesMap
  }, [data, normalizedAddresses])

  return {
    data: pricesMap,
    loading: loading && normalizedAddresses.length > 0,
    error: error || null,
  }
}

/**
 * Hook to get a single token price from GraphQL
 */
// eslint-disable-next-line import/no-unused-modules
export function useTokenPriceFromGraphQL(tokenAddress?: string): {
  price?: number
  loading: boolean
  error: any
} {
  const addresses = useMemo(() => (tokenAddress ? [tokenAddress] : []), [tokenAddress])
  const { data, loading, error } = useTokenPricesFromGraphQL(addresses)

  const price = useMemo(() => {
    if (!tokenAddress || !data) return undefined
    const normalizedAddress = tokenAddress.toLowerCase()
    return data[normalizedAddress]?.priceUSD
  }, [tokenAddress, data])

  return {
    price,
    loading,
    error,
  }
}

/**
 * Hook to create a Price object from GraphQL data for Zephyr tokens
 */
export function useGraphQLTokenPrice(currency?: Currency): Price<Currency, typeof USDC_ZEPHYR> | undefined {
  const tokenAddress = currency?.isToken ? currency.address : undefined
  const { price: priceUSD } = useTokenPriceFromGraphQL(tokenAddress)

  return useMemo(() => {
    if (!currency || !priceUSD || currency.chainId !== ZEPHYR_CHAIN_ID) {
      return undefined
    }

    // For USDC, return 1:1 price
    if (currency.isToken && currency.address.toLowerCase() === USDC_ZEPHYR.address.toLowerCase()) {
      return new Price(currency, USDC_ZEPHYR, '1', '1')
    }

    // Convert USD price to USDC price (assuming 1 USD = 1 USDC)
    // Price represents how much USDC you get for 1 unit of the currency
    const priceInCents = Math.round(priceUSD * 1000000) // Convert to 6 decimal places for USDC

    return new Price(
      currency,
      USDC_ZEPHYR,
      '1000000', // 1 token in its base units
      priceInCents.toString() // Price in USDC (6 decimals)
    )
  }, [currency, priceUSD])
}
