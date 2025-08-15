export const API_CONFIG = {
  // Base URL for the REST API
  // Can be set via environment variable: REACT_APP_API_URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  CACHE: {
    STALE_TIME: Number(process.env.REACT_APP_API_CACHE_STALE_TIME) || 5 * 60 * 1000, // 5 minutes
    GC_TIME: Number(process.env.REACT_APP_API_CACHE_GC_TIME) || 10 * 60 * 1000, // 10 minutes
  },
} as const
