import { useMemo } from 'react'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

const zephyrApolloClient = new ApolloClient({
  link: new HttpLink({
    uri: process.env.REACT_APP_AWS_API_ENDPOINT || 'https://api.dex-zephyr.cloudbuilder.ru/subgraphs/name/v3-tokens-mainnet',
  }),
  cache: new InMemoryCache(),
})

const SEARCH_TOKENS_QUERY = gql`
  query SearchTokens($first: Int) {
    tokens(first: $first) {
      id
      name
      symbol
      decimals
      derivedETH
      totalValueLockedUSD
      volumeUSD
      feesUSD
    }
    bundle(id: "1") {
      ethPriceUSD
    }
  }
`

function graphqlTokenToCurrencyInfo(token: { 
  id: string; 
  name: string; 
  symbol: string; 
  decimals?: string;
  derivedETH?: string;
  totalValueLockedUSD?: string;
  volumeUSD?: string;
  feesUSD?: string;
}): CurrencyInfo | null {
  if (!token.id || !token.symbol) {
    return null
  }

  const chainId = UniverseChainId.Zephyr

  const currency = new Token(
    chainId,
    token.id,
    parseInt(String(token.decimals)) || 18,
    token.symbol,
    token.name
  )

  return {
    currency,
    currencyId: `${chainId}-${token.id}`,
    logoUrl: null,
    safetyInfo: undefined,
  }
}

export function useSearchTokens({
  searchQuery,
  chainFilter,
  skip = false,
}: {
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip?: boolean
}): GqlResult<CurrencyInfo[]> {
  const { data, loading, error, refetch } = useQuery(SEARCH_TOKENS_QUERY, {
    client: zephyrApolloClient,
    variables: {
      first: NUMBER_OF_RESULTS_LONG,
    },
    skip: skip || (chainFilter !== null && chainFilter !== UniverseChainId.Zephyr),
  })

  const tokens = useMemo(() => {
    if (!data?.tokens) return []
    
    let filteredTokens = data.tokens
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredTokens = data.tokens.filter((token: any) => 
        token.name?.toLowerCase().includes(query) ||
        token.symbol?.toLowerCase().includes(query) ||
        token.id?.toLowerCase().includes(query)
      )
    }
    
    return filteredTokens
      .map((token: any) => graphqlTokenToCurrencyInfo(token))
      .filter((token: CurrencyInfo | null): token is CurrencyInfo => token !== null)
  }, [data, searchQuery])

  return useMemo(
    () => ({
      data: tokens,
      loading,
      error: error || undefined,
      refetch,
    }),
    [tokens, loading, error, refetch],
  )
}
