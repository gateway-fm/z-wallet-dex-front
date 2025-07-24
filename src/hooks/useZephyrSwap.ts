import { Contract } from '@ethersproject/contracts'
import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useMemo } from 'react'
import { ClassicTrade, TradeFillType } from 'state/routing/types'

import ZephyrSwapRouterABI from '../abis/zephyr-swap-router.json'
import { CONTRACTS_CONFIG } from '../constants/addresses'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useContract } from './useContract'
import { useTopPools } from './useProtocolStats'
import { useZephyrTokenApproval } from './useZephyrApproval'

function useSwapRouter02Contract(): Contract | null {
  const { chainId } = useWeb3React()
  const address = chainId === ZEPHYR_CHAIN_ID ? CONTRACTS_CONFIG.SWAP_ROUTER_02 : undefined
  return useContract(address, ZephyrSwapRouterABI, true)
}

/**
 * Returns the swap call parameters for a trade on Zephyr network using SwapRouter02
 */
export function useZephyrSwapCallback(
  trade: ClassicTrade | undefined,
  allowedSlippage: number,
  recipientAddress: string | null | undefined
): {
  callback: (() => Promise<{ type: TradeFillType.Classic; response: any }>) | null
} {
  const { account, chainId, provider } = useWeb3React()
  const swapRouter = useSwapRouter02Contract()
  const { pools } = useTopPools(50)

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

    const callback = async (): Promise<{ type: TradeFillType.Classic; response: any }> => {
      try {
        console.log('Executing Zephyr swap with SwapRouter02')

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
        })

        // Handle token approval using the existing hook
        if (approvalState !== ApprovalState.APPROVED) {
          console.log(`Token ${tokenIn.symbol} needs approval`)
          await approve()
          console.log('Approval completed')
        }

        // Find correct fee tier
        const fee = await findPoolFee(tokenIn, tokenOut, pools, provider)

        // Calculate slippage (using higher slippage for debugging)
        const debugSlippage = 50
        const slippagePercent = new Percent(Math.floor(debugSlippage * 100), 10000)
        const minAmountOut = trade.minimumAmountOut(slippagePercent)

        console.log('Slippage calculation:', {
          userSlippage: `${allowedSlippage}%`,
          debugSlippage: `${debugSlippage}%`,
          minAmountOut: minAmountOut.quotient.toString(),
        })

        // Get quote from Quoter for better pricing
        let finalAmountOutMinimum = minAmountOut.quotient.toString()
        try {
          const quoterAmountOut = await getQuoterPrice(
            tokenIn,
            tokenOut,
            fee,
            inputAmount.quotient.toString(),
            provider
          )
          if (quoterAmountOut) {
            const quoterBasedOutput = CurrencyAmount.fromRawAmount(tokenOut, quoterAmountOut.toString())
            const quoterMinAmountOut = quoterBasedOutput.multiply(100 - debugSlippage).divide(100)
            finalAmountOutMinimum = quoterMinAmountOut.quotient.toString()
            console.log('Using Quoter-based pricing')
          }
        } catch (quoterError) {
          console.warn('Quoter failed, using GraphQL pricing:', quoterError.message)
        }

        // Execute swap
        const params = {
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          fee,
          recipient: recipientAddress,
          amountIn: inputAmount.quotient.toString(),
          amountOutMinimum: finalAmountOutMinimum,
          sqrtPriceLimitX96: 0,
        }

        console.log('Executing exactInputSingle with params:', params)

        const swapResult = await swapRouter.exactInputSingle(params, {
          value: tokenIn.isNative ? inputAmount.quotient.toString() : '0',
          gasLimit: 500000,
        })

        console.log('Swap transaction sent:', swapResult.hash)

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
  }, [trade, allowedSlippage, recipientAddress, account, chainId, provider, swapRouter, pools, approvalState, approve])
}

// Helper function to find the correct pool fee
async function findPoolFee(tokenIn: any, tokenOut: any, pools: any[], provider: any): Promise<number> {
  // First try to find in GraphQL pools
  if (pools && pools.length > 0) {
    const matchingPool = pools.find((pool) => {
      const token0Address = pool.token0.id.toLowerCase()
      const token1Address = pool.token1.id.toLowerCase()
      const inputAddress = tokenIn.address.toLowerCase()
      const outputAddress = tokenOut.address.toLowerCase()

      return (
        (token0Address === inputAddress && token1Address === outputAddress) ||
        (token0Address === outputAddress && token1Address === inputAddress)
      )
    })

    if (matchingPool) {
      const fee = parseInt(matchingPool.feeTier, 10)
      console.log('Found pool from GraphQL:', { poolId: matchingPool.id, fee })
      return fee
    }
  }

  // Try different fee tiers on-chain
  console.log('Checking available fee tiers on-chain')
  const feeTiers = [8000, 10000, 3000, 500]
  const factory = new Contract(
    CONTRACTS_CONFIG.V3_CORE_FACTORY,
    ['function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'],
    provider
  )

  for (const testFee of feeTiers) {
    try {
      const poolAddress = await factory.getPool(tokenIn.address, tokenOut.address, testFee)
      if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
        console.log(`Found pool with fee ${testFee}: ${poolAddress}`)
        return testFee
      }
    } catch (error) {
      console.log(`Error checking fee ${testFee}:`, error.message)
    }
  }

  console.log('No pool found, using default fee 3000')
  return 3000 // Default fallback
}

// Helper function to get price from Quoter
async function getQuoterPrice(tokenIn: any, tokenOut: any, fee: number, amountIn: string, provider: any): Promise<any> {
  const quoterContract = new Contract(
    CONTRACTS_CONFIG.QUOTER_V2,
    [
      'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) view returns (uint256 amountOut)',
    ],
    provider
  )

  const quoterAmountOut = await quoterContract.quoteExactInputSingle(
    tokenIn.address,
    tokenOut.address,
    fee,
    amountIn,
    0
  )

  console.log('Quoter price comparison:', {
    inputAmount: amountIn,
    quoterAmountOut: quoterAmountOut.toString(),
  })

  return quoterAmountOut
}
