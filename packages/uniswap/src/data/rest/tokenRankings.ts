import { useMemo } from 'react'
import { UseQueryResult } from '@tanstack/react-query'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/**
 * NOTE: This is a stub for web
 * to avoid requests to TokenRankingsService
 */
export function useTokenRankingsQuery(
  _input?: any,
  _enabled = true,
): UseQueryResult<any, any> {
  return useMemo(() => ({
    data: {
      tokenRankings: {
        TRENDING: { tokens: [] }, // TODO: attempt to get trending tokens for GQL API
        TOP: { tokens: [] },
      },
    },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: () => {},
  }), []) as UseQueryResult<any, any>
}

export function tokenRankingsStatToCurrencyInfo(): CurrencyInfo | null {
  return null
}
