import { getAllRoutes } from './api/pools'
import { prepareSwapCalldata } from './calldata'
import { findBestRoute } from './quote'
import { SwapParams } from './types'

export async function getSwapData(params: SwapParams): Promise<{ callData: string; amountQuoted: bigint }> {
  // Validate input parameters
  if (!params.tokenIn || !params.tokenOut) {
    throw new Error('Invalid token addresses provided')
  }

  if (params.tokenIn.toLowerCase() === params.tokenOut.toLowerCase()) {
    throw new Error('Input and output tokens cannot be the same')
  }

  if (params.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  const tokenIn = params.tokenIn.toLowerCase()
  const tokenOut = params.tokenOut.toLowerCase()

  const routes = await getAllRoutes(tokenIn, tokenOut)
  if (routes.length === 0) {
    throw new Error(`No liquidity routes found between ${params.tokenIn} and ${params.tokenOut}`)
  }

  const bestRoute = await findBestRoute(params.amount, routes, params.swapType)
  if (!bestRoute) {
    throw new Error(
      `No viable quotes found for ${params.tokenIn} -> ${params.tokenOut}. This may be due to insufficient liquidity or invalid pool parameters.`
    )
  }

  const callData = prepareSwapCalldata(bestRoute, params)

  return { callData, amountQuoted: bestRoute.amountQuoted }
}
