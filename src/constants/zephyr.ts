/* eslint-disable import/no-unused-modules */

import { Token } from '@uniswap/sdk-core'
import { encodeSqrtRatioX96 } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

/**
 * Zephyr Network Price Utilities
 *
 * Centralized place for all Zephyr price calculations to ensure consistency
 */

/**
 * Calculate sqrtPriceX96 for 1:1 human-readable price between two tokens
 * Takes into account different token decimals
 *
 * @param token0 First token (base)
 * @param token1 Second token (quote)
 * @returns sqrtPriceX96 as string representing 1:1 human price
 */
export function calculateOneToOneSqrtPriceX96(token0: Token, token1: Token): string {
  // For 1:1 human-readable price: 1 token0 = 1 token1
  // In raw units: 10^token0.decimals units of token0 = 10^token1.decimals units of token1

  const amount0 = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(token0.decimals))
  const amount1 = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(token1.decimals))

  // Use Uniswap's utility to encode the price ratio
  return encodeSqrtRatioX96(amount1, amount0).toString()
}

/**
 * Default tick for 1:1 price with equal decimals
 * For different decimals, the tick will be calculated automatically by Pool constructor
 */
export const ZEPHYR_DEFAULT_TICK = 0

/**
 * Default liquidity for mock pools
 */
export const ZEPHYR_DEFAULT_LIQUIDITY = '1000000000000000000' // 1e18

/**
 * Get pool creation parameters for Zephyr network
 */
export function getZephyrPoolParams(token0: Token, token1: Token) {
  const sqrtPriceX96 = calculateOneToOneSqrtPriceX96(token0, token1)

  return {
    sqrtPriceX96,
    tick: ZEPHYR_DEFAULT_TICK, // Pool constructor will calculate the correct tick
    liquidity: ZEPHYR_DEFAULT_LIQUIDITY,
  }
}
