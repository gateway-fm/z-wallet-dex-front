import { MaxUint256, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useCallback, useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenContract } from './useContract'
import { useTokenAllowance } from './useTokenAllowance'
import { approveWithZWallet } from './useZWalletApproval'

export function useZephyrTokenApproval(
  token?: Token,
  spender?: string,
  amountToApprove?: string
): {
  approvalState: ApprovalState
  approve: () => Promise<any>
} {
  const { chainId, account, connector } = useWeb3React()
  const tokenContract = useTokenContract(token?.address, true)
  const addTransaction = useTransactionAdder()

  const { tokenAllowance, refetchAllowance } = useTokenAllowance(token, account ?? undefined, spender)

  const approvalState = useMemo((): ApprovalState => {
    if (!amountToApprove || !spender || !token || chainId !== ZEPHYR_CHAIN_ID) {
      console.log('Approval state UNKNOWN - missing required params:', {
        hasAmountToApprove: !!amountToApprove,
        hasSpender: !!spender,
        hasToken: !!token,
        chainId,
        isZephyrChain: chainId === ZEPHYR_CHAIN_ID,
      })
      return ApprovalState.UNKNOWN
    }
    if (!tokenAllowance) {
      console.log('Approval state UNKNOWN - no token allowance data:', {
        tokenSymbol: token.symbol,
        tokenAddress: token.address,
        spender,
        account,
      })
      return ApprovalState.UNKNOWN
    }

    const amountToApproveBN = BigInt(amountToApprove)
    const currentAllowanceBN = BigInt(tokenAllowance.quotient.toString())

    const isApproved = currentAllowanceBN >= amountToApproveBN
    console.log('Approval state check:', {
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      spender,
      amountToApprove,
      currentAllowance: tokenAllowance.quotient.toString(),
      isApproved,
      approvalState: isApproved ? 'APPROVED' : 'NOT_APPROVED',
    })

    if (isApproved) {
      return ApprovalState.APPROVED
    }

    return ApprovalState.NOT_APPROVED
  }, [amountToApprove, spender, token, chainId, tokenAllowance, account])

  const approve = useCallback(async (): Promise<void> => {
    console.log('Zephyr token approval called:', {
      tokenSymbol: token?.symbol,
      tokenAddress: token?.address,
      spender,
      chainId,
      account,
      isZephyrChain: chainId === ZEPHYR_CHAIN_ID,
    })

    if (!spender || !token || chainId !== ZEPHYR_CHAIN_ID) {
      console.warn('Approval cancelled - missing required params')
      return
    }

    const connection = getConnection(connector)
    console.log('Using connection type:', connection.type)

    if (connection.type === ConnectionType.Z_WALLET) {
      console.log('Using Z-Wallet for approval')
      await approveWithZWallet(token, spender, chainId, account || '', addTransaction)
      console.log('Refreshing allowance after Z-Wallet approval')
      refetchAllowance()
    } else {
      console.log('Using standard wallet for approval')
      if (!tokenContract) {
        console.error('No token contract available for standard wallet approval')
        return
      }

      try {
        const approvalResult = await tokenContract.approve(spender, MaxUint256.toString())
        console.log('Standard wallet approval successful:', {
          hash: approvalResult.hash,
          tokenSymbol: token.symbol,
        })

        addTransaction(approvalResult, {
          type: TransactionType.APPROVAL,
          tokenAddress: token.address,
          spender,
          amount: MaxUint256.toString(),
        })
        console.log('Refreshing allowance after standard wallet approval')
        refetchAllowance()
      } catch (error) {
        console.error('Standard wallet approval failed:', {
          error,
          tokenSymbol: token.symbol,
          tokenAddress: token.address,
        })
        throw error
      }
    }
  }, [tokenContract, spender, token, chainId, addTransaction, connector, account, refetchAllowance])

  return {
    approvalState,
    approve,
  }
}
