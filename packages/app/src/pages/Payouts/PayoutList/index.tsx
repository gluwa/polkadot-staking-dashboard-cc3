// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { faBars, faGripVertical } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ellipsisFn, planckToUnit } from '@w3ux/utils'
import type { AnyApi } from 'common-types'
import { ListItemsPerBatch, ListItemsPerPage } from 'consts'
import { getNetworkData } from 'consts/util'
import { useApi } from 'contexts/Api'
import { useNetwork } from 'contexts/Network'
import { useBondedPools } from 'contexts/Pools/BondedPools'
import { StakingContext } from 'contexts/Staking'
import { useThemeValues } from 'contexts/ThemeValues'
import { useValidators } from 'contexts/Validators/ValidatorEntries'
import { formatDistance, fromUnixTime } from 'date-fns'
import { motion } from 'framer-motion'
import { Header, List, Wrapper as ListWrapper } from 'library/List'
import { MotionContainer } from 'library/List/MotionContainer'
import { Pagination } from 'library/List/Pagination'
import { Identity } from 'library/ListItem/Labels/Identity'
import { PoolIdentity } from 'library/ListItem/Labels/PoolIdentity'
import { DefaultLocale, locales } from 'locales'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ItemWrapper } from '../Wrappers'
import type { PayoutListProps } from '../types'
import { PayoutListProvider, usePayoutList } from './context'

export const PayoutListInner = ({
  allowMoreCols,
  pagination,
  title,
  payouts: initialPayouts,
  disableThrottle = false,
}: PayoutListProps) => {
  const { i18n, t } = useTranslation('app')
  const { network } = useNetwork()
  const { unit, units } = getNetworkData(network)
  const { isReady, activeEra } = useApi()
  const { listFormat, setListFormat } = usePayoutList()
  const { getValidators } = useValidators()
  const { bondedPools } = useBondedPools()
  const { getThemeValue } = useThemeValues()

  // current page
  const [page, setPage] = useState<number>(1)

  // current render iteration
  const [renderIteration, _setRenderIteration] = useState<number>(1)

  // manipulated list (ordering, filtering) of payouts
  const [payouts, setPayouts] = useState(initialPayouts)

  // is this the initial fetch
  const [fetched, setFetched] = useState<boolean>(false)

  // render throttle iteration
  const renderIterationRef = useRef(renderIteration)
  const setRenderIteration = (iter: number) => {
    renderIterationRef.current = iter
    _setRenderIteration(iter)
  }

  // pagination
  const totalPages = Math.ceil(payouts.length / ListItemsPerPage)
  const pageEnd = page * ListItemsPerPage - 1
  const pageStart = pageEnd - (ListItemsPerPage - 1)

  // render batch
  const batchEnd = Math.min(
    renderIteration * ListItemsPerBatch - 1,
    ListItemsPerPage
  )

  // refetch list when list changes
  useEffect(() => {
    setFetched(false)
  }, [initialPayouts])

  // configure list when network is ready to fetch
  useEffect(() => {
    if (isReady && activeEra && !fetched) {
      setPayouts(initialPayouts)
      setFetched(true)
    }
  }, [isReady, fetched, activeEra.index])

  // render throttle
  useEffect(() => {
    if (!(batchEnd >= pageEnd || disableThrottle)) {
      setTimeout(() => {
        setRenderIteration(renderIterationRef.current + 1)
      }, 500)
    }
  }, [renderIterationRef.current])

  // get list items to render
  let listPayouts = []

  // get throttled subset or entire list
  if (!disableThrottle) {
    listPayouts = payouts.slice(pageStart).slice(0, ListItemsPerPage)
  } else {
    listPayouts = payouts
  }

  if (!payouts.length) {
    return <div />
  }

  return (
    <ListWrapper>
      <Header>
        <div>
          <h4>{title}</h4>
        </div>
        <div>
          <button type="button" onClick={() => setListFormat('row')}>
            <FontAwesomeIcon
              icon={faBars}
              color={
                listFormat === 'row'
                  ? getThemeValue('--accent-color-primary')
                  : 'inherit'
              }
            />
          </button>
          <button type="button" onClick={() => setListFormat('col')}>
            <FontAwesomeIcon
              icon={faGripVertical}
              color={
                listFormat === 'col'
                  ? getThemeValue('--accent-color-primary')
                  : 'inherit'
              }
            />
          </button>
        </div>
      </Header>
      <List $flexBasisLarge={allowMoreCols ? '33.33%' : '50%'}>
        {pagination && (
          <Pagination page={page} total={totalPages} setter={setPage} />
        )}
        <MotionContainer>
          {listPayouts.map((p: AnyApi, index: number) => {
            const label =
              p.event_id === 'PaidOut'
                ? t('poolClaim')
                : p.event_id === 'Rewarded'
                  ? t('payout')
                  : p.event_id

            const labelClass =
              p.event_id === 'PaidOut'
                ? 'claim'
                : p.event_id === 'Rewarded'
                  ? 'reward'
                  : undefined

            // get validator if it exists
            const validator = getValidators().find(
              (v) => v.address === p.validator_stash
            )

            // get pool if it exists
            const pool = bondedPools.find(({ id }) => id === p.pool_id)

            const batchIndex = validator
              ? getValidators().indexOf(validator)
              : pool
                ? bondedPools.indexOf(pool)
                : 0

            return (
              <motion.div
                className={`item ${listFormat === 'row' ? 'row' : 'col'}`}
                key={`nomination_${index}`}
                variants={{
                  hidden: {
                    y: 15,
                    opacity: 0,
                  },
                  show: {
                    y: 0,
                    opacity: 1,
                  },
                }}
              >
                <ItemWrapper>
                  <div className="inner">
                    <div className="row">
                      <div>
                        <div>
                          <h4 className={labelClass}>
                            <>
                              {p.event_id === 'Slashed' ? '-' : '+'}
                              {planckToUnit(p.amount, units)} {unit}
                            </>
                          </h4>
                        </div>
                        <div>
                          <h5 className={labelClass}>{label}</h5>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div>
                        <div>
                          {label === t('payout') && (
                            <div>
                              {batchIndex > 0 ? (
                                <Identity address={p.validator_stash} />
                              ) : (
                                <div>
                                  {ellipsisFn(p.validator_stash)}
                                  {p.validator_stash}
                                </div>
                              )}
                            </div>
                          )}
                          {label === t('poolClaim') && (
                            <div>
                              {pool ? (
                                <PoolIdentity pool={pool} />
                              ) : (
                                <h4>
                                  {t('fromPool')} {p.pool_id}
                                </h4>
                              )}
                            </div>
                          )}
                          {label === t('slashed') && (
                            <h4>{t('deductedFromBond')}</h4>
                          )}
                        </div>
                        <div>
                          <h5>
                            {formatDistance(
                              fromUnixTime(p.block_timestamp),
                              new Date(),
                              {
                                addSuffix: true,
                                locale:
                                  locales[
                                    i18n.resolvedLanguage ?? DefaultLocale
                                  ].dateFormat,
                              }
                            )}
                          </h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </ItemWrapper>
              </motion.div>
            )
          })}
        </MotionContainer>
      </List>
    </ListWrapper>
  )
}

export const PayoutList = (props: PayoutListProps) => (
  <PayoutListProvider>
    <PayoutListShouldUpdate {...props} />
  </PayoutListProvider>
)

export class PayoutListShouldUpdate extends React.Component {
  static contextType = StakingContext

  render() {
    return <PayoutListInner {...this.props} />
  }
}
