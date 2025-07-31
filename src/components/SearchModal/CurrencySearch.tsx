// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'

import { ZEPHYR_CHAIN_ID } from '../../constants/chains'
import { useIsUserAddedToken, useSearchInactiveTokenLists, useToken } from '../../hooks/Tokens'
import { useZephyrTokens, useZephyrTokenSearch } from '../../hooks/useZephyrTokens'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import { CurrencyRow } from './CurrencyList'
import CurrencyList from './CurrencyList'
import { PaddedColumn, SearchInput, Separator } from './styled'

const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  overflow: hidden;
  flex: 1 1;
  position: relative;
  border-radius: 20px;
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  onlyShowCurrenciesWithBalance?: boolean
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  onDismiss,
  isOpen,
  onlyShowCurrenciesWithBalance,
}: CurrencySearchProps) {
  const { chainId } = useWeb3React()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isAddressSearch = isAddress(debouncedQuery)
  const searchToken = useToken(debouncedQuery)
  const searchTokenIsAdded = useIsUserAddedToken(searchToken)

  const defaultTokens = useZephyrTokens()
  const { tokens: searchTokens } = useZephyrTokenSearch(debouncedQuery, chainId)

  const filteredTokens: Token[] = useMemo(() => {
    const tokensToUse = debouncedQuery && chainId === ZEPHYR_CHAIN_ID ? searchTokens : defaultTokens
    return Object.values(tokensToUse).filter(getTokenFilter(debouncedQuery))
  }, [defaultTokens, searchTokens, debouncedQuery, chainId])

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, filteredTokens)

  const native = useNativeCurrency(chainId)
  const wrapped = native.wrapped

  const searchCurrencies: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim()

    const tokens = filteredSortedTokens.filter((t) => !(t.equals(wrapped) || (disableNonToken && t.isNative)))

    // For Zephyr network, use only GraphQL tokens (no native tokens)
    if (chainId === ZEPHYR_CHAIN_ID) {
      return tokens
    }

    const shouldShowWrapped = !onlyShowCurrenciesWithBalance
    const natives = (
      disableNonToken || native.equals(wrapped) ? [wrapped] : shouldShowWrapped ? [native, wrapped] : [native]
    ).filter((n) => n.symbol?.toLowerCase()?.indexOf(s) !== -1 || n.name?.toLowerCase()?.indexOf(s) !== -1)

    return [...natives, ...tokens]
  }, [debouncedQuery, filteredSortedTokens, onlyShowCurrenciesWithBalance, wrapped, disableNonToken, native, chainId])

  const handleCurrencySelect = useCallback(
    (currency: Currency, hasWarning?: boolean) => {
      onCurrencySelect(currency, hasWarning)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = debouncedQuery.toLowerCase().trim()
        if (s === native?.symbol?.toLowerCase()) {
          handleCurrencySelect(native)
        } else if (searchCurrencies.length > 0) {
          if (
            searchCurrencies[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
            searchCurrencies.length === 1
          ) {
            handleCurrencySelect(searchCurrencies[0])
          }
        }
      }
    },
    [debouncedQuery, native, searchCurrencies, handleCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    !onlyShowCurrenciesWithBalance && (filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch))
      ? debouncedQuery
      : undefined
  )

  return (
    <ContentWrapper>
      <PaddedColumn gap="16px">
        <RowBetween>
          {(Text as any)({ fontWeight: 535, fontSize: 16, children: <Trans>Select a token</Trans> })}
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <Row>
          <SearchInput
            type="text"
            id="token-search-input"
            data-testid="token-search-input"
            placeholder={t`Search name or paste address`}
            autoComplete="off"
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
        </Row>
        {showCommonBases && (
          <CommonBases chainId={chainId} onSelect={handleCurrencySelect} selectedCurrency={selectedCurrency} />
        )}
      </PaddedColumn>
      <Separator />
      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <CurrencyRow
            currency={searchToken}
            isSelected={Boolean(searchToken && selectedCurrency && selectedCurrency.equals(searchToken))}
            onSelect={(hasWarning: boolean) => searchToken && handleCurrencySelect(searchToken, hasWarning)}
            otherSelected={Boolean(searchToken && otherSelectedCurrency && otherSelectedCurrency.equals(searchToken))}
            showCurrencyAmount={showCurrencyAmount}
          />
        </Column>
      ) : searchCurrencies?.length > 0 || filteredInactiveTokens?.length > 0 ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <CurrencyList
                height={height}
                currencies={searchCurrencies}
                otherListTokens={filteredInactiveTokens}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showCurrencyAmount={showCurrencyAmount}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <ThemedText.DeprecatedMain color={theme.neutral3} textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </ThemedText.DeprecatedMain>
        </Column>
      )}
    </ContentWrapper>
  )
}
