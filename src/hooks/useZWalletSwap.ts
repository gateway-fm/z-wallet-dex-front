import { Interface } from '@ethersproject/abi'
import { useCallback } from 'react'
import { finalizeTransaction } from 'state/transactions/reducer'
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

export async function swapWithZWallet(
  chainId: number,
  account: string,
  transaction: SwapTransaction,
  addTransaction?: any,
  swapInfo?: any,
  dispatch?: any
): Promise<any> {
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

  console.log('[Z Wallet DEBUG] Calling Z Wallet contract', contractCall)
  const response = await zWalletClient.callContract(contractCall)
  console.log('[Z Wallet DEBUG] Z Wallet response:', response)

  if (!response || !response.data) {
    const errorMsg = (response && response.error) || 'Z Wallet swap failed'
    throw new Error(errorMsg)
  }

  // For Z-Wallet, if we got a transaction hash, the transaction is already successful
  console.log('[Z Wallet DEBUG] Transaction successful, hash:', response.data.transactionHash)

  const transactionResponse = {
    hash: response.data.transactionHash,
    confirmations: 0, // Start with 0, will be updated when added to store
    from: account,
    nonce: 0,
    gasLimit: BigInt(transaction.gasLimit || 0),
    gasPrice: BigInt(0),
    data: transaction.data || '0x',
    value: BigInt(transaction.value || 0),
    chainId,
    to: transaction.to,
    wait: async (confirmations = 1) => {
      console.log(`[Z Wallet DEBUG] Transaction already confirmed, returning receipt`)
      // Return immediately since Z-Wallet transactions are already confirmed
      const receipt = {
        transactionHash: response.data?.transactionHash,
        blockNumber: Math.floor(Math.random() * 1000000), // Mock block number
        blockHash: '0x' + Math.random().toString(16).slice(2, 66), // Mock block hash
        confirmations,
        gasUsed: BigInt(300000), // Mock gas used
        effectiveGasPrice: BigInt(1000000000), // Mock gas price
        status: 1, // Success
        transactionIndex: 1,
        to: transaction.to,
        from: account,
        contractAddress: null,
      }
      return receipt
    },
  } as any

  // Add transaction to store if addTransaction is provided
  if (addTransaction && swapInfo) {
    console.log('[Z Wallet DEBUG] Adding transaction to store:', transactionResponse.hash)
    addTransaction(transactionResponse, swapInfo)

    // For Z-Wallet, immediately finalize the transaction since it's already successful
    if (dispatch) {
      console.log('[Z Wallet DEBUG] Auto-finalizing Z-Wallet transaction')
      const receipt = {
        transactionHash: response.data.transactionHash,
        blockNumber: Math.floor(Math.random() * 1000000),
        blockHash: '0x' + Math.random().toString(16).slice(2, 66),
        gasUsed: BigInt(300000),
        effectiveGasPrice: BigInt(1000000000),
        status: 1,
        transactionIndex: 1,
        to: transaction.to,
        from: account,
        contractAddress: null,
      }

      // Finalize immediately since Z-Wallet transactions are instant
      dispatch(
        finalizeTransaction({
          chainId,
          hash: response.data.transactionHash,
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: response.data.transactionHash,
            to: transaction.to,
            from: account,
            contractAddress: null,
            blockHash: receipt.blockHash,
            blockNumber: receipt.blockNumber,
          },
        })
      )

      console.log('[Z Wallet DEBUG] Transaction finalized in store')
    }
  }

  return transactionResponse
}

// eslint-disable-next-line import/no-unused-modules
export function useZWalletSwap() {
  return useCallback(async (chainId: number, account: string, transaction: SwapTransaction): Promise<any> => {
    return await swapWithZWallet(chainId, account, transaction)
  }, [])
}
