import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'

import MulticallABI from './abis/Multicall3.json'
import QuoterABI from './abis/Quoter.json'
import { ProviderUrl, UniswapV3Contracts } from './config'
import { Pair, QuoteMethod, QuoteResult, Route, SwapType } from './types'
import { encodeRoute } from './utils'

const quoter = new Interface(QuoterABI)
const provider = new JsonRpcProvider(ProviderUrl)
const multicall = new Contract(UniswapV3Contracts.multicallAddress, MulticallABI, provider)

const USE_MULTICALL = true

function decodeCallData(request: any): any[] {
  const { call, method } = request
  const { callData } = call
  const decoded = quoter.decodeFunctionData(method, callData)

  // For struct parameters, we need to extract only the first parameter (the struct itself)
  // ethers returns both indexed [0,1,2...] and named properties, we only want the first parameter
  if (method === QuoteMethod.EXACT_INPUT_SINGLE || method === QuoteMethod.EXACT_OUTPUT_SINGLE) {
    return [decoded[0]] // Only return the struct parameter
  }

  // For other methods, return array of values without duplicates
  const result = []
  for (let i = 0; i < decoded.length; i++) {
    result.push(decoded[i])
  }
  return result
}

export async function findBestRoute(amount: bigint, routes: Route[], swapType: SwapType) {
  if (routes.length === 0) {
    throw new Error('No routes provided for quoting')
  }

  const requests = routes.map((route) => getQuoteRequest(amount, route, swapType))

  let useMulticall = USE_MULTICALL
  let response: { success: boolean; returnData: string }[] = []

  if (USE_MULTICALL) {
    // Try multicall first, fallback to individual calls if needed
    try {
      const calls = requests.map((req) => ({
        target: req.call.target,
        allowFailure: true,
        callData: req.call.callData,
      }))

      response = await multicall.callStatic.aggregate3(calls)
    } catch (multicallError) {
      console.warn('Multicall failed, falling back to individual calls:', multicallError)
      useMulticall = false
    }
  }

  if (!useMulticall) {
    // Fallback to individual calls
    try {
      const quoterContract = new Contract(UniswapV3Contracts.quoterAddress, QuoterABI, provider)
      response = []

      for (let i = 0; i < requests.length; i++) {
        try {
          const params = decodeCallData(requests[i])
          const result = await quoterContract.callStatic[requests[i].method](...params)

          response.push({
            success: true,
            returnData: quoter.encodeFunctionResult(requests[i].method, result),
          })
        } catch (callError) {
          response.push({
            success: false,
            returnData: '0x',
          })
        }
      }
    } catch (fallbackError) {
      console.error('Individual calls failed:', fallbackError)
      throw new Error('Failed to fetch quotes from the quoter contract')
    }
  }

  const result: QuoteResult[] = []
  response.map((data, i) => {
    const { success, returnData } = data
    let amountQuoted = BigInt(0)
    const { method } = requests[i]

    if (success && returnData !== '0x') {
      try {
        const decoded = quoter.decodeFunctionResult(method, returnData)
        // QuoterV2 returns [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate]
        // We only need the first value (amount)
        amountQuoted = BigInt(decoded[0].toString())
      } catch (e) {
        console.error(`Error decoding result for route ${i}:`, e)
      }
    }

    result.push({
      route: routes[i],
      amountQuoted,
      method,
    })
  })

  const filteredResult = result.filter((r) => r.amountQuoted > 0)
  if (filteredResult.length === 0) {
    return null
  }

  const bestRoute = filteredResult.reduce((best, current) => {
    if (!best || current.amountQuoted > best.amountQuoted) {
      return current
    }
    return best
  })

  return bestRoute
}

function getQuoteRequest(amount: bigint, route: Route, swapType: SwapType) {
  if (route.length === 0) {
    throw new Error('Route must contain at least one pair')
  }

  // Validate route tokens
  for (const pair of route) {
    if (!pair.tokenIn || !pair.tokenOut || !pair.fee) {
      throw new Error(`Invalid pair in route: ${JSON.stringify(pair)}`)
    }
    if (!pair.tokenIn.startsWith('0x') || !pair.tokenOut.startsWith('0x')) {
      throw new Error(`Invalid token addresses in pair: ${JSON.stringify(pair)}`)
    }
  }

  const { callData, method } = getQuoterCalldata(route, amount, swapType)

  return {
    call: {
      target: UniswapV3Contracts.quoterAddress,
      callData,
    },
    method,
  }
}

function getQuoterCalldata(route: Route, amount: bigint, swapType: SwapType) {
  if (route.length === 1) {
    return encodeExactSingleQuote(route[0], amount, swapType)
  }
  return encodeExactQuote(route, amount, swapType)
}

function encodeExactQuote(route: Route, amount: bigint, swapType: SwapType) {
  const encodedRoute = encodeRoute(route, swapType)

  switch (swapType) {
    case SwapType.EXACT_INPUT:
      return {
        callData: quoter.encodeFunctionData(QuoteMethod.EXACT_INPUT, [encodedRoute, amount.toString()]),
        method: QuoteMethod.EXACT_INPUT,
      }

    case SwapType.EXACT_OUTPUT:
      return {
        callData: quoter.encodeFunctionData(QuoteMethod.EXACT_OUTPUT, [encodedRoute, amount.toString()]),
        method: QuoteMethod.EXACT_OUTPUT,
      }

    default:
      throw new Error(`Unsupported swap type: ${swapType}`)
  }
}

function encodeExactSingleQuote(path: Pair, amount: bigint, swapType: SwapType) {
  switch (swapType) {
    case SwapType.EXACT_INPUT: {
      const exactInputParams = {
        tokenIn: path.tokenIn,
        tokenOut: path.tokenOut,
        amountIn: amount.toString(),
        fee: path.fee,
        sqrtPriceLimitX96: 0, // skip slippage for now
      }
      return {
        callData: quoter.encodeFunctionData(QuoteMethod.EXACT_INPUT_SINGLE, [exactInputParams]),
        method: QuoteMethod.EXACT_INPUT_SINGLE,
      }
    }

    case SwapType.EXACT_OUTPUT: {
      const exactOutputParams = {
        tokenIn: path.tokenIn,
        tokenOut: path.tokenOut,
        amount: amount.toString(), // This should be amountOut for exact output
        fee: path.fee,
        sqrtPriceLimitX96: 0, // Skip slippage for now // TODO
      }
      return {
        callData: quoter.encodeFunctionData(QuoteMethod.EXACT_OUTPUT_SINGLE, [exactOutputParams]),
        method: QuoteMethod.EXACT_OUTPUT_SINGLE,
      }
    }

    default:
      throw new Error(`Unsupported swap type: ${swapType}`)
  }
}
