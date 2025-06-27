// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { useSize } from '@w3ux/hooks'
import type { AnyApi, PageProps } from 'common-types'
import { MaxPayoutDays } from 'consts'
import { useHelp } from 'contexts/Help'
import { usePlugins } from 'contexts/Plugins'
import { useStaking } from 'contexts/Staking'
import { useUi } from 'contexts/UI'
import { Subscan } from 'controllers/Subscan'
import { useSubscanData } from 'hooks/useSubscanData'
import { useSyncing } from 'hooks/useSyncing'
import { CardWrapper } from 'library/Card/Wrappers'
import { PayoutBar } from 'library/Graphs/PayoutBar'
import { PayoutLine } from 'library/Graphs/PayoutLine'
import { formatSize } from 'library/Graphs/Utils'
import { GraphWrapper } from 'library/Graphs/Wrapper'
import { PluginLabel } from 'library/PluginLabel'
import { StatusLabel } from 'library/StatusLabel'
import { DefaultLocale, locales } from 'locales'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonHelp } from 'ui-buttons'
import { CardHeader, Page, Stat } from 'ui-core/base'
import { PayoutList } from './PayoutList'
import { LastEraPayout } from './Stats/LastEraPayout'

export const Payouts = ({ page: { key } }: PageProps) => {
  const { i18n, t } = useTranslation()
  const { openHelp } = useHelp()
  const { inSetup } = useStaking()
  const { syncing } = useSyncing()
  const { containerRefs } = useUi()
  const { plugins } = usePlugins()
  const { getData, injectBlockTimestamp } = useSubscanData([
    'payouts',
    'unclaimedPayouts',
    'poolClaims',
  ])
  const notStaking = !syncing && inSetup()
  const [payoutsList, setPayoutLists] = useState<AnyApi>([])

  const ref = useRef<HTMLDivElement>(null)
  const size = useSize(ref, {
    outerElement: containerRefs?.mainInterface,
  })
  const { width, height, minHeight } = formatSize(size, 280)

  // Get data safely from subscan hook.
  const data = getData(['payouts', 'unclaimedPayouts', 'poolClaims'])

  // Inject `block_timestamp` for unclaimed payouts.
  data['unclaimedPayouts'] = injectBlockTimestamp(data?.unclaimedPayouts || [])

  const payoutsFromDate = Subscan.payoutsFromDate(
    (data?.payouts || []).concat(data?.poolClaims || []),
    locales[i18n.resolvedLanguage ?? DefaultLocale].dateFormat
  )

  const payoutsToDate = Subscan.payoutsToDate(
    (data?.payouts || []).concat(data?.poolClaims || []),
    locales[i18n.resolvedLanguage ?? DefaultLocale].dateFormat
  )

  useEffect(() => {
    // filter zero rewards and order via block timestamp, most recent first.
    setPayoutLists(
      Subscan.removeNonZeroAmountAndSort(
        (data?.payouts || []).concat(data?.poolClaims || [])
      )
    )
  }, [
    JSON.stringify(data?.payouts || {}),
    JSON.stringify(data?.poolClaims || {}),
  ])

  return (
    <>
      <Page.Title title={t(key, { ns: 'app' })} />
      <Stat.Row>
        <LastEraPayout />
      </Stat.Row>
      <Page.Row>
        <CardWrapper>
          <PluginLabel plugin="subscan" />
          <CardHeader>
            <h4>
              {t('payoutHistory', { ns: 'pages' })}
              <ButtonHelp
                marginLeft
                onClick={() => openHelp('Payout History')}
              />
            </h4>
            <h2>
              {payoutsFromDate && payoutsToDate ? (
                <>
                  {payoutsFromDate}
                  {payoutsToDate !== payoutsFromDate && (
                    <>&nbsp;-&nbsp;{payoutsToDate}</>
                  )}
                </>
              ) : (
                t('none', { ns: 'pages' })
              )}
            </h2>
          </CardHeader>
          <div ref={ref} className="inner" style={{ minHeight }}>
            {!plugins.includes('subscan') ? (
              <StatusLabel
                status="subscan"
                title={t('subscanDisabled', { ns: 'pages' })}
                topOffset="30%"
              />
            ) : (
              <GraphWrapper
                style={{
                  height: `${height}px`,
                  width: `${width}px`,
                  position: 'absolute',
                  opacity: notStaking ? 0.75 : 1,
                  transition: 'opacity 0.5s',
                }}
              >
                <PayoutBar
                  days={MaxPayoutDays}
                  height="165px"
                  data={data}
                  syncing={syncing}
                />
                <PayoutLine
                  days={MaxPayoutDays}
                  average={10}
                  height="65px"
                  data={data}
                />
              </GraphWrapper>
            )}
          </div>
        </CardWrapper>
      </Page.Row>
      {!!payoutsList?.length && (
        <Page.Row>
          <CardWrapper>
            <PayoutList
              title={t('recentPayouts', { ns: 'pages' })}
              payouts={payoutsList}
              pagination
            />
          </CardWrapper>
        </Page.Row>
      )}
    </>
  )
}
