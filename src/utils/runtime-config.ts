/**
 * Runtime configuration utility
 * Provides access to environment variables that can be changed without rebuilding
 */

interface RuntimeConfig {
  // Network Configuration
  CHAIN_ID: number
  NETWORK_NAME: string
  RPC_URL: string
  RPC_FALLBACK: string
  RPC_TIMEOUT: number

  // Explorer Configuration
  EXPLORER_URL: string
  EXPLORER_API: string

  // Service URLs
  BRIDGE_URL: string
  FAUCET_URL: string

  // API Configuration
  API_URL: string
  API_CACHE_STALE_TIME: number
  API_CACHE_GC_TIME: number

  // Token Configuration
  BASE_TOKEN_ADDRESS: string
  BASE_TOKEN_SYMBOL: string
  BASE_TOKEN_NAME: string

  // Contract Addresses
  V3_FACTORY_ADDRESS: string
  POSITION_MANAGER_ADDRESS: string
  SWAP_ROUTER_ADDRESS: string
  QUOTER_ADDRESS: string
  MULTICALL_ADDRESS: string
  TICK_LENS_ADDRESS: string
  V3_MIGRATOR_ADDRESS: string
  DELEGATION_ADDRESS: string

  // Zephyr Protocol Addresses (optional)
  LIQUIDITY_MANAGER_ADDRESS: string
  EXCHANGER_ADDRESS: string
  PAIR_FACTORY_ADDRESS: string

  // Token Addresses
  WRAPPED_NATIVE_ADDRESS: string

  // Feature Flags
  ANALYTICS_ENABLED: boolean
  GRAPHQL_ENABLED: boolean
  PRIVACY_MODE: boolean
  DEBUG_MODE: boolean
  CACHE_ENABLED: boolean
  IS_STAGING: boolean
  IS_UNISWAP_INTERFACE: boolean
  SKIP_CSP: boolean

  // External Services
  INFURA_KEY: string
  ALCHEMY_API_KEY: string
  WALLET_CONNECT_PROJECT_ID: string
  Z_WALLET_CLIENT_URL: string
  Z_WALLET_CHAIN_ID: number
  Z_WALLET_RPC_URL: string
  Z_WALLET_EXPLORER_URL: string
  Z_WALLET_PERSISTENCE_TTL: number
  Z_WALLET_TIMEOUT: number

  // Token Filter
  QUICK_ACCESS_TOKENS: string
}

declare global {
  interface Window {
    ENV_CONFIG?: RuntimeConfig
  }
}

/**
 * Get runtime configuration value with fallback to build-time env var
 */
function getRuntimeConfig<K extends keyof RuntimeConfig>(
  key: K,
  buildTimeEnvVar: string,
  defaultValue?: RuntimeConfig[K]
): RuntimeConfig[K] {
  // Try runtime config first
  if (typeof window !== 'undefined' && window.ENV_CONFIG && window.ENV_CONFIG[key] !== undefined) {
    return window.ENV_CONFIG[key]
  }

  // Fallback to build-time environment variable
  const envValue = process.env[buildTimeEnvVar]
  if (envValue !== undefined) {
    // Handle type conversions
    if (typeof defaultValue === 'number') {
      return Number(envValue) as RuntimeConfig[K]
    }
    if (typeof defaultValue === 'boolean') {
      return (envValue === 'true') as RuntimeConfig[K]
    }
    return envValue as RuntimeConfig[K]
  }

  // Return default value
  return defaultValue as RuntimeConfig[K]
}

export const runtimeConfig = {
  // Network Configuration
  getChainId: () => getRuntimeConfig('CHAIN_ID', 'REACT_APP_CUSTOM_NETWORK_CHAIN_ID', 9369),
  getNetworkName: () => getRuntimeConfig('NETWORK_NAME', 'REACT_APP_CUSTOM_NETWORK_NAME', 'Zephyr'),
  getRpcUrl: () =>
    getRuntimeConfig('RPC_URL', 'REACT_APP_CUSTOM_NETWORK_RPC_URL', 'https://zephyr-rpc.eu-north-2.gateway.fm'),
  getRpcFallback: () => getRuntimeConfig('RPC_FALLBACK', 'REACT_APP_ZEPHYR_RPC_FALLBACK', ''),
  getRpcTimeout: () => getRuntimeConfig('RPC_TIMEOUT', 'REACT_APP_RPC_TIMEOUT', 10000),

  // Explorer Configuration
  getExplorerUrl: () =>
    getRuntimeConfig(
      'EXPLORER_URL',
      'REACT_APP_CUSTOM_NETWORK_EXPLORER_URL',
      'https://zephyr-blockscout.eu-north-2.gateway.fm/'
    ),
  getExplorerApi: () =>
    getRuntimeConfig(
      'EXPLORER_API',
      'REACT_APP_ZEPHYR_EXPLORER_API',
      'https://zephyr-blockscout.eu-north-2.gateway.fm/api'
    ),

  // Service URLs
  getBridgeUrl: () =>
    getRuntimeConfig(
      'BRIDGE_URL',
      'REACT_APP_CUSTOM_NETWORK_BRIDGE_URL',
      'https://zephyr-bridge.eu-north-2.gateway.fm'
    ),
  getFaucetUrl: () =>
    getRuntimeConfig(
      'FAUCET_URL',
      'REACT_APP_CUSTOM_NETWORK_FAUCET_URL',
      'https://zephyr-faucet.eu-north-2.gateway.fm'
    ),

  // API Configuration
  getApiUrl: () =>
    getRuntimeConfig('API_URL', 'REACT_APP_API_URL', 'https://api-swap-zephyr.platform-dev.gateway.fm/api/v1'),
  getApiCacheStaleTime: () => getRuntimeConfig('API_CACHE_STALE_TIME', 'REACT_APP_API_CACHE_STALE_TIME', 5 * 60 * 1000),
  getApiCacheGcTime: () => getRuntimeConfig('API_CACHE_GC_TIME', 'REACT_APP_API_CACHE_GC_TIME', 10 * 60 * 1000),

  // Token Configuration
  getBaseTokenAddress: () =>
    getRuntimeConfig(
      'BASE_TOKEN_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_USDC_ADDRESS',
      '0xdf4bdac4ba259127d1c53c07cdd005ad54ccafb0'
    ),
  getBaseTokenSymbol: () => getRuntimeConfig('BASE_TOKEN_SYMBOL', 'REACT_APP_ZEPHYR_BASE_TOKEN_SYMBOL', 'USDC'),
  getBaseTokenName: () => getRuntimeConfig('BASE_TOKEN_NAME', 'REACT_APP_ZEPHYR_BASE_TOKEN_NAME', 'USD Coin'),

  // Contract Addresses
  getV3FactoryAddress: () =>
    getRuntimeConfig(
      'V3_FACTORY_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_V3_FACTORY_ADDRESS',
      '0xEB4F50E1879e9912Ff8FD73B20bCAd7F195c5EBD'
    ),
  getPositionManagerAddress: () =>
    getRuntimeConfig(
      'POSITION_MANAGER_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_POSITION_MANAGER_ADDRESS',
      '0x684fB3F611fd294f305b3F58ba3be72cFa65b0b2'
    ),
  getSwapRouterAddress: () =>
    getRuntimeConfig(
      'SWAP_ROUTER_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_SWAP_ROUTER_ADDRESS',
      '0x881f1D82139635c9190976F390305764bdBdEF3D'
    ),
  getQuoterAddress: () =>
    getRuntimeConfig(
      'QUOTER_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_QUOTER_ADDRESS',
      '0x49FC0204705C6E1F1A9458b78C3c9DB2c5Fe2717'
    ),
  getMulticallAddress: () =>
    getRuntimeConfig(
      'MULTICALL_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_MULTICALL_ADDRESS',
      '0xcA11bde05977b3631167028862bE2a173976CA11'
    ),
  getTickLensAddress: () =>
    getRuntimeConfig(
      'TICK_LENS_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_TICK_LENS_ADDRESS',
      '0x9FdcfF6c3c58eFD2a3EA23E01EE02c51d31f13Db'
    ),
  getV3MigratorAddress: () =>
    getRuntimeConfig(
      'V3_MIGRATOR_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_V3_MIGRATOR_ADDRESS',
      '0xdACEF64026d35EB778A2da9406aE9BE59737FEFb'
    ),
  // NOTE: REACT_APP_CUSTOM_NETWORK_DELEGATION_ADDRESS is not used in current solution but kept for compatibility
  getDelegationAddress: () =>
    getRuntimeConfig(
      'DELEGATION_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_DELEGATION_ADDRESS',
      '0x227380efd3392EC33cf148Ade5e0a89D33121814'
    ),

  // Zephyr Protocol Addresses
  getLiquidityManagerAddress: () =>
    getRuntimeConfig('LIQUIDITY_MANAGER_ADDRESS', 'REACT_APP_ZEPHYR_LIQUIDITY_MANAGER_ADDRESS', ''),
  getExchangerAddress: () => getRuntimeConfig('EXCHANGER_ADDRESS', 'REACT_APP_ZEPHYR_EXCHANGER_ADDRESS', ''),
  getPairFactoryAddress: () => getRuntimeConfig('PAIR_FACTORY_ADDRESS', 'REACT_APP_ZEPHYR_PAIR_FACTORY_ADDRESS', ''),

  // Token Addresses
  getWrappedNativeAddress: () =>
    getRuntimeConfig(
      'WRAPPED_NATIVE_ADDRESS',
      'REACT_APP_CUSTOM_NETWORK_WRAPPED_NATIVE_ADDRESS',
      '0x08a19Ce4b93E957aDD175F61e022b81894e66720'
    ),

  // Feature Flags
  isAnalyticsEnabled: () => getRuntimeConfig('ANALYTICS_ENABLED', 'REACT_APP_ANALYTICS_ENABLED', false),
  isGraphqlEnabled: () => getRuntimeConfig('GRAPHQL_ENABLED', 'REACT_APP_ENABLE_GRAPHQL', true),
  isPrivacyMode: () => getRuntimeConfig('PRIVACY_MODE', 'REACT_APP_PRIVACY_MODE', false),
  isDebugMode: () => getRuntimeConfig('DEBUG_MODE', 'REACT_APP_DEBUG_MODE', false),
  isCacheEnabled: () => getRuntimeConfig('CACHE_ENABLED', 'REACT_APP_CACHE_ENABLED', true),
  isStaging: () => getRuntimeConfig('IS_STAGING', 'REACT_APP_STAGING', false),
  isUniswapInterface: () => getRuntimeConfig('IS_UNISWAP_INTERFACE', 'REACT_APP_IS_UNISWAP_INTERFACE', false),
  shouldSkipCsp: () => getRuntimeConfig('SKIP_CSP', 'REACT_APP_SKIP_CSP', false),

  // External Services
  getInfuraKey: () => getRuntimeConfig('INFURA_KEY', 'REACT_APP_INFURA_KEY', ''),
  getAlchemyApiKey: () => getRuntimeConfig('ALCHEMY_API_KEY', 'REACT_APP_ALCHEMY_API_KEY', ''),
  getWalletConnectProjectId: () =>
    getRuntimeConfig('WALLET_CONNECT_PROJECT_ID', 'REACT_APP_WALLET_CONNECT_PROJECT_ID', ''),
  getZWalletClientUrl: () => getRuntimeConfig('Z_WALLET_CLIENT_URL', 'REACT_APP_Z_WALLET_CLIENT_URL'),
  getZWalletRpcUrl: () => getRuntimeConfig('Z_WALLET_RPC_URL', 'REACT_APP_Z_WALLET_RPC_URL', 'https://rpc.zchain.org/'),
  getZWalletExplorerUrl: () =>
    getRuntimeConfig('Z_WALLET_EXPLORER_URL', 'REACT_APP_Z_WALLET_EXPLORER_URL', 'https://zscan.live/'),
  getZWalletPersistenceTtl: () =>
    getRuntimeConfig('Z_WALLET_PERSISTENCE_TTL', 'REACT_APP_Z_WALLET_PERSISTENCE_TTL', 24 * 60 * 60 * 1000),
  getZWalletTimeout: () => getRuntimeConfig('Z_WALLET_TIMEOUT', 'REACT_APP_Z_WALLET_TIMEOUT', 60000),

  // Token Filter
  getQuickAccessTokens: () =>
    getRuntimeConfig('QUICK_ACCESS_TOKENS', 'REACT_APP_QUICK_ACCESS_TOKENS', 'USDC,TEST')
      .split(',')
      .map((s) => s.trim()),
}
