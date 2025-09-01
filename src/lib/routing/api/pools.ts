import { Route } from '../types'

export async function getAllRoutes(tokenIn: string, tokenOut: string): Promise<Route[]> {
  // This function is deprecated - routing now uses direct API calls in route.ts
  console.warn('getAllRoutes is deprecated, use getSwapData instead')
  return []
}
