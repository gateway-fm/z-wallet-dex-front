import { gql } from '@apollo/client'

// Token Search & Discovery Queries
export const SEARCH_TOKENS = gql`
  query SearchTokens($search: String!, $first: Int = 20) {
    tokens(
      where: { or: [{ symbol_contains_nocase: $search }, { name_contains_nocase: $search }, { id: $search }] }
      first: $first
      orderBy: volumeUSD
      orderDirection: desc
    ) {
      id
      symbol
      name
      decimals
      volumeUSD
      txCount
      totalValueLocked
      pools(first: 3, orderBy: volumeUSD, orderDirection: desc) {
        id
        feeTier
        volumeUSD
        totalValueLockedUSD
      }
    }
  }
`

export const TRENDING_TOKENS = gql`
  query TrendingTokens($first: Int = 10) {
    tokens(first: $first, orderBy: volumeUSD, orderDirection: desc) {
      id
      symbol
      name
      decimals
      volumeUSD
      totalValueLocked
      poolCount
    }
  }
`

// Protocol Analytics Queries
export const PROTOCOL_STATS = gql`
  query ProtocolStats {
    uniswapDayDatas(first: 1, orderBy: date, orderDirection: desc) {
      date
      volumeUSD
      tvlUSD
      txCount
      feesUSD
    }

    factories(first: 1) {
      totalVolumeUSD
      totalValueLockedUSD
      txCount
      poolCount
    }
  }
`

export const TOP_POOLS = gql`
  query TopPools($first: Int = 10) {
    pools(first: $first, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      token0Price
      token1Price
      totalValueLockedUSD
      volumeUSD
      txCount
    }
  }
`

// User Positions & Portfolio Queries
export const USER_POSITIONS = gql`
  query UserPositions($owner: Bytes!, $first: Int = 100) {
    positions(where: { owner: $owner }, first: $first, orderBy: transaction__timestamp, orderDirection: desc) {
      id
      owner
      pool {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
        feeTier
      }
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      liquidity
      depositedToken0
      depositedToken1
      withdrawnToken0
      withdrawnToken1
      collectedFeesToken0
      collectedFeesToken1
      transaction {
        timestamp
      }
    }
  }
`

export const USER_TRANSACTIONS = gql`
  query UserTransactions($user: Bytes!, $first: Int = 50, $skip: Int = 0) {
    transactions(
      where: {
        or: [
          { swaps_: { origin: $user } }
          { mints_: { owner: $user } }
          { burns_: { owner: $user } }
          { collects_: { owner: $user } }
        ]
      }
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      timestamp
      gasUsed
      gasPrice
      swaps {
        id
        amount0
        amount1
        amountUSD
        token0 {
          symbol
        }
        token1 {
          symbol
        }
        pool {
          feeTier
        }
      }
      mints {
        id
        amount0
        amount1
        amountUSD
        pool {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
          feeTier
        }
      }
      burns {
        id
        amount0
        amount1
        amountUSD
        pool {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
          feeTier
        }
      }
      collects {
        id
        amount0
        amount1
        amountUSD
        pool {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
          feeTier
        }
      }
    }
  }
`

// Token Details Query
// eslint-disable-next-line import/no-unused-modules
export const TOKEN_DETAILS = gql`
  query TokenDetails($id: ID!) {
    token(id: $id) {
      id
      symbol
      name
      decimals
      totalSupply
      totalValueLocked
      totalValueLockedUSD
      volume
      volumeUSD
      txCount
      poolCount
      tokenDayData(first: 30, orderBy: date, orderDirection: desc) {
        date
        volumeUSD
        totalValueLockedUSD
      }
      whitelistPools(first: 10, orderBy: totalValueLockedUSD, orderDirection: desc) {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
        feeTier
        totalValueLockedUSD
        volumeUSD
      }
    }
  }
`

// Pool Details Query
// eslint-disable-next-line import/no-unused-modules
export const POOL_DETAILS = gql`
  query PoolDetails($id: ID!) {
    pool(id: $id) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      sqrtPrice
      liquidity
      tick
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedUSD
      volume
      volumeUSD
      txCount
      poolDayData(first: 30, orderBy: date, orderDirection: desc) {
        date
        volumeUSD
        totalValueLockedUSD
        txCount
      }
    }
  }
`
