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
  if (!zWalletClient.isConnected) {
    throw new Error('Z Wallet is not connected')
  }

  const approvalTx = {
    chainId,
    contractAddress: token.address,
    method: 'function approve(address spender, uint256 amount)',
    params: [spender, MaxUint256.toString()],
  }

  const response = await zWalletClient.callContract(approvalTx)

  if (!response || !response.data) {
    throw new Error((response && response.error) || 'Z Wallet approval failed')
  }

  const approvalResult = {
    hash: response.data.transactionHash,
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
        transactionHash: response.data?.transactionHash,
        blockNumber: 0,
        blockHash: '0x',
        confirmations: 1,
      }),
    to: token.address,
  } as any

  addTransaction(approvalResult, {
    type: TransactionType.APPROVAL,
    tokenAddress: token.address,
    spender,
    amount: MaxUint256.toString(),
  })
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
