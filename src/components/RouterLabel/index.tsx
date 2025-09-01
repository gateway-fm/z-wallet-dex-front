import { QuoteMethod, SubmittableTrade } from 'state/routing/types'
import { DefaultTheme } from 'styled-components'
import { ThemedText } from 'theme/components'

export default function RouterLabel({ trade, color }: { trade: SubmittableTrade; color?: keyof DefaultTheme }) {
  if (trade.quoteMethod === QuoteMethod.CLIENT_SIDE || trade.quoteMethod === QuoteMethod.CLIENT_SIDE_FALLBACK) {
    return <ThemedText.BodySmall color={color}>DEX Swap Client</ThemedText.BodySmall>
  }
  return <ThemedText.BodySmall color={color}>DEX Swap API</ThemedText.BodySmall>
}
