import { Percent } from '@uniswap/sdk-core'

const PRECISION = 10000

// Minimal price impact for Zephyr network (0.01%)
// TODO: Remove this once we have a proper API
const ZEPHYR_DEFAULT_PRICE_IMPACT = new Percent(1, PRECISION) // 0.01%

export function computeFiatValuePriceImpact(
  fiatValueInput: number | undefined | null,
  fiatValueOutput: number | undefined | null
): Percent | undefined {
  if (!fiatValueOutput || !fiatValueInput) return undefined
  if (fiatValueInput === 0) return undefined

  // For Zephyr network or when values are very close (indicating 1:1 swap),
  // return minimal price impact to avoid calculation errors
  const ratio = 1 - fiatValueOutput / fiatValueInput
  const absRatio = Math.abs(ratio)

  // If ratio is very small (< 0.1%) or very large (calculation error), use minimal impact
  if (absRatio < 0.001 || absRatio > 1) {
    return ZEPHYR_DEFAULT_PRICE_IMPACT
  }

  const numerator = Math.floor(ratio * PRECISION)
  return new Percent(numerator, PRECISION)
}
