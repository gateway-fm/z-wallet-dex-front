import { ChainId } from '@uniswap/sdk-core'

// Custom Chain ID for Zephyr network
export const ZEPHYR_CHAIN_ID = 1417429182

export const CHAIN_IDS_TO_NAMES = {
  [ZEPHYR_CHAIN_ID]: 'zephyr',
} as const

// Only Zephyr network is supported
export type SupportedInterfaceChain = typeof ZEPHYR_CHAIN_ID

export function isSupportedChain(chainId: number | null | undefined | ChainId): chainId is SupportedInterfaceChain {
  return !!chainId && chainId === ZEPHYR_CHAIN_ID
}

export function asSupportedChain(chainId: number | null | undefined | ChainId): SupportedInterfaceChain | undefined {
  if (!chainId) return undefined
  return isSupportedChain(chainId) ? chainId : undefined
}

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [ZEPHYR_CHAIN_ID] as const

/**
 * Supported networks for V2 pool behavior.
 */
export const SUPPORTED_V2POOL_CHAIN_IDS = [] as const

export const TESTNET_CHAIN_IDS = [ZEPHYR_CHAIN_ID] as const

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [ZEPHYR_CHAIN_ID] as const

export type SupportedL1ChainId = (typeof L1_CHAIN_IDS)[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [] as const

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number]

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: ChainId | number): number {
  switch (chainId) {
    case ZEPHYR_CHAIN_ID:
      return 0
    default:
      return 1
  }
}
