import { NETWORK_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from './chains'

/**
 * Fallback JSON-RPC endpoints for Zephyr network
 */
// eslint-disable-next-line import/no-unused-modules
export const FALLBACK_URLS: { [chainId: number]: string[] } = {
  [ZEPHYR_CHAIN_ID]: [
    NETWORK_CONFIG.RPC.PRIMARY,
    ...(NETWORK_CONFIG.RPC.FALLBACK ? [NETWORK_CONFIG.RPC.FALLBACK] : []),
  ],
}

/**
 * Known JSON-RPC endpoints for Zephyr network
 */
export const RPC_URLS: { [chainId: number]: string[] } = {
  [ZEPHYR_CHAIN_ID]: [...FALLBACK_URLS[ZEPHYR_CHAIN_ID]],
}
