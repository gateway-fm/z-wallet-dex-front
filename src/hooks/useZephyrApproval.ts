import { MaxUint256, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenContract } from './useContract'
import { useTokenAllowance } from './useTokenAllowance'

export function useZephyrTokenApproval(
  token?: Token,
  spender?: string,
  amountToApprove?: string
): {
  approvalState: ApprovalState
  approve: () => Promise<any>
} {
  const { chainId, account } = useWeb3React()
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

  const approve = useCallback(async (): Promise<any> => {
    if (!tokenContract || !spender || !token || chainId !== ZEPHYR_CHAIN_ID) {
      console.error('Missing dependencies for approve')
      throw new Error('Missing dependencies for approve')
    }
    const tx = await tokenContract.approve(spender, MaxUint256.toString())
    // Add the approval transaction to the UI transaction list
    addTransaction(tx, {
      type: TransactionType.APPROVAL,
      tokenAddress: token.address,
      spender,
      amount: MaxUint256.toString(),
    })
    return tx
  }, [tokenContract, spender, token, chainId, addTransaction])

  return {
    approvalState,
    approve,
  }
}
