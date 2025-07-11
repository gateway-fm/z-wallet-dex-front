import AppStaticJsonRpcProvider from 'rpc/StaticJsonRpcProvider'
import StaticJsonRpcProvider from 'rpc/StaticJsonRpcProvider'

import { ZEPHYR_CHAIN_ID } from './chains'
import { RPC_URLS } from './networks'

const providerFactory = (chainId: number, i = 0) => new AppStaticJsonRpcProvider(chainId as any, RPC_URLS[chainId][i])

/**
 * These are the only JsonRpcProviders used directly by the interface.
 */
export const RPC_PROVIDERS: { [key: number]: StaticJsonRpcProvider } = {
  [ZEPHYR_CHAIN_ID]: providerFactory(ZEPHYR_CHAIN_ID),
}
