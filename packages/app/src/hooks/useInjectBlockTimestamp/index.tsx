// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { AnyApi } from 'common-types'
import { useApi } from 'contexts/Api'
import { useErasToTimeLeft } from '../useErasToTimeLeft'

export const useInjectBlockTimestamp = () => {
  const { activeEra } = useApi()
  const { erasToSeconds } = useErasToTimeLeft()

  // Inject timestamp for unclaimed payouts. We take the timestamp of the start of the
  // following payout era - this is the time payouts become available to claim by validators
  // NOTE: Not currently being used
  const injectBlockTimestamp = (entries: AnyApi[]) => {
    entries.forEach((p) => {
      const erasToSecs = erasToSeconds(activeEra.index - p.era - 1)
      p.timestamp = Number(activeEra.start / 1000n) - erasToSecs
    })
    return entries
  }
  return {
    injectBlockTimestamp,
  }
}
