import { useZephyrTokens } from './useZephyrTokensV2'

type TokenData = ReturnType<typeof useZephyrTokens>

/**
 * Hook that preloads Zephyr tokens data when connected to Zephyr network
 * This ensures data is available immediately for selectors and defaults
 */
export function useZephyrDataPreloader(): {
  tokens: TokenData
  loading: boolean
  error: any
  ready: boolean
} {
  const zephyrTokens = useZephyrTokens()

  return {
    tokens: zephyrTokens,
    loading: false, // Token loading is handled internally
    error: null,
    ready: Object.keys(zephyrTokens).length > 0,
  }
}
