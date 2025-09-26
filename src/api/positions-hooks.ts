import { BigNumber } from '@ethersproject/bignumber'
import { useQuery } from 'react-query'

import { POSITIONS_API_CONFIG } from '../config/positions-api'
import { PositionDetails } from '../types/position'
import { positionsApiClient } from './positions-api-client'
import { PositionsApiPosition } from './positions-api-types'

/**
 * Convert API position to internal PositionDetails format
 */
function convertApiPositionToPositionDetails(apiPosition: PositionsApiPosition): PositionDetails {
  return {
    tokenId: BigNumber.from(apiPosition.tokenId),
    nonce: BigNumber.from(0), // API doesn't provide nonce, using 0 as default
    operator: apiPosition.owner, // Using owner as operator for now
    token0: apiPosition.token0?.address || '0x0000000000000000000000000000000000000000', // Fallback for null addresses
    token1: apiPosition.token1?.address || '0x0000000000000000000000000000000000000000', // Fallback for null addresses
    fee: parseInt(apiPosition.feeTier),
    tickLower: parseInt(apiPosition.tickLower),
    tickUpper: parseInt(apiPosition.tickUpper),
    liquidity: BigNumber.from(apiPosition.liquidity),
    feeGrowthInside0LastX128: BigNumber.from(0), // API doesn't provide this, using 0
    feeGrowthInside1LastX128: BigNumber.from(0), // API doesn't provide this, using 0
    tokensOwed0: BigNumber.from(apiPosition.token0UncollectedFees),
    tokensOwed1: BigNumber.from(apiPosition.token1UncollectedFees),
  }
}

/**
 * Hook to get positions by owner address using the positions API
 */
export function usePositionsFromApi(owner: string | null | undefined, enabled = true) {
  return useQuery(
    ['positionsFromApi', owner],
    async () => {
      if (!owner) return { positions: [], loading: false }

      const response = await positionsApiClient.getPositionsByOwner(owner)
      const positions = response.values.map(convertApiPositionToPositionDetails)

      return { positions, loading: false }
    },
    {
      enabled: enabled && Boolean(owner) && POSITIONS_API_CONFIG.ENABLED,
      staleTime: POSITIONS_API_CONFIG.CACHE.STALE_TIME,
      cacheTime: POSITIONS_API_CONFIG.CACHE.GC_TIME,
      retry: 2,
    }
  )
}

/**
 * Hook to get a single position by token ID using the positions API
 */
export function usePositionFromApiByTokenId(tokenId: BigNumber | undefined, enabled = true) {
  return useQuery(
    ['positionFromApi', tokenId?.toString()],
    async () => {
      if (!tokenId) return { position: undefined, loading: false }

      const response = await positionsApiClient.getPositionByTokenId(tokenId.toString())
      if (response.values.length === 0) {
        return { position: undefined, loading: false }
      }

      const position = convertApiPositionToPositionDetails(response.values[0])
      return { position, loading: false }
    },
    {
      enabled: enabled && Boolean(tokenId) && POSITIONS_API_CONFIG.ENABLED,
      staleTime: POSITIONS_API_CONFIG.CACHE.STALE_TIME,
      cacheTime: POSITIONS_API_CONFIG.CACHE.GC_TIME,
      retry: 2,
    }
  )
}

/**
 * Hook to get collect events for a position
 */
export function usePositionCollects(tokenId: BigNumber | undefined, enabled = true) {
  return useQuery(
    ['positionCollects', tokenId?.toString()],
    async () => {
      if (!tokenId) return []

      const response = await positionsApiClient.getCollectsByTokenId(tokenId.toString())
      return response.values
    },
    {
      enabled: enabled && Boolean(tokenId) && POSITIONS_API_CONFIG.ENABLED,
      staleTime: POSITIONS_API_CONFIG.CACHE.STALE_TIME,
      cacheTime: POSITIONS_API_CONFIG.CACHE.GC_TIME,
      retry: 2,
    }
  )
}

/**
 * Hook to get transfer events for a position
 */
export function usePositionTransfers(tokenId: BigNumber | undefined, enabled = true) {
  return useQuery(
    ['positionTransfers', tokenId?.toString()],
    async () => {
      if (!tokenId) return []

      const response = await positionsApiClient.getTransfersByTokenId(tokenId.toString())
      return response.values
    },
    {
      enabled: enabled && Boolean(tokenId) && POSITIONS_API_CONFIG.ENABLED,
      staleTime: POSITIONS_API_CONFIG.CACHE.STALE_TIME,
      cacheTime: POSITIONS_API_CONFIG.CACHE.GC_TIME,
      retry: 2,
    }
  )
}

/**
 * Hook to get increase liquidity events for a position
 */
export function usePositionIncreaseLiquidity(tokenId: BigNumber | undefined, enabled = true) {
  return useQuery(
    ['positionIncreaseLiquidity', tokenId?.toString()],
    async () => {
      if (!tokenId) return []

      const response = await positionsApiClient.getIncreaseLiquidity({ tokenId: tokenId.toString() })
      return response.values
    },
    {
      enabled: enabled && Boolean(tokenId) && POSITIONS_API_CONFIG.ENABLED,
      staleTime: POSITIONS_API_CONFIG.CACHE.STALE_TIME,
      cacheTime: POSITIONS_API_CONFIG.CACHE.GC_TIME,
      retry: 2,
    }
  )
}

/**
 * Hook to get decrease liquidity events for a position
 */
export function usePositionDecreaseLiquidity(tokenId: BigNumber | undefined, enabled = true) {
  return useQuery(
    ['positionDecreaseLiquidity', tokenId?.toString()],
    async () => {
      if (!tokenId) return []

      const response = await positionsApiClient.getDecreaseLiquidity({ tokenId: tokenId.toString() })
      return response.values
    },
    {
      enabled: enabled && Boolean(tokenId) && POSITIONS_API_CONFIG.ENABLED,
      staleTime: POSITIONS_API_CONFIG.CACHE.STALE_TIME,
      cacheTime: POSITIONS_API_CONFIG.CACHE.GC_TIME,
      retry: 2,
    }
  )
}
