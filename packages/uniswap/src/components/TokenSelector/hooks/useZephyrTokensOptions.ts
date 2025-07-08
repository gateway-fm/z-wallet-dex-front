import { useCallback, useMemo } from 'react'
import { useCommonTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptions'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'

export function useZephyrTokensOptions(
  address: Address | undefined,
  chainFilter: UniverseChainId | null,
): GqlResult<TokenOption[] | undefined> {
  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
  } = useCommonTokensOptions(address, chainFilter)

  // Load tokens for Zephyr from GQL API
  const {
    data: graphqlTokens,
    error: graphqlTokensError,
    refetch: refetchGraphqlTokens,
    loading: graphqlTokensLoading,
  } = useSearchTokens({
    searchQuery: null,
    chainFilter: UniverseChainId.Zephyr,
    skip: chainFilter !== null && chainFilter !== UniverseChainId.Zephyr,
  })

  const graphqlTokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: graphqlTokens,
    portfolioBalancesById: {},
  })

  const loading = commonTokenOptionsLoading || graphqlTokensLoading
  const error = commonTokenOptionsError || graphqlTokensError

  const refetchAll = useCallback(() => {
    refetchCommonTokenOptions?.()
    refetchGraphqlTokens?.()
  }, [refetchCommonTokenOptions, refetchGraphqlTokens])

  const combinedTokens = useMemo(() => {
    if (chainFilter === UniverseChainId.Zephyr || chainFilter === null) {
      const common = commonTokenOptions ?? []
      const graphql = graphqlTokenOptions ?? []
      
      // NOTE: Create a set of existing token addresses to avoid duplicates
      const existingAddresses = new Set(
        common.map(token => token.currencyInfo.currency.isToken ? token.currencyInfo.currency.address.toLowerCase() : 'native')
      )
      
      const uniqueTokens = graphql.filter(token => {
        const address = token.currencyInfo.currency.isToken ? token.currencyInfo.currency.address.toLowerCase() : 'native'
        return !existingAddresses.has(address)
      })
      
      return [...common, ...uniqueTokens]
    }
    
    return commonTokenOptions
  }, [commonTokenOptions, graphqlTokenOptions, chainFilter])

  return useMemo(
    () => ({
      data: combinedTokens,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [combinedTokens, loading, error, refetchAll],
  )
} 
