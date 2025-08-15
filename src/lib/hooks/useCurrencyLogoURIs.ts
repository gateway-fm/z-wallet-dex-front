import { ChainId } from '@uniswap/sdk-core'
import useHttpLocations from 'hooks/useHttpLocations'
import { useMemo } from 'react'
import { isAddress } from 'utils'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import AvaxLogo from '../../assets/svg/avax_logo.svg'
import BnbLogo from '../../assets/svg/bnb-logo.svg'
import CeloLogo from '../../assets/svg/celo_logo.svg'
import MaticLogo from '../../assets/svg/matic-token-icon.svg'
import { ZEPHYR_CHAIN_ID } from '../../constants/chains'
import { isCelo, NATIVE_CHAIN_ID, nativeOnChain } from '../../constants/tokens'

type Network = 'ethereum' | 'arbitrum' | 'optimism' | 'polygon' | 'smartchain' | 'celo' | 'avalanchec'

// eslint-disable-next-line import/no-unused-modules
export function chainIdToNetworkName(networkId: ChainId): Network {
  switch (networkId) {
    case ChainId.MAINNET:
      return 'ethereum'
    case ChainId.ARBITRUM_ONE:
      return 'arbitrum'
    case ChainId.OPTIMISM:
      return 'optimism'
    case ChainId.POLYGON:
      return 'polygon'
    case ChainId.BNB:
      return 'smartchain'
    case ChainId.CELO:
      return 'celo'
    case ChainId.AVALANCHE:
      return 'avalanchec'
    default:
      return 'ethereum'
  }
}

export function getNativeLogoURI(chainId: ChainId = ChainId.MAINNET): string {
  switch (chainId) {
    case ChainId.POLYGON:
    case ChainId.POLYGON_MUMBAI:
      return MaticLogo
    case ChainId.BNB:
      return BnbLogo
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
      return CeloLogo
    case ChainId.AVALANCHE:
      return AvaxLogo
    default:
      return EthereumLogo
  }
}

function getTokenLogoURI(address: string, chainId: ChainId = ChainId.MAINNET): string | void {
  // Skip logo requests for Zephyr network
  if (Number(chainId) === ZEPHYR_CHAIN_ID) {
    return undefined
  }

  if (isCelo(chainId) && address === nativeOnChain(chainId).wrapped.address) {
    return CeloLogo
  }

  return undefined
}

export default function useCurrencyLogoURIs(
  currency:
    | {
        isNative?: boolean
        isToken?: boolean
        address?: string
        chainId: number
        logoURI?: string | null
      }
    | null
    | undefined
): string[] {
  const locations = useHttpLocations(currency?.logoURI)
  return useMemo(() => {
    const logoURIs = [...locations]
    if (currency) {
      if (currency.isNative || currency.address === NATIVE_CHAIN_ID) {
        logoURIs.push(getNativeLogoURI(currency.chainId))
      } else if (currency.isToken || currency.address) {
        const checksummedAddress = isAddress(currency.address)
        const logoURI = checksummedAddress && getTokenLogoURI(checksummedAddress, currency.chainId)
        if (logoURI) {
          logoURIs.push(logoURI)
        }
      }
    }
    return logoURIs
  }, [currency, locations])
}
