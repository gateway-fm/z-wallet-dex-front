import { Currency, Price } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { useTokensList } from '../api'
import { USDC_ZEPHYR } from '../constants/tokens'
import { TokenPriceData } from '../types/api'

const TOKEN_LIST_DEFAULT_LIMIT = 25

export function useTokenPrices(tokenAddresses: string[]): {
  data: { [address: string]: TokenPriceData }
  loading: boolean
  error: any
} {
  const normalizedAddresses = useMemo(() => tokenAddresses.map((addr) => addr.toLowerCase()), [tokenAddresses])
  const { data: tokensResponse, isLoading, error } = useTokensList(1, TOKEN_LIST_DEFAULT_LIMIT)

  const pricesMap = useMemo(() => {
    const pricesMap: { [address: string]: TokenPriceData } = {}

    if (!tokensResponse) {
      return pricesMap
    }

    const { ref_price, data: tokens } = tokensResponse
    const stableToken = ref_price.stable_token

    // Add stable token (USDC) with price 1.0
    const stableTokenAddress = stableToken.address.toLowerCase()
    if (normalizedAddresses.length === 0 || normalizedAddresses.includes(stableTokenAddress)) {
      pricesMap[stableTokenAddress] = {
        address: stableToken.address,
        symbol: stableToken.symbol,
        priceUSD: 1.0,
      }
    }

    // Add requested tokens from API with their derived prices
    tokens.forEach((token) => {
      const address = token.address.toLowerCase()

      // Only include tokens that were requested (if any specific addresses provided)
      if (normalizedAddresses.length === 0 || normalizedAddresses.includes(address)) {
        const derivedPrice = parseFloat(token.derived_base)

        pricesMap[address] = {
          address: token.address,
          symbol: token.symbol,
          priceUSD: derivedPrice, // derived_base is price relative to stable token
        }
      }
    })

    return pricesMap
  }, [tokensResponse, normalizedAddresses])

  return {
    data: pricesMap,
    loading: isLoading,
    error,
  }
}

export function useUSDCPrices(currencies: (Currency | undefined)[]): {
  [address: string]: Price<Currency, Currency> | undefined
} {
  const validCurrencies = currencies.filter((c): c is Currency => Boolean(c))
  const addresses = validCurrencies.map((c) => (c.isToken ? c.address : ''))

  const { data: priceData, loading } = useTokenPrices(addresses)

  return useMemo(() => {
    if (loading || !priceData) return {}

    const prices: { [address: string]: Price<Currency, Currency> | undefined } = {}

    validCurrencies.forEach((currency) => {
      const address = currency.isToken ? currency.address.toLowerCase() : ''
      const tokenPrice = priceData[address]

      if (tokenPrice && tokenPrice.priceUSD > 0) {
        try {
          const currencyBaseUnit = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(currency.decimals))
          const quoteAmountRounded = JSBI.BigInt(Math.round(tokenPrice.priceUSD * 10 ** USDC_ZEPHYR.decimals))

          prices[address] = new Price(currency, USDC_ZEPHYR, currencyBaseUnit, quoteAmountRounded.toString())
        } catch (error) {
          console.warn('Failed to create price for token:', currency.symbol, error)
        }
      }
    })

    return prices
  }, [validCurrencies, priceData, loading])
}

export function useTokenPrice(currency?: Currency): Price<Currency, Currency> | undefined {
  const { data: priceData } = useTokenPrices(currency?.isToken ? [currency.address] : [])

  if (!currency?.isToken || !priceData) return undefined

  const address = currency.address.toLowerCase()
  const tokenPrice = priceData[address]

  if (!tokenPrice || tokenPrice.priceUSD <= 0) return undefined

  try {
    const currencyBaseUnit = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(currency.decimals))
    const quoteAmountRounded = JSBI.BigInt(Math.round(tokenPrice.priceUSD * 10 ** USDC_ZEPHYR.decimals))

    return new Price(currency, USDC_ZEPHYR, currencyBaseUnit, quoteAmountRounded.toString())
  } catch (error) {
    console.warn('Failed to create price for token:', currency.symbol, error)
    return undefined
  }
}
