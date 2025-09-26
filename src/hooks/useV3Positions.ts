import { BigNumber } from '@ethersproject/bignumber'
import { useWeb3React } from '@web3-react/core'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'
import { PositionDetails } from 'types/position'

import { usePositionFromApiByTokenId, usePositionsFromApi } from '../api/positions-hooks'
import { POSITIONS_API_CONFIG } from '../config/positions-api'
import { useV3NFTPositionManagerContract } from './useContract'

interface UseV3PositionsResults {
  loading: boolean
  positions?: PositionDetails[]
}

function useZephyrV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const { provider } = useWeb3React()
  const positionManager = useV3NFTPositionManagerContract()
  const [loading, setLoading] = useState(true)
  const [positions, setPositions] = useState<PositionDetails[] | undefined>(undefined)

  useEffect(() => {
    if (!account || !positionManager || !provider) {
      setLoading(false)
      setPositions(undefined)
      return
    }

    const loadPositions = async () => {
      try {
        setLoading(true)

        // Get balance of positions
        const balance = await positionManager.balanceOf(account)
        const balanceNumber = balance.toNumber()
        if (balanceNumber === 0) {
          setPositions([])
          setLoading(false)
          return
        }

        // Get all token IDs
        const tokenIds: BigNumber[] = []
        for (let i = 0; i < balanceNumber; i++) {
          const tokenId = await positionManager.tokenOfOwnerByIndex(account, i)
          tokenIds.push(tokenId)
        }

        // Get position details for each token ID
        const positionDetails: PositionDetails[] = []
        for (const tokenId of tokenIds) {
          const position = await positionManager.positions(tokenId)
          positionDetails.push({
            tokenId,
            fee: position.fee,
            feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
            feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
            liquidity: position.liquidity,
            nonce: position.nonce,
            operator: position.operator,
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
            token0: position.token0,
            token1: position.token1,
            tokensOwed0: position.tokensOwed0,
            tokensOwed1: position.tokensOwed1,
          })
        }
        setPositions(positionDetails)
      } catch (error) {
        setPositions([])
      } finally {
        setLoading(false)
      }
    }

    loadPositions()
  }, [account, positionManager, provider])

  return { loading, positions }
}

function useV3PositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()
  const inputs = useMemo(() => (tokenIds ? tokenIds.map((tokenId) => [BigNumber.from(tokenId)]) : []), [tokenIds])
  const results = useSingleContractMultipleData(positionManager, 'positions', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results
        .map((call, i) => {
          const tokenId = tokenIds[i]
          const result = call.result as CallStateResult

          // Check if result exists and has basic required properties
          if (!result || result.fee === undefined) {
            return null
          }

          return {
            tokenId,
            fee: result.fee,
            feeGrowthInside0LastX128: result.feeGrowthInside0LastX128,
            feeGrowthInside1LastX128: result.feeGrowthInside1LastX128,
            liquidity: result.liquidity,
            nonce: result.nonce,
            operator: result.operator,
            tickLower: result.tickLower,
            tickUpper: result.tickUpper,
            token0: result.token0,
            token1: result.token1,
            tokensOwed0: result.tokensOwed0,
            tokensOwed1: result.tokensOwed1,
          } as PositionDetails
        })
        .filter((position): position is PositionDetails => position !== null)
    }
    return undefined
  }, [loading, error, results, tokenIds])

  return {
    loading,
    positions: positions?.map((position, i) => ({
      ...position,
      tokenId: inputs[i][0],
    })),
  }
}

interface UseV3PositionResults {
  loading: boolean
  position?: PositionDetails
}

function useZephyrV3PositionFromTokenId(tokenId: BigNumber | undefined): UseV3PositionResults {
  const { provider } = useWeb3React()
  const positionManager = useV3NFTPositionManagerContract()
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<PositionDetails | undefined>(undefined)

  useEffect(() => {
    if (!tokenId || !positionManager || !provider) {
      setLoading(false)
      setPosition(undefined)
      return
    }

    let isCancelled = false
    const loadPosition = async () => {
      try {
        setLoading(true)
        const positionData = await positionManager.positions(tokenId)

        if (isCancelled) return

        setPosition({
          tokenId,
          fee: positionData.fee,
          feeGrowthInside0LastX128: positionData.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: positionData.feeGrowthInside1LastX128,
          liquidity: positionData.liquidity,
          nonce: positionData.nonce,
          operator: positionData.operator,
          tickLower: positionData.tickLower,
          tickUpper: positionData.tickUpper,
          token0: positionData.token0,
          token1: positionData.token1,
          tokensOwed0: positionData.tokensOwed0,
          tokensOwed1: positionData.tokensOwed1,
        })
      } catch (error) {
        if (!isCancelled) {
          setPosition(undefined)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadPosition()

    return () => {
      isCancelled = true
    }
  }, [tokenId, positionManager, provider])

  return { loading, position }
}

export function useV3PositionFromTokenId(tokenId: BigNumber | undefined): UseV3PositionResults {
  const { chainId } = useWeb3React()
  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID

  // Try API first if enabled
  const apiPosition = usePositionFromApiByTokenId(tokenId, POSITIONS_API_CONFIG.ENABLED)

  // Fallback to blockchain data
  const zephyrPosition = useZephyrV3PositionFromTokenId(
    isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED ? tokenId : undefined
  )
  const position = useV3PositionsFromTokenIds(
    !POSITIONS_API_CONFIG.ENABLED && !isZephyrNetwork && tokenId ? [tokenId] : undefined
  )

  return useMemo(() => {
    // Return API data if enabled and available
    if (POSITIONS_API_CONFIG.ENABLED && !apiPosition.isLoading) {
      return {
        loading: apiPosition.isLoading,
        position: apiPosition.data?.position,
      }
    }

    // Return Zephyr blockchain data
    if (isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED) {
      return zephyrPosition
    }

    // Return standard blockchain data
    return {
      loading: position.loading,
      position: position.positions?.[0],
    }
  }, [isZephyrNetwork, zephyrPosition, position, apiPosition])
}

export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const { chainId } = useWeb3React()
  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID

  // Try API first if enabled
  const apiPositions = usePositionsFromApi(account, POSITIONS_API_CONFIG.ENABLED)

  // Fallback to blockchain data
  // Use direct RPC calls for Zephyr
  const zephyrPositions = useZephyrV3Positions(isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED ? account : null)
  // And multicall for other networks
  const positionManager = useV3NFTPositionManagerContract()

  const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(
    !isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED ? positionManager : null,
    'balanceOf',
    [account ?? undefined]
  )
  const accountBalance: number | undefined = balanceResult?.[0]?.toNumber()

  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account && !isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED) {
      const tokenRequests = []
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i])
      }
      return tokenRequests
    }
    return []
  }, [account, accountBalance, isZephyrNetwork])

  const tokenIdResults = useSingleContractMultipleData(
    !isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED ? positionManager : null,
    'tokenOfOwnerByIndex',
    tokenIdsArgs
  )
  const someTokenIdsLoading = useMemo(() => tokenIdResults.some(({ loading }) => loading), [tokenIdResults])

  const tokenIds = useMemo(() => {
    if (account && !isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED) {
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is CallStateResult => !!result)
        .map((result) => BigNumber.from(result[0]))
    }
    return []
  }, [account, tokenIdResults, isZephyrNetwork])

  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(
    !POSITIONS_API_CONFIG.ENABLED && !isZephyrNetwork ? tokenIds : undefined
  )

  // Return API data if enabled and available
  if (POSITIONS_API_CONFIG.ENABLED && !apiPositions.isLoading) {
    return {
      loading: apiPositions.isLoading,
      positions: apiPositions.data?.positions || [],
    }
  }

  // Return Zephyr blockchain data
  if (isZephyrNetwork && !POSITIONS_API_CONFIG.ENABLED) {
    return zephyrPositions
  }

  // Return standard blockchain data
  return {
    loading: someTokenIdsLoading || balanceLoading || positionsLoading,
    positions,
  }
}
