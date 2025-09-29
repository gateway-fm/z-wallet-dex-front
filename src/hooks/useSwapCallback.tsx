import { Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useUniversalRouterSwapCallback } from 'hooks/useUniversalRouter'
import { useZephyrRoutingV2 } from 'hooks/useZephyrRoutingV2'
import { useZephyrSwapV2 } from 'hooks/useZephyrSwapV2'
import { useCallback } from 'react'
import { useCurrencyBalance } from 'state/connection/hooks'
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
  const { account, chainId } = useWeb3React()
  const deadline = useTransactionDeadline()
  const addTransaction = useTransactionAdder()

  const universalRouterSwapCallback = useUniversalRouterSwapCallback(isClassicTrade(trade) ? trade : undefined, {
    slippageTolerance: allowedSlippage,
    deadline,
    permit: permitSignature,
  })

  // Get routing data for Zephyr network
  const routingResult = useZephyrRoutingV2(
    trade?.tradeType || TradeType.EXACT_INPUT,
    trade?.inputAmount,
    trade?.outputAmount?.currency,
    account // Pass account for proper recipient
  )

  const { callback: zephyrSwapCallback } = useZephyrSwapV2(
    isClassicTrade(trade)
      ? {
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
          tradeType: trade.tradeType,
        }
      : undefined,
    Number(allowedSlippage.multiply(100).toFixed(0)) / 100, // Convert Percent to number
    account,
    routingResult.callData // Use callData from routing system
  )

  const swapCallback = chainId === ZEPHYR_CHAIN_ID ? zephyrSwapCallback : universalRouterSwapCallback

  const inputBalance = useCurrencyBalance(account, trade?.inputAmount.currency)

  return useCallback(async () => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Swap pre-check', {
        account,
        chainId,
        tradeExists: Boolean(trade),
        inputCurrency: trade?.inputAmount.currency.symbol,
        inputAmount: trade?.inputAmount.toExact(),
        inputBalance: inputBalance?.toExact(),
        usingZephyr: chainId === ZEPHYR_CHAIN_ID,
      })
    }
    if (!trade) throw new Error('missing trade')
    if (!account || !chainId) throw new Error('wallet must be connected to swap')

    // For Zephyr network, check routing data
    if (chainId === ZEPHYR_CHAIN_ID) {
      if (routingResult.loading) {
        throw new Error('Routing data is still loading, please wait')
      }
      if (routingResult.error) {
        throw new Error(`Routing failed: ${routingResult.error}`)
      }
      if (!routingResult.callData) {
        throw new Error('No call data available from routing system')
      }
    }

    if (!swapCallback) throw new Error('swap callback not available')

    // Check if user has sufficient balance before attempting the swap
    if (inputBalance && trade.inputAmount && inputBalance.lessThan(trade.inputAmount)) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('Swap pre-check: insufficient balance', {
          inputCurrency: trade.inputAmount.currency.symbol,
          inputAmount: trade.inputAmount.toExact(),
          inputBalance: inputBalance.toExact(),
        })
      }
      throw new Error(`Insufficient ${trade.inputAmount.currency.symbol} balance`)
    }

    const result = await swapCallback()

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Swap submitted', {
        hash: result?.response?.hash,
        chainId,
      })
    }

    // For Zephyr network, transaction is already added to store in useZWalletSwap
    // For other networks, add transaction to store
    if (chainId !== ZEPHYR_CHAIN_ID) {
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
    }

    return result
  }, [trade, account, chainId, swapCallback, allowedSlippage, addTransaction, deadline, routingResult, inputBalance])
}
