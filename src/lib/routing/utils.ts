import { Route, SwapType } from './types'

export function encodeRoute(route: Route, swapType: SwapType) {
  let encoded = '0x'
  switch (swapType) {
    case SwapType.EXACT_INPUT:
      for (let i = 0; i < route.length; i++) {
        encoded += route[i].tokenIn.slice(2)
        encoded += route[i].fee.toString(16).padStart(6, '0')
      }
      encoded += route[route.length - 1].tokenOut.slice(2)

      return encoded

    case SwapType.EXACT_OUTPUT:
      for (let i = route.length - 1; i >= 0; i--) {
        encoded += route[i].tokenOut.slice(2)
        encoded += route[i].fee.toString(16).padStart(6, '0')
      }
      encoded += route[0].tokenIn.slice(2)
      return encoded

    default:
      throw new Error(`Unsupported swap type: ${swapType}`)
  }
}
