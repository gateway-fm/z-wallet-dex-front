import { MaxUint256, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { ApprovalState } from 'lib/hooks/useApproval'
import { useCallback, useMemo, useRef } from 'react'
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

  const chainIdRef = useRef(chainId)
  if (chainId !== chainIdRef.current) {
    chainIdRef.current = chainId
  }

  const shouldFetchAllowance = chainIdRef.current === ZEPHYR_CHAIN_ID && token && account && spender
  const { tokenAllowance, isSyncing, refetchAllowance } = useTokenAllowance(
    shouldFetchAllowance ? token : undefined,
    shouldFetchAllowance ? account : undefined,
    shouldFetchAllowance ? spender : undefined
  )

  const approvalState = useMemo((): ApprovalState => {
    if (!amountToApprove || !spender || !token || chainIdRef.current !== ZEPHYR_CHAIN_ID) {
      console.debug('Approval state UNKNOWN - missing required params:', {
        hasAmountToApprove: !!amountToApprove,
        hasSpender: !!spender,
        hasToken: !!token,
        chainId: chainIdRef.current,
        isZephyrChain: chainIdRef.current === ZEPHYR_CHAIN_ID,
      })
      return ApprovalState.UNKNOWN
    }

    if (!shouldFetchAllowance) {
      return ApprovalState.UNKNOWN
    }

    if (isSyncing || !tokenAllowance) {
      console.debug('Approval state UNKNOWN - no token allowance data:', {
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
    console.debug('Approval state check:', {
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
  }, [amountToApprove, spender, token, tokenAllowance, account, isSyncing, shouldFetchAllowance])

  const approve = useCallback(async (): Promise<void> => {
    console.debug('Zephyr token approval called:', {
      tokenSymbol: token?.symbol,
      tokenAddress: token?.address,
      spender,
      chainId: chainIdRef.current,
      account,
      isZephyrChain: chainIdRef.current === ZEPHYR_CHAIN_ID,
    })

    if (!spender || !token || chainIdRef.current !== ZEPHYR_CHAIN_ID) {
      console.warn('Approval cancelled - missing required params')
      return
    }

    const connection = getConnection(connector)
    console.debug('Using connection type:', connection.type)

    if (connection.type === ConnectionType.Z_WALLET) {
      console.debug('Using Z-Wallet for approval')
      await approveWithZWallet(token, spender, chainIdRef.current, account || '', addTransaction)
      console.debug('Refreshing allowance after Z-Wallet approval')
      refetchAllowance()
    } else {
      console.debug('Using standard wallet for approval')
      if (!tokenContract) {
        console.error('No token contract available for standard wallet approval')
        return
      }

      try {
        const approvalResult = await tokenContract.approve(spender, MaxUint256.toString())
        console.debug('Standard wallet approval successful:', {
          hash: approvalResult.hash,
          tokenSymbol: token.symbol,
        })

        addTransaction(approvalResult, {
          type: TransactionType.APPROVAL,
          tokenAddress: token.address,
          spender,
          amount: MaxUint256.toString(),
        })
        console.debug('Refreshing allowance after standard wallet approval')
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
  }, [tokenContract, spender, token, addTransaction, connector, account, refetchAllowance])

  return {
    approvalState,
    approve,
  }
}
