import { useCallback } from 'react'

interface SwapTransaction {
  to: string
  data: string
  value: string
  gasLimit: number
}

export async function swapWithZWallet(chainId: number, account: string, transaction: SwapTransaction): Promise<any> {
  return null // TODO: implement me

  // if (!response || !response.data) {
  // throw new Error((response && response.error) || 'Z Wallet swap failed')
  // }
  // 
  // return {
  // hash: response.data.transactionHash,
  // confirmations: 0,
  // from: account,
  // nonce: 0,
  // gasLimit: BigInt(transaction.gasLimit || 0),
  // gasPrice: BigInt(0),
  // data: transaction.data || '0x',
  // value: BigInt(transaction.value || 0),
  // chainId,
  // wait: () =>
  //     Promise.resolve({
  //       transactionHash: response.data?.transactionHash,
  //       blockNumber: 0,
  //       blockHash: '0x',
  //       confirmations: 1,
  //     }),
  // to: transaction.to,
  // } as any 
}

// eslint-disable-next-line import/no-unused-modules
export function useZWalletSwap() {
  return useCallback(async (chainId: number, account: string, transaction: SwapTransaction): Promise<any> => {
    return await swapWithZWallet(chainId, account, transaction)
  }, [])
}
