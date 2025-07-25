/* eslint-disable import/no-unused-modules */

import { Token } from '@uniswap/sdk-core'
import { encodeSqrtRatioX96, TickMath } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

export const ZEPHYR_DEFAULT_LIQUIDITY = '1000000000000000000' // 1e18

/**
 * Zephyr Network Price Utilities
 *
 * Centralized place for all Zephyr price calculations to ensure consistency
 */

/**
 * Calculate sqrtPriceX96 for 1:1 human-readable price between two tokens
 * Takes into account different token decimals to ensure 1 human token0 = 1 human token1
 *
 * @param token0 First token (sorted by address, lower first)
 * @param token1 Second token (sorted by address, higher first)
 * @returns sqrtPriceX96 as string representing 1:1 human price
 */
export function calculateOneToOneSqrtPriceX96(token0: Token, token1: Token): string {
  // For 1:1 human-readable price: 1 human token0 = 1 human token1
  // In raw units: 10^token0.decimals raw token0 = 10^token1.decimals raw token1
  // V3 price = token1_raw / token0_raw for equal human amounts
  // So price = 10^token1.decimals / 10^token0.decimals

  const decimal0 = token0.decimals
  const decimal1 = token1.decimals

  // Calculate price ratio for 1:1 human equivalence
  const numerator = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimal1))
  const denominator = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimal0))

  return encodeSqrtRatioX96(numerator, denominator).toString()
}

/**
 * Get pool creation parameters for Zephyr network
 */
export function getZephyrPoolParams(token0: Token, token1: Token) {
  const sqrtPriceX96 = calculateOneToOneSqrtPriceX96(token0, token1)
  const tick = TickMath.getTickAtSqrtRatio(JSBI.BigInt(sqrtPriceX96))

  return {
    sqrtPriceX96,
    tick,
    liquidity: ZEPHYR_DEFAULT_LIQUIDITY,
  }
}
