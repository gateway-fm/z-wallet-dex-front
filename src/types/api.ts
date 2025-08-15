import { RefPrice, Token, TokenResp, TokensList, TokensResp } from '../api/Api'

export type { RefPrice, Token }
export type TokenDetailsResponse = TokenResp
export type TokenListResponse = TokensList
export type SearchTokensResponse = TokensResp

export interface Pool {
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
  token0Price: string
  token1Price: string
  totalValueLockedUSD: string
  volumeUSD: string
  txCount: string
}

export interface Position {
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

export interface ProtocolStats {
  totalVolumeUSD: string
  totalValueLockedUSD: string
  txCount: string
  poolCount: string
  volume24h: string
  fees24h: string
}

export interface UseTokenSearchResult {
  tokens: Token[]
  loading: boolean
  error: any
}

export interface UseUserPositionsResult {
  positions: Position[]
  loading: boolean
  error: any
}

export interface UseUserTransactionsResult {
  transactions: any[]
  loading: boolean
  error: any
}

export interface UseProtocolStatsResult {
  stats: ProtocolStats | null
  loading: boolean
  error: any
}

export interface UseTopPoolsResult {
  pools: Pool[]
  loading: boolean
  error: any
}

export interface TokenPriceData {
  address: string
  symbol: string
  priceUSD: number
}

export interface ApiError {
  code: number
  message: string
}
