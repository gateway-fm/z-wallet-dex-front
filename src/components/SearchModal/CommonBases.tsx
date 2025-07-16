import { Currency } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { AutoRow } from 'components/Row'
import { COMMON_BASES } from 'constants/routing'
import { useTokenInfoFromActiveList } from 'hooks/useTokenInfoFromActiveList'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { currencyId } from 'utils/currencyId'

import { ZEPHYR_CHAIN_ID } from '../../constants/chains'
import { useZephyrTokens } from '../../hooks/useZephyrTokens'

const BaseWrapper = styled.div<{ disable?: boolean }>`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 18px;
  display: flex;
  padding: 6px;
  padding-top: 5px;
  padding-bottom: 5px;
  padding-right: 12px;
  line-height: 0px;

  align-items: center;
  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme }) => theme.deprecated_hoverDefault};
  }

  color: ${({ theme, disable }) => disable && theme.neutral1};
  background-color: ${({ theme, disable }) => disable && theme.surface3};
`

export default function CommonBases({
  chainId,
  onSelect,
  selectedCurrency,
}: {
  chainId?: number
  selectedCurrency?: Currency | null
  onSelect: (currency: Currency, hasWarning?: boolean) => void
}) {
  const tokens = useZephyrTokens()

  const bases = useMemo(() => {
    if (chainId === ZEPHYR_CHAIN_ID) {
      return Object.values(tokens).slice(0, 3)
    }
    return chainId !== undefined ? COMMON_BASES[chainId] ?? [] : []
  }, [chainId, tokens])

  return bases.length > 0 ? (
    <AutoRow gap="4px">
      {bases.map((currency: Currency) => {
        const isSelected = selectedCurrency?.equals(currency)

        return (
          <BaseWrapper
            tabIndex={0}
            onKeyPress={(e) => !isSelected && e.key === 'Enter' && onSelect(currency, false)}
            onClick={() => !isSelected && onSelect(currency, false)}
            disable={isSelected}
            key={currencyId(currency)}
            data-testid={`common-base-${currency.symbol}`}
          >
            <CurrencyLogoFromList currency={currency} />
            <Text fontWeight={535} fontSize={16} lineHeight="16px">
              {currency.symbol}
            </Text>
          </BaseWrapper>
        )
      })}
    </AutoRow>
  ) : null
}

/** helper component to retrieve a base currency from the active token lists */
function CurrencyLogoFromList({ currency }: { currency: Currency }) {
  const token = useTokenInfoFromActiveList(currency)

  return <CurrencyLogo currency={token} style={{ marginRight: 8 }} />
}
