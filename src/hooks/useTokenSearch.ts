import { useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { handleGraphQLError, zephyrGraphQLClient } from '../data/graphql/client'
import { CACHE_POLICIES, POLLING_INTERVALS, QUERY_LIMITS } from '../data/graphql/constants'
import { SEARCH_TOKENS, TRENDING_TOKENS } from '../data/graphql/queries'
import { UseTokenSearchResult } from '../data/graphql/types'

export function useTokenSearch(searchTerm: string, first = QUERY_LIMITS.DEFAULT_TOKEN_SEARCH): UseTokenSearchResult {
  const { data, loading, error } = useQuery(SEARCH_TOKENS, {
    variables: { search: searchTerm, first },
    skip: !searchTerm || searchTerm.length < 2,
    client: zephyrGraphQLClient,
    errorPolicy: CACHE_POLICIES.ERROR_POLICY,
    fetchPolicy: CACHE_POLICIES.DEFAULT,
  })

  const tokens = useMemo(() => {
    if (error && !data) {
      return handleGraphQLError(error, [])
    }
    return data?.tokens || []
  }, [data, error])

  return {
    tokens,
    loading: loading && searchTerm.length >= 2,
    error: error && !data ? error : null,
  }
}

// eslint-disable-next-line import/no-unused-modules
export function useTrendingTokens(first: number = QUERY_LIMITS.DEFAULT_TRENDING_TOKENS): UseTokenSearchResult {
  const { data, loading, error } = useQuery(TRENDING_TOKENS, {
    variables: { first },
    client: zephyrGraphQLClient,
    errorPolicy: CACHE_POLICIES.ERROR_POLICY,
    fetchPolicy: CACHE_POLICIES.DEFAULT,
    pollInterval: POLLING_INTERVALS.ANALYTICS,
  })

  const tokens = useMemo(() => {
    if (error && !data) {
      return handleGraphQLError(error, [])
    }
    return data?.tokens || []
  }, [data, error])

  return {
    tokens,
    loading,
    error: error && !data ? error : null,
  }
}
