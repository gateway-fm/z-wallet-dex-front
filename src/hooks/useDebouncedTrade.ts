/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useMemo } from 'react'
import { ClassicTrade, InterfaceTrade, QuoteMethod, TradeState } from 'state/routing/types'
import { RouterPreference } from 'state/routing/types'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { ZERO_PERCENT } from '../constants/misc'
import { getZephyrPoolParams } from '../constants/zephyr'
import { useRoutingAPITrade } from '../state/routing/useRoutingAPITrade'
import useAutoRouterSupported from './useAutoRouterSupported'
import useDebounce from './useDebounce'
import { useZephyrRoutingV2 } from './useZephyrRoutingV2'

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
  const zephyrRouting = useZephyrRoutingV2(tradeType, amountSpecified, otherCurrency, account)
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

  // For Zephyr network, use custom routing with ClassicTrade
  const zephyrTradeResult = useMemo(() => {
    // Check if routing failed or no route found
    if (!isZephyrNetwork || zephyrRouting.error || !zephyrRouting.inputAmount || !zephyrRouting.outputAmount) {
      if (isZephyrNetwork && zephyrRouting.error) {
        console.warn('Zephyr routing error:', zephyrRouting.error)
        return { state: TradeState.NO_ROUTE_FOUND }
      }
      return { state: TradeState.INVALID }
    }

    // For now, return a synchronous result with fallback values
    try {
      // Calculate actual price based on API routing results
      const actualPrice = zephyrRouting.outputAmount.divide(zephyrRouting.inputAmount)
      // Use actual price for pool parameters instead of 1:1
      const inputToken = zephyrRouting.inputAmount.currency.wrapped
      const outputToken = zephyrRouting.outputAmount.currency.wrapped

      // Sort tokens for pool creation (Uniswap V3 requirement)
      const [token0, token1] = inputToken.sortsBefore(outputToken)
        ? [inputToken, outputToken]
        : [outputToken, inputToken]

      // Adjust price ratio based on token order
      let priceRatio
      if (inputToken.sortsBefore(outputToken)) {
        // Input is token0, output is token1: price = output/input
        priceRatio = {
          numerator: actualPrice.asFraction.numerator,
          denominator: actualPrice.asFraction.denominator,
        }
      } else {
        // Input is token1, output is token0: price = input/output (inverted)
        priceRatio = {
          numerator: actualPrice.asFraction.denominator,
          denominator: actualPrice.asFraction.numerator,
        }
      }

      const { sqrtPriceX96, tick, liquidity } = getZephyrPoolParams(token0, token1, priceRatio)
      const pool = new Pool(token0, token1, FeeAmount.MEDIUM, sqrtPriceX96, liquidity, tick)

      const v3Route = new V3Route([pool], zephyrRouting.inputAmount.currency, zephyrRouting.outputAmount.currency)

      const classicTrade = new ClassicTrade({
        v3Routes: [
          {
            routev3: v3Route,
            inputAmount: zephyrRouting.inputAmount,
            outputAmount: zephyrRouting.outputAmount,
          },
        ],
        v2Routes: [],
        tradeType,
        gasUseEstimateUSD: 0, // No gas fees in this solution
        approveInfo: { needsApprove: false },
        quoteMethod: QuoteMethod.CLIENT_SIDE,
        inputTax: inputTax || ZERO_PERCENT,
        outputTax: outputTax || ZERO_PERCENT,
        blockNumber: null,
        requestId: `zephyr-${Date.now()}`,
      })

      return { state: TradeState.VALID, trade: classicTrade }
    } catch (error) {
      console.error('Failed to create Zephyr trade:', error)
      return { state: TradeState.NO_ROUTE_FOUND }
    }
  }, [
    isZephyrNetwork,
    zephyrRouting.inputAmount,
    zephyrRouting.outputAmount,
    zephyrRouting.error,
    tradeType,
    inputTax,
    outputTax,
  ])

  const finalResult = isZephyrNetwork ? zephyrTradeResult : routingApiTradeResult

  return finalResult
}
