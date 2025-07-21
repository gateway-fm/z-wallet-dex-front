import { useWeb3React } from '@web3-react/core'
import { NEVER_RELOAD, useMainnetSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { safeNamehash } from 'utils/safeNamehash'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(ensName?: string | null): { loading: boolean; contenthash: string | null } {
  const { chainId } = useWeb3React()

  const isZephyrNetwork = chainId === ZEPHYR_CHAIN_ID

  // Disable ENS for Zephyr network since it doesn't support ENS
  const ensNodeArgument = useMemo(() => [ensName ? safeNamehash(ensName) : undefined], [ensName])
  const registrarContract = useENSRegistrarContract()
  const resolverAddressResult = useMainnetSingleCallResult(
    isZephyrNetwork ? null : registrarContract,
    'resolver',
    ensNodeArgument,
    NEVER_RELOAD
  )
  const resolverAddress = resolverAddressResult.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress
  )
  const contenthash = useMainnetSingleCallResult(
    isZephyrNetwork ? null : resolverContract,
    'contenthash',
    ensNodeArgument,
    NEVER_RELOAD
  )

  return useMemo(() => {
    if (isZephyrNetwork) {
      return { contenthash: null, loading: false }
    }

    return {
      contenthash: contenthash.result?.[0] ?? null,
      loading: resolverAddressResult.loading || contenthash.loading,
    }
  }, [contenthash.loading, contenthash.result, resolverAddressResult.loading, isZephyrNetwork])
}
