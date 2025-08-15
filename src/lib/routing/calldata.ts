import { Interface } from '@ethersproject/abi'

import SwapRouterABI from './abis/SwapRouter.json'
import { QuoteMethod, QuoteResult, SwapMethod, SwapParams } from './types'
import { encodeRoute } from './utils'

const router = new Interface(SwapRouterABI)

// Wrap the route and other params to the transaction data
export function prepareSwapCalldata(quote: QuoteResult, params: SwapParams): string {
  switch (quote.method) {
    case QuoteMethod.EXACT_INPUT:
      return prepareExactInputCalldata(quote, params)
    case QuoteMethod.EXACT_OUTPUT:
      return prepareExactOutputCalldata(quote, params)
    case QuoteMethod.EXACT_INPUT_SINGLE:
      return prepareExactInputSingleCalldata(quote, params)
    case QuoteMethod.EXACT_OUTPUT_SINGLE:
      return prepareExactOutputSingleCalldata(quote, params)
    default:
      throw new Error(`Unsupported swap method: ${quote.method}`)
  }
}

function prepareExactInputCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote

  // Apply slippage to amountOutMinimum
  const slippagePercent = params.slippage || 1 // Default 1%
  const amountOutMinimum = (amountQuoted * BigInt(100 - slippagePercent)) / BigInt(100)

  const args = {
    path: encodeRoute(route, params.swapType),
    recipient: params.recipient || params.signer,
    amountIn: params.amount.toString(),
    amountOutMinimum: amountOutMinimum.toString(),
  }

  return router.encodeFunctionData(SwapMethod.EXACT_INPUT, [args])
}

function prepareExactOutputCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote

  const args = {
    path: encodeRoute(route, params.swapType),
    recipient: params.recipient || params.signer,
    amountOut: params.amount.toString(),
    amountInMaximum: amountQuoted.toString(),
  }

  return router.encodeFunctionData(SwapMethod.EXACT_OUTPUT, [args])
}

function prepareExactInputSingleCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote

  // Apply slippage to amountOutMinimum
  const slippagePercent = params.slippage || 1 // Default 1%
  const amountOutMinimum = (amountQuoted * BigInt(100 - slippagePercent)) / BigInt(100)

  const args = {
    tokenIn: route[0].tokenIn,
    tokenOut: route[0].tokenOut,
    fee: route[0].fee,
    recipient: params.recipient || params.signer,
    amountIn: params.amount.toString(),
    amountOutMinimum: amountOutMinimum.toString(),
    sqrtPriceLimitX96: 0, // skip for now
  }

  return router.encodeFunctionData(SwapMethod.EXACT_INPUT_SINGLE, [args])
}

function prepareExactOutputSingleCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote

  const args = {
    tokenIn: route[0].tokenIn,
    tokenOut: route[0].tokenOut,
    fee: route[0].fee,
    recipient: params.recipient || params.signer,
    amountOut: params.amount.toString(),
    amountInMaximum: amountQuoted.toString(),
    sqrtPriceLimitX96: 0, // skip for now
  }

  return router.encodeFunctionData(SwapMethod.EXACT_OUTPUT_SINGLE, [args])
}
