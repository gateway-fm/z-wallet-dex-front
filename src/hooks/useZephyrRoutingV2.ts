import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo, useState, useEffect } from 'react'
import { getSwapData, SwapParams, SwapType } from '../lib/routing'

/**
 * New routing hook using blockchain team's solution
 */
export function useZephyrRoutingV2(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  route: string
  loading: boolean
  error?: string
  callData?: string
} {
  const [routingState, setRoutingState] = useState<{
    callData?: string
    amountQuoted?: bigint
    route: string
    loading: boolean
    error?: string
  }>({ route: '', loading: false })

  const swapParams = useMemo((): SwapParams | null => {
    if (!amountSpecified || !otherCurrency) return null

    const inputCurrency = amountSpecified.currency
    const outputCurrency = otherCurrency

    return {
      signer: '0x0000000000000000000000000000000000000000', // Will be set by the actual swap hook
      tokenIn: inputCurrency.wrapped.address,
      tokenOut: outputCurrency.wrapped.address,
      amount: BigInt(amountSpecified.quotient.toString()),
      swapType: tradeType === TradeType.EXACT_INPUT ? SwapType.EXACT_INPUT : SwapType.EXACT_OUTPUT,
      slippage: 1, // 1% default slippage
    }
  }, [amountSpecified, otherCurrency, tradeType])

  useEffect(() => {
    if (!swapParams) {
      setRoutingState({ route: '', loading: false })
      return
    }

    let cancelled = false

    const performRouting = async () => {
      setRoutingState({ route: '', loading: true })

      try {
        const { callData, amountQuoted } = await getSwapData(swapParams)

        if (cancelled) return

        // Build route description
        const inputSymbol = amountSpecified?.currency.symbol || 'Unknown'
        const outputSymbol = otherCurrency?.symbol || 'Unknown'
        const routeDescription = `${inputSymbol} → ${outputSymbol}`

        setRoutingState({
          callData,
          amountQuoted,
          route: routeDescription,
          loading: false,
        })
      } catch (error) {
        if (cancelled) return

        console.error('Routing failed:', error)
        setRoutingState({
          route: '',
          loading: false,
          error: error instanceof Error ? error.message : 'Routing failed',
        })
      }
    }

    performRouting()

    return () => {
      cancelled = true
    }
  }, [swapParams, amountSpecified, otherCurrency])

  return useMemo(() => {
    const { callData, amountQuoted, route, loading, error } = routingState

    if (loading || error || !amountQuoted || !amountSpecified || !otherCurrency) {
      return {
        route,
        loading,
        error,
        callData,
      }
    }

    // Convert bigint back to CurrencyAmount
    const quotedAmount = CurrencyAmount.fromRawAmount(otherCurrency, amountQuoted.toString())

    if (tradeType === TradeType.EXACT_INPUT) {
      return {
        inputAmount: amountSpecified,
        outputAmount: quotedAmount,
        route,
        loading,
        callData,
      }
    } else {
      return {
        inputAmount: quotedAmount,
        outputAmount: amountSpecified,
        route,
        loading,
        callData,
      }
    }
  }, [routingState, amountSpecified, otherCurrency, tradeType])
}
