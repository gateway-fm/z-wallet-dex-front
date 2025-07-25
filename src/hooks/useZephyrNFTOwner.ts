import { BigNumber } from '@ethersproject/bignumber'
import { useWeb3React } from '@web3-react/core'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useEffect, useState } from 'react'

/**
 * Custom hook for getting NFT owner on Zephyr network using direct RPC calls
 * @param tokenId - The token ID to get the owner for
 * @returns The owner address or undefined
 */
export function useZephyrNFTOwner(tokenId: BigNumber | undefined): string | undefined {
  const { provider } = useWeb3React()
  const positionManager = useV3NFTPositionManagerContract()
  const [owner, setOwner] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!tokenId || !positionManager || !provider) {
      setOwner(undefined)
      return
    }

    let isCancelled = false
    const getOwner = async () => {
      try {
        const ownerAddress = await positionManager.ownerOf(tokenId)
        if (!isCancelled) {
          setOwner(ownerAddress)
        }
      } catch (error) {
        console.warn('Failed to fetch NFT owner for Zephyr:', error)
        if (!isCancelled) {
          setOwner(undefined)
        }
      }
    }

    getOwner()

    return () => {
      isCancelled = true
    }
  }, [tokenId, positionManager, provider])

  return owner
}
