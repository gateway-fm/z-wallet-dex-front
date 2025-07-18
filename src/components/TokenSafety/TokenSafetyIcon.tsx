import { Warning, WARNING_LEVEL } from 'constants/tokenSafety'
import { AlertTriangle } from 'react-feather'
import styled, { css } from 'styled-components'

const WarningContainer = styled.div`
  margin-left: 4px;
  display: flex;
  justify-content: center;
`

const WarningIconStyle = css<{ size?: string }>`
  width: ${({ size }) => size ?? '1em'};
  height: ${({ size }) => size ?? '1em'};
`

const WarningIcon = styled(AlertTriangle)`
  ${WarningIconStyle};
  color: ${({ theme }) => theme.neutral3};
`

// eslint-disable-next-line import/no-unused-modules
export default function TokenSafetyIcon({ warning }: { warning: Warning | null }) {
  switch (warning?.level) {
    case WARNING_LEVEL.UNKNOWN:
      return (
        <WarningContainer>
          <WarningIcon />
        </WarningContainer>
      )
    default:
      return null
  }
}
