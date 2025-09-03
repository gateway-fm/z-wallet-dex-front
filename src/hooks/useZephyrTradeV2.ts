import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'
import { TradeFillType } from 'state/routing/types'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useZephyrRoutingV2 } from './useZephyrRoutingV2'
import { useZephyrSwapV2 } from './useZephyrSwapV2'

/**
 * Unified hook that combines routing and swap functionality
 * Replaces the old useZephyrRouting + useZephyrSwap pattern
 */
export function useZephyrTradeV2(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
  allowedSlippage = 1
): {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  route: string
  loading: boolean
  error?: string
  executeSwap: (() => Promise<{ type: TradeFillType.Classic; response: any }>) | null
} {
  const { account, chainId } = useWeb3React()

  // Get routing data
  const { inputAmount, outputAmount, route, loading, error, callData } = useZephyrRoutingV2(
    tradeType,
    amountSpecified,
    otherCurrency
  )

  // Get swap callback with direct parameters instead of trade object
  const { callback: executeSwap } = useZephyrSwapV2(
    inputAmount && outputAmount
      ? {
          inputAmount,
          outputAmount,
          tradeType,
        }
      : undefined,
    allowedSlippage,
    account,
    callData
  )

  // Ensure we're on the right chain
  const isValidChain = chainId === ZEPHYR_CHAIN_ID

  return useMemo(() => {
    if (!isValidChain) {
      return {
        route: '',
        loading: false,
        error: 'Wrong network. Please switch to Zephyr network.',
        executeSwap: null,
      }
    }

    return {
      inputAmount,
      outputAmount,
      route,
      loading,
      error,
      executeSwap,
    }
  }, [isValidChain, inputAmount, outputAmount, route, loading, error, executeSwap])
}
