import { ethers } from 'ethers'
import QuoterABI from './abis/Quoter.json'
import MulticallABI from './abis/Multicall3.json'
import { ProviderUrl, UniswapV3Contracts } from './config'
import { Pair, QuoteMethod, QuoteResult, Route, SwapType } from './types'
import { encodeRoute } from './utils'

const quoter = new ethers.utils.Interface(QuoterABI)
const provider = new ethers.providers.JsonRpcProvider(ProviderUrl)
const multicall = new ethers.Contract(UniswapV3Contracts.multicallAddress, MulticallABI, provider)

export async function findBestRoute(amount: bigint, routes: Route[], swapType: SwapType) {
  const requests = routes.map((route) => getQuoteRequest(amount, route, swapType))

  let response: { success: boolean; returnData: string }[]

  try {
    response = await multicall.callStatic.tryAggregate(
      false,
      requests.map((req) => req.call)
    )
  } catch (error) {
    console.error('Error during multicall:', error)
    throw new Error('Failed to fetch quotes from the quoter contract')
  }

  const result: QuoteResult[] = []
  response.map((data, i) => {
    const { success, returnData } = data
    let amountQuoted: bigint = BigInt(0)
    const { method } = requests[i]

    if (success) {
      try {
        const decoded = quoter.decodeFunctionResult(method, returnData)
        amountQuoted = BigInt(decoded[0].toString())
      } catch (e) {
        console.error(`Error decoding result for path ${i}:`, e)
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
    console.warn('No valid quotes found for the given routes')
    return null
  }

  const bestRoute = filteredResult.reduce((best, current) => {
    if (!best || current.amountQuoted > best.amountQuoted) {
      return current
    }
    return best
  })

  console.log('Best route found:', bestRoute.amountQuoted.toString(), 'for route:', bestRoute.route)

  return bestRoute
}

function getQuoteRequest(amount: bigint, route: Route, swapType: SwapType) {
  if (route.length === 0) {
    throw new Error('Route must contain at least one pair')
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
    case SwapType.EXACT_INPUT:
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

    case SwapType.EXACT_OUTPUT:
      const exactOutputParams = {
        tokenIn: path.tokenIn,
        tokenOut: path.tokenOut,
        amount: amount.toString(),
        fee: path.fee,
        sqrtPriceLimitX96: 0, // skip slippage for now
      }
      return {
        callData: quoter.encodeFunctionData(QuoteMethod.EXACT_OUTPUT_SINGLE, [exactOutputParams]),
        method: QuoteMethod.EXACT_OUTPUT_SINGLE,
      }

    default:
      throw new Error(`Unsupported swap type: ${swapType}`)
  }
}
