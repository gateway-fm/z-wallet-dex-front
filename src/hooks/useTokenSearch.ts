import { useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { handleGraphQLError, zephyrGraphQLClient } from '../data/graphql/client'
import { SEARCH_TOKENS, TRENDING_TOKENS } from '../data/graphql/queries'

interface Token {
  id: string
  symbol: string
  name: string
  decimals: number
  volumeUSD: string
  txCount: string
  totalValueLocked: string
  priceUSD: string
  pools: Array<{
    id: string
    feeTier: string
    volumeUSD: string
    totalValueLockedUSD: string
  }>
}

interface UseTokenSearchResult {
  tokens: Token[]
  loading: boolean
  error: any
}

export function useTokenSearch(searchTerm: string, first = 20): UseTokenSearchResult {
  const { data, loading, error } = useQuery(SEARCH_TOKENS, {
    variables: { search: searchTerm, first },
    skip: !searchTerm || searchTerm.length < 2,
    client: zephyrGraphQLClient,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
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

export function useTrendingTokens(first = 10): UseTokenSearchResult {
  const { data, loading, error } = useQuery(TRENDING_TOKENS, {
    variables: { first },
    client: zephyrGraphQLClient,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    pollInterval: 5 * 60 * 1000, // Update every 5 minutes
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
