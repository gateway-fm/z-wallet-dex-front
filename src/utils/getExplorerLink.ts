import { ZEPHYR_CHAIN_ID } from '../constants/chains'

const BLOCK_EXPLORER_PREFIXES: { [chainId: number]: string } = {
  [ZEPHYR_CHAIN_ID]: 'https://zephyr-blockscout.eu-north-2.gateway.fm',
}

export enum ExplorerDataType {
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  ADDRESS = 'address',
  BLOCK = 'block',
}

/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
export function getExplorerLink(chainId: number, data: string, type: ExplorerDataType): string {
  const prefix = BLOCK_EXPLORER_PREFIXES[chainId] ?? 'https://zephyr-blockscout.eu-north-2.gateway.fm'

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}/tx/${data}`
    case ExplorerDataType.TOKEN:
      return `${prefix}/token/${data}`
    case ExplorerDataType.BLOCK:
      return `${prefix}/block/${data}`
    case ExplorerDataType.ADDRESS:
      return `${prefix}/address/${data}`
    default:
      return `${prefix}`
  }
}
