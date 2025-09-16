import { MaxUint256, Token } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { zWalletClient } from 'z-wallet-sdk'

export async function approveWithZWallet(
  token: Token,
  spender: string,
  chainId: number,
  account: string,
  addTransaction: ReturnType<typeof useTransactionAdder>
): Promise<void> {
  console.log('approveWithZWallet called:', {
    tokenSymbol: token.symbol,
    tokenAddress: token.address,
    spender,
    chainId,
    account,
    isConnected: zWalletClient.isConnected,
  })

  if (!zWalletClient.isConnected) {
    console.error('Z Wallet is not connected - cannot proceed with approval')
    throw new Error('Z Wallet is not connected')
  }

  const approvalTx = {
    chainId,
    contractAddress: token.address,
    method: 'function approve(address spender, uint256 amount)',
    params: [spender, MaxUint256.toString()],
  }

  console.log('Sending approval transaction to Z-Wallet:', approvalTx)

  let response: any
  try {
    response = await zWalletClient.callContract(approvalTx)
    console.log('Z-Wallet approval response received:', {
      response,
      hasData: !!response?.data,
      hasError: !!response?.error,
      data: response?.data,
      error: response?.error,
    })
  } catch (error) {
    console.error('Z-Wallet approval call failed with exception:', error)
    throw error
  }

  if (!response || !response.data) {
    const errorMessage = (response && response.error) || 'Z Wallet approval failed'
    console.error('Z-Wallet approval failed - no valid response:', {
      response,
      errorMessage,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
    })
    throw new Error(errorMessage)
  }

  console.log('Z-Wallet approval successful, creating transaction result:', {
    transactionHash: response.data?.transactionHash,
    tokenSymbol: token.symbol,
    tokenAddress: token.address,
    spender,
  })

  const approvalResult = {
    hash: response.data?.transactionHash || '',
    confirmations: 0,
    from: account,
    nonce: 0,
    gasLimit: BigInt(0),
    gasPrice: BigInt(0),
    data: '0x',
    value: BigInt(0),
    chainId,
    wait: () =>
      Promise.resolve({
        transactionHash: response.data?.transactionHash || '',
        blockNumber: 1,
        blockHash: '0x0',
        confirmations: 1,
      }),
    to: token.address,
  } as any

  console.log('Adding approval transaction to store:', {
    hash: approvalResult.hash,
    type: TransactionType.APPROVAL,
    tokenAddress: token.address,
    spender,
    amount: MaxUint256.toString(),
  })

  addTransaction(approvalResult, {
    type: TransactionType.APPROVAL,
    tokenAddress: token.address,
    spender,
    amount: MaxUint256.toString(),
  })

  console.log('approveWithZWallet completed successfully')
}

// eslint-disable-next-line import/no-unused-modules
export function useZWalletApproval() {
  const addTransaction = useTransactionAdder()
  return useCallback(
    async (token: Token, spender: string, chainId: number, account: string): Promise<void> => {
      await approveWithZWallet(token, spender, chainId, account, addTransaction)
    },
    [addTransaction]
  )
}
