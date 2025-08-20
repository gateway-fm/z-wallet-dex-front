import { MaxUint256, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { zWalletClient } from 'z-wallet-sdk'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenContract } from './useContract'
import { useTokenAllowance } from './useTokenAllowance'

export function useZephyrTokenApproval(
  token?: Token,
  spender?: string,
  amountToApprove?: string
): {
  approvalState: ApprovalState
  approve: () => Promise<void>
} {
  const { chainId, account, connector } = useWeb3React()
  const tokenContract = useTokenContract(token?.address, true)
  const addTransaction = useTransactionAdder()

  const { tokenAllowance } = useTokenAllowance(token, account ?? undefined, spender)

  const approvalState = useMemo((): ApprovalState => {
    if (!amountToApprove || !spender || !token || chainId !== ZEPHYR_CHAIN_ID) {
      return ApprovalState.UNKNOWN
    }
    if (!tokenAllowance) {
      return ApprovalState.UNKNOWN
    }

    const amountToApproveBN = BigInt(amountToApprove)
    const currentAllowanceBN = BigInt(tokenAllowance.quotient.toString())

    if (currentAllowanceBN >= amountToApproveBN) {
      return ApprovalState.APPROVED
    }

    return ApprovalState.NOT_APPROVED
  }, [amountToApprove, spender, token, chainId, tokenAllowance])

  const approve = useCallback(async (): Promise<void> => {
    if (!spender || !token || chainId !== ZEPHYR_CHAIN_ID) {
      console.error('Missing dependencies for approve')
      return
    }
    const connection = getConnection(connector)
    let approvalResult

    if (connection.type === ConnectionType.Z_WALLET) {
      const approvalTx = {
        chainId,
        contractAddress: token.address,
        method: 'approve',
        params: [spender, MaxUint256.toString()],
      }

      const response = await zWalletClient.callContract(approvalTx)
      console.log('🔍 Z Wallet approval response:', response)
      if (!response || !response.data) {
        throw new Error((response && response.error) || 'Z Wallet approval failed')
      }

      approvalResult = {
        hash: response.data.transactionHash,
        confirmations: 0,
        from: account || '',
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
    } else {
      if (!tokenContract) {
        console.error('Missing token contract for standard approval')
        return
      }
      approvalResult = await tokenContract.approve(spender, MaxUint256.toString())
    }

    addTransaction(approvalResult, {
      type: TransactionType.APPROVAL,
      tokenAddress: token.address,
      spender,
      amount: MaxUint256.toString(),
    })
  }, [tokenContract, spender, token, chainId, addTransaction, connector, account])

  return {
    approvalState,
    approve,
  }
}
