import { Interface } from '@ethersproject/abi'
import { useCallback } from 'react'
import { zWalletClient } from 'z-wallet-sdk'

import SwapRouterABI from '../lib/routing/abis/SwapRouter.json'

interface SwapTransaction {
  to: string
  data: string
  value: string
  gasLimit: number
}

const router = new Interface(SwapRouterABI)

const convertValue = (value: any) => {
  if (value && typeof value === 'object' && (value as any)._isBigNumber) {
    return (value as any).toString()
  }
  return value
}

function decodeCalldata(calldata: string): {
  method: string
  params: unknown[]
} {
  try {
    const decoded = router.parseTransaction({ data: calldata })
    if (!decoded) {
      throw new Error('Failed to decode transaction data')
    }

    // NOTE: Use tuple format with double parentheses for wagmi/viem compatibility
    const formatInput = (input: any): string => {
      if (input.type === 'tuple' && input.components) {
        const componentTypes = input.components.map((comp: any) => formatInput(comp)).join(',')
        return `(${componentTypes})`
      }
      return input.type
    }

    // NOTE: Z Wallet SDK REQUIRES method signature to start with "function "
    const inputs = decoded.functionFragment.inputs.map(formatInput).join(',')
    const methodSignature = `function ${decoded.name}(${inputs})`

    console.log('[Z Wallet DEBUG] Method signature:', methodSignature)

    console.log('[Z Wallet DEBUG] Raw decoded args:', decoded.args)
    console.log('[Z Wallet DEBUG] Function inputs:', decoded.functionFragment.inputs)

    const processedParams = decoded.args.map((arg, index) => {
      const inputType = decoded.functionFragment.inputs[index]
      if (inputType.type === 'tuple') {
        const tupleComponents = Array.from({ length: inputType.components.length }, (_, i) => convertValue(arg[i]))
        return tupleComponents
      }
      return convertValue(arg)
    })

    console.log('[Z Wallet DEBUG] Processed params:', processedParams)

    return {
      method: methodSignature,
      params: processedParams,
    }
  } catch (error) {
    throw new Error(`Failed to decode swap calldata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function swapWithZWallet(chainId: number, account: string, transaction: SwapTransaction): Promise<any> {
  console.log('[Z Wallet DEBUG] Starting swap:', {
    chainId,
    account,
    transaction,
  })

  if (!zWalletClient.isConnected) {
    throw new Error('Z Wallet is not connected')
  }

  console.log('[Z Wallet DEBUG] Z Wallet is connected, wallet info:', zWalletClient.walletInfo)

  const { method, params } = decodeCalldata(transaction.data)

  const contractCall = {
    chainId,
    contractAddress: transaction.to,
    method,
    params,
  }

  console.log('[Z Wallet DEBUG] Calling Z Wallet contract:', contractCall)
  console.log('[Z Wallet DEBUG] Contract call details:', {
    chainId: contractCall.chainId,
    contractAddress: contractCall.contractAddress,
    method: contractCall.method,
    params: contractCall.params,
  })

  const response = await zWalletClient.callContract(contractCall)
  console.log('[Z Wallet DEBUG] Z Wallet response:', response)

  if (!response || !response.data) {
    const errorMsg = (response && response.error) || 'Z Wallet swap failed'
    throw new Error(errorMsg)
  }

  return {
    hash: response.data.transactionHash,
    confirmations: 0,
    from: account,
    nonce: 0,
    gasLimit: BigInt(transaction.gasLimit || 0),
    gasPrice: BigInt(0),
    data: transaction.data || '0x',
    value: BigInt(transaction.value || 0),
    chainId,
    wait: () =>
      Promise.resolve({
        transactionHash: response.data?.transactionHash,
        blockNumber: 0,
        blockHash: '0x',
        confirmations: 1,
      }),
    to: transaction.to,
  } as any // TODO: fix this
}

// eslint-disable-next-line import/no-unused-modules
export function useZWalletSwap() {
  return useCallback(async (chainId: number, account: string, transaction: SwapTransaction): Promise<any> => {
    return await swapWithZWallet(chainId, account, transaction)
  }, [])
}
