import { nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { useWeb3React } from '@web3-react/core'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import getTokenList from 'lib/hooks/useTokenList/fetchTokenList'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'

import { fetchTokenList } from '../state/lists/actions'

export function useFetchListCallback(): (listUrl: string, skipValidation?: boolean) => Promise<TokenList> {
  const dispatch = useAppDispatch()
  const { provider, chainId } = useWeb3React()
  const zephyrProvider = chainId === ZEPHYR_CHAIN_ID && provider ? provider : RPC_PROVIDERS[ZEPHYR_CHAIN_ID]
  return useCallback(
    async (listUrl: string, skipValidation?: boolean) => {
      // NOTE: Disabled for Zephyr network
      if (chainId === ZEPHYR_CHAIN_ID) {
        const emptyTokenList: TokenList = {
          name: 'Zephyr Dynamic Tokens',
          timestamp: new Date().toISOString(),
          version: { major: 1, minor: 0, patch: 0 },
          tokens: [],
          logoURI: '',
        }
        return emptyTokenList
      }

      const requestId = nanoid()
      dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      return getTokenList(listUrl, (ensName: string) => resolveENSContentHash(ensName, zephyrProvider), skipValidation)
        .then((tokenList) => {
          dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList, requestId }))
          return tokenList
        })
        .catch((error) => {
          console.debug(`Failed to get list at url ${listUrl}`, error)
          dispatch(fetchTokenList.rejected({ url: listUrl, requestId, errorMessage: error.message }))
          throw error
        })
    },
    [dispatch, zephyrProvider, chainId]
  )
}
