import { Currency } from '@uniswap/sdk-core'

export const getTestSelector = (selectorId: string) => `[data-testid=${selectorId}]`

/** Gets the balance of a token as a Chainable. */

// eslint-disable-next-line import/no-unused-modules
export function getBalance(token: Currency) {
  return cy
    .hardhat()
    .then((hardhat) => hardhat.getBalance(hardhat.wallet, token))
    .then((balance) => Number(balance.toFixed(1)))
}
