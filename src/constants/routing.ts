import { Currency, Token } from '@uniswap/sdk-core'

import { ZEPHYR_CHAIN_ID } from './chains'
import { WRAPPED_NATIVE_CURRENCY } from './tokens'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

type ChainCurrencyList = {
  readonly [chainId: number]: Currency[]
}

// eslint-disable-next-line import/no-unused-modules
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WRAPPED_NATIVE_CURRENCIES_ONLY: ChainTokenList = Object.fromEntries(
  Object.entries(WRAPPED_NATIVE_CURRENCY)
    .map(([key, value]) => [key, [value]])
    .filter(Boolean)
)

// used to construct intermediary pairs for trading
export const COMMON_BASES: ChainCurrencyList = {
  [ZEPHYR_CHAIN_ID]: [
    // NOTE: Tokens loaded dynamically from GraphQL only
  ],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ZEPHYR_CHAIN_ID]: [
    // NOTE: Tokens loaded dynamically from GraphQL only
  ],
}

export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [ZEPHYR_CHAIN_ID]: [
    // NOTE: Pairs created dynamically based on GraphQL token data
  ],
}
