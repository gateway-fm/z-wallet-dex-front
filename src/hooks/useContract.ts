import { Contract } from '@ethersproject/contracts'
import {
  ARGENT_WALLET_DETECTOR_ADDRESS,
  ChainId,
  ENS_REGISTRAR_ADDRESSES,
  MULTICALL_ADDRESSES,
  V2_ROUTER_ADDRESS,
  V3_MIGRATOR_ADDRESSES,
} from '@uniswap/sdk-core'
import IUniswapV2PairJson from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import IUniswapV2Router02Json from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import UniswapInterfaceMulticallJson from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import NonfungiblePositionManagerJson from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'
import V3MigratorJson from '@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json'
import { useWeb3React } from '@web3-react/core'
import ARGENT_WALLET_DETECTOR_ABI from 'abis/argent-wallet-detector.json'
import EIP_2612 from 'abis/eip_2612.json'
import ENS_PUBLIC_RESOLVER_ABI from 'abis/ens-public-resolver.json'
import ENS_ABI from 'abis/ens-registrar.json'
import ERC20_ABI from 'abis/erc20.json'
import ERC20_BYTES32_ABI from 'abis/erc20_bytes32.json'
import ERC721_ABI from 'abis/erc721.json'
import ERC1155_ABI from 'abis/erc1155.json'
import EXCHANGER_ABI from 'abis/Exchanger.json'
import LIQUIDITY_MANAGER_ABI from 'abis/LiquidityManager.json'
import PAIR_FACTORY_ABI from 'abis/PairFactory.json'
import { ArgentWalletDetector, EnsPublicResolver, EnsRegistrar, Erc20, Erc721, Erc1155, Weth } from 'abis/types'
import WETH_ABI from 'abis/weth.json'
import { CONTRACTS_CONFIG, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from 'constants/addresses'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useMemo } from 'react'
import { NonfungiblePositionManager, UniswapInterfaceMulticall } from 'types/v3'
import { V3Migrator } from 'types/v3/V3Migrator'
import { getContract } from 'utils'

const { abi: IUniswapV2PairABI } = IUniswapV2PairJson
const { abi: IUniswapV2Router02ABI } = IUniswapV2Router02Json
const { abi: MulticallABI } = UniswapInterfaceMulticallJson
const { abi: NFTPositionManagerABI } = NonfungiblePositionManagerJson
const { abi: V2MigratorABI } = V3MigratorJson

// returns null on errors
export function useContract<T extends Contract = Contract>(
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: any,
  withSignerIfPossible = true
): T | null {
  const { provider, account, chainId } = useWeb3React()

  return useMemo(() => {
    if (!addressOrAddressMap || !ABI || !provider || !chainId) return null
    let address: string | undefined
    if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
    else address = addressOrAddressMap[chainId]
    if (!address) return null
    try {
      return getContract(address, ABI, provider, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [addressOrAddressMap, ABI, provider, chainId, withSignerIfPossible, account]) as T
}

function useMainnetContract<T extends Contract = Contract>(address: string | undefined, ABI: any): T | null {
  const { chainId } = useWeb3React()
  const isMainnet = chainId === ChainId.MAINNET
  const contract = useContract(isMainnet ? address : undefined, ABI, false)

  return useMemo(() => {
    if (isMainnet) return contract
    if (!address) return null

    // For Zephyr network, skip mainnet contract calls entirely
    if (chainId === ZEPHYR_CHAIN_ID) {
      return null
    }

    // Use actual mainnet provider for other non-mainnet chains
    try {
      return getContract(address, ABI, RPC_PROVIDERS[ChainId.MAINNET])
    } catch (error) {
      console.error('Failed to get mainnet contract', error)
      return null
    }
  }, [isMainnet, contract, address, ABI, chainId]) as T
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean) {
  return useContract<Erc20>(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETHContract(withSignerIfPossible?: boolean) {
  const { chainId } = useWeb3React()
  return useContract<Weth>(
    chainId ? WRAPPED_NATIVE_CURRENCY[chainId]?.address : undefined,
    WETH_ABI,
    withSignerIfPossible
  )
}

export function useERC721Contract(nftAddress?: string) {
  return useContract<Erc721>(nftAddress, ERC721_ABI, false)
}

export function useERC1155Contract(nftAddress?: string) {
  return useContract<Erc1155>(nftAddress, ERC1155_ABI, false)
}

export function useArgentWalletDetectorContract() {
  return useContract<ArgentWalletDetector>(ARGENT_WALLET_DETECTOR_ADDRESS, ARGENT_WALLET_DETECTOR_ABI, false)
}

export function useENSRegistrarContract() {
  return useMainnetContract<EnsRegistrar>(ENS_REGISTRAR_ADDRESSES[ChainId.MAINNET], ENS_ABI)
}

export function useENSResolverContract(address: string | undefined) {
  return useMainnetContract<EnsPublicResolver>(address, ENS_PUBLIC_RESOLVER_ABI)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function useEIP2612Contract(tokenAddress?: string): Contract | null {
  return useContract(tokenAddress, EIP_2612, false)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useV2RouterContract(): Contract | null {
  return useContract(V2_ROUTER_ADDRESS, IUniswapV2Router02ABI, true)
}

export function useInterfaceMulticall() {
  const { chainId } = useWeb3React()

  // Disable multicall for Zephyr network by passing null addresses
  const addresses = chainId === ZEPHYR_CHAIN_ID ? undefined : MULTICALL_ADDRESSES

  return useContract<UniswapInterfaceMulticall>(addresses, MulticallABI, false) as UniswapInterfaceMulticall
}

export function useMainnetInterfaceMulticall() {
  return useMainnetContract<UniswapInterfaceMulticall>(MULTICALL_ADDRESSES[ChainId.MAINNET], MulticallABI)
}

export function useV3NFTPositionManagerContract(withSignerIfPossible?: boolean): NonfungiblePositionManager | null {
  const { chainId } = useWeb3React()
  const address = chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined

  return useContract<NonfungiblePositionManager>(address, NFTPositionManagerABI, withSignerIfPossible)
}

// eslint-disable-next-line import/no-unused-modules
export function useV2MigratorContract() {
  return useContract<V3Migrator>(V3_MIGRATOR_ADDRESSES, V2MigratorABI, true)
}

// eslint-disable-next-line import/no-unused-modules
export function useV3Migrator(): V3Migrator | null {
  const { chainId } = useWeb3React()
  return useContract<V3Migrator>(chainId ? V3_MIGRATOR_ADDRESSES[chainId] : undefined, V2MigratorABI, true)
}

// eslint-disable-next-line import/no-unused-modules
export function useLiquidityManagerContract(withSignerIfPossible = true): Contract | null {
  const { chainId } = useWeb3React()
  const address = chainId === ZEPHYR_CHAIN_ID ? CONTRACTS_CONFIG.LIQUIDITY_MANAGER : undefined
  return useContract(address, LIQUIDITY_MANAGER_ABI, withSignerIfPossible)
}

// eslint-disable-next-line import/no-unused-modules
export function useExchangerContract(withSignerIfPossible = true): Contract | null {
  const { chainId } = useWeb3React()
  const address = chainId === ZEPHYR_CHAIN_ID ? CONTRACTS_CONFIG.EXCHANGER : undefined
  return useContract(address, EXCHANGER_ABI, withSignerIfPossible)
}

// eslint-disable-next-line import/no-unused-modules
export function usePairFactoryContract(withSignerIfPossible = false): Contract | null {
  const { chainId } = useWeb3React()
  const address = chainId === ZEPHYR_CHAIN_ID ? CONTRACTS_CONFIG.PAIR_FACTORY : undefined
  return useContract(address, PAIR_FACTORY_ABI, withSignerIfPossible)
}
