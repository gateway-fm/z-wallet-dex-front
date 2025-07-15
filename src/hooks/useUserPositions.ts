import { useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { handleGraphQLError, zephyrGraphQLClient } from '../data/graphql/client'
import { USER_POSITIONS, USER_TRANSACTIONS } from '../data/graphql/queries'

interface Token {
  id: string
  symbol: string
  name: string
  decimals: number
}

interface Pool {
  id: string
  token0: Token
  token1: Token
  feeTier: string
}

interface Position {
  id: string
  pool: Pool
  range: {
    tickLower: number
    tickUpper: number
  }
  liquidity: string
  tokens: {
    deposited: {
      token0: string
      token1: string
    }
    withdrawn: {
      token0: string
      token1: string
    }
    fees: {
      token0: string
      token1: string
    }
  }
  timestamp: string
}

interface Transaction {
  id: string
  timestamp: string
  gasUsed: string
  gasPrice: string
  swaps: Array<{
    id: string
    amount0: string
    amount1: string
    amountUSD: string
    token0: { symbol: string }
    token1: { symbol: string }
    pool: { feeTier: string }
  }>
  mints: Array<{
    id: string
    amount0: string
    amount1: string
    amountUSD: string
    pool: {
      token0: { symbol: string }
      token1: { symbol: string }
      feeTier: string
    }
  }>
  burns: Array<{
    id: string
    amount0: string
    amount1: string
    amountUSD: string
    pool: {
      token0: { symbol: string }
      token1: { symbol: string }
      feeTier: string
    }
  }>
  collects: Array<{
    id: string
    amount0: string
    amount1: string
    amountUSD: string
    pool: {
      token0: { symbol: string }
      token1: { symbol: string }
      feeTier: string
    }
  }>
}

interface UseUserPositionsResult {
  positions: Position[]
  loading: boolean
  error: any
}

interface UseUserTransactionsResult {
  transactions: Transaction[]
  loading: boolean
  error: any
}

export function useUserPositions(account?: string): UseUserPositionsResult {
  const { data, loading, error } = useQuery(USER_POSITIONS, {
    variables: { owner: account?.toLowerCase() },
    skip: !account,
    client: zephyrGraphQLClient,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    pollInterval: 30 * 1000, // Update every 30 seconds for positions
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

export function useUserTransactions(account?: string, first = 50, skip = 0): UseUserTransactionsResult {
  const { data, loading, error } = useQuery(USER_TRANSACTIONS, {
    variables: { user: account?.toLowerCase(), first, skip },
    skip: !account,
    client: zephyrGraphQLClient,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
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
export function calculateActivePositions(positions: Position[]): Position[] {
  // Group positions by pool + tick range
  const positionGroups = new Map<string, Position[]>()

  positions.forEach((position) => {
    const key = `${position.pool.id}-${position.range.tickLower}-${position.range.tickUpper}`
    if (!positionGroups.has(key)) {
      positionGroups.set(key, [])
    }
    positionGroups.get(key)!.push(position)
  })

  // Calculate net liquidity for each group
  const activePositions: Position[] = []

  positionGroups.forEach((groupPositions) => {
    let netLiquidity = 0
    let latestPosition = groupPositions[0]

    groupPositions.forEach((position) => {
      netLiquidity += parseFloat(position.liquidity)
      // Keep track of the latest position for metadata
      if (parseInt(position.timestamp) > parseInt(latestPosition.timestamp)) {
        latestPosition = position
      }
    })

    // Only include positions with positive net liquidity
    if (netLiquidity > 0) {
      activePositions.push({
        ...latestPosition,
        liquidity: netLiquidity.toString(),
      })
    }
  })

  return activePositions
}
