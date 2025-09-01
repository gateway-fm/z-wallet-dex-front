import { useMemo } from 'react'

import { ProtocolStats, UseProtocolStatsResult, UseTopPoolsResult } from '../types/api'

export function useProtocolStats(): UseProtocolStatsResult {
  const stats = useMemo((): ProtocolStats => {
    // API doesn't provide protocol stats yet
    return {
      totalVolumeUSD: '0',
      totalValueLockedUSD: '0',
      txCount: '0',
      poolCount: '0',
      volume24h: '0',
      fees24h: '0',
    }
  }, [])

  return {
    stats,
    loading: false,
    error: null,
  }
}

export function useTopPools(first = 10): UseTopPoolsResult {
  const pools = useMemo(() => {
    // API doesn't provide pools data, return empty array
    return []
  }, [first])

  return {
    pools,
    loading: false,
    error: null,
  }
}
