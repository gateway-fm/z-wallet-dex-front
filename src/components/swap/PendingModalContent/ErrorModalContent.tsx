import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { ColumnCenter } from 'components/Column'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import { AlertTriangle } from 'react-feather'
import { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'

import { PendingModalContainer } from '.'

export enum PendingModalError {
  TOKEN_APPROVAL_ERROR,
  PERMIT_ERROR,
  CONFIRMATION_ERROR,
  WRAP_ERROR,
  ZWALLET_USER_REJECTED,
  ZWALLET_CONNECTION_ERROR,
  ZWALLET_TRANSACTION_ERROR,
}

interface ErrorModalContentProps {
  errorType: PendingModalError
  onRetry: () => void
}

function getErrorContent(errorType: PendingModalError) {
  switch (errorType) {
    case PendingModalError.TOKEN_APPROVAL_ERROR:
      return {
        title: <Trans>Token approval failed</Trans>,
        label: <Trans>Why are approvals required?</Trans>,
        tooltipText: (
          <Trans>
            This provides the Uniswap protocol access to your token for trading. For security, this will expire after 30
            days.
          </Trans>
        ),
      }
    case PendingModalError.PERMIT_ERROR:
      return {
        title: <Trans>Permit approval failed</Trans>,
        label: <Trans>Why are permits required?</Trans>,
        tooltipText: (
          <Trans>Permit2 allows token approvals to be shared and managed across different applications.</Trans>
        ),
      }
    case PendingModalError.CONFIRMATION_ERROR:
      return {
        title: <Trans>Swap failed</Trans>,
      }
    case PendingModalError.WRAP_ERROR:
      return {
        title: <Trans>Wrap failed</Trans>,
      }
    case PendingModalError.ZWALLET_USER_REJECTED:
      return {
        title: <Trans>Transaction cancelled</Trans>,
        label: <Trans>You cancelled the transaction or closed wallet</Trans>,
      }
    case PendingModalError.ZWALLET_CONNECTION_ERROR:
      return {
        title: <Trans>Connection failed</Trans>,
        label: <Trans>Please check your wallet connection and try again</Trans>,
      }
    case PendingModalError.ZWALLET_TRANSACTION_ERROR:
      return {
        title: <Trans>Transaction failed</Trans>,
        label: <Trans>Transaction execution failed</Trans>,
      }
  }
}

export function ErrorModalContent({ errorType, onRetry }: ErrorModalContentProps) {
  const theme = useTheme()

  const { title, label, tooltipText } = getErrorContent(errorType)

  return (
    <PendingModalContainer gap="lg">
      <AlertTriangle data-testid="pending-modal-failure-icon" strokeWidth={1} color={theme.critical} size="48px" />
      <ColumnCenter gap="md">
        <ThemedText.HeadlineSmall>{title}</ThemedText.HeadlineSmall>
        <Row justify="center">
          {label && <ThemedText.BodySmall color="neutral2">{label}</ThemedText.BodySmall>}
          {tooltipText && <QuestionHelper text={tooltipText} />}
        </Row>
      </ColumnCenter>
      <Row justify="center">
        <ButtonPrimary marginX="24px" marginBottom="16px" onClick={onRetry}>
          <Trans>Retry</Trans>
        </ButtonPrimary>
      </Row>
    </PendingModalContainer>
  )
}
