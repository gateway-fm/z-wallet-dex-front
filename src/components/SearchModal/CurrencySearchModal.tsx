import { Currency } from '@uniswap/sdk-core'
import { memo, useCallback } from 'react'

import { useWindowSize } from '../../hooks/useWindowSize'
import Modal from '../Modal'
import { CurrencySearch } from './CurrencySearch'

interface CurrencySearchModalProps {
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

export default memo(function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  selectedCurrency,
  otherSelectedCurrency,
  showCommonBases = false,
  showCurrencyAmount = true,
  disableNonToken = false,
  onlyShowCurrenciesWithBalance = false,
}: CurrencySearchModalProps) {
  const handleCurrencySelect = useCallback(
    (currency: Currency, _hasWarning?: boolean) => {
      // Always select directly without safety modal
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  const { height: windowHeight } = useWindowSize()
  // change min height if not searching
  let modalHeight: number | undefined = 80
  let content = null

  if (windowHeight) {
    // Converts pixel units to vh for Modal component
    modalHeight = Math.min(Math.round((680 / windowHeight) * 100), 80)
  }

  content = (
    <CurrencySearch
      isOpen={isOpen}
      onDismiss={onDismiss}
      onCurrencySelect={handleCurrencySelect}
      selectedCurrency={selectedCurrency}
      otherSelectedCurrency={otherSelectedCurrency}
      showCommonBases={showCommonBases}
      showCurrencyAmount={showCurrencyAmount}
      disableNonToken={disableNonToken}
      onlyShowCurrenciesWithBalance={onlyShowCurrenciesWithBalance}
    />
  )
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} height={modalHeight}>
      {content}
    </Modal>
  )
})
