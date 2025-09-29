import { t } from '@lingui/macro'
import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

// eslint-disable-next-line import/no-unused-modules
export const showTestnetsAtom = atomWithStorage<boolean>('showTestnets', false)

export function TestnetsToggle() {
  const showTestnets = useAtomValue(showTestnetsAtom)
  const updateShowTestnets = useSetAtom(showTestnetsAtom)

  return (
    <SettingsToggle
      title={t`Show testnets`}
      dataid="testnets-toggle"
      isActive={showTestnets}
      toggle={() => void updateShowTestnets((value) => !value)}
    />
  )
}
