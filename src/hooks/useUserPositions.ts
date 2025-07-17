import { useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { handleGraphQLError, zephyrGraphQLClient } from '../data/graphql/client'
import { CACHE_POLICIES, POLLING_INTERVALS, QUERY_LIMITS } from '../data/graphql/constants'
import { USER_POSITIONS, USER_TRANSACTIONS } from '../data/graphql/queries'
import { Position, UseUserPositionsResult, UseUserTransactionsResult } from '../data/graphql/types'

// eslint-disable-next-line import/no-unused-modules
export function useUserPositions(account?: string): UseUserPositionsResult {
  const { data, loading, error } = useQuery(USER_POSITIONS, {
    variables: { owner: account?.toLowerCase() },
    skip: !account,
    client: zephyrGraphQLClient,
    errorPolicy: CACHE_POLICIES.ERROR_POLICY,
    fetchPolicy: CACHE_POLICIES.DEFAULT,
    pollInterval: POLLING_INTERVALS.USER_POSITIONS,
  })

  const positions = useMemo(() => {
    if (error && !data) {
      return handleGraphQLError(error, [])
    }

    if (!data?.positions) return []

    return data.positions.map(
      (position: any): Position => ({
        id: position.id,
        pool: position.pool,
        range: {
          tickLower: position.tickLower.tickIdx,
          tickUpper: position.tickUpper.tickIdx,
        },
        liquidity: position.liquidity,
        tokens: {
          deposited: {
            token0: position.depositedToken0,
            token1: position.depositedToken1,
          },
          withdrawn: {
            token0: position.withdrawnToken0,
            token1: position.withdrawnToken1,
          },
          fees: {
            token0: position.collectedFeesToken0,
            token1: position.collectedFeesToken1,
          },
        },
        timestamp: position.transaction.timestamp,
      })
    )
  }, [data, error])

  return {
    positions,
    loading,
    error: error && !data ? error : null,
  }
}

// eslint-disable-next-line import/no-unused-modules
export function useUserTransactions(
  account?: string,
  first = QUERY_LIMITS.DEFAULT_USER_TRANSACTIONS,
  skip = 0
): UseUserTransactionsResult {
  const { data, loading, error } = useQuery(USER_TRANSACTIONS, {
    variables: { user: account?.toLowerCase(), first, skip },
    skip: !account,
    client: zephyrGraphQLClient,
    errorPolicy: CACHE_POLICIES.ERROR_POLICY,
    fetchPolicy: CACHE_POLICIES.DEFAULT,
  })

  const transactions = useMemo(() => {
    if (error && !data) {
      return handleGraphQLError(error, [])
    }
    return data?.transactions || []
  }, [data, error])

  return {
    transactions,
    loading,
    error: error && !data ? error : null,
  }
}

// Helper function to calculate active positions
// eslint-disable-next-line import/no-unused-modules
export function calculateActivePositions(positions: Position[]): Position[] {
  // Group positions by pool + tick range
  const positionGroups = new Map<string, Position[]>()

  positions.forEach((position) => {
    const key = `${position.pool.id}-${position.range.tickLower}-${position.range.tickUpper}`
    const group = positionGroups.get(key) || []
    group.push(position)
    positionGroups.set(key, group)
  })

  // Calculate net positions (deposits - withdrawals)
  const activePositions: Position[] = []

  positionGroups.forEach((group) => {
    let netDepositedToken0 = 0
    let netDepositedToken1 = 0
    let totalFeesToken0 = 0
    let totalFeesToken1 = 0

    group.forEach((position) => {
      netDepositedToken0 += parseFloat(position.tokens.deposited.token0) - parseFloat(position.tokens.withdrawn.token0)
      netDepositedToken1 += parseFloat(position.tokens.deposited.token1) - parseFloat(position.tokens.withdrawn.token1)
      totalFeesToken0 += parseFloat(position.tokens.fees.token0)
      totalFeesToken1 += parseFloat(position.tokens.fees.token1)
    })

    // Only include positions with net deposits > 0
    if (netDepositedToken0 > 0 || netDepositedToken1 > 0) {
      const latestPosition = group[group.length - 1] // Use latest position as template
      activePositions.push({
        ...latestPosition,
        tokens: {
          deposited: {
            token0: netDepositedToken0.toString(),
            token1: netDepositedToken1.toString(),
          },
          withdrawn: {
            token0: '0',
            token1: '0',
          },
          fees: {
            token0: totalFeesToken0.toString(),
            token1: totalFeesToken1.toString(),
          },
        },
      })
    }
  })

  return activePositions
}
