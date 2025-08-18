import { Api } from './Api'
import { getApiBaseUrl } from './helpers'

const apiInstance = new Api({ baseURL: getApiBaseUrl() })

// eslint-disable-next-line import/no-unused-modules
export { useSearchTokens, useTokenDetails, useTokensList, useTrendingTokens } from './hooks'

export default apiInstance
