// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { faCircleDown } from '@fortawesome/free-solid-svg-icons'
import { minDecimalPlaces } from '@w3ux/utils'
import BigNumber from 'bignumber.js'
import { getNetworkData } from 'consts/util'
import { useActiveAccounts } from 'contexts/ActiveAccounts'
import { useApi } from 'contexts/Api'
import { useImportedAccounts } from 'contexts/Connect/ImportedAccounts'
import { useNetwork } from 'contexts/Network'
import { usePayouts } from 'contexts/Payouts'
import { Stat } from 'library/Stat'
import { useTranslation } from 'react-i18next'
import { useOverlay } from 'ui-overlay'
import { planckToUnitBn } from 'utils'

export const UnclaimedPayoutsStatus = ({ dimmed }: { dimmed: boolean }) => {
  const { t } = useTranslation()
  const { network } = useNetwork()
  const { isReady } = useApi()
  const { openModal } = useOverlay().modal
  const { unclaimedPayouts } = usePayouts()
  const { activeAddress } = useActiveAccounts()
  const { isReadOnlyAccount } = useImportedAccounts()
  const { units } = getNetworkData(network)

  const totalUnclaimed = Object.values(unclaimedPayouts || {}).reduce(
    (total, validators) =>
      Object.values(validators)
        .reduce((amount, value) => amount.plus(value), new BigNumber(0))
        .plus(total),
    new BigNumber(0)
  )

  return (
    <Stat
      label={t('pendingPayouts', { ns: 'pages' })}
      helpKey="Payout"
      type="odometer"
      stat={{
        value: minDecimalPlaces(
          planckToUnitBn(totalUnclaimed, units).toFormat(2),
          2
        ),
      }}
      dimmed={dimmed}
      buttons={
        Object.keys(unclaimedPayouts || {}).length > 0 &&
        !totalUnclaimed.isZero()
          ? [
              {
                title: t('claim', { ns: 'modals' }),
                icon: faCircleDown,
                disabled: !isReady || isReadOnlyAccount(activeAddress),
                small: true,
                onClick: () =>
                  openModal({
                    key: 'ClaimPayouts',
                    size: 'sm',
                    options: {
                      disableWindowResize: true,
                      disableScroll: true,
                    },
                  }),
              },
            ]
          : undefined
      }
    />
  )
}
