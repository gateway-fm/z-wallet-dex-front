import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'

import { RPC_PROVIDERS } from '../constants/providers'
import { nativeOnChain } from '../constants/tokens'
import { checkErc20Balance } from '../utils/checkErc20Balance'

function useDirectTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined {
  const { provider, chainId } = useWeb3React()
  const [amount, setAmount] = useState<CurrencyAmount<Token> | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const effectiveProvider = provider ?? (chainId ? RPC_PROVIDERS[chainId] : undefined)
      if (!account || !token || !effectiveProvider || !chainId) {
        if (!cancelled) setAmount(undefined)
        return
      }
      try {
        const res = await checkErc20Balance(effectiveProvider as any, token.address, account)
        if (!cancelled) {
          setAmount(CurrencyAmount.fromRawAmount(token, JSBI.BigInt(res.raw.toString())))
        }
      } catch (e) {
        if (!cancelled) setAmount(undefined)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [account, token, provider, chainId])

  return amount
}

function useDirectNativeBalance(account?: string): CurrencyAmount<Currency> | undefined {
  const { provider, chainId } = useWeb3React()
  const [amount, setAmount] = useState<CurrencyAmount<Currency> | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const effectiveProvider = provider ?? (chainId ? RPC_PROVIDERS[chainId] : undefined)
      if (!account || !effectiveProvider || !chainId) {
        if (!cancelled) setAmount(undefined)
        return
      }
      try {
        const raw = await effectiveProvider.getBalance(account)
        if (!cancelled) {
          setAmount(CurrencyAmount.fromRawAmount(nativeOnChain(chainId), JSBI.BigInt(raw.toString())))
        }
      } catch (e) {
        if (!cancelled) setAmount(undefined)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [account, provider, chainId])

  return amount
}

export function useZephyrEffectiveInputBalance(
  account: string | null | undefined,
  inputCurrency?: Currency,
  fallback?: CurrencyAmount<Currency>
): CurrencyAmount<Currency> | undefined {
  const directToken = useDirectTokenBalance(
    account ?? undefined,
    inputCurrency?.isToken ? (inputCurrency as Token) : undefined
  )
  const directNative = useDirectNativeBalance(account ?? undefined)
  return useMemo(() => {
    if (!inputCurrency) return fallback
    if (inputCurrency.isToken) return (directToken as any) ?? fallback
    if (inputCurrency.isNative) return (directNative as any) ?? fallback
    return fallback
  }, [inputCurrency, fallback, directToken, directNative])
}
