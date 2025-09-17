import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useMemo } from 'react'
import { useAppDispatch } from 'state/hooks'
import { TradeFillType } from 'state/routing/types'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import { currencyId } from 'utils/currencyId'

import { CONTRACTS_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenBalance } from '../lib/hooks/useCurrencyBalance'
import { useZephyrTokenApproval } from './useZephyrApproval'
import {
  isUserCancellation,
  swapWithZWallet,
  ZWalletConnectionError,
  ZWalletTransactionError,
  ZWalletUserRejectedError,
} from './useZWalletSwap'

const Z_WALLET_APPROVAL_WAIT_TIME = 5000

interface SimpleTrade {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  tradeType: TradeType
}

export function useZephyrSwapV2(
  trade: SimpleTrade | undefined,
  _allowedSlippage: number,
  recipientAddress: string | null | undefined,
  callData?: string
): {
  callback: (() => Promise<{ type: TradeFillType.Classic; response: any }>) | null
} {
  const { account, chainId, provider, connector } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const dispatch = useAppDispatch()

  const tokenIn = trade?.inputAmount?.currency
  const inputAmount = trade?.inputAmount?.quotient?.toString()
  const { approvalState, approve } = useZephyrTokenApproval(
    tokenIn?.isToken ? tokenIn : undefined,
    CONTRACTS_CONFIG.SWAP_ROUTER_02,
    inputAmount
  )

  const tokenBalance = useTokenBalance(account ?? undefined, tokenIn?.isToken ? tokenIn : undefined)

  return useMemo(() => {
    if (!chainId || chainId !== ZEPHYR_CHAIN_ID || !connector) {
      return { callback: null }
    }

    if (!trade || !account || !recipientAddress) {
      return { callback: null }
    }

    const connection = getConnection(connector)
    const isZWallet = connection.type === ConnectionType.Z_WALLET

    if (!isZWallet && !provider) {
      return { callback: null }
    }

    if (!callData) {
      return { callback: null }
    }

    const callback = async (): Promise<{
      type: TradeFillType.Classic
      response: any
    }> => {
      // NOTE: workaround to ensure everything is properly initialized
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { inputAmount, outputAmount } = trade
      const tokenIn = inputAmount.currency
      const tokenOut = outputAmount.currency

      if (!tokenIn.isToken || !tokenOut.isToken) {
        throw new Error('Both currencies must be tokens for Zephyr swaps')
      }

      const currentConnection = getConnection(connector)
      const isZWallet = currentConnection.type === ConnectionType.Z_WALLET
      let needApproval = false

      if (approvalState !== ApprovalState.APPROVED) {
        needApproval = true
        console.log('Token approval required:', {
          tokenIn: tokenIn.symbol,
          tokenAddress: tokenIn.address,
          spender: CONTRACTS_CONFIG.SWAP_ROUTER_02,
          approvalState,
          inputAmount: inputAmount.quotient.toString(),
          walletType: isZWallet ? 'Z-Wallet' : 'Standard',
        })

        try {
          console.log('Starting approval process...')
          await approve()
          console.log('Approval completed successfully')
        } catch (approvalError) {
          console.error('Approval failed:', {
            error: approvalError,
            errorMessage: approvalError instanceof Error ? approvalError.message : 'Unknown error',
            tokenSymbol: tokenIn.symbol,
            tokenAddress: tokenIn.address,
          })

          if (isZWallet && approvalError && typeof approvalError === 'object' && 'message' in approvalError) {
            const errorMessage = (approvalError as any).message || ''
            console.debug('Checking approval error for user cancellation:', errorMessage)
            if (isUserCancellation(errorMessage)) {
              throw new ZWalletUserRejectedError('User cancelled approval in Z-Wallet')
            }
          }

          const errorMessage = approvalError instanceof Error ? approvalError.message : 'Unknown error'
          if (isZWallet) {
            throw new ZWalletTransactionError(`Approval failed: ${errorMessage}`)
          } else {
            throw new Error(`Approval failed: ${errorMessage}`)
          }
        }
      }

      const transaction = {
        to: CONTRACTS_CONFIG.SWAP_ROUTER_02,
        data: callData,
        value: tokenIn.isNative ? inputAmount.quotient.toString() : '0',
        gasLimit: 500000, // TODO: get gas limit from the swap router
      }

      // Warn if balance seems low (but don't block the swap)
      if (tokenBalance && inputAmount && tokenBalance.quotient.toString() < inputAmount.quotient.toString()) {
        console.warn('Token balance may be insufficient for swap')
      }

      let swapResult
      if (isZWallet) {
        if (needApproval) {
          // Wait after approval for Z-Wallet to ensure it's processed
          await new Promise((resolve) => setTimeout(resolve, Z_WALLET_APPROVAL_WAIT_TIME))
        }

        // Create swap info for Z-Wallet transaction
        const swapInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo = {
          type: TransactionType.SWAP,
          inputCurrencyId: currencyId(trade.inputAmount.currency),
          outputCurrencyId: currencyId(trade.outputAmount.currency),
          ...(trade.tradeType === TradeType.EXACT_INPUT
            ? {
                tradeType: TradeType.EXACT_INPUT,
                inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                minimumOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
              }
            : {
                tradeType: TradeType.EXACT_OUTPUT,
                maximumInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
              }),
        }

        try {
          swapResult = await swapWithZWallet(chainId, account || '', transaction, undefined, swapInfo, dispatch)
        } catch (error) {
          // Re-throw Z-Wallet specific errors to be handled by the UI
          if (
            error instanceof ZWalletUserRejectedError ||
            error instanceof ZWalletConnectionError ||
            error instanceof ZWalletTransactionError
          ) {
            throw error
          }
          // For any other errors, wrap them in a generic Z-Wallet transaction error
          throw new ZWalletTransactionError(error instanceof Error ? error.message : 'Unknown Z-Wallet error')
        }
      } else {
        if (!provider) {
          throw new Error('Provider not available for standard wallet')
        }
        swapResult = await provider.getSigner().sendTransaction(transaction)

        // Add transaction to store for standard wallets
        const swapInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo = {
          type: TransactionType.SWAP,
          inputCurrencyId: currencyId(trade.inputAmount.currency),
          outputCurrencyId: currencyId(trade.outputAmount.currency),
          ...(trade.tradeType === TradeType.EXACT_INPUT
            ? {
                tradeType: TradeType.EXACT_INPUT,
                inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                minimumOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
              }
            : {
                tradeType: TradeType.EXACT_OUTPUT,
                maximumInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
              }),
        }

        // Add transaction to store for standard wallets
        addTransaction(swapResult, swapInfo)
      }

      return {
        type: TradeFillType.Classic,
        response: swapResult,
      }
    }

    return { callback }
  }, [
    trade,
    recipientAddress,
    account,
    chainId,
    provider,
    callData,
    approvalState,
    connector,
    approve,
    tokenBalance,
    addTransaction,
    dispatch,
  ])
}
