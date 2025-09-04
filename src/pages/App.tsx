import ErrorBoundary from 'components/ErrorBoundary'
import Loader from 'components/Icons/LoadingSpinner'
import { IpfsSubpathRedirect } from 'components/IpfsSubpathRedirect'
import NavBar, { PageTabs } from 'components/NavBar'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import DarkModeQueryParamReader from 'theme/components/DarkModeQueryParamReader'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'

import { RouteDefinition, routes, useRouterConfig } from './RouteDefinitions'

const AppChrome = lazy(() => import('./AppChrome'))

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100vh);
  padding: ${({ theme }) => theme.navHeight}px 0px 5rem 0px;
  align-items: center;
  flex: 1;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    min-height: 100vh;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    min-height: 100vh;
  }
`

const MobileBottomBar = styled.div`
  z-index: ${Z_INDEX.sticky};
  position: fixed;
  display: flex;
  bottom: 0;
  right: 0;
  left: 0;
  width: calc(100vw - 16px);
  justify-content: space-between;
  padding: 0px 4px;
  height: ${({ theme }) => theme.mobileBottomBarHeight}px;
  background: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  margin: 8px;
  border-radius: 20px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    display: none;
  }
`

const HeaderWrapper = styled.div<{ transparent?: boolean; scrollY: number }>`
  ${flexRowNoWrap};
  background-color: ${({ theme, transparent }) => !transparent && theme.surface1};
  border-bottom: ${({ theme, transparent }) => !transparent && `1px solid ${theme.surface3}`};
  width: 100%;
  max-width: 1400px;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: ${Z_INDEX.dropdown};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    top: 0;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    top: 0;
  }
`

export default function App() {
  const location = useLocation()
  const { pathname } = location
  const [scrollY, setScrollY] = useState(0)
  const scrolledState = scrollY > 0
  const routerConfig = useRouterConfig()

  useEffect(() => {
    window.scrollTo(0, 0)
    setScrollY(0)
  }, [pathname])

  useEffect(() => {
    const scrollListener = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', scrollListener)
    return () => window.removeEventListener('scroll', scrollListener)
  }, [])

  const isHeaderTransparent = !scrolledState

  const blockedPaths = document.querySelector('meta[property="x:blocked-paths"]')?.getAttribute('content')?.split(',')
  const shouldBlockPath = blockedPaths?.includes(pathname) ?? false
  if (shouldBlockPath && pathname !== '/swap') {
    return <Navigate to="/swap" replace />
  }

  return (
    <ErrorBoundary>
      <IpfsSubpathRedirect />
      <DarkModeQueryParamReader />
      <HeaderWrapper transparent={isHeaderTransparent} scrollY={scrollY}>
        <NavBar blur={isHeaderTransparent} />
      </HeaderWrapper>
      <BodyWrapper>
        <Suspense>
          <AppChrome />
        </Suspense>
        <Suspense fallback={<Loader />}>
          <Routes>
            {routes.map((route: RouteDefinition) =>
              route.enabled(routerConfig) ? (
                <Route key={route.path} path={route.path} element={route.getElement(routerConfig)}>
                  {route.nestedPaths.map((nestedPath) => (
                    <Route
                      path={nestedPath}
                      key={`${route.path}/${nestedPath}`}
                      element={route.getElement(routerConfig)}
                    />
                  ))}
                </Route>
              ) : null
            )}
          </Routes>
        </Suspense>
      </BodyWrapper>
      <MobileBottomBar>
        <PageTabs />
      </MobileBottomBar>
    </ErrorBoundary>
  )
}
