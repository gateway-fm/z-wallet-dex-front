import { Route } from '../types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAllRoutes(tokenIn: string, tokenOut: string): Promise<Route[]> {
  // This function is deprecated - routing now uses direct API calls in route.ts
  console.warn('getAllRoutes is deprecated, use getSwapData instead')
  return []
}
