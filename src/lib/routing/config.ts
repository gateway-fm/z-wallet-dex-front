import { CONTRACTS_CONFIG, NETWORK_CONFIG } from '../../config/zephyr'

export const UniswapV3Contracts = {
  routerAddress: CONTRACTS_CONFIG.SWAP_ROUTER_02,
  factoryAddress: CONTRACTS_CONFIG.V3_CORE_FACTORY,
  quoterAddress: CONTRACTS_CONFIG.QUOTER_V2,
  multicallAddress: CONTRACTS_CONFIG.MULTICALL2,
} as const

export const ProviderUrl = NETWORK_CONFIG.RPC.PRIMARY
