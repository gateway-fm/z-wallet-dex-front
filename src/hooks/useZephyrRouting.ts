import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { USDC_ZEPHYR } from '../constants/tokens'
import { useTopPools } from './useProtocolStats'

/**
 * Simple trade calculation using GraphQL pool data
 */
export function useZephyrRouting(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  route: string
  loading: boolean
  error?: string
} {
  const { pools, loading: poolsLoading } = useTopPools(100) // Get more pools for routing

  return useMemo(() => {
    if (!amountSpecified || !otherCurrency || poolsLoading) {
      return { loading: poolsLoading, route: '', error: undefined }
    }

    // For EXACT_INPUT: amountSpecified = input amount, otherCurrency = output currency
    // For EXACT_OUTPUT: amountSpecified = output amount, otherCurrency = input currency
    const inputCurrency = tradeType === TradeType.EXACT_INPUT ? amountSpecified.currency : otherCurrency
    const outputCurrency = tradeType === TradeType.EXACT_INPUT ? otherCurrency : amountSpecified.currency

    // Look for direct pool between tokens
    const directPool = pools?.find((pool) => {
      const token0Address = pool.token0.id.toLowerCase()
      const token1Address = pool.token1.id.toLowerCase()
      const inputAddress = inputCurrency.wrapped.address.toLowerCase()
      const outputAddress = outputCurrency.wrapped.address.toLowerCase()

      return (
        (token0Address === inputAddress && token1Address === outputAddress) ||
        (token0Address === outputAddress && token1Address === inputAddress)
      )
    })

    if (directPool) {
      // Direct pool found - calculate trade

      return calculateDirectTrade(tradeType, amountSpecified, otherCurrency, directPool)
    }

    // Check for multi-hop routing through USDC
    const hasUSDCPair = inputCurrency.symbol === 'USDC' || outputCurrency.symbol === 'USDC'

    if (!hasUSDCPair && pools && pools.length > 0) {
      try {
        return calculateMultiHopTrade(tradeType, amountSpecified, otherCurrency, pools)
      } catch (error) {
        console.warn('Multi-hop routing failed:', error)
      }
    }

    // No route found - return error
    console.warn('No route found for', inputCurrency.symbol, '/', outputCurrency.symbol)

    return {
      loading: false,
      route: '',
      error: 'Pool does not exist',
      inputAmount: undefined,
      outputAmount: undefined,
    }
  }, [amountSpecified, otherCurrency, pools, poolsLoading, tradeType])
}

function calculateDirectTrade(
  tradeType: TradeType,
  amountSpecified: CurrencyAmount<Currency>,
  otherCurrency: Currency,
  pool: any
): {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  route: string
  loading: boolean
  error?: string
} {
  try {
    // For EXACT_INPUT: amountSpecified = input amount, otherCurrency = output currency
    // For EXACT_OUTPUT: amountSpecified = output amount, otherCurrency = input currency
    const inputCurrency = tradeType === TradeType.EXACT_INPUT ? amountSpecified.currency : otherCurrency
    const outputCurrency = tradeType === TradeType.EXACT_INPUT ? otherCurrency : amountSpecified.currency
    const isToken0Input = pool.token0.id.toLowerCase() === inputCurrency.wrapped.address.toLowerCase()

    // Get pool prices
    const token0Price = parseFloat(pool.token0Price || '0')
    const token1Price = parseFloat(pool.token1Price || '0')

    if (token0Price === 0 || token1Price === 0) {
      console.error('[calculateDirectTrade] Invalid pool prices', { token0Price, token1Price })
      throw new Error('Invalid pool prices')
    }

    let outputAmount: CurrencyAmount<Currency>

    if (tradeType === TradeType.EXACT_INPUT) {
      // Calculate output amount from input
      let exchangeRate: number

      if (isToken0Input) {
        // Input is token0, output is token1
        // According to GraphQL: token0Price = amount of token1 per 1 token0
        // So if we have X token0, we get X * token0Price token1
        exchangeRate = token0Price
      } else {
        // Input is token1, output is token0
        // According to GraphQL: token1Price = amount of token0 per 1 token1
        // So if we have X token1, we get X * token1Price token0
        exchangeRate = token1Price
      }

      // The GraphQL prices are for human-readable amounts, but we need to account for token decimals
      // Input amount is already in raw format (considering input token decimals)
      // We need to convert to output token decimals
      const inputAmountBigInt = amountSpecified.quotient

      // Get decimal difference between tokens
      const inputDecimals = inputCurrency.decimals
      const outputDecimals = outputCurrency.decimals
      const decimalDifference = outputDecimals - inputDecimals

      // Convert the floating point exchange rate to a ratio with proper scaling
      // Use high precision arithmetic to avoid floating point errors
      const PRECISION = 1e18
      const exchangeRateNumerator = JSBI.BigInt(Math.round(exchangeRate * PRECISION))
      const exchangeRateDenominator = JSBI.BigInt(PRECISION)

      // Apply exchange rate
      let outputAmountRaw = JSBI.divide(
        JSBI.multiply(inputAmountBigInt, exchangeRateNumerator),
        exchangeRateDenominator
      )

      // Adjust for decimal difference if necessary
      if (decimalDifference > 0) {
        // Output token has more decimals, multiply by 10^difference
        outputAmountRaw = JSBI.multiply(
          outputAmountRaw,
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimalDifference))
        )
      } else if (decimalDifference < 0) {
        // Output token has fewer decimals, divide by 10^|difference|
        outputAmountRaw = JSBI.divide(
          outputAmountRaw,
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(-decimalDifference))
        )
      }

      outputAmount = CurrencyAmount.fromRawAmount(outputCurrency, outputAmountRaw)
    } else {
      // For EXACT_OUTPUT, we need to calculate required input amount

      // First, create the correct output amount with proper currency and decimals
      const humanReadableAmount = amountSpecified.toExact()
      const parts = humanReadableAmount.split('.')
      const integerPart = parts[0] || '0'
      const decimalPart = parts[1] || ''
      const totalDigits =
        integerPart + decimalPart.padEnd(outputCurrency.decimals, '0').slice(0, outputCurrency.decimals)
      const outputRawAmount = JSBI.BigInt(totalDigits)
      outputAmount = CurrencyAmount.fromRawAmount(outputCurrency, outputRawAmount)

      let exchangeRate: number

      if (isToken0Input) {
        // Input is token0, need to calculate how much token0 for given token1
        // If token0Price = amount of token1 per 1 token0, then 1/token0Price = amount of token0 per 1 token1
        exchangeRate = 1 / token0Price
      } else {
        // Input is token1, need to calculate how much token1 for given token0
        // If token1Price = amount of token0 per 1 token1, then 1/token1Price = amount of token1 per 1 token0
        exchangeRate = 1 / token1Price
      }

      // Use the correct output amount
      const outputAmountBigInt = outputAmount.quotient

      // Get decimal difference between tokens
      const inputDecimals = inputCurrency.decimals
      const outputDecimals = outputCurrency.decimals
      const decimalDifference = inputDecimals - outputDecimals

      // Convert the floating point exchange rate to a ratio with proper scaling
      // Use high precision arithmetic to avoid floating point errors
      const PRECISION = 1e18
      const exchangeRateNumerator = JSBI.BigInt(Math.round(exchangeRate * PRECISION))
      const exchangeRateDenominator = JSBI.BigInt(PRECISION)

      // Apply exchange rate to get input amount
      let inputAmountRaw = JSBI.divide(
        JSBI.multiply(outputAmountBigInt, exchangeRateNumerator),
        exchangeRateDenominator
      )

      // Adjust for decimal difference if necessary
      if (decimalDifference > 0) {
        // Input token has more decimals, multiply by 10^difference
        inputAmountRaw = JSBI.multiply(
          inputAmountRaw,
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimalDifference))
        )
      } else if (decimalDifference < 0) {
        // Input token has fewer decimals, divide by 10^|difference|
        inputAmountRaw = JSBI.divide(
          inputAmountRaw,
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(-decimalDifference))
        )
      }

      const calculatedInputAmount = CurrencyAmount.fromRawAmount(inputCurrency, inputAmountRaw)

      const result = {
        inputAmount: calculatedInputAmount,
        outputAmount,
        route: `${inputCurrency.symbol} → ${otherCurrency.symbol}`,
        loading: false,
      }

      return result
    }

    const result = {
      inputAmount: tradeType === TradeType.EXACT_INPUT ? amountSpecified : undefined,
      outputAmount,
      route: `${inputCurrency.symbol} → ${otherCurrency.symbol}`,
      loading: false,
    }

    return result
  } catch (error) {
    console.error('Direct trade calculation failed:', error)
    return {
      loading: false,
      route: '',
      error: 'Trade calculation failed',
    }
  }
}

function calculateMultiHopTrade(
  tradeType: TradeType,
  amountSpecified: CurrencyAmount<Currency>,
  otherCurrency: Currency,
  pools: any[]
): {
  inputAmount?: CurrencyAmount<Currency>
  outputAmount?: CurrencyAmount<Currency>
  route: string
  loading: boolean
  error?: string
} {
  try {
    const inputCurrency = amountSpecified.currency
    const usdcAddress = USDC_ZEPHYR.address.toLowerCase()

    // Find pool from input currency to USDC
    const inputToUsdcPool = pools.find((pool) => {
      const hasInputToken =
        pool.token0.id.toLowerCase() === inputCurrency.wrapped.address.toLowerCase() ||
        pool.token1.id.toLowerCase() === inputCurrency.wrapped.address.toLowerCase()
      const hasUsdcToken = pool.token0.id.toLowerCase() === usdcAddress || pool.token1.id.toLowerCase() === usdcAddress
      return hasInputToken && hasUsdcToken
    })

    // Find pool from USDC to output currency
    const usdcToOutputPool = pools.find((pool) => {
      const hasUsdcToken = pool.token0.id.toLowerCase() === usdcAddress || pool.token1.id.toLowerCase() === usdcAddress
      const hasOutputToken =
        pool.token0.id.toLowerCase() === otherCurrency.wrapped.address.toLowerCase() ||
        pool.token1.id.toLowerCase() === otherCurrency.wrapped.address.toLowerCase()
      return hasUsdcToken && hasOutputToken
    })

    if (!inputToUsdcPool || !usdcToOutputPool) {
      throw new Error('Multi-hop route not available')
    }

    // Calculate first hop: input -> USDC
    const inputToUsdcResult = calculateDirectTrade(tradeType, amountSpecified, USDC_ZEPHYR, inputToUsdcPool)
    if (inputToUsdcResult.error || !inputToUsdcResult.outputAmount) {
      throw new Error('First hop calculation failed')
    }

    // Calculate second hop: USDC -> output
    const usdcToOutputResult = calculateDirectTrade(
      tradeType,
      inputToUsdcResult.outputAmount,
      otherCurrency,
      usdcToOutputPool
    )
    if (usdcToOutputResult.error || !usdcToOutputResult.outputAmount) {
      throw new Error('Second hop calculation failed')
    }

    // Apply slippage for multi-hop (0.5% per hop = 1% total)
    const finalOutput = usdcToOutputResult.outputAmount.multiply(99).divide(100)

    return {
      inputAmount: tradeType === TradeType.EXACT_INPUT ? amountSpecified : undefined,
      outputAmount: CurrencyAmount.fromRawAmount(otherCurrency, finalOutput.quotient),
      route: `${inputCurrency.symbol} → USDC → ${otherCurrency.symbol}`,
      loading: false,
    }
  } catch (error) {
    console.error('Multi-hop trade calculation failed:', error)
    return {
      loading: false,
      route: '',
      error: 'Multi-hop trade calculation failed',
    }
  }
}
