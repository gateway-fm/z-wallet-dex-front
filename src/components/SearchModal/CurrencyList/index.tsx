import { Currency } from '@uniswap/sdk-core'
import { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { Check } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { WrappedTokenInfo } from '../../../state/lists/wrappedTokenInfo'
import Column, { AutoColumn } from '../../Column'
import CurrencyLogo from '../../Logo/CurrencyLogo'
import Row, { RowFixed } from '../../Row'
import { MouseoverTooltip } from '../../Tooltip'
import { MenuItem } from '../styled'

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const CheckIcon = styled(Check)`
  height: 20px;
  width: 20px;
  margin-left: 4px;
  color: ${({ theme }) => theme.accent1};
`

const CurrencyName = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 485;
  font-size: 16px;
  color: ${({ theme }) => theme.neutral1};
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  border-radius: 4px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return null
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

export function CurrencyRow({
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
}: {
  currency: Currency
  onSelect: (hasWarning: boolean) => void
  isSelected: boolean
  otherSelected: boolean
  style?: CSSProperties
  showCurrencyAmount?: boolean
}) {
  const key = currencyKey(currency)

  const handleClick = () => {
    return isSelected ? null : onSelect(false)
  }

  return (
    <MenuItem
      tabIndex={0}
      style={style}
      className={`token-item-${key}`}
      onKeyPress={(e) => (!isSelected && e.key === 'Enter' ? onSelect(false) : null)}
      onClick={handleClick}
      disabled={isSelected}
      selected={otherSelected}
    >
      <Column>
        <CurrencyLogo currency={currency} size="36px" />
      </Column>
      <AutoColumn>
        <Row>
          <CurrencyName title={currency.name}>{currency.name}</CurrencyName>
        </Row>
        <ThemedText.LabelMicro ml="0px">{currency.symbol}</ThemedText.LabelMicro>
      </AutoColumn>
      <Column>
        <RowFixed style={{ justifySelf: 'flex-end' }}>
          <TokenTags currency={currency} />
        </RowFixed>
      </Column>
      {showCurrencyAmount ? (
        <RowFixed style={{ justifySelf: 'flex-end' }}>{isSelected && <CheckIcon />}</RowFixed>
      ) : (
        isSelected && (
          <RowFixed style={{ justifySelf: 'flex-end' }}>
            <CheckIcon />
          </RowFixed>
        )
      )}
    </MenuItem>
  )
}

export default function CurrencyList({
  height,
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  showCurrencyAmount,
}: {
  height: number
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<any | undefined>
  showCurrencyAmount?: boolean
}) {
  const itemData: Currency[] = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      return [...currencies, ...otherListTokens]
    }
    return currencies
  }, [currencies, otherListTokens])

  const itemKey = useCallback((index: number, data: typeof itemData) => {
    const currency = data[index]
    return currencyKey(currency)
  }, [])

  return (
    <div data-testid="currency-list-wrapper" style={{ height, overflow: 'auto' }}>
      {itemData.map((currency: Currency, index: number) => {
        const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
        const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
        const handleSelect = (hasWarning: boolean) => {
          return currency && onCurrencySelect(currency, hasWarning)
        }

        return (
          <CurrencyRow
            key={itemKey(index, itemData)}
            currency={currency}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            showCurrencyAmount={showCurrencyAmount}
          />
        )
      })}
    </div>
  )
}
