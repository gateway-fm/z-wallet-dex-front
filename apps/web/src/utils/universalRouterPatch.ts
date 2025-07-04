import { UNIVERSAL_ROUTER_ADDRESSES } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'

/**
 * Patch for Universal Router SDK to support custom networks
 */
export function getUniversalRouterAddress(version: UniversalRouterVersion, chainId: number): string {
  if (chainId in UNIVERSAL_ROUTER_ADDRESSES) {
    return UNIVERSAL_ROUTER_ADDRESSES[chainId as UniverseChainId]!
  }
  return UNIVERSAL_ROUTER_ADDRESS(version, chainId)
} 