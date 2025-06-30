import { ZEPHYR_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/custom'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { ALL_CHAIN_IDS, UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'

export function getChainInfo(chainId: UniverseChainId): UniverseChainInfo {
  const chainInfo = UNIVERSE_CHAIN_INFO[chainId as keyof typeof UNIVERSE_CHAIN_INFO]
  if (!chainInfo) {
    return UNIVERSE_CHAIN_INFO[UniverseChainId.Zephyr] as UniverseChainInfo
  }
  return chainInfo
}

export const UNIVERSE_CHAIN_INFO = {
  [UniverseChainId.Mainnet]: MAINNET_CHAIN_INFO,
  [UniverseChainId.Zephyr]: ZEPHYR_CHAIN_INFO,
} as const

function getUniverseChainsSorted() {
  const sortOrder = new Map(ALL_CHAIN_IDS.map((chainId, idx) => [chainId, idx]))
  return Object.values(UNIVERSE_CHAIN_INFO).sort((a, b) => {
    const indexA = sortOrder.get(a.id) ?? Infinity
    const indexB = sortOrder.get(b.id) ?? Infinity
    return indexA - indexB
  })
}
export const UNIVERSE_CHAINS_SORTED = getUniverseChainsSorted()

export const GQL_MAINNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => !chain.testnet)
  .map((chain) => chain.backendChain.chain)

export const GQL_TESTNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => chain.testnet)
  .map((chain) => chain.backendChain.chain)
