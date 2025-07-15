// a list of tokens by chain
import { Currency, Token } from '@uniswap/sdk-core'

import { ZEPHYR_CHAIN_ID } from './chains'
import { nativeOnChain, USDC_ZEPHYR, WRAPPED_NATIVE_CURRENCY, ZRS_ZEPHYR, ZSD_ZEPHYR } from './tokens'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

type ChainCurrencyList = {
  readonly [chainId: number]: Currency[]
}

const WRAPPED_NATIVE_CURRENCIES_ONLY: ChainTokenList = Object.fromEntries(
  Object.entries(WRAPPED_NATIVE_CURRENCY)
    .map(([key, value]) => [key, [value]])
    .filter(Boolean)
)

// used to construct intermediary pairs for trading
export const COMMON_BASES: ChainCurrencyList = {
  [ZEPHYR_CHAIN_ID]: [
    nativeOnChain(ZEPHYR_CHAIN_ID),
    WRAPPED_NATIVE_CURRENCY[ZEPHYR_CHAIN_ID] as Token,
    USDC_ZEPHYR,
    ZSD_ZEPHYR,
    ZRS_ZEPHYR,
  ],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ZEPHYR_CHAIN_ID]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[ZEPHYR_CHAIN_ID],
    WRAPPED_NATIVE_CURRENCY[ZEPHYR_CHAIN_ID] as Token,
    USDC_ZEPHYR,
    ZSD_ZEPHYR,
    ZRS_ZEPHYR,
  ],
}

export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [ZEPHYR_CHAIN_ID]: [
    [USDC_ZEPHYR, WRAPPED_NATIVE_CURRENCY[ZEPHYR_CHAIN_ID] as Token],
    [ZSD_ZEPHYR, WRAPPED_NATIVE_CURRENCY[ZEPHYR_CHAIN_ID] as Token],
    [ZRS_ZEPHYR, WRAPPED_NATIVE_CURRENCY[ZEPHYR_CHAIN_ID] as Token],
  ],
}
