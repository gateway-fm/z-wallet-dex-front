import { zWalletClient } from 'z-wallet-sdk'

interface SwapTransaction {
  to: string
  data: string
  value: string
  gasLimit: number
}

export async function swapWithZWallet(chainId: number, account: string, transaction: SwapTransaction): Promise<any> {
  if (!zWalletClient.isConnected) {
    throw new Error('Z Wallet is not connected')
  }

  const zWalletTx = {
    chainId,
    contractAddress: transaction.to,
    method: 'fallback',
    params: [],
    value: transaction.value || '0',
    data: transaction.data,
  }

  const response = await zWalletClient.callContract(zWalletTx)

  if (!response || !response.data) {
    throw new Error((response && response.error) || 'Z Wallet swap failed')
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
        transactionHash: response.data!.transactionHash,
        blockNumber: 0,
        blockHash: '0x',
        confirmations: 1,
      }),
    to: transaction.to,
  } as any
}
