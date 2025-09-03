import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import Column from 'components/Column'
import SpinningLoader from 'components/Loader/SpinningLoader'
import { SwapResult } from 'hooks/useSwapCallback'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'

import { ButtonError, SmallButtonPrimary } from '../Button'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import { SwapCallbackError, SwapShowAcceptChanges } from './styled'
import { SwapLineItemType } from './SwapLineItem'
import SwapLineItem from './SwapLineItem'

const DetailsContainer = styled(Column)`
  padding: 0 8px;
`

const StyledAlertTriangle = styled(AlertTriangle)`
  margin-right: 8px;
  min-width: 24px;
`

const ConfirmButton = styled(ButtonError)`
  height: 56px;
  margin-top: 10px;
`

export default function SwapModalFooter({
  trade,
  allowedSlippage,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  showAcceptChanges,
  onAcceptChanges,
  isLoading,
}: {
  trade: InterfaceTrade
  swapResult?: SwapResult
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage?: ReactNode
  disabledConfirm: boolean
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  showAcceptChanges: boolean
  onAcceptChanges: () => void
  isLoading: boolean
}) {
  const theme = useTheme()

  const lineItemProps = { trade, allowedSlippage, syncing: false }

  return (
    <>
      <DetailsContainer gap="md">
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.EXCHANGE_RATE} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.PRICE_IMPACT} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.MAX_SLIPPAGE} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.MAXIMUM_INPUT} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.MINIMUM_OUTPUT} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.OUTPUT_TOKEN_FEE_ON_TRANSFER} />
      </DetailsContainer>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges data-testid="show-accept-changes">
          <RowBetween>
            <RowFixed>
              <StyledAlertTriangle size={20} />
              <ThemedText.DeprecatedMain color={theme.accent1}>
                <Trans>Price updated</Trans>
              </ThemedText.DeprecatedMain>
            </RowFixed>
            <SmallButtonPrimary onClick={onAcceptChanges}>
              <Trans>Accept</Trans>
            </SmallButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : (
        <AutoRow>
          <ConfirmButton
            data-testid="confirm-swap-button"
            onClick={onConfirm}
            disabled={disabledConfirm}
            $borderRadius="12px"
          >
            {isLoading ? (
              <ThemedText.HeadlineSmall color="neutral2">
                <Row>
                  <SpinningLoader />
                  <Trans>Finalizing quote...</Trans>
                </Row>
              </ThemedText.HeadlineSmall>
            ) : (
              <ThemedText.HeadlineSmall color="deprecated_accentTextLightPrimary">
                <Trans>Confirm swap</Trans>
              </ThemedText.HeadlineSmall>
            )}
          </ConfirmButton>

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      )}
    </>
  )
}
