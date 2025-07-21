import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenContract } from './useContract'

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): CurrencyAmount<Token> | undefined {
  const { chainId } = useWeb3React()
  const contract = useTokenContract(token?.address, false)

  // Skip multicall for Zephyr network
  const skipMulticall = chainId === ZEPHYR_CHAIN_ID

  const totalSupplyStr: string | undefined = useSingleCallResult(
    skipMulticall ? null : contract,
    'totalSupply'
  )?.result?.[0]?.toString()

  return useMemo(() => {
    if (!token) return undefined

    // For Zephyr network, return a default total supply since we can't query contracts
    // TODO: Remove mock total supply once we have a proper API
    if (skipMulticall) {
      return CurrencyAmount.fromRawAmount(token, Math.pow(10, 18)) // 1M tokens with 18 decimals
    }

    if (!totalSupplyStr) return undefined
    return CurrencyAmount.fromRawAmount(token, totalSupplyStr)
  }, [token, totalSupplyStr, skipMulticall])
}
