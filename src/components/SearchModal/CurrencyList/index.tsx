import { Currency } from '@uniswap/sdk-core'
import { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { Check } from 'react-feather'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { WrappedTokenInfo } from '../../../state/lists/wrappedTokenInfo'
import Column, { AutoColumn } from '../../Column'
import CurrencyLogo from '../../Logo/CurrencyLogo'
import Row, { RowFixed } from '../../Row'
import { MouseoverTooltip } from '../../Tooltip'
import { MenuItem } from '../styled'
import { scrollbarStyle } from './index.css'

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const CheckIcon = styled(Check)`
  height: 20px;
  width: 20px;
  margin-left: 4px;
  color: ${({ theme }) => theme.accent1};
`

const CurrencyName = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      tabIndex={0}
      style={style}
      className={`token-item-${key}`}
      onKeyPress={(e) => (!isSelected && e.key === 'Enter' ? onSelect(false) : null)}
      onClick={() => (isSelected ? null : onSelect(false))}
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

interface TokenRowProps {
  data: Array<Currency>
  index: number
  style: CSSProperties
}

export default function CurrencyList({
  height,
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showCurrencyAmount,
}: {
  height: number
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showCurrencyAmount?: boolean
}) {
  const itemData: Currency[] = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      return [...currencies, ...otherListTokens]
    }
    return currencies
  }, [currencies, otherListTokens])

  const Row = useCallback(
    function TokenRow({ data, index, style }: TokenRowProps) {
      const row: Currency = data[index]

      const currency = row

      const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
      const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
      const handleSelect = (hasWarning: boolean) => currency && onCurrencySelect(currency, hasWarning)

      if (currency) {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            showCurrencyAmount={showCurrencyAmount}
          />
        )
      } else {
        return null
      }
    },
    [selectedCurrency, otherCurrency, onCurrencySelect, showCurrencyAmount]
  )

  const itemKey = useCallback((index: number, data: typeof itemData) => {
    const currency = data[index]
    return currencyKey(currency)
  }, [])

  return (
    <div data-testid="currency-list-wrapper">
      <FixedSizeList
        className={scrollbarStyle}
        height={height}
        ref={fixedListRef as any}
        width="100%"
        itemData={itemData}
        itemCount={itemData.length}
        itemSize={56}
        itemKey={itemKey}
      >
        {Row}
      </FixedSizeList>
    </div>
  )
}
