import { useQuery } from 'react-query'

import { Api } from './Api'
import { API_CACHE } from './constants'
import { getApiBaseUrl } from './helpers'

const api = new Api({ baseURL: getApiBaseUrl() })

export function useSearchTokens(searchQuery: string, enabled = true) {
  return useQuery(
    ['searchTokens', searchQuery],
    async () => {
      if (!searchQuery) return { data: [] }

      const response = await api.tokens.searchToken({ q: searchQuery })
      return response.data
    },
    {
      enabled: enabled && Boolean(searchQuery),
      staleTime: API_CACHE.STALE_TIME,
      cacheTime: API_CACHE.GC_TIME,
    }
  )
}

export function useTrendingTokens(limit = 10) {
  return useQuery(
    ['trendingTokens', limit],
    async () => {
      const response = await api.tokens.listTokens({ page: 1, per_page: limit })
      return response.data
    },
    {
      staleTime: API_CACHE.STALE_TIME,
      cacheTime: API_CACHE.GC_TIME,
    }
  )
}

export function useTokenDetails(address: string, enabled = true) {
  return useQuery(
    ['tokenDetails', address],
    async () => {
      const response = await api.tokens.getToken(address)
      return response.data
    },
    {
      enabled: enabled && Boolean(address),
      staleTime: API_CACHE.STALE_TIME,
      cacheTime: API_CACHE.GC_TIME,
    }
  )
}

export function useHealthCheck() {
  return useQuery(
    ['healthCheck'],
    async () => {
      await api.health.healthCheck()
      return true
    },
    {
      staleTime: API_CACHE.STALE_TIME,
      cacheTime: API_CACHE.GC_TIME,
      retry: 3,
    }
  )
}
