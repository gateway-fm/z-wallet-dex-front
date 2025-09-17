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
  token: Token | undefined,
  owner?: string,
  spender?: string
): {
  tokenAllowance?: CurrencyAmount<Token>
  isSyncing: boolean
  refetchAllowance: () => void
} {
  const { chainId } = useWeb3React()
  const contract = useTokenContract(token?.address, false)
  const inputs = useMemo(() => [owner, spender], [owner, spender])

  const [zephyrAllowance, setZephyrAllowance] = useState<bigint | undefined>(undefined)
  const [isZephyrLoading, setIsZephyrLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const blocksPerFetch = chainId === ZEPHYR_CHAIN_ID ? 1 : undefined

  const { result, syncing: isSyncing } = useSingleCallResult(contract, 'allowance', inputs, {
    blocksPerFetch,
  }) as {
    result?: [bigint]
    syncing: boolean
  }

  const refetchAllowance = useCallback(() => {
    if (chainId === ZEPHYR_CHAIN_ID) {
      setRefreshTrigger((prev) => prev + 1)
    }
  }, [chainId])

  useEffect(() => {
    if (chainId === ZEPHYR_CHAIN_ID && contract && owner && spender && token) {
      setIsZephyrLoading(true)
      contract
        .allowance(owner, spender)
        .then((allowanceResult: any) => {
          setZephyrAllowance(BigInt(allowanceResult.toString()))
          setIsZephyrLoading(false)
        })
        .catch(() => {
          setZephyrAllowance(BigInt(0)) // Default to 0 if call fails
          setIsZephyrLoading(false)
        })
    }
  }, [chainId, contract, owner, spender, token, refreshTrigger])

  const tokenAllowance = useMemo(() => {
    if (!token) {
      return undefined
    }

    if (chainId === ZEPHYR_CHAIN_ID) {
      if (zephyrAllowance !== undefined && !isZephyrLoading) {
        const allowanceAmount = CurrencyAmount.fromRawAmount(token, zephyrAllowance.toString())
        return allowanceAmount
      }
      return CurrencyAmount.fromRawAmount(token, 0)
    } else {
      if (!result || isSyncing) return undefined
      return CurrencyAmount.fromRawAmount(token, result[0].toString())
    }
  }, [token, result, isSyncing, chainId, zephyrAllowance, isZephyrLoading])

  return useMemo(
    () => ({
      tokenAllowance,
      isSyncing: chainId === ZEPHYR_CHAIN_ID ? isZephyrLoading : isSyncing, // Для Zephyr показываем состояние прямого вызова
      refetchAllowance,
    }),
    [tokenAllowance, isSyncing, chainId, isZephyrLoading, refetchAllowance]
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
