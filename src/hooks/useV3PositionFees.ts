import { BigNumber } from '@ethersproject/bignumber'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { useSingleCallResult } from 'lib/hooks/multicall'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useEffect, useState } from 'react'
import { unwrappedToken } from 'utils/unwrappedToken'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useV3NFTPositionManagerContract } from './useContract'

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1)

// Zephyr-specific fee fetching using direct RPC calls
function useZephyrV3PositionFees(
  pool?: Pool,
  tokenId?: BigNumber,
  asWETH = false
): [CurrencyAmount<Currency>, CurrencyAmount<Currency>] | [undefined, undefined] {
  const { provider } = useWeb3React()
  const positionManager = useV3NFTPositionManagerContract(false)
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber] | undefined>()
  const latestBlockNumber = useBlockNumber()

  useEffect(() => {
    if (!positionManager || !tokenId || !provider) {
      setAmounts(undefined)
      return
    }

    let isCancelled = false
    const getFees = async () => {
      try {
        // Get the owner of the position
        const owner = await positionManager.ownerOf(tokenId)

        if (isCancelled) return

        // Call collect with max amounts to get unclaimed fees
        const results = await positionManager.callStatic.collect(
          {
            tokenId: tokenId.toHexString(),
            recipient: owner,
            amount0Max: MAX_UINT128,
            amount1Max: MAX_UINT128,
          },
          { from: owner }
        )

        if (!isCancelled) {
          setAmounts([results.amount0, results.amount1])
        }
      } catch (error) {
        console.warn('Failed to fetch position fees for Zephyr:', error)
        if (!isCancelled) {
          setAmounts([BigNumber.from(0), BigNumber.from(0)])
        }
      }
    }

    getFees()

    return () => {
      isCancelled = true
    }
  }, [positionManager, tokenId, provider, latestBlockNumber])

  if (pool && amounts) {
    return [
      CurrencyAmount.fromRawAmount(asWETH ? pool.token0 : unwrappedToken(pool.token0), amounts[0].toString()),
      CurrencyAmount.fromRawAmount(asWETH ? pool.token1 : unwrappedToken(pool.token1), amounts[1].toString()),
    ]
  } else {
    return [undefined, undefined]
  }
}

// compute current + counterfactual fees for a v3 position
export function useV3PositionFees(
  pool?: Pool,
  tokenId?: BigNumber,
  asWETH = false
): [CurrencyAmount<Currency>, CurrencyAmount<Currency>] | [undefined, undefined] {
  const { chainId } = useWeb3React()
  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID

  // Use Zephyr-specific implementation for Zephyr network
  const zephyrFees = useZephyrV3PositionFees(
    isZephyrNetwork ? pool : undefined,
    isZephyrNetwork ? tokenId : undefined,
    asWETH
  )

  // Original implementation for other networks
  const positionManager = useV3NFTPositionManagerContract(false)

  const owner: string | undefined = useSingleCallResult(
    tokenId && !isZephyrNetwork ? positionManager : null,
    'ownerOf',
    [tokenId]
  ).result?.[0]

  const tokenIdHexString = tokenId?.toHexString()
  const latestBlockNumber = useBlockNumber()

  // we can't use multicall for this because we need to simulate the call from a specific address
  // latestBlockNumber is included to ensure data stays up-to-date every block
  const [amounts, setAmounts] = useState<[BigNumber, BigNumber] | undefined>()
  useEffect(() => {
    if (isZephyrNetwork) {
      // Skip for Zephyr - handled by zephyrFees
      return
    }

    ;(async function getFees() {
      if (positionManager && tokenIdHexString && owner) {
        try {
          const results = await positionManager.callStatic.collect(
            {
              tokenId: tokenIdHexString,
              recipient: owner, // some tokens might fail if transferred to address(0)
              amount0Max: MAX_UINT128,
              amount1Max: MAX_UINT128,
            },
            { from: owner } // need to simulate the call as the owner
          )
          setAmounts([results.amount0, results.amount1])
        } catch {
          // If the static call fails, the default state will remain for `amounts`.
          // This case is handled by returning unclaimed fees as empty.
          // TODO(WEB-2283): Look into why we have failures with call data being 0x.
        }
      }
    })()
  }, [positionManager, tokenIdHexString, owner, latestBlockNumber, isZephyrNetwork])

  // Return appropriate result based on network
  if (isZephyrNetwork) {
    return zephyrFees
  }

  if (pool && amounts) {
    return [
      CurrencyAmount.fromRawAmount(asWETH ? pool.token0 : unwrappedToken(pool.token0), amounts[0].toString()),
      CurrencyAmount.fromRawAmount(asWETH ? pool.token1 : unwrappedToken(pool.token1), amounts[1].toString()),
    ]
  } else {
    return [undefined, undefined]
  }
}
