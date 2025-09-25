import { runtimeConfig } from '../utils/runtime-config'

export const POSITIONS_API_CONFIG = {
  get BASE_URL() {
    return runtimeConfig.getPositionsApiUrl()
  },
  get ENABLED() {
    return runtimeConfig.isPositionsApiEnabled()
  },
  CACHE: {
    get STALE_TIME() {
      return runtimeConfig.getApiCacheStaleTime()
    },
    get GC_TIME() {
      return runtimeConfig.getApiCacheGcTime()
    },
  },
} as const
