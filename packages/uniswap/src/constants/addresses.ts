import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type Address = string

const ZEPHYR_USDC_ADDRESS = process.env.REACT_APP_CUSTOM_NETWORK_USDC_ADDRESS || '0xDF4BDAC4Ba259127D1c53C07cdd005AD54CCAfb0'

export const NATIVE_TOKEN_PLACEHOLDER = 'NATIVE'

export const BRIDGED_BASE_ADDRESSES = [
  ZEPHYR_USDC_ADDRESS, // USDC on Zephyr
]

export function getNativeAddress(chainId: UniverseChainId): string {
  return getChainInfo(chainId).nativeCurrency.address
}

export function getWrappedNativeAddress(chainId: UniverseChainId): string {
  return getChainInfo(chainId).wrappedNativeCurrency.address
}

// Delegation address for smart contract delegation (used for WalletConnect)
// This is for Ethereum mainnet Uniswap governance - may not be relevant for custom networks
export const UNISWAP_DELEGATION_ADDRESS: Address = process.env.REACT_APP_CUSTOM_NETWORK_DELEGATION_ADDRESS || '0x227380efd3392EC33cf148Ade5e0a89D33121814'

// Custom contract addresses for Zephyr network
export const MULTICALL_ADDRESSES: { [chainId in UniverseChainId]?: string } = {
  [UniverseChainId.Zephyr]: process.env.REACT_APP_CUSTOM_NETWORK_MULTICALL_ADDRESS || '0xdb718F574AA8Dad534F0AfA12388a84Ec8DbC08B',
}

export const V3_CORE_FACTORY_ADDRESSES: { [chainId in UniverseChainId]?: string } = {
  [UniverseChainId.Zephyr]: process.env.REACT_APP_CUSTOM_NETWORK_V3_FACTORY_ADDRESS || '0xEB4F50E1879e9912Ff8FD73B20bCAd7F195c5EBD',
}

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES: { [chainId in UniverseChainId]?: string } = {
  [UniverseChainId.Zephyr]: process.env.REACT_APP_CUSTOM_NETWORK_POSITION_MANAGER_ADDRESS || '0x684fB3F611fd294f305b3F58ba3be72cFa65b0b2',
}

export const QUOTER_ADDRESSES: { [chainId in UniverseChainId]?: string } = {
  [UniverseChainId.Zephyr]: process.env.REACT_APP_CUSTOM_NETWORK_QUOTER_ADDRESS || '0x49FC0204705C6E1F1A9458b78C3c9DB2c5Fe2717',
}

export const SWAP_ROUTER_02_ADDRESSES: { [chainId in UniverseChainId]?: string } = {
  [UniverseChainId.Zephyr]: process.env.REACT_APP_CUSTOM_NETWORK_SWAP_ROUTER_ADDRESS || '0x881f1D82139635c9190976F390305764bdBdEF3D',
}

export const TICK_LENS_ADDRESSES: { [chainId in UniverseChainId]?: string } = {
  [UniverseChainId.Zephyr]: process.env.REACT_APP_CUSTOM_NETWORK_TICK_LENS_ADDRESS || '0x9FdcfF6c3c58eFD2a3EA23E01EE02c51d31f13Db',
}

export const V3_MIGRATOR_ADDRESSES: { [chainId in UniverseChainId]?: string } = {
  [UniverseChainId.Zephyr]: process.env.REACT_APP_CUSTOM_NETWORK_V3_MIGRATOR_ADDRESS || '0xdACEF64026d35EB778A2da9406aE9BE59737FEFb',
}
