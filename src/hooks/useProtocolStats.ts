import { useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { handleGraphQLError, zephyrGraphQLClient } from '../data/graphql/client'
import { CACHE_POLICIES, POLLING_INTERVALS, QUERY_LIMITS } from '../data/graphql/constants'
import { PROTOCOL_STATS, TOP_POOLS } from '../data/graphql/queries'
import { UseProtocolStatsResult, UseTopPoolsResult } from '../data/graphql/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line import/no-unused-modules
export function useProtocolStats(): UseProtocolStatsResult {
  const { data, loading, error } = useQuery(PROTOCOL_STATS, {
    client: zephyrGraphQLClient,
    pollInterval: POLLING_INTERVALS.ANALYTICS,
    errorPolicy: CACHE_POLICIES.ERROR_POLICY,
    fetchPolicy: CACHE_POLICIES.DEFAULT,
  })

  const stats = useMemo(() => {
    if (error && !data) {
      return handleGraphQLError(error, null)
    }

    if (!data) return null

    return {
      totalVolumeUSD: data.factories?.[0]?.totalVolumeUSD || '0',
      totalValueLockedUSD: data.factories?.[0]?.totalValueLockedUSD || '0',
      txCount: data.factories?.[0]?.txCount || '0',
      poolCount: data.factories?.[0]?.poolCount || '0',
      volume24h: data.uniswapDayDatas?.[0]?.volumeUSD || '0',
      fees24h: data.uniswapDayDatas?.[0]?.feesUSD || '0',
    }
  }, [data, error])

  return {
    stats,
    loading,
    error: error && !data ? error : null,
  }
}

// eslint-disable-next-line import/no-unused-modules
export function useTopPools(first: number = QUERY_LIMITS.DEFAULT_TOP_POOLS): UseTopPoolsResult {
  const { data, loading, error } = useQuery(TOP_POOLS, {
    variables: { first },
    client: zephyrGraphQLClient,
    pollInterval: POLLING_INTERVALS.ANALYTICS,
    errorPolicy: CACHE_POLICIES.ERROR_POLICY,
    fetchPolicy: CACHE_POLICIES.DEFAULT,
    skip: first === 0, // Skip query when first is 0
  })

  const pools = useMemo(() => {
    if (first === 0) return [] // Return empty array when skipped
    if (error && !data) {
      return handleGraphQLError(error, [])
    }
    return data?.pools || []
  }, [data, error, first])

  return {
    pools,
    loading: first === 0 ? false : loading, // Not loading when skipped
    error: first === 0 ? null : error && !data ? error : null,
  }
}
