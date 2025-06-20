// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { useActiveAccounts } from 'contexts/ActiveAccounts'
import { useApi } from 'contexts/Api'
import { useBondedPools } from 'contexts/Pools/BondedPools'
import type { ValidatorListEntry } from 'contexts/Validators/types'
import { useValidators } from 'contexts/Validators/ValidatorEntries'
import { motion } from 'framer-motion'
import { useNominationStatus } from 'hooks/useNominationStatus'
import { useSyncing } from 'hooks/useSyncing'
import { List, Wrapper as ListWrapper } from 'library/List'
import { MotionContainer } from 'library/List/MotionContainer'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NominationStatus } from 'types'
import { useOverlay } from 'ui-overlay'
import { Item } from './Item'
import type { NominationListProps } from './types'

export const NominationList = ({
  // Default list values.
  nominator: initialNominator,
  validators: initialValidators,
  // Validator list config options.
  bondFor,
  toggleFavorites,
  displayFor = 'default',
}: NominationListProps) => {
  const { t } = useTranslation('app')
  const { syncing } = useSyncing()
  const { isReady, activeEra } = useApi()
  const { activeAddress } = useActiveAccounts()
  const { setModalResize } = useOverlay().modal
  const { injectValidatorListData } = useValidators()
  const { getPoolNominationStatus } = useBondedPools()
  const { getNominationSetStatus } = useNominationStatus()

  // Determine the nominator of the list. Fallback to activeAddress if not provided
  const nominator = initialNominator || activeAddress

  // Store the current nomination status of validator records relative to the supplied nominator
  const nominationStatus = useRef<Record<string, NominationStatus>>({})

  // Get nomination status relative to supplied nominator
  const processNominationStatus = () => {
    if (bondFor === 'pool') {
      nominationStatus.current = initialValidators.reduce(
        (acc: Record<string, NominationStatus>, { address }) => {
          acc[address] = getPoolNominationStatus(nominator, address)
          return acc
        },
        {}
      )
    } else {
      // get all active account's nominations
      const nominationStatuses = getNominationSetStatus(nominator, 'nominator')

      // find the nominator status within the returned nominations
      nominationStatus.current = Object.fromEntries(
        initialValidators.map(({ address }) => [
          address,
          nominationStatuses[address],
        ])
      )
    }
  }

  // Injects status into supplied initial validators
  const prepareInitialValidators = () => {
    processNominationStatus()
    const statusToIndex = {
      active: 2,
      inactive: 1,
      waiting: 0,
    }
    return injectValidatorListData(initialValidators).sort(
      (a, b) =>
        statusToIndex[nominationStatus.current[b.address]] -
        statusToIndex[nominationStatus.current[a.address]]
    )
  }

  // Manipulated list (custom ordering, filtering) of validators
  const [validators, setValidators] = useState<ValidatorListEntry[]>(
    prepareInitialValidators()
  )

  // Store whether the list has been fetched initially
  const [fetched, setFetched] = useState<boolean>(false)

  // If in modal, handle resize
  const maybeHandleModalResize = () => {
    if (displayFor === 'modal') {
      setModalResize()
    }
  }

  // Handle list bootstrapping.
  const setupValidatorList = () => {
    setValidators(prepareInitialValidators())
    setFetched(true)
  }

  // Reset list when list changes
  useEffect(() => {
    setFetched(false)
  }, [initialValidators, nominator])

  // Configure list when network is ready to fetch
  useEffect(() => {
    if (isReady && activeEra.index > 0) {
      setupValidatorList()
    }
  }, [isReady, activeEra.index, syncing, fetched])

  // Handle modal resize on list format change
  useEffect(() => {
    maybeHandleModalResize()
  }, [validators])

  return (
    <ListWrapper>
      <List $flexBasisLarge={'33.33%'}>
        <MotionContainer>
          {validators.length ? (
            <>
              {validators.map((validator, index) => (
                <motion.div
                  key={`nomination_${index}`}
                  className={`item col`}
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
                  <Item
                    validator={validator}
                    nominator={nominator}
                    toggleFavorites={toggleFavorites}
                    bondFor={bondFor}
                    displayFor={displayFor}
                    nominationStatus={
                      nominationStatus.current[validator.address]
                    }
                  />
                </motion.div>
              ))}
            </>
          ) : (
            <h4 style={{ marginTop: '1rem' }}>{t('noValidators')}</h4>
          )}
        </MotionContainer>
      </List>
    </ListWrapper>
  )
}
