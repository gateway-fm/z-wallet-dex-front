import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ETH_LOGO } from 'ui/src/assets'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

// Environment variables with fallbacks
const CUSTOM_NETWORK_CHAIN_ID = Number(process.env.REACT_APP_CUSTOM_NETWORK_CHAIN_ID) || 1417429182
const CUSTOM_NETWORK_RPC_URL = process.env.REACT_APP_CUSTOM_NETWORK_RPC_URL || 'https://zephyr-rpc.eu-north-2.gateway.fm'
const CUSTOM_NETWORK_EXPLORER_URL = process.env.REACT_APP_CUSTOM_NETWORK_EXPLORER_URL || 'https://zephyr-blockscout.eu-north-2.gateway.fm/' as const
const CUSTOM_NETWORK_BRIDGE_URL = process.env.REACT_APP_CUSTOM_NETWORK_BRIDGE_URL || 'https://zephyr-bridge.eu-north-2.gateway.fm'
const CUSTOM_NETWORK_FAUCET_URL = process.env.REACT_APP_CUSTOM_NETWORK_FAUCET_URL || 'https://zephyr-faucet.eu-north-2.gateway.fm'
const CUSTOM_NETWORK_WRAPPED_NATIVE_ADDRESS = process.env.REACT_APP_CUSTOM_NETWORK_WRAPPED_NATIVE_ADDRESS || '0x08a19Ce4b93E957aDD175F61e022b81894e66720'
const CUSTOM_NETWORK_USDC_ADDRESS = process.env.REACT_APP_CUSTOM_NETWORK_USDC_ADDRESS || '0xDF4BDAC4Ba259127D1c53C07cdd005AD54CCAfb0'

// USDC token for Zephyr network
export const USDC_ZEPHYR = new Token(
  UniverseChainId.Zephyr,
  CUSTOM_NETWORK_USDC_ADDRESS,
  6,
  'USDC',
  'USD Coin',
)

export const ZEPHYR_CHAIN_INFO = {
  name: 'Zephyr',
  id: UniverseChainId.Zephyr,
  nativeCurrency: {
    name: 'Zero',
    symbol: 'ZERO',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  rpcUrls: {
    [RPCType.Public]: { http: [CUSTOM_NETWORK_RPC_URL] },
    [RPCType.Default]: { http: [CUSTOM_NETWORK_RPC_URL] },
    [RPCType.Interface]: { http: [CUSTOM_NETWORK_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: 'Zephyr Blockscout',
      url: CUSTOM_NETWORK_EXPLORER_URL,
    },
  },
  contracts: {
    multicall3: {
      address: (process.env.REACT_APP_CUSTOM_NETWORK_MULTICALL_ADDRESS || '0xdb718F574AA8Dad534F0AfA12388a84Ec8DbC08B') as `0x${string}`,
      blockCreated: 1,
    },
  },
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: BackendChainId.Ethereum as GqlChainId,
    backendSupported: false,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: CUSTOM_NETWORK_BRIDGE_URL,
  docs: CUSTOM_NETWORK_FAUCET_URL,
  elementName: ElementName.ChainEthereum, // Fallback
  explorer: {
    name: 'Zephyr Blockscout',
    url: CUSTOM_NETWORK_EXPLORER_URL as `${string}/`,
  },
  interfaceName: 'zephyr',
  label: 'Zephyr',
  logo: ETH_LOGO,
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ZEPHYR, 10_000e6),
  stablecoins: [USDC_ZEPHYR],
  statusPage: undefined,
  supportsV4: false, // TODO: Set to true if you have V4 deployed
  urlParam: 'zephyr',
  wrappedNativeCurrency: {
    name: 'Wrapped Zero',
    symbol: 'WZERO',
    decimals: 18,
    address: CUSTOM_NETWORK_WRAPPED_NATIVE_ADDRESS as `0x${string}`,
  },
  testnet: false,
} as const satisfies UniverseChainInfo 