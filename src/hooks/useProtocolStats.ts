import { useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { handleGraphQLError, zephyrGraphQLClient } from '../data/graphql/client'
import { PROTOCOL_STATS, TOP_POOLS } from '../data/graphql/queries'

interface ProtocolStats {
  totalVolumeUSD: string
  totalValueLockedUSD: string
  txCount: string
  poolCount: string
  volume24h: string
  fees24h: string
}

interface Pool {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: number
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: number
  }
  feeTier: string
  totalValueLockedUSD: string
  volumeUSD: string
  txCount: string
  aprFee?: string
}

interface UseProtocolStatsResult {
  stats: ProtocolStats | null
  loading: boolean
  error: any
}

interface UseTopPoolsResult {
  pools: Pool[]
  loading: boolean
  error: any
}

export function useProtocolStats(): UseProtocolStatsResult {
  const { data, loading, error } = useQuery(PROTOCOL_STATS, {
    client: zephyrGraphQLClient,
    pollInterval: 5 * 60 * 1000, // Update every 5 minutes
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
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

export function useTopPools(first = 10): UseTopPoolsResult {
  const { data, loading, error } = useQuery(TOP_POOLS, {
    variables: { first },
    client: zephyrGraphQLClient,
    pollInterval: 5 * 60 * 1000, // Update every 5 minutes
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })

  const pools = useMemo(() => {
    if (error && !data) {
      return handleGraphQLError(error, [])
    }
    return data?.pools || []
  }, [data, error])

  return {
    pools,
    loading,
    error: error && !data ? error : null,
  }
}
