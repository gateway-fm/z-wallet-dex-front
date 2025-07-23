import { Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useUniversalRouterSwapCallback } from 'hooks/useUniversalRouter'
import { useZephyrSwapCallback } from 'hooks/useZephyrSwap'
import { useCallback } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { useTransactionAdder } from 'state/transactions/hooks'

import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType,
} from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import useTransactionDeadline from './useTransactionDeadline'

// eslint-disable-next-line import/no-unused-modules
export type SwapResult = Awaited<ReturnType<ReturnType<typeof useSwapCallback>>>

// Returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: InterfaceTrade | undefined, // trade to execute, required
  fiatValues: { amountIn?: number; amountOut?: number }, // usd values for amount in and out, logged for analytics
  allowedSlippage: Percent, // in bips
  permitSignature: PermitSignature | undefined
) {
  const deadline = useTransactionDeadline()
  const addTransaction = useTransactionAdder()
  const { account, chainId } = useWeb3React()

  const universalRouterSwapCallback = useUniversalRouterSwapCallback(isClassicTrade(trade) ? trade : undefined, {
    slippageTolerance: allowedSlippage,
    deadline,
    permit: permitSignature,
  })

  const { callback: zephyrSwapCallback } = useZephyrSwapCallback(
    isClassicTrade(trade) ? trade : undefined,
    Number(allowedSlippage.multiply(100).toFixed(0)) / 100, // Convert Percent to number
    account
  )

  // Use Universal Router for other networks, but SwapRouter02 for Zephyr
  const swapCallback = chainId === ZEPHYR_CHAIN_ID ? zephyrSwapCallback : universalRouterSwapCallback

  return useCallback(async () => {
    if (!trade) throw new Error('missing trade')
    if (!account || !chainId) throw new Error('wallet must be connected to swap')
    if (!swapCallback) throw new Error('swap callback not available')

    const result = await swapCallback()

    const swapInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo = {
      type: TransactionType.SWAP,
      inputCurrencyId: currencyId(trade.inputAmount.currency),
      outputCurrencyId: currencyId(trade.outputAmount.currency),
      ...(trade.tradeType === TradeType.EXACT_INPUT
        ? {
            tradeType: TradeType.EXACT_INPUT,
            inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
            expectedOutputCurrencyAmountRaw: trade.postTaxOutputAmount.quotient.toString(),
            minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
          }
        : {
            tradeType: TradeType.EXACT_OUTPUT,
            maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
            outputCurrencyAmountRaw: trade.postTaxOutputAmount.quotient.toString(),
            expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          }),
    }
    addTransaction(result.response, swapInfo, deadline?.toNumber())

    return result
  }, [trade, account, chainId, swapCallback, allowedSlippage, addTransaction, deadline])
}
