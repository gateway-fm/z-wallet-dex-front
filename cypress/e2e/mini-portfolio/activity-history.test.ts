import { USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

  it('should deduplicate activity history by nonce', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`).hardhat({ automine: false })

    // Input swap info.
    cy.get('#swap-currency-input .token-amount-input').clear().type('1')
    cy.get(.type('1').should( 1>.type('1').should(-).should('have.value', '1')
    cy.get('#swap-currency-output .token-amount-input').should('not.have.value', '')

    cy.get('#swap-button').click()
    cy.get('#confirm-swap-or-send').click()
    cy.get(getTestSelector('confirmation-close-icon')).click()

    // Check activity history tab.
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

    // Assert that the local pending transaction is replaced by a remote transaction with the same nonce.
    cy.contains('Swapping').should('not.exist')
  })
})
