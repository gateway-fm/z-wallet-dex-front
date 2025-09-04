import { Interface } from '@ethersproject/abi'
import { useCallback } from 'react'
import { addTransaction } from 'state/transactions/reducer'
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

    const processedParams = decoded.args.map((arg, index) => {
      const inputType = decoded.functionFragment.inputs[index]
      if (inputType.type === 'tuple') {
        return Array.from({ length: inputType.components.length }, (_, i) => convertValue(arg[i]))
      }
      return convertValue(arg)
    })

    console.debug('Calling contract')
    console.debug('  Method signature:', methodSignature)
    console.debug('  Processed params:', processedParams)

    return {
      method: methodSignature,
      params: processedParams,
    }
  } catch (error) {
    throw new Error(`Failed to decode swap calldata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function swapWithZWallet(
  chainId: number,
  account: string,
  transaction: SwapTransaction,
  addTransactionHook?: any,
  swapInfo?: any,
  dispatch?: any
): Promise<any> {
  if (!zWalletClient.isConnected) {
    throw new Error('Z Wallet is not connected')
  }

  const { method, params } = decodeCalldata(transaction.data)

  const contractCall = {
    chainId,
    contractAddress: transaction.to,
    method,
    params,
  }

  console.debug('Z-Wallet contract call:', contractCall)
  const response = await zWalletClient.callContract(contractCall)
  console.debug('Z-Wallet response:', response)

  if (!response || !response.data) {
    const errorMsg = (response && response.error) || 'Z Wallet swap failed'
    throw new Error(errorMsg)
  }

  // NOTE: workaround for Z-Wallet, if we got a transaction hash
  // the transaction is already successful...

  const transactionResponse = {
    hash: response.data?.transactionHash || '',
    confirmations: 0, // Start with 0, will be updated when added to store
    from: account,
    nonce: 0,
    gasLimit: BigInt(transaction.gasLimit || 0),
    gasPrice: BigInt(0),
    data: transaction.data || '0x',
    value: BigInt(transaction.value || 0),
    chainId,
    to: transaction.to,
    wait: async (confirmations = 1) => ({
      transactionHash: response.data?.transactionHash || '',
      blockNumber: 1,
      blockHash: '0x0',
      confirmations,
      gasUsed: BigInt(0),
      effectiveGasPrice: BigInt(0),
      status: 1,
      transactionIndex: 0,
      to: transaction.to,
      from: account,
      contractAddress: null,
    }),
  } as any

  // Add transaction to store with receipt so it appears as confirmed
  if (dispatch && swapInfo) {
    const receipt = {
      status: 1,
      transactionIndex: 0,
      transactionHash: response.data?.transactionHash || '',
      to: transaction.to,
      from: account,
      contractAddress: transaction.to,
      blockHash: '0x0',
      blockNumber: 1,
    }

    dispatch(
      addTransaction({
        chainId,
        hash: response.data?.transactionHash || '',
        from: account,
        info: swapInfo,
        receipt,
      })
    )
  }

  return transactionResponse
}

// eslint-disable-next-line import/no-unused-modules
export function useZWalletSwap() {
  return useCallback(async (chainId: number, account: string, transaction: SwapTransaction): Promise<any> => {
    return await swapWithZWallet(chainId, account, transaction)
  }, [])
}
