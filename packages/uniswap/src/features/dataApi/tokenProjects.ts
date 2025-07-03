import { useMemo } from 'react'
import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'

/**
 * NOTE: This is a stub for web
 * to avoid requests to TokenProjects with ContractInput
 */
export function useTokenProjects(_currencyIds: CurrencyId[]): GqlResult<CurrencyInfo[]> {
  return useMemo(
    () => ({ 
      data: [], 
      loading: false, 
      refetch: () => {}, 
      error: undefined 
    }),
    []
  )
}
