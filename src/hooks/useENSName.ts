import { useWeb3React } from '@web3-react/core'
import { NEVER_RELOAD, useMainnetSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { safeNamehash } from 'utils/safeNamehash'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { isAddress } from '../utils'
import isZero from '../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from './useContract'
import useDebounce from './useDebounce'
import useENSAddress from './useENSAddress'

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
export default function useENSName(address?: string): { ENSName: string | null; loading: boolean } {
  const { chainId } = useWeb3React()
  const debouncedAddress = useDebounce(address, 200)

  // Disable ENS for Zephyr network since it doesn't support ENS
  const ensNodeArgument = useMemo(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) return [undefined]
    return [safeNamehash(`${debouncedAddress.toLowerCase().substr(2)}.addr.reverse`)]
  }, [debouncedAddress])
  const registrarContract = useENSRegistrarContract()
  const resolverAddress = useMainnetSingleCallResult(
    chainId === ZEPHYR_CHAIN_ID ? null : registrarContract,
    'resolver',
    ensNodeArgument,
    NEVER_RELOAD
  )
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined
  )
  const nameCallRes = useMainnetSingleCallResult(
    chainId === ZEPHYR_CHAIN_ID ? null : resolverContract,
    'name',
    ensNodeArgument,
    NEVER_RELOAD
  )
  const name = nameCallRes.result?.[0]

  // ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy
  // and recommends that you perform a match on the forward resolution
  // see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
  const fwdAddr = useENSAddress(name)
  const checkedName = address === fwdAddr?.address ? name : null

  const changed = debouncedAddress !== address
  const loading =
    changed || (chainId !== ZEPHYR_CHAIN_ID && (resolverAddress.loading || nameCallRes.loading || fwdAddr.loading))
  return useMemo(
    () => ({
      ENSName: changed || chainId === ZEPHYR_CHAIN_ID ? null : checkedName,
      loading,
    }),
    [changed, checkedName, loading, chainId]
  )
}
