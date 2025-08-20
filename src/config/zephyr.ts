/* eslint-disable import/no-unused-modules */

export const NETWORK_CONFIG = {
  CHAIN_ID: Number(process.env.REACT_APP_CUSTOM_NETWORK_CHAIN_ID) || 1417429182,
  NAME: 'Zephyr',
  RPC: {
    PRIMARY: process.env.REACT_APP_CUSTOM_NETWORK_RPC_URL || 'https://zephyr-rpc.eu-north-2.gateway.fm',
    FALLBACK: process.env.REACT_APP_ZEPHYR_RPC_FALLBACK || '',
    TIMEOUT: Number(process.env.REACT_APP_RPC_TIMEOUT) || 10000,
  },
  EXPLORER: {
    URL: process.env.REACT_APP_CUSTOM_NETWORK_EXPLORER_URL || 'https://zephyr-blockscout.eu-north-2.gateway.fm/',
    API: process.env.REACT_APP_ZEPHYR_EXPLORER_API || 'https://zephyr-blockscout.eu-north-2.gateway.fm/api',
  },
  BRIDGE_URL: process.env.REACT_APP_CUSTOM_NETWORK_BRIDGE_URL || 'https://zephyr-bridge.eu-north-2.gateway.fm',
  FAUCET_URL: process.env.REACT_APP_CUSTOM_NETWORK_FAUCET_URL || 'https://zephyr-faucet.eu-north-2.gateway.fm',
} as const

export const ZEPHYR_CHAIN_ID = NETWORK_CONFIG.CHAIN_ID
export const ENABLE_ZEPHYR_ORDER_PROTOCOL = false

const hasZephyrContracts = !!(
  process.env.REACT_APP_ZEPHYR_LIQUIDITY_MANAGER_ADDRESS &&
  process.env.REACT_APP_ZEPHYR_EXCHANGER_ADDRESS &&
  process.env.REACT_APP_ZEPHYR_PAIR_FACTORY_ADDRESS
)

export const USE_ZEPHYR_ORDER_PROTOCOL = ENABLE_ZEPHYR_ORDER_PROTOCOL && hasZephyrContracts

export const CONTRACTS_CONFIG = {
  V3_CORE_FACTORY:
    process.env.REACT_APP_CUSTOM_NETWORK_V3_FACTORY_ADDRESS || '0xEB4F50E1879e9912Ff8FD73B20bCAd7F195c5EBD',
  POSITION_MANAGER:
    process.env.REACT_APP_CUSTOM_NETWORK_POSITION_MANAGER_ADDRESS || '0x684fB3F611fd294f305b3F58ba3be72cFa65b0b2',
  SWAP_ROUTER_02:
    process.env.REACT_APP_CUSTOM_NETWORK_SWAP_ROUTER_ADDRESS || '0x881f1D82139635c9190976F390305764bdBdEF3D',
  QUOTER_V2: process.env.REACT_APP_CUSTOM_NETWORK_QUOTER_ADDRESS || '0x49FC0204705C6E1F1A9458b78C3c9DB2c5Fe2717',
  MULTICALL2: process.env.REACT_APP_CUSTOM_NETWORK_MULTICALL_ADDRESS || '0xcA11bde05977b3631167028862bE2a173976CA11',
  TICK_LENS: process.env.REACT_APP_CUSTOM_NETWORK_TICK_LENS_ADDRESS || '0x9FdcfF6c3c58eFD2a3EA23E01EE02c51d31f13Db',
  V3_MIGRATOR: process.env.REACT_APP_CUSTOM_NETWORK_V3_MIGRATOR_ADDRESS || '0xdACEF64026d35EB778A2da9406aE9BE59737FEFb',
  DELEGATION: process.env.REACT_APP_CUSTOM_NETWORK_DELEGATION_ADDRESS || '0x227380efd3392EC33cf148Ade5e0a89D33121814',
  LIQUIDITY_MANAGER:
    process.env.REACT_APP_ZEPHYR_LIQUIDITY_MANAGER_ADDRESS ||
    process.env.REACT_APP_CUSTOM_NETWORK_POSITION_MANAGER_ADDRESS ||
    '0x684fB3F611fd294f305b3F58ba3be72cFa65b0b2',
  EXCHANGER:
    process.env.REACT_APP_ZEPHYR_EXCHANGER_ADDRESS ||
    process.env.REACT_APP_CUSTOM_NETWORK_SWAP_ROUTER_ADDRESS ||
    '0x881f1D82139635c9190976F390305764bdBdEF3D',
  PAIR_FACTORY:
    process.env.REACT_APP_ZEPHYR_PAIR_FACTORY_ADDRESS ||
    process.env.REACT_APP_CUSTOM_NETWORK_V3_FACTORY_ADDRESS ||
    '0xEB4F50E1879e9912Ff8FD73B20bCAd7F195c5EBD',
} as const

export const TOKENS_CONFIG = {
  WRAPPED_NATIVE: {
    ADDRESS:
      process.env.REACT_APP_CUSTOM_NETWORK_WRAPPED_NATIVE_ADDRESS || '0x08a19Ce4b93E957aDD175F61e022b81894e66720',
    SYMBOL: 'WZERO',
    NAME: 'Wrapped Zero',
    DECIMALS: 18,
  },
  USDC: {
    ADDRESS: process.env.REACT_APP_CUSTOM_NETWORK_USDC_ADDRESS || '0xDF4BDAC4Ba259127D1c53C07cdd005AD54CCAfb0',
    SYMBOL: 'USDC',
    NAME: 'USD Coin',
    DECIMALS: 6,
  },
} as const

export const FEATURES_CONFIG = {
  ANALYTICS_ENABLED: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
  GRAPHQL_ENABLED: process.env.REACT_APP_ENABLE_GRAPHQL !== 'false', // Default enabled
  PRIVACY_MODE: process.env.REACT_APP_PRIVACY_MODE === 'true',
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true',
  CACHE_ENABLED: process.env.REACT_APP_CACHE_ENABLED !== 'false',
  IS_STAGING: process.env.REACT_APP_STAGING === 'true',
  IS_UNISWAP_INTERFACE: process.env.REACT_APP_IS_UNISWAP_INTERFACE === 'true',
  SKIP_CSP: process.env.REACT_APP_SKIP_CSP === 'true',
} as const

export const API_CONFIG = {
  GRAPHQL: {
    URL:
      process.env.GRAPHQL_URL_OVERRIDE ||
      process.env.REACT_APP_AWS_API_ENDPOINT ||
      'https://api-zephyr-dex.platform-dev.gateway.fm/subgraphs/name/v3-tokens-mainnet',
    TIMEOUT: Number(process.env.REACT_APP_GRAPHQL_TIMEOUT) || 30000,
    RETRY_COUNT: Number(process.env.REACT_APP_GRAPHQL_RETRY_COUNT) || 3,
  },
  V2_SUBGRAPH: {
    URL:
      process.env.API_BASE_URL_V2_OVERRIDE ||
      process.env.REACT_APP_API_BASE_URL_V2_OVERRIDE ||
      'https://api-zephyr-dex.platform-dev.gateway.fm/subgraphs/name/v2',
  },
  GATEWAY: {
    URL:
      process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
      process.env.API_BASE_URL_OVERRIDE ||
      'https://api-zephyr-dex.platform-dev.gateway.fm',
  },
  CACHE: {
    TTL: Number(process.env.REACT_APP_CACHE_TTL) || 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: Number(process.env.REACT_APP_CACHE_MAX_SIZE) || 100,
  },
} as const

export const EXTERNAL_SERVICES_CONFIG = {
  INFURA_KEY: process.env.REACT_APP_INFURA_KEY || '',
  ALCHEMY_API_KEY: process.env.REACT_APP_ALCHEMY_API_KEY || '',
  WALLET_CONNECT_PROJECT_ID: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || '',
  Z_WALLET_CLIENT_URL: process.env.REACT_APP_Z_WALLET_CLIENT_URL || 'https://z-wallet-dev.zero.tech',
  Z_WALLET_PERSISTENCE_TTL: Number(process.env.REACT_APP_Z_WALLET_PERSISTENCE_TTL) || 24 * 60 * 60 * 1000, // 24 hours
} as const

// Type-safe exports
export type NetworkConfig = typeof NETWORK_CONFIG
export type ContractsConfig = typeof CONTRACTS_CONFIG
export type TokensConfig = typeof TOKENS_CONFIG
export type FeaturesConfig = typeof FEATURES_CONFIG
export type ApiConfig = typeof API_CONFIG
export type ExternalServicesConfig = typeof EXTERNAL_SERVICES_CONFIG
