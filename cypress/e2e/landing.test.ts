import { getTestSelector } from '../utils'
import { CONNECTED_WALLET_USER_STATE, DISCONNECTED_WALLET_USER_STATE } from '../utils/user-state'

describe('Home Page', () => {
  it('shows swap page when no user state exists', () => {
    cy.visit('/', { userState: DISCONNECTED_WALLET_USER_STATE })
    cy.get('#swap-page')
    cy.url().should('include', '/swap')
    cy.screenshot()
  })

  it('shows swap page when a user has already connected a wallet', () => {
    cy.visit('/', { userState: CONNECTED_WALLET_USER_STATE })
    cy.get('#swap-page')
    cy.url().should('include', '/swap')
    cy.screenshot()
  })

  it('shows landing page when visiting /landing', () => {
    cy.visit('/landing', { userState: CONNECTED_WALLET_USER_STATE })
    cy.get(getTestSelector('landing-page'))
  })

  it('shows swap page when the unicorn icon in nav is selected', () => {
    cy.visit('/landing')
    cy.get(getTestSelector('horswap-logo')).click()
    cy.url().should('include', '/swap')
  })

  it('allows navigation to pool', () => {
    cy.viewport(2000, 1600)
    cy.visit('/swap')
    cy.get(getTestSelector('pool-nav-link')).first().click()
    cy.url().should('include', '/pools')
  })

  it('allows navigation to pool on mobile', () => {
    cy.viewport('iphone-6')
    cy.visit('/swap')
    cy.get(getTestSelector('pool-nav-link')).last().click()
    cy.url().should('include', '/pools')
  })
})
