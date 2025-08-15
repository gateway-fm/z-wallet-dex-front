import axios from 'axios'

import { API_ERRORS } from './constants'
import { getApiBaseUrl } from './helpers'

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  // Add auth token if available (will be implemented later)
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === API_ERRORS.UNAUTHORIZED) {
      // Handle unauthorized errors (will be implemented later)
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)
