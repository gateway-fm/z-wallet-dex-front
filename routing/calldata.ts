import { ethers } from "ethers";
import SwapRouterABI from "./abis/SwapRouter.json";
import { QuoteMethod, QuoteResult, SwapMethod, SwapParams } from "./types";
import { encodeRoute } from "./utils";

const router = new ethers.utils.Interface(SwapRouterABI);

// Wrap the route and other params to the transaction data (TODO: gas estimation? value? etc.)
export function prepareSwapCalldata(quote: QuoteResult, params: SwapParams): string {
  switch (quote.method) {
    case QuoteMethod.EXACT_INPUT:
      return prepareExactInputCalldata(quote, params);
    case QuoteMethod.EXACT_OUTPUT:
      return prepareExactOutputCalldata(quote, params);
    case QuoteMethod.EXACT_INPUT_SINGLE:
      return prepareExactInputSingleCalldata(quote, params);
    case QuoteMethod.EXACT_OUTPUT_SINGLE:
      return prepareExactOutputSingleCalldata(quote, params);
    default:
      throw new Error(`Unsupported swap method: ${quote.method}`);
  }
}

function prepareExactInputCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote;

  const args = {
    path: encodeRoute(route, params.swapType),
    recipient: params.recipient || params.signer,
    amountIn: params.amount,
    amountOutMinimum: amountQuoted,
  };

  return router.encodeFunctionData(SwapMethod.EXACT_INPUT, [args]);
}

function prepareExactOutputCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote;

  const args = {
    path: encodeRoute(route, params.swapType),
    recipient: params.recipient || params.signer,
    amountOut: params.amount,
    amountInMaximum: amountQuoted,
  };

  return router.encodeFunctionData(SwapMethod.EXACT_OUTPUT, [args]);
}

function prepareExactInputSingleCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote;

  const args = {
    tokenIn: route[0].tokenIn,
    tokenOut: route[0].tokenOut,
    fee: route[0].fee,
    recipient: params.recipient || params.signer,
    amountIn: params.amount,
    amountOutMinimum: amountQuoted,
    sqrtPriceLimitX96: 0, // skip for now
  };

  return router.encodeFunctionData(SwapMethod.EXACT_INPUT_SINGLE, [args]);
}

function prepareExactOutputSingleCalldata(quote: QuoteResult, params: SwapParams): string {
  const { route, amountQuoted } = quote;

  const args = {
    tokenIn: route[0].tokenIn,
    tokenOut: route[0].tokenOut,
    fee: route[0].fee,
    recipient: params.recipient || params.signer,
    amountOut: params.amount,
    amountInMaximum: amountQuoted,
    sqrtPriceLimitX96: 0, // skip for now
  };

  return router.encodeFunctionData(SwapMethod.EXACT_OUTPUT_SINGLE, [args]);
}
