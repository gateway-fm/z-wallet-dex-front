import { Route } from '../types'

export async function getAllRoutes(tokenIn: string, tokenOut: string): Promise<Route[]> {
  // NOTE: This is a placeholder implementation, BE not ready yet
  console.warn('getAllRoutes: REST API routing not implemented', { tokenIn, tokenOut })

  if (!tokenIn || !tokenOut) {
    throw new Error('Token addresses are required')
  }

  if (!tokenIn.startsWith('0x') || !tokenOut.startsWith('0x')) {
    throw new Error('Invalid token address format')
  }

  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
    throw new Error('Input and output tokens cannot be the same')
  }
  return []
}
