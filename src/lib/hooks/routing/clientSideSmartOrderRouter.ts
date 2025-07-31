import type { Web3Provider } from '@ethersproject/providers'
import { BigintIsh, ChainId, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
// This file is lazy-loaded, so the import of smart-order-router is intentional.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  AlphaRouter,
  AlphaRouterConfig,
  OnChainQuoteProvider,
  UniswapMulticallProvider,
} from '@uniswap/smart-order-router'
import { asSupportedChain } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { nativeOnChain } from 'constants/tokens'
import JSBI from 'jsbi'
import AppStaticJsonRpcProvider from 'rpc/StaticJsonRpcProvider'
import { GetQuoteArgs, QuoteResult, QuoteState, SwapRouterNativeAssets } from 'state/routing/types'
import { transformSwapRouteToGetQuoteResult } from 'utils/transformSwapRouteToGetQuoteResult'

const tokenValidatorProvider = {
  validateTokens: async () => ({ getValidationByToken: () => undefined }),
}

type RouterAndProvider = { router: AlphaRouter; provider: AppStaticJsonRpcProvider | Web3Provider }
let cachedProviderRouter: { chainId: number; routerProvider: RouterAndProvider } | undefined = undefined
const routers = new Map<ChainId, RouterAndProvider>()
export function getRouter(chainId: ChainId, web3Provider: Web3Provider | undefined): RouterAndProvider {
  const providerChainId = web3Provider?.network?.chainId
  if (
    cachedProviderRouter !== undefined &&
    chainId === providerChainId &&
    web3Provider === cachedProviderRouter.routerProvider.provider
  ) {
    return cachedProviderRouter.routerProvider
  } else {
    cachedProviderRouter = undefined
  }
  if (providerChainId !== undefined && chainId === providerChainId && web3Provider !== undefined) {
    const multicall2Provider = new UniswapMulticallProvider(chainId, web3Provider, 200000)
    const onChainQuoteProvider = new OnChainQuoteProvider(
      chainId,
      web3Provider,
      multicall2Provider,
      {
        retries: 2,
        minTimeout: 100,
        maxTimeout: 1000,
      },
      () => ({
        multicallChunk: 10,
        gasLimitPerCall: 12000000,
        quoteMinSuccessRate: 0.1,
      }),
      {
        gasLimitOverride: 20000000,
        multicallChunk: 6,
      },
      {
        gasLimitOverride: 20000000,
        multicallChunk: 6,
      }
    )
    cachedProviderRouter = {
      chainId,
      routerProvider: {
        router: new AlphaRouter({
          chainId,
          provider: web3Provider,
          multicall2Provider,
          onChainQuoteProvider,
          tokenValidatorProvider,
        }),
        provider: web3Provider,
      },
    }
    return cachedProviderRouter?.routerProvider
  }
  const router = routers.get(chainId)
  if (router) return router

  const supportedChainId = asSupportedChain(chainId)
  if (supportedChainId) {
    const provider = RPC_PROVIDERS[supportedChainId]
    const routerProvider = {
      router: new AlphaRouter({ chainId, provider, tokenValidatorProvider }),
      provider,
    }
    routers.set(chainId, routerProvider)
    return routerProvider
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
}

async function getQuote(
  {
    tradeType,
    tokenIn,
    tokenOut,
    amount: amountRaw,
  }: {
    tradeType: TradeType
    tokenIn: { address: string; chainId: number; decimals: number; symbol?: string }
    tokenOut: { address: string; chainId: number; decimals: number; symbol?: string }
    amount: BigintIsh
  },
  router: AlphaRouter,
  routerConfig: Partial<AlphaRouterConfig>
): Promise<QuoteResult> {
  const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenIn.address as SwapRouterNativeAssets)
  const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOut.address as SwapRouterNativeAssets)

  const currencyIn = tokenInIsNative
    ? nativeOnChain(tokenIn.chainId)
    : new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol)
  const currencyOut = tokenOutIsNative
    ? nativeOnChain(tokenOut.chainId)
    : new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol)

  const baseCurrency = tradeType === TradeType.EXACT_INPUT ? currencyIn : currencyOut
  const quoteCurrency = tradeType === TradeType.EXACT_INPUT ? currencyOut : currencyIn

  const amount = CurrencyAmount.fromRawAmount(baseCurrency, JSBI.BigInt(amountRaw))
  // TODO (WEB-2055): explore initializing client side routing on first load (when amountRaw is null) if there are enough users using client-side router preference.
  const swapRoute = await router.route(amount, quoteCurrency, tradeType, /*swapConfig=*/ undefined, routerConfig)

  if (!swapRoute) {
    return { state: QuoteState.NOT_FOUND }
  }

  return transformSwapRouteToGetQuoteResult(tradeType, amount, swapRoute)
}

export async function getClientSideQuote(
  {
    tokenInAddress,
    tokenInChainId,
    tokenInDecimals,
    tokenInSymbol,
    tokenOutAddress,
    tokenOutChainId,
    tokenOutDecimals,
    tokenOutSymbol,
    amount,
    tradeType,
  }: GetQuoteArgs,
  router: AlphaRouter,
  config: Partial<AlphaRouterConfig>
) {
  return getQuote(
    {
      tradeType,
      tokenIn: {
        address: tokenInAddress,
        chainId: tokenInChainId,
        decimals: tokenInDecimals,
        symbol: tokenInSymbol,
      },
      tokenOut: {
        address: tokenOutAddress,
        chainId: tokenOutChainId,
        decimals: tokenOutDecimals,
        symbol: tokenOutSymbol,
      },
      amount,
    },
    router,
    config
  )
}
