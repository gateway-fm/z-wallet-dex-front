import { useWeb3React } from '@web3-react/core'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import { useZephyrTokens } from 'hooks/useZephyrTokens'
import styled from 'styled-components'

const DebugContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  max-width: 300px;
  z-index: 9999;
`

const DebugItem = styled.div`
  margin: 2px 0;
`

/**
 * Debug component to show token information in development mode
 * Only visible when NODE_ENV === 'development'
 */
export function TokenDebugInfo() {
  const { chainId, account } = useWeb3React()
  const zephyrTokens = useZephyrTokens()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <DebugContainer>
      <DebugItem>
        <strong>🔧 Debug Info</strong>
      </DebugItem>
      <DebugItem>Chain ID: {chainId || 'Not connected'}</DebugItem>
      <DebugItem>Is Zephyr: {chainId === ZEPHYR_CHAIN_ID ? '✅' : '❌'}</DebugItem>
      <DebugItem>Account: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}</DebugItem>
      <DebugItem>GraphQL Tokens: {Object.keys(zephyrTokens).length}</DebugItem>
      {Object.keys(zephyrTokens).length > 0 && (
        <DebugItem>First Token: {Object.values(zephyrTokens)[0]?.symbol || 'None'}</DebugItem>
      )}
    </DebugContainer>
  )
}
