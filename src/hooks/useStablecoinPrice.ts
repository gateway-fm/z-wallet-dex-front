import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { USDC_ZEPHYR } from '../constants/tokens'
import { useTokenPrice } from './useTokenPrices'

// NOTE: Stablecoin amounts used when calculating spot price for a given currency
const STABLECOIN_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Token> } = {
  [ZEPHYR_CHAIN_ID]: CurrencyAmount.fromRawAmount(USDC_ZEPHYR, 10_000e6),
}

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useStablecoinPrice(currency?: Currency): Price<Currency, Token> | undefined {
  const chainId = currency?.chainId
  const stablecoin = chainId ? STABLECOIN_AMOUNT_OUT[chainId]?.currency : undefined

  // For Zephyr network, use simplified API-based pricing
  const tokenPrice = useTokenPrice(currency)

  return useMemo(() => {
    if (!currency || !stablecoin) {
      return undefined
    }

    // Handle USDC/stablecoin (1:1 price)
    if (currency?.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    // For Zephyr network, use API price
    if (chainId === ZEPHYR_CHAIN_ID && tokenPrice) {
      return tokenPrice as Price<Currency, Token>
    }

    // For other networks, return undefined (not supported in this version)
    return undefined
  }, [currency, stablecoin, chainId, tokenPrice])
}

export function useStablecoinValue(currencyAmount: CurrencyAmount<Currency> | undefined | null) {
  const price = useStablecoinPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) return null
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}
