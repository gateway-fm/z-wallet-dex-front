import { useTopPools } from './useProtocolStats'
import { useZephyrTokens } from './useZephyrTokensV2'

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
  const { pools, loading: poolsLoading, error: poolsError } = useTopPools(20)
  const zephyrTokens = useZephyrTokens()

  return {
    pools,
    tokens: zephyrTokens,
    loading: poolsLoading,
    error: poolsError,
    ready: !poolsLoading && pools.length > 0 && Object.keys(zephyrTokens).length > 0,
  }
}
