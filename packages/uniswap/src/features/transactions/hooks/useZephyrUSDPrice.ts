import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useZephyrPrice } from 'uniswap/src/features/dataApi/zephyrPricing'
import { USDC_ZEPHYR } from 'uniswap/src/constants/tokens'

export function useZephyrUSDPrice(
  currencyAmount?: CurrencyAmount<Currency>,
  prefetchCurrency?: Currency,
): {
  data?: number
  isLoading: boolean
} {
  const currency = currencyAmount?.currency ?? prefetchCurrency
  
  const price = useZephyrPrice(currency, USDC_ZEPHYR)

  return useMemo(() => {
    if (!currencyAmount || !price || currency?.chainId !== UniverseChainId.Zephyr) {
      return { data: undefined, isLoading: false }
    }

    try {
      const usdcAmount = price.quote(currencyAmount)
      return {
        data: parseFloat(usdcAmount.toExact()),
        isLoading: false,
      }
    } catch {
      return { data: undefined, isLoading: false }
    }
  }, [currencyAmount, currency?.chainId, price])
} 