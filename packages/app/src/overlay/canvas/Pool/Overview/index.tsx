// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { JoinForm } from './JoinForm'

import { useActiveAccounts } from 'contexts/ActiveAccounts'
import { useActivePool } from 'contexts/Pools/ActivePool'
import { usePoolPerformance } from 'contexts/Pools/PoolPerformance'
import { useStaking } from 'contexts/Staking'
import { useEffect } from 'react'
import { GraphContainer, Interface } from 'ui-core/canvas'
import type { OverviewSectionProps } from '../types'
import { Addresses } from './Addresses'
import { Performance } from './Performance'
import { Roles } from './Roles'
import { Stats } from './Stats'

export const Overview = (props: OverviewSectionProps) => {
  const { inSetup } = useStaking()
  const { inPool } = useActivePool()
  const { startPoolRewardPointsFetch } = usePoolPerformance()
  const { activeAddress } = useActiveAccounts()
  const {
    bondedPool: { state, addresses },
    performanceKey,
  } = props
  const showJoinForm =
    activeAddress !== null && state === 'Open' && !inPool() && inSetup()

  // Start pool reward points fetch when performanceKey is "pool_join"
  useEffect(() => {
    if (performanceKey === 'pool_join' && addresses.stash) {
      startPoolRewardPointsFetch(performanceKey, [addresses.stash])
    }
  }, [performanceKey, addresses])

  return (
    <Interface
      Main={
        <>
          <GraphContainer>
            <Stats {...props} />
            <Performance {...props} />
          </GraphContainer>
          <Addresses {...props} />
          <Roles {...props} />
        </>
      }
      Side={
        showJoinForm ? (
          <div>
            <JoinForm {...props} />
          </div>
        ) : undefined
      }
    />
  )
}
