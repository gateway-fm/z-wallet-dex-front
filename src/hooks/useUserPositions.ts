/* eslint-disable import/no-unused-modules */

import { useMemo } from 'react'

import { UseUserPositionsResult, UseUserTransactionsResult } from '../types/api'

export function useUserPositions(account?: string): UseUserPositionsResult {
  const positions = useMemo(() => {
    // NOTE: This is a placeholder implementation, BE not ready yet
    console.warn('useUserPositions: REST API user positions not implemented', { account })
    return []
  }, [account])

  return {
    positions,
    loading: false,
    error: null,
  }
}

export function useUserTransactions(account?: string, first = 50, skip = 0): UseUserTransactionsResult {
  const transactions = useMemo(() => {
    // NOTE: This is a placeholder implementation, BE not ready yet
    console.warn('useUserTransactions: REST API user transactions not implemented', { account, first, skip })
    return []
  }, [account, first, skip])

  return {
    transactions,
    loading: false,
    error: null,
  }
}
