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
import { useTokenBalance } from '../lib/hooks/useCurrencyBalance'
import { useContract } from './useContract'
import { useZephyrTokenApproval } from './useZephyrApproval'
import { swapWithZWallet } from './useZWalletSwap'

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
  const swapRouter = useContract(CONTRACTS_CONFIG.SWAP_ROUTER_02, ZephyrSwapRouterABI, true)

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

    if (!isZWallet && (!provider || !swapRouter)) {
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

      console.log('[Zephyr Swap DEBUG] Starting swap:', {
        trade,
        chainId,
        account,
        recipientAddress,
        callData,
      })

      const { inputAmount, outputAmount } = trade
      const tokenIn = inputAmount.currency
      const tokenOut = outputAmount.currency

      console.log('[Zephyr Swap DEBUG] Currencies:', { tokenIn, tokenOut })

      if (!tokenIn.isToken || !tokenOut.isToken) {
        throw new Error('Both currencies must be tokens for Zephyr swaps')
      }

      const currentConnection = getConnection(connector)
      const isZWallet = currentConnection.type === ConnectionType.Z_WALLET
      let needApproval = false

      if (isZWallet && approvalState !== ApprovalState.APPROVED) {
        needApproval = true
        try {
          await approve()
          console.log('[Z Wallet DEBUG] Approval completed')
        } catch (approvalError) {
          throw new Error(
            `Approval failed: ${approvalError instanceof Error ? approvalError.message : 'Unknown error'}`
          )
        }
      }

      const transaction = {
        to: CONTRACTS_CONFIG.SWAP_ROUTER_02,
        data: callData,
        value: tokenIn.isNative ? inputAmount.quotient.toString() : '0',
        gasLimit: 500000, // TODO: get gas limit from the swap router
      }

      console.log('[Zephyr Swap DEBUG] Starting swap execution:', {
        transaction,
        chainId,
        account,
      })

      console.log('[Balance DEBUG] Trade details:', {
        inputToken: tokenIn.address,
        inputSymbol: tokenIn.symbol,
        inputAmount: inputAmount.quotient.toString(),
        actualBalance: tokenBalance?.quotient?.toString() || '0',
        hasEnoughBalance:
          tokenBalance && inputAmount && tokenBalance.quotient.toString() >= inputAmount.quotient.toString(),
        outputToken: tokenOut.address,
        outputSymbol: tokenOut.symbol,
        expectedOutput: outputAmount.quotient.toString(),
      })

      let swapResult
      if (isZWallet) {
        if (needApproval) {
          // NOTE: Wait after approval for Z-Wallet to ensure it's processed
          // FIXME: find a better way to do this
          await new Promise((resolve) => setTimeout(resolve, Z_WALLET_APPROVAL_WAIT_TIME))
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
    }

    return { callback }
  }, [
    trade,
    recipientAddress,
    account,
    chainId,
    provider,
    swapRouter,
    callData,
    approvalState,
    connector,
    approve,
    tokenBalance,
  ])
}
