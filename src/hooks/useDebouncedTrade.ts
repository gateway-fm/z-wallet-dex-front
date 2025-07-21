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

  // For Zephyr network, use custom routing with ClassicTrade
  const zephyrTradeResult = useMemo(() => {
    // Return a promise-like structure for now
    // In a real implementation, you'd want to use useAsync or similar
    if (!isZephyrNetwork || !zephyrRouting.inputAmount || !zephyrRouting.outputAmount) {
      return { state: TradeState.INVALID }
    }

    // For now, return a synchronous result with fallback values
    try {
      // Use proper 1:1 price accounting for decimals
      const { sqrtPriceX96, tick, liquidity } = getZephyrPoolParams(
        zephyrRouting.inputAmount.currency.wrapped,
        zephyrRouting.outputAmount.currency.wrapped
      )
      const pool = new Pool(
        zephyrRouting.inputAmount.currency.wrapped,
        zephyrRouting.outputAmount.currency.wrapped,
        FeeAmount.MEDIUM,
        sqrtPriceX96,
        liquidity,
        tick
      )

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
        gasUseEstimateUSD: 0.1, // fallback
        approveInfo: { needsApprove: false },
        quoteMethod: QuoteMethod.CLIENT_SIDE,
        inputTax: inputTax || ZERO_PERCENT,
        outputTax: outputTax || ZERO_PERCENT,
        blockNumber: null,
        requestId: `zephyr-${Date.now()}`,
      })

      return {
        state: TradeState.VALID,
        trade: classicTrade as InterfaceTrade,
        method: QuoteMethod.CLIENT_SIDE,
      }
    } catch (error) {
      console.error('Failed to create Zephyr ClassicTrade:', error)
      return { state: TradeState.INVALID }
    }
  }, [isZephyrNetwork, zephyrRouting, tradeType, inputTax, outputTax])

  const finalResult = isZephyrNetwork ? zephyrTradeResult : routingApiTradeResult

  return finalResult
}
