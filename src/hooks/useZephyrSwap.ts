import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'
import { ClassicTrade, TradeFillType } from 'state/routing/types'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { V3_CORE_FACTORY_ADDRESSES } from '../constants/addresses'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useContract } from './useContract'

// TODO: put in JSON
const SwapRouter02ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenIn', type: 'address' },
          { internalType: 'address', name: 'tokenOut', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
          { internalType: 'uint256', name: 'amountOutMinimum', type: 'uint256' },
          { internalType: 'uint160', name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        internalType: 'struct IV3SwapRouter.ExactInputSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
]

const FactoryABI = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenA', type: 'address' },
      { internalType: 'address', name: 'tokenB', type: 'address' },
      { internalType: 'uint24', name: 'fee', type: 'uint24' },
    ],
    name: 'getPool',
    outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const PoolStateABI = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
      { internalType: 'int24', name: 'tick', type: 'int24' },
      { internalType: 'uint16', name: 'observationIndex', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinality', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinalityNext', type: 'uint16' },
      { internalType: 'uint8', name: 'feeProtocol', type: 'uint8' },
      { internalType: 'bool', name: 'unlocked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'liquidity',
    outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }],
    stateMutability: 'view',
    type: 'function',
  },
]

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

function useSwapRouter02Contract() {
  return useContract('0x881f1D82139635c9190976F390305764bdBdEF3D', SwapRouter02ABI, true)
}

async function approveTokenForSwap(
  tokenAddress: string,
  spenderAddress: string,
  provider: any,
  account: string,
  addTransaction: any
): Promise<void> {
  const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider.getSigner())

  const gasEstimate = await tokenContract.estimateGas.approve(spenderAddress, MaxUint256)
  const gasLimit = calculateGasMargin(gasEstimate)

  const approvalTx = await tokenContract.approve(spenderAddress, MaxUint256, {
    gasLimit,
  })

  addTransaction(approvalTx, {
    type: TransactionType.APPROVAL,
    tokenAddress,
    spender: spenderAddress,
  })

  await approvalTx.wait()
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
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!chainId || chainId !== ZEPHYR_CHAIN_ID) {
      return { callback: null }
    }

    if (!trade || !provider || !account || !swapRouter) {
      return { callback: null }
    }

    if (!recipientAddress) {
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

        /**
         * Find best pool across all fee tiers
         */
        const factoryAddress = V3_CORE_FACTORY_ADDRESSES[chainId]
        if (!factoryAddress) {
          throw new Error('Factory address not found for Zephyr network')
        }

        const factoryContract = new Contract(factoryAddress, FactoryABI, provider)
        const allFeeTiers = [100, 500, 3000, 10000]
        let bestPool: any = null
        let bestFee = 0
        let maxLiquidity = BigNumber.from(0)

        for (const fee of allFeeTiers) {
          const poolAddress = await factoryContract.getPool(tokenIn.address, tokenOut.address, fee)

          if (poolAddress !== '0x0000000000000000000000000000000000000000') {
            try {
              const pool = new Contract(poolAddress, PoolStateABI, provider)
              const [slot0, liquidity] = await Promise.all([pool.slot0(), pool.liquidity()])

              const hasLiquidity = liquidity.gt(0) && !slot0.sqrtPriceX96.eq(0) && slot0.unlocked

              if (hasLiquidity && liquidity.gt(maxLiquidity)) {
                maxLiquidity = liquidity
                bestPool = { address: poolAddress, slot0, liquidity }
                bestFee = fee
                console.log(`Found better pool with fee ${fee / 10000}%:`, {
                  address: poolAddress,
                  liquidity: liquidity.toString(),
                  tick: slot0.tick,
                })
              }
            } catch (error) {
              console.warn(`Error checking pool with fee ${fee}:`, error.message)
            }
          }
        }

        if (!bestPool || maxLiquidity.eq(0)) {
          throw new Error('No pools with liquidity found for this pair')
        }

        console.log('Selected pool:', {
          address: bestPool.address,
          fee: `${bestFee / 10000}%`,
          liquidity: bestPool.liquidity.toString(),
          tick: bestPool.slot0.tick,
        })

        // Check token balance and allowance
        const tokenContract = new Contract(tokenIn.address, ERC20_ABI, provider)
        const [balance, allowance] = await Promise.all([
          tokenContract.balanceOf(account),
          tokenContract.allowance(account, swapRouter.address),
        ])

        const requiredAmountString = trade.inputAmount.quotient.toString()
        const requiredAmountBN = BigNumber.from(requiredAmountString)

        if (balance.lt(requiredAmountBN)) {
          throw new Error(`Insufficient ${tokenIn.symbol} balance`)
        }

        // Auto-approve if needed
        if (allowance.lt(requiredAmountBN)) {
          console.log('Insufficient allowance, requesting approval')
          await approveTokenForSwap(tokenIn.address, swapRouter.address, provider, account, addTransaction)
          console.log('Token approved successfully')
        }

        // Calculate minimum amount out with slippage
        const slippagePercent = new Percent(allowedSlippage, 100)
        const minAmountOut = trade.minimumAmountOut(slippagePercent)
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes

        const params = {
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          fee: bestFee,
          recipient: recipientAddress,
          deadline,
          amountIn: requiredAmountString,
          amountOutMinimum: minAmountOut.quotient.toString(),
          sqrtPriceLimitX96: 0,
        }

        console.log('Swap parameters:', params)

        // Test with static call first
        try {
          const staticResult = await swapRouter.callStatic.exactInputSingle(params)
          console.log('Static call successful, expected output:', staticResult.toString())
        } catch (staticError) {
          console.error('Static call failed:', staticError.message)
          throw new Error('Swap validation failed: ' + staticError.message)
        }

        // Estimate gas
        const gasEstimate = await swapRouter.estimateGas.exactInputSingle(params)
        console.log('Gas estimate:', gasEstimate.toString())

        // Execute the swap
        const swapResult = await swapRouter.exactInputSingle(params, {
          gasLimit: calculateGasMargin(gasEstimate),
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
  }, [trade, allowedSlippage, recipientAddress, account, chainId, provider, swapRouter, addTransaction])
}
