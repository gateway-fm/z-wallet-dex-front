import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useEffect, useMemo, useState } from 'react'

import { getSwapData, SwapParams, SwapType } from '../lib/routing'

interface RoutingResult {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  route: string
  loading: boolean
  error?: string
  callData?: string
}

/**
 * New routing hook using blockchain team's solution
 */
export function useZephyrRoutingV2(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  account?: string // Add account parameter
): RoutingResult {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Omit<RoutingResult, 'loading'>>({ route: '' })

  const swapParams = useMemo((): SwapParams | null => {
    if (!amountSpecified || !otherCurrency) {
      return null
    }

    return {
      signer: account || '0x0000000000000000000000000000000000000000', // Use real account if available
      recipient: account, // Set recipient to account
      tokenIn: amountSpecified.currency.wrapped.address,
      tokenOut: otherCurrency.wrapped.address,
      amount: BigInt(amountSpecified.quotient.toString()),
      swapType: tradeType === TradeType.EXACT_INPUT ? SwapType.EXACT_INPUT : SwapType.EXACT_OUTPUT,
      slippage: 1, // 1% default slippage
    }
  }, [amountSpecified, otherCurrency, tradeType, account])

  useEffect(() => {
    if (!swapParams) {
      setResult({ route: '' })
      setLoading(false)
      return
    }

    let cancelled = false

    const performRouting = async () => {
      setLoading(true)
      setResult({ route: '' })

      try {
        const { callData, amountQuoted } = await getSwapData(swapParams)

        if (cancelled) return

        // Build route description
        const inputSymbol = amountSpecified?.currency.symbol || 'Unknown'
        const outputSymbol = otherCurrency?.symbol || 'Unknown'
        const routeDescription = `${inputSymbol} → ${outputSymbol}`

        // Convert bigint back to CurrencyAmount for return values
        const quotedAmount = CurrencyAmount.fromRawAmount(otherCurrency!, amountQuoted.toString())

        const routingResult: Omit<RoutingResult, 'loading'> = {
          route: routeDescription,
          callData,
        }

        if (tradeType === TradeType.EXACT_INPUT) {
          routingResult.inputAmount = amountSpecified
          routingResult.outputAmount = quotedAmount
        } else {
          routingResult.inputAmount = quotedAmount
          routingResult.outputAmount = amountSpecified
        }

        setResult(routingResult)
      } catch (error) {
        if (cancelled) return

        console.error('Routing failed:', error)
        setResult({
          route: '',
          error: error instanceof Error ? error.message : 'Routing failed',
        })
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    performRouting()

    return () => {
      cancelled = true
    }
  }, [swapParams, amountSpecified, otherCurrency, tradeType])

  return useMemo(() => {
    return {
      ...result,
      loading,
    }
  }, [result, loading])
}
