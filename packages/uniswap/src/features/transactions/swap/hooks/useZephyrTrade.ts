import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useZephyrPrice } from 'uniswap/src/features/dataApi/zephyrPricing'
import { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'

interface UseZephyrTradeParams {
  amountSpecified?: CurrencyAmount<Currency>
  otherCurrency?: Currency
  tradeType: TradeType
}

export function useZephyrTrade({
  amountSpecified,
  otherCurrency,
  tradeType,
}: UseZephyrTradeParams): TradeWithStatus {
  const inputCurrency = tradeType === TradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const outputCurrency = tradeType === TradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const price = useZephyrPrice(inputCurrency, outputCurrency)

  return useMemo(() => {
    if (!amountSpecified || !inputCurrency || !outputCurrency || !price) {
      return {
        isLoading: false,
        isFetching: false,
        trade: null,
        indicativeTrade: undefined,
        isIndicativeLoading: false,
        error: null,
        gasEstimate: undefined,
      }
    }

    try {
      let inputAmount: CurrencyAmount<Currency>
      let outputAmount: CurrencyAmount<Currency>

      if (tradeType === TradeType.EXACT_INPUT) {
        inputAmount = amountSpecified
        outputAmount = price.quote(amountSpecified)
      } else {
        outputAmount = amountSpecified
        inputAmount = price.invert().quote(amountSpecified)
      }

      const mockTrade = {
        inputAmount,
        outputAmount,
        executionPrice: price,
        tradeType,
        routing: 'CLASSIC' as const,
        quote: { requestId: 'zephyr-mock' },
        swapFee: undefined,
        inputTax: undefined,
        outputTax: undefined,
        slippageTolerance: undefined,
        indicative: false,
        quoteOutputAmount: outputAmount,
        quoteOutputAmountUserWillReceive: outputAmount,
      }

      return {
        isLoading: false,
        isFetching: false,
        trade: mockTrade as any, // Type assertion for compatibility
        indicativeTrade: undefined,
        isIndicativeLoading: false,
        error: null,
        gasEstimate: undefined,
      }
    } catch (error) {
      return {
        isLoading: false,
        isFetching: false,
        trade: null,
        indicativeTrade: undefined,
        isIndicativeLoading: false,
        error: error as Error,
        gasEstimate: undefined,
      }
    }
  }, [amountSpecified, inputCurrency, outputCurrency, price, tradeType])
} 