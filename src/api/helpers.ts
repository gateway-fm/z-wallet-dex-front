import { API_CONFIG } from '../config/api'

export const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL
}
