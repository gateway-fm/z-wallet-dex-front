import { useQuery } from 'react-query'

import { RouteType } from './Api'
import { API_CACHE } from './constants'
import apiInstance from './index'

export function useSearchTokens(searchQuery: string, enabled = true) {
  return useQuery(
    ['searchTokens', searchQuery],
    async () => {
      if (!searchQuery) return { data: [] }

      const response = await apiInstance.tokens.searchToken({ q: searchQuery })
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
      const response = await apiInstance.tokens.listTokens({ page: 1, per_page: limit })
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
      const response = await apiInstance.tokens.getToken(address)
      return response.data
    },
    {
      enabled: enabled && Boolean(address),
      staleTime: API_CACHE.STALE_TIME,
      cacheTime: API_CACHE.GC_TIME,
    }
  )
}

export function useTokensList(page = 1, perPage = 100) {
  return useQuery(
    ['tokensList', page, perPage],
    async () => {
      const response = await apiInstance.tokens.listTokens({ page, per_page: perPage })
      return response.data
    },
    {
      staleTime: API_CACHE.STALE_TIME,
      cacheTime: API_CACHE.GC_TIME,
      retry: 2,
    }
  )
}

export function useBestRoute(
  tknA: string,
  tknB: string,
  amount: string,
  routeType: 'input' | 'output',
  enabled = true
) {
  return useQuery(
    ['bestRoute', tknA, tknB, amount, routeType],
    async () => {
      const response = await apiInstance.routing.bestRoute({ tknA, tknB, amount, routeType })
      return response.data
    },
    {
      enabled: enabled && Boolean(tknA && tknB && amount),
      staleTime: API_CACHE.STALE_TIME,
      cacheTime: API_CACHE.GC_TIME,
      retry: 1,
    }
  )
}

export async function getCalldata(calldataReq: {
  route: { encoded: string }
  route_type: RouteType
  recipient: string
  amount: string
  slippage: number
  deadline: number
}) {
  const response = await apiInstance.routing.getCalldata(calldataReq)
  return response.data
}
