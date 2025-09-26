/* eslint-disable import/no-unused-modules */
import { Api } from './Api'
import { getApiBaseUrl } from './helpers'

const apiInstance = new Api({ baseURL: getApiBaseUrl() })

export { getCalldata, useBestRoute, useSearchTokens, useTokenDetails, useTokensList, useTrendingTokens } from './hooks'
export { positionsApiClient } from './positions-api-client'
export {
  usePositionCollects,
  usePositionDecreaseLiquidity,
  usePositionFromApiByTokenId,
  usePositionIncreaseLiquidity,
  usePositionsFromApi,
  usePositionTransfers,
} from './positions-hooks'

export default apiInstance
