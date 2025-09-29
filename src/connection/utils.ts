import { Connection, ConnectionType } from 'connection/types'

// https://eips.ethereum.org/EIPS/eip-1193#provider-errors
export enum ErrorCode {
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,

  // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
  CHAIN_NOT_ADDED = 4902,
  MM_ALREADY_PENDING = -32002,
  CB_REJECTED_REQUEST = 'Error: User denied account authorization',
  Z_WALLET_REJECTED_REQUEST = 'User denied wallet connection',
}

// TODO(WEB-1973): merge this function with existing didUserReject for Swap errors
export function didUserReject(connection: Connection, error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    (connection.type === ConnectionType.COINBASE_WALLET && error?.toString?.() === ErrorCode.CB_REJECTED_REQUEST) ||
    (connection.type === ConnectionType.Z_WALLET && error?.message?.includes('User denied'))
  )
}
