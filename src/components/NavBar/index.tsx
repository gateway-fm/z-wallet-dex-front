import { Trans } from '@lingui/macro'
import { useAccountDrawer } from 'components/AccountDrawer'
import Web3Status from 'components/Web3Status'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
// import { GatewayIcon } from 'nft/components/icons'
import { ReactNode, useCallback } from 'react'
import { NavLink, NavLinkProps, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useIsNavSearchInputVisible } from '../../nft/hooks/useIsNavSearchInputVisible'
import Blur from './Blur'
import { ChainSelector } from './ChainSelector'
import * as styles from './style.css'

const Nav = styled.nav`
  padding: ${({ theme }) => `${theme.navVerticalPad}px 12px`};
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  z-index: 2;
`

interface MenuItemProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  children: ReactNode
  dataTestId?: string
}

const MenuItem = ({ href, dataTestId, id, isActive, children }: MenuItemProps) => {
  return (
    <NavLink
      to={href}
      className={isActive ? styles.activeMenuItem : styles.menuItem}
      id={id}
      style={{ textDecoration: 'none', overflow: 'hidden', whiteSpace: 'nowrap' }}
      data-testid={dataTestId}
    >
      {children}
    </NavLink>
  )
}

// eslint-disable-next-line import/no-unused-modules
export const PageTabs = () => {
  const { pathname } = useLocation()
  return (
    <>
      <MenuItem href="/swap" isActive={pathname.startsWith('/swap')}>
        <Trans>Swap</Trans>
      </MenuItem>
    </>
  )
}

const Navbar = ({ blur }: { blur: boolean }) => {
  const navigate = useNavigate()
  const isNavSearchInputVisible = useIsNavSearchInputVisible()

  const [accountDrawerOpen, toggleAccountDrawer] = useAccountDrawer()

  const handleIconClick = useCallback(() => {
    if (accountDrawerOpen) {
      toggleAccountDrawer()
    }
    navigate('/swap')
  }, [accountDrawerOpen, navigate, toggleAccountDrawer])

  return (
    <>
      {blur && <Blur />}
      <Nav>
        <Box display="flex" height="full" flexWrap="nowrap">
          <Box className={styles.leftSideContainer}>
            {/* <Box className={styles.logoContainer}>
              <GatewayIcon
                width="36"
                height="36"
                data-testid="main-logo"
                className={styles.logo}
                onClick={handleIconClick}
              />
            </Box>
            <Box display={{ sm: 'flex', lg: 'none' }}>
              <ChainSelector leftAlign={true} />
            </Box>
            <Row>
              <PageTabs />
            </Row> */}
          </Box>
          <Box className={styles.rightSideContainer}>
            <Row gap="12">
              <Box position="relative" display={isNavSearchInputVisible ? 'none' : { sm: 'flex' }}></Box>
              <Box display={{ sm: 'none', lg: 'flex' }}>
                <ChainSelector />
              </Box>

              <Web3Status />
            </Row>
          </Box>
        </Box>
      </Nav>
    </>
  )
}

export default Navbar
