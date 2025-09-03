export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://api-swap-zephyr.platform-dev.gateway.fm/api/v1',
  CACHE: {
    STALE_TIME: Number(process.env.REACT_APP_API_CACHE_STALE_TIME) || 5 * 60 * 1000, // 5 minutes
    GC_TIME: Number(process.env.REACT_APP_API_CACHE_GC_TIME) || 10 * 60 * 1000, // 10 minutes
  },
} as const
