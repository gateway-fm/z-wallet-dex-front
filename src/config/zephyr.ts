/* eslint-disable import/no-unused-modules */

import { runtimeConfig } from '../utils/runtime-config'

export const NETWORK_CONFIG = {
  get CHAIN_ID() {
    return runtimeConfig.getChainId()
  },
  get NAME() {
    return runtimeConfig.getNetworkName()
  },
  RPC: {
    get PRIMARY() {
      return runtimeConfig.getRpcUrl()
    },
    get FALLBACK() {
      return runtimeConfig.getRpcFallback()
    },
    get TIMEOUT() {
      return runtimeConfig.getRpcTimeout()
    },
  },
  EXPLORER: {
    get URL() {
      return runtimeConfig.getExplorerUrl()
    },
    get API() {
      return runtimeConfig.getExplorerApi()
    },
  },
  get BRIDGE_URL() {
    return runtimeConfig.getBridgeUrl()
  },
  get FAUCET_URL() {
    return runtimeConfig.getFaucetUrl()
  },
  BASE_TOKEN: {
    get ADDRESS() {
      return runtimeConfig.getBaseTokenAddress()
    },
    get SYMBOL() {
      return runtimeConfig.getBaseTokenSymbol()
    },
    get NAME() {
      return runtimeConfig.getBaseTokenName()
    },
  },
} as const

export const ZEPHYR_CHAIN_ID = NETWORK_CONFIG.CHAIN_ID
export const ENABLE_ZEPHYR_ORDER_PROTOCOL = false

const hasZephyrContracts = () =>
  !!(
    runtimeConfig.getLiquidityManagerAddress() &&
    runtimeConfig.getExchangerAddress() &&
    runtimeConfig.getPairFactoryAddress()
  )

export const USE_ZEPHYR_ORDER_PROTOCOL = ENABLE_ZEPHYR_ORDER_PROTOCOL && hasZephyrContracts()

export const CONTRACTS_CONFIG = {
  get V3_CORE_FACTORY() {
    return runtimeConfig.getV3FactoryAddress()
  },
  get POSITION_MANAGER() {
    return runtimeConfig.getPositionManagerAddress()
  },
  get SWAP_ROUTER_02() {
    return runtimeConfig.getSwapRouterAddress()
  },
  get QUOTER_V2() {
    return runtimeConfig.getQuoterAddress()
  },
  get MULTICALL2() {
    return runtimeConfig.getMulticallAddress()
  },
  get TICK_LENS() {
    return runtimeConfig.getTickLensAddress()
  },
  get V3_MIGRATOR() {
    return runtimeConfig.getV3MigratorAddress()
  },
  get DELEGATION() {
    return runtimeConfig.getDelegationAddress()
  },
  get LIQUIDITY_MANAGER() {
    return runtimeConfig.getLiquidityManagerAddress() || runtimeConfig.getPositionManagerAddress()
  },
  get EXCHANGER() {
    return runtimeConfig.getExchangerAddress() || runtimeConfig.getSwapRouterAddress()
  },
  get PAIR_FACTORY() {
    return runtimeConfig.getPairFactoryAddress() || runtimeConfig.getV3FactoryAddress()
  },
} as const

export const TOKENS_CONFIG = {
  WRAPPED_NATIVE: {
    get ADDRESS() {
      return runtimeConfig.getWrappedNativeAddress()
    },
    SYMBOL: 'WZERO',
    NAME: 'Wrapped Zero',
    DECIMALS: 18,
  },
  USDC: {
    get ADDRESS() {
      return runtimeConfig.getUsdcAddress()
    },
    SYMBOL: 'USDC',
    NAME: 'USD Coin',
    DECIMALS: 6,
  },
} as const

export const FEATURES_CONFIG = {
  get ANALYTICS_ENABLED() {
    return runtimeConfig.isAnalyticsEnabled()
  },
  get GRAPHQL_ENABLED() {
    return runtimeConfig.isGraphqlEnabled()
  },
  get PRIVACY_MODE() {
    return runtimeConfig.isPrivacyMode()
  },
  get DEBUG_MODE() {
    return runtimeConfig.isDebugMode()
  },
  get CACHE_ENABLED() {
    return runtimeConfig.isCacheEnabled()
  },
  get IS_STAGING() {
    return runtimeConfig.isStaging()
  },
  get IS_UNISWAP_INTERFACE() {
    return runtimeConfig.isUniswapInterface()
  },
  get SKIP_CSP() {
    return runtimeConfig.shouldSkipCsp()
  },
} as const

export const EXTERNAL_SERVICES_CONFIG = {
  get INFURA_KEY() {
    return runtimeConfig.getInfuraKey()
  },
  get ALCHEMY_API_KEY() {
    return runtimeConfig.getAlchemyApiKey()
  },
  get WALLET_CONNECT_PROJECT_ID() {
    return runtimeConfig.getWalletConnectProjectId()
  },
  get Z_WALLET_CLIENT_URL() {
    return runtimeConfig.getZWalletClientUrl()
  },
  get Z_WALLET_CHAIN_ID() {
    return NETWORK_CONFIG.CHAIN_ID
  },
  get Z_WALLET_RPC_URL() {
    return runtimeConfig.getZWalletRpcUrl()
  },
  get Z_WALLET_EXPLORER_URL() {
    return runtimeConfig.getZWalletExplorerUrl()
  },
  get Z_WALLET_PERSISTENCE_TTL() {
    return runtimeConfig.getZWalletPersistenceTtl()
  },
  get Z_WALLET_TIMEOUT() {
    return runtimeConfig.getZWalletTimeout()
  },
} as const

export const TOKEN_FILTER_CONFIG = {
  get QUICK_ACCESS_TOKENS() {
    return runtimeConfig.getQuickAccessTokens()
  },
} as const

export type TokenFilterConfig = typeof TOKEN_FILTER_CONFIG

/**
 * Utility function to check if a token should be included in quick access
 */
export function shouldIncludeInQuickAccess(token: { address: string; symbol?: string }): boolean {
  const quickAccessTokens = TOKEN_FILTER_CONFIG.QUICK_ACCESS_TOKENS

  // If no quick access tokens configured, include all (fallback to top pools logic)
  if (quickAccessTokens.length === 0) {
    return true
  }

  const tokenSymbol = token.symbol?.toUpperCase() || ''

  // Check if token symbol is in quick access list
  return quickAccessTokens.some((symbol) => tokenSymbol === symbol.toUpperCase())
}
