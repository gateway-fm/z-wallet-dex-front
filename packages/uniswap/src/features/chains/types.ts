// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import type { ImageSourcePropType } from 'react-native'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Chain as WagmiChain } from 'wagmi/chains'

export function isUniverseChainId(chainId?: number | UniverseChainId | null): chainId is UniverseChainId {
  return !!chainId && ALL_CHAIN_IDS.includes(chainId as UniverseChainId)
}

export enum UniverseChainId {
  Mainnet = 1,
  ArbitrumOne = 42161,
  Avalanche = 43114,
  Base = 8453,
  Blast = 81457,
  Bnb = 56,
  Celo = 42220,
  MonadTestnet = 1337,
  Optimism = 10,
  Polygon = 137,
  Sepolia = 11155111,
  Soneium = 123456789,
  Unichain = 987654321,
  UnichainSepolia = 111111111,
  WorldChain = 222222222,
  Zksync = 324,
  Zora = 7777777,
  Zephyr = Number(process.env.REACT_APP_CUSTOM_NETWORK_CHAIN_ID) || 1417429182,
}

export const SUPPORTED_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Mainnet,
  UniverseChainId.Zephyr,
]

export const SUPPORTED_TESTNET_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Sepolia,
  UniverseChainId.MonadTestnet,
  UniverseChainId.UnichainSepolia,
  UniverseChainId.Zephyr,
]

// This order is used as a fallback for chain ordering but will otherwise defer to useOrderedChainIds
export const ALL_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Mainnet,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Avalanche,
  UniverseChainId.Base,
  UniverseChainId.Blast,
  UniverseChainId.Bnb,
  UniverseChainId.Celo,
  UniverseChainId.MonadTestnet,
  UniverseChainId.Optimism,
  UniverseChainId.Polygon,
  UniverseChainId.Sepolia,
  UniverseChainId.Soneium,
  UniverseChainId.Unichain,
  UniverseChainId.UnichainSepolia,
  UniverseChainId.WorldChain,
  UniverseChainId.Zksync,
  UniverseChainId.Zora,
  UniverseChainId.Zephyr,
]

export interface EnabledChainsInfo {
  chains: UniverseChainId[]
  gqlChains: GqlChainId[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
}

export enum RPCType {
  Public = 'public',
  Private = 'private',
  PublicAlt = 'public_alternative',
  Interface = 'interface',
  Fallback = 'fallback',
  Default = 'default',
}

export enum NetworkLayer {
  L1 = 0,
  L2 = 1,
}

export interface RetryOptions {
  n: number
  minWait: number
  maxWait: number
}

export type GqlChainId = Exclude<BackendChainId, BackendChainId.UnknownChain | BackendChainId.EthereumGoerli>

export interface BackendChain {
  chain: GqlChainId
  /**
   * Set to false if the chain is not available on Explore.
   */
  backendSupported: boolean
  /**
   * Used for spot token prices
   */
  nativeTokenBackendAddress: string | undefined
}

type ChainRPCUrls = { http: string[] }
export interface UniverseChainInfo extends WagmiChain {
  readonly id: UniverseChainId
  readonly assetRepoNetworkName: string | undefined // Name used to index the network on this repo: https://github.com/Uniswap/assets/
  readonly backendChain: BackendChain
  readonly blockPerMainnetEpochForChainId: number
  readonly blockWaitMsBeforeWarning: number | undefined
  readonly bridge?: string
  readonly docs: string
  readonly elementName: ElementName
  readonly explorer: {
    name: string
    url: `${string}/`
    apiURL?: string
  }
  readonly rpcUrls: {
    [RPCType.Default]: ChainRPCUrls
    [RPCType.Private]?: ChainRPCUrls
    [RPCType.Public]?: ChainRPCUrls
    [RPCType.PublicAlt]?: ChainRPCUrls
    [RPCType.Interface]: ChainRPCUrls
    [RPCType.Fallback]?: ChainRPCUrls
  }
  readonly interfaceName: string
  readonly label: string
  readonly logo: ImageSourcePropType
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number // 18,
    address: string // '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    explorerLink?: string // Special override for native ETH explorer link
    logo: ImageSourcePropType
  }
  readonly networkLayer: NetworkLayer
  readonly pendingTransactionsRetryOptions: RetryOptions | undefined
  readonly spotPriceStablecoinAmount: CurrencyAmount<Token>
  readonly stablecoins: Token[]
  readonly statusPage?: string
  readonly supportsV4: boolean
  readonly urlParam: string
  readonly wrappedNativeCurrency: {
    name: string // 'Wrapped Ether',
    symbol: string // 'WETH',
    decimals: number // 18,
    address: string // '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
  }
}
