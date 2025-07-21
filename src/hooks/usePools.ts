import { Interface } from '@ethersproject/abi'
import { BigintIsh, Currency, Token, V3_CORE_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import IUniswapV3PoolStateJSON from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { computePoolAddress } from '@uniswap/v3-sdk'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { getZephyrPoolParams } from 'constants/zephyr'
import JSBI from 'jsbi'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { IUniswapV3PoolStateInterface } from '../types/v3/IUniswapV3PoolState'
import { useTopPools } from './useProtocolStats'

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateJSON.abi) as IUniswapV3PoolStateInterface

// Classes are expensive to instantiate, so this caches the recently instantiated pools.
// This avoids re-instantiating pools as the other pools in the same request are loaded.
class PoolCache {
  // Evict after 128 entries. Empirically, a swap uses 64 entries.
  private static MAX_ENTRIES = 128

  // These are FIFOs, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = []
  private static addresses: { key: string; address: string }[] = []

  static getPoolAddress(factoryAddress: string, tokenA: Token, tokenB: Token, fee: FeeAmount): string {
    if (this.addresses.length > this.MAX_ENTRIES) {
      this.addresses = this.addresses.slice(0, this.MAX_ENTRIES / 2)
    }

    const { address: addressA } = tokenA
    const { address: addressB } = tokenB
    const key = `${factoryAddress}:${addressA}:${addressB}:${fee.toString()}`
    const found = this.addresses.find((address) => address.key === key)
    if (found) return found.address

    const address = {
      key,
      address: computePoolAddress({
        factoryAddress,
        tokenA,
        tokenB,
        fee,
      }),
    }
    this.addresses.unshift(address)
    return address.address
  }

  static getPool(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
    sqrtPriceX96: BigintIsh,
    liquidity: BigintIsh,
    tick: number
  ): Pool {
    if (this.pools.length > this.MAX_ENTRIES) {
      this.pools = this.pools.slice(0, this.MAX_ENTRIES / 2)
    }

    const found = this.pools.find(
      (pool) =>
        pool.token0 === tokenA &&
        pool.token1 === tokenB &&
        pool.fee === fee &&
        JSBI.EQ(pool.sqrtRatioX96, sqrtPriceX96) &&
        JSBI.EQ(pool.liquidity, liquidity) &&
        pool.tickCurrent === tick
    )
    if (found) return found

    const pool = new Pool(tokenA, tokenB, fee, sqrtPriceX96, liquidity, tick)
    this.pools.unshift(pool)
    return pool
  }
}

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

function usePools(
  poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]
): [PoolState, Pool | null][] {
  const { chainId } = useWeb3React()
  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID
  const { pools: graphqlPools, loading: graphqlLoading } = useTopPools(100) // Get pools from GraphQL for Zephyr

  const poolTokens: ([Token, Token, FeeAmount] | undefined)[] = useMemo(() => {
    if (!chainId) return new Array(poolKeys.length)

    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      // For Zephyr network, use default fee if not specified
      // TODO: Add support for actual fee amounts, from new API probably
      const actualFeeAmount = feeAmount || (isZephyrNetwork ? FeeAmount.MEDIUM : undefined)

      if (currencyA && currencyB && actualFeeAmount) {
        const tokenA = currencyA.wrapped
        const tokenB = currencyB.wrapped
        if (tokenA.equals(tokenB)) return undefined

        return tokenA.sortsBefore(tokenB) ? [tokenA, tokenB, actualFeeAmount] : [tokenB, tokenA, actualFeeAmount]
      }
      return undefined
    })
  }, [chainId, poolKeys, isZephyrNetwork])

  const poolAddresses: (string | undefined)[] = useMemo(() => {
    const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId]
    if (!v3CoreFactoryAddress) return new Array(poolTokens.length)

    return poolTokens.map((value) => value && PoolCache.getPoolAddress(v3CoreFactoryAddress, ...value))
  }, [chainId, poolTokens])

  // Skip multicall for Zephyr network
  const slot0s = useMultipleContractSingleData(
    isZephyrNetwork ? [] : poolAddresses,
    POOL_STATE_INTERFACE,
    'slot0',
    undefined,
    { gasRequired: isZephyrNetwork ? 0 : undefined }
  )
  const liquidities = useMultipleContractSingleData(
    isZephyrNetwork ? [] : poolAddresses,
    POOL_STATE_INTERFACE,
    'liquidity',
    undefined,
    { gasRequired: isZephyrNetwork ? 0 : undefined }
  )

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      const tokens = poolTokens[index]
      if (!tokens) return [PoolState.INVALID, null]
      const [token0, token1, fee] = tokens

      // For Zephyr network, use GraphQL data or create mock pool
      // TODO: Remove mock pool once we have a proper API
      if (isZephyrNetwork) {
        if (graphqlLoading) return [PoolState.LOADING, null]

        // Find matching pool in GraphQL data
        const graphqlPool = graphqlPools?.find((pool) => {
          const pool0Address = pool.token0.id.toLowerCase()
          const pool1Address = pool.token1.id.toLowerCase()
          const token0Address = token0.address.toLowerCase()
          const token1Address = token1.address.toLowerCase()

          return (
            (pool0Address === token0Address && pool1Address === token1Address) ||
            (pool0Address === token1Address && pool1Address === token0Address)
          )
        })

        try {
          if (graphqlPool) {
            // Pool exists in GraphQL - create with proper 1:1 price accounting for decimals
            const { sqrtPriceX96, tick, liquidity } = getZephyrPoolParams(token0, token1)
            const pool = new Pool(token0, token1, fee || FeeAmount.MEDIUM, sqrtPriceX96, liquidity, tick)
            return [PoolState.EXISTS, pool]
          } else {
            // Pool doesn't exist in GraphQL - this is fine for V3, means we can create new pool
            // Return NOT_EXISTS so UI shows pool creation flow
            return [PoolState.NOT_EXISTS, null]
          }
        } catch (error) {
          console.error('Error when constructing Zephyr pool', error)
          return [PoolState.NOT_EXISTS, null]
        }
      }

      // Original logic for non-Zephyr networks
      if (!slot0s[index]) return [PoolState.INVALID, null]
      const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index]

      if (!liquidities[index]) return [PoolState.INVALID, null]
      const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities[index]

      if (!tokens || !slot0Valid || !liquidityValid) return [PoolState.INVALID, null]
      if (slot0Loading || liquidityLoading) return [PoolState.LOADING, null]
      if (!slot0 || !liquidity) return [PoolState.NOT_EXISTS, null]
      if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [PoolState.NOT_EXISTS, null]

      try {
        const pool = PoolCache.getPool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)
        return [PoolState.EXISTS, pool]
      } catch (error) {
        console.error('Error when constructing the pool', error)
        return [PoolState.NOT_EXISTS, null]
      }
    })
  }, [liquidities, poolKeys, slot0s, poolTokens, isZephyrNetwork, graphqlPools, graphqlLoading])
}

export function usePool(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): [PoolState, Pool | null] {
  const poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = useMemo(
    () => [[currencyA, currencyB, feeAmount]],
    [currencyA, currencyB, feeAmount]
  )

  return usePools(poolKeys)[0]
}
