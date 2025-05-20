// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const poolWithdraw = <T extends StakingChain>(
  api: LegacyClient<T>,
  who: string,
  numSlashingSpans: number
) => asTx(api.tx.nominationPools.withdrawUnbonded(who, numSlashingSpans))
