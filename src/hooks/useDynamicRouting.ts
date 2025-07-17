import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTopPools } from './useProtocolStats'

/**
 * Hook that returns common base tokens from top pools for Zephyr network
 */
export function useCommonBases(): Token[] {
  const { chainId } = useWeb3React()
  const { pools } = useTopPools(10) // Get top 10 pools

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID || !pools || pools.length === 0) {
      return []
    }

    // Extract unique tokens from top pools
    const tokenSet = new Set<string>()
    const tokens: Token[] = []

    pools.forEach((pool) => {
      // Add token0
      if (!tokenSet.has(pool.token0.id)) {
        const decimals0 =
          typeof pool.token0.decimals === 'string' ? parseInt(pool.token0.decimals, 10) : pool.token0.decimals
        if (decimals0 >= 0 && decimals0 <= 255) {
          tokenSet.add(pool.token0.id)
          tokens.push(new Token(ZEPHYR_CHAIN_ID, pool.token0.id, decimals0, pool.token0.symbol, pool.token0.name))
        }
      }

      // Add token1
      if (!tokenSet.has(pool.token1.id)) {
        const decimals1 =
          typeof pool.token1.decimals === 'string' ? parseInt(pool.token1.decimals, 10) : pool.token1.decimals
        if (decimals1 >= 0 && decimals1 <= 255) {
          tokenSet.add(pool.token1.id)
          tokens.push(new Token(ZEPHYR_CHAIN_ID, pool.token1.id, decimals1, pool.token1.symbol, pool.token1.name))
        }
      }
    })

    // Sort by volume (highest first)
    return tokens
      .sort((a, b) => {
        const poolA = pools.find((p) => p.token0.id === a.address || p.token1.id === a.address)
        const poolB = pools.find((p) => p.token0.id === b.address || p.token1.id === b.address)

        const volumeA = parseFloat(poolA?.volumeUSD || '0')
        const volumeB = parseFloat(poolB?.volumeUSD || '0')

        return volumeB - volumeA
      })
      .slice(0, 6) // Return top 6 tokens
  }, [chainId, pools])
}

/**
 * Hook that returns pinned pairs from top pools for Zephyr network
 */
export function usePinnedPairs(): [Token, Token][] {
  const { chainId } = useWeb3React()
  const { pools } = useTopPools(5) // Get top 5 pools for pinned pairs

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID || !pools || pools.length === 0) {
      return []
    }

    // Create pairs from top pools
    return pools
      .map((pool) => {
        const decimals0 =
          typeof pool.token0.decimals === 'string' ? parseInt(pool.token0.decimals, 10) : pool.token0.decimals
        const decimals1 =
          typeof pool.token1.decimals === 'string' ? parseInt(pool.token1.decimals, 10) : pool.token1.decimals

        if (decimals0 < 0 || decimals0 > 255 || decimals1 < 0 || decimals1 > 255) {
          return null
        }

        const token0 = new Token(ZEPHYR_CHAIN_ID, pool.token0.id, decimals0, pool.token0.symbol, pool.token0.name)
        const token1 = new Token(ZEPHYR_CHAIN_ID, pool.token1.id, decimals1, pool.token1.symbol, pool.token1.name)

        return [token0, token1] as [Token, Token]
      })
      .filter((pair): pair is [Token, Token] => pair !== null)
  }, [chainId, pools])
}

/**
 * Hook that returns bases to track liquidity for from top pools
 */
export function useBasesToTrackLiquidityFor(): Token[] {
  const { chainId } = useWeb3React()
  const { pools } = useTopPools(15) // Get more pools for liquidity tracking

  return useMemo(() => {
    if (chainId !== ZEPHYR_CHAIN_ID || !pools || pools.length === 0) {
      return []
    }

    // Extract unique tokens from all pools, prioritizing by TVL
    const tokenSet = new Set<string>()
    const tokens: Token[] = []

    // Sort pools by TVL first
    const sortedPools = [...pools].sort((a, b) => parseFloat(b.totalValueLockedUSD) - parseFloat(a.totalValueLockedUSD))

    sortedPools.forEach((pool) => {
      // Add token0
      if (!tokenSet.has(pool.token0.id)) {
        const decimals0 =
          typeof pool.token0.decimals === 'string' ? parseInt(pool.token0.decimals, 10) : pool.token0.decimals
        if (decimals0 >= 0 && decimals0 <= 255) {
          tokenSet.add(pool.token0.id)
          tokens.push(new Token(ZEPHYR_CHAIN_ID, pool.token0.id, decimals0, pool.token0.symbol, pool.token0.name))
        }
      }

      // Add token1
      if (!tokenSet.has(pool.token1.id)) {
        const decimals1 =
          typeof pool.token1.decimals === 'string' ? parseInt(pool.token1.decimals, 10) : pool.token1.decimals
        if (decimals1 >= 0 && decimals1 <= 255) {
          tokenSet.add(pool.token1.id)
          tokens.push(new Token(ZEPHYR_CHAIN_ID, pool.token1.id, decimals1, pool.token1.symbol, pool.token1.name))
        }
      }
    })

    return tokens
  }, [chainId, pools])
}
