/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-unused-modules */

import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'

import { CONTRACTS_CONFIG, TOKENS_CONFIG } from '../config/zephyr'
import { ZEPHYR_CHAIN_ID } from './chains'

type AddressMap = { [chainId: number]: string }

/**
 * Custom Universal Router Address function that supports Zephyr
 * Falls back to Swap Router 02 for Zephyr chain, uses official Universal Router for others
 */
export function getUniversalRouterAddress(chainId: number): string {
  if (chainId === ZEPHYR_CHAIN_ID) {
    // For Zephyr, use Swap Router 02 as Universal Router is not deployed
    return CONTRACTS_CONFIG.SWAP_ROUTER_02
  }

  // For other chains, use the official Universal Router
  try {
    return UNIVERSAL_ROUTER_ADDRESS(chainId)
  } catch (error) {
    throw new Error(`Universal Router not deployed on chain ${chainId}`)
  }
}

/**
 * Universal Router addresses mapping
 */
export const UNIVERSAL_ROUTER_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.SWAP_ROUTER_02,
}

/**
 * Known contract addresses for Zephyr network - using configuration system
 */
export const ZEPHYR_CONTRACTS = {
  V3_CORE_FACTORY: CONTRACTS_CONFIG.V3_CORE_FACTORY,
  MULTICALL2: CONTRACTS_CONFIG.MULTICALL2,
  POSITION_MANAGER: CONTRACTS_CONFIG.POSITION_MANAGER,
  SWAP_ROUTER_02: CONTRACTS_CONFIG.SWAP_ROUTER_02,
  QUOTER_V2: CONTRACTS_CONFIG.QUOTER_V2,
  TICK_LENS: CONTRACTS_CONFIG.TICK_LENS,
  V3_MIGRATOR: CONTRACTS_CONFIG.V3_MIGRATOR,
  DELEGATION: CONTRACTS_CONFIG.DELEGATION,
  WRAPPED_ZERO: TOKENS_CONFIG.WRAPPED_NATIVE.ADDRESS,
  USDC: TOKENS_CONFIG.USDC.ADDRESS,
}

/**
 * Contract addresses by chain - simplified for Zephyr only
 */
export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.V3_CORE_FACTORY,
}

export const MULTICALL_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.MULTICALL2,
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.POSITION_MANAGER,
}

export const QUOTER_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.QUOTER_V2,
}

export const SWAP_ROUTER_02_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.SWAP_ROUTER_02,
}

export const TICK_LENS_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.TICK_LENS,
}

export const V3_MIGRATOR_ADDRESSES: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.V3_MIGRATOR,
}

export const DELEGATION_ADDRESS: AddressMap = {
  [ZEPHYR_CHAIN_ID]: CONTRACTS_CONFIG.DELEGATION,
}

/**
 * Legacy exports for compatibility
 */
export const MIXED_ROUTE_QUOTER_V1_ADDRESSES: AddressMap = {}
export const AVERAGE_L1_BLOCK_TIME = 12_000

// Simplified functions for Zephyr-only deployment
export function constructSameAddressMap<T extends string>(address: T): { [chainId: number]: T } {
  return {
    [ZEPHYR_CHAIN_ID]: address,
  }
}

export { CONTRACTS_CONFIG, TOKENS_CONFIG } from '../config/zephyr'
