import { useMemo } from 'react'
import { Currency, Price, CurrencyAmount } from '@uniswap/sdk-core'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'

const zephyrApolloClient = new ApolloClient({
  link: new HttpLink({
    uri: process.env.REACT_APP_AWS_API_ENDPOINT || 'https://api.dex-zephyr.cloudbuilder.ru/subgraphs/name/v3-tokens-mainnet',
  }),
  cache: new InMemoryCache(),
})

const PRICE_POLL_INTERVAL = 30000 // 30 seconds

const PRICING_QUERY = gql`
  query PricingData {
    bundle(id: "1") {
      ethPriceUSD
    }
    pools(first: 50, orderBy: totalValueLockedUSD, orderDirection: desc) {
      token0 { id }
      token1 { id }
      token0Price
      token1Price
    }
  }
`

export function useZephyrTokenPricing(): Map<string, number> {
  const { data } = useQuery(PRICING_QUERY, {
    client: zephyrApolloClient,
    pollInterval: PRICE_POLL_INTERVAL,
  })

  return useMemo(() => {
    const priceMap = new Map<string, number>()
    
    if (!data?.bundle?.ethPriceUSD || !data?.pools) {
      return priceMap
    }

    const ethPrice = parseFloat(data.bundle.ethPriceUSD)
    const wrappedToken = WRAPPED_NATIVE_CURRENCY[UniverseChainId.Zephyr]
    
    priceMap.set('ZERO', ethPrice)
    if (wrappedToken) {
      priceMap.set(wrappedToken.address.toLowerCase(), ethPrice)
    }

    data.pools.forEach((pool: any) => {
      const token0Price = parseFloat(pool.token0Price)
      const token1Price = parseFloat(pool.token1Price)
      
      if (token0Price > 0 && token1Price > 0) {
        const token0Addr = pool.token0.id.toLowerCase()
        const token1Addr = pool.token1.id.toLowerCase()
        
        // If we know token0 price, calculate token1
        if (priceMap.has(token0Addr) && !priceMap.has(token1Addr)) {
          priceMap.set(token1Addr, priceMap.get(token0Addr)! / token0Price)
        }
        
        // If we know token1 price, calculate token0
        if (priceMap.has(token1Addr) && !priceMap.has(token0Addr)) {
          priceMap.set(token0Addr, priceMap.get(token1Addr)! / token1Price)
        }
      }
    })

    return priceMap
  }, [data])
}

export function useZephyrPrice(
  baseCurrency?: Currency,
  quoteCurrency?: Currency,
): Price<Currency, Currency> | undefined {
  const tokenPrices = useZephyrTokenPricing()

  return useMemo(() => {
    if (!baseCurrency || !quoteCurrency || baseCurrency.chainId !== UniverseChainId.Zephyr) {
      return undefined
    }

    const baseKey = baseCurrency.isNative ? 'ZERO' : baseCurrency.address.toLowerCase()
    const quoteKey = quoteCurrency.isNative ? 'ZERO' : quoteCurrency.address.toLowerCase()

    const basePrice = tokenPrices.get(baseKey)
    const quotePrice = tokenPrices.get(quoteKey)

    if (!basePrice || !quotePrice || basePrice <= 0 || quotePrice <= 0) {
      return undefined
    }

    const ratio = basePrice / quotePrice
    const baseAmount = CurrencyAmount.fromRawAmount(baseCurrency, 10 ** baseCurrency.decimals)
    const quoteAmount = CurrencyAmount.fromRawAmount(quoteCurrency, Math.floor(ratio * 10 ** quoteCurrency.decimals))

    return new Price(baseCurrency, quoteCurrency, baseAmount.quotient, quoteAmount.quotient)
  }, [baseCurrency, quoteCurrency, tokenPrices])
} 