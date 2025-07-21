import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import type { JsonRpcSigner } from '@ethersproject/providers'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'

/**
 * Signs TypedData with EIP-712, if available, or else by falling back to eth_sign.
 * Calls eth_signTypedData_v4, or eth_signTypedData for wallets with incomplete EIP-712 support.
 *
 * @see https://github.com/ethers-io/ethers.js/blob/c80fcddf50a9023486e9f9acb1848aba4c19f7b6/packages/providers/src.ts/json-rpc-provider.ts#L334
 */
export async function signTypedData(
  signer: JsonRpcSigner,
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  // Use Record<string, any> for the value to match the JsonRpcSigner._signTypedData signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>
) {
  // Get chain ID to check if it's Zephyr network
  const chainId = await signer.getChainId()

  // Populate any ENS names (in-place) - skip ENS resolution for Zephyr network
  const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
    // Skip ENS resolution for Zephyr network since it doesn't support ENS
    if (chainId === ZEPHYR_CHAIN_ID) {
      return Promise.resolve(name) // Return the name as-is without resolution
    }
    return signer.provider.resolveName(name) as Promise<string>
  })

  const address = (await signer.getAddress()).toLowerCase()
  const message = JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value))

  try {
    return await signer.provider.send('eth_signTypedData_v4', [address, message])
  } catch (error) {
    // If eth_signTypedData is unimplemented, fall back to eth_sign.
    if (
      typeof error.message === 'string' &&
      (error.message.match(/not (found|implemented)/i) ||
        error.message.match(/TrustWalletConnect.WCError error 1/) ||
        error.message.match(/Missing or invalid/))
    ) {
      console.warn('signTypedData: wallet does not implement EIP-712, falling back to eth_sign', error.message)
      const hash = _TypedDataEncoder.hash(populated.domain, types, populated.value)
      return await signer.provider.send('eth_sign', [address, hash])
    }
    throw error
  }
}
