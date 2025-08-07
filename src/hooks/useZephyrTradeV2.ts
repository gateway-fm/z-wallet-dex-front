import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'
import { ClassicTrade, TradeFillType } from 'state/routing/types'
import { ApprovalState } from 'lib/hooks/useApproval'

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
  allowedSlippage: number = 1
): {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  route: string
  loading: boolean
  error?: string
  trade?: ClassicTrade
  executeSwap: (() => Promise<{ type: TradeFillType.Classic; response: any }>) | null
} {
  const { account, chainId } = useWeb3React()

  // Get routing data
  const { inputAmount, outputAmount, route, loading, error, callData } = useZephyrRoutingV2(
    tradeType,
    amountSpecified,
    otherCurrency
  )

  // Create a mock ClassicTrade object for compatibility with existing swap hook
  const trade = useMemo((): ClassicTrade | undefined => {
    if (!inputAmount || !outputAmount || !amountSpecified || !otherCurrency) {
      return undefined
    }

    // Mock ClassicTrade object with required properties
    return {
      inputAmount,
      outputAmount,
      tradeType,
      route: {
        // Mock route properties needed by swap hook
        input: inputAmount.currency,
        output: outputAmount.currency,
        pools: [], // Not used in our implementation
      },
      // Add other required properties with defaults
      gasEstimate: undefined,
      blockNumber: undefined,
      requestId: undefined,
      quoteId: undefined,
    } as ClassicTrade
  }, [inputAmount, outputAmount, tradeType, amountSpecified, otherCurrency])

  // Get swap callback
  const { callback: executeSwap } = useZephyrSwapV2(trade, allowedSlippage, account, callData)

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
      trade,
      executeSwap,
    }
  }, [isValidChain, inputAmount, outputAmount, route, loading, error, trade, executeSwap])
}
