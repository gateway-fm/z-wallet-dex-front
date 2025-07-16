import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { zephyrGraphQLClient } from '../data/graphql/client'

export interface TokenSearchResult {
  currency: Token
  currencyId: string
  logoUrl?: string | null
  safetyInfo?: any
}

const SEARCH_TOKENS_QUERY = gql`
  query SearchTokens($search: String, $first: Int) {
    tokens(
      where: { or: [{ symbol_contains_nocase: $search }, { name_contains_nocase: $search }, { id: $search }] }
      first: $first
      orderBy: volumeUSD
      orderDirection: desc
    ) {
      id
      name
      symbol
      decimals
      volumeUSD
      totalValueLocked
    }
  }
`

const TRENDING_TOKENS_QUERY = gql`
  query TrendingTokens($first: Int) {
    tokens(first: $first, orderBy: volumeUSD, orderDirection: desc) {
      id
      name
      symbol
      decimals
      volumeUSD
      totalValueLocked
    }
  }
`

function graphqlTokenToTokenResult(token: {
  id: string
  name?: string
  symbol: string
  decimals?: string | number
}): TokenSearchResult | null {
  if (!token.id || !token.symbol) {
    return null
  }

  try {
    const currency = new Token(
      ZEPHYR_CHAIN_ID,
      token.id,
      typeof token.decimals === 'string' ? parseInt(token.decimals) : token.decimals || 18,
      token.symbol,
      token.name || token.symbol
    )

    return {
      currency,
      currencyId: `${ZEPHYR_CHAIN_ID}-${token.id}`,
      logoUrl: null,
      safetyInfo: undefined,
    }
  } catch (error) {
    console.warn('Failed to create token from GraphQL data:', token, error)
    return null
  }
}

export function useSearchTokens({ searchQuery, skip = false }: { searchQuery?: string | null; skip?: boolean }) {
  const shouldSkip = skip || !searchQuery || searchQuery.length < 2

  const { data, loading, error, refetch } = useQuery(SEARCH_TOKENS_QUERY, {
    client: zephyrGraphQLClient,
    variables: {
      search: searchQuery,
      first: 20,
    },
    skip: shouldSkip,
    errorPolicy: 'all',
  })

  const tokens = useMemo(() => {
    if (!data?.tokens) return []

    return data.tokens
      .map((token: any) => graphqlTokenToTokenResult(token))
      .filter((token: TokenSearchResult | null): token is TokenSearchResult => token !== null)
  }, [data])

  return useMemo(
    () => ({
      data: tokens,
      loading: loading && !shouldSkip,
      error: error || undefined,
      refetch,
    }),
    [tokens, loading, error, refetch, shouldSkip]
  )
}

export function useTrendingTokens(limit = 10) {
  const { data, loading, error, refetch } = useQuery(TRENDING_TOKENS_QUERY, {
    client: zephyrGraphQLClient,
    variables: {
      first: limit,
    },
    errorPolicy: 'all',
  })

  const tokens = useMemo(() => {
    if (!data?.tokens) return []

    return data.tokens
      .map((token: any) => graphqlTokenToTokenResult(token))
      .filter((token: TokenSearchResult | null): token is TokenSearchResult => token !== null)
  }, [data])

  return useMemo(
    () => ({
      data: tokens,
      loading,
      error: error || undefined,
      refetch,
    }),
    [tokens, loading, error, refetch]
  )
}
