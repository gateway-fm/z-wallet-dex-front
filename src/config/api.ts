import { runtimeConfig } from '../utils/runtime-config'

export const API_CONFIG = {
  get BASE_URL() {
    return runtimeConfig.getApiUrl()
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
