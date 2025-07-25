import { BigNumber } from '@ethersproject/bignumber'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useV3NFTPositionManagerContract } from './useContract'

type TokenId = number | JSBI | BigNumber

const STARTS_WITH = 'data:application/json;base64,'

type UsePositionTokenURIResult =
  | {
      valid: true
      loading: false
      result: {
        name: string
        description: string
        image: string
      }
    }
  | {
      valid: false
      loading: false
    }
  | {
      valid: true
      loading: true
    }

// Zephyr-specific tokenURI fetching using direct RPC calls
function useZephyrPositionTokenURI(tokenId: TokenId | undefined): UsePositionTokenURIResult {
  const { provider } = useWeb3React()
  const positionManager = useV3NFTPositionManagerContract()
  const [state, setState] = useState<UsePositionTokenURIResult>({
    valid: true,
    loading: true,
  })

  useEffect(() => {
    if (!tokenId || !positionManager || !provider) {
      setState({ valid: false, loading: false })
      return
    }

    let isCancelled = false
    const fetchTokenURI = async () => {
      try {
        setState({ valid: true, loading: true })

        const tokenIdHex = tokenId instanceof BigNumber ? tokenId.toHexString() : tokenId.toString(16)
        const tokenURI = await positionManager.tokenURI(tokenIdHex)

        if (isCancelled) return

        if (!tokenURI || !tokenURI.startsWith(STARTS_WITH)) {
          setState({ valid: false, loading: false })
          return
        }

        const json = JSON.parse(atob(tokenURI.slice(STARTS_WITH.length)))

        if (!isCancelled) {
          setState({
            valid: true,
            loading: false,
            result: json,
          })
        }
      } catch (error) {
        console.warn('Failed to fetch position token URI for Zephyr:', error)
        if (!isCancelled) {
          setState({ valid: false, loading: false })
        }
      }
    }

    fetchTokenURI()

    return () => {
      isCancelled = true
    }
  }, [tokenId, positionManager, provider])

  return state
}

export function usePositionTokenURI(tokenId: TokenId | undefined): UsePositionTokenURIResult {
  const { chainId } = useWeb3React()
  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID

  // Use Zephyr-specific implementation for Zephyr network
  const zephyrResult = useZephyrPositionTokenURI(isZephyrNetwork ? tokenId : undefined)

  // Original implementation for other networks
  const contract = useV3NFTPositionManagerContract()
  const inputs = useMemo(
    () => [tokenId instanceof BigNumber ? tokenId.toHexString() : tokenId?.toString(16)],
    [tokenId]
  )
  const { result, error, loading, valid } = useSingleCallResult(isZephyrNetwork ? null : contract, 'tokenURI', inputs, {
    ...NEVER_RELOAD,
    gasRequired: 3_000_000,
  })

  const standardResult = useMemo((): UsePositionTokenURIResult => {
    if (isZephyrNetwork) {
      return { valid: false, loading: false } // Skip for Zephyr
    }

    if (error || !valid || !tokenId) {
      return {
        valid: false,
        loading: false,
      }
    }
    if (loading) {
      return {
        valid: true,
        loading: true,
      }
    }
    if (!result) {
      return {
        valid: false,
        loading: false,
      }
    }
    const [tokenURI] = result as [string]
    if (!tokenURI || !tokenURI.startsWith(STARTS_WITH))
      return {
        valid: false,
        loading: false,
      }

    try {
      const json = JSON.parse(atob(tokenURI.slice(STARTS_WITH.length)))

      return {
        valid: true,
        loading: false,
        result: json,
      }
    } catch (error) {
      return { valid: false, loading: false }
    }
  }, [error, loading, result, tokenId, valid, isZephyrNetwork])

  // Return appropriate result based on network
  if (isZephyrNetwork) {
    return zephyrResult
  }

  return standardResult
}
