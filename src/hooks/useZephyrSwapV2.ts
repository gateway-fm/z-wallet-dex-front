import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useMemo } from 'react'
import { TradeFillType } from 'state/routing/types'

import ZephyrSwapRouterABI from '../abis/zephyr-swap-router.json'
import { CONTRACTS_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useContract } from './useContract'
import { useZephyrTokenApproval } from './useZephyrApproval'
import { swapWithZWallet } from './useZWalletSwap'

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
  const swapRouter = useContract(CONTRACTS_CONFIG.SWAP_ROUTER_02, ZephyrSwapRouterABI, true)

  const tokenIn = trade?.inputAmount?.currency
  const inputAmount = trade?.inputAmount?.quotient?.toString()
  const { approvalState, approve } = useZephyrTokenApproval(
    tokenIn?.isToken ? tokenIn : undefined,
    CONTRACTS_CONFIG.SWAP_ROUTER_02,
    inputAmount
  )

  return useMemo(() => {
    if (!chainId || chainId !== ZEPHYR_CHAIN_ID || !connector) {
      return { callback: null }
    }

    const connection = getConnection(connector)
    const isZWallet = connection.type === ConnectionType.Z_WALLET

    if (isZWallet) {
      if (!trade || !account || !recipientAddress) {
        return { callback: null }
      }
    } else {
      if (!trade || !provider || !account || !swapRouter || !recipientAddress) {
        return { callback: null }
      }
    }

    if (!callData) {
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
          throw new Error('Both currencies must be tokens for Zephyr swaps')
        }

        const currentConnection = getConnection(connector)
        const isZWallet = currentConnection.type === ConnectionType.Z_WALLET

        let justApproved = false
        if (isZWallet && approvalState !== ApprovalState.APPROVED) {
          await approve()
          justApproved = true
        }

        const transaction = {
          to: CONTRACTS_CONFIG.SWAP_ROUTER_02,
          data: callData,
          value: tokenIn.isNative ? inputAmount.quotient.toString() : '0',
          gasLimit: 500000,
        }

        let swapResult
        if (isZWallet) {
          if (justApproved) {
            // NOTE: Wait 5 seconds before calling swap to give Z Wallet time to close approval popu
            await new Promise((resolve) => setTimeout(resolve, 5000))
          }
          swapResult = await swapWithZWallet(chainId, account || '', transaction)
        } else {
          if (!provider || !swapRouter) {
            throw new Error('Provider or swapRouter not available for standard wallet')
          }
          swapResult = await provider.getSigner().sendTransaction(transaction)
        }

        return {
          type: TradeFillType.Classic,
          response: swapResult,
        }
      } catch (error) {
        console.error('Zephyr swap V2 failed:', error)
        throw error
      }
    }

    return { callback }
  }, [trade, recipientAddress, account, chainId, provider, swapRouter, callData, approvalState, connector, approve])
}
