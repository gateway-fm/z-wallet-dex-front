import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'
import { ClassicTrade } from 'state/routing/types'

import { useStablecoinAmountFromFiatValue, useStablecoinValue } from './useStablecoinPrice'

const DEFAULT_AUTO_SLIPPAGE = new Percent(5, 1000) // 0.5%

const MIN_AUTO_SLIPPAGE_TOLERANCE = DEFAULT_AUTO_SLIPPAGE
// assuming normal gas speeds, most swaps complete within 3 blocks and
// there's rarely price movement >5% in that time period
const MAX_AUTO_SLIPPAGE_TOLERANCE = new Percent(5, 100) // 5%

/**
 * Returns slippage tolerance based on values from current trade, gas estimates from api, and active network.
 * Auto slippage is only relevant for Classic swaps because UniswapX slippage is determined by the backend service
 */
export default function useClassicAutoSlippageTolerance(trade?: ClassicTrade): Percent {
  const { chainId } = useWeb3React()
  const onL2 = false // Zephyr is L1, so always false
  const outputDollarValue = useStablecoinValue(trade?.outputAmount)

  const gasEstimateUSD = useStablecoinAmountFromFiatValue(trade?.gasUseEstimateUSD) ?? null

  return useMemo(() => {
    if (!trade || onL2) return DEFAULT_AUTO_SLIPPAGE

    if (outputDollarValue && gasEstimateUSD) {
      // optimize for highest possible slippage without getting MEV'd
      // so set slippage % such that the difference between expected amount out and minimum amount out < gas fee to sandwich the trade
      const fraction = gasEstimateUSD.asFraction.divide(outputDollarValue.asFraction)
      const result = new Percent(fraction.numerator, fraction.denominator)
      if (result.greaterThan(MAX_AUTO_SLIPPAGE_TOLERANCE)) {
        return MAX_AUTO_SLIPPAGE_TOLERANCE
      }

      if (result.lessThan(MIN_AUTO_SLIPPAGE_TOLERANCE)) {
        return MIN_AUTO_SLIPPAGE_TOLERANCE
      }

      return result
    }

    return DEFAULT_AUTO_SLIPPAGE
  }, [trade, onL2, gasEstimateUSD, outputDollarValue])
}
