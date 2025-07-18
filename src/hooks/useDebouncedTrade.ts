import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useMemo } from 'react'
import { InterfaceTrade, QuoteMethod, TradeState } from 'state/routing/types'
import { RouterPreference } from 'state/routing/types'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { ZERO_PERCENT } from '../constants/misc'
import { useRoutingAPITrade } from '../state/routing/useRoutingAPITrade'
import useAutoRouterSupported from './useAutoRouterSupported'
import useDebounce from './useDebounce'
import { useZephyrRouting } from './useZephyrRouting'

const DEBOUNCE_TIME = 350

/**
 * Returns the debounced v2+v3 trade for a desired swap.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 * @param routerPreferenceOverride force useRoutingAPITrade to use a specific RouterPreference
 * @param account the connected address
 *
 */
export function useDebouncedTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  routerPreferenceOverride?: RouterPreference,
  account?: string,
  inputTax?: Percent,
  outputTax?: Percent
): {
  state: TradeState
  trade?: InterfaceTrade
  method?: QuoteMethod
  swapQuoteLatency?: number
} {
  const { chainId } = useWeb3React()
  const autoRouterSupported = useAutoRouterSupported()

  const inputs = useMemo<[CurrencyAmount<Currency> | undefined, Currency | undefined]>(
    () => [amountSpecified, otherCurrency],
    [amountSpecified, otherCurrency]
  )
  const isDebouncing = useDebounce(inputs, DEBOUNCE_TIME) !== inputs

  const isWrap = useMemo(() => {
    if (!chainId || !amountSpecified || !otherCurrency) return false
    const weth = WRAPPED_NATIVE_CURRENCY[chainId]
    return Boolean(
      (amountSpecified.currency.isNative && weth?.equals(otherCurrency)) ||
        (otherCurrency.isNative && weth?.equals(amountSpecified.currency))
    )
  }, [amountSpecified, chainId, otherCurrency])

  const routerPreference = RouterPreference.CLIENT

  const skipBothFetches = !autoRouterSupported || isWrap
  const skipRoutingFetch = skipBothFetches || isDebouncing

  // Use Zephyr routing for Zephyr network
  const zephyrRouting = useZephyrRouting(tradeType, amountSpecified, otherCurrency)
  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID

  const routingApiTradeResult = useRoutingAPITrade(
    skipRoutingFetch || isZephyrNetwork, // Skip regular routing for Zephyr
    tradeType,
    amountSpecified,
    otherCurrency,
    routerPreferenceOverride ?? routerPreference,
    account,
    inputTax,
    outputTax
  )

  // For Zephyr network, use custom routing
  const zephyrTradeResult = useMemo(() => {
    if (!isZephyrNetwork || !zephyrRouting.inputAmount || !zephyrRouting.outputAmount) {
      return { state: TradeState.INVALID }
    }

    try {
      // Create a simple mock trade object for Zephyr
      const mockTrade = {
        inputAmount: zephyrRouting.inputAmount,
        outputAmount: zephyrRouting.outputAmount,
        postTaxOutputAmount: zephyrRouting.outputAmount,
        tradeType,
        route:
          zephyrRouting.route ||
          `${zephyrRouting.inputAmount.currency.symbol} → ${zephyrRouting.outputAmount.currency.symbol}`,
        // Add tax properties (no tax for Zephyr tokens by default)
        inputTax: inputTax || ZERO_PERCENT,
        outputTax: outputTax || ZERO_PERCENT,
        // Add required methods for interface compatibility
        minimumAmountOut: (slippage: Percent) => {
          // Calculate minimum amount out considering slippage
          const slippageBps = parseInt(slippage.multiply(100).toFixed(0))
          const minAmount = zephyrRouting.outputAmount!.multiply(new Percent(10000 - slippageBps, 10000))
          return CurrencyAmount.fromRawAmount(zephyrRouting.outputAmount!.currency, minAmount.quotient)
        },
        maximumAmountIn: (slippage: Percent) => {
          // Calculate maximum amount in considering slippage
          const slippageBps = parseInt(slippage.multiply(100).toFixed(0))
          const maxAmount = zephyrRouting.inputAmount!.multiply(new Percent(10000 + slippageBps, 10000))
          return CurrencyAmount.fromRawAmount(zephyrRouting.inputAmount!.currency, maxAmount.quotient)
        },
        priceImpact: new Percent(50, 10000), // 0.5% mock price impact
        executionPrice: new Price(
          zephyrRouting.inputAmount.currency,
          zephyrRouting.outputAmount.currency,
          zephyrRouting.inputAmount.quotient,
          zephyrRouting.outputAmount.quotient
        ),
        // Add gas estimate properties
        gasUseEstimateUSD: 0.1, // Mock gas estimate for display
        totalGasUseEstimateUSD: 0.1,
        // Add approval info (Zephyr tokens don't need approval by default)
        approveInfo: {
          needsApprove: false,
          approveGasEstimateUSD: 0,
        },
        // Add swaps property for routing diagram compatibility
        swaps: [
          {
            route: {
              path: [zephyrRouting.inputAmount.currency, zephyrRouting.outputAmount.currency],
              pools: [],
              protocol: Protocol.V3, // Use proper Protocol enum
            },
            inputAmount: zephyrRouting.inputAmount,
            outputAmount: zephyrRouting.outputAmount,
          },
        ],
      }

      return {
        state: TradeState.VALID,
        trade: mockTrade as any, // Type assertion for interface compatibility
        method: QuoteMethod.CLIENT_SIDE,
      }
    } catch (error) {
      console.error('Failed to create Zephyr trade:', error)
      return { state: TradeState.INVALID }
    }
  }, [isZephyrNetwork, zephyrRouting, tradeType, inputTax, outputTax])

  const finalResult = isZephyrNetwork ? zephyrTradeResult : routingApiTradeResult

  return finalResult
}
