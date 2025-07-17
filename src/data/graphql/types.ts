/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-unused-modules */

// Base Token interface from GraphQL API
export interface GraphQLToken {
  id: string
  symbol: string
  name: string
  decimals: number
  volumeUSD?: string
  txCount?: string
  totalValueLocked?: string
  priceUSD?: string
  pools?: Array<{
    id: string
    feeTier: string
    volumeUSD: string
    totalValueLockedUSD: string
  }>
}

// Token price data interface
export interface TokenPriceData {
  address: string
  symbol: string
  priceUSD: number
}

// Protocol statistics interface
export interface ProtocolStats {
  totalVolumeUSD: string
  totalValueLockedUSD: string
  txCount: string
  poolCount: string
  volume24h: string
  fees24h: string
}

// Pool information interface
export interface PoolInfo {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: number
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: number
  }
  feeTier: string
  totalValueLockedUSD: string
  volumeUSD: string
  txCount: string
}

// User position interface
export interface Position {
  id: string
  pool: PoolInfo
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

// Transaction interface
export interface Transaction {
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

// Hook result interfaces
export interface UseTokenSearchResult {
  tokens: GraphQLToken[]
  loading: boolean
  error: any
}

export interface UseProtocolStatsResult {
  stats: ProtocolStats | null
  loading: boolean
  error: any
}

export interface UseTopPoolsResult {
  pools: PoolInfo[]
  loading: boolean
  error: any
}

export interface UseUserPositionsResult {
  positions: Position[]
  loading: boolean
  error: any
}

export interface UseUserTransactionsResult {
  transactions: Transaction[]
  loading: boolean
  error: any
}
