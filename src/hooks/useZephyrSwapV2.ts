import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useMemo } from 'react'
import { TradeFillType } from 'state/routing/types'

import { CONTRACTS_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useZephyrTokenApproval } from './useZephyrApproval'

interface SimpleTrade {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  tradeType: TradeType
}

/**
 * Returns the swap call parameters for a trade
 */
export function useZephyrSwapV2(
  trade: SimpleTrade | undefined,
  _allowedSlippage: number,
  recipientAddress: string | null | undefined,
  callData?: string
): {
  callback: (() => Promise<{ type: TradeFillType.Classic; response: any }>) | null
} {
  const { account, chainId, provider } = useWeb3React()
  const tokenIn = trade?.inputAmount?.currency
  const inputAmount = trade?.inputAmount?.quotient?.toString()
  const { approvalState, approve } = useZephyrTokenApproval(
    tokenIn?.isToken ? tokenIn : undefined,
    CONTRACTS_CONFIG.SWAP_ROUTER_02,
    inputAmount
  )

  return useMemo(() => {
    if (!chainId || chainId !== ZEPHYR_CHAIN_ID) {
      return { callback: null }
    }

    if (!trade || !provider || !account || !recipientAddress) {
      return { callback: null }
    }

    if (!callData) {
      console.warn('No callData provided, swap will not be available')
      return { callback: null }
    }

    const callback = async (): Promise<{
      type: TradeFillType.Classic
      response: any
    }> => {
      try {
        const { inputAmount, outputAmount } = trade
        const tokenIn = inputAmount.currency
        const tokenOut = outputAmount.currency

        if (!tokenIn.isToken || !tokenOut.isToken) {
          throw new Error('Both currencies must be tokens')
        }

        if (recipientAddress !== account) {
          console.warn('Recipient address mismatch')
        }

        if (!tokenIn.isNative && approvalState !== ApprovalState.APPROVED) {
          // Handle token approval if needed
          const approveTx = await approve()
          await approveTx.wait()
        }

        const ensuredCallData = callData.startsWith('0x') ? callData : `0x${callData}`

        const transaction = {
          to: CONTRACTS_CONFIG.SWAP_ROUTER_02,
          data: ensuredCallData,
          value: tokenIn.isNative ? inputAmount.quotient.toString() : '0',
        }

        const swapResult = await provider.getSigner().sendTransaction(transaction)

        return {
          type: TradeFillType.Classic,
          response: swapResult,
        }
      } catch (error) {
        console.error('Zephyr swap failed:', error)
        throw error
      }
    }

    return { callback }
  }, [trade, recipientAddress, account, chainId, provider, callData, approvalState, approve])
}
