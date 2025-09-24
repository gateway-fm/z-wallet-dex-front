/**
 * Centralized cache configuration for the application
 * All cache durations and settings should be defined here
 */

// Cache durations in milliseconds
// eslint-disable-next-line import/no-unused-modules
export const CACHE_CONFIG = {
  // Token allowance caching
  ALLOWANCE: {
    // How long to cache allowance results before refetching
    DURATION: 30 * 1000, // 30 seconds
    // Maximum number of cached allowance entries
    MAX_ENTRIES: 100,
  },

  // RPC provider evaluation caching
  PROVIDER_EVALUATION: {
    // How long to cache provider performance metrics
    DURATION: 5 * 60 * 1000, // 5 minutes
    // Minimum interval between provider evaluations
    MIN_EVALUATION_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },

  // Block number polling intervals
  BLOCK_POLLING: {
    // Standard polling interval for other networks
    STANDARD_INTERVAL: 1000, // 1 second
    // Reduced polling interval for Zephyr network to minimize RPC load
    ZEPHYR_INTERVAL: 30 * 1000, // 30 seconds
  },

  // Transaction monitoring
  TRANSACTION_MONITORING: {
    // Health check intervals
    NETWORK_HEALTH_CHECK: {
      // Standard interval for network health checks
      STANDARD: 10 * 1000, // 10 seconds
      // Reduced interval for Zephyr network
      ZEPHYR: 5 * 60 * 1000, // 5 minutes
    },
    // Transaction status check intervals (in blocks)
    STATUS_CHECK_BLOCKS: {
      // Standard networks
      STANDARD: {
        IMMEDIATE: 1, // Check every block for fresh transactions
        SHORT_PENDING: 3, // Every 3 blocks for transactions pending 5+ minutes
        LONG_PENDING: 10, // Every 10 blocks for transactions pending 1+ hour
      },
      // Zephyr network (less frequent to reduce RPC load)
      ZEPHYR: {
        IMMEDIATE: 2, // Check every 2 blocks instead of every block
        SHORT_PENDING: 6, // Every 6 blocks for transactions pending 5+ minutes
        LONG_PENDING: 20, // Every 20 blocks for transactions pending 1+ hour
      },
    },
  },

  // General caching settings
  GENERAL: {
    // Default cache duration for miscellaneous data
    DEFAULT_DURATION: 60 * 1000, // 1 minute
    // Maximum cache size to prevent memory issues
    MAX_CACHE_SIZE: 1000,
    // Cleanup interval for expired cache entries
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },
} as const

// Helper functions for common cache operations
export const CacheUtils = {
  /**
   * Check if a cached entry is still valid
   */
  isValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration
  },

  /**
   * Create a cache key from multiple parameters
   */
  createKey(...params: (string | number | undefined)[]): string {
    return params.filter(Boolean).join('-')
  },

  /**
   * Get appropriate block check interval based on network and transaction age
   */
  getTransactionCheckInterval(chainId: number, minutesPending: number): number {
    const isZephyr = chainId === 9369 // ZEPHYR_CHAIN_ID
    const config = isZephyr
      ? CACHE_CONFIG.TRANSACTION_MONITORING.STATUS_CHECK_BLOCKS.ZEPHYR
      : CACHE_CONFIG.TRANSACTION_MONITORING.STATUS_CHECK_BLOCKS.STANDARD

    if (minutesPending > 60) {
      return config.LONG_PENDING
    } else if (minutesPending > 5) {
      return config.SHORT_PENDING
    } else {
      return config.IMMEDIATE
    }
  },

  /**
   * Get appropriate health check interval based on network
   */
  getHealthCheckInterval(chainId: number): number {
    const isZephyr = chainId === 9369 // ZEPHYR_CHAIN_ID
    return isZephyr
      ? CACHE_CONFIG.TRANSACTION_MONITORING.NETWORK_HEALTH_CHECK.ZEPHYR
      : CACHE_CONFIG.TRANSACTION_MONITORING.NETWORK_HEALTH_CHECK.STANDARD
  },

  /**
   * Get appropriate block polling interval based on network
   */
  getBlockPollingInterval(chainId: number): number {
    const isZephyr = chainId === 9369 // ZEPHYR_CHAIN_ID
    return isZephyr ? CACHE_CONFIG.BLOCK_POLLING.ZEPHYR_INTERVAL : CACHE_CONFIG.BLOCK_POLLING.STANDARD_INTERVAL
  },
}

export const ALLOWANCE_CACHE_DURATION = CACHE_CONFIG.ALLOWANCE.DURATION
export const PROVIDER_EVALUATION_CACHE_DURATION = CACHE_CONFIG.PROVIDER_EVALUATION.DURATION
