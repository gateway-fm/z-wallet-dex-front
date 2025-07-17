// Centralized GraphQL constants for Zephyr DEX

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  // Analytics data (trending tokens, protocol stats, top pools) - 5 minutes
  ANALYTICS: 5 * 60 * 1000,

  // User positions - 30 seconds
  USER_POSITIONS: 30 * 1000,

  // Token prices - 30 seconds
  TOKEN_PRICES: 30 * 1000,
} as const

// Query limits
export const QUERY_LIMITS = {
  // Default number of tokens for search results
  DEFAULT_TOKEN_SEARCH: 20,

  // Default number of trending tokens
  DEFAULT_TRENDING_TOKENS: 10,

  // Default number of top pools
  DEFAULT_TOP_POOLS: 10,

  // Default number of user positions
  DEFAULT_USER_POSITIONS: 100,

  // Default number of user transactions
  DEFAULT_USER_TRANSACTIONS: 50,

  // Maximum pools to fetch for price calculation
  MAX_PRICE_POOLS: 100,
} as const

// Cache policies
export const CACHE_POLICIES = {
  // Standard cache-first policy for most GraphQL queries
  DEFAULT: 'cache-first' as const,

  // Network-only for health checks
  NETWORK_ONLY: 'network-only' as const,

  // Error policy for graceful degradation
  ERROR_POLICY: 'all' as const,
} as const
