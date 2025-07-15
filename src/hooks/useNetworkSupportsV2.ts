import { useWeb3React } from '@web3-react/core'

export function useNetworkSupportsV2() {
  const { chainId } = useWeb3React()
  return false // Zephyr only supports V3, not V2
}
