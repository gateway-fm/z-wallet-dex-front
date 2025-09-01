import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useMemo } from 'react'
import { TradeFillType } from 'state/routing/types'

// Using existing ABI
import ZephyrSwapRouterABI from '../abis/zephyr-swap-router.json'
import { CONTRACTS_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useContract } from './useContract'
import { useZephyrTokenApproval } from './useZephyrApproval'

/**
 * Simplified trade interface for Zephyr swaps
 */
interface SimpleTrade {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  tradeType: TradeType
}

/**
 * Returns the swap call parameters for a trade on Zephyr network using the new routing system
 */
export function useZephyrSwapV2(
  trade: SimpleTrade | undefined,
  allowedSlippage: number,
  recipientAddress: string | null | undefined,
  callData?: string
): {
  callback: (() => Promise<{ type: TradeFillType.Classic; response: any }>) | null
} {
  const { account, chainId, provider } = useWeb3React()
  const swapRouter = useContract(CONTRACTS_CONFIG.SWAP_ROUTER_02, ZephyrSwapRouterABI, true)

  // Use the existing approval hook for cleaner code
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

    if (!trade || !provider || !account || !swapRouter || !recipientAddress) {
      return { callback: null }
    }

    if (!callData) {
      console.warn('No callData provided to ZephyrSwapV2, swap will not be available')
      return { callback: null }
    }

    const callback = async (): Promise<{ type: TradeFillType.Classic; response: any }> => {
      try {
        console.log('Executing Zephyr swap with new routing system')

        const { inputAmount, outputAmount } = trade
        const tokenIn = inputAmount.currency
        const tokenOut = outputAmount.currency

        if (!tokenIn.isToken || !tokenOut.isToken) {
          throw new Error('Both currencies must be tokens for Zephyr swaps')
        }

        console.log('Trade details:', {
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amountIn: inputAmount.quotient.toString(),
          expectedAmountOut: outputAmount.quotient.toString(),
          callData: callData.slice(0, 50) + '...',
          recipient: account,
          recipientAddress,
          swapRouter: CONTRACTS_CONFIG.SWAP_ROUTER_02,
        })

        // Validate recipient matches account
        if (recipientAddress !== account) {
          console.warn('Recipient address mismatch:', {
            account,
            recipientAddress,
            message: 'This might cause the swap to fail',
          })
        }

        // Handle token approval if needed
        if (approvalState !== ApprovalState.APPROVED) {
          console.log(`Token ${tokenIn.symbol} needs approval`)
          await approve()
          console.log('Approval completed')
        }

        // Execute the pre-calculated swap using callData
        const transaction = {
          to: CONTRACTS_CONFIG.SWAP_ROUTER_02,
          data: callData,
          value: tokenIn.isNative ? inputAmount.quotient.toString() : '0',
          gasLimit: 500000,
        }

        console.log('Executing swap transaction:', transaction)

        const swapResult = await provider.getSigner().sendTransaction(transaction)

        console.log('Swap transaction sent:', swapResult.hash)

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
  }, [trade, recipientAddress, account, chainId, provider, swapRouter, callData, approvalState, approve])
}
