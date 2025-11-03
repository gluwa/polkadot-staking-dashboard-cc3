// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { PageTabs } from 'library/PageTabs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Page } from 'ui-core/base'
import { Active } from './Active'
import { Wrapper } from './Wrappers'

export const Nominate = () => {
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState<number>(0)

  return (
    <Wrapper>
      <Page.Title title={t('nominate', { ns: 'pages' })}>
        <PageTabs
          tabs={[
            {
              title: t('overview', { ns: 'app' }),
              active: activeTab === 0,
              onClick: () => setActiveTab(0),
            },
          ]}
        />
      </Page.Title>
      {activeTab == 0 && <Active />}
    </Wrapper>
  )
}
