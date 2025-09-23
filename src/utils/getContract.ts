import { Signer } from '@ethersproject/abstract-signer'
import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider, Provider, Web3Provider } from '@ethersproject/providers'

import { isAddress } from './addresses'

export function getContract(address: string, ABI: any, provider: Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  const ethersProvider = normalizeToEthersProvider(provider)
  return new Contract(address, ABI, getProviderOrSigner(ethersProvider, account) as any)
}

function normalizeToEthersProvider(provider: Provider): JsonRpcProvider | Web3Provider {
  // If it already looks like an ethers provider (has getSigner), return as is
  if (typeof (provider as any)?.getSigner === 'function') {
    return provider as JsonRpcProvider
  }
  // If it looks like EIP-1193 (has request), wrap into Web3Provider
  if (typeof (provider as any)?.request === 'function') {
    return new Web3Provider(provider as any)
  }
  // Fallback – assume it's compatible enough
  return provider as JsonRpcProvider
}

// account is optional
function getProviderOrSigner(provider: JsonRpcProvider | Web3Provider, account?: string): Provider | Signer {
  return account ? provider.getSigner(account).connectUnchecked() : provider
}
