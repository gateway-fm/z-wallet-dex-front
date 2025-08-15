import { useMemo } from 'react'

import { useSearchTokens as useApiSearchTokens, useTrendingTokens as useApiTrendingTokens } from '../api'
import { UseTokenSearchResult } from '../types/api'

const DEFAULT_TOKEN_SEARCH = 20
const DEFAULT_TRENDING_TOKENS = 10

export function useTokenSearch(searchTerm: string, first = DEFAULT_TOKEN_SEARCH): UseTokenSearchResult {
  const { data, isLoading, error } = useApiSearchTokens(searchTerm, Boolean(searchTerm && searchTerm.length >= 2))

  const tokens = useMemo(() => {
    if (error && !data) {
      return []
    }
    const tokensData = data?.data || []
    return tokensData.slice(0, first)
  }, [data, error, first])

  return {
    tokens,
    loading: isLoading && searchTerm.length >= 2,
    error: error && !data ? error : null,
  }
}

export function useTrendingTokens(first: number = DEFAULT_TRENDING_TOKENS): UseTokenSearchResult {
  const { data, isLoading, error } = useApiTrendingTokens(first)

  const tokens = useMemo(() => {
    if (error && !data) {
      return []
    }
    return data?.data || []
  }, [data, error])

  return {
    tokens,
    loading: isLoading,
    error: error && !data ? error : null,
  }
}
