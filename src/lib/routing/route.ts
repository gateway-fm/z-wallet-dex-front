import apiInstance from '../../api'
import { SwapParams, SwapType } from './types'

export async function getSwapData(params: SwapParams): Promise<{ callData: string; amountQuoted: bigint }> {
  if (!params.tokenIn || !params.tokenOut) {
    throw new Error('Invalid token addresses provided')
  }

  if (params.tokenIn.toLowerCase() === params.tokenOut.toLowerCase()) {
    throw new Error('Input and output tokens cannot be the same')
  }

  if (params.amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  try {
    const routeType = params.swapType === SwapType.EXACT_INPUT ? 'input' : 'output'
    const bestRouteResponse = await apiInstance.routing.bestRoute({
      tknA: params.tokenIn,
      tknB: params.tokenOut,
      amount: params.amount.toString(),
      routeType,
    })

    const bestRoute = bestRouteResponse.data
    if (!bestRoute || !bestRoute.route) {
      throw new Error(`No liquidity routes found between ${params.tokenIn} and ${params.tokenOut}`)
    }

    const calldataResponse = await apiInstance.routing.getCalldata({
      route: bestRoute.route,
      route_type: bestRoute.type,
      recipient: params.recipient || params.signer,
      amount: bestRoute.amount_quoted,
      slippage: (params.slippage || 1) * 100, // Convert to basis points (1% = 100)
      deadline: Math.floor(Date.now() / 1000) + 1200, // 20 minutes from now // TODO: make this configurable
    })

    const calldata = calldataResponse.data
    if (!calldata || !calldata.data) {
      throw new Error('Failed to get calldata for the route')
    }

    return {
      callData: calldata.data,
      amountQuoted: BigInt(bestRoute.amount_quoted),
    }
  } catch (error) {
    console.error('Routing API error:', error)
    if (error.response?.status === 404) {
      throw new Error(`No liquidity routes found between ${params.tokenIn} and ${params.tokenOut}`)
    }
    throw error
  }
}
