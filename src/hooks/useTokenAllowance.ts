import { ContractTransaction } from '@ethersproject/contracts'
import { CurrencyAmount, MaxUint256, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApproveTransactionInfo, TransactionType } from 'state/transactions/types'
import { UserRejectedRequestError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

import { ZEPHYR_CHAIN_ID } from '../constants/chains'
import { useTokenContract } from './useContract'

const MAX_ALLOWANCE = MaxUint256.toString()

export function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string
): {
  tokenAllowance?: CurrencyAmount<Token>
  isSyncing: boolean
  refetchAllowance: () => void
} {
  const { chainId } = useWeb3React()
  const isZephyr = chainId === ZEPHYR_CHAIN_ID
  const contract = useTokenContract(token?.address, false)
  const inputs = useMemo(() => [owner, spender], [owner, spender])

  const [zephyrAllowance, setZephyrAllowance] = useState<bigint | undefined>(undefined)
  const [isZephyrLoading, setIsZephyrLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const singleCallResult = useSingleCallResult(isZephyr ? (null as any) : contract, 'allowance', inputs) as {
    valid?: boolean
    result?: [bigint]
    syncing: boolean
  }

  const { result, syncing: isSyncing } = singleCallResult

  const refetchAllowance = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const needDirectCall = isZephyr || singleCallResult?.valid === false
    if (!contract) {
      console.debug('Direct allowance skipped: no contract')
      return
    }
    if (!owner || !spender) {
      console.debug('Direct allowance skipped: missing owner or spender', { owner, spender })
      return
    }

    console.debug('Allowance decision', {
      isZephyr,
      singleCallValid: singleCallResult?.valid,
      needDirectCall,
      owner,
      spender,
      token: token?.address,
    })

    if (needDirectCall) {
      setIsZephyrLoading(true)
      contract
        .allowance(owner, spender)
        .then((allowanceResult: any) => {
          console.debug('Check token allowance (direct)', allowanceResult)
          setZephyrAllowance(BigInt(allowanceResult.toString()))
          setIsZephyrLoading(false)
        })
        .catch((err) => {
          console.debug('Token allowance check error (direct)', err)
          setZephyrAllowance(BigInt(0))
          setIsZephyrLoading(false)
        })
    }
  }, [isZephyr, singleCallResult?.valid, contract, owner, spender, token?.address, refreshTrigger])

  const tokenAllowance = useMemo(() => {
    if (!token) return undefined

    // Prefer direct result if available (Zephyr or fallback)
    if (zephyrAllowance !== undefined && !isZephyrLoading) {
      return CurrencyAmount.fromRawAmount(token, zephyrAllowance.toString())
    }

    // Multicall path (non-Zephyr)
    if (!isZephyr && result && !isSyncing) {
      return CurrencyAmount.fromRawAmount(token, result[0].toString())
    }

    // Unknown yet
    return undefined
  }, [token, result, isSyncing, zephyrAllowance, isZephyrLoading, isZephyr])

  return useMemo(
    () => ({
      tokenAllowance,
      isSyncing: isZephyrLoading || isSyncing,
      refetchAllowance,
    }),
    [tokenAllowance, isZephyrLoading, isSyncing, refetchAllowance]
  )
}

export function useUpdateTokenAllowance(
  amount: CurrencyAmount<Token> | undefined,
  spender: string
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const contract = useTokenContract(amount?.currency.address)

  return useCallback(async () => {
    try {
      if (!amount) throw new Error('missing amount')
      if (!contract) throw new Error('missing contract')
      if (!spender) throw new Error('missing spender')

      const allowance = amount.equalTo(0) ? '0' : MAX_ALLOWANCE
      const response = await contract.approve(spender, allowance)
      return {
        response,
        info: {
          type: TransactionType.APPROVAL,
          tokenAddress: contract.address,
          spender,
          amount: allowance,
        },
      }
    } catch (e: unknown) {
      const symbol = amount?.currency.symbol ?? 'Token'
      if (didUserReject(e)) {
        throw new UserRejectedRequestError(`${symbol} token allowance failed: User rejected`)
      }
      throw new Error(`${symbol} token allowance failed: ${e instanceof Error ? e.message : e}`)
    }
  }, [amount, contract, spender])
}

export function useRevokeTokenAllowance(
  token: Token | undefined,
  spender: string
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const amount = useMemo(() => (token ? CurrencyAmount.fromRawAmount(token, 0) : undefined), [token])

  return useUpdateTokenAllowance(amount, spender)
}
