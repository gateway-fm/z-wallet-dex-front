import { Connector } from '@web3-react/types'
import { useSyncExternalStore } from 'react'

import { getConnection, networkConnection } from './index'
import { deletePersistedConnectionMeta, getPersistedConnectionMeta } from './meta'
import { ConnectionType } from './types'

class FailedToConnect extends Error {}

let connectionReady: Promise<void> | true = true

export function useConnectionReady() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (connectionReady instanceof Promise) {
        connectionReady.finally(onStoreChange)
      }
      return () => undefined
    },
    () => connectionReady === true
  )
}

async function connect(connector: Connector, type: ConnectionType) {
  performance.mark(`web3:connect:${type}:start`)
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
    return true
  } catch (error) {
    console.debug(`web3-react eager connection error: ${error}`)
    return false
  } finally {
    performance.measure(`web3:connect:${type}`, `web3:connect:${type}:start`)
  }
}

connect(networkConnection.connector, ConnectionType.NETWORK)

// Get the persisted wallet type from the last session.
const meta = getPersistedConnectionMeta()
const selectedConnection = meta?.type ? getConnection(meta.type) : undefined
if (selectedConnection && meta?.type) {
  connectionReady = connect(selectedConnection.connector, meta.type)
    .then((connected) => {
      if (!connected) throw new FailedToConnect()
    })
    .catch((error) => {
      // Clear the persisted wallet type if it failed to connect.
      deletePersistedConnectionMeta()
      // Log it if it threw an unknown error.
      if (!(error instanceof FailedToConnect)) {
        console.error(error)
      }
    })
    .finally(() => {
      connectionReady = true
    })
}
