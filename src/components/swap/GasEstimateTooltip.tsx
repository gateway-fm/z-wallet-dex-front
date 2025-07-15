import { useWeb3React } from '@web3-react/core'
import { Gas } from 'components/Icons/Gas'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import Row, { RowFixed } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS, ZEPHYR_CHAIN_ID } from 'constants/chains'
import { SubmittableTrade } from 'state/routing/types'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { GasBreakdownTooltip } from './GasBreakdownTooltip'

const StyledGasIcon = styled(Gas)`
  height: 16px;
  width: 16px;
  // We apply the following to all children of the SVG in order to override the default color
  & > * {
    fill: ${({ theme }) => theme.neutral2};
  }
`

export default function GasEstimateTooltip({ trade, loading }: { trade?: SubmittableTrade; loading: boolean }) {
  const { chainId } = useWeb3React()
  const { formatNumber } = useFormatter()

  if (!trade || !chainId || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId as typeof ZEPHYR_CHAIN_ID)) {
    return null
  }

  return (
    <MouseoverTooltip size={TooltipSize.Small} text={<GasBreakdownTooltip trade={trade} />} placement="right">
      <LoadingOpacityContainer $loading={loading}>
        <RowFixed gap="xs">
          <StyledGasIcon />
          <ThemedText.BodySmall color="neutral2">
            <Row gap="xs">
              <div>
                {formatNumber({
                  input: trade.totalGasUseEstimateUSD,
                  type: NumberType.FiatGasPrice,
                })}
              </div>
            </Row>
          </ThemedText.BodySmall>
        </RowFixed>
      </LoadingOpacityContainer>
    </MouseoverTooltip>
  )
}
