import { ZEPHYR_CHAIN_ID } from './chains'

/**
 * Fallback JSON-RPC endpoints for Zephyr network.
 */
// eslint-disable-next-line import/no-unused-modules
export const FALLBACK_URLS: { [chainId: number]: string[] } = {
  [ZEPHYR_CHAIN_ID]: ['https://zephyr-rpc.eu-north-2.gateway.fm'],
}

/**
 * Known JSON-RPC endpoints for Zephyr network.
 */
export const RPC_URLS: { [chainId: number]: string[] } = {
  [ZEPHYR_CHAIN_ID]: [...FALLBACK_URLS[ZEPHYR_CHAIN_ID]],
}
