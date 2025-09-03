/* eslint-disable import/no-unused-modules */

import { useMemo } from 'react'

import { UseUserPositionsResult, UseUserTransactionsResult } from '../types/api'

export function useUserPositions(account?: string): UseUserPositionsResult {
  const positions = useMemo(() => {
    // NOTE: API doesn't provide user positions data yet
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
    // NOTE: API doesn't provide user transactions data yet
    return []
  }, [account, first, skip])

  return {
    transactions,
    loading: false,
    error: null,
  }
}
