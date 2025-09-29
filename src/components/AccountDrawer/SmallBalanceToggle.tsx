import { t } from '@lingui/macro'
import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

const hideSmallBalancesAtom = atomWithStorage<boolean>('hideSmallBalances', true)

export function SmallBalanceToggle() {
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const updateHideSmallBalances = useSetAtom(hideSmallBalancesAtom)

  return (
    <SettingsToggle
      title={t`Hide small balances`}
      isActive={hideSmallBalances}
      toggle={() => void updateHideSmallBalances((value) => !value)}
    />
  )
}
