import { useMemo } from 'react'
import { UseQueryResult } from '@tanstack/react-query'

/**
 * NOTE: This is a stub for web
 * to avoid requests to ExploreStatsService
 */
export function useExploreStatsQuery<TSelectType>(): UseQueryResult<TSelectType, any> {
  return useMemo(() => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: () => {},
  }), []) as UseQueryResult<TSelectType, any>
}
