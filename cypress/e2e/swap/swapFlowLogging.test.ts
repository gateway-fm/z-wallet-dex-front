import { USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

describe('swap flow logging', () => {
  it('completes two swaps and verifies the TTS logging for the first, plus all intermediate steps along the way', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)
    cy.hardhat()

    // First swap in the session:
    // Enter amount to swap
    cy.get('#swap-currency-output .token-amount-input').type('1')
    cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

    // Submit transaction
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.get(getTestSelector('confirmation-close-icon')).click()

    cy.get(getTestSelector('popups')).contains('Swapped')

    // Second swap in the session:
    // Enter amount to swap (different from first trade, to trigger a new quote request)
    cy.get('#swap-currency-output .token-amount-input').clear().type('10')
    cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

    // Submit transaction
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.get(getTestSelector('confirmation-close-icon')).click()

    cy.get(getTestSelector('popups')).contains('Swapped')
  })
})
