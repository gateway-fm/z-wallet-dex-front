import { MaxUint256, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'

import { CONTRACTS_CONFIG } from '../constants/addresses'
import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenContract } from './useContract'
import { useTokenAllowance } from './useTokenAllowance'

// Unified Zephyr token approval hook
// eslint-disable-next-line import/no-unused-modules
export function useZephyrTokenApproval(
  token?: Token,
  spender?: string,
  amountToApprove?: string
): {
  approvalState: ApprovalState
  approve: () => Promise<void>
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

  const approve = useCallback(async (): Promise<void> => {
    if (!tokenContract || !spender || !token || chainId !== ZEPHYR_CHAIN_ID) {
      console.error('Missing dependencies for approve')
      return
    }
    const tx = await tokenContract.approve(spender, MaxUint256.toString())
    // Add the approval transaction to the UI transaction list
    addTransaction(tx, {
      type: TransactionType.APPROVAL,
      tokenAddress: token.address,
      spender,
      amount: MaxUint256.toString(),
    })
  }, [tokenContract, spender, token, chainId, addTransaction])

  return {
    approvalState,
    approve,
  }
}

export function useLiquidityManagerApproval(
  tokenA?: Token,
  tokenB?: Token,
  amountA?: string,
  amountB?: string
): {
  tokenAApproval: { approvalState: ApprovalState; approve: () => Promise<void> }
  tokenBApproval: { approvalState: ApprovalState; approve: () => Promise<void> }
  needsApproval: boolean
} {
  const { chainId } = useWeb3React()
  const liquidityManagerAddress = chainId === ZEPHYR_CHAIN_ID ? CONTRACTS_CONFIG.LIQUIDITY_MANAGER : undefined

  const tokenAApproval = useZephyrTokenApproval(tokenA, liquidityManagerAddress, amountA)
  const tokenBApproval = useZephyrTokenApproval(tokenB, liquidityManagerAddress, amountB)

  const needsApproval = useMemo(() => {
    return (
      tokenAApproval.approvalState === ApprovalState.NOT_APPROVED ||
      tokenBApproval.approvalState === ApprovalState.NOT_APPROVED
    )
  }, [tokenAApproval.approvalState, tokenBApproval.approvalState])

  return {
    tokenAApproval,
    tokenBApproval,
    needsApproval,
  }
}
