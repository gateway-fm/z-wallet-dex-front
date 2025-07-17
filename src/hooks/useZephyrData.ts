import { useWeb3React } from '@web3-react/core'
import { useEffect } from 'react'

import { useTopPools } from './useProtocolStats'
import { useZephyrTokens } from './useZephyrTokens'

type PoolData = ReturnType<typeof useTopPools>['pools']
type TokenData = ReturnType<typeof useZephyrTokens>

/**
 * Hook that preloads all Zephyr data (pools and tokens) when connected to Zephyr network
 * This ensures data is available immediately for selectors and defaults
 */
export function useZephyrDataPreloader(): {
  pools: PoolData
  tokens: TokenData
  loading: boolean
  error: any
  ready: boolean
} {
  const { chainId } = useWeb3React()

  // Always preload Zephyr data on swap page, regardless of current network
  // This allows users to switch to Zephyr with data already loaded
  const shouldPreload = true

  // Preload pools and tokens
  const { pools, loading: poolsLoading, error: poolsError } = useTopPools(20)
  const zephyrTokens = useZephyrTokens()

  // Log loading status for debugging
  useEffect(() => {
    console.log('[Zephyr Data Preloader]', {
      currentChainId: chainId,
      poolsCount: pools.length,
      poolsLoading,
      poolsError: poolsError?.message,
      tokensCount: Object.keys(zephyrTokens).length,
      shouldPreload,
    })
  }, [chainId, pools.length, poolsLoading, poolsError, zephyrTokens, shouldPreload])

  return {
    pools,
    tokens: zephyrTokens,
    loading: poolsLoading,
    error: poolsError,
    ready: !poolsLoading && pools.length > 0 && Object.keys(zephyrTokens).length > 0,
  }
}
