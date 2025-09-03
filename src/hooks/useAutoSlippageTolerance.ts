import { Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ClassicTrade } from 'state/routing/types'

const DEFAULT_AUTO_SLIPPAGE = new Percent(5, 1000) // 0.5%

/**
 * Returns slippage tolerance based on values from current trade.
 * Gas costs are not considered as there are no network fees in this solution.
 * Auto slippage is only relevant for Classic swaps because UniswapX slippage is determined by the backend service
 */
export default function useClassicAutoSlippageTolerance(trade?: ClassicTrade): Percent {
  const onL2 = false // Zephyr is L1, so always false

  return useMemo(() => {
    // Since there are no gas fees, we use a simple default auto slippage
    if (!trade || onL2) return DEFAULT_AUTO_SLIPPAGE

    return DEFAULT_AUTO_SLIPPAGE
  }, [trade, onL2])
}
