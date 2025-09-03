export enum SwapMethod {
  EXACT_INPUT = 'exactInput',
  EXACT_OUTPUT = 'exactOutput',
  EXACT_INPUT_SINGLE = 'exactInputSingle',
  EXACT_OUTPUT_SINGLE = 'exactOutputSingle',
}

export enum QuoteMethod {
  EXACT_INPUT = 'quoteExactInput',
  EXACT_OUTPUT = 'quoteExactOutput',
  EXACT_INPUT_SINGLE = 'quoteExactInputSingle',
  EXACT_OUTPUT_SINGLE = 'quoteExactOutputSingle',
}

export enum SwapType {
  EXACT_INPUT = 'exactInput',
  EXACT_OUTPUT = 'exactOutput',
}

export type SwapParams = {
  signer: string // The address of the wallet initiating the swap
  tokenIn: string
  tokenOut: string
  amount: bigint // including decimals, e.g., 1 WZERO = 10^18
  swapType: SwapType
  recipient?: string // Optional, default to the signer address
  deadline?: number // Optional, default to 30 minutes from now
  slippage?: number // Optional, default to 1%
}

export type QuoteResult = {
  route: Route
  amountQuoted: bigint
  method: QuoteMethod
}

export type Route = Pair[]

export type Pair = {
  tokenIn: string
  tokenOut: string
  fee: number
}
