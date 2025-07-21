import { ContractTransaction } from '@ethersproject/contracts'
import { CurrencyAmount, MaxUint256, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useCallback, useMemo } from 'react'
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
} {
  const { chainId } = useWeb3React()
  const contract = useTokenContract(token?.address, false)
  const inputs = useMemo(() => [owner, spender], [owner, spender])

  // Skip multicall for Zephyr network
  const skipMulticall = chainId === ZEPHYR_CHAIN_ID
  const blocksPerFetch = 1

  const { result, syncing: isSyncing } = useSingleCallResult(skipMulticall ? null : contract, 'allowance', inputs, {
    blocksPerFetch,
  }) as {
    result?: [bigint]
    syncing: boolean
  }

  const tokenAllowance = useMemo(() => {
    if (!token) return undefined

    // For Zephyr network, return a large allowance to bypass approval requirements
    // TODO: Remove this once we have a proper API
    if (skipMulticall) {
      return CurrencyAmount.fromRawAmount(token, MAX_ALLOWANCE)
    }

    if (!result || isSyncing) return undefined
    return CurrencyAmount.fromRawAmount(token, result[0].toString())
  }, [token, result, isSyncing, skipMulticall])

  return useMemo(
    () => ({
      tokenAllowance,
      isSyncing: skipMulticall ? false : isSyncing,
    }),
    [tokenAllowance, isSyncing, skipMulticall]
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
