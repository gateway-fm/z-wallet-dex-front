import { useMemo } from 'react'

import { ProtocolStats, UseProtocolStatsResult, UseTopPoolsResult } from '../types/api'

export function useProtocolStats(): UseProtocolStatsResult {
  const stats = useMemo((): ProtocolStats => {
    // NOTE: This is a placeholder implementation, BE not ready yet
    console.warn('useProtocolStats: REST API protocol stats not implemented')
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
    // NOTE: This is a placeholder implementation, BE not ready yet
    console.warn('useTopPools: REST API top pools not implemented', { first })
    console.log('Top pools limit:', first)
    return []
  }, [first])

  return {
    pools,
    loading: false,
    error: null,
  }
}
