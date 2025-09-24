import { useWeb3React } from '@web3-react/core'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const MISSING_PROVIDER = Symbol()
const BlockNumberContext = createContext<
  | {
      fastForward(block: number): void
      block?: number
      mainnetBlock?: number
    }
  | typeof MISSING_PROVIDER
>(MISSING_PROVIDER)

function useBlockNumberContext() {
  const blockNumber = useContext(BlockNumberContext)
  if (blockNumber === MISSING_PROVIDER) {
    throw new Error('BlockNumber hooks must be wrapped in a <BlockNumberProvider>')
  }
  return blockNumber
}

export function useFastForwardBlockNumber(): (block: number) => void {
  return useBlockNumberContext().fastForward
}

/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useBlockNumberContext().block
}

export function useMainnetBlockNumber(): number | undefined {
  return useBlockNumberContext().mainnetBlock
}

export function BlockNumberProvider({ children }: { children: ReactNode }) {
  const { chainId: activeChainId, provider } = useWeb3React()
  const [{ chainId, block, mainnetBlock }, setChainBlock] = useState<{
    chainId?: number
    block?: number
    mainnetBlock?: number
  }>({})
  const activeBlock = chainId === activeChainId ? block : undefined

  const onChainBlock = useCallback((chainId: number, block: number) => {
    setChainBlock((chainBlock) => {
      if (chainBlock.chainId === chainId) {
        if (!chainBlock.block || chainBlock.block < block) {
          return { chainId, block, mainnetBlock: chainId === ZEPHYR_CHAIN_ID ? block : chainBlock.mainnetBlock }
        }
      } else if (chainId === ZEPHYR_CHAIN_ID) {
        if (!chainBlock.mainnetBlock || chainBlock.mainnetBlock < block) {
          return { ...chainBlock, mainnetBlock: block }
        }
      }
      return chainBlock
    })
  }, [])

  const windowVisible = useIsWindowVisible()
  useEffect(() => {
    let stale = false

    // For Zephyr network, reduce polling frequency to minimize RPC calls
    // Only poll when window is visible and not too frequently
    if (provider && activeChainId && windowVisible) {
      setChainBlock((chainBlock) => {
        // If chainId hasn't changed, don't clear the block. This prevents re-fetching still valid data.
        if (chainBlock.chainId !== activeChainId) {
          return { chainId: activeChainId, mainnetBlock: chainBlock.mainnetBlock }
        }
        return chainBlock
      })

      // For Zephyr network, use less frequent polling to reduce RPC load
      const isZephyr = activeChainId === ZEPHYR_CHAIN_ID
      
      const fetchBlockNumber = () => {
        if (!stale) {
          provider
            .getBlockNumber()
            .then((block) => {
              if (!stale) onChainBlock(activeChainId, block)
            })
            .catch((error) => {
              console.debug(`Failed to get block number for chainId ${activeChainId}`, error)
            })
        }
      }

      // Initial fetch
      fetchBlockNumber()

      if (isZephyr) {
        // For Zephyr: Use interval-based polling instead of event listeners to reduce RPC calls
        const pollInterval = setInterval(fetchBlockNumber, 30000) // Poll every 30 seconds instead of every block
        
        return () => {
          stale = true
          clearInterval(pollInterval)
        }
      } else {
        // For other networks: Use standard block event listeners
        const onBlock = (block: number) => onChainBlock(activeChainId, block)
        provider.on('block', onBlock)
        return () => {
          stale = true
          provider.removeListener('block', onBlock)
        }
      }
    }

    return void 0
  }, [activeChainId, provider, windowVisible, onChainBlock])

  useEffect(() => {
    if (mainnetBlock === undefined) {
      const zephyrProvider = chainId === ZEPHYR_CHAIN_ID && provider ? provider : RPC_PROVIDERS[ZEPHYR_CHAIN_ID]
      zephyrProvider
        .getBlockNumber()
        .then((block) => {
          onChainBlock(ZEPHYR_CHAIN_ID, block)
        })
        // swallow errors - it's ok if this fails, as we'll try again if we activate mainnet
        .catch(() => undefined)
    }
  }, [mainnetBlock, onChainBlock, provider, chainId])

  const value = useMemo(
    () => ({
      fastForward: (update: number) => {
        if (activeBlock && update > activeBlock) {
          setChainBlock({
            chainId: activeChainId,
            block: update,
            mainnetBlock: activeChainId === ZEPHYR_CHAIN_ID ? update : mainnetBlock,
          })
        }
      },
      block: activeBlock,
      mainnetBlock,
    }),
    [activeBlock, activeChainId, mainnetBlock]
  )
  return <BlockNumberContext.Provider value={value}>{children}</BlockNumberContext.Provider>
}
