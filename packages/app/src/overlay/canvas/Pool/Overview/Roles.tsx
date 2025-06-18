// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { useHelp } from 'contexts/Help'
import { CardWrapper } from 'library/Card/Wrappers'
import { CopyAddress } from 'library/ListItem/Buttons/CopyAddress'
import { useTranslation } from 'react-i18next'
import { ButtonHelp } from 'ui-buttons'
import { Subheading } from 'ui-core/canvas'
import { Identity } from 'ui-identity'
import type { OverviewSectionProps } from '../types'
import { AddressesWrapper } from '../Wrappers'

export const Roles = ({ bondedPool }: OverviewSectionProps) => {
  const { t } = useTranslation('pages')
  const { openHelp } = useHelp()
  const iconSize = '3rem'

  const rootAddress = bondedPool?.roles?.root || ''
  const nominatorAddress = bondedPool?.roles?.nominator || ''
  const bouncerAddress = bondedPool?.roles?.bouncer || ''
  const depositorAddress = bondedPool?.roles?.depositor || ''

  return (
    <div>
      <CardWrapper className="canvas secondary">
        <Subheading>
          <h3>
            {t('roles')}
            <ButtonHelp marginLeft onClick={() => openHelp('Pool Roles')} />
          </h3>
        </Subheading>
        <AddressesWrapper>
          {bondedPool.roles.root && (
            <section>
              <Identity
                title={t('root')}
                address={rootAddress}
                Action={<CopyAddress address={rootAddress} />}
                iconSize={iconSize}
              />
            </section>
          )}
          {bondedPool.roles.nominator && (
            <section>
              <Identity
                title={t('nominator')}
                address={nominatorAddress}
                Action={<CopyAddress address={nominatorAddress} />}
                iconSize={iconSize}
              />
            </section>
          )}
          {bondedPool.roles.bouncer && (
            <section>
              <Identity
                title={t('bouncer')}
                address={bouncerAddress}
                Action={<CopyAddress address={bouncerAddress} />}
                iconSize={iconSize}
              />
            </section>
          )}
          {bondedPool.roles.depositor && (
            <section>
              <Identity
                title={t('depositor')}
                address={depositorAddress}
                Action={<CopyAddress address={depositorAddress} />}
                iconSize={iconSize}
              />
            </section>
          )}
        </AddressesWrapper>
      </CardWrapper>
    </div>
  )
}
