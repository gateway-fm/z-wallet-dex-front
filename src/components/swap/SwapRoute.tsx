import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import Column from 'components/Column'
import RoutingDiagram from 'components/RoutingDiagram/RoutingDiagram'
import { RowBetween } from 'components/Row'
import { ZEPHYR_CHAIN_ID } from 'constants/chains'
import useAutoRouterSupported from 'hooks/useAutoRouterSupported'
import { useMemo } from 'react'
import { ClassicTrade, SubmittableTrade } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { Separator, ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'

import RouterLabel from '../RouterLabel'

function RouteLabel({ trade }: { trade: SubmittableTrade }) {
  return (
    <RowBetween>
      <ThemedText.BodySmall color="neutral2">Order Routing</ThemedText.BodySmall>
      <RouterLabel trade={trade} color="neutral1" />
    </RowBetween>
  )
}

function PriceImpactRow({ trade }: { trade: ClassicTrade }) {
  const { formatPriceImpact } = useFormatter()

  // For Zephyr network, use minimal price impact
  // TODO: Remove this once we have a proper API
  const priceImpact = useMemo(() => {
    const chainId = trade.inputAmount.currency.chainId
    if (chainId === ZEPHYR_CHAIN_ID) {
      return new Percent(1, 10000) // 0.01%
    }
    return trade.priceImpact
  }, [trade])

  return (
    <ThemedText.BodySmall color="neutral2">
      <RowBetween>
        <Trans>Price Impact</Trans>
        <div>{formatPriceImpact(priceImpact)}</div>
      </RowBetween>
    </ThemedText.BodySmall>
  )
}

// eslint-disable-next-line import/no-unused-modules
export function RoutingTooltip({ trade }: { trade: SubmittableTrade }) {
  return isClassicTrade(trade) ? (
    <Column gap="md">
      <PriceImpactRow trade={trade} />
      <Separator />
      <RouteLabel trade={trade} />
    </Column>
  ) : (
    <Column gap="md">
      <RouteLabel trade={trade} />
      <Separator />
    </Column>
  )
}

// eslint-disable-next-line import/no-unused-modules
export function SwapRoute({ trade }: { trade: ClassicTrade }) {
  const { inputAmount, outputAmount } = trade
  const routes = getRoutingDiagramEntries(trade)

  return useAutoRouterSupported() ? (
    <Column gap="md">
      <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
      <ThemedText.Caption color="neutral2">
        <Trans>This route optimizes your total output by considering split routes and multiple hops.</Trans>
      </ThemedText.Caption>
    </Column>
  ) : (
    <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
  )
}
