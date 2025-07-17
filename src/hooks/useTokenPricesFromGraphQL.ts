import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client'
import { Currency, Price } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { USDC_ZEPHYR } from '../constants/tokens'
import { zephyrGraphQLClient } from '../data/graphql/client'
import { CACHE_POLICIES, POLLING_INTERVALS, QUERY_LIMITS } from '../data/graphql/constants'
import { TokenPriceData } from '../data/graphql/types'

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
      first: ${QUERY_LIMITS.MAX_PRICE_POOLS}
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
      volumeUSD
    }
  }
`

/**
 * Calculate token price from pool data using USDC as base currency
 * @param tokenAddress - The token address to calculate price for
 * @param pools - Pool data from GraphQL
 * @returns Price in USD or undefined if not available
 */
function calculateTokenPrice(tokenAddress: string, pools: any[]): number | undefined {
  const usdcAddress = USDC_ZEPHYR.address.toLowerCase()
  const targetAddress = tokenAddress.toLowerCase()

  // Find pools that contain both the target token and USDC
  const relevantPools = pools.filter(
    (pool) =>
      (pool.token0.id.toLowerCase() === targetAddress && pool.token1.id.toLowerCase() === usdcAddress) ||
      (pool.token1.id.toLowerCase() === targetAddress && pool.token0.id.toLowerCase() === usdcAddress)
  )

  if (relevantPools.length === 0) return undefined

  // Use the pool with highest TVL for most accurate pricing
  const bestPool = relevantPools[0]

  // Determine if target token is token0 or token1
  const isToken0 = bestPool.token0.id.toLowerCase() === targetAddress

  // token0Price = token1/token0, token1Price = token0/token1
  // If USDC is token1, then token0Price gives us the price of token0 in USDC
  // If USDC is token0, then token1Price gives us the price of token1 in USDC
  const usdcIsToken1 = bestPool.token1.id.toLowerCase() === usdcAddress

  if (isToken0 && usdcIsToken1) {
    // Target token is token0, USDC is token1
    // token0Price = USDC per target token
    return parseFloat(bestPool.token0Price)
  } else if (!isToken0 && !usdcIsToken1) {
    // Target token is token1, USDC is token0
    // token1Price = USDC per target token
    return parseFloat(bestPool.token1Price)
  }

  return undefined
}

/**
 * Hook to get token prices from GraphQL pools for Zephyr network
 */
// eslint-disable-next-line import/no-unused-modules
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
    errorPolicy: CACHE_POLICIES.ERROR_POLICY,
    fetchPolicy: CACHE_POLICIES.DEFAULT,
    pollInterval: POLLING_INTERVALS.TOKEN_PRICES,
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
// eslint-disable-next-line import/no-unused-modules
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

/**
 * Helper hook to get USD prices for currencies using GraphQL
 * @param currencies Array of currencies to get prices for
 */
// eslint-disable-next-line import/no-unused-modules
export function useUSDPricesFromGraphQL(currencies: (Currency | undefined)[]): {
  [address: string]: Price<Currency, Currency> | undefined
} {
  const tokenAddresses = useMemo(
    () =>
      currencies
        .filter((currency): currency is Currency => !!currency?.isToken)
        .map((currency) => currency.wrapped.address),
    [currencies]
  )

  const { data: priceData } = useTokenPricesFromGraphQL(tokenAddresses)

  return useMemo(() => {
    const prices: { [address: string]: Price<Currency, Currency> | undefined } = {}

    currencies.forEach((currency) => {
      if (!currency?.isToken) return

      const address = currency.wrapped.address.toLowerCase()
      const priceInfo = priceData[address]

      if (priceInfo && priceInfo.priceUSD > 0) {
        try {
          prices[address] = new Price(
            currency,
            USDC_ZEPHYR, // Quote currency (USDC)
            '1', // Base amount (1 unit of the token)
            (priceInfo.priceUSD * 10 ** USDC_ZEPHYR.decimals).toFixed(0) // Quote amount (price in USDC scaled)
          )
        } catch (error) {
          console.warn('Failed to create price for token:', currency.symbol, error)
        }
      }
    })

    return prices
  }, [currencies, priceData])
}
